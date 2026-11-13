# Relatório de Implementação: 20 Rotas de Dados da B3

Data: 13/11/2026  
Ambiente: Windows (dev local)  
Status da Sessão: Sem sessão ativa (`no_session`). Conforme regra inegociável do briefing, o login/código/CAPTCHA não foi forçado.

---

## 1. Tabela das 20 Rotas Implementadas

| # | Rota B3 | Rota API Local | ID | Status | HTTP | Observação |
|---|---|---|---|:---:|:---:|---|
| 1 | `/negocio-empresa/api/empresa/v1/bridgewise/lista-ativos` | `/v1/mercado/bridgewise/lista-ativos` | `bridgewiseListaAtivos` | 🟡 | — | Lista geral de ativos suportados no módulo Bridgewise. Schema aberto (`ListaNaoMapeada`). |
| 2 | `/negocio-empresa/api/empresa/v1/bridgewise/pesquisa-ativos` | `/v1/mercado/bridgewise/pesquisa-ativos` | `bridgewisePesquisaAtivos` | 🟡 | — | Busca textual por ticker/nome (`busca`). |
| 3 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/cotacao` | `/v1/mercado/bridgewise/cotacao` | `bridgewiseCotacao` | 🟡 | — | Cotação atual do ativo substituindo `{id}` na URI. |
| 4 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/dados-ativo` | `/v1/mercado/bridgewise/dados-ativo` | `bridgewiseDadosAtivo` | 🟡 | — | Dados cadastrais e fundamentais consolidados do ativo. |
| 5 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/desempenho` | `/v1/mercado/bridgewise/desempenho` | `bridgewiseDesempenho` | 🟡 | — | Histórico de rentabilidade/desempenho do ativo. |
| 6 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/comparativo` | `/v1/mercado/bridgewise/comparativo` | `bridgewiseComparativo` | 🟡 | — | Comparativo do ativo contra pares de mercado. |
| 7 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-fundamentalista` | `/v1/mercado/bridgewise/analise-fundamentalista` | `bridgewiseAnaliseFundamentalista` | 🟡 | — | Indicadores fundamentalistas com filtro opcional `periodoCotacao`. |
| 8 | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-tecnica` | `/v1/mercado/bridgewise/analise-tecnica` | `bridgewiseAnaliseTecnica` | 🟡 | — | Indicadores técnicos e sinais com filtro opcional `periodoCotacao`. |
| 9 | `/negocio-rendafixa/api/rendafixa/v1/ativos` | `/v1/renda-fixa/ativos` | `rendaFixaAtivos` | 🟡 | — | Catálogo de ativos de renda fixa (`CodigoInstrumento`, `Pagina`, `TamanhoPagina`). |
| 10 | `/negocio-rendafixa/api/rendafixa/v1/negocio-consolidado` | `/v1/renda-fixa/negocio-consolidado` | `rendaFixaNegocioConsolidado` | 🟡 | — | Negócios consolidados no mercado de renda fixa por data (`DataNegocio`, `Pagina`). |
| 11 | `/negocio-rendafixa/api/rendafixa/v1/negocio-a-negocio` | `/v1/renda-fixa/negocio-a-negocio` | `rendaFixaNegocioANegocio` | 🟡 | — | Negócios em tempo real operação a operação (tick por tick). |
| 12 | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-publicos` | `/v1/renda-fixa/calculadora/titulos-publicos` | `calcRFTitulosPublicos` | 🟡 | — | Parâmetros de títulos públicos (Tesouro) para calculadora de PU. |
| 13 | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-debentures` | `/v1/renda-fixa/calculadora/titulos-debentures` | `calcRFTitulosDebentures` | 🟡 | — | Parâmetros de debêntures para calculadora de PU. |
| 14 | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cra` | `/v1/renda-fixa/calculadora/titulos-cra` | `calcRFTitulosCRA` | 🟡 | — | Parâmetros de títulos CRA (`dataInicio`, `dataFim`). |
| 15 | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cri` | `/v1/renda-fixa/calculadora/titulos-cri` | `calcRFTitulosCRI` | 🟡 | — | Parâmetros de títulos CRI (`dataInicio`). |
| 16 | `/negocio-calcrf/api/calcrf/v1/calculadora-pu/realizar-calculo-pu` | `/v1/renda-fixa/calculadora/calculo-pu` | `calcRFCalculoPU` | 🟡 | — | Simulação e cálculo de preço unitário de renda fixa. |
| 17 | `/api/transferencia-ativos/v3/solicitacoes/listados-balcao` | `/v1/transferencia/listados-balcao` | `transferenciaListadosBalcao` | 🟡 | 200 | Solicitações de transferência de ativos listados e balcão (`pagina`, `qtdRegistros`). Confirmado status 200 em discover anterior. |
| 18 | `/negocio-investidor/api/investidor/v1/instituicoes` | `/v1/investidor/instituicoes` | `instituicoes` | 🟡 | — | Tabela de instituições participantes homologadas pela B3. |
| 19 | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1.1/tipos-eventos` | `/v1/proventos/tipos-eventos` | `tiposEventos` | 🟡 | — | Tabela e classificação de tipos de eventos corporativos provisionados. |
| 20 | `/negocio-investidor/api/investidor/v1/tipos-movimentacoes` | `/v1/investidor/tipos-movimentacoes` | `tiposMovimentacoes` | 🟡 | — | Tabela de códigos e descrições de movimentações do extrato. |

**Totais desta entrega**:
- 20 rotas integradas (todas 🟡 por ausência de sessão ao vivo para captura de shapes).
- 0 rotas ⛔ (nenhum bloqueio estrutural impeditivo).
- 0 rotas ✅ plenamente confirmadas (requerem sessão ao vivo para fechamento dos campos dos schemas).

---

## 2. O que ficou pendente e por quê

- **Sessão da B3 ausente**: A execução de `b3 probe` resultou em `Erro de autenticação (no_session)`. Conforme regra inegociável do projeto, em nenhuma hipótese o agente deve contornar o login da B3, gerar/adivinhar CAPTCHA ou tentar obter o código de autenticação multifator enviado por e-mail (responsabilidade exclusiva do proprietário da conta).
- **Shapes e campos internos**: Como não foi possível realizar probes ao vivo contra a API de produção da B3, os schemas foram registrados como abertos (`S.NaoMapeado` e `S.ListaNaoMapeada`) para não inventar propriedades inexistentes.
- **Estrutura entregue**:
  - Registro de todas as 20 rotas em `packages/core/src/endpoints.ts`.
  - Tratamento correto de parâmetros de query e path (`{id}` substituído na URI).
  - Exposição em OpenAPI/Swagger no Fastify (`packages/server`).
  - Suporte CLI via `b3 endpoints`.
  - Testes sintéticos unitários para todos os 4 grupos em `packages/core/test/client.test.ts`.
  - Documentação atualizada em `docs/endpoints.md` e `docs/mapa-rotas.md`.

---

## 3. Perguntas em aberto

1. **Identificadores Bridgewise**: Os endpoints `/{id}/cotacao`, `/{id}/dados-ativo`, etc. aceitam o ticker direto (ex.: `PETR4`, `VALE3`) ou exigem um código interno numérico obtido via `/lista-ativos` ou `/pesquisa-ativos`?
2. **Autenticação Bridgewise**: Existe necessidade de chave própria (`/bridgewise/access-token`) ou o Bearer token B2C geral é suficiente para consumo dessas rotas?
3. **Case Sensitivity em Renda Fixa**: Os parâmetros `CodigoInstrumento`, `Pagina`, `TamanhoPagina` e `DataNegocio` na rota `/negocio-rendafixa` são estritamente PascalCase na API de backend .NET da B3 ou suportam camelCase?
4. **Calculadora e Datas Futuras**: As rotas de cálculo de renda fixa (`/negocio-calcrf/api/calcrf/v1/titulos/...`) aceitam datas futuras (`dataFim`) para projeções de PU ou são restritas à data da última carga da B3?

---

## 4. Comandos para reproduzir

```bash
# Rodar todos os testes unitários sintéticos (31 testes verdes)
pnpm test

# Validação estática de tipos TypeScript
pnpm typecheck

# Conferir integridade da documentação gerada
pnpm docs:check

# Listar todas as 40 rotas registradas na CLI
pnpm b3 endpoints

# Quando uma sessão válida for fornecida via `b3 login`, capturar shapes:
pnpm b3 shapes bridgewiseListaAtivos rendaFixaAtivos transferenciaListadosBalcao
```

---

*Documentado por: agy (Gemini 3.8 Flash) — 2026-11-13.*
