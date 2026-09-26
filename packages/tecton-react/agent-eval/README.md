# agent-eval

Measures how well `tecton search` (`bin/tecton-lib.mjs`) finds the right `@tecton/react` component
for a need. Nothing here ships in the package.

| File                                             | What it is                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queries.heldout.json`, `queries.heldout-2.json` | 89 and 80 queries with accepted answers, each written by a separate agent that saw only the module names and exports. Despite the names they are **no longer held out** (see [Leakage](#leakage)). |
| `sets.json`                                      | Every query set and its use: `floor` (tuned against, held above a CI floor) or `report` (frozen, reported, never tuned against).                                                           |
| `search-eval.mjs`                                | Retrieval accuracy of `tecton search` on each set, next to four ablations                                                                                                                  |

```bash
node agent-eval/search-eval.mjs                  # every set in sets.json
node agent-eval/search-eval.mjs queries.json     # one file
node agent-eval/search-eval.mjs --misses         # also list the queries not in the top 3
```

`scripts/__tests__/agent-search.test.ts` holds the top-3 accuracy of every `floor` set above a floor
(91 % and 88 %, one query below the current scores), so CI fails if a ranking or index change makes
search worse. It also fails if a `report` set is given a floor.

## Search accuracy

2026-09-26, index built from the guidelines at this commit (`node agent-eval/search-eval.mjs`):

| Query set                         | names only     | − routed needs | − synonyms     | − name match   | **tecton search**             |
| --------------------------------- | -------------- | -------------- | -------------- | -------------- | ----------------------------- |
| set 1 (89), hit@1 / hit@3 / hit@5 | 48 / 58 / 62 % | 76 / 88 / 91 % | 76 / 88 / 93 % | 76 / 91 / 93 % | **79 / 92 / 96 %** (MRR 0.86) |
| set 2 (80), hit@1 / hit@3 / hit@5 | 46 / 55 / 56 % | 66 / 85 / 89 % | 70 / 83 / 90 % | 70 / 85 / 89 % | **71 / 89 / 91 %** (MRR 0.80) |

Method: BM25F over each entry's names, routed `notFor` needs, "Use it when" and "Do" text; a hit@k
means an accepted id is in the top k. _names only_ matches the query against ids and export names
(a grep); each other column turns one part off: _routed needs_ (each `notFor` need indexed under
the component it points at), _synonyms_ (`guidelines/synonyms.json`), _name match_ (rank 1 for an
exact id or export, and the boost for a spelled-out name). Long sentences lifted from tickets score
lowest (76 % hit@3), which is why the skill says to search with a short need.

## Leakage

Neither set measures how search does on queries nobody has looked at: both have been read query by
query while the ranking, the guideline wording and `synonyms.json` were tuned, and both are CI
floors, so a fix for one of their misses is fitted to it. Treat every synonym as written with both
sets in view.

### A third set

To measure generalisation:

1. Someone who has not read `guidelines/`, `synonyms.json` or the two sets writes 60–100 queries
   from the module names and exports alone, in the same JSON shape (`q`, `answers`, `kind`), as
   `queries.frozen-3.json`.
2. Add it to `sets.json` with `"use": "report"` and never edit it (record a disputed answer in its
   `origin`).
3. Report its score here. Nobody tunes against it, and it never gets a floor (the test fails if it
   does).
4. Once it has been read to debug a miss, it is spent: switch it to `"use": "floor"` and freeze a new
   one.
