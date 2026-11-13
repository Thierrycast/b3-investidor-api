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
- [x] **`b3 login`**: validado em 13/11/2026 sem janela (CPF → senha → código por e-mail digitado no terminal) e com janela.
  - CAPTCHA ou tela desconhecida → janela para a pessoa concluir. **Nunca contorna desafio.**
- [x] Login automático no servidor: sessão vencida → login sozinho; código do e-mail via `POST /v1/login/codigo` (testes sintéticos; falta teste ao vivo)
- [ ] `b3 login --push` contra um servidor remoto (implementado, não testado de ponta a ponta)
- [x] **`b3 discover`**: abre o portal no Chrome da pessoa (perfil próprio, CDP) e registra rotas, nomes de parâmetros e árvores de tipos enquanto ela navega (testes do modelo de rota; falta rodada ao vivo).
- [x] **Mapa dos micro-frontends** (13/11/2026): 135 rotas em [docs/mapa-rotas.md](docs/mapa-rotas.md), vindas do código dos 21 micro-frontends e da navegação ao vivo.
- [ ] **Implementar as rotas de leitura do mapa** no registro. Prioridades:
  - [ ] extratos de ofertas públicas, garantias e eventos a receber;
  - [ ] calendário de eventos;
  - [ ] informe de rendimentos e downloads de relatório (PDF/planilha);
  - [ ] carteira v3, notificações e voto.
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
