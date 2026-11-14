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
| `calcRFCalculoPU` | 200 | ✅ pede `codigo` + `dataCalculo`; vale para debêntures, CRA, CRI e título público (`idSelic`) |
| `transferenciaListadosBalcao` | 200 | 🟡 lista vazia para esta conta |
| `instituicoes` | 200 | ✅ |
| `tiposEventos` | 200 | ✅ |
| `tiposMovimentacoes` | 200 | ✅ |

17 rotas no registro: 13 ✅ e 4 🟡. Todas também foram chamadas pelo servidor HTTP (`b3 serve`) e responderam como esperado; falta de parâmetro obrigatório dá 400. Em todas, `b3 shapes` não encontrou divergência nem campo fora do schema.

## Fora do registro

| Rota | HTTP | O que se sabe |
|---|:---:|---|
| `rendaFixaAtivos`, `rendaFixaNegocioConsolidado`, `rendaFixaNegocioANegocio` | 500 | A B3 valida os parâmetros (`Pagina=0` dá 400) e depois responde 500 genérico, com qualquer combinação testada (`Pagina`, `TamanhoPagina`, `DataNegocio`, `CodigoInstrumento`, maiúsculas e minúsculas). Parece problema do serviço. Ficaram fora do registro. |

## O que o agy errou e foi corrigido

- Nove respostas foram registradas como lista (`array`), mas a B3 devolve objeto: `{ data: [...] }`, `{ instituicoes: [...] }` etc.
- `b3 shapes` não conseguia chamar rotas com `{id}`. Ganhou `-q chave=valor` (repetível).
- Os testes só repetiam o que a fixture inventada devolvia. Foram refeitos com o formato real e conferem o schema.
- As quatro rotas que falhavam estavam marcadas ✅ no mapa. O cálculo de PU foi resolvido (faltava `dataCalculo`, que nenhuma descrição mencionava); as três de renda fixa saíram do registro e ficam como 🔴 no mapa.

## Achados fora do escopo

- O servidor ignorava a sessão quando `B3_SESSION_FILE=` vinha vazio no `.env` (o que o `.env.example` entrega): tratava o texto vazio como caminho, achava que não havia sessão e disparava o login automático. Corrigido com `||`.
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
