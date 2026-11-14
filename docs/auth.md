# Autenticação

A Área do Investidor usa **Azure AD B2C** com OAuth 2.0 *authorization code + PKCE*. O front é um SPA Angular (cliente público, sem `client_secret`).

## Peças

| Item | Valor | Onde aparece |
|---|---|---|
| Tenant | `b3investidor.b2clogin.com/b3Investidor.onmicrosoft.com` | URL do login |
| Política (custom, IEF) | `B2C_1A_SIGN_IN` | parâmetro `p=` |
| `client_id` | `711b0677-3672-4464-b183-76734fb21907` | parâmetro `client_id` do `/authorize` (público) |
| Escopo da API | `https://b3Investidor.onmicrosoft.com/802348e6-6f23-4d99-9445-45836861cdf4/Read.All` | corpo do `/token` |
| Origem exigida | `https://www.investidor.b3.com.br` | header `Origin` |

Esses valores são públicos: qualquer pessoa os vê na barra de endereço ao abrir o login. Estão em `packages/core/src/constants.ts`.

## Fluxo de login (navegador)

1. `GET /oauth2/v2.0/authorize?p=B2C_1A_SIGN_IN&client_id=…&response_type=code&code_challenge=…&code_challenge_method=S256&scope=…&redirect_uri=…&state=…&nonce=…`
   O `/authorize` também leva `prompt`, `generationTime` e `doc_hint`.
2. As telas da política (CPF, senha, eventuais desafios) fazem `POST …/B2C_1A_SIGN_IN/SelfAsserted`.
3. Redireciona para `https://www.investidor.b3.com.br/?state=…&code=…`.
4. O front troca o código: `POST /oauth2/v2.0/token?p=B2C_1A_SIGN_IN`, form-urlencoded, com
   `grant_type=authorization_code, client_id, scope, code, redirect_uri, code_verifier`.

Campos da resposta do `/token`: `access_token, id_token, token_type, not_before, expires_in, expires_on, resource, id_token_expires_in, profile_info, scope, refresh_token, refresh_token_expires_in`.

| Token | Vida | Observação |
|---|---|---|
| `access_token` | 3600 s | JWT, usado como `Authorization: Bearer` |
| `refresh_token` | **86400 s, contados do login** | opaco; gira a cada uso |

## Renovação fora do navegador

```
POST https://b3investidor.b2clogin.com/b3Investidor.onmicrosoft.com/oauth2/v2.0/token?p=B2C_1A_SIGN_IN
Origin: https://www.investidor.b3.com.br
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&client_id=…&refresh_token=…&scope=<escopo> openid offline_access
```

Funciona de qualquer servidor; testado em 12/11/2026. A resposta traz um `refresh_token` **novo**, e é ele que deve ser guardado.
O `B3Client` faz isso sozinho e serializa renovações concorrentes, porque duas renovações simultâneas com o mesmo token poderiam se atrapalhar.

### A validade não avança

Observado em 12–13/11/2026: o `refresh_token_expires_in` devolvido em cada renovação **diminui**. Ele aponta sempre para ~24 h depois do login original.
Portanto **renovar não estende a sessão**: depois de 24 h, só um login novo resolve.

O que isso implica:
- Para uso contínuo (um servidor sincronizando todo dia), é preciso **um login por dia**. O `b3 login` existe para tornar isso o mais automático possível.
- O `SessionKeeper` do servidor renova a cada 6 h, para manter o access_token e girar o refresh. Faltando menos de 3 h para vencer, ele avisa no webhook `B3_ALERT_WEBHOOK`.
- Quando a renovação falha com `invalid_grant` (ou código `AADB2C…`), o cliente lança `B3AuthError` com `needsLogin: true`. A API HTTP responde 401 com `precisaLogin: true`.

*A confirmar:* o código exato do erro do B2C quando a janela de 24 h expira (anote em `docs/descobertas.md` quando acontecer).

## Como o site guarda a sessão

O front **não usa MSAL**. Tudo fica em `sessionStorage`, que morre ao fechar a aba:
`token` (access_token), `idToken`, `codeVerifier`, `state`, `nonce`, `b2cPolicy`, `cache-guid`, `ultimaCarga`, `investidor`, `perfil`, `menusDisponiveis` e `environment`.

O site **não guarda nem usa o refresh_token**: os bundles não têm `grant_type=refresh_token` nem `prompt=none`. Quando o access_token de 1 h vence, o site pede login de novo.
Cookies do domínio são só de analytics e consentimento.

## `cache-guid`

Toda chamada à API leva `?cache-guid=<uuid>`. No site, um interceptor HTTP gera um UUID por sessão (em `sessionStorage["cache-guid"]`) e o repete em todas as chamadas.
A API aceita qualquer UUID, inclusive um novo por chamada (testado). É só um *cache-buster*. O cliente usa um UUID por instância.

## Headers necessários na API de dados

Só `Authorization: Bearer <access_token>`. Não há `apikey`, `ocp-apim-*` nem `x-*`. O cliente também envia `Origin`/`Referer` do site, como o navegador faz.

O host da API (`investidor.b3.com.br`, **sem www**) não fica atrás do desafio do Cloudflare. O front (`www.`) fica: `curl` nele recebe "Just a moment...".

## Login assistido (`b3 login`)

```bash
pnpm b3 credenciais salvar   # uma vez: CPF e senha digitados sem eco, cifrados no cofre do sistema
pnpm b3 login                # abre o login, grava a sessão (24 h)
```

Como funciona (`packages/login`):

1. Gera PKCE próprio e abre **direto** o `/authorize` do B2C, sem carregar `www.investidor.b3.com.br`, que fica atrás do Cloudflare.
2. Manda `doc_hint=<CPF/CNPJ só dígitos>`. Ele é **obrigatório**: sem ele, o B2C responde "An exception has occurred". O B2C usa esse valor para escolher o fluxo; com um valor que não é o seu documento, ele cai na tela de **cadastro**. Por isso o `b3 login` sempre precisa do CPF/CNPJ: do ambiente, do cofre ou digitado na hora.
3. Preenche CPF, aceita os termos e preenche a senha (se houver).
4. **Código por e-mail** (tela "Código de autenticação", observada em 13/11/2026): a B3 envia um código de 6 dígitos ao e-mail cadastrado. No terminal, o `b3 login` pede o código (aparece como `******`) e o digita tecla a tecla.
   O campo visível (`INPUT_OTP_EMAIL`) é uma fachada; a página copia o valor para o campo real do B2C (`VerificationCode`, oculto) em eventos de tecla. Por isso colar de uma vez não funciona. Depois clica só em `Btn_VERIFY_CODE`; "Enviar Novo código" só é clicado quando a pessoa pede.
   **Não chegou ou apagou o e-mail?** Digite `r` (ou `reenviar`) no lugar do código: o login clica em "Enviar Novo código" e pede de novo. Vale só o código mais recente; são no máximo 3 reenvios por login e, passando disso, o comando para.
5. O redirecionamento final para `https://www.investidor.b3.com.br/?code=…` é lido (qualquer requisição ou navegação para essa origem) e respondido com uma página local "Login concluído". O site não carrega.
6. Troca o `code` por tokens (`grant_type=authorization_code` + `code_verifier`) e grava a sessão em arquivo 600, ou envia a um servidor com `--push`.

Modos:

| Modo | Quando | Comportamento |
|---|---|---|
| `auto` (padrão) | há CPF e senha | tenta headless; se a B3 pedir CAPTCHA, código ou mostrar erro, reabre com janela |
| `--headed` | sempre | janela visível; a pessoa conclui o que a B3 pedir |
| `--headless` | servidores | nunca abre janela; se precisar de pessoa, falha com `needs_human` |

**O projeto nunca resolve nem contorna CAPTCHA ou código de verificação.** O código vem da pessoa (terminal ou janela); CAPTCHA, se aparecer, só na janela.
Sem terminal interativo (ex.: rodando por outro programa), o código também vai para a janela.
`--debug <pasta>` grava a estrutura de cada tela (ids, tipos, textos de botão, nunca valores), útil quando a B3 mudar o fluxo.
O Chrome ou o Edge instalado é usado via `playwright-core`; nenhum navegador é baixado.

### Onde ficam CPF e senha

Ordem de leitura: `B3_CPF`/`B3_SENHA` do ambiente e depois o cofre. Se faltar o CPF, ele é pedido no terminal, sem eco.

| Sistema | Cofre | Detalhe |
|---|---|---|
| Windows | DPAPI (`ProtectedData`, escopo do usuário) | arquivo `~/.config/b3-investidor/credenciais.dpapi`; só o mesmo usuário do Windows decifra |
| macOS | Keychain (`security`) | item `b3-investidor` / `credenciais` |
| Linux | Secret Service (`secret-tool`) | precisa de sessão gráfica/keyring; em servidor, use o ambiente |

- Os segredos chegam aos utilitários do sistema **por stdin**, nunca por argumento de linha de comando (não aparecem na lista de processos).
- `b3 credenciais status` mostra só de onde vieram e se existem, nunca os valores. `b3 credenciais apagar` remove.
- No ambiente: prefira injetar na hora (gerenciador de segredos, `systemd` `LoadCredential`, secrets do CI) a deixar a senha em `.env`.
- Nenhum valor de CPF, senha ou token aparece em log, status ou erro.

## Login automático no servidor

Com credenciais configuradas (`B3_CPF`/`B3_SENHA` ou o cofre) e `B3_AUTO_LOGIN` diferente de `0`, o `b3 serve` cuida da sessão:

```
requisição ──► sessão válida? ── sim ──► responde
                    │ não (vencida/ausente)
                    ▼
             login sem janela (CPF, senha)
                    │
          B3 pediu código por e-mail? ── não ──► grava sessão, repete a chamada, responde
                    │ sim
                    ▼
     503 { precisaCodigo: true } + webhook "codigo-necessario"
                    │
     POST /v1/login/codigo { "codigo": "123456" }
                    ▼
          grava sessão ──► próximas requisições respondem normalmente
```

| Rota | Para quê |
|---|---|
| `GET /v1/login` | fase atual: `parado`, `entrando`, `aguardando_codigo`, `concluido`, `erro` |
| `POST /v1/login` | inicia um login agora (útil para renovar antes de vencer) |
| `POST /v1/login/codigo` | entrega o código do e-mail; responde `200` quando a sessão nova está gravada |

- O renovador periódico também dispara o login quando a sessão morre.
- Uma requisição espera o login até `B3_LOGIN_ESPERA_MS` (padrão 90 s). Requisições simultâneas compartilham o mesmo login.
- O código precisa chegar em até 10 minutos. Depois, o login vai para `erro` e outra requisição inicia um novo.
- CAPTCHA ou tela desconhecida → `fase: erro` e webhook `login-falhou`. A saída é `b3 login` com janela e `--push`.
- Nem o código nem as credenciais aparecem em log, resposta ou `/v1/health`.
- O servidor precisa de Chrome ou Edge instalado. Em Linux sem tela, o modo headless funciona sem servidor gráfico.

## Capturar a sessão manualmente

Alternativa sem o `b3 login` (por exemplo, para depurar):

1. Abra o Chrome, pressione F12 → aba **Network**, marque **Preserve log** e filtre por `token`.
2. Entre em https://www.investidor.b3.com.br e faça login normalmente.
3. Clique na requisição `POST …/oauth2/v2.0/token?p=B2C_1A_SIGN_IN`:
   - na aba **Response**, copie o valor de `refresh_token`;
   - na aba **Payload**, confira `client_id` e `scope`.
4. Crie o arquivo (o padrão é `~/.config/b3-investidor/session.json`) com modo 600:
   ```json
   { "refresh_token": "<cole aqui>", "client_id": "711b0677-3672-4464-b183-76734fb21907", "policy": "B2C_1A_SIGN_IN" }
   ```
   ```bash
   chmod 600 ~/.config/b3-investidor/session.json
   ```
5. `pnpm b3 probe`.

Nunca cole o `refresh_token` em issues, chats ou logs: ele dá acesso de leitura à sua conta por até 24 h.
