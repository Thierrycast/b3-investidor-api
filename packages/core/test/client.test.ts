import { describe, expect, it } from "vitest";
import { B3ApiError, B3AuthError, B3Client, MemoryTokenStore, camposNaoDescritos, endpoints, shape } from "../src/index";

// Todos os dados aqui são sintéticos.

type Handler = (url: URL, init: RequestInit) => Response | Promise<Response>;
const json = (body: unknown, status = 200, type = "application/json; charset=utf-8") =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": type } });

function fakeFetch(routes: Record<string, Handler>) {
  const calls: { url: URL; init: RequestInit }[] = [];
  const f = (async (input: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    const key = Object.keys(routes).find((k) => url.pathname.endsWith(k));
    if (!key) return new Response("not found", { status: 404 });
    return routes[key]!(url, init);
  }) as typeof fetch;
  return { f, calls };
}

let rt = 0;
const tokenOk: Handler = () => json({ access_token: "AT", refresh_token: `RT${++rt}`, expires_in: 3600, refresh_token_expires_in: 86400 });
const carga: Handler = () => json({ dataGeral: "2026-11-11T00:00:00" });

describe("autenticação", () => {
  it("renova e grava o refresh_token girado", async () => {
    const store = new MemoryTokenStore({ refresh_token: "RT0" });
    const { f, calls } = fakeFetch({ "/oauth2/v2.0/token": tokenOk });
    const c = new B3Client({ store, fetch: f });
    const r = await c.refresh();
    expect(r.refreshExpiresAt).toBeTruthy();
    const saved = await store.load();
    expect(saved?.refresh_token).toMatch(/^RT\d+$/);
    expect(saved?.refresh_token).not.toBe("RT0");
    const body = new URLSearchParams(String(calls[0]!.init.body));
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("scope")).toContain("offline_access");
    expect(calls[0]!.url.searchParams.get("p")).toBe("B2C_1A_SIGN_IN");
  });

  it("sem sessão pede login", async () => {
    const c = new B3Client({ store: new MemoryTokenStore(), fetch: fakeFetch({}).f });
    await expect(c.refresh()).rejects.toMatchObject({ code: "no_session", needsLogin: true });
  });

  it("invalid_grant vira B3AuthError com needsLogin", async () => {
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": () => json({ error: "invalid_grant", error_description: "AADB2C90080: The provided grant has expired.\nCorrelation ID: x" }, 400),
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    const e = await c.refresh().catch((x) => x);
    expect(e).toBeInstanceOf(B3AuthError);
    expect(e.code).toBe("AADB2C90080");
    expect(e.needsLogin).toBe(true);
  });

  it("renovações concorrentes viram uma só", async () => {
    const { f, calls } = fakeFetch({ "/oauth2/v2.0/token": tokenOk, "/ultima-execucao": carga });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    await Promise.all([c.call("ultimaCarga"), c.call("ultimaCarga"), c.call("ultimaCarga")]);
    expect(calls.filter((x) => x.url.pathname.endsWith("/token"))).toHaveLength(1);
  });
});

describe("rotas", () => {
  it("usa a data da carga como padrão e limita datas futuras", async () => {
    const seen: string[] = [];
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/ultima-execucao": carga,
      "/v2/posicao": (u) => {
        seen.push(u.searchParams.get("data")!);
        return json({ paginaAtual: 1, totalPaginas: 1, itens: [] });
      },
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    await c.call("posicao");
    const { meta } = await c.callWithMeta("posicao", { data: "2026-12-31" });
    expect(seen).toEqual(["2026-11-11", "2026-11-11"]);
    expect(meta.ajustes).toEqual([{ campo: "data", pedido: "2026-12-31", usado: "2026-11-11" }]);
  });

  it("negociação leva a página no caminho, não na query", async () => {
    const { f, calls } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/ultima-execucao": carga,
      "/negociacao-ativos/3": () => json({ paginaAtual: 3, totalPaginas: 3, itens: [] }),
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    await c.call("negociacao", { pagina: 3, dataInicio: "2026-01-01" });
    const u = calls.at(-1)!.url;
    expect(u.pathname.endsWith("/negociacao-ativos/3")).toBe(true);
    expect(u.searchParams.has("pagina")).toBe(false);
    expect(u.searchParams.get("dataFim")).toBe("2026-11-11");
    expect(u.searchParams.get("cache-guid")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("all() percorre as páginas", async () => {
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/ultima-execucao": carga,
      "/v2/movimentacao": (u) => json({ paginaAtual: Number(u.searchParams.get("pagina")), totalPaginas: 3, itens: [{ data: "2026-01-01T00:00:00", movimentacoes: [] }] }),
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    const r = await c.all("movimentacao");
    expect(r.itens).toHaveLength(3);
  });

  it("erro de regra (JSON-string) e de validação (problem+json)", async () => {
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/ultima-execucao": carga,
      "/v2/posicao": () => json("A data informada é maior que a data de carga do sistema!", 400),
      "/proventos/investidor/resumo": () =>
        json({ title: "One or more validation errors occurred.", status: 400, errors: { agrupamento: ["The value '2' is invalid."] } }, 400, "application/problem+json"),
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    const e1 = await c.raw(endpoints.posicao.b3Path, { data: "2030-01-01" }).catch((x) => x);
    expect(e1).toBeInstanceOf(B3ApiError);
    expect(e1.kind).toBe("regra");
    const e2 = await c.call("proventosResumo", { agrupamento: 2, mes: 1, ano: 2026 }).catch((x) => x);
    expect(e2.kind).toBe("validacao");
    expect(e2.message).toContain("agrupamento");
  });

  it("401 renova o token uma vez e repete", async () => {
    let n = 0;
    const { f, calls } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/ultima-execucao": () => (n++ === 0 ? new Response("", { status: 401 }) : carga(new URL("http://x"), {})),
    });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    await c.call("ultimaCarga");
    expect(calls.filter((x) => x.url.pathname.endsWith("/token"))).toHaveLength(2);
  });

  it("204 vira null", async () => {
    const { f } = fakeFetch({ "/oauth2/v2.0/token": tokenOk, "/investidor/anos": () => new Response(null, { status: 204 }) });
    const c = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    expect(await c.call("proventosAnos")).toBeNull();
  });

  it("rotas bridgewise substituem id no caminho e enviam busca e período", async () => {
    const chamadasFeitas: string[] = [];
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/pesquisa-ativos": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json([{ ticker: "VALE3" }]);
      },
      "/PETR4/cotacao": (url) => {
        chamadasFeitas.push(url.pathname);
        return json({ preco: 38.5 });
      },
      "/PETR4/analise-fundamentalista": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json({ pl: 4.2 });
      },
    });
    const cliente = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    const lista = await cliente.call("bridgewisePesquisaAtivos", { busca: "PETR" });
    expect(lista).toEqual([{ ticker: "VALE3" }]);
    expect(chamadasFeitas[0]).toContain("busca=PETR");

    const cotacao = await cliente.call("bridgewiseCotacao", { id: "PETR4" });
    expect(cotacao).toEqual({ preco: 38.5 });
    expect(chamadasFeitas[1]).toContain("/PETR4/cotacao");

    const fundamentalista = await cliente.call("bridgewiseAnaliseFundamentalista", { id: "PETR4", periodoCotacao: "12M" });
    expect(fundamentalista).toEqual({ pl: 4.2 });
    expect(chamadasFeitas[2]).toContain("/PETR4/analise-fundamentalista");
    expect(chamadasFeitas[2]).toContain("periodoCotacao=12M");
  });

  it("rotas de renda fixa e calculadora repassam parâmetros corretos", async () => {
    const chamadasFeitas: string[] = [];
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/rendafixa/v1/ativos": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json({ totalRegistros: 10 });
      },
      "/rendafixa/v1/negocio-consolidado": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json({ consolidado: true });
      },
      "/titulos/lista-titulos-cra": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json([{ codigoCRA: "CRA123" }]);
      },
    });
    const cliente = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });

    const ativos = await cliente.call("rendaFixaAtivos", { CodigoInstrumento: "CDB", Pagina: 2, TamanhoPagina: 50 });
    expect(ativos).toEqual({ totalRegistros: 10 });
    expect(chamadasFeitas[0]).toContain("CodigoInstrumento=CDB");
    expect(chamadasFeitas[0]).toContain("Pagina=2");
    expect(chamadasFeitas[0]).toContain("TamanhoPagina=50");

    const consolidado = await cliente.call("rendaFixaNegocioConsolidado", { DataNegocio: "2026-11-10", Pagina: 1 });
    expect(consolidado).toEqual({ consolidado: true });
    expect(chamadasFeitas[1]).toContain("DataNegocio=2026-11-10");

    const titulosCRA = await cliente.call("calcRFTitulosCRA", { dataInicio: "2026-01-01", dataFim: "2026-11-10" });
    expect(titulosCRA).toEqual([{ codigoCRA: "CRA123" }]);
    expect(chamadasFeitas[2]).toContain("dataInicio=2026-01-01");
    expect(chamadasFeitas[2]).toContain("dataFim=2026-11-10");
  });

  it("rota de balcão repassa pagina e qtdRegistros", async () => {
    const chamadasFeitas: string[] = [];
    const { f } = fakeFetch({
      "/oauth2/v2.0/token": tokenOk,
      "/solicitacoes/listados-balcao": (url) => {
        chamadasFeitas.push(url.pathname + url.search);
        return json({ registros: [] });
      },
    });
    const cliente = new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: f });
    const resposta = await cliente.call("transferenciaListadosBalcao", { pagina: 3, qtdRegistros: 20 });
    expect(resposta).toEqual({ registros: [] });
    expect(chamadasFeitas[0]).toContain("/solicitacoes/listados-balcao");
    expect(chamadasFeitas[0]).toContain("pagina=3");
    expect(chamadasFeitas[0]).toContain("qtdRegistros=20");
  });
});

describe("shape e diff", () => {
  it("shape não vaza valores", () => {
    const s = JSON.stringify(shape({ a: "segredo", b: 12.5, c: "2026-01-01T00:00:00", d: [{ x: "12345678000199" }] }));
    expect(s).not.toContain("segredo");
    expect(s).not.toContain("12.5");
    expect(s).toContain("date-iso");
    expect(s).toContain("string(digits)");
  });

  it("aponta campos que o schema não descreve", () => {
    const extra = camposNaoDescritos(endpoints.posicao.response, {
      paginaAtual: 1,
      totalPaginas: 1,
      itens: [{ categoriaProduto: "x", posicoes: [{ id: "y", campoNovo: 1 }] }],
    });
    expect(extra).toEqual(["itens[].posicoes[].campoNovo"]);
  });
});
