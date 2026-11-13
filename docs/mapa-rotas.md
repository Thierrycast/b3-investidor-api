# Mapa de rotas da Área do Investidor

Levantado em 13/11/2026 por dois caminhos:
- **estático**: caminhos de API extraídos dos bundles JS públicos dos 21 micro-frontends (`/assets/mf.manifest.json`);
- **ao vivo**: `b3 discover` + navegação somente leitura pelas telas, com status HTTP observado.

Só nomes de rota e de parâmetro; nenhum valor. Este mapa é a base para implementar rotas novas no registro (`packages/core/src/endpoints.ts`).

Legenda:

| Marca | Significado |
|---|---|
| ✅ `id` | já está no registro do projeto |
| 🟢 | vista ao vivo; o status vem entre colchetes |
| 📄 | só no código do portal; ainda não chamada |
| ✋ | escrita (POST/PUT/PATCH): fora do escopo, porque o projeto é só leitura |

O prefixo `{servico}` indica que o serviço (`negocio-…`) não foi identificado no código; os relatórios (`api/relatorio/…`) parecem ser servidos pelo serviço de cada extrato.
Telas que carregaram na navegação: `/extrato/{movimentacao,negociacao,eventos-provisionados,ofertas-publicas}`, `/minha-carteira/{visao-geral,investimentos,acompanhar-mercado}`, `/proventos/{visao-geral,recebidos,receber,calendario,radar}`, `/relatorios/{mensal-consolidado,informes}`, `/voto-a-distancia/{boletim,historico}`, `/clube-b3`, `/renda-fixa`, `/renda-fixa/ativos`, `/publicacoes`, `/calculadora-renda-fixa`, `/calculadoras-ir`, `/portabilidade/minhas-solicitacoes`, `/minha-conta/central-de-notificacoes`.

## clube

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET/PUT | `/{servico}/api/clube/v1/campanhas` | — |
| 📄 | GET/PUT | `/{servico}/api/clube/v1/campanhas/respostas-campanha` | — |

## relatorio

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/{servico}/api/relatorio/v1.1/documento/garantias` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1.1/documento/movimentacao` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1.1/planilha/garantias` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1.1/planilha/movimentacao` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1.4/documento/eventos-provisionados` | `dataReferencia` |
| 📄 | GET | `/{servico}/api/relatorio/v1.4/planilha/eventos-provisionados` | `dataReferencia` |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/extrato-anual-consolidado` | — |
| 📄 | ? | `/{servico}/api/relatorio/v1/documento/extrato-mensal-consolidado` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/informes/informe-rendimentos` | `idCarga` `identificadorInforme` |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/negociacao-ativos` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/negociacao-ativos/resumo` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/ofertas-publicas` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/posicao` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/documento/proventos-recebidos` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/download/documento` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/download/planilha` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/calendario-eventos/proventos` | `dr` `fp` `p` `pagina` `tamanhoPagina` `tp` |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/extrato-anual-consolidado` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/extrato-mensal-consolidado` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/negociacao-ativos` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/negociacao-ativos/resumo` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/ofertas-publicas` | — |
| 📄 | GET | `/{servico}/api/relatorio/v1/planilha/proventos-recebidos` | — |
| 📄 | GET | `/{servico}/api/relatorio/v2/planilha/posicao` | — |

## v3

| | Método | Rota | Parâmetros |
|---|---|---|---|
| ✅ `transferenciaListadosBalcao` | GET | `/api/transferencia-ativos/v3/solicitacoes/listados-balcao` | `pagina` `qtdRegistros` |

## calcrf

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | ? | `/negocio-calcrf/api/calcrf/v1/calculadora-di/lista-periodo-disponivel` | — |
| 📄 | ? | `/negocio-calcrf/api/calcrf/v1/calculadora-di/realizar-calculo-di` | — |
| ✅ `calcRFCalculoPU` | GET | `/negocio-calcrf/api/calcrf/v1/calculadora-pu/realizar-calculo-pu` | — |
| 📄 | ? | `/negocio-calcrf/api/calcrf/v1/calculadora-rendimento/realizar-calculo-rendimento` | — |
| 📄 | ? | `/negocio-calcrf/api/calcrf/v1/titulos` | — |
| ✅ `calcRFTitulosCRA` | GET | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cra` | `dataFim` `dataInicio` |
| ✅ `calcRFTitulosCRI` | GET | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-cri` | `dataInicio` |
| ✅ `calcRFTitulosDebentures` | GET | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-debentures` | — |
| ✅ `calcRFTitulosPublicos` | GET | `/negocio-calcrf/api/calcrf/v1/titulos/lista-titulos-publicos` | — |

## empresa

| | Método | Rota | Parâmetros |
|---|---|---|---|
| ✅ `bridgewiseAnaliseFundamentalista` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-fundamentalista` | `periodoCotacao` |
| ✅ `bridgewiseAnaliseTecnica` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/analise-tecnica` | `periodoCotacao` |
| ✅ `bridgewiseComparativo` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/comparativo` | — |
| ✅ `bridgewiseCotacao` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/cotacao` | — |
| ✅ `bridgewiseDadosAtivo` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/dados-ativo` | — |
| ✅ `bridgewiseDesempenho` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/{id}/desempenho` | — |
| 📄 | GET | `/negocio-empresa/api/empresa/v1/bridgewise/access-token` | `codChave` `pagina` `tamanho` |
| ✅ `bridgewiseListaAtivos` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/lista-ativos` | — |
| ✅ `bridgewisePesquisaAtivos` | GET | `/negocio-empresa/api/empresa/v1/bridgewise/pesquisa-ativos` | `busca` |
| 📄 | GET/POST | `/negocio-empresa/api/empresa/v1/empresa/consultar-aceite` | `codChave` `pagina` `tamanho` |
| 📄 | GET/POST | `/negocio-empresa/api/empresa/v1/empresa/consultar-ativos` | `codChave` `pagina` `tamanho` |
| 📄 | GET/POST | `/negocio-empresa/api/empresa/v1/empresa/salvar-aceite` | `codChave` `pagina` `tamanho` |

## extrato-eventos-provisionados

| | Método | Rota | Parâmetros |
|---|---|---|---|
| ✅ `tiposEventos` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1.1/tipos-eventos` | — |
| ✅ `proventos` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor` | `ano` `mes` |
| ✅ `proventosAnos` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/anos` | `agrupamento` `ano` `codigoTipoProduto` `mes` |
| ✅ `proventosMeses` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/meses` | `agrupamento` `ano` `mes` |
| 📄 | ? | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/produtos` | — |
| ✅ `proventosResumo` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/resumo` | `agrupamento` `ano` `mes` |
| 📄 | ? | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/tipos-eventos` | — |
| ✅ `proventosTipos` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/proventos/investidor/tipos-investimentos` | `ano` `mes` |
| 🟢 [200] | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/recebidos` | `dtf` `dti` `p` `tp` |
| ✅ `proventosRecebidosResumo` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/recebidos/resumo-proventos` | — |
| ✅ `proventosResumoMensal` | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/resumo-mensal/recebidos` | `dc` |
| 📄 | ? | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/tipos-eventos` | — |
| 📄 | ? | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v1/tipos-eventos/provisionado` | — |
| 🟢 [200] | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v2/calendario-eventos/investidor` | `ap` `ipc` `p` `tp` |
| 🟢 [200] | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v2/calendario-eventos/proventos` | `dr` `pagina` `tamanhoPagina` |
| 🟢 [200] | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v2/receber` | `data` `filtroEventosProvisionados` `pagina` |
| 📄 | GET | `/negocio-eventosprovisionados/api/extrato-eventos-provisionados/v2/receber/detalhes` | — |

## extrato-garantias

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-garantias/api/extrato-garantias/v1.2/garantias` | — |

## home

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | ? | `/negocio-home/api/home/v1/minha-carteira` | — |
| ✅ `carteiraInstituicoes` | GET | `/negocio-home/api/home/v1/minha-carteira/instituicao` | `documentoInstituicao` |
| ✅ `carteiraResumo` | GET | `/negocio-home/api/home/v1/minha-carteira/resumo` | — |
| ✅ `carteiraTotalAcumulado` | GET | `/negocio-home/api/home/v1/minha-carteira/total-acumulado` | — |
| ✅ `evolucaoPatrimonial` | GET | `/negocio-home/api/home/v2/evolucao-patrimonial` | `ap` `dc` |
| 📄 | GET | `/negocio-home/api/home/v2/minha-carteira` | `ap` `dc` |
| 📄 | GET | `/negocio-home/api/home/v2/minha-carteira/porcentagem-ativo` | `ap` `dataReferencia` `dc` `listaTipoProduto` |
| ✅ `ultimasNegociacoes` | GET | `/negocio-home/api/home/v2/negociacao/ultimas-negociacoes` | `dataFim` |
| 🟢 [200] | GET | `/negocio-home/api/home/v3/minha-carteira` | `agrupamento` `quantidadeItensAgrupamento` |

## informes

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 🟢 [200] | GET | `/negocio-informerendimentos/api/informes/v1/informe-rendimentos` | `idCarga` |

## investidor

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 🟢 [200] | PUT/GET | `/negocio-investidor/api/investidor/v1.1/cadastro/aplicativos` | — |
| 📄 | ? | `/negocio-investidor/api/investidor/v1.1/cadastro/configuracao` | — |
| ✋ | POST | `/negocio-investidor/api/investidor/v1.1/feedback` | — |
| ✅ `cadastro` | GET | `/negocio-investidor/api/investidor/v1.3/cadastro` | — |
| 📄 | ? | `/negocio-investidor/api/investidor/v1.3/menus-disponiveis` | — |
| ✋ | POST | `/negocio-investidor/api/investidor/v1/autorizacao/calculadora-ir` | — |
| 📄 | PUT/GET | `/negocio-investidor/api/investidor/v1/cadastro/aplicativos` | — |
| 📄 | GET/PATCH | `/negocio-investidor/api/investidor/v1/cadastro/email-conta/quarentena` | — |
| ✅ `instituicoes` | GET | `/negocio-investidor/api/investidor/v1/instituicoes` | — |
| 📄 | ? | `/negocio-investidor/api/investidor/v1/instituicoes/simplificada` | — |
| 📄 | GET | `/negocio-investidor/api/investidor/v1/mcp/aplicativos` | — |
| 📄 | GET | `/negocio-investidor/api/investidor/v1/notificacoes/leitura` | `lido` `quantidadeNotificacoes` `ultimaRowkey` |
| ✅ `perfil` | GET | `/negocio-investidor/api/investidor/v1/perfil` | — |
| 📄 | ? | `/negocio-investidor/api/investidor/v1/produtos` | — |
| 📄 | GET | `/negocio-investidor/api/investidor/v1/produtos/carteira-atual` | — |
| 📄 | PUT/GET | `/negocio-investidor/api/investidor/v1/solicitacoes` | — |
| ✅ `tiposMovimentacoes` | GET | `/negocio-investidor/api/investidor/v1/tipos-movimentacoes` | — |
| 🟢 [200] | GET | `/negocio-investidor/api/investidor/v2/banner` | `quantidadeItens` `tipoBanner` |
| ✋ | POST/PATCH | `/negocio-investidor/api/investidor/v2/cadastro/configuracao/whats-app` | — |
| ✋ | POST/PATCH | `/negocio-investidor/api/investidor/v2/opt-in-whats-app/codigo` | — |
| ✅ `menusDisponiveis` | GET | `/negocio-investidor/api/investidor/v3/menus-disponiveis` | — |
| 🟢 [200] | GET | `/negocio-investidor/api/investidor/v3/notificacoes` | `lido` `quantidadeNotificacoes` |

## extrato-movimentacao

| | Método | Rota | Parâmetros |
|---|---|---|---|
| ✅ `movimentacao` | GET | `/negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao` | `dataFim` `dataInicio` `pagina` |
| ✅ `movimentacaoUltimas` | GET | `/negocio-movimentacao/api/extrato-movimentacao/v2/movimentacao/ultimas` | — |

## extrato-negociacao-ativos

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos` | — |
| ✅ `negociacao` | GET | `/negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos/{pagina}` | `dataFim` `dataInicio` |
| ✅ `negociacao` | GET | `/negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos/resumo` | — |

## extrato-ofertas-publicas

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | ? | `/negocio-ofertaspublicas/api/extrato-ofertas-publicas/v1/ofertas-publicas` | — |
| 📄 | GET | `/negocio-ofertaspublicas/api/extrato-ofertas-publicas/v1/ofertas-publicas/detalhes` | — |

## openfinance

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET/POST | `/negocio-openfinance/api/openfinance/v1/consents/callback/validate` | `quantidade` |
| 📄 | GET | `/negocio-openfinance/api/openfinance/v1/consents/resources` | — |
| 📄 | GET | `/negocio-openfinance/api/openfinance/v1/participants` | — |
| 📄 | GET/PUT/POST | `/negocio-openfinance/api/openfinance/v1/portal` | — |
| ✋ | PUT/POST | `/negocio-openfinance/api/openfinance/v1/portal/conceder-acesso` | — |
| 📄 | GET | `/negocio-openfinance/api/openfinance/v1/portal/requisita-carga` | — |
| ✋ | PUT | `/negocio-openfinance/api/openfinance/v1/registration` | — |

## pagamento

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-pagamento/api/pagamento/v1/assinaturas` | — |
| ✋ | POST | `/negocio-pagamento/api/pagamento/v1/assinaturas/gerenciamento` | — |
| 📄 | GET | `/negocio-pagamento/api/pagamento/v1/beneficios` | — |
| ✋ | POST | `/negocio-pagamento/api/pagamento/v1/checkout` | — |
| 📄 | POST/GET | `/negocio-pagamento/api/pagamento/v1/planos/diastrial` | — |

## extrato-posicao

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 🟢 [200] | GET | `/negocio-posicao/api/extrato-posicao/v1/minha-carteira` | `agrupamento` |
| ✅ `posicao` | GET | `/negocio-posicao/api/extrato-posicao/v2/posicao` | — |

## publicacoes

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-publicacoes/api/publicacoes/v1/lista-publicacoes` | `TamanhoPagina` |
| 📄 | GET | `/negocio-publicacoes/api/publicacoes/v1/publicacao` | — |

## rendafixa

| | Método | Rota | Parâmetros |
|---|---|---|---|
| ✅ `rendaFixaAtivos` | GET | `/negocio-rendafixa/api/rendafixa/v1/ativos` | `CodigoInstrumento` `Pagina` `TamanhoPagina` |
| 📄 | GET | `/negocio-rendafixa/api/rendafixa/v1/gpt/resposta` | `Pergunta` `SessionId` |
| ✅ `rendaFixaNegocioANegocio` | GET | `/negocio-rendafixa/api/rendafixa/v1/negocio-a-negocio` | — |
| ✅ `rendaFixaNegocioConsolidado` | GET | `/negocio-rendafixa/api/rendafixa/v1/negocio-consolidado` | `DataNegocio` `Pagina` |

## sistema

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-sistema/api/sistema/v1.1/mensagem/investidor` | — |
| ✅ `ultimaCarga` | GET | `/negocio-sistema/api/sistema/v1/carga/ultima-execucao` | — |
| 📄 | GET | `/negocio-sistema/api/sistema/v1/usuario-master` | — |
| 🟢 [200] | GET | `/negocio-sistema/api/sistema/v2/notificacao/notificacao-modal` | — |

## trader

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | GET | `/negocio-trader/api/trader/v1/mercadoria/pontuacao` | — |
| 📄 | GET | `/negocio-trader/api/trader/v1/mercadoria/tarifacao` | — |

## transferencia-ativos

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 🟢 [504] | GET | `/negocio-transferencia-ativos/api/transferencia-ativos/v2/solicitacoes/pendentes` | — |

## voto

| | Método | Rota | Parâmetros |
|---|---|---|---|
| 📄 | ? | `/negocio-voto/api/voto/v2/assembleia/deliberacao` | `situacaoAssembleia` |
| 📄 | ? | `/negocio-voto/api/voto/v2/voto` | `situacaoAssembleia` |
| 🟢 [200] | GET | `/negocio-voto/api/voto/v3/assembleia/investidor` | `dataFim` `dataInicio` `filtrarVotadas` `paginaAtual` `situacaoAssembleia` `tamanhoPagina` `tipoAssembleia` |

---
135 rotas no mapa; 86 de leitura ainda fora do registro.

*Gerado por: Claude Code (claude-opus-5-5) — 2026-11-13.*
