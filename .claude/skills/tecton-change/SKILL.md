---
name: tecton-change
description: Checklist for adding or changing anything in this repo that consumers or agents see — a shadcn component variant, a Tecton component, a hook, a utility, a block, a token or an icon — so the docs page, guideline, tecton CLI index, skill, tests and examples land in the same change. Use before writing code for such a change and again before finishing.
---

# Changing @tecton/react, the docs or the blocks

A change is finished when **everything a consumer or an agent reads about it** is updated in the
same branch, the checks below pass and the `tecton-reviewer` agent has reviewed it.

Read CLAUDE.md first: it says which files are generated and must never be hand-edited.

## Every change

- Search before you build: `pnpm --filter www exec tecton search "<need>"`. Do not add a
  component, hook or helper that duplicates one that exists; extend it.
- No half-implemented code: no `TODO`/`FIXME` left for later, no stub that returns a placeholder,
  no prop, option, variant or export that nothing uses or documents, no commented-out code.
- No dead code: delete what your change makes unused (files, exports, examples, dependencies).
  Grep for every export you add or rename; an example no docs page shows is dead too.
- Run the checks under "Before you finish" and fix every failure, then run the `tecton-reviewer`
  agent on the diff and fix its blocking findings.

## Per kind of change

### Tecton component (`packages/tecton-react/src/tecton/<name>.tsx`)
1. Source with shadcn conventions (`data-slot`, `cva`, `cn` from "cn", Base UI prop names).
2. Test: `src/tecton/__tests__/<name>.test.tsx` (every Tecton module has one).
3. `pnpm --filter @tecton/react exports:build` (the exports map is generated).
4. Guideline `guidelines/<name>.md` (contract: `guidelines/README.md`) and the module in exactly one
   family of `guidelines/families.json`; add `synonyms.json` entries for words users will search with.
5. `pnpm --filter @tecton/react agent:build` (the `tecton search` / `tecton docs` index).
6. Docs: `apps/www/content/docs/tecton/<name>.mdx` with at least one
   `<ComponentPreview name="<name>-demo" />`, the example in `apps/www/src/examples/<name>-demo.tsx`,
   the page in `content/docs/tecton/meta.json`, a row in the table on `content/docs/tecton/index.mdx`.
7. `pnpm --filter www docs:guidelines` (renders the guideline into the page).
8. If it changes how agents should build UI (a new rule, a new import), update
   `skills/tecton/SKILL.md` and `guidelines/topics/rules.md` (`agent:check` keeps their
   "Before you finish" lists in step).

### Hook (`packages/tecton-react/src/tecton/use-<name>.ts`)
As a Tecton component, except: plain `.ts`; the test is `__tests__/use-<name>.test.tsx`; the family
is `hooks`; the page is `apps/www/content/docs/hooks/use-<name>.mdx`, listed in
`content/docs/hooks/meta.json`; and `skills/tecton/SKILL.md` names the hook under "Imports".

### shadcn component, or a variant / style of one (`src/components/**`)
Never hand-edit. Change the overlay (`scripts/registry-mirror/overlay/`), rebuild the mirror, re-add
with `shadcn add <item> --overwrite`, run `pnpm generated:check` (CLAUDE.md has the commands). Then
update its `guidelines/<name>.md` (new variant → Do / Don't), `pnpm --filter @tecton/react agent:build`, and the docs: synced
pages change through `apps/www/scripts/sync-upstream-docs.mts` or
`apps/www/scripts/docs-extras/<name>.mdx`, then `pnpm docs:sync`. A new variant needs an example
that shows it.

### Utility
A React helper consumers import is a Tecton module (above); never add files to `src/lib/` or
`src/hooks/` (shadcn-generated). A CSS utility documented under `content/docs/utils/` comes from
the shadcn sync. A script-only helper lives next to the script that uses it, with a test under
`packages/tecton-react/scripts/__tests__/` when it has logic.

### Block (`packages/tecton-blocks/src/blocks/<name>/`)
`page.tsx` + parts + `data.ts`, an entry in `src/blocks/index.ts`, then `pnpm registry:build` and
commit `registry.json` and `apps/www/public/r`. Rules: `src/blocks/README.md`.

### Theme token / palette / icon
Tokens: `tokens/tecton.map.json` (or `src/styles/tecton-tokens.css`); palette: replace
`tokens/tecton.tokens.json` whole. Then `pnpm tokens:build && pnpm tokens:check` and commit the
output. Icons: replace the vendored export in `icons-src/tecton/` (domain glyphs only), then
`pnpm --filter @tecton/react icons:build`. Update `guidelines/topics/theming.md` when the way agents
should use them changes, then `pnpm --filter @tecton/react agent:build`.

## Before you finish

- [ ] The CI checks (`.github/workflows/ci.yml`) pass locally; scripts run with bun
      (`/root/.bun/bin` if not on PATH). At least: `pnpm format:check`,
      `pnpm --filter @tecton/react build`, `pnpm --filter @tecton/react exports:check`,
      `pnpm -r run typecheck`, `pnpm lint`, `pnpm test`, `pnpm tokens:build`,
      `pnpm --filter @tecton/react icons:build --check`, `pnpm tokens:check`,
      `pnpm --filter @tecton/react guidelines:check`, `pnpm --filter @tecton/react agent:check`,
      `pnpm --filter www docs:guidelines --check`,
      `pnpm --filter @tecton/react exec intent validate skills`, `pnpm registry:build`,
      `pnpm registry:validate`, and no generated change left in `git status`. A new docs page:
      `pnpm --filter www build && pnpm --filter www links:check`. A diff touching
      `src/components/**`, `src/hooks/**`, `src/lib/**` or the overlay: `pnpm generated:check`
      and `pnpm --filter @tecton/react use-client:check`.
- [ ] Every new or changed module has its docs page in the sidebar `meta.json` with a live
      `<ComponentPreview>`, its guideline, its `agent/` entry and its test.
- [ ] The `tecton-reviewer` agent reviewed the final diff; blocking findings are fixed.
