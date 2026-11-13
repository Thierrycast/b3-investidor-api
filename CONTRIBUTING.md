# Como contribuir

Este projeto depende de pessoas com carteiras diferentes. Quem o começou só tinha renda fixa e Tesouro.
Por isso ações, FIIs, BDRs, ETFs, derivativos, proventos e negociações ainda têm campos desconhecidos (🟡 em [docs/endpoints.md](docs/endpoints.md)).
O jeito de contribuir foi desenhado para **você nunca precisar expor os seus dados**.

## Regra de ouro

**Nunca** cole em issue, PR, commit ou chat:
- `refresh_token`, `access_token`, `id_token` ou o conteúdo do `session.json`;
- CPF, nome, e-mail, telefone, códigos de conta;
- valores em R$, quantidades, tickers da sua carteira.

Árvores de **tipos** (`"valorAtualizado": "number"`) são seguras. Valores (`"valorAtualizado": 1234.56`) não são.

## 1. Mapear campos de uma rota 🟡

```bash
pnpm b3 shapes --all > shapes.json      # ou: pnpm b3 shapes negociacao proventos
```

Para cada rota, a saída tem:
- `shape`: a árvore de tipos (`string`, `number`, `date-iso`, `string(digits)`...), sem nenhum valor;
- `camposForaDoSchema`: campos que vieram na resposta e que o schema ainda não descreve. **É isso que interessa.**

As rotas usam por padrão os últimos 30 dias. Se a rota vier vazia, passe um período em que você teve movimento, por exemplo editando a chamada ou usando a API (`/v1/negociacao?dataInicio=2024-01-01`).

Abra uma issue **"Campos: \<rota\>"** colando só o `shape` e o `camposForaDoSchema` daquela rota. Revise antes de enviar.

Se puder, diga também o que cada campo significa: compare com o que a tela do portal mostra, mas **descreva** em vez de copiar valores.

## 2. Descobrir rotas novas

O portal tem mais de 20 micro-frontends (lista em [docs/descobertas.md](docs/descobertas.md)). Várias telas ainda não foram mapeadas (relatórios, informe de rendimentos, renda fixa, calculadora de IR...).

O jeito mais fácil:

```bash
pnpm b3 discover
```

Ele abre o seu Chrome com um perfil próprio, você faz login e navega pelas telas que quer mapear, e no fim fecha o Chrome.
Cada rota da API aparece no terminal (✅ já conhecida, 🆕 nova), e o arquivo `captures/discover-<data>.json`, ignorado pelo git, guarda para cada rota:

- método e rota como modelo: números, ids, datas e tickers viram `{n}`, `{id}`, `{data}` e `{ticker}`;
- **nomes** dos parâmetros, status HTTP e árvore de tipos.

Nenhum valor é gravado. Mesmo assim, revise o arquivo antes de colar as rotas 🆕 numa issue.

Sem o `discover`, dá para fazer à mão. Com o portal aberto no Chrome, use o DevTools (F12 → Network → filtro `negocio-`) e anote:
- método e caminho (`/negocio-xxx/api/...`);
- **nomes** e formato dos parâmetros (`dataInicio=AAAA-MM-DD`), não os valores;
- headers além de `Authorization`, se houver.

Depois chame a rota com o cliente e gere o shape:

```ts
const b3 = new B3Client();
const { body } = await b3.raw("/negocio-xxx/api/...", { param: "..." });
console.log(JSON.stringify(shape(body), null, 2));
```

## 3. Mandar código

1. Acrescente ou ajuste a rota em `packages/core/src/endpoints.ts`, com o schema em `packages/core/src/schemas.ts`.
   - Objetos com `z.looseObject`, folhas `.nullish()`.
   - Use `.describe()` só com o que você **confirmou**. Hipótese se escreve como "a confirmar".
   - Mude `status` para `"confirmado"` quando os campos dos itens tiverem sido vistos com dados reais.
2. `pnpm docs:gen` para regenerar `docs/endpoints.md`.
3. Registre o que observou em `docs/descobertas.md`, com data e sem valores.
4. `pnpm test && pnpm typecheck`.
5. Testes usam **somente dados sintéticos**. Nada de fixture copiada de resposta real.

## Ambiente

Node ≥ 22, pnpm. `pnpm install`, `cp .env.example .env`. Os testes não precisam de sessão.
