import { describe, expect, it } from "vitest";
import { B3Client, MemoryTokenStore } from "@b3-investidor/core";
import { buildServer, LoginManager, type LoginFn } from "../src/index";

// Dados sintéticos: nenhuma chamada real à B3.
const KEY = "k".repeat(32);
const H = { "x-api-key": KEY };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

function fake() {
  return (async (input: string | URL) => {
    const u = new URL(String(input));
    if (u.pathname.endsWith("/token")) return json({ access_token: "AT", refresh_token: "RT2", expires_in: 3600, refresh_token_expires_in: 86400 });
    if (u.pathname.endsWith("/ultima-execucao")) return json({ dataGeral: "2026-11-11T00:00:00" });
    if (u.pathname.endsWith("/v2/posicao")) return json({ paginaAtual: 1, totalPaginas: 1, itens: [] });
    return new Response("", { status: 404 });
  }) as typeof fetch;
}

function setup(opts: { cred?: boolean; pedeCodigo?: boolean } = {}) {
  const client = new B3Client({ store: new MemoryTokenStore(null), fetch: fake() });
  const recebidos: string[] = [];
  const alertas: string[] = [];
  const loginFn: LoginFn = async ({ askCode }) => {
    if (opts.pedeCodigo !== false) recebidos.push(await askCode("A B3 enviou um código"));
    return { refresh_token: "RT-novo" };
  };
  const lm = new LoginManager({
    client,
    credentials: () => (opts.cred === false ? {} : { cpf: "00000000000", senha: "x" }),
    loginFn,
    alert: (tipo) => void alertas.push(tipo),
  });
  return { client, lm, recebidos, alertas, app: buildServer({ client, apiKey: KEY, loginManager: lm, loginWaitMs: 200 }) };
}

describe("login automático", () => {
  it("sessão ausente → entra sozinho, para no código (503), recebe o código e responde", async () => {
    const s = setup();
    const a = await s.app;

    const r1 = await a.inject({ url: "/v1/posicao", headers: H });
    expect(r1.statusCode).toBe(503);
    expect(r1.json().precisaCodigo).toBe(true);
    expect(r1.headers["retry-after"]).toBe("30");
    expect(s.alertas).toContain("codigo-necessario");

    const st = await a.inject({ url: "/v1/login", headers: H });
    expect(st.json().fase).toBe("aguardando_codigo");

    const r2 = await a.inject({ method: "POST", url: "/v1/login/codigo", headers: H, payload: { codigo: "123456" } });
    expect(r2.statusCode).toBe(200);
    expect(r2.json().fase).toBe("concluido");
    expect(r2.body).not.toContain("123456");
    expect(s.recebidos).toEqual(["123456"]);

    const r3 = await a.inject({ url: "/v1/posicao", headers: H });
    expect(r3.statusCode).toBe(200);
  });

  it("sem código pedido → login e resposta na mesma requisição", async () => {
    const s = setup({ pedeCodigo: false });
    const r = await (await s.app).inject({ url: "/v1/posicao", headers: H });
    expect(r.statusCode).toBe(200);
  });

  it("código só é aceito quando há login esperando; formato validado", async () => {
    const s = setup();
    const a = await s.app;
    expect((await a.inject({ method: "POST", url: "/v1/login/codigo", headers: H, payload: { codigo: "123456" } })).statusCode).toBe(409);
    expect((await a.inject({ method: "POST", url: "/v1/login/codigo", headers: H, payload: { codigo: "abc" } })).statusCode).toBe(400);
  });

  it("sem credenciais → continua 401 pedindo login, e POST /v1/login responde 409", async () => {
    const s = setup({ cred: false });
    const a = await s.app;
    const r = await a.inject({ url: "/v1/posicao", headers: H });
    expect(r.statusCode).toBe(401);
    expect(r.json().precisaLogin).toBe(true);
    expect((await a.inject({ method: "POST", url: "/v1/login", headers: H })).statusCode).toBe(409);
  });

  it("health mostra o login sem expor credenciais", async () => {
    const s = setup();
    const r = await (await s.app).inject({ url: "/v1/health", headers: H });
    expect(r.json().login.automatico).toBe(true);
    expect(r.body).not.toContain("00000000000");
  });
});
