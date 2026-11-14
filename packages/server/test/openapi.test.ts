import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import { B3Client, MemoryTokenStore, endpointList } from "@b3-investidor/core";
import { buildServer } from "../src/index";
import { TAGS } from "../src/openapi";

// Dados sintéticos.
const KEY = "k".repeat(32);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

const fakeFetch = (async (input: string | URL) => {
  const u = new URL(String(input));
  if (u.pathname.endsWith("/token")) return json({ access_token: "AT", refresh_token: "RT2", expires_in: 3600, refresh_token_expires_in: 86400 });
  if (u.pathname.endsWith("/analise-tecnica")) return json({ data: [{ analiseTecnica: "Neutro", tendenciaPreco: [], momentosMercado: [] }] }, 206);
  if (u.pathname.endsWith("/lista-ativos")) return new Response(null, { status: 204 });
  if (u.pathname.endsWith("/realizar-calculo-pu")) return json("Data de cálculo inválida.", 400);
  if (u.pathname.endsWith("/ultima-execucao")) return json({ dataGeral: "2026-11-11T00:00:00" });
  return new Response("", { status: 404 });
}) as typeof fetch;

const montar = () => buildServer({ client: new B3Client({ store: new MemoryTokenStore({ refresh_token: "RT1" }), fetch: fakeFetch }), apiKey: KEY });
const get = (a: Awaited<ReturnType<typeof montar>>, url: string) => a.inject({ url, headers: { "x-api-key": KEY } });

type Op = { operationId?: string; summary?: string; tags?: string[]; responses: Record<string, unknown>; parameters?: { name: string; description?: string }[] };

describe("OpenAPI", () => {
  it("é um documento OpenAPI 3 válido", async () => {
    const a = await montar();
    const spec = (await a.inject("/openapi.json")).json();
    await expect(SwaggerParser.validate(structuredClone(spec))).resolves.toBeTruthy();
  });

  it("toda operação tem id único, resumo e tag declarada", async () => {
    const a = await montar();
    const spec = (await a.inject("/openapi.json")).json() as { paths: Record<string, Record<string, Op>> };
    const nomesTags = new Set(TAGS.map((t) => t.name));
    const ids = new Set<string>();
    for (const [caminho, metodos] of Object.entries(spec.paths)) {
      for (const [metodo, op] of Object.entries(metodos)) {
        const onde = `${metodo.toUpperCase()} ${caminho}`;
        expect(op.operationId, onde).toBeTruthy();
        expect(ids.has(op.operationId!), `${onde}: operationId repetido`).toBe(false);
        ids.add(op.operationId!);
        expect(op.summary, onde).toBeTruthy();
        expect(op.tags?.length, onde).toBeGreaterThan(0);
        for (const t of op.tags ?? []) expect(nomesTags.has(t), `${onde}: tag "${t}" sem descrição`).toBe(true);
      }
    }
  });

  it("toda tag descrita é usada por alguma operação", async () => {
    const a = await montar();
    const spec = (await a.inject("/openapi.json")).json() as { paths: Record<string, Record<string, Op>> };
    const usadas = new Set(Object.values(spec.paths).flatMap((m) => Object.values(m).flatMap((o) => o.tags ?? [])));
    for (const t of TAGS) expect(usadas.has(t.name), `tag "${t.name}" sem rotas`).toBe(true);
  });

  it("rotas da B3: parâmetros descritos, erros documentados e 400 só quando há parâmetros", async () => {
    const a = await montar();
    const spec = (await a.inject("/openapi.json")).json() as { paths: Record<string, { get: Op }> };
    for (const ep of endpointList) {
      const op = spec.paths[ep.route]?.get;
      expect(op, ep.route).toBeTruthy();
      for (const c of ["200", "204", "401", "4XX", "502", "503"]) expect(op!.responses[c], `${ep.route} sem resposta ${c}`).toBeTruthy();
      const temParametros = Object.keys(ep.query.shape).length > 0;
      expect("400" in op!.responses, `${ep.route}: 400 ${temParametros ? "falta" : "sobra"}`).toBe(temParametros);
      for (const p of op!.parameters ?? []) expect(p.description, `${ep.route}: parâmetro ${p.name} sem descrição`).toBeTruthy();
    }
  });

  it("rotas de sessão documentam as respostas", async () => {
    const a = await montar();
    const spec = (await a.inject("/openapi.json")).json() as { paths: Record<string, Record<string, Op>> };
    expect(Object.keys(spec.paths["/v1/login/codigo"]!.post!.responses)).toEqual(expect.arrayContaining(["200", "202", "400", "409", "422"]));
    expect(Object.keys(spec.paths["/v1/health"]!.get!.responses)).toContain("200");
  });
});

describe("rotas novas pelo servidor", () => {
  it("devolve 200 e o status original da B3 em x-b3-status", async () => {
    const a = await montar();
    const r = await get(a, "/v1/mercado/bridgewise/analise-tecnica?id=AAAA3");
    expect(r.statusCode).toBe(200);
    expect(r.headers["x-b3-status"]).toBe("206");
    expect(r.json().data[0].analiseTecnica).toBe("Neutro");
  });

  it("repassa 204 sem corpo", async () => {
    const a = await montar();
    const r = await get(a, "/v1/mercado/bridgewise/lista-ativos");
    expect(r.statusCode).toBe(204);
    expect(r.headers["x-b3-status"]).toBe("204");
  });

  it("400 com o nome do parâmetro quando falta `id` ou o período é inválido", async () => {
    const a = await montar();
    const sem = await get(a, "/v1/mercado/bridgewise/cotacao");
    expect(sem.statusCode).toBe(400);
    expect(sem.json().detalhes[0].campo).toBe("id");
    const ruim = await get(a, "/v1/mercado/bridgewise/cotacao?id=AAAA3&periodoCotacao=XX");
    expect(ruim.statusCode).toBe(400);
    expect(ruim.json().detalhes[0].campo).toBe("periodoCotacao");
  });

  it("erro da B3 aparece com status repassado e tipo", async () => {
    const a = await montar();
    const r = await get(a, "/v1/renda-fixa/calculo-pu?codigo=AAAA11");
    expect(r.statusCode).toBe(400);
    expect(r.json().tipo).toBe("regra");
  });
});
