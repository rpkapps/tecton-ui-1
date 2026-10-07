---
name: tecton-change
description: Checklist for adding or changing anything consumers or agents see in tecton-ui-1 — a Tecton component, a hook, a shadcn component or variant, a utility, a block, a token or an icon — so its test, guideline, tecton CLI index, docs page, example and skill land in the same change. Use before writing the code and again before finishing.
---

# Changing @tecton/react, the docs or the blocks

The rules in `AGENTS.md` (generated files, overlay, tokens, palette, icons, imports) apply
throughout; this skill lists what else a change must update. A change is finished when everything
below for its kind is in the branch, the checks pass and the `tecton-review` skill has reviewed it.

## Every change

- Look it up first (`tecton search`, see AGENTS.md): extend what exists, never duplicate it.
- No half-implemented code: no `TODO`/`FIXME` left for later, no placeholder stub, no prop, option,
  variant or export that nothing uses or documents, no commented-out code.
- No dead code: delete what the change makes unused (files, exports, examples, dependencies).
  Grep for every export you add, rename or remove; an example no docs page shows is dead too.

## Per kind of change

### Tecton component (`packages/tecton-react/src/tecton/<name>.tsx`)
1. Test: `src/tecton/__tests__/<name>.test.tsx`.
2. `pnpm --filter @tecton/react exports:build` (the exports map is generated).
3. Guideline `guidelines/<name>.md` (contract: `guidelines/README.md`), the module in one family of
   `guidelines/families.json`, and `synonyms.json` entries for words users will search with.
4. `pnpm --filter @tecton/react agent:build` (the `tecton search` / `tecton docs` index).
5. Docs: `apps/www/content/docs/tecton/<name>.mdx` with at least one
   `<ComponentPreview name="<name>-demo" />`, the example in `apps/www/src/examples/<name>-demo.tsx`,
   the page in `content/docs/tecton/meta.json`, a row in the table on `content/docs/tecton/index.mdx`.
6. `pnpm --filter www docs:guidelines` (renders the guideline into the page).
7. If agents should build UI differently (a new rule, a new import), update
   `packages/tecton-react/skills/tecton/SKILL.md` and `guidelines/topics/rules.md`.

### Hook (`packages/tecton-react/src/tecton/use-<name>.ts`)
As a Tecton component, except: plain `.ts`; the family is `hooks`; the page is
`apps/www/content/docs/hooks/use-<name>.mdx`, listed in `content/docs/hooks/meta.json`, with no
index row; and `packages/tecton-react/skills/tecton/SKILL.md` names the hook under "Imports".

### shadcn component, or a variant of one (`src/components/**`)
Make the change the AGENTS.md way (overlay, `shadcn add --overwrite`, `pnpm generated:check`).
Then update its `guidelines/<name>.md` (a new variant gets a Do or Don't),
`pnpm --filter @tecton/react agent:build`, and its docs page: through
`apps/www/scripts/sync-upstream-docs.mts` or `apps/www/scripts/docs-extras/<name>.mdx`, then
`pnpm docs:sync`. A new variant needs an example that shows it.

### Utility
A React helper consumers import is a Tecton module: follow the component or hook steps. A
script-only helper lives next to the script that uses it, with a test under
`packages/tecton-react/scripts/__tests__/` when it has logic.

### Block (`packages/tecton-blocks/src/blocks/<name>/`)
Follow `src/blocks/README.md`, add the entry in `src/blocks/index.ts`, then `pnpm registry:build`
and commit `registry.json` and `apps/www/public/r`.

### Token, palette or icon
After the AGENTS.md steps, update `guidelines/topics/theming.md` (or the icons docs page) when the
way agents should use them changes, then `pnpm --filter @tecton/react agent:build`.

## Before you finish

- [ ] The CI checks in `.github/workflows/ci.yml` pass locally: `pnpm format:check`, `pnpm --filter @tecton/react build`,
      `pnpm --filter @tecton/react exports:check`, `pnpm -r run typecheck`, `pnpm lint`,
      `pnpm test`, `pnpm tokens:build`, `pnpm --filter @tecton/react icons:build --check`,
      `pnpm tokens:check`, `pnpm --filter @tecton/react guidelines:check`,
      `pnpm --filter @tecton/react agent:check`, `pnpm --filter www docs:guidelines --check`,
      `pnpm --filter @tecton/react exec intent validate skills`, `pnpm registry:build`,
      `pnpm registry:validate`, with no generated change left in `git status`. A new docs page:
      `pnpm --filter www build && pnpm --filter www links:check`. A diff touching
      `src/components/**`, `src/hooks/**`, `src/lib/**` or the overlay: `pnpm generated:check`
      and `pnpm --filter @tecton/react use-client:check`.
- [ ] The `tecton-review` skill reviewed the final diff and its blocking findings are fixed.
