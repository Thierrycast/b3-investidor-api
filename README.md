# b3-investidor-api

Cliente TypeScript, API HTTP com Swagger e ferramentas de descoberta para a **Área do Investidor da B3**: posição, extratos, proventos e cadastro, direto do portal, com os seus próprios dados.

> ⚠️ **Projeto não oficial, sem nenhum vínculo com a B3.**
> Ele conversa com a mesma API interna que o site `investidor.b3.com.br` usa no seu navegador.
> Ela pode mudar sem aviso. Use **apenas com a sua própria conta**: é o seu direito de acesso aos seus dados (LGPD, art. 18).
> Não há escrita: o projeto só lê.

## O que tem aqui

| Pacote | Para quê |
|---|---|
| [`@b3-investidor/core`](packages/core) | Cliente tipado: autenticação Azure AD B2C, renovação, 20+ rotas com schemas zod, paginação e erros |
| [`@b3-investidor/server`](packages/server) | API HTTP (Fastify) com **Swagger em `/docs`**, chave de acesso e renovação automática da sessão |
| [`@b3-investidor/cli`](packages/cli) | `b3`: `refresh`, `probe`, `shapes`, `endpoints`, `serve` (e `login` em breve) |

Rotas, parâmetros e campos estão em **[docs/endpoints.md](docs/endpoints.md)**. Como a autenticação funciona, em **[docs/auth.md](docs/auth.md)**.
O diário do que foi observado, com datas, está em [docs/descobertas.md](docs/descobertas.md).

## Começo rápido

Precisa de Node ≥ 22 e pnpm.

```bash
git clone <este repo> && cd b3-investidor-api
pnpm install
cp .env.example .env        # ajuste o que for usar
```

**1. Obter a sessão.** O `b3 login` (em desenvolvimento) vai abrir o login da B3 e guardar a sessão sozinho.
Por enquanto, siga [docs/auth.md → Capturar a sessão manualmente](docs/auth.md#capturar-a-sessão-manualmente).
O resultado é um `session.json` (modo 600) com `refresh_token`, `client_id`, `policy` e `scope`.

**2. Testar:**

```bash
pnpm b3 probe              # renova a sessão, chama última carga e posição; mostra só status e tipos
pnpm b3 endpoints          # rotas conhecidas e status de mapeamento
```

**3. Usar como biblioteca:**

```ts
import { B3Client } from "@b3-investidor/core";

const b3 = new B3Client();                       // lê ~/.config/b3-investidor/session.json
const posicao = await b3.call("posicao");        // data padrão = última carga da B3
const extrato = await b3.all("movimentacao", { dataInicio: "2025-01-01" }); // todas as páginas
```

**4. Ou subir a API HTTP:**

```bash
B3_API_KEY=$(openssl rand -hex 32) pnpm b3 serve
# http://127.0.0.1:8790/docs  (Swagger)
curl -H "x-api-key: $B3_API_KEY" "http://127.0.0.1:8790/v1/posicao?todasPaginas=true"
```

## Coisas que vale saber

- **A sessão dura 24 h a partir do login.** O `refresh_token` gira a cada renovação, mas a validade não avança.
  Na prática, é preciso logar de novo uma vez por dia. O servidor avisa por webhook quando a sessão está perto de vencer. Detalhes em [docs/auth.md](docs/auth.md).
- **Datas são limitadas à última carga da B3** (normalmente D-1 útil). Pedir posição de "hoje" dá erro 400 na B3.
  O cliente usa a data da carga como padrão e limita datas maiores. O servidor informa o ajuste no header `x-b3-ajustes`.
- **A B3 manda vários valores já formatados** (`valorFormatado`, `porcentagemFormatada`) como texto pt-BR. Os valores numéricos crus estão nas rotas de posição e extrato.
- **Campos novos não quebram nada**: os schemas são abertos e repassam o que não conhecem. `pnpm b3 shapes --all` mostra os campos que o schema ainda não descreve.

## Ajude a completar o mapa

Várias rotas foram confirmadas com uma conta que não tinha ações, FIIs ou proventos. Por isso os campos desses itens ainda são desconhecidos (🟡).
Se você tem esses ativos, **dá para contribuir sem expor nada**: `pnpm b3 shapes --all` imprime só a árvore de **tipos**, nunca valores.
Veja [CONTRIBUTING.md](CONTRIBUTING.md) e o [ROADMAP.md](ROADMAP.md).

## Segurança

- Tokens ficam só na sua máquina (`session.json`, modo 600) ou no armazenamento que você implementar (`TokenStore`).
- Sem telemetria e sem chamadas a terceiros: o projeto só fala com `b3investidor.b2clogin.com` e `investidor.b3.com.br`.
- O servidor escuta em `127.0.0.1` por padrão, exige `x-api-key` e oculta credenciais nos logs.
- Encontrou um problema de segurança? Veja [SECURITY.md](SECURITY.md).

## Licença

MIT. Marcas e nomes da B3 pertencem à B3 S.A. — Brasil, Bolsa, Balcão.
