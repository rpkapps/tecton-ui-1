# Upstream shadcn/ui pin

Every generated file under `packages/tecton-react/src/components/**`,
`src/hooks/**`, `src/lib/**` and the scaffold of `packages/tecton-react/src/styles/globals.css`
was produced by the shadcn CLI, never by hand.

- Repository: https://github.com/shadcn-ui/ui
- Commit: `3ba91b1cc83e1bbe4ab35a422ff2a694849c5048` (main, 2026-09-12)
- CLI: `shadcn@4.21.0` (built from the same commit, `packages/shadcn`)
- Base / style: `aria` / `tecton` → registry style `aria-tecton` (see below)
- Template: `start-monorepo` (`shadcn init --template start --monorepo --base aria --preset vega`)
- Runtime package: `shadcn@^4.21.0` (`@import "shadcn/tailwind.css"`)

## The `aria-tecton` style (registry overlay)

Upstream authors every preset as a CSS file of `@apply` lists
(`apps/v4/registry/styles/style-<name>.css`); the registry build inlines those Tailwind classes
into the component sources (`apps/v4/registry/bases/aria/ui/*.tsx`). Tecton is one more preset
built the same way, from the overlay in `scripts/registry-mirror/overlay/`:

| File | What it is |
| --- | --- |
| `style-tecton.css` | Copy of `style-vega.css` with the Tecton deviations: solid 2px focus ring (`ring-2 ring-ring`), flat controls (no `shadow-xs`), buttons that lighten on hover / press, and the class lists of the extra variants below |
| `tecton.patch` | Registers the style in `registry/styles.tsx` and adds variant axes to six aria base sources: `alert` (`variant` success/warning/info + `appearance` default/outline/filled), `badge` (`variant` success/warning/info + `appearance` solid/outline + `size` default/md/lg), `separator` (`emphasis` subtle/default/strong), `input` / `textarea` / `select` trigger (`variant` outline/filled/text) |

`scripts/registry-mirror.sh build` re-applies the overlay (`git apply --3way`) and builds only
`aria-tecton`. Because the style exists nowhere else, **every CLI command that touches
`packages/tecton-react` runs against the mirror** (`REGISTRY_URL=http://127.0.0.1:4000/r`), and
`pnpm generated:check` diffs the installed files against what the mirror serves.

## How the files were generated

```bash
# 1. Registry mirror with the Tecton overlay
scripts/registry-mirror.sh setup        # clone at the pinned commit, install, overlay, build
scripts/registry-mirror.sh serve &      # http://127.0.0.1:4000
export REGISTRY_URL=http://127.0.0.1:4000/r

# 2. Scaffold (run once, in an empty directory, then moved into this repo)
pnpm dlx shadcn@4.21.0 init --template start --monorepo --base aria --preset vega --name tecton-ui-1
#    packages/ui -> packages/tecton-react (@tecton/react), apps/web -> apps/www (config edits only)
#    components.json: "style": "aria-tecton"

# 3. All 60 aria UI items
pnpm dlx shadcn@4.21.0 add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb \
  button button-group calendar card carousel chart checkbox collapsible combobox command \
  context-menu dialog drawer dropdown-menu empty field form hover-card input input-group \
  input-otp item label pagination popover progress radio-group resizable scroll-area select \
  separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle \
  toggle-group tooltip kbd native-select direction attachment bubble message-scroller \
  questionnaire marker message --overwrite -c packages/tecton-react
```

`add --all` is not used on purpose: the global index also lists `menubar`,
`navigation-menu` and `toast`, which do not exist in the aria registry and make
the command abort.

## Updating

```bash
export REGISTRY_URL=http://127.0.0.1:4000/r
pnpm dlx shadcn@latest add button --diff button.tsx -c packages/tecton-react   # preview
pnpm dlx shadcn@latest add button --overwrite -c packages/tecton-react          # apply
pnpm tokens:build                                                               # re-apply Tecton variables
pnpm generated:check                                                            # confirm nothing was hand-edited
```

### Changing the Tecton style

Edit `scripts/registry-mirror/overlay/style-tecton.css` (or the base sources in the mirror
clone, then `scripts/registry-mirror.sh export` to refresh `tecton.patch`), run
`scripts/registry-mirror.sh build`, restart `serve`, then re-add the affected items with
`--overwrite` and run `pnpm generated:check`.

### Bumping upstream

1. Update the commit above and run `scripts/registry-mirror.sh setup`. The overlay is applied with
   a 3-way merge: if upstream changed `style-vega.css`, port the change into `style-tecton.css`
   (`git diff <old>..<new> -- apps/v4/registry/styles/style-vega.css` in the mirror clone); if
   `tecton.patch` conflicts, resolve it in the clone and run `scripts/registry-mirror.sh export`.
2. `scripts/registry-mirror.sh build`, re-add all 60 items with `--overwrite`, `pnpm tokens:build`,
   `pnpm generated:check`, `pnpm --filter www docs:sync`, `pnpm typecheck`.

## Docs pages and examples

`apps/www/content/docs/components/*.mdx` and the examples in `apps/www/src/examples/*.tsx`
whose first line is `// Synced from shadcn/ui …` are synced from the same upstream commit
(`apps/v4/content/docs/components/aria/*.mdx`, `apps/v4/examples/aria/*.tsx`) by
`pnpm docs:sync` (`apps/www/scripts/sync-upstream-docs.mts`), with import paths rewritten to
`@tecton/react/...`. The Tecton sections of a synced page (the overlay variants) come from
`apps/www/scripts/docs-extras/<name>.mdx`, inserted before the upstream "API Reference".
shadcn/ui is MIT licensed (see `LICENSE.md` in the upstream repository);
the synced content keeps that license. Examples that need upstream-only infrastructure are
skipped and listed in `apps/www/scripts/sync-report.json`.

## Known CLI quirk: `"use client"` in `--diff`

With `rsc: false`, `shadcn add … --diff` and `shadcn add … --overwrite` disagree on whether the
`"use client"` directive is kept, so `--diff` reports a one-line difference for some files that
were written by the CLI itself. `scripts/generated-check.sh` ignores differences that consist only
of that directive; any other difference fails the check.
