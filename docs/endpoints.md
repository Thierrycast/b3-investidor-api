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
| 🟡 | [`bridgewiseListaAtivos`](#bridgewiselistaativos) | `/v1/mercado/bridgewise/lista-ativos` | Lista de ativos disponíveis no Bridgewise |
| 🟡 | [`bridgewisePesquisaAtivos`](#bridgewisepesquisaativos) | `/v1/mercado/bridgewise/pesquisa-ativos` | Pesquisa de ativos no Bridgewise |
| 🟡 | [`bridgewiseCotacao`](#bridgewisecotacao) | `/v1/mercado/bridgewise/cotacao` | Cotação de ativo no Bridgewise |
| 🟡 | [`bridgewiseDadosAtivo`](#bridgewisedadosativo) | `/v1/mercado/bridgewise/dados-ativo` | Dados cadastrais e gerais do ativo no Bridgewise |
| 🟡 | [`bridgewiseDesempenho`](#bridgewisedesempenho) | `/v1/mercado/bridgewise/desempenho` | Desempenho histórico do ativo no Bridgewise |
| 🟡 | [`bridgewiseComparativo`](#bridgewisecomparativo) | `/v1/mercado/bridgewise/comparativo` | Comparativo de ativos no Bridgewise |
| 🟡 | [`bridgewiseAnaliseFundamentalista`](#bridgewiseanalisefundamentalista) | `/v1/mercado/bridgewise/analise-fundamentalista` | Análise fundamentalista do ativo no Bridgewise |
| 🟡 | [`bridgewiseAnaliseTecnica`](#bridgewiseanalisetecnica) | `/v1/mercado/bridgewise/analise-tecnica` | Análise técnica do ativo no Bridgewise |
| 🟡 | [`rendaFixaAtivos`](#rendafixaativos) | `/v1/renda-fixa/ativos` | Lista de ativos de renda fixa |
| 🟡 | [`rendaFixaNegocioConsolidado`](#rendafixanegocioconsolidado) | `/v1/renda-fixa/negocio-consolidado` | Negócios consolidados de renda fixa |
| 🟡 | [`rendaFixaNegocioANegocio`](#rendafixanegocioanegocio) | `/v1/renda-fixa/negocio-a-negocio` | Negócios operação a operação de renda fixa |
| 🟡 | [`calcRFTitulosPublicos`](#calcrftitulospublicos) | `/v1/renda-fixa/calculadora/titulos-publicos` | Lista de títulos públicos da calculadora de renda fixa |
| 🟡 | [`calcRFTitulosDebentures`](#calcrftitulosdebentures) | `/v1/renda-fixa/calculadora/titulos-debentures` | Lista de debêntures da calculadora de renda fixa |
| 🟡 | [`calcRFTitulosCRA`](#calcrftituloscra) | `/v1/renda-fixa/calculadora/titulos-cra` | Lista de títulos CRA da calculadora de renda fixa |
| 🟡 | [`calcRFTitulosCRI`](#calcrftituloscri) | `/v1/renda-fixa/calculadora/titulos-cri` | Lista de títulos CRI da calculadora de renda fixa |
| 🟡 | [`calcRFCalculoPU`](#calcrfcalculopu) | `/v1/renda-fixa/calculadora/calculo-pu` | Cálculo de preço unitário (PU) de renda fixa |
| 🟡 | [`transferenciaListadosBalcao`](#transferencialistadosbalcao) | `/v1/transferencia/listados-balcao` | Solicitações de ativos listados em balcão |
| 🟡 | [`instituicoes`](#instituicoes) | `/v1/investidor/instituicoes` | Tabela de instituições financeiras habilitadas |
| 🟡 | [`tiposEventos`](#tiposeventos) | `/v1/proventos/tipos-eventos` | Tabela de tipos de eventos provisionados |
| 🟡 | [`tiposMovimentacoes`](#tiposmovimentacoes) | `/v1/investidor/tipos-movimentacoes` | Tabela de tipos de movimentações de extrato |

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

**Tabela de tipos de eventos provisionados** — 🟡 campos pendentes

- B3: `GET /negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1.1/tipos-eventos`
- API: `GET /v1/proventos/tipos-eventos`

Resposta:

- objeto (não mapeado)[]

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

**Tabela de instituições financeiras habilitadas** — 🟡 campos pendentes

- B3: `GET /negocio-investidor/api/investidor/v1/instituicoes`
- API: `GET /v1/investidor/instituicoes`

Resposta:

- objeto (não mapeado)[]

### tiposMovimentacoes

**Tabela de tipos de movimentações de extrato** — 🟡 campos pendentes

- B3: `GET /negocio-investidor/api/investidor/v1/tipos-movimentacoes`
- API: `GET /v1/investidor/tipos-movimentacoes`

Resposta:

- objeto (não mapeado)[]

## Mercado

### bridgewiseListaAtivos

**Lista de ativos disponíveis no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/lista-ativos`
- API: `GET /v1/mercado/bridgewise/lista-ativos`

Resposta:

- objeto (não mapeado)[]

### bridgewisePesquisaAtivos

**Pesquisa de ativos no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/pesquisa-ativos`
- API: `GET /v1/mercado/bridgewise/pesquisa-ativos`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `busca` | string | sim | Termo para pesquisa de ativos |

Resposta:

- objeto (não mapeado)[]

### bridgewiseCotacao

**Cotação de ativo no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/cotacao`
- API: `GET /v1/mercado/bridgewise/cotacao`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |

Resposta:

- objeto (não mapeado)

### bridgewiseDadosAtivo

**Dados cadastrais e gerais do ativo no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/dados-ativo`
- API: `GET /v1/mercado/bridgewise/dados-ativo`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |

Resposta:

- objeto (não mapeado)

### bridgewiseDesempenho

**Desempenho histórico do ativo no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/desempenho`
- API: `GET /v1/mercado/bridgewise/desempenho`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |

Resposta:

- objeto (não mapeado)

### bridgewiseComparativo

**Comparativo de ativos no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/comparativo`
- API: `GET /v1/mercado/bridgewise/comparativo`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |

Resposta:

- objeto (não mapeado)

### bridgewiseAnaliseFundamentalista

**Análise fundamentalista do ativo no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-fundamentalista`
- API: `GET /v1/mercado/bridgewise/analise-fundamentalista`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |
| `periodoCotacao` | string | não | Período da cotação |

Resposta:

- objeto (não mapeado)

### bridgewiseAnaliseTecnica

**Análise técnica do ativo no Bridgewise** — 🟡 campos pendentes

- B3: `GET /negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-tecnica`
- API: `GET /v1/mercado/bridgewise/analise-tecnica`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim | Identificador do ativo / ticker |
| `periodoCotacao` | string | não | Período da cotação |

Resposta:

- objeto (não mapeado)

## Renda Fixa

### rendaFixaAtivos

**Lista de ativos de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-rendafixa/api/rendafixa/v1/ativos`
- API: `GET /v1/renda-fixa/ativos`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CodigoInstrumento` | string | não | Código do instrumento financeiro |
| `Pagina` | integer | não | Página da consulta; padrão `1` |
| `TamanhoPagina` | integer | não | Quantidade de itens por página |

Resposta:

- objeto (não mapeado)

### rendaFixaNegocioConsolidado

**Negócios consolidados de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-rendafixa/api/rendafixa/v1/negocio-consolidado`
- API: `GET /v1/renda-fixa/negocio-consolidado`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `DataNegocio` | string | não | Data do negócio (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |
| `Pagina` | integer | não | Página da consulta; padrão `1` |

Resposta:

- objeto (não mapeado)

### rendaFixaNegocioANegocio

**Negócios operação a operação de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-rendafixa/api/rendafixa/v1/negocio-a-negocio`
- API: `GET /v1/renda-fixa/negocio-a-negocio`

Resposta:

- objeto (não mapeado)

### calcRFTitulosPublicos

**Lista de títulos públicos da calculadora de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-publicos`
- API: `GET /v1/renda-fixa/calculadora/titulos-publicos`

Resposta:

- objeto (não mapeado)[]

### calcRFTitulosDebentures

**Lista de debêntures da calculadora de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-debentures`
- API: `GET /v1/renda-fixa/calculadora/titulos-debentures`

Resposta:

- objeto (não mapeado)[]

### calcRFTitulosCRA

**Lista de títulos CRA da calculadora de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cra`
- API: `GET /v1/renda-fixa/calculadora/titulos-cra`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Data de início (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |
| `dataFim` | string | não | Data de fim (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- objeto (não mapeado)[]

### calcRFTitulosCRI

**Lista de títulos CRI da calculadora de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cri`
- API: `GET /v1/renda-fixa/calculadora/titulos-cri`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicio` | string | não | Data de início (AAAA-MM-DD); formato `^\d{4}-\d{2}-\d{2}$` |

Resposta:

- objeto (não mapeado)[]

### calcRFCalculoPU

**Cálculo de preço unitário (PU) de renda fixa** — 🟡 campos pendentes

- B3: `GET /negocio-calcrf/api/calcrf/v1/calculadora-pu/realizar-calculo-pu`
- API: `GET /v1/renda-fixa/calculadora/calculo-pu`

Resposta:

- objeto (não mapeado)

## Transferência

### transferenciaListadosBalcao

**Solicitações de ativos listados em balcão** — 🟡 campos pendentes

- B3: `GET /api/transferencia-ativos/v3/solicitacoes/listados-balcao`
- API: `GET /v1/transferencia/listados-balcao`

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `pagina` | integer | não | Página da consulta; padrão `1` |
| `qtdRegistros` | integer | não | Quantidade de registros por página |

Observações:

- Observado status 200 na navegação ao vivo do portal.

Resposta:

- objeto (não mapeado)
