# agent-eval

Measures how well `tecton search` (`bin/tecton-lib.mjs`) finds the right `@tecton/react` component
for a need. Nothing here ships in the package.

| File                                             | What it is                                                                                                                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queries.heldout.json`, `queries.heldout-2.json` | 90 and 80 search queries with accepted answers. Each set was written by a separate agent that saw only the module names and exports, never the guideline text. Despite the file names they are **no longer held out**: see [Leakage](#leakage). |
| `sets.json`                                      | Every query set and its use: `floor` (tuned against, held above a CI floor) or `report` (frozen, reported, never tuned against).                                                                                                                |
| `search-eval.mjs`                                | Retrieval accuracy of `tecton search` on each set, next to four ablations                                                                                                                                                                       |

```bash
node agent-eval/search-eval.mjs                  # every set in sets.json
node agent-eval/search-eval.mjs queries.json     # one file
node agent-eval/search-eval.mjs --misses         # also list the queries not in the top 3
```

`scripts/__tests__/agent-search.test.ts` holds the top-3 accuracy of every `floor` set above a floor
(91 % and 88 % today, one query below the current scores), so CI fails if a ranking or index change
makes search worse. It also fails if a `report` set is given a floor.

## Search accuracy, 2026-09-26

| Query set                         | names only     | − routed needs | − synonyms     | − name match   | **tecton search**             |
| --------------------------------- | -------------- | -------------- | -------------- | -------------- | ----------------------------- |
| set 1 (90), hit@1 / hit@3 / hit@5 | 50 / 59 / 63 % | 74 / 86 / 90 % | 74 / 88 / 93 % | 72 / 93 / 93 % | **76 / 92 / 96 %** (MRR 0.84) |
| set 2 (80), hit@1 / hit@3 / hit@5 | 45 / 55 / 55 % | 64 / 84 / 88 % | 66 / 84 / 90 % | 68 / 86 / 93 % | **69 / 90 / 95 %** (MRR 0.79) |

Before this round (2026-09-24 ranking, measured again on 2026-09-26): set 1 72 / 92 / 93 % (MRR 0.81),
set 2 69 / 86 / 90 % (MRR 0.77).

- _names only_ matches the query against ids and export names; it is roughly what grepping the
  export list gives you.
- The ablations turn off one part each:
  - _routed needs_: each guideline's `notFor` needs, indexed under the component they point at.
  - _synonyms_: the vocabulary in `guidelines/synonyms.json`.
  - _name match_: rank 1 for a query that is an id or an export (`ScrollArea`, `scroll area`,
    `SelectItem`), and the boost for a query that spells out a component's name ("button group for
    save and cancel").
- Queries by kind:
  - Terse queries (1–3 words), boundary queries (two easily confused components) and topic queries
    land in the top 3 in 87–100 % of cases.
  - Long sentences lifted from tickets land there in 80 %, because extra words dilute the ranking.
  - This is why the skill tells agents to search with a short need.

### What changed on 2026-09-26

| Change                                                                                                            | Why                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| camelCase is split in the query, and the identifier is kept whole as well                                         | `ScrollArea`, `PageHeader`, `AppShell` returned nothing; `InputGroup` returned Spinner. The index keeps identifiers in its prose whole, so `SelectItem` in a Do bullet is not one more "select" and `isSelected` still finds the React Aria topic.                         |
| An exact id or export ranks first; a spelled-out name is boosted                                                  | `tecton search ScrollArea` must return ScrollArea first.                                                                                                                                                                                                                   |
| Plurals are stripped before `-ing` / `-ed` (Porter 1a, then 1b)                                                   | `menus`, `warnings`, `headings` returned nothing.                                                                                                                                                                                                                          |
| `page`, `show`, `display`, `user` are no longer stopwords; `'s` and `n't` scraps and 1-letter words are dropped   | "page header" searched for "header"; "engineer's" indexed an `s`.                                                                                                                                                                                                          |
| Synonym keys may be phrases                                                                                       | `pin code`, `progress ring`, `split view`, `split pane`, `horizontal rule`, `page numbers`, `next page`, `per page`, `design token`, `verification code` fire only on the whole phrase.                                                                                    |
| Dropped `palette`, `token`, `ring`, `split`, `pin`, `rule`, `survey`, `pages`                                     | Single words that hijacked a query: "color palette" → Command, "design tokens" → Chip, "focus ring" → CircularProgress, "split button" → Resizable, "pin a column" → InputOTP, "rules" → Separator, a seismic "survey line" → Questionnaire, "settings page" → Pagination. |
| Dropped `tags`, `expandable`, `breadcrumbs`, `scrollable`, `spinner`, `radio`, `otp`, `shell`, `header`, `swatch` | Duplicates of another key after stemming, or keys that only expanded to themselves; `agent:build` now rejects both.                                                                                                                                                        |
| Added `percent`, `percentage` → progress                                                                          | Nothing in the guidelines says "percent". **Added after reading the misses of both sets** — see below.                                                                                                                                                                     |
| Tried and dropped: down-weighting words only one entry uses in long queries                                       | Halving them from 7 query words on moved no hit@3 and cost a hit@1 on set 1; from 10 words on it cost a hit@3 on set 2.                                                                                                                                                    |

## Leakage

Neither query set measures how search does on queries nobody has looked at:

- Both sets have been read, query by query, while the ranking and the vocabulary were tuned, and
  both serve as CI floors. A change that fixes one of their misses is, by construction, fitted to
  it.
- The git history was squashed: `synonyms.json` and both query files arrived in the same commit, so
  there is no record of which synonyms predate which queries. Treat every synonym as written with
  both sets in view.
- These `synonyms.json` keys fire on eval queries today (`search-eval.mjs` expands them). A number in
  brackets is how many hit@3 results depend on the key; without it that query drops out of the top
  3:
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
- `percent` and `percentage` were added in this round after seeing three misses they fix. Without
  them set 1 scores 90 % and set 2 89 % hit@3. `verification code` was added as ordinary OTP
  vocabulary and matches a set 1 query word for word; no hit depends on it.
- The name boost (`NAME_BOOST = 2` in `bin/tecton-lib.mjs`) was picked from a grid run on both sets.

### A third set

What would measure generalisation is a third set that stays unseen:

1. Someone who has not read `guidelines/`, `guidelines/synonyms.json` or the two sets above writes
   60–100 queries from the module names and exports alone, in the same JSON shape (`q`, `answers`,
   `kind`), as `queries.frozen-3.json`.
2. It is added to `sets.json` with `"use": "report"` and committed as written — never edited
   afterwards, not even to fix an answer (record a disputed answer in its `origin` instead).
3. Its score goes in this README next to the others. Nobody changes the ranking or the vocabulary
   to move it, and it never gets a floor in `agent-search.test.ts` (the test fails if it does).
4. When it has been looked at to debug a miss, it is spent: switch it to `"use": "floor"` and
   freeze a new one.
