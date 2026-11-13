import { describe, expect, it } from "vitest";
import { B3Client, MemoryTokenStore } from "@b3-investidor/core";
import { buildServer } from "../src/index";

// Dados sintéticos.
const KEY = "k".repeat(32);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

function fake() {
  return (async (input: string | URL) => {
    const u = new URL(String(input));
    if (u.pathname.endsWith("/token")) return json({ access_token: "AT", refresh_token: "RT2", expires_in: 3600, refresh_token_expires_in: 86400 });
    if (u.pathname.endsWith("/ultima-execucao")) return json({ dataGeral: "2026-11-11T00:00:00" });
    if (u.pathname.endsWith("/v2/posicao"))
      return u.searchParams.get("data")! > "2026-11-11"
        ? json("A data informada é maior que a data de carga do sistema!", 400)
        : json({ paginaAtual: 1, totalPaginas: 1, itens: [{ categoriaProduto: "X", posicoes: [], campoNovo: true }] });
    return new Response("", { status: 404 });
  }) as typeof fetch;
}

async function app(session = true) {
  const client = new B3Client({ store: new MemoryTokenStore(session ? { refresh_token: "RT1" } : null), fetch: fake() });
  return buildServer({ client, apiKey: KEY });
}

describe("servidor", () => {
  it("recusa sem x-api-key, mas serve a documentação", async () => {
    const a = await app();
    expect((await a.inject("/v1/posicao")).statusCode).toBe(401);
    expect((await a.inject("/openapi.json")).statusCode).toBe(200);
  });

  it("OpenAPI lista todas as rotas do registro", async () => {
    const a = await app();
    const spec = (await a.inject("/openapi.json")).json();
    expect(Object.keys(spec.paths)).toContain("/v1/posicao");
    expect(spec.paths["/v1/posicao"].get.parameters.map((p: { name: string }) => p.name)).toEqual(expect.arrayContaining(["data", "pagina", "todasPaginas"]));
    expect(spec.components.securitySchemes.apiKey.name).toBe("x-api-key");
  });

  it("posição: repassa campos novos e informa ajuste de data", async () => {
    const a = await app();
    const r = await a.inject({ url: "/v1/posicao?data=2027-01-01", headers: { "x-api-key": KEY } });
    expect(r.statusCode).toBe(200);
    expect(r.json().itens[0].campoNovo).toBe(true);
    expect(JSON.parse(r.headers["x-b3-ajustes"] as string)[0].usado).toBe("2026-11-11");
  });

  it("parâmetro inválido → 400 com detalhes", async () => {
    const a = await app();
    const r = await a.inject({ url: "/v1/posicao?data=11/11/2026", headers: { "x-api-key": KEY } });
    expect(r.statusCode).toBe(400);
    expect(r.json().detalhes[0].campo).toBe("data");
  });

  it("sem sessão → 401 pedindo login", async () => {
    const a = await app(false);
    const r = await a.inject({ url: "/v1/posicao", headers: { "x-api-key": KEY } });
    expect(r.statusCode).toBe(401);
    expect(r.json().precisaLogin).toBe(true);
  });

  it("POST /v1/session valida e nunca devolve o token", async () => {
    const a = await app(false);
    const r = await a.inject({ method: "POST", url: "/v1/session", headers: { "x-api-key": KEY }, payload: { refresh_token: "um-refresh-token-qualquer" } });
    expect(r.statusCode).toBe(200);
    expect(r.body).not.toContain("refresh-token-qualquer");
    expect(r.body).not.toContain("RT2");
  });

  it("recusa API key curta", async () => {
    const client = new B3Client({ store: new MemoryTokenStore(), fetch: fake() });
    await expect(buildServer({ client, apiKey: "curta" })).rejects.toThrow(/B3_API_KEY/);
  });
});
