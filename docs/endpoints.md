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
