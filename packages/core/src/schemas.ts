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

// ---------- mercado (Bridgewise), observado em 13/11/2026 ----------
// Valores numéricos chegam como texto já formatado ("12,3%"). Respostas vêm em { data, links, meta }.

const Recomendacao = z.looseObject({ valor: str(), descricao: str() });
const Preco = z.looseObject({ valor: str(), variacao: str(), positivo: bool() });
const ValorDescrito = z.looseObject({ descricao: str(), valor: str(), resumo: str() });
const PaginaBridgewise = {
  links: z.looseObject({ self: str(), first: str(), last: str() }).nullish(),
  meta: z.looseObject({ totalRecords: num(), totalPages: num() }).nullish(),
};
/** Janela da série de preços de `cotacao` (valores do portal; outro valor dá 400). */
export const PeriodoCotacao = z.enum(["D1", "D5", "M1", "M6", "YTD", "Y1", "Y2", "Y5"]);

/** Item de `tendenciaPreco` e `momentosMercado`. Campos tirados do código do portal; a B3 só devolveu listas vazias. */
const ParametroTecnico = z.looseObject({
  nomeParametro: str(),
  valorParametro: z.union([z.string(), z.number()]).nullish(),
  textoScore: str(),
  descricaoParametro: str(),
});

const indicadoresAtivo = { marketCap: str(), indicePL: str(), roe: str(), dividendYield: str() };

export const BridgewisePesquisa = z.looseObject({
  data: z.array(
    z.looseObject({
      totalAtivos: num(),
      ativos: z.array(z.looseObject({ ticker: str(), nome: str(), precoAlvo: str(), recomendacao: Recomendacao.nullish() })),
    }),
  ),
  ...PaginaBridgewise,
});

export const BridgewiseCotacao = z.looseObject({
  data: z.looseObject({
    recomendacao: Recomendacao.nullish(),
    precoFechamento: Preco.nullish(),
    periodos: z.array(z.looseObject({ nome: str(), variacao: str(), positivo: bool() })),
    dadosGrafico: z.array(z.looseObject({ data: dataIso(), preco: num(), precoFormatado: str() })),
    descricao: str(),
    marketCap: str(),
    volumeMedio: str(),
    beta: str(),
    dividendYield: str(),
    crescimentoReceita: str(),
    indicePL: str(),
  }),
});

export const BridgewiseDadosAtivo = z.looseObject({
  data: z.array(z.looseObject({ setor: str(), industria: str(), marketCap: str(), dividendYield: str(), volumeMedio: str(), crescimentoReceita: str(), beta: str(), indicePL: str() })),
  ...PaginaBridgewise,
});

export const BridgewiseDesempenho = z.looseObject({
  data: z.array(z.looseObject({ dataAnalise: dataIso(), trimestreAnalise: str(), variacao: str(), resumo: str() })),
  ...PaginaBridgewise,
});

export const BridgewiseComparativo = z.looseObject({
  data: z.looseObject({
    ticker: str(),
    nome: str(),
    recomendacao: Recomendacao.nullish(),
    ...indicadoresAtivo,
    ativosSetor: z.array(z.looseObject({ ticker: str(), nome: str(), recomendacao: Recomendacao.nullish(), ...indicadoresAtivo })),
    mediaSetor: z.looseObject({ recomendacao: Recomendacao.nullish(), ...indicadoresAtivo }).nullish(),
  }),
});

export const BridgewiseAnaliseFundamentalista = z.looseObject({
  data: z.array(
    z.looseObject({
      analiseFundamentalista: z.looseObject({ descricao: str(), valor: str() }).nullish(),
      metaPreco: str(),
      potencialAlta: z.looseObject({ valor: str(), positivo: bool() }).nullish(),
      dre: ValorDescrito.nullish(),
      fluxoCaixa: ValorDescrito.nullish(),
      balancoPatrimonial: ValorDescrito.nullish(),
      forcaSetor: z.looseObject({ descricao: str(), valor: str() }).nullish(),
      esg: z.looseObject({ descricao: str(), valor: str() }).nullish(),
    }),
  ),
  ...PaginaBridgewise,
});

export const BridgewiseAnaliseTecnica = z.looseObject({
  data: z.array(
    z.looseObject({
      analiseTecnica: str(),
      precoFechamento: Preco.nullish(),
      suporte: str(),
      resistencia: str(),
      descricao: str(),
      tendenciaPreco: z.array(ParametroTecnico).describe("Sempre vazio nas consultas feitas; campos do item conforme o portal"),
      momentosMercado: z.array(ParametroTecnico).describe("Sempre vazio nas consultas feitas; campos do item conforme o portal"),
    }),
  ),
  ...PaginaBridgewise,
});

// ---------- títulos da calculadora de renda fixa ----------

export const CalcRFTitulosPublicos = z.looseObject({
  data: z.array(z.looseObject({ idSelic: num(), emissor: str(), metodo: str(), dataExpiracao: str(), habilitarProjecao: bool() })),
});

/** Debêntures, CRA e CRI têm o mesmo formato. */
export const CalcRFTitulosPrivados = z.looseObject({
  data: z.array(z.looseObject({ codigoTitulo: str(), habilitarProjecao: bool(), dataVencimento: dataIso() })),
});

/** Preço unitário (PU) de um título, com o fluxo de caixa. Observado ao vivo em 13/11/2026. */
export const CalcRFCalculoPU = z.looseObject({
  data: z.looseObject({
    pu: num(),
    puPar: num(),
    percentualPU: num(),
    financeiro: num(),
    vna: num(),
    codigoTitulo: str(),
    data: dataIso("Data do cálculo"),
    listaFluxoCaixa: z.array(
      z.looseObject({
        data: dataIso(),
        tipoEvento: z.looseObject({ valor: str() }).nullish(),
        valorFinal: num(),
        valorPresente: num(),
        diasUteis: num(),
        rendimento: num(),
      }),
    ),
    duracao: num(),
    possuiNota: bool(),
    interesse: num(),
    emissor: str(),
    rendimentoEmissor: num(),
    metodo: str(),
    status: str(),
    tipoIF: z.looseObject({ id: num(), codigo: str(), stringCodigo: str() }).nullish(),
    rendimento: num(),
  }),
});

// ---------- tabelas de apoio ----------

export const Instituicoes = z.looseObject({ instituicoes: z.array(z.looseObject({ id: str().describe("Dígitos (CNPJ da instituição)"), descricao: str() })) });

export const TiposEventos = z.looseObject({
  tiposEventos: z.array(
    z.looseObject({
      id: z.union([z.number(), z.array(z.number())]).nullish().describe("Sic: a B3 manda uma lista de números, não um número"),
      nomeTipoEvento: str(),
    }),
  ),
  detalheStatusCode: num(),
});

export const TiposMovimentacoes = z.looseObject({
  tiposMovimentacoes: z.array(z.looseObject({ id: num(), descricao: str() })),
  excecoes: z.array(z.unknown()).nullish(),
});

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
