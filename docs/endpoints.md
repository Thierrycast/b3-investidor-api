# Rotas

> Arquivo gerado por `pnpm docs:gen` a partir de `packages/core/src/endpoints.ts`. Não edite à mão.

Todas as rotas da B3 são `GET https://investidor.b3.com.br<rota>` com `Authorization: Bearer <access_token>` e `cache-guid=<uuid>`.
A coluna **API** é a rota equivalente no servidor deste projeto (`b3 serve`), que exige o header `x-api-key`.

| | id | API | Resumo |
|---|---|---|---|
| ✅ | [`ultimaCarga`](#ultimacarga) | `/v1/sistema/ultima-carga` | Datas da última carga de dados |
| ✅ | [`posicao`](#posicao) | `/v1/posicao` | Posição da carteira numa data |
| ✅ | [`movimentacao`](#movimentacao) | `/v1/movimentacao` | Extrato de movimentação |
| ✅ | [`movimentacaoUltimas`](#movimentacaoultimas) | `/v1/movimentacao/ultimas` | Últimas movimentações (card da página inicial) |
| 🟡 | [`negociacao`](#negociacao) | `/v1/negociacao` | Extrato de negociação de ativos (compras e vendas na bolsa) |
| 🟡 | [`proventos`](#proventos) | `/v1/proventos` | Proventos (dividendos, JCP, rendimentos) de um mês |
| 🟡 | [`proventosResumo`](#proventosresumo) | `/v1/proventos/resumo` | Resumo de proventos do mês |
| ✅ | [`proventosMeses`](#proventosmeses) | `/v1/proventos/meses` | Meses disponíveis para consulta de proventos |
| 🟡 | [`proventosAnos`](#proventosanos) | `/v1/proventos/anos` | Anos com proventos |
| 🟡 | [`proventosTipos`](#proventostipos) | `/v1/proventos/tipos-investimentos` | Tipos de investimento com proventos no mês |
| ✅ | [`proventosRecebidosResumo`](#proventosrecebidosresumo) | `/v1/proventos/recebidos/resumo` | Total de proventos recebidos no mês mais recente |
| 🟡 | [`proventosResumoMensal`](#proventosresumomensal) | `/v1/proventos/recebidos/mensal` | Resumo mensal de proventos recebidos (card da página inicial) |
| ✅ | [`carteiraResumo`](#carteiraresumo) | `/v1/carteira/resumo` | Resumo da carteira (card da página inicial) |
| ✅ | [`carteiraTotalAcumulado`](#carteiratotalacumulado) | `/v1/carteira/total-acumulado` | Total acumulado da carteira |
| ✅ | [`carteiraInstituicoes`](#carteirainstituicoes) | `/v1/carteira/instituicoes` | Carteira por instituição |
| ✅ | [`evolucaoPatrimonial`](#evolucaopatrimonial) | `/v1/carteira/evolucao` | Evolução patrimonial |
| 🟡 | [`ultimasNegociacoes`](#ultimasnegociacoes) | `/v1/negociacao/ultimas` | Últimas negociações (card da página inicial) |
| ✅ | [`cadastro`](#cadastro) | `/v1/investidor/cadastro` | Dados cadastrais do investidor |
| ✅ | [`perfil`](#perfil) | `/v1/investidor/perfil` | Perfil do investidor |
| ✅ | [`menusDisponiveis`](#menusdisponiveis) | `/v1/investidor/menus` | Funcionalidades habilitadas para a conta |
| 🟡 | [`bridgewiseListaAtivos`](#bridgewiselistaativos) | `/v1/mercado/bridgewise/lista-ativos` | Lista de ativos do Bridgewise |
| ✅ | [`bridgewisePesquisaAtivos`](#bridgewisepesquisaativos) | `/v1/mercado/bridgewise/pesquisa-ativos` | Pesquisa de ativos por nome ou ticker |
| ✅ | [`bridgewiseCotacao`](#bridgewisecotacao) | `/v1/mercado/bridgewise/cotacao` | Cotação, variações e série de preços do ativo |
| ✅ | [`bridgewiseDadosAtivo`](#bridgewisedadosativo) | `/v1/mercado/bridgewise/dados-ativo` | Setor, indústria e indicadores do ativo |
| ✅ | [`bridgewiseDesempenho`](#bridgewisedesempenho) | `/v1/mercado/bridgewise/desempenho` | Desempenho do ativo por trimestre |
| ✅ | [`bridgewiseComparativo`](#bridgewisecomparativo) | `/v1/mercado/bridgewise/comparativo` | Ativo comparado aos do mesmo setor |
| ✅ | [`bridgewiseAnaliseFundamentalista`](#bridgewiseanalisefundamentalista) | `/v1/mercado/bridgewise/analise-fundamentalista` | Análise fundamentalista: DRE, fluxo de caixa, balanço, ESG |
| 🟡 | [`bridgewiseAnaliseTecnica`](#bridgewiseanalisetecnica) | `/v1/mercado/bridgewise/analise-tecnica` | Análise técnica: suporte, resistência e tendência |
| ✅ | [`calcRFTitulosPublicos`](#calcrftitulospublicos) | `/v1/renda-fixa/titulos-publicos` | Títulos públicos (Tesouro) da calculadora de renda fixa |
| ✅ | [`calcRFTitulosDebentures`](#calcrftitulosdebentures) | `/v1/renda-fixa/debentures` | Debêntures da calculadora de renda fixa |
| ✅ | [`calcRFTitulosCRA`](#calcrftituloscra) | `/v1/renda-fixa/cra` | CRA da calculadora de renda fixa |
| ✅ | [`calcRFTitulosCRI`](#calcrftituloscri) | `/v1/renda-fixa/cri` | CRI da calculadora de renda fixa |
| 🟡 | [`transferenciaListadosBalcao`](#transferencialistadosbalcao) | `/v1/transferencia/listados-balcao` | Solicitações de transferência de ativos listados em balcão |
| ✅ | [`instituicoes`](#instituicoes) | `/v1/investidor/instituicoes` | Instituições financeiras (id e nome) |
| ✅ | [`tiposEventos`](#tiposeventos) | `/v1/proventos/tipos-eventos` | Tipos de evento provisionado (dividendo, JCP etc.) |
| ✅ | [`tiposMovimentacoes`](#tiposmovimentacoes) | `/v1/investidor/tipos-movimentacoes` | Tipos de movimentação do extrato |

## Sistema

### ultimaCarga

**Datas da última carga de dados** — ✅ confirmado

Até quando os dados da B3 estão atualizados, por mercado. Normalmente D-1 útil.

- B3: `GET /negocio-sistema/api/sistema/v1/carga/ultima-execucao`
- API: `GET /v1/sistema/ultima-carga`

Resposta:

- `dataGeral`: string — Data da última carga geral. Rotas de posição/movimentação recusam datas posteriores.
- `dataDerivativos`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `dataRendaFixa`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `dataRendaVariavel`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `dataTesouroDireto`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)

## Carteira

### posicao

**Posição da carteira numa data** — ✅ confirmado

Posição agrupada por categoria/tipo de produto, com os ativos de cada grupo.

- B3: `GET /negocio-posicao/api/extrato-posicao/v2/posicao`
- API: `GET /v1/posicao`
- Paginação: `pagina` na query; a API aceita `todasPaginas=true`
- Limitado à data da última carga: `data`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `data` | string | não | Data da posição (AAAA-MM-DD). Padrão: data da última carga.; formato `^\d{4}-\d{2}-\d{2}$` |
| `pagina` | integer | não | Página (começa em 1); padrão `1` |

Observações:

- Data posterior à última carga → 400 "A data informada é maior que a data de carga do sistema!". O cliente limita sozinho.

Resposta:

- `paginaAtual`: number — Página devolvida
- `totalPaginas`: number — Total de páginas para o filtro
- `itens`: objeto[]
  - `categoriaProduto`: string
  - `tipoProduto`: string
  - `descricaoTipoProduto`: string
  - `posicoes`: objeto[]
    - `id`: string — UUID da posição
    - `temBloqueio`: boolean
    - `instituicao`: string
    - `documentoInstituicao`: string — Documento da instituição (só dígitos)
    - `documento`: string — Documento (só dígitos; semântica a confirmar)
    - `produto`: string
    - `codigoNegociacao`: string — Ticker / código do ativo
    - `tipoIf`: string — Tipo do instrumento financeiro
    - `emissor`: string
    - `indexador`: string
    - `tipoRegime`: string
    - `quantidade`: number
    - `disponivel`: number
    - `precoUnitarioAtualizado`: number
    - `valorAtualizado`: number
    - `valorBruto`: number
    - `dataEmissao`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `vencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `dataReferencia`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `dataPrecoFechamento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `existeLogotipo`: boolean
    - `marcacoes`: qualquer[]
  - `totalPosicao`: number
  - `totalItemsPagina`: number
- `detalheStatusCode`: number — Código interno da B3
- `excecoes`: qualquer[] — Avisos internos da B3

## Extratos

### movimentacao

**Extrato de movimentação** — ✅ confirmado

Créditos e débitos (rendimentos, resgates, vencimentos, transferências...) agrupados por dia.

- B3: `GET /negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao`
- API: `GET /v1/movimentacao`
- Paginação: `pagina` na query; a API aceita `todasPaginas=true`
- Limitado à data da última carga: `dataFim`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Início (AAAA-MM-DD). Padrão: 30 dias antes de dataFim.; formato `^\d{4}-\d{2}-\d{2}$` |
| `dataFim` | string | não | Fim (AAAA-MM-DD). Padrão: data da última carga.; formato `^\d{4}-\d{2}-\d{2}$` |
| `pagina` | integer | não | Página (começa em 1); padrão `1` |

Observações:

- Janelas de até 10 anos aceitas numa consulta (testado).
- dataFim posterior à última carga → 400.

Resposta:

- `paginaAtual`: number — Página devolvida
- `totalPaginas`: number — Total de páginas para o filtro
- `itens`: objeto[]
  - `data`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `movimentacoes`: objeto[]
    - `tipoOperacao`: string
    - `tipoMovimentacao`: string
    - `nomeProduto`: string
    - `instituicao`: string
    - `quantidade`: number
    - `precoUnitario`: number
    - `valorOperacao`: number
    - `vencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `dataMovimentacao`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `totalItemsPagina`: number
- `detalheStatusCode`: number — Código interno da B3
- `excecoes`: qualquer[] — Avisos internos da B3

### negociacao

**Extrato de negociação de ativos (compras e vendas na bolsa)** — 🟡 campos pendentes

- B3: `GET /negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos/{pagina}`
- API: `GET /v1/negociacao`
- Paginação: número da página **no caminho**; a API aceita `todasPaginas=true`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Início (AAAA-MM-DD). Padrão: 30 dias antes de dataFim.; formato `^\d{4}-\d{2}-\d{2}$` |
| `dataFim` | string | não | Fim (AAAA-MM-DD). Padrão: data da última carga.; formato `^\d{4}-\d{2}-\d{2}$` |
| `pagina` | integer | não | Página (começa em 1); padrão `1` |

Observações:

- A página vai no caminho, não na query.
- Aceita dataFim posterior à carga e dataInicio desde 2000 (testado).

Resposta:

- `paginaAtual`: number — Página devolvida
- `totalPaginas`: number — Total de páginas para o filtro
- `itens`: objeto (não mapeado)[]
- `detalheStatusCode`: number — Código interno da B3
- `excecoes`: qualquer[] — Avisos internos da B3

## Início

### movimentacaoUltimas

**Últimas movimentações (card da página inicial)** — ✅ confirmado

- B3: `GET /negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao/ultimas`
- API: `GET /v1/movimentacao/ultimas`

Resposta:

- `itens`: objeto[]
  - `tipoOperacao`: string
  - `tipoMovimentacao`: string
  - `nomeProduto`: string
  - `instituicao`: string
  - `quantidade`: number
  - `precoUnitario`: number
  - `valorOperacao`: number
  - `vencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `dataMovimentacao`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `detalheStatusCode`: number
- `excecoes`: qualquer[]

### proventosResumoMensal

**Resumo mensal de proventos recebidos (card da página inicial)** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/resumo-mensal/recebidos`
- API: `GET /v1/proventos/recebidos/mensal`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dc` | string | não | Data de corte. Padrão: data da última carga.; formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- `dtInicial`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `dtFinal`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)

### carteiraResumo

**Resumo da carteira (card da página inicial)** — ✅ confirmado

- B3: `GET /negocio-home/api/home/v1/minha-carteira/resumo`
- API: `GET /v1/carteira/resumo`

Resposta:

- `data`: objeto
  - `variacaoPatrimonio`: objeto
    - `valorFormatado`: string
    - `porcentagemFormatada`: string
    - `porcentagemFormatado`: string — Sic: algumas rotas usam este nome
    - `positivo`: boolean
    - `quantidadeDias`: number
    - `semVariacao`: boolean
    - `semPatrimonio`: boolean
  - `insights`: objeto
    - `tipo`: string
    - `valorFormatado`: string

### carteiraTotalAcumulado

**Total acumulado da carteira** — ✅ confirmado

- B3: `GET /negocio-home/api/home/v1/minha-carteira/total-acumulado`
- API: `GET /v1/carteira/total-acumulado`

Resposta:

- `data`: objeto
  - `dataAtualizacao`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `instituicoes`: objeto[]
    - `documentoInstituicao`: string — Documento da instituição (só dígitos)
    - `nomeInstituicao`: string
    - `temIcone`: boolean
    - `urlIcone`: string
  - `totalAcumuladoFormatado`: string
  - `quantidadeTotalInstituicoes`: number
  - `variacaoPatrimonio`: objeto
    - `valorFormatado`: string
    - `porcentagemFormatada`: string
    - `porcentagemFormatado`: string — Sic: algumas rotas usam este nome
    - `positivo`: boolean
    - `quantidadeDias`: number
    - `semVariacao`: boolean
    - `semPatrimonio`: boolean

### carteiraInstituicoes

**Carteira por instituição** — ✅ confirmado

- B3: `GET /negocio-home/api/home/v1/minha-carteira/instituicao`
- API: `GET /v1/carteira/instituicoes`

Resposta:

- `data`: objeto
  - `dataAtualizacao`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `instituicoes`: objeto[]
    - `documentoInstituicao`: string — Documento da instituição (só dígitos)
    - `nomeInstituicao`: string
    - `temIcone`: boolean
    - `urlIcone`: string
  - `totalAcumuladoFormatado`: string
  - `variacaoPatrimonio`: objeto
    - `valorFormatado`: string
    - `porcentagemFormatada`: string
    - `porcentagemFormatado`: string — Sic: algumas rotas usam este nome
    - `positivo`: boolean
    - `quantidadeDias`: number
    - `semVariacao`: boolean
    - `semPatrimonio`: boolean
  - `categorias`: objeto[]
    - `id`: string
    - `nomeCategoriaProduto`: string
    - `porcentagem`: number
    - `porcentagemFormatada`: string
    - `valorFormatado`: string
  - `insights`: objeto
    - `tipo`: string
    - `valorFormatado`: string

### evolucaoPatrimonial

**Evolução patrimonial** — ✅ confirmado

- B3: `GET /negocio-home/api/home/v2/evolucao-patrimonial`
- API: `GET /v1/carteira/evolucao`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ap` | integer | não | Período (código numérico observado na home; semântica a confirmar) |
| `dc` | string | não | Data de corte. Padrão: data da última carga.; formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- `data`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `itens`: objeto[]
  - `data`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `valor`: number

### ultimasNegociacoes

**Últimas negociações (card da página inicial)** — 🟡 campos pendentes

- B3: `GET /negocio-home/api/home/v2/negociacao/ultimas-negociacoes`
- API: `GET /v1/negociacao/ultimas`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataFim` | string | não | Data no formato AAAA-MM-DD; formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- `iup`: boolean — abreviado; semântica a confirmar
- `upp`: string — abreviado; semântica a confirmar
- `tp`: number — abreviado; provável total de páginas
- `pa`: number — abreviado; provável página atual
- `sp`: number — abreviado; semântica a confirmar
- `it`: objeto (não mapeado)[] — abreviado; provável lista de itens

## Proventos

### proventos

**Proventos (dividendos, JCP, rendimentos) de um mês** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor`
- API: `GET /v1/proventos`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `mes` | integer | não | Mês (1–12) |
| `ano` | integer | não | Ano com 4 dígitos |

Resposta:

- objeto (não mapeado)[]

### proventosResumo

**Resumo de proventos do mês** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/resumo`
- API: `GET /v1/proventos/resumo`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `agrupamento` | integer | não | Só 1 é aceito (2 e 3 → 400); padrão `1` |
| `mes` | integer | não | Mês (1–12) |
| `ano` | integer | não | Ano com 4 dígitos |

Resposta:

- `datatInicial`: string — Sic: a B3 escreve "datatInicial"
- `dataFinal`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `dados`: objeto (não mapeado)[]

### proventosMeses

**Meses disponíveis para consulta de proventos** — ✅ confirmado

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/meses`
- API: `GET /v1/proventos/meses`

Resposta:

- `numeroMes`: number
- `nomeMes`: string

### proventosAnos

**Anos com proventos** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/anos`
- API: `GET /v1/proventos/anos`

Observações:

- Responde 204 (sem corpo) quando não há proventos.

Resposta:

- qualquer

### proventosTipos

**Tipos de investimento com proventos no mês** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/tipos-investimentos`
- API: `GET /v1/proventos/tipos-investimentos`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `mes` | integer | não | Mês (1–12) |
| `ano` | integer | não | Ano com 4 dígitos |

Resposta:

- objeto (não mapeado)[]

### proventosRecebidosResumo

**Total de proventos recebidos no mês mais recente** — ✅ confirmado

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/recebidos/resumo-proventos`
- API: `GET /v1/proventos/recebidos/resumo`

Resposta:

- `mesAno`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
- `totalDoMes`: number

### tiposEventos

**Tipos de evento provisionado (dividendo, JCP etc.)** — ✅ confirmado

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1.1/tipos-eventos`
- API: `GET /v1/proventos/tipos-eventos`

Resposta:

- `tiposEventos`: objeto[]
  - `id`: number | number[] — Sic: a B3 manda uma lista de números, não um número
  - `nomeTipoEvento`: string
- `detalheStatusCode`: number

## Investidor

### cadastro

**Dados cadastrais do investidor** — ✅ confirmado

- B3: `GET /negocio-investidor/api/investidor/v1.3/cadastro`
- API: `GET /v1/investidor/cadastro`

Observações:

- Contém dados pessoais. Nunca logue nem cole a resposta em issues.

Resposta:

- `nome`: string
- `documentoInvestidor`: string — CPF/CNPJ (só dígitos)
- `indicadorTipoPessoa`: number
- `codigoAtividadeEconomica`: string
- `numeroTelefoneWhatsApp`: string
- `avisoPorEmail`: boolean
- `notificaoNewsletter`: boolean — Sic: a B3 escreve "notificao"
- `notificacaoSTVM`: boolean
- `suitability`: objeto
  - `classificacaoCalculadaPerfilSuitability`: qualquer
  - `classificacaoEscolhidaPerfilSuitability`: qualquer
  - `notaSomadaPerfilSuitability`: qualquer
  - `dataRespostaSuitability`: qualquer
  - `solicitaPerfilSuitability`: boolean
- `instituicoes`: objeto[]
  - `id`: string
  - `descricao`: string
  - `contas`: objeto[]
    - `codigoContaInvestidor`: string
    - `codigoParticipante`: string
    - `codigoSistemaOrigem`: number
    - `emails`: objeto[]
      - `endereco`: string
      - `principal`: boolean

### perfil

**Perfil do investidor** — ✅ confirmado

- B3: `GET /negocio-investidor/api/investidor/v1/perfil`
- API: `GET /v1/investidor/perfil`

Resposta:

- `features`: objeto[]
  - `nome`: string

### menusDisponiveis

**Funcionalidades habilitadas para a conta** — ✅ confirmado

Mapa booleano de recursos (informe de rendimentos, calculadora de IR, transferência de ativos...).

- B3: `GET /negocio-investidor/api/investidor/v3/menus-disponiveis`
- API: `GET /v1/investidor/menus`

Resposta:

- objeto (não mapeado)

### instituicoes

**Instituições financeiras (id e nome)** — ✅ confirmado

- B3: `GET /negocio-investidor/api/investidor/v1/instituicoes`
- API: `GET /v1/investidor/instituicoes`

Resposta:

- `instituicoes`: objeto[]
  - `id`: string — Dígitos (CNPJ da instituição)
  - `descricao`: string

### tiposMovimentacoes

**Tipos de movimentação do extrato** — ✅ confirmado

- B3: `GET /negocio-investidor/api/investidor/v1/tipos-movimentacoes`
- API: `GET /v1/investidor/tipos-movimentacoes`

Resposta:

- `tiposMovimentacoes`: objeto[]
  - `id`: number
  - `descricao`: string
- `excecoes`: qualquer[]

## Mercado

### bridgewiseListaAtivos

**Lista de ativos do Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/lista-ativos`
- API: `GET /v1/mercado/bridgewise/lista-ativos`

Observações:

- Responde 204 (sem corpo), com ou sem `pagina`/`tamanho`: o formato da lista não foi visto. Para listar ativos, use `pesquisa-ativos`.

Resposta:

- objeto (não mapeado)[]

### bridgewisePesquisaAtivos

**Pesquisa de ativos por nome ou ticker** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/pesquisa-ativos`
- API: `GET /v1/mercado/bridgewise/pesquisa-ativos`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `busca` | string | sim | Parte do ticker ou do nome (ex.: PETR) |

Resposta:

- `data`: objeto[]
  - `totalAtivos`: number
  - `ativos`: objeto[]
    - `ticker`: string
    - `nome`: string
    - `precoAlvo`: string
    - `recomendacao`: objeto
      - `valor`: string
      - `descricao`: string
- `links`: objeto
  - `self`: string
  - `first`: string
  - `last`: string
- `meta`: objeto
  - `totalRecords`: number
  - `totalPages`: number

### bridgewiseCotacao

**Cotação, variações e série de preços do ativo** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/cotacao`
- API: `GET /v1/mercado/bridgewise/cotacao`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker, como devolvido por `pesquisa-ativos` (ex.: PETR3) |

Observações:

- O `{id}` da B3 aceita o ticker direto.

Resposta:

- `data`: objeto
  - `recomendacao`: objeto
    - `valor`: string
    - `descricao`: string
  - `precoFechamento`: objeto
    - `valor`: string
    - `variacao`: string
    - `positivo`: boolean
  - `periodos`: objeto[]
    - `nome`: string
    - `variacao`: string
    - `positivo`: boolean
  - `dadosGrafico`: objeto[]
    - `data`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
    - `preco`: number
    - `precoFormatado`: string
  - `descricao`: string
  - `marketCap`: string
  - `volumeMedio`: string
  - `beta`: string
  - `dividendYield`: string
  - `crescimentoReceita`: string
  - `indicePL`: string

### bridgewiseDadosAtivo

**Setor, indústria e indicadores do ativo** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/dados-ativo`
- API: `GET /v1/mercado/bridgewise/dados-ativo`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker (ex.: PETR3) |

Resposta:

- `data`: objeto[]
  - `setor`: string
  - `industria`: string
  - `marketCap`: string
  - `dividendYield`: string
  - `volumeMedio`: string
  - `crescimentoReceita`: string
  - `beta`: string
  - `indicePL`: string
- `links`: objeto
  - `self`: string
  - `first`: string
  - `last`: string
- `meta`: objeto
  - `totalRecords`: number
  - `totalPages`: number

### bridgewiseDesempenho

**Desempenho do ativo por trimestre** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/desempenho`
- API: `GET /v1/mercado/bridgewise/desempenho`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker (ex.: PETR3) |

Resposta:

- `data`: objeto[]
  - `dataAnalise`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)
  - `trimestreAnalise`: string
  - `variacao`: string
  - `resumo`: string
- `links`: objeto
  - `self`: string
  - `first`: string
  - `last`: string
- `meta`: objeto
  - `totalRecords`: number
  - `totalPages`: number

### bridgewiseComparativo

**Ativo comparado aos do mesmo setor** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/comparativo`
- API: `GET /v1/mercado/bridgewise/comparativo`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker (ex.: PETR3) |

Resposta:

- `data`: objeto
  - `ticker`: string
  - `nome`: string
  - `recomendacao`: objeto
    - `valor`: string
    - `descricao`: string
  - `marketCap`: string
  - `indicePL`: string
  - `roe`: string
  - `dividendYield`: string
  - `ativosSetor`: objeto[]
    - `ticker`: string
    - `nome`: string
    - `recomendacao`: objeto
      - `valor`: string
      - `descricao`: string
    - `marketCap`: string
    - `indicePL`: string
    - `roe`: string
    - `dividendYield`: string
  - `mediaSetor`: objeto
    - `recomendacao`: objeto
      - `valor`: string
      - `descricao`: string
    - `marketCap`: string
    - `indicePL`: string
    - `roe`: string
    - `dividendYield`: string

### bridgewiseAnaliseFundamentalista

**Análise fundamentalista: DRE, fluxo de caixa, balanço, ESG** — ✅ confirmado

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-fundamentalista`
- API: `GET /v1/mercado/bridgewise/analise-fundamentalista`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker (ex.: PETR3) |
| `periodoCotacao` | string | não | Período da cotação; os valores aceitos ainda não foram mapeados |

Resposta:

- `data`: objeto[]
  - `analiseFundamentalista`: objeto
    - `descricao`: string
    - `valor`: string
  - `metaPreco`: string
  - `potencialAlta`: objeto
    - `valor`: string
    - `positivo`: boolean
  - `dre`: objeto
    - `descricao`: string
    - `valor`: string
    - `resumo`: string
  - `fluxoCaixa`: objeto
    - `descricao`: string
    - `valor`: string
    - `resumo`: string
  - `balancoPatrimonial`: objeto
    - `descricao`: string
    - `valor`: string
    - `resumo`: string
  - `forcaSetor`: objeto
    - `descricao`: string
    - `valor`: string
  - `esg`: objeto
    - `descricao`: string
    - `valor`: string
- `links`: objeto
  - `self`: string
  - `first`: string
  - `last`: string
- `meta`: objeto
  - `totalRecords`: number
  - `totalPages`: number

### bridgewiseAnaliseTecnica

**Análise técnica: suporte, resistência e tendência** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-tecnica`
- API: `GET /v1/mercado/bridgewise/analise-tecnica`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Ticker (ex.: PETR3) |
| `periodoCotacao` | string | não | Período da cotação; os valores aceitos ainda não foram mapeados |

Observações:

- Responde 206 (conteúdo parcial). `tendenciaPreco` e `momentosMercado` vieram vazios.

Resposta:

- `data`: objeto[]
  - `analiseTecnica`: string
  - `precoFechamento`: objeto
    - `valor`: string
    - `variacao`: string
    - `positivo`: boolean
  - `suporte`: string
  - `resistencia`: string
  - `descricao`: string
  - `tendenciaPreco`: objeto (não mapeado)[] — Veio vazio nas consultas feitas; campos ainda não mapeados
  - `momentosMercado`: objeto (não mapeado)[] — Veio vazio nas consultas feitas; campos ainda não mapeados
- `links`: objeto
  - `self`: string
  - `first`: string
  - `last`: string
- `meta`: objeto
  - `totalRecords`: number
  - `totalPages`: number

## Renda Fixa

### calcRFTitulosPublicos

**Títulos públicos (Tesouro) da calculadora de renda fixa** — ✅ confirmado

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-publicos`
- API: `GET /v1/renda-fixa/titulos-publicos`

Resposta:

- `data`: objeto[]
  - `idSelic`: number
  - `emissor`: string
  - `metodo`: string
  - `dataExpiracao`: string
  - `habilitarProjecao`: boolean

### calcRFTitulosDebentures

**Debêntures da calculadora de renda fixa** — ✅ confirmado

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-debentures`
- API: `GET /v1/renda-fixa/debentures`

Resposta:

- `data`: objeto[]
  - `codigoTitulo`: string
  - `habilitarProjecao`: boolean
  - `dataVencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)

### calcRFTitulosCRA

**CRA da calculadora de renda fixa** — ✅ confirmado

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cra`
- API: `GET /v1/renda-fixa/cra`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Data de início (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |
| `dataFim` | string | não | Data de fim (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- `data`: objeto[]
  - `codigoTitulo`: string
  - `habilitarProjecao`: boolean
  - `dataVencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)

### calcRFTitulosCRI

**CRI da calculadora de renda fixa** — ✅ confirmado

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cri`
- API: `GET /v1/renda-fixa/cri`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Data de início (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- `data`: objeto[]
  - `codigoTitulo`: string
  - `habilitarProjecao`: boolean
  - `dataVencimento`: string — Data ISO sem fuso (AAAA-MM-DDT00:00:00)

## Transferência

### transferenciaListadosBalcao

**Solicitações de transferência de ativos listados em balcão** — 🟡 campos pendentes

- B3: `GET /api/transferencia-ativos/v3/solicitacoes/listados-balcao`
- API: `GET /v1/transferencia/listados-balcao`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `pagina` | integer | não | Página da consulta; padrão `1` |
| `qtdRegistros` | integer | não | Quantidade de registros por página |

Observações:

- Responde 200 com lista vazia para quem não tem solicitações; os campos dos itens não foram vistos.

Resposta:

- objeto (não mapeado)[]
