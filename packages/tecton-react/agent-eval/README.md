# agent-eval

Measures how well `tecton search` (`bin/tecton.mjs`) finds the right `@tecton/react` component for a
need. Nothing here ships in the package.

| File | What it is |
| --- | --- |
| `queries.heldout.json`, `queries.heldout-2.json` | 90 and 80 search queries with accepted answers. Each set was written by a separate agent that saw only the module names and exports, never the guideline text. |
| `search-eval.mjs` | Retrieval accuracy of `tecton search` on a query set, next to three ablations |

```bash
node agent-eval/search-eval.mjs [queries.json] [--misses]
```

`scripts/__tests__/agent-search.test.ts` holds the top-3 accuracy on both query sets above a floor,
so CI fails if a ranking or index change makes search worse.

## Search accuracy, 2026-09-24

| Query set | names only | − routed needs | − synonyms | **tecton search** |
| --- | --- | --- | --- | --- |
| held-out 1 (90), hit@1 / hit@3 / hit@5 | 51 / 59 / 62 % | 71 / 86 / 88 % | 70 / 87 / 92 % | **72 / 92 / 93 %** (MRR 0.81) |
| held-out 2 (80), hit@1 / hit@3 / hit@5 | 43 / 55 / 56 % | 65 / 80 / 84 % | 65 / 79 / 85 % | **69 / 85 / 89 %** (MRR 0.77) |

- *names only* matches the query against ids and export names; it is roughly what grepping the
  export list gives you.
- The two ablations turn off one part each:
  - *routed needs*: each guideline's `notFor` needs, indexed under the component they point at.
  - *synonyms*: the vocabulary in `guidelines/synonyms.json`.
- Queries by kind:
  - Terse queries (1–3 words) and boundary queries (two easily confused components) land in the top 3
    in 87–100 % of cases.
  - Long sentences lifted from tickets land there in 72 %, because extra words dilute the ranking.
  - This is why the skill tells agents to search with a short need.
- History of set 1: frozen before anyone looked at its queries, it scored 70 / 92 / 93 %. After that
  came three changes: a stemmer fix (`resize`/`resizable`), the icon glyph list, and dropping
  `range → slider`. Set 2 arrived after the stemmer fix; it lost one query when
  `guidelines/adopted/` landed (86 → 85 % hit@3).
