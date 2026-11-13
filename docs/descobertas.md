# Diário de descobertas

O que foi observado no portal, com data e método. Registre **só nomes, tipos e comportamentos**: nunca valores, tokens ou dados pessoais.
Coisas novas vão no topo.

## 2026-11-13 — validade da sessão

- Em cada renovação, o `refresh_token_expires_in` vem menor: aponta sempre para ~24 h depois do login original.
  Renovar gira o token, mas **não estende a sessão**. Consequência: um login por dia (ver `docs/auth.md`).
- `b3 shapes --all` contra uma conta real: as 20 rotas do registro responderam 200 (ou 204 em `proventos/investidor/anos`).
  Isso deu os campos das rotas da página inicial (`minha-carteira/*`, `evolucao-patrimonial`), de `cadastro`, `perfil` e `movimentacao/ultimas`.
- `home/v2/negociacao/ultimas-negociacoes` responde com chaves abreviadas: `iup`, `upp`, `tp`, `pa`, `sp`, `it`. A semântica fica pendente (conta sem negociações).
- Sic da B3, mantidos nos schemas: `datatInicial` (proventos/resumo), `notificaoNewsletter` (cadastro); `porcentagemFormatada` × `porcentagemFormatado` conforme a rota.

## 2026-11-12 — spike (navegador + servidor)

Método: Chrome controlado por CDP num perfil isolado, com login feito pelo dono da conta. O capturador registrava só nomes e tipos.
Depois, chamadas diretas de um servidor Linux.

**Autenticação**
- Azure AD B2C, política `B2C_1A_SIGN_IN`, authorization code + PKCE e cliente público.
- `/token` do login: `grant_type=authorization_code`, sem `client_secret`. Resposta com `refresh_token` e `refresh_token_expires_in=86400`.
- `grant_type=refresh_token` funciona fora do navegador (só com `Origin`). O token gira.
- O site guarda tudo em `sessionStorage` e não usa o refresh_token; ao vencer o access_token, pede login.

**API**
- Host `investidor.b3.com.br` (sem www), só `Authorization: Bearer`. Sem desafio do Cloudflare (o `www.` tem).
- `cache-guid` é um UUID por sessão no site, mas qualquer UUID serve.
- Front Angular com Module Federation. O `/assets/mf.manifest.json` lista os micro-frontends:
  `home, extrato, minhacarteira, minhaconta, proventos, relatorios, portabilidade, calculadorasir, rentabilidade, votoadistancia, clubeb3, openfinance, empresas, calcrendafixa, bolsa, publicacoes, rendafixa, assistenteinteligente, trader, pagamentos, landingpage`.
- Rotas de tela: `/minha-carteira/investimentos/posicao`, `/extrato/movimentacao`, `/extrato/negociacao`, `/proventos/visao-geral`.

**Regras de parâmetros**
- `posicao?data=` e `movimentacao?dataFim=` maiores que `ultima-execucao.dataGeral` → 400 `"A data informada é maior que a data de carga do sistema!"`.
  Isso pega quem usa a data UTC de "hoje" à noite no Brasil.
- `negociacao-ativos/{pagina}` aceita `dataFim` maior que a carga e `dataInicio` desde 2000.
- Movimentação e negociação aceitaram janelas de até 10 anos numa chamada.
- `proventos/investidor/resumo?agrupamento=` só aceita `1`. `2` e `3` → 400 de validação ASP.NET (`application/problem+json`, `errors.agrupamento`).
- Dois formatos de erro: string JSON (regra de negócio) e `problem+json` (validação).

**Instabilidade**
- `transferencia-ativos/v2/solicitacoes/pendentes` deu 504 no navegador.
- Um `EHOSTUNREACH` isolado na API. O cliente repete com backoff.

## 2026-11-13 — login assistido

- O `doc_hint` decide o fluxo do B2C: com um valor que não é o documento da pessoa (ex.: `0`), a tela leva ao **cadastro**, não ao login. O `b3 login` passou a exigir o CPF/CNPJ real.
- Windows PowerShell 5 chamado de dentro do pwsh 7 herda o `PSModulePath` e não carrega `Microsoft.PowerShell.Security`. O cofre usa `ProtectedData` (.NET) direto e não repassa `PSModulePath`.
- Primeiro login real completo: CPF → senha → **código por e-mail** → redirecionamento com `code` → troca por tokens. Sessão de 24 h; `probe` com 200.
- Scripts passados a `page.evaluate` como função quebram sob `tsx` (esbuild injeta `__name`, ausente na página): o detector de tela falhava calado. Agora vão como texto.

## 2026-11-13 — mapa dos micro-frontends

- `/assets/mf.manifest.json` lista 21 micro-frontends; cada `remoteEntry.js` mapeia os chunks como `{id:"hash"}[id]+".js"`. Os prefixos de serviço (`negocio-xxx/`) e os caminhos (`api/.../vN/...`) ficam em strings separadas.
- Cada serviço tem um gêmeo `negocio-xxx-master` (perfil Master, escopo `.../Master`).
- Telas do portal: `/extrato/*`, `/minha-carteira/*`, `/proventos/*`, `/relatorios/*`, `/voto-a-distancia/*`, `/renda-fixa`, `/publicacoes`, `/clube-b3`, `/calculadora-renda-fixa`, `/calculadoras-ir`, `/portabilidade/*`. Resultado em [mapa-rotas.md](mapa-rotas.md).
- `transferencia-ativos/v2/solicitacoes/pendentes` voltou a dar 504 (4 de 4). A portabilidade usa `/api/transferencia-ativos/v3/...` sem prefixo `negocio-`.
- `investidor/v1/notificacoes/leitura` provavelmente marca notificações como lidas: tem efeito colateral e fica fora da API.
