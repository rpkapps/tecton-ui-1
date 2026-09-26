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

2026-09-26, after the ranking changes listed below:

| Query set                         | names only     | − routed needs | − synonyms     | − name match   | **tecton search**             |
| --------------------------------- | -------------- | -------------- | -------------- | -------------- | ----------------------------- |
| set 1 (90), hit@1 / hit@3 / hit@5 | 50 / 59 / 63 % | 74 / 86 / 90 % | 74 / 88 / 93 % | 72 / 93 / 93 % | **76 / 92 / 96 %** (MRR 0.84) |
| set 2 (80), hit@1 / hit@3 / hit@5 | 45 / 55 / 55 % | 64 / 84 / 88 % | 66 / 84 / 90 % | 68 / 86 / 93 % | **69 / 90 / 95 %** (MRR 0.79) |

Before those changes (2026-09-24 ranking): set 1 72 / 92 / 93 % (MRR 0.81), set 2 69 / 86 / 90 %
(MRR 0.77). When `TectonProvider` replaced the public portal provider and the shortcuts and direction
pages were removed, set 1 dropped its shortcuts query (90 → 89) and both sets accept `provider` for
the portal and right-to-left queries: 78 / 92 / 96 % (MRR 0.85) on set 1, 69 / 89 / 95 % (MRR 0.79)
on set 2.

After the guidelines were rewritten for the Base UI prop conventions (the `react-aria` topic became
`conventions`; the four topic queries were re-pointed, no ranking or synonym change):

| Query set, hit@1 / hit@3 / hit@5 | before (index at `a662421`) | after                         |
| -------------------------------- | --------------------------- | ----------------------------- |
| set 1 (89)                       | 76 / 92 / 96 % (MRR 0.84)   | **76 / 92 / 96 %** (MRR 0.85) |
| set 2 (80)                       | 69 / 90 / 94 % (MRR 0.79)   | **71 / 89 / 93 %** (MRR 0.81) |

The "before" index still held the removed `direction`, `portal` and `shortcuts` pages; set 2 lost
its right-to-left ticket query (`provider` is now rank 5).

- _names only_ matches the query against ids and export names (roughly grepping the export list).
- Each ablation turns one part off: _routed needs_ (each `notFor` need indexed under the component
  it points at), _synonyms_ (`guidelines/synonyms.json`), _name match_ (rank 1 for an exact id or
  export, and the boost for a spelled-out name).
- Terse, boundary and topic queries land in the top 3 in 87–100 % of cases; long sentences lifted
  from tickets in 80 %, because extra words dilute the ranking. Hence the skill's advice to search
  with a short need.

### Ranking changes on 2026-09-26

- camelCase is split in the query and the identifier kept whole (`ScrollArea`, `PageHeader`,
  `AppShell` returned nothing).
- An exact id or export ranks first; a spelled-out name is boosted (`NAME_BOOST = 2`, picked from a
  grid run on both sets).
- Plurals are stripped before `-ing` / `-ed` (Porter 1a, then 1b).
- `page`, `show`, `display`, `user` are no longer stopwords; `'s` / `n't` scraps and 1-letter words
  are dropped.
- Synonym keys may be phrases (`pin code`, `progress ring`, `split view`, `verification code`, …).
- Dropped single-word keys that hijacked queries (`palette`, `token`, `ring`, `split`, `pin`,
  `rule`, `survey`, `pages`) and keys that duplicated another after stemming or only expanded to
  themselves (`agent:build` now rejects both).
- Added `percent`, `percentage` → progress, **after reading the misses of both sets**.
- Tried and dropped: down-weighting single-use words in long queries (cost a hit on each set).

## Leakage

Neither set measures how search does on queries nobody has looked at:

- Both have been read query by query while the ranking and vocabulary were tuned, and both are CI
  floors, so a fix for one of their misses is fitted to it.
- `synonyms.json` and both query files arrived in the same (squashed) commit: treat every synonym as
  written with both sets in view.
- Synonym keys that fire on eval queries today (a number in brackets is how many hit@3 results
  depend on the key):
  - Set 1 (33 keys on 43 of 90 queries): `assistant`, `banner`, `chat`, `clipboard`, `collapse`,
    `confirm`, `dark`, `delete`, `divider`, `dropdown` (1), `expand`, `form`, `gauge`, `grid`,
    `hint`, `keyboard`, `kpi`, `light`, `loader`, `loading`, `modal`, `nav`, `notification` (1),
    `percent` (2), `picker`, `placeholder`, `preview`, `rows`, `searchable`, `tag`, `toggle`,
    `toolbar`, `verification code`.
  - Set 2 (31 keys on 37 of 80 queries): `assistant`, `bulk`, `chat` (1), `clipboard`, `collapse`,
    `colour`, `confirm`, `dark`, `delete`, `divider` (1), `dropdown`, `expand`, `form`, `gauge`,
    `hint` (1), `irreversible`, `loading`, `modal` (1), `nothing`, `notification`, `percentage` (1),
    `placeholder`, `popup`, `preview`, `profile`, `rows`, `searchable`, `tag`, `toggle` (1),
    `toolbar`, `zero`.
- Without `percent` / `percentage`, set 1 scores 90 % and set 2 89 % hit@3. `verification code`
  matches a set 1 query word for word; no hit depends on it.

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
