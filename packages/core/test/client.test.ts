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

  // As respostas abaixo têm o formato (tipos) visto ao vivo em 13/11/2026, com valores inventados.
  // O que se confere: caminho e parâmetros enviados, e que o schema aceita o formato real.
  const novoCliente = (rotas: Record<string, Handler>) =>
    new B3Client({ store: new MemoryTokenStore({ refresh_token: "x" }), fetch: fakeFetch({ "/oauth2/v2.0/token": tokenOk, ...rotas }).f });

  it("bridgewise: pesquisa envia `busca`; {id} vai no caminho e não na query", async () => {
    const vistos: URL[] = [];
    const reg = (corpo: unknown): Handler => (url) => {
      vistos.push(url);
      return json(corpo);
    };
    const c = novoCliente({
      "/pesquisa-ativos": reg({
        data: [{ totalAtivos: 1, ativos: [{ ticker: "AAAA3", nome: "Empresa A", precoAlvo: "R$ 10,00", recomendacao: { valor: "4", descricao: "Compra" } }] }],
        links: { self: "s", first: "f", last: "l" },
        meta: { totalRecords: 1, totalPages: 1 },
      }),
      "/AAAA3/cotacao": reg({
        data: {
          recomendacao: { valor: "4", descricao: "Compra" },
          precoFechamento: { valor: "R$ 10,00", variacao: "1,0%", positivo: true },
          periodos: [{ nome: "1M", variacao: "2,0%", positivo: false }],
          dadosGrafico: [{ data: "2026-11-12T00:00:00", preco: 10, precoFormatado: "R$ 10,00" }],
          descricao: "d",
          marketCap: "1 bi",
          volumeMedio: "1 mi",
          beta: "1,1",
          dividendYield: "5%",
          crescimentoReceita: "3%",
          indicePL: "6",
        },
      }),
      "/AAAA3/analise-tecnica": reg({
        data: [{ analiseTecnica: "t", precoFechamento: { valor: "R$ 10,00", variacao: "1%", positivo: true }, suporte: "9", resistencia: "11", descricao: "d", tendenciaPreco: [], momentosMercado: [] }],
        links: { self: "s", first: "f", last: "l" },
        meta: { totalRecords: 1, totalPages: 1 },
      }),
    });

    const pesquisa = await c.callWithMeta("bridgewisePesquisaAtivos", { busca: "AAAA" });
    expect(pesquisa.meta.schemaIssues).toEqual([]);
    expect(vistos[0]!.searchParams.get("busca")).toBe("AAAA");

    const cotacao = await c.callWithMeta("bridgewiseCotacao", { id: "AAAA3", periodoCotacao: "M1" });
    expect(cotacao.meta.schemaIssues).toEqual([]);
    expect(vistos[1]!.pathname).toMatch(/\/bridgewise\/AAAA3\/cotacao$/);
    expect(vistos[1]!.searchParams.has("id")).toBe(false);
    expect(vistos[1]!.searchParams.get("periodoCotacao")).toBe("M1");
    await expect(c.call("bridgewiseCotacao", { id: "AAAA3", periodoCotacao: "XX" as never })).rejects.toThrow();

    const tecnica = await c.callWithMeta("bridgewiseAnaliseTecnica", { id: "AAAA3" });
    expect(tecnica.meta.schemaIssues).toEqual([]);
  });

  it("bridgewise: `id` é obrigatório e a lista de ativos aceita 204", async () => {
    const c = novoCliente({ "/lista-ativos": () => new Response(null, { status: 204 }) });
    await expect(c.call("bridgewiseCotacao", {} as never)).rejects.toThrow();
    const r = await c.callWithMeta("bridgewiseListaAtivos");
    expect(r.data).toBeNull();
    expect(r.meta.status).toBe(204);
    expect(r.meta.schemaIssues).toEqual([]);
  });

  it("títulos da calculadora de renda fixa: envelope { data } e datas na query", async () => {
    const vistos: URL[] = [];
    const c = novoCliente({
      "/lista-titulos-publicos": () => json({ data: [{ idSelic: 1, emissor: "Tesouro", metodo: "m", dataExpiracao: "2030-01-01", habilitarProjecao: true }] }),
      "/lista-titulos-cra": (url) => {
        vistos.push(url);
        return json({ data: [{ codigoTitulo: "CRA000", habilitarProjecao: false, dataVencimento: "2030-01-01T00:00:00" }] });
      },
    });
    expect((await c.callWithMeta("calcRFTitulosPublicos")).meta.schemaIssues).toEqual([]);
    const cra = await c.callWithMeta("calcRFTitulosCRA", { dataInicio: "2026-01-01", dataFim: "2026-11-10" });
    expect(cra.meta.schemaIssues).toEqual([]);
    expect(vistos[0]!.searchParams.get("dataInicio")).toBe("2026-01-01");
    expect(vistos[0]!.searchParams.get("dataFim")).toBe("2026-11-10");
  });

  it("cálculo de PU: `codigo` obrigatório e dataCalculo padrão = última carga", async () => {
    const vistos: URL[] = [];
    const c = novoCliente({
      "/ultima-execucao": carga,
      "/realizar-calculo-pu": (url) => {
        vistos.push(url);
        return json({
          data: {
            pu: 1000.5, puPar: 1000, percentualPU: 100, financeiro: 1000.5, vna: 1000, codigoTitulo: "AAAA11",
            data: "2026-11-11T00:00:00",
            listaFluxoCaixa: [{ data: "2027-01-01T00:00:00", tipoEvento: { valor: "Juros" }, valorFinal: 10, valorPresente: 9, diasUteis: 30, rendimento: 1 }],
            duracao: 2.5, possuiNota: false, interesse: 0, emissor: "Emissor", rendimentoEmissor: 1, metodo: "m", status: "ok",
            tipoIF: { id: 1, codigo: "DEB", stringCodigo: "DEB" }, rendimento: 1,
          },
        });
      },
    });
    await expect(c.call("calcRFCalculoPU", {} as never)).rejects.toThrow();
    const r = await c.callWithMeta("calcRFCalculoPU", { codigo: "AAAA11" });
    expect(r.meta.schemaIssues).toEqual([]);
    expect(vistos[0]!.searchParams.get("codigo")).toBe("AAAA11");
    expect(vistos[0]!.searchParams.get("dataCalculo")).toBe("2026-11-11");
  });

  it("balcão e tabelas de apoio aceitam o formato real", async () => {
    const c = novoCliente({
      "/listados-balcao": () => json([]),
      "/investidor/v1/instituicoes": () => json({ instituicoes: [{ id: "00000000000191", descricao: "Corretora X" }] }),
      "/v1.1/tipos-eventos": () => json({ tiposEventos: [{ id: [1], nomeTipoEvento: "Dividendo" }], detalheStatusCode: 0 }),
      "/investidor/v1/tipos-movimentacoes": () => json({ tiposMovimentacoes: [{ id: 1, descricao: "Compra" }], excecoes: null }),
    });
    for (const id of ["transferenciaListadosBalcao", "instituicoes", "tiposEventos", "tiposMovimentacoes"] as const) {
      expect((await c.callWithMeta(id)).meta.schemaIssues, id).toEqual([]);
    }
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
