# Tecton UI

React component library for the **Tecton** design system, built on [shadcn/ui](https://ui.shadcn.com). Applications import everything from `@tecton/react`. Underneath, every standard component is the shadcn/ui implementation, installed and updated with the shadcn CLI from a Tecton **style** (`base-tecton`) built exactly like upstream's own presets.

```
apps/www                 Documentation site (TanStack Start): docs, blocks, themes, registry host
packages/tecton-react    @tecton/react (private): components, Tecton components, icons, theme
packages/tecton-blocks   @tecton/blocks (private): the blocks and the @tecton registry build
docs/                    UPSTREAM.md (pinned shadcn commit), TOKEN-MAPPING.md (generated),
                         OVERFLOW-RULES.md (the Overflow contract)
scripts/                 Registry mirror, generated-file check, package rename
tecton-screenshots/      Tecton Storybook captures used as the visual reference
```

## Quick start

```bash
pnpm install
pnpm dev      # docs site on http://localhost:3000
pnpm build    # builds every workspace package
```

Requirements: Node 22.22+ / 24.15+ / 26+, pnpm 10, [bun](https://bun.sh) for the maintenance scripts.

## Using the library

`@tecton/react` is private: consume it as a workspace package, a packed tarball or through a private registry (see [Installation](apps/www/content/docs/installation.mdx)).

```tsx
import "@tecton/react/globals.css"

import { Button } from "@tecton/react/components/button" // shadcn/ui component
import { Chip } from "@tecton/react/tecton/chip"         // Tecton component
import { WellIcon } from "@tecton/react/icons"            // Tecton icon set
```

Blocks are the only items published to a shadcn registry (`/r/{name}.json`, namespace `@tecton`); the copies import the components from the package. An application mounted inside another one uses `@tecton/react/styles/scoped.css` and the `@tecton/react/postcss/scope` plugin instead of `globals.css` (see [Micro-frontends](apps/www/content/docs/micro-frontends.mdx)). Coding agents get one Agent Skill and the `tecton` lookup command (see [AI agents](apps/www/content/docs/agents.mdx)).

## Design rules

1. **Generated files are never edited.** `packages/tecton-react/src/{components,hooks,lib}/**` and the scaffold of `src/styles/globals.css` come from `shadcn add`; `pnpm generated:check` diffs every item against the registry.
2. **The Tecton style is a shadcn preset.** `scripts/registry-mirror/overlay/` holds `style-tecton.css` (Vega plus the Tecton deviations) and `tecton.patch` (the extra variant axes). The mirror builds `base-tecton` from it and the CLI installs the result. No `.style-*`, `[data-slot]` or `@layer` overrides exist.
3. **Only the shadcn CSS variables carry the theme.** `tokens/tecton.map.json` maps Tecton tokens to `--background`, `--primary`, …; `pnpm tokens:build` patches the values in `globals.css`, `pnpm tokens:check` verifies completeness and WCAG contrast.
4. **The Tailwind palette is Tecton's.** The Figma export `tokens/tecton.tokens.json` becomes `--color-<family>-<step>` after `--color-*: initial`, so `bg-blue-560` is a Tecton colour and `bg-red-500` produces nothing. Steps are contrast levels that switch with the mode: no `dark:` pairs.
5. **A Tecton component exists only when shadcn has no counterpart.** Chip, TreeView, Meter, Stat, Panel, AppShell… live in `src/tecton/`. A Tecton look for a shadcn component is a variant in the overlay, never a second component.
6. **Only blocks are published to the registry.** Components ship in `@tecton/react` so every application runs the same themed build; `registry:build` fails if a non-block item reaches `registry.json`.
7. **Dark first.** Both modes come from the Tecton token export; applications default to dark.
8. **Every component has a usage guideline** in `packages/tecton-react/guidelines/`, rendered on its docs page and printed by `tecton docs <id>`.

## Maintenance scripts

| Command | Purpose |
| --- | --- |
| `pnpm build:lib` | Compile `@tecton/react` to `dist/` (unbundled ESM + `.d.ts`) |
| `pnpm --filter @tecton/react exports:build` / `exports:check` | Regenerate / verify the `exports` map |
| `pnpm tokens:build` / `pnpm tokens:check` | Regenerate / verify the theme from the token map |
| `pnpm generated:check` | Verify no generated component was hand-edited (needs the mirror) |
| `pnpm registry:build` / `pnpm registry:validate` | Build / validate the `@tecton` blocks registry into `apps/www/public/r` |
| `pnpm docs:sync` | Sync the shadcn docs pages and examples of the `base` base |
| `pnpm --filter @tecton/react guidelines:check` | Verify the usage guidelines |
| `pnpm --filter @tecton/react agent:build` / `agent:check` | Regenerate / verify the `tecton search` / `tecton docs` index |
| `pnpm --filter www docs:guidelines` | Sync the guidelines into the docs pages (`--check` verifies) |
| `pnpm --filter @tecton/react icons:build` | Regenerate the icon components from `icons-src/tecton/` |
| `pnpm compare` | Playwright captures next to the Storybook screenshots |
| `scripts/registry-mirror.sh` | Build and serve the `base-tecton` registry; required for every shadcn CLI command |

`docs/UPSTREAM.md` records the pinned shadcn/ui commit and the exact generation commands.
