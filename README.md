# Tecton UI

Enterprise React component library for **Tecton**, built on [shadcn/ui](https://ui.shadcn.com) with the **React Aria** base. Consumers see Tecton branding and `@tecton/react` imports; underneath, every standard component is the shadcn/ui implementation, installed and updated with the shadcn CLI from a Tecton **style** (`aria-tecton`) that is built exactly like upstream's own presets. Colours, radii and fonts come from the shadcn CSS variables; everything else Tecton-specific (focus ring, hover colours, the extra variants) is Tailwind class lists in that style.

```
apps/www                 TanStack Start documentation site (docs, blocks, themes, registry host)
packages/tecton-react    @tecton/react (private) — components, Tecton components, icons, blocks, theme
packages/eslint-config-tecton  @tecton/eslint-config — design-system guardrails for consuming apps
packages/tecton-react/skills   Agent Skills shipped with the package (TanStack Intent)
docs/                    UPSTREAM.md (pinned shadcn commit), TOKEN-MAPPING.md (generated)
scripts/                 registry mirror, generated-file integrity check
tecton-screenshots/      Tecton Storybook captures used as the visual reference
```

## Quick start

```bash
pnpm install
pnpm dev                       # docs site on http://localhost:3000
pnpm build                     # typecheck + build (site prerendered to apps/www/dist)
```

Requirements: Node ≥ 20, pnpm 10, [bun](https://bun.sh) for the maintenance scripts.

## Using the library

`@tecton/react` is private. Consume it as a workspace package, a packed tarball (`pnpm --filter @tecton/react pack`) or through a private registry — see the [Installation](apps/www/content/docs/installation.mdx) page. Components are not installed one by one. The docs site serves a shadcn registry (`/r/{name}.json`, namespace `@tecton`) for the **blocks** only; copied blocks import the components from the package.

```tsx
import "@tecton/react/globals.css"

import { Button } from "@tecton/react/components/button" // shadcn/ui (React Aria base)
import { Chip } from "@tecton/react/tecton/chip"         // Tecton-specific component
import { WellIcon } from "@tecton/react/icons"            // Tecton icon set
```

## Design rules

1. **Generated files are never edited.** `packages/tecton-react/src/{components,hooks,lib}/**` and the scaffold of `src/styles/globals.css` come from `shadcn add`. `pnpm generated:check` diffs every item against the registry.
2. **The Tecton style is a shadcn preset.** Upstream authors each preset as a CSS file of Tailwind `@apply` lists that its build inlines into the component sources. `scripts/registry-mirror/overlay/` holds `style-tecton.css` (Vega plus the Tecton deviations) and a small patch adding variant axes to `alert`, `badge`, `separator`, `input`, `textarea` and `select`. The mirror builds `aria-tecton` from it and the CLI installs the result. No `.style-*`, `[data-slot]` or `@layer` overrides exist.
3. **Only the shadcn CSS variables carry colours.** `tokens/tecton.map.json` maps Tecton tokens to `--background`, `--primary`, … with a confidence per value. `pnpm tokens:build` patches the variable values in `globals.css` (and nothing else); `pnpm tokens:check` verifies completeness and WCAG contrast.
4. **The Tecton colour ramps are the Tailwind palette.** `tokens/tecton.tokens.json` (Figma variables export) provides fifteen 23-step contrast ramps; `tokens:build` writes them to `src/styles/tecton-palette.css` as `--color-<family>-<step>` after resetting Tailwind's stock palette (`--color-*: initial`), so `bg-blue-560` is a Tecton colour and `bg-red-500` produces nothing. A step is a contrast level that switches value with the mode, so no `dark:` pairs are needed. Docs: `/docs/theming#palette`.
5. **A Tecton component exists only when shadcn has no counterpart.** Chip (selectable / removable tags), CountBadge, CircularProgress, Meter, ColorSwatch, TreeView, Stat, Panel, PageHeader, AppShell, CopyButton and Link live in `src/tecton/` and compose the generated components. Alerts with a severity, dividers with an emphasis, filled inputs, status badges and floating action buttons are variants of the shadcn components; data tables are built with TanStack Table on the shadcn `Table` (the docs carry the recipes).
6. **Only blocks are published to the registry.** Components ship in the package so every application runs the same themed build and upgrades with it; `registry:build` fails if a non-block item ever reaches `registry.json`. Consuming applications install `@tecton/eslint-config`, which flags stock shadcn components pulled from the public registry and `className` overriding what a Tecton variant owns. It looks at Tecton components only; `configs.strict` additionally checks every class in the project against the theme. Docs: `/docs/linting`.
7. **Dark first.** Both modes come from the Tecton token export; applications default to dark.
8. **Agents get the rules too.** `packages/tecton-react/skills/` ships versioned [Agent Skills](https://tanstack.com/intent) inside the package, so an AI coding agent working in a consuming application discovers them with `npx @tanstack/intent@latest install` and loads them from `node_modules`. They cover the same ground the linter enforces, before the code is written rather than after. Each skill declares the files it was derived from, and `pnpm skills:check` fails when one of those files changes without the skill being revisited. Docs: `/docs/agent-skills`.

## Maintenance scripts

| Command | Purpose |
| --- | --- |
| `pnpm tokens:build` / `pnpm tokens:check` | Regenerate / verify the theme from the token map |
| `pnpm generated:check` | Verify no generated component was hand-edited |
| `pnpm registry:build` | Build the `@tecton` blocks registry into `apps/www/public/r` |
| `pnpm docs:sync` | Sync shadcn docs pages + examples for the React Aria base |
| `pnpm --filter @tecton/react icons:build` | Regenerate icon components from the Tecton export in `icons-src/tecton/` |
| `pnpm compare` | Playwright captures of the state matrices next to the Storybook screenshots |
| `scripts/registry-mirror.sh` | Builds and serves the shadcn registry with the Tecton overlay (`aria-tecton`); required for every CLI command |
| `pnpm skills:validate` | Validate the shipped Agent Skills (frontmatter, naming, size, packaging) |
| `pnpm skills:check` / `pnpm skills:sync` | Detect skills whose source docs changed / regenerate the skill artifacts |
| `pnpm skills:stale` | Version drift and workspace skill coverage |

`docs/UPSTREAM.md` records the pinned shadcn/ui commit and the exact generation commands.

## Status / open items

- **Icons:** all 131 glyphs are generated from the Tecton icon export in `packages/tecton-react/icons-src/tecton/`; replace those files with a newer export and run `icons:build`.
