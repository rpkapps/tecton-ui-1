---
name: tecton-core
description: >
  Tecton UI (@tecton/react) — the enterprise React design system built on
  shadcn/ui with the React Aria base. Load before writing or editing any JSX
  that imports from @tecton/react, or when choosing a component, a variant, a
  colour or a Tailwind class in a Tecton application. Covers the import
  surface (@tecton/react/components/*, /tecton/*, /icons), the React Aria prop
  conventions that differ from stock shadcn/Radix (onPress, isDisabled,
  isSelected, id on collection items, no asChild), and the palette rule that
  makes stock Tailwind colour classes (bg-red-500, text-zinc-400) emit no CSS
  at all. Routes to sub-skills for setup, styling, components, forms, tables,
  layout, icons and blocks.
metadata:
  type: core
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
sources:
  - 'rpkapps/tecton-ui-1:README.md'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/index.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/linting.mdx'
---

# Tecton UI — Core

`@tecton/react` is the React component library for Tecton, an enterprise
geoscience application suite. Every standard component is the **shadcn/ui**
implementation on the **React Aria** base, installed by the shadcn CLI from a
Tecton style (`aria-tecton`) and themed entirely through the shadcn CSS
variables. Tecton-specific components that shadcn has no counterpart for live
alongside them.

Three facts drive almost every mistake an agent makes here. Read them before
writing code.

1. **The base is React Aria, not Radix.** Props are `onPress`, `isDisabled`,
   `isSelected`; collection items are keyed by `id`, not `value`; there is no
   `asChild` and no `DialogContent`. An agent's stock-shadcn prior is wrong on
   almost every interactive component.
2. **Tailwind's stock palette is deleted.** `globals.css` sets
   `--color-*: initial` before declaring the Tecton ramps, so `bg-red-500` and
   `text-zinc-400` generate **no CSS** — they type-check, they lint clean under
   an ordinary setup, and they render unstyled.
3. **The look belongs to the component, not the application.** Colour, shape,
   typography, size and padding are owned by variants. `className` is for
   layout and composition only.

## Sub-skills

| Need to...                                                    | Read                              |
| ------------------------------------------------------------- | --------------------------------- |
| Install the package, wire the stylesheet, dark mode, ESLint    | `tecton-core/setup/SKILL.md`      |
| Pick a colour, a class, a token; know what `className` may do  | `tecton-core/styling/SKILL.md`    |
| Use a shadcn-based component (Button, Dialog, Select, Tabs…)   | `tecton-core/components/SKILL.md` |
| Use a Tecton-only component (Chip, Stat, Panel, TreeView…)     | `tecton-core/tecton-components/SKILL.md` |
| Build a form, validate input, show errors                      | `tecton-core/forms/SKILL.md`      |
| Build a data table with sorting, selection, pagination         | `tecton-core/data-tables/SKILL.md` |
| Lay out a page, a shell, a toolbar or a collapsing action row  | `tecton-core/layout/SKILL.md`     |
| Render an icon                                                 | `tecton-core/icons/SKILL.md`      |
| Scaffold a whole screen from a block                           | `tecton-core/blocks/SKILL.md`     |

## Quick decision tree

- Adding a component to a screen? → `tecton-core/components` for the API
  shape, then `tecton-core/styling` before you touch `className`.
- Reaching for a colour? → `tecton-core/styling`. Never a stock Tailwind
  colour, never a hex value.
- About to write `className="bg-… text-… rounded-… h-… p-…"` on a Tecton
  component? → Stop. That is a variant. `tecton-core/styling § What className
  may do`.
- Component does not exist in `@tecton/react`? → `tecton-core/tecton-components
  § Before you build one`. It is usually a variant of a shadcn component.
- Running `shadcn add <name>`? → Almost certainly wrong. Only **blocks** come
  from the registry; see `tecton-core/blocks`.

## The import surface

```tsx
import "@tecton/react/globals.css"

import { Button } from "@tecton/react/components/button" // shadcn/ui, React Aria base
import { Chip } from "@tecton/react/tecton/chip" // Tecton-only component
import { WellIcon } from "@tecton/react/icons" // Tecton icon set
import { cn } from "cn" // class merger
```

There are exactly three component entry points:

| Path                             | Holds                                                     |
| -------------------------------- | --------------------------------------------------------- |
| `@tecton/react/components/<name>` | The 59 shadcn/ui component modules, React Aria base        |
| `@tecton/react/tecton/<name>`     | Tecton-only components with no shadcn counterpart          |
| `@tecton/react/icons`             | The 131-glyph Tecton icon set                              |

`@tecton/react/lib/utils`, `@tecton/react/hooks/*`, `@tecton/react/styles/*`
and `@tecton/react/blocks/*` also exist. There is **no root export**:
`import { Button } from "@tecton/react"` fails.

## Common Mistakes

### CRITICAL Importing a component from a `components/ui/` path

Wrong:

```tsx
import { Button } from "@/components/ui/button"
```

Correct:

```tsx
import { Button } from "@tecton/react/components/button"
```

A file under `components/ui/` means someone ran `shadcn add button` against
the **default** registry and got a Radix component with the stock palette —
the wrong base and the wrong theme. It renders with Tailwind colours that
Tecton has deleted, so it is both unthemed and partly unstyled, and it does
not upgrade with the package. `@tecton/eslint-config` flags this import.

Source: `apps/www/content/docs/linting.mdx`, `packages/eslint-config-tecton/index.js`

### CRITICAL Stock Tailwind colour classes that silently render nothing

Wrong:

```tsx
<div className="bg-red-500 text-zinc-400">Error</div>
```

Correct:

```tsx
<div className="bg-destructive-surface text-muted-foreground">Error</div>
```

`globals.css` resets `--color-*: initial` before declaring the Tecton ramps,
so a stock Tailwind colour utility matches no theme entry and Tailwind emits
no rule for it. There is no error and no visual fallback — the element just
inherits. See `tecton-core/styling`.

Source: `apps/www/content/docs/theming.mdx § Palette`

### CRITICAL Radix/stock-shadcn props on a React Aria component

Wrong:

```tsx
<Button onClick={save} disabled={busy}>Save</Button>
```

Correct:

```tsx
<Button onPress={save} isDisabled={busy}>Save</Button>
```

Every interactive component wraps a `react-aria-components` primitive.
`onClick` is not part of its prop type, and `disabled` is not the prop that
drives the disabled styling or `aria-disabled`. The handler never fires and
the control stays enabled. See `tecton-core/components`.

Source: `packages/tecton-react/src/components/button.tsx`

### HIGH Restyling a component instead of using its variant

Wrong:

```tsx
<Badge className="bg-green-600 text-white">Active</Badge>
```

Correct:

```tsx
<Badge variant="success">Active</Badge>
```

Tecton adds variant axes that stock shadcn does not have — `success`,
`warning` and `info` on `Alert` and `Badge`, `appearance` on both, `emphasis`
on `Separator`, `filled`/`text` on `Input`, `Textarea` and `Select`. An agent
that does not know they exist paints the colour by hand, loses the dark-mode
pair and the contrast guarantee, and (with a stock colour) renders nothing.

Source: `docs/UPSTREAM.md § The aria-tecton style`

### HIGH Adding a `dark:` variant to a palette class

Wrong:

```tsx
<div className="bg-gray-120 dark:bg-gray-830">…</div>
```

Correct:

```tsx
<div className="bg-gray-120">…</div>
```

A Tecton palette step is a **contrast level**, not a fixed colour: each step
holds a different value in light and dark and switches with the mode. Pairing
two steps with `dark:` inverts the intent — the dark override picks the step
meant to be high-contrast on dark and applies it as a surface.

Source: `apps/www/content/docs/theming.mdx § Palette`

### MEDIUM Installing components with the shadcn CLI

Wrong:

```bash
npx shadcn@latest add button card dialog
```

Correct:

```bash
# components already ship in the package — just import them
npx shadcn@latest add @tecton/dashboard-01   # blocks only
```

Components are shipped in `@tecton/react` so every application runs the same
themed build and upgrades with it. Only **blocks** are published to the
`@tecton` registry. Running `shadcn add <name>` without the `@tecton`
namespace pulls the stock component from the public registry.

Source: `README.md § Design rules`, `apps/www/content/docs/installation.mdx`

## Verifying your work

`@tecton/eslint-config` is the fastest check that code follows these rules —
it is designed to catch exactly the silent failures above, and its messages
name the fix. If the project has it configured, run ESLint on the files you
changed before you finish. See `tecton-core/setup § Guardrails`.

## Version

Targets `@tecton/react` 0.0.0 (shadcn/ui pinned at `3ba91b1`, React Aria
Components 1.21, React 19, Tailwind CSS v4).
