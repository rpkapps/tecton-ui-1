# agent-eval

Measures how well a coding agent finds and uses `@tecton/react` components, and what that costs in
context. It compares the `tecton` command (`bin/tecton.mjs`) with the per-family Intent skills. Nothing
here ships in the package.

| File | What it is |
| --- | --- |
| `queries.heldout.json`, `queries.heldout-2.json` | 90 and 80 search queries with accepted answers. Each set was written by a separate agent that saw only the module names and exports, never the guideline text. |
| `search-eval.mjs` | Retrieval accuracy of `tecton search` on a query set, next to three ablations |
| `tasks.json` | 8 end-to-end UI tasks and what a correct answer contains |
| `conditions/`, `make-prompts.mjs` | One prompt per condition × task (`none`, `intent`, `cli`) |
| `grade.mjs` | Type-checks each answer against the package source, runs the rule checks and scores the expectations |
| `results/<date>/` | The answers the agents wrote, their token use (`usage.tsv`) and the grades |

```bash
node agent-eval/search-eval.mjs [queries.json] [--misses]
node agent-eval/make-prompts.mjs <out-dir> <bin-dir>   # bin-dir holds `intent` and `tecton` wrappers
node agent-eval/grade.mjs <out-dir>/runs [--json]
```

`scripts/__tests__/agent-search.test.ts` holds the top-3 accuracy on both query sets above a floor,
so CI fails if a ranking or index change makes search worse.

> Since these results, the package ships only the `tecton` skill: the 15 generated family skills and
> `choose-component` are gone, and `core`, `react-aria` and `theming` moved to `guidelines/topics/`,
> which only the command serves. The family checklists now end each `tecton docs` page. To rerun the
> `intent` condition, check out commit `a3668c2`, the last one that has the 18 skills.

## Results, 2026-09-24

### Search accuracy (`tecton search`, top results)

| Query set | names only | − routed needs | − synonyms | **tecton search** |
| --- | --- | --- | --- | --- |
| held-out 1 (90), hit@1 / hit@3 / hit@5 | 51 / 59 / 62 % | 71 / 86 / 88 % | 70 / 87 / 92 % | **72 / 92 / 93 %** (MRR 0.81) |
| held-out 2 (80), hit@1 / hit@3 / hit@5 | 43 / 55 / 57 % | 65 / 81 / 84 % | 65 / 80 / 85 % | **69 / 86 / 90 %** (MRR 0.77) |

- *names only* matches the query against ids and export names; it is roughly what grepping the
  export list gives you.
- The two ablations turn off one part each:
  - *routed needs*: each guideline's `notFor` needs, indexed under the component they point at.
  - *synonyms*: the vocabulary in `guidelines/synonyms.json`.
- Queries by kind:
  - Terse queries (1–3 words) and boundary queries (two easily confused components) land in the top 3
    in 87–100 % of cases.
  - Long sentences lifted from tickets land there in 76 %, because extra words dilute the ranking.
  - This is why the skill tells agents to search with a short need.
- History of set 1: frozen before anyone looked at its queries, it scored 70 / 92 / 93 %. After that
  came three changes: a stemmer fix (`resize`/`resizable`), the icon glyph list, and dropping
  `range → slider`. Set 2 arrived after the stemmer fix and was scored once.

### End to end (8 tasks × 3 conditions, one run each, Sonnet)

The same agent gets the same task and a different source of library knowledge:

- **none**: no documentation.
- **intent**: `intent list` / `intent load` over the 18 `@tecton/react` skills, as the Intent block
  in an application's `CLAUDE.md` asks for.
- **cli**: the `tecton` skill in context plus the `tecton` command.

| | none | intent | cli |
| --- | --- | --- | --- |
| type-clean files | 0 / 8 | **8 / 8** | **8 / 8** |
| type errors | 17 | 0 | 0 |
| rule breaks | 9 | 1 | 2 |
| expectations met | 9 / 54 (17 %) | **54 / 54** | **54 / 54** |
| tokens per run, mean | 50.2k | 90.2k | **62.1k** |
| tokens added over *none* | — | +40.0k | **+11.9k (−70 %)** |
| tool calls, mean | 2.2 | 8.5 | 9.4 |
| wall time, mean | 45 s | 49 s | 50 s |

- **Quality is the same.** Both documented conditions write type-clean code that uses the right
  components and props.
  - The remaining rule breaks are all `className` doing a component's job: `font-medium` on a
    `TableCell` (both conditions) and `px-4` on `Tabs` (cli).
  - With one run per task, the one-break difference is noise.
- **Context is not the same.** In every task the cli run added less than the intent run did: from
  6 % of intent's addition (horizon-filter) to 75 % (seismic-toolbar), 30 % on average.
  - Intent loads `core` in every run (≈4.1k tokens), `react-aria` in 5 of 8 (≈3.1k),
    `choose-component` in 3 of 8 (≈6.9k), and one to four family skills (≈2.8–6.9k each).
  - The cli run reads the skill (≈1.3k), a few searches (≈450 each) and one guideline per component
    it uses (median ≈760).
- **This setup understates Intent's cost.** The eval's `intent list` shows only `@tecton/react` (≈3k
  tokens). In this workspace the real list is 74 skills (≈9k tokens), because every package that
  ships skills is listed.
- **Without documentation the agent guesses a root barrel import** (`from "@tecton/react"`) in 7 of 8
  files. That hides every prop mistake from the type checker, so the rule and expectation columns
  are the better measure for *none*.

### Caveats

- **Sample size.** Eight tasks with one run each: good enough to see a 3× context difference, not to
  rank intent and cli on quality.
- **Leaked context.** The agents ran in this repository and saw its `CLAUDE.md`, which mentions some
  Tecton rules. That helps *none* a little, and every condition equally.
- **What the token figures measure.** They are the harness's per-run totals, and about 50k of each is
  fixed agent overhead. That is why the table shows the *added* tokens.
- **Grader adjustments.** The rule checks are heuristics. Two false positives were fixed for all
  conditions before scoring:
  - `Skeleton` is sized with `className`, as its guideline says.
  - `SheetContent` and `AlertDialogContent` are documented aliases.
- **Changes after the eval.** Two issues the runs exposed were fixed afterwards, and the e2e table
  predates both:
  - `tecton docs icons` did not resolve; it now does, and lists the glyphs.
  - The `range → slider` synonym was dropped.
