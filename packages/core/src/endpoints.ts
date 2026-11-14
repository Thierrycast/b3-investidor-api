import { z } from "zod";
import * as S from "./schemas";

/**
 * Registro único das rotas da B3. O cliente, o servidor HTTP (Swagger), a CLI e a
 * documentação saem daqui. Para mapear uma rota nova, acrescente uma entrada.
 */
export type EndpointStatus =
  /** Rota e campos confirmados com dados reais. */
  | "confirmado"
  /** Rota responde, mas a conta usada no mapeamento não tinha dados: campos dos itens desconhecidos. */
  | "campos-pendentes";

export interface CargaContext {
  /** dataGeral da última carga (AAAA-MM-DD). */
  carga: string;
}

export interface EndpointDef<Q extends z.ZodObject = z.ZodObject, R extends z.ZodType = z.ZodType> {
  id: string;
  tag: "Sistema" | "Investidor" | "Carteira" | "Extratos" | "Proventos" | "Início" | "Mercado" | "Renda Fixa" | "Transferência" | "Apoio";
  summary: string;
  description?: string;
  /** Caminho na API da B3. `{param}` é substituído pelo parâmetro de mesmo nome. */
  b3Path: string;
  /** Caminho na API HTTP deste projeto. */
  route: string;
  query: Q;
  response: R;
  status: EndpointStatus;
  /** Como a rota pagina: `query` (?pagina=) ou `path` (/{pagina}). */
  pagination?: "query" | "path";
  /** Parâmetros que a B3 recusa se forem maiores que a data da última carga: são limitados a ela. */
  clampToCarga?: readonly string[];
  /** Valores padrão calculados a partir da data da última carga. */
  defaults?: (ctx: CargaContext) => Record<string, unknown>;
  /** Detalhes observados que viram documentação. */
  notes?: readonly string[];
}

const def = <Q extends z.ZodObject, R extends z.ZodType>(d: EndpointDef<Q, R>) => d;

export const daysBefore = (isoDate: string, days: number) =>
  new Date(Date.parse(`${isoDate}T12:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
const mesAno = ({ carga }: CargaContext) => ({ mes: Number(carga.slice(5, 7)), ano: Number(carga.slice(0, 4)) });

const EP = "/negocio-eventosprovisionados/api/extrato-eventos-provisionados";
const BW = "/negocio-empresa/api/empresa/v1/bridgewise";
const CALCRF = "/negocio-calcrf/api/calcrf/v1";

export const endpoints = {
  ultimaCarga: def({
    id: "ultimaCarga",
    tag: "Sistema",
    summary: "Datas da última carga de dados",
    description: "Até quando os dados da B3 estão atualizados, por mercado. Normalmente D-1 útil.",
    b3Path: "/negocio-sistema/api/sistema/v1/carga/ultima-execucao",
    route: "/v1/sistema/ultima-carga",
    query: z.object({}),
    response: S.UltimaCarga,
    status: "confirmado",
  }),

  posicao: def({
    id: "posicao",
    tag: "Carteira",
    summary: "Posição da carteira numa data",
    description: "Posição agrupada por categoria/tipo de produto, com os ativos de cada grupo.",
    b3Path: "/negocio-posicao/api/extrato-posicao/v2/posicao",
    route: "/v1/posicao",
    query: z.object({
      data: S.DataParam.optional().describe("Data da posição (AAAA-MM-DD). Padrão: data da última carga."),
      pagina: S.PaginaParam,
    }),
    response: S.PosicaoResposta,
    status: "confirmado",
    pagination: "query",
    clampToCarga: ["data"],
    defaults: ({ carga }) => ({ data: carga }),
    notes: ["Data posterior à última carga → 400 \"A data informada é maior que a data de carga do sistema!\". O cliente limita sozinho."],
  }),

  movimentacao: def({
    id: "movimentacao",
    tag: "Extratos",
    summary: "Extrato de movimentação",
    description: "Créditos e débitos (rendimentos, resgates, vencimentos, transferências...) agrupados por dia.",
    b3Path: "/negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao",
    route: "/v1/movimentacao",
    query: z.object({
      dataInicio: S.DataParam.optional().describe("Início (AAAA-MM-DD). Padrão: 30 dias antes de dataFim."),
      dataFim: S.DataParam.optional().describe("Fim (AAAA-MM-DD). Padrão: data da última carga."),
      pagina: S.PaginaParam,
    }),
    response: S.MovimentacaoResposta,
    status: "confirmado",
    pagination: "query",
    clampToCarga: ["dataFim"],
    defaults: ({ carga }) => ({ dataFim: carga, dataInicio: daysBefore(carga, 30) }),
    notes: ["Janelas de até 10 anos aceitas numa consulta (testado).", "dataFim posterior à última carga → 400."],
  }),

  movimentacaoUltimas: def({
    id: "movimentacaoUltimas",
    tag: "Início",
    summary: "Últimas movimentações (card da página inicial)",
    b3Path: "/negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao/ultimas",
    route: "/v1/movimentacao/ultimas",
    query: z.object({}),
    response: S.UltimasMovimentacoes,
    status: "confirmado",
  }),

  negociacao: def({
    id: "negociacao",
    tag: "Extratos",
    summary: "Extrato de negociação de ativos (compras e vendas na bolsa)",
    b3Path: "/negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos/{pagina}",
    route: "/v1/negociacao",
    query: z.object({
      dataInicio: S.DataParam.optional().describe("Início (AAAA-MM-DD). Padrão: 30 dias antes de dataFim."),
      dataFim: S.DataParam.optional().describe("Fim (AAAA-MM-DD). Padrão: data da última carga."),
      pagina: S.PaginaParam,
    }),
    response: S.NegociacaoResposta,
    status: "campos-pendentes",
    pagination: "path",
    defaults: ({ carga }) => ({ dataFim: carga, dataInicio: daysBefore(carga, 30) }),
    notes: ["A página vai no caminho, não na query.", "Aceita dataFim posterior à carga e dataInicio desde 2000 (testado)."],
  }),

  proventos: def({
    id: "proventos",
    tag: "Proventos",
    summary: "Proventos (dividendos, JCP, rendimentos) de um mês",
    b3Path: `${EP}/v1/proventos/investidor`,
    route: "/v1/proventos",
    query: z.object({ mes: S.MesParam.optional(), ano: S.AnoParam.optional() }),
    response: S.ListaNaoMapeada,
    status: "campos-pendentes",
    defaults: mesAno,
  }),

  proventosResumo: def({
    id: "proventosResumo",
    tag: "Proventos",
    summary: "Resumo de proventos do mês",
    b3Path: `${EP}/v1/proventos/investidor/resumo`,
    route: "/v1/proventos/resumo",
    query: z.object({
      agrupamento: z.coerce.number().int().default(1).describe("Só 1 é aceito (2 e 3 → 400)"),
      mes: S.MesParam.optional(),
      ano: S.AnoParam.optional(),
    }),
    response: S.ProventosResumo,
    status: "campos-pendentes",
    defaults: mesAno,
  }),

  proventosMeses: def({
    id: "proventosMeses",
    tag: "Proventos",
    summary: "Meses disponíveis para consulta de proventos",
    b3Path: `${EP}/v1/proventos/investidor/meses`,
    route: "/v1/proventos/meses",
    query: z.object({}),
    response: S.ProventosMeses,
    status: "confirmado",
  }),

  proventosAnos: def({
    id: "proventosAnos",
    tag: "Proventos",
    summary: "Anos com proventos",
    b3Path: `${EP}/v1/proventos/investidor/anos`,
    route: "/v1/proventos/anos",
    query: z.object({}),
    response: z.unknown(),
    status: "campos-pendentes",
    notes: ["Responde 204 (sem corpo) quando não há proventos."],
  }),

  proventosTipos: def({
    id: "proventosTipos",
    tag: "Proventos",
    summary: "Tipos de investimento com proventos no mês",
    b3Path: `${EP}/v1/proventos/investidor/tipos-investimentos`,
    route: "/v1/proventos/tipos-investimentos",
    query: z.object({ mes: S.MesParam.optional(), ano: S.AnoParam.optional() }),
    response: S.ListaNaoMapeada,
    status: "campos-pendentes",
    defaults: mesAno,
  }),

  proventosRecebidosResumo: def({
    id: "proventosRecebidosResumo",
    tag: "Proventos",
    summary: "Total de proventos recebidos no mês mais recente",
    b3Path: `${EP}/v1/recebidos/resumo-proventos`,
    route: "/v1/proventos/recebidos/resumo",
    query: z.object({}),
    response: S.ProventosRecebidosResumo,
    status: "confirmado",
  }),

  proventosResumoMensal: def({
    id: "proventosResumoMensal",
    tag: "Início",
    summary: "Resumo mensal de proventos recebidos (card da página inicial)",
    b3Path: `${EP}/v1/resumo-mensal/recebidos`,
    route: "/v1/proventos/recebidos/mensal",
    query: z.object({ dc: S.DataParam.optional().describe("Data de corte. Padrão: data da última carga.") }),
    response: S.ResumoMensalRecebidos,
    status: "campos-pendentes",
    defaults: ({ carga }) => ({ dc: carga }),
  }),

  carteiraResumo: def({
    id: "carteiraResumo",
    tag: "Início",
    summary: "Resumo da carteira (card da página inicial)",
    b3Path: "/negocio-home/api/home/v1/minha-carteira/resumo",
    route: "/v1/carteira/resumo",
    query: z.object({}),
    response: S.CarteiraResumo,
    status: "confirmado",
  }),

  carteiraTotalAcumulado: def({
    id: "carteiraTotalAcumulado",
    tag: "Início",
    summary: "Total acumulado da carteira",
    b3Path: "/negocio-home/api/home/v1/minha-carteira/total-acumulado",
    route: "/v1/carteira/total-acumulado",
    query: z.object({}),
    response: S.CarteiraTotalAcumulado,
    status: "confirmado",
  }),

  carteiraInstituicoes: def({
    id: "carteiraInstituicoes",
    tag: "Início",
    summary: "Carteira por instituição",
    b3Path: "/negocio-home/api/home/v1/minha-carteira/instituicao",
    route: "/v1/carteira/instituicoes",
    query: z.object({}),
    response: S.CarteiraInstituicoes,
    status: "confirmado",
  }),

  evolucaoPatrimonial: def({
    id: "evolucaoPatrimonial",
    tag: "Início",
    summary: "Evolução patrimonial",
    b3Path: "/negocio-home/api/home/v2/evolucao-patrimonial",
    route: "/v1/carteira/evolucao",
    query: z.object({
      ap: z.coerce.number().int().optional().describe("Período (código numérico observado na home; semântica a confirmar)"),
      dc: S.DataParam.optional().describe("Data de corte. Padrão: data da última carga."),
    }),
    response: S.EvolucaoPatrimonial,
    status: "confirmado",
    defaults: ({ carga }) => ({ dc: carga }),
  }),

  ultimasNegociacoes: def({
    id: "ultimasNegociacoes",
    tag: "Início",
    summary: "Últimas negociações (card da página inicial)",
    b3Path: "/negocio-home/api/home/v2/negociacao/ultimas-negociacoes",
    route: "/v1/negociacao/ultimas",
    query: z.object({ dataFim: S.DataParam.optional() }),
    response: S.UltimasNegociacoes,
    status: "campos-pendentes",
    defaults: ({ carga }) => ({ dataFim: carga }),
  }),

  cadastro: def({
    id: "cadastro",
    tag: "Investidor",
    summary: "Dados cadastrais do investidor",
    b3Path: "/negocio-investidor/api/investidor/v1.3/cadastro",
    route: "/v1/investidor/cadastro",
    query: z.object({}),
    response: S.Cadastro,
    status: "confirmado",
    notes: ["Contém dados pessoais. Nunca logue nem cole a resposta em issues."],
  }),

  perfil: def({
    id: "perfil",
    tag: "Investidor",
    summary: "Perfil do investidor",
    b3Path: "/negocio-investidor/api/investidor/v1/perfil",
    route: "/v1/investidor/perfil",
    query: z.object({}),
    response: S.Perfil,
    status: "confirmado",
  }),

  menusDisponiveis: def({
    id: "menusDisponiveis",
    tag: "Investidor",
    summary: "Funcionalidades habilitadas para a conta",
    description: "Mapa booleano de recursos (informe de rendimentos, calculadora de IR, transferência de ativos...).",
    b3Path: "/negocio-investidor/api/investidor/v3/menus-disponiveis",
    route: "/v1/investidor/menus",
    query: z.object({}),
    response: z.record(z.string(), z.boolean()),
    status: "confirmado",
  }),

  // ---------- mercado (Bridgewise): testado ao vivo em 13/11/2026 ----------

  bridgewiseListaAtivos: def({
    id: "bridgewiseListaAtivos",
    tag: "Mercado",
    summary: "Ativos da sua carteira que o Bridgewise cobre",
    description: "É a lista que o portal usa no card “Meus ativos”. Mesmo formato de `pesquisa-ativos`, mas só com ativos que você tem.",
    b3Path: `${BW}/lista-ativos`,
    route: "/v1/mercado/bridgewise/lista-ativos",
    query: z.object({
      busca: z.string().optional().describe("Parte do ticker ou do nome, para filtrar a carteira"),
      pagina: S.PaginaParam.optional().describe("Página (começa em 1)"),
      tamanhoPagina: z.coerce.number().int().min(1).optional().describe("Itens por página"),
    }),
    response: S.BridgewisePesquisa.nullable(),
    status: "campos-pendentes",
    notes: ["Responde 204 (sem corpo) quando a carteira não tem ações, FIIs ou BDRs cobertos: foi o caso da conta de teste, que só tem renda fixa. O formato é o mesmo de `pesquisa-ativos` (a página do portal usa a mesma função para as duas)."],
  }),

  bridgewisePesquisaAtivos: def({
    id: "bridgewisePesquisaAtivos",
    tag: "Mercado",
    summary: "Pesquisa de ativos por nome ou ticker",
    b3Path: `${BW}/pesquisa-ativos`,
    route: "/v1/mercado/bridgewise/pesquisa-ativos",
    query: z.object({
      busca: z.string().min(1).describe("Parte do ticker ou do nome (ex.: PETR)").meta({ example: "PETR" }),
      pagina: S.PaginaParam.optional().describe("Página (começa em 1)"),
      tamanhoPagina: z.coerce.number().int().min(1).optional().describe("Itens por página"),
    }),
    response: S.BridgewisePesquisa,
    status: "confirmado",
  }),

  bridgewiseCotacao: def({
    id: "bridgewiseCotacao",
    tag: "Mercado",
    summary: "Cotação, variações e série de preços do ativo",
    b3Path: `${BW}/{id}/cotacao`,
    route: "/v1/mercado/bridgewise/cotacao",
    query: z.object({
      id: z.string().describe("Ticker, como devolvido por `pesquisa-ativos`").meta({ example: "PETR3" }),
      periodoCotacao: S.PeriodoCotacao.optional().describe("Janela da série de preços (`dadosGrafico`). Padrão da B3: D5 (5 dias)"),
    }),
    response: S.BridgewiseCotacao,
    status: "confirmado",
    notes: ["O `{id}` da B3 aceita o ticker direto.", "`periodoCotacao`: D1 (1 dia), D5, M1 (1 mês), M6, YTD (ano até a data), Y1, Y2 e Y5. Outro valor dá 400."],
  }),

  bridgewiseDadosAtivo: def({
    id: "bridgewiseDadosAtivo",
    tag: "Mercado",
    summary: "Setor, indústria e indicadores do ativo",
    b3Path: `${BW}/{id}/dados-ativo`,
    route: "/v1/mercado/bridgewise/dados-ativo",
    query: z.object({ id: z.string().describe("Ticker (ex.: PETR3)").meta({ example: "PETR3" }) }),
    response: S.BridgewiseDadosAtivo,
    status: "confirmado",
  }),

  bridgewiseDesempenho: def({
    id: "bridgewiseDesempenho",
    tag: "Mercado",
    summary: "Desempenho do ativo por trimestre",
    b3Path: `${BW}/{id}/desempenho`,
    route: "/v1/mercado/bridgewise/desempenho",
    query: z.object({ id: z.string().describe("Ticker (ex.: PETR3)").meta({ example: "PETR3" }) }),
    response: S.BridgewiseDesempenho,
    status: "confirmado",
  }),

  bridgewiseComparativo: def({
    id: "bridgewiseComparativo",
    tag: "Mercado",
    summary: "Ativo comparado aos do mesmo setor",
    b3Path: `${BW}/{id}/comparativo`,
    route: "/v1/mercado/bridgewise/comparativo",
    query: z.object({ id: z.string().describe("Ticker (ex.: PETR3)").meta({ example: "PETR3" }) }),
    response: S.BridgewiseComparativo,
    status: "confirmado",
  }),

  bridgewiseAnaliseFundamentalista: def({
    id: "bridgewiseAnaliseFundamentalista",
    tag: "Mercado",
    summary: "Análise fundamentalista: DRE, fluxo de caixa, balanço, ESG",
    b3Path: `${BW}/{id}/analise-fundamentalista`,
    route: "/v1/mercado/bridgewise/analise-fundamentalista",
    query: z.object({ id: z.string().describe("Ticker (ex.: PETR3)").meta({ example: "PETR3" }) }),
    response: S.BridgewiseAnaliseFundamentalista,
    status: "confirmado",
  }),

  bridgewiseAnaliseTecnica: def({
    id: "bridgewiseAnaliseTecnica",
    tag: "Mercado",
    summary: "Análise técnica: suporte, resistência e tendência",
    b3Path: `${BW}/{id}/analise-tecnica`,
    route: "/v1/mercado/bridgewise/analise-tecnica",
    query: z.object({ id: z.string().describe("Ticker (ex.: PETR3)").meta({ example: "PETR3" }) }),
    response: S.BridgewiseAnaliseTecnica,
    status: "confirmado",
    notes: ["A B3 responde 206 (conteúdo parcial) em todos os ativos testados (PETR3, VALE3, ITUB4, BBAS3, MGLU3, WEGE3), e `tendenciaPreco` e `momentosMercado` vêm vazios: o serviço de indicadores técnicos não os entrega. O projeto devolve 200 e o status original no header `x-b3-status`. Os campos dos itens vêm do código do portal e não foram vistos preenchidos."],
  }),

  // ---------- títulos da calculadora de renda fixa ----------

  calcRFTitulosPublicos: def({
    id: "calcRFTitulosPublicos",
    tag: "Renda Fixa",
    summary: "Títulos públicos (Tesouro) da calculadora de renda fixa",
    b3Path: `${CALCRF}/titulos/lista-titulos-publicos`,
    route: "/v1/renda-fixa/titulos-publicos",
    query: z.object({}),
    response: S.CalcRFTitulosPublicos,
    status: "confirmado",
  }),

  calcRFTitulosDebentures: def({
    id: "calcRFTitulosDebentures",
    tag: "Renda Fixa",
    summary: "Debêntures da calculadora de renda fixa",
    b3Path: `${CALCRF}/titulos/lista-titulos-debentures`,
    route: "/v1/renda-fixa/debentures",
    query: z.object({}),
    response: S.CalcRFTitulosPrivados,
    status: "confirmado",
  }),

  calcRFTitulosCRA: def({
    id: "calcRFTitulosCRA",
    tag: "Renda Fixa",
    summary: "CRA da calculadora de renda fixa",
    b3Path: `${CALCRF}/titulos/lista-titulos-cra`,
    route: "/v1/renda-fixa/cra",
    query: z.object({
      dataInicio: S.DataParam.optional().describe("Data de início (AAAA-MM-DD)"),
      dataFim: S.DataParam.optional().describe("Data de fim (AAAA-MM-DD)"),
    }),
    response: S.CalcRFTitulosPrivados,
    status: "confirmado",
  }),

  calcRFTitulosCRI: def({
    id: "calcRFTitulosCRI",
    tag: "Renda Fixa",
    summary: "CRI da calculadora de renda fixa",
    b3Path: `${CALCRF}/titulos/lista-titulos-cri`,
    route: "/v1/renda-fixa/cri",
    query: z.object({ dataInicio: S.DataParam.optional().describe("Data de início (AAAA-MM-DD)") }),
    response: S.CalcRFTitulosPrivados,
    status: "confirmado",
  }),

  calcRFCalculoPU: def({
    id: "calcRFCalculoPU",
    tag: "Renda Fixa",
    summary: "Preço unitário (PU) e fluxo de caixa de um título",
    description: "Calcula o PU do título na data pedida. O código vem das listas de títulos (`titulos-publicos` usa o `idSelic`).",
    b3Path: `${CALCRF}/calculadora-pu/realizar-calculo-pu`,
    route: "/v1/renda-fixa/calculo-pu",
    query: z.object({
      codigo: z.string().min(1).describe("Código do título: `codigoTitulo` de debêntures, CRA e CRI, ou `idSelic` de título público").meta({ example: "AAJR11" }),
      dataCalculo: S.DataParam.optional().describe("Data do cálculo (AAAA-MM-DD). Padrão: data da última carga"),
    }),
    response: S.CalcRFCalculoPU,
    status: "confirmado",
    defaults: ({ carga }) => ({ dataCalculo: carga }),
    notes: ["A B3 aceitou datas futuras e fins de semana. Sem `dataCalculo` ela responde 400 \"Data de cálculo inválida\"; por isso o padrão."],
  }),

  // ---------- balcão ----------

  transferenciaListadosBalcao: def({
    id: "transferenciaListadosBalcao",
    tag: "Transferência",
    summary: "Solicitações de transferência de ativos listados em balcão",
    b3Path: "/api/transferencia-ativos/v3/solicitacoes/listados-balcao",
    route: "/v1/transferencia/listados-balcao",
    query: z.object({
      pagina: S.PaginaParam.optional().describe("Página da consulta"),
      qtdRegistros: z.coerce.number().int().optional().describe("Quantidade de registros por página"),
    }),
    response: S.ListaNaoMapeada,
    status: "campos-pendentes",
    notes: ["Responde 200 com lista vazia para quem não tem solicitações; os campos dos itens não foram vistos."],
  }),

  // ---------- tabelas de apoio ----------

  instituicoes: def({
    id: "instituicoes",
    tag: "Investidor",
    summary: "Instituições financeiras (id e nome)",
    b3Path: "/negocio-investidor/api/investidor/v1/instituicoes",
    route: "/v1/investidor/instituicoes",
    query: z.object({}),
    response: S.Instituicoes,
    status: "confirmado",
  }),

  tiposEventos: def({
    id: "tiposEventos",
    tag: "Proventos",
    summary: "Tipos de evento provisionado (dividendo, JCP etc.)",
    b3Path: `${EP}/v1.1/tipos-eventos`,
    route: "/v1/proventos/tipos-eventos",
    query: z.object({}),
    response: S.TiposEventos,
    status: "confirmado",
  }),

  tiposMovimentacoes: def({
    id: "tiposMovimentacoes",
    tag: "Investidor",
    summary: "Tipos de movimentação do extrato",
    b3Path: "/negocio-investidor/api/investidor/v1/tipos-movimentacoes",
    route: "/v1/investidor/tipos-movimentacoes",
    query: z.object({}),
    response: S.TiposMovimentacoes,
    status: "confirmado",
  }),
} as const;

export type EndpointId = keyof typeof endpoints;
export type EndpointQuery<K extends EndpointId> = z.input<(typeof endpoints)[K]["query"]>;
export type EndpointResult<K extends EndpointId> = z.output<(typeof endpoints)[K]["response"]>;

export const endpointList = Object.values(endpoints) as EndpointDef[];
