import { z } from "zod";

// Schemas montados a partir das árvores de tipos observadas (docs/descobertas.md).
// Todos os objetos são "loose": campos novos que a B3 acrescentar passam adiante sem quebrar.
// Folhas são nullish porque a B3 costuma mandar null em campos que não se aplicam ao produto.

const str = () => z.string().nullish();
const num = () => z.number().nullish();
const bool = () => z.boolean().nullish();
/** Datas nas respostas vêm como "AAAA-MM-DDT00:00:00" (sem fuso). */
const dataIso = (description?: string) => z.string().nullish().describe(description ?? "Data ISO sem fuso (AAAA-MM-DDT00:00:00)");

// ---------- parâmetros de entrada ----------

export const DataParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use AAAA-MM-DD")
  .describe("Data no formato AAAA-MM-DD");
export const PaginaParam = z.coerce.number().int().min(1).default(1).describe("Página (começa em 1)");
export const MesParam = z.coerce.number().int().min(1).max(12).describe("Mês (1–12)");
export const AnoParam = z.coerce.number().int().min(2000).max(2100).describe("Ano com 4 dígitos");

// ---------- envelope paginado ----------

export const paginado = <T extends z.ZodType>(item: T) =>
  z.looseObject({
    paginaAtual: z.number().describe("Página devolvida"),
    totalPaginas: z.number().describe("Total de páginas para o filtro"),
    itens: z.array(item),
    detalheStatusCode: num().describe("Código interno da B3"),
    excecoes: z.array(z.unknown()).nullish().describe("Avisos internos da B3"),
  });

/** Objeto cujos campos ainda não foram mapeados (ver ROADMAP.md). */
export const NaoMapeado = z.looseObject({}).describe("Campos ainda não mapeados — contribua com `b3 shapes` (CONTRIBUTING.md)");

// ---------- sistema ----------

export const UltimaCarga = z.looseObject({
  dataGeral: dataIso("Data da última carga geral. Rotas de posição/movimentação recusam datas posteriores."),
  dataDerivativos: dataIso(),
  dataRendaFixa: dataIso(),
  dataRendaVariavel: dataIso(),
  dataTesouroDireto: dataIso(),
});

// ---------- posição ----------

export const PosicaoItem = z.looseObject({
  id: str().describe("UUID da posição"),
  temBloqueio: bool(),
  instituicao: str(),
  documentoInstituicao: str().describe("Documento da instituição (só dígitos)"),
  documento: str().describe("Documento (só dígitos; semântica a confirmar)"),
  produto: str(),
  codigoNegociacao: str().describe("Ticker / código do ativo"),
  tipoIf: str().describe("Tipo do instrumento financeiro"),
  emissor: str(),
  indexador: str(),
  tipoRegime: str(),
  quantidade: num(),
  disponivel: num(),
  precoUnitarioAtualizado: num(),
  valorAtualizado: num(),
  valorBruto: num(),
  dataEmissao: dataIso(),
  vencimento: dataIso(),
  dataReferencia: dataIso(),
  dataPrecoFechamento: dataIso(),
  existeLogotipo: bool(),
  marcacoes: z.array(z.unknown()).nullish(),
});

export const PosicaoGrupo = z.looseObject({
  categoriaProduto: str(),
  tipoProduto: str(),
  descricaoTipoProduto: str(),
  posicoes: z.array(PosicaoItem),
  totalPosicao: num(),
  totalItemsPagina: num(),
});

export const PosicaoResposta = paginado(PosicaoGrupo);

// ---------- movimentação ----------

export const Movimentacao = z.looseObject({
  tipoOperacao: str(),
  tipoMovimentacao: str(),
  nomeProduto: str(),
  instituicao: str(),
  quantidade: num(),
  precoUnitario: num(),
  valorOperacao: num(),
  vencimento: dataIso(),
  dataMovimentacao: dataIso(),
});

export const MovimentacaoDia = z.looseObject({
  data: dataIso(),
  movimentacoes: z.array(Movimentacao),
  totalItemsPagina: num(),
});

export const MovimentacaoResposta = paginado(MovimentacaoDia);

// ---------- negociação ----------

export const NegociacaoResposta = paginado(NaoMapeado);

// ---------- proventos ----------

export const ProventosMeses = z.array(z.looseObject({ numeroMes: num(), nomeMes: str() }));

export const ProventosResumo = z.looseObject({
  datatInicial: dataIso("Sic: a B3 escreve \"datatInicial\""),
  dataFinal: dataIso(),
  dados: z.array(NaoMapeado),
});

export const ProventosRecebidosResumo = z.looseObject({
  mesAno: dataIso(),
  totalDoMes: num(),
});

export const ResumoMensalRecebidos = z.looseObject({
  dtInicial: dataIso(),
  dtFinal: dataIso(),
});

export const ListaNaoMapeada = z.array(NaoMapeado);

// ---------- página inicial ----------

/** Variação do patrimônio. A B3 manda os valores já formatados para exibição (texto pt-BR). */
const VariacaoPatrimonio = z.looseObject({
  valorFormatado: str(),
  porcentagemFormatada: str(),
  porcentagemFormatado: str().describe("Sic: algumas rotas usam este nome"),
  positivo: bool(),
  quantidadeDias: num(),
  semVariacao: bool(),
  semPatrimonio: bool(),
});
const Insight = z.looseObject({ tipo: str(), valorFormatado: str() });
const InstituicaoResumo = z.looseObject({
  documentoInstituicao: str().describe("Documento da instituição (só dígitos)"),
  nomeInstituicao: str(),
  temIcone: bool(),
  urlIcone: str(),
});

export const UltimasMovimentacoes = z.looseObject({
  itens: z.array(Movimentacao),
  detalheStatusCode: num(),
  excecoes: z.array(z.unknown()).nullish(),
});

export const CarteiraResumo = z.looseObject({
  data: z.looseObject({ variacaoPatrimonio: VariacaoPatrimonio.nullish(), insights: Insight.nullish() }).nullish(),
});

export const CarteiraTotalAcumulado = z.looseObject({
  data: z
    .looseObject({
      dataAtualizacao: dataIso(),
      instituicoes: z.array(InstituicaoResumo).nullish(),
      totalAcumuladoFormatado: str(),
      quantidadeTotalInstituicoes: num(),
      variacaoPatrimonio: VariacaoPatrimonio.nullish(),
    })
    .nullish(),
});

export const CarteiraInstituicoes = z.looseObject({
  data: z
    .looseObject({
      dataAtualizacao: dataIso(),
      instituicoes: z.array(InstituicaoResumo).nullish(),
      totalAcumuladoFormatado: str(),
      variacaoPatrimonio: VariacaoPatrimonio.nullish(),
      categorias: z
        .array(
          z.looseObject({
            id: str(),
            nomeCategoriaProduto: str(),
            porcentagem: num(),
            porcentagemFormatada: str(),
            valorFormatado: str(),
          }),
        )
        .nullish(),
      insights: Insight.nullish(),
    })
    .nullish(),
});

export const EvolucaoPatrimonial = z.looseObject({
  data: dataIso(),
  itens: z.array(z.looseObject({ data: dataIso(), valor: num() })),
});

/** Chaves abreviadas pela própria B3. Semântica ainda não confirmada (conta sem negociações). */
export const UltimasNegociacoes = z.looseObject({
  iup: bool().describe("abreviado; semântica a confirmar"),
  upp: str().describe("abreviado; semântica a confirmar"),
  tp: num().describe("abreviado; provável total de páginas"),
  pa: num().describe("abreviado; provável página atual"),
  sp: num().describe("abreviado; semântica a confirmar"),
  it: z.array(NaoMapeado).describe("abreviado; provável lista de itens"),
});

// ---------- investidor ----------

export const Cadastro = z.looseObject({
  nome: str(),
  documentoInvestidor: str().describe("CPF/CNPJ (só dígitos)"),
  indicadorTipoPessoa: num(),
  codigoAtividadeEconomica: str(),
  numeroTelefoneWhatsApp: str(),
  avisoPorEmail: bool(),
  notificaoNewsletter: bool().describe("Sic: a B3 escreve \"notificao\""),
  notificacaoSTVM: bool(),
  suitability: z
    .looseObject({
      classificacaoCalculadaPerfilSuitability: z.unknown(),
      classificacaoEscolhidaPerfilSuitability: z.unknown(),
      notaSomadaPerfilSuitability: z.unknown(),
      dataRespostaSuitability: z.unknown(),
      solicitaPerfilSuitability: bool(),
    })
    .nullish(),
  instituicoes: z
    .array(
      z.looseObject({
        id: str(),
        descricao: str(),
        contas: z.array(
          z.looseObject({
            codigoContaInvestidor: str(),
            codigoParticipante: str(),
            codigoSistemaOrigem: num(),
            emails: z.array(z.looseObject({ endereco: str(), principal: bool() })).nullish(),
          }),
        ),
      }),
    )
    .nullish(),
});

export const Perfil = z.looseObject({ features: z.array(z.looseObject({ nome: str() })) });
