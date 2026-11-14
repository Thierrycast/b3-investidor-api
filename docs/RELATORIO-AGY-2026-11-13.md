# Relatório: rotas de mercado e referência (13/11/2026)

O agy implementou 20 rotas sem sessão da B3 (schemas abertos, nada testado). Depois do login, as rotas foram
testadas ao vivo e corrigidas. Este arquivo registra o que foi visto. Só tipos e status; nenhum valor pessoal.

## Resultado ao vivo

| Rota | HTTP | Estado |
|---|:---:|---|
| `bridgewisePesquisaAtivos` | 200 | ✅ |
| `bridgewiseCotacao` | 200 | ✅ `{id}` aceita o ticker direto |
| `bridgewiseDadosAtivo` | 200 | ✅ |
| `bridgewiseDesempenho` | 200 | ✅ |
| `bridgewiseComparativo` | 200 | ✅ |
| `bridgewiseAnaliseFundamentalista` | 200 | ✅ |
| `bridgewiseAnaliseTecnica` | 206 | 🟡 `tendenciaPreco` e `momentosMercado` vieram vazios |
| `bridgewiseListaAtivos` | 204 | 🟡 sem corpo, com ou sem `pagina`/`tamanho` |
| `calcRFTitulosPublicos` | 200 | ✅ |
| `calcRFTitulosDebentures` | 200 | ✅ |
| `calcRFTitulosCRA` | 200 | ✅ |
| `calcRFTitulosCRI` | 200 | ✅ |
| `transferenciaListadosBalcao` | 200 | 🟡 lista vazia para esta conta |
| `instituicoes` | 200 | ✅ |
| `tiposEventos` | 200 | ✅ |
| `tiposMovimentacoes` | 200 | ✅ |

16 rotas no registro: 12 ✅ e 4 🟡. Em todas, `b3 shapes` não encontrou divergência nem campo fora do schema.

## Fora do registro

| Rota | HTTP | O que se sabe |
|---|:---:|---|
| `rendaFixaAtivos`, `rendaFixaNegocioConsolidado`, `rendaFixaNegocioANegocio` | 500 | Mesmo erro genérico da B3 com e sem parâmetros (`Pagina`, `TamanhoPagina`, `DataNegocio`, `CodigoInstrumento`). Falta a chamada real do portal: `b3 discover` na tela `/renda-fixa/ativos`. |
| `calcRFCalculoPU` | 400 | Pede `codigo`; com um código de título válido, responde "Data de cálculo inválida". É um cálculo, não uma consulta. Faltam os parâmetros. |

## O que o agy errou e foi corrigido

- Nove respostas foram registradas como lista (`array`), mas a B3 devolve objeto: `{ data: [...] }`, `{ instituicoes: [...] }` etc.
- `b3 shapes` não conseguia chamar rotas com `{id}`. Ganhou `-q chave=valor` (repetível).
- Os testes só repetiam o que a fixture inventada devolvia. Foram refeitos com o formato real e conferem o schema.
- As quatro rotas que falham estavam marcadas ✅ no mapa; voltaram a 📄 com o status visto (🔴).

## Achados fora do escopo

- `parseApiError` quebrava (`v.join is not a function`) quando a B3 mandava `errors` com valor que não era lista. Corrigido.
- `tiposEventos[].id` chega como lista de números, não como número (a B3 é assim; está no schema com `Sic`).

## Reproduzir

```bash
pnpm b3 login                                   # código do e-mail; `r` pede um novo
pnpm b3 shapes bridgewiseCotacao -q id=PETR3    # tipos da resposta, nunca valores
pnpm b3 shapes --all                            # as rotas sem parâmetro obrigatório
pnpm test && pnpm typecheck && pnpm docs:check
```

*Documentado por: agy (Gemini 3.8 Flash), primeira versão; revisado e reescrito após o teste ao vivo por Claude Code (claude-sonnet-5-5) — 2026-11-13.*
