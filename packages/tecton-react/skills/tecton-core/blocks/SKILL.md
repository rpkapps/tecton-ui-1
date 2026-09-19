---
name: blocks
description: >
  Tecton blocks — ready-made, self-contained screen compositions (dashboards,
  sidebars, login, settings, canvas, page states, domain panels for wells,
  horizons and facies) published as a shadcn registry under the @tecton
  namespace. Load when scaffolding a whole screen or route, when asked to
  build a dashboard/settings/login/error page, or when running the shadcn CLI
  against a Tecton project. Blocks are the ONLY thing installed from the
  registry — components always come from the @tecton/react package, so
  `shadcn add button` is always wrong and `shadcn add @tecton/dashboard-01`
  is right. Covers the block anatomy (page.tsx, components/, data.ts), the
  components.json registry entry, and that a copied block is yours to edit
  while the components it imports are not.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/blocks/README.md'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/installation.mdx'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/registry.json'
---

# Tecton UI — Blocks

Blocks are full compositions — a dashboard, a sidebar layout, a login screen,
a domain panel — meant to be **copied into your application and adapted**.
They are the only items published to the `@tecton` shadcn registry.

The split is the whole point:

| Thing        | Delivery                         | Yours to edit? |
| ------------ | -------------------------------- | -------------- |
| Components   | imported from `@tecton/react`    | No — they upgrade with the package |
| Blocks       | copied into your repo by the CLI | Yes — a starting point |

## Non-negotiables

True everywhere in Tecton, whichever skill you loaded.

1. **Stock Tailwind colours emit no CSS.** `globals.css` resets
   `--color-*: initial`, so `bg-red-500` and `text-zinc-400` produce no rule
   and render unstyled — no error, no fallback. Use a semantic token
   (`bg-primary`, `text-success`) or a palette step (`bg-blue-120`).
   Detail: `tecton-core/styling`.
2. **Props are React Aria's, not Radix's.** `onPress` not `onClick`; `is*`
   state props (`isDisabled`, `isSelected`, `isRequired`); `id` not `value`
   on Select, Tabs, Accordion, ToggleGroup and Menu items; no `asChild`.
   Detail: `tecton-core/components`.

## Setup

```jsonc title="components.json"
{ "registries": { "@tecton": "https://<docs-host>/r/{name}.json" } }
```

```bash
npx shadcn@latest add @tecton/dashboard-01
```

The `@tecton/` namespace is required. The copied files import components from
`@tecton/react`, so the package must already be installed.

For a private host, add headers to the registry entry:

```jsonc
{
  "registries": {
    "@tecton": {
      "url": "https://…/r/{name}.json",
      "headers": { "Authorization": "Bearer ${TECTON_TOKEN}" }
    }
  }
}
```

## What is available

| Category      | Blocks                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Shells        | `shell-01`, `sidebar-01` … `sidebar-04`, `canvas-01`                    |
| Screens       | `dashboard-01`, `list-01`, `detail-01`, `content-01`, `settings-01`      |
| Auth          | `login-01`, `session-expired-01`, `forbidden-01`                        |
| Page states   | `page-state`, `not-found-01`, `server-error-01`, `offline-01`, `maintenance-01` |
| Domain        | `well-design-card`, `horizons-panel`, `facies-modeling-panel`, `cost-vs-risk-panel`, `fda-card`, `fda-comparison-table`, `ai-agent-panel` |

## Anatomy

Each block is a folder:

```
dashboard-01/
  page.tsx          default-exports the full-page composition (usable as a route)
                    and named-exports the reusable parts
  components/*.tsx  those parts
  data.ts           realistic mock data and domain types
```

`data.ts` means a block renders with **no backend** — that is what makes it a
usable starting point. Replacing it with real data is the first thing you do
after copying.

Blocks follow the same rules as everything else: components from
`@tecton/react/components/*` and `@tecton/react/tecton/*`, theme tokens only
(chart series use `var(--chart-n)`), responsive, dark-first, React Aria
conventions (`onPress`, `onChange`).

## Common Mistakes

### CRITICAL `shadcn add <name>` without the `@tecton` namespace

Wrong:

```bash
npx shadcn@latest add dashboard-01 button card
```

Correct:

```bash
npx shadcn@latest add @tecton/dashboard-01
# button and card are already in @tecton/react — just import them
```

Without the namespace the CLI resolves against the **public** shadcn registry
and writes stock Radix components with the stock palette into
`components/ui/`. Those components use a palette Tecton has deleted, so they
are both unthemed and partly unstyled — and they never upgrade with the
package. `registry:build` in this repo fails if a non-block item ever reaches
`registry.json`, precisely so this cannot happen from the Tecton side.

Source: `README.md § Design rules`, `apps/www/content/docs/installation.mdx`

### HIGH Treating a copied block as library code

Wrong: leaving `data.ts` in place and building around the mock shapes, or
avoiding edits to the copied files because they look generated.

Correct: replace `data.ts` with your real types and data source, delete the
parts of the composition you do not need, and keep the `@tecton/react`
imports exactly as they are.

A block is a starting point that now lives in your repository — it does not
update, and nothing re-copies over it. Its *imports* are the library; the
composition is yours.

Source: `packages/tecton-react/src/blocks/README.md`

### MEDIUM Copying a block's components into `components/ui/`

Wrong:

```
src/components/ui/button.tsx   ← extracted from a block
```

Correct: leave the block importing `@tecton/react/components/button`.

Blocks import components; they do not vendor them. Extracting one into
`components/ui/` forks it from the design system, and
`@tecton/eslint-config` flags every import from that path.

Source: `packages/eslint-config-tecton/index.js`

See also: `tecton-core/setup/SKILL.md` — the `components.json` registry entry.
