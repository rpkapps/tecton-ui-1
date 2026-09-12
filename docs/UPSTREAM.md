# Upstream shadcn/ui pin

Every generated file under `packages/tecton-react/src/components/**`,
`src/hooks/**`, `src/lib/**` and the scaffold of `packages/tecton-react/src/styles/globals.css`
was produced by the shadcn CLI, never by hand.

- Repository: https://github.com/shadcn-ui/ui
- Commit: `3ba91b1cc83e1bbe4ab35a422ff2a694849c5048` (main, 2026-09-12)
- CLI: `shadcn@4.21.0` (built from the same commit, `packages/shadcn`)
- Base / style: `aria` / `vega` → registry style `aria-vega`
- Template: `start-monorepo` (`shadcn init --template start --monorepo --base aria --preset vega`)
- Runtime package: `shadcn@^4.21.0` (`@import "shadcn/tailwind.css"`)

## How the files were generated

```bash
# 1. Registry mirror (only needed while ui.shadcn.com is unreachable)
scripts/registry-mirror.sh setup
scripts/registry-mirror.sh serve &          # http://127.0.0.1:4000
export REGISTRY_URL=http://127.0.0.1:4000/r

# 2. Scaffold (run once, in an empty directory, then moved into this repo)
pnpm dlx shadcn@4.21.0 init --template start --monorepo --base aria --preset vega --name tecton-ui-1
#    packages/ui -> packages/tecton-react (@tecton/react), apps/web -> apps/www (config edits only)

# 3. All 60 aria UI items
pnpm dlx shadcn@4.21.0 add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb \
  button button-group calendar card carousel chart checkbox collapsible combobox command \
  context-menu dialog drawer dropdown-menu empty field form hover-card input input-group \
  input-otp item label pagination popover progress radio-group resizable scroll-area select \
  separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle \
  toggle-group tooltip kbd native-select direction attachment bubble message-scroller \
  questionnaire marker message -c packages/tecton-react
```

`add --all` is not used on purpose: the global index also lists `menubar`,
`navigation-menu` and `toast`, which do not exist in the aria registry and make
the command abort.

## Updating

```bash
export REGISTRY_URL=http://127.0.0.1:4000/r   # or unset when ui.shadcn.com is reachable
pnpm dlx shadcn@latest add button --diff button.tsx -c packages/tecton-react   # preview
pnpm dlx shadcn@latest add button --overwrite -c packages/tecton-react          # apply
pnpm tokens:build                                                               # re-apply Tecton variables
pnpm generated:check                                                            # confirm nothing was hand-edited
```

Bump the commit above when the mirror is rebuilt from a newer upstream.

## Docs pages and examples

`apps/www/content/docs/components/*.mdx` and the examples in `apps/www/src/examples/*.tsx`
whose first line is `// Synced from shadcn/ui …` are synced from the same upstream commit
(`apps/v4/content/docs/components/aria/*.mdx`, `apps/v4/examples/aria/*.tsx`) by
`pnpm docs:sync` (`apps/www/scripts/sync-upstream-docs.mts`), with import paths rewritten to
`@tecton/react/...`. shadcn/ui is MIT licensed (see `LICENSE.md` in the upstream repository);
the synced content keeps that license. Examples that need upstream-only infrastructure are
skipped and listed in `apps/www/scripts/sync-report.json`.

## Known CLI quirk: `"use client"` in `--diff`

With `rsc: false`, `shadcn add … --diff` and `shadcn add … --overwrite` disagree on whether the
`"use client"` directive is kept, so `--diff` reports a one-line difference for some files that
were written by the CLI itself. `scripts/generated-check.sh` ignores differences that consist only
of that directive; any other difference fails the check.
