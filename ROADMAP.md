# Roadmap

Estado em 2026-11-13. Ajude onde puder: veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Pronto

- [x] Autenticação: renovação fora do navegador, rotação do token, erros claros (`needsLogin`)
- [x] 20 rotas no registro, com schemas, paginação e limite pela data de carga
- [x] API HTTP com Swagger, `x-api-key` e renovação automática com aviso por webhook
- [x] `b3 probe`, `b3 shapes`, `b3 endpoints`, `b3 serve`
- [x] Documentação gerada do registro (`docs/endpoints.md`)

## Em andamento

- [x] Cofre de credenciais (`b3 credenciais`): DPAPI, Keychain, libsecret
- [ ] **`b3 login`**: implementado; falta validar o fluxo completo depois da senha (telas de código e confirmação de dispositivo).
  - Com CPF e senha, tenta headless. Se aparecer CAPTCHA, código de verificação ou desafio, abre a janela para a pessoa concluir. **Nunca contorna desafio.**
  - `--push` envia a sessão para um servidor remoto (`POST /v1/session`).
- [ ] **`b3 discover`**: abre o portal num navegador monitorado e registra rotas, nomes de parâmetros e árvores de tipos enquanto a pessoa navega.
- [ ] Build publicável (`dist/` + tipos) e publicação no npm.

## Campos pendentes 🟡 (precisam de alguém com o ativo)

| Rota | Falta | Quem pode ajudar |
|---|---|---|
| `negociacao` | campos de `itens[]` | quem comprou/vendeu na bolsa |
| `ultimasNegociacoes` | semântica de `iup`, `upp`, `tp`, `pa`, `sp`, `it[]` | idem |
| `proventos` | campos dos itens | quem recebeu dividendos/JCP/rendimentos |
| `proventosResumo` | campos de `dados[]` | idem |
| `proventosTipos` | campos dos itens | idem |
| `proventosAnos` | formato quando há dados (hoje 204) | idem |
| `posicao` | variações por categoria (ações, FIIs, BDRs, ETFs, derivativos, Tesouro) | quem tem esses ativos |
| `movimentacao` | valores possíveis de `tipoMovimentacao`/`tipoOperacao` | qualquer pessoa (descreva, sem valores R$) |
| `evolucaoPatrimonial` | significado do parâmetro `ap` | qualquer pessoa |

## Telas ainda não mapeadas ⛔

Micro-frontends do portal (`/assets/mf.manifest.json`) sem rotas no registro:

- `relatorios`: informe de rendimentos, relatório consolidado anual
- `calculadorasir`: calculadora de IR
- `rendafixa` e `calc-rendafixa`
- `rentabilidade`
- `portabilidade` e transferência de ativos (`/negocio-transferencia-ativos/...`, já vista: `v2/solicitacoes/pendentes`)
- `votoadistancia`, `clubeb3`, `openfinance`, `bolsa`, `empresas`, `publicacoes`, `trader`, `pagamentos`, `ia`
- notificações: `/negocio-investidor/api/investidor/v3/notificacoes` e `/negocio-sistema/api/sistema/v2/notificacao/notificacao-modal` (já vistas, sem schema)

## Perguntas em aberto

- Qual é o código de erro do B2C quando a janela de 24 h expira?
- A política aceita algum parâmetro que gere uma sessão mais longa (ex.: "manter conectado")?
- Existe limite de taxa? Até agora nenhum 429 foi observado.
