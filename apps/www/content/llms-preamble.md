# Tecton UI

Enterprise React component library for Tecton. Built on [shadcn/ui](https://ui.shadcn.com)
with the **React Aria** base, themed through Tecton design tokens. Published as the
package `@tecton/react`.

Standard components are the shadcn/ui React Aria implementations, so shadcn snippets work
after changing the import path. Everything Tecton needs beyond shadcn ships as separate,
clearly named components.

## Rules

If you are generating code against this library, these are the rules that matter. Each one
describes a real failure, not a style preference.

### 1. Import paths are deep and explicit

There is **no root barrel**. `import { Button } from "@tecton/react"` does not resolve —
the package has no `"."` export.

```tsx
import "@tecton/react/globals.css"                        // once, at the app root

import { Button } from "@tecton/react/components/button"  // shadcn component
import { Chip } from "@tecton/react/tecton/chip"          // Tecton-specific component
import { WellIcon } from "@tecton/react/icons"            // Tecton icon (barrel)
import { useIsMobile } from "@tecton/react/hooks/use-mobile"
import { cn } from "cn"                                   // not "@/lib/utils"
```

| Specifier | Contents |
| --- | --- |
| `@tecton/react/components/<name>` | the 60 shadcn/ui React Aria components |
| `@tecton/react/tecton/<name>` | the 20 Tecton-specific components |
| `@tecton/react/icons` | all 131 Tecton icons (`@tecton/react/icons/<slug>` also works) |
| `@tecton/react/hooks/<name>`, `@tecton/react/lib/<name>` | hooks and utilities |
| `@tecton/react/globals.css` | the theme stylesheet |

The file name is the kebab-case component name: `Button` → `components/button`,
`DropdownMenu` → `components/dropdown-menu`, `TreeView` → `tecton/tree-view`.

### 2. Never use stock Tailwind colour classes

**This is the one failure nothing catches.** The Tecton palette replaces Tailwind's:
`globals.css` resets the theme namespace with `--color-*: initial` before declaring the
Tecton ramps. So `bg-red-500`, `text-zinc-400`, `border-slate-200` and friends **generate
no CSS at all** — they do not error, do not warn, and do not fall back. The element simply
renders unstyled.

Use one of two things instead.

**A semantic token** — always the first choice, because it tracks light and dark:

```
background foreground card card-foreground popover popover-foreground
primary primary-foreground secondary secondary-foreground
muted muted-foreground accent accent-foreground
destructive destructive-foreground success success-foreground
warning warning-foreground info info-foreground neutral neutral-foreground
border border-subtle border-strong input input-hover ring surface-alt
chart-1 … chart-5   sidebar sidebar-foreground sidebar-primary sidebar-accent sidebar-border sidebar-ring
```

Status surfaces (tinted backgrounds): `success-surface`, `warning-surface`,
`info-surface`, `neutral-surface`, `destructive-surface`, each with a `-foreground`.
Interaction states exist as tokens too — `primary-hover`, `primary-pressed`,
`primary-active`, the same for `secondary`, plus `ghost-*`, `outline-*` and `link-*`
families, each with matching `-foreground`.

**A Tecton palette step** — when you need a specific hue:

```
bg-blue-120   text-blue-830   border-graphite-160
```

- Families: `gray graphite mauve violet lilac orchid pink red saffron yellow lemon lime green azure blue` (plus `white`, `black`).
- Steps: `50 100 105 110 115 120 130 140 160 190 220 260 310 370 460 560 680 830 1000 1170 1300 1440 1570`.
- A step is a **contrast level**, not a fixed colour: it means "this far from the page
  background", and its raw value switches with the mode. So `bg-blue-120` is already
  correct in light and dark — **never write a `dark:` pair for a palette step.**

### 3. React Aria, not Radix

The base is `react-aria-components`. Radix idioms do not apply.

| Instead of | Write |
| --- | --- |
| `onClick` | `onPress` |
| `disabled` | `isDisabled` |
| `checked` | `isSelected` (or `isIndeterminate`) |
| `open` | `isOpen` |
| `value` / `onValueChange` on a collection | `selectedKeys` / `onSelectionChange` |
| `type="single" \| "multiple"` | `selectionMode="none" \| "single" \| "multiple"` |
| `onSelect` on a menu item | `onAction` |
| `side` + `align` on a popover | `placement` (e.g. `"bottom start"`) + `offset` |
| `aria-invalid` | `isInvalid` |
| `data-state="open"` in a class | `aria-expanded:` |
| `data-state="checked"` in a class | `data-selected:` |

Collection items (menu, select, combobox, tree) need a `textValue` when their children are
not plain text, so typeahead works.

**`asChild` does not exist.** There is no Radix `Slot` in this library. Two replacements:

- A button that navigates is `LinkButton` — the React Aria `Link` wearing the button
  styles. It takes `href`, not `onPress`:
  ```tsx
  import { LinkButton } from "@tecton/react/components/button"

  <LinkButton href="/wells" variant="outline">All wells</LinkButton>
  ```
- Where a component must render as a different element, it takes a `render` prop:
  ```tsx
  <Badge render={(props) => <a {...props} href="/status" />}>Active</Badge>
  ```

Style interaction states with the React Aria data attributes: `data-hovered`,
`data-pressed`, `data-selected`, `data-focus-visible`, `data-disabled`, `data-entering`,
`data-exiting`. Every component also emits `data-slot="<name>"`.

### 4. Pick the right component

Tecton adds components where shadcn has no counterpart. Reach for these before building
something by hand.

| If you need | Use | Not |
| --- | --- | --- |
| A static label or status pill | `Badge` (`components/badge`) | Chip |
| A tag the user can select or remove | `Chip` + `ChipGroup` + `ChipList` (`tecton/chip`) | Badge |
| A count anchored to an icon or avatar | `CountBadge` (`tecton/count-badge`) | Badge |
| A titled content region with header actions | `Panel` (`tecton/panel`) | Card |
| A plain surface, no header contract | `Card` (`components/card`) | Panel |
| A gauge with a value the user reads | `Meter` (`tecton/meter`) | Progress |
| Task completion over time | `Progress` (`components/progress`) or `CircularProgress` (`tecton/circular-progress`) | Meter |
| An inline text link | `Link` (`tecton/link`) | LinkButton |
| A hierarchical, expandable list | `TreeView` (`tecton/tree-view`) | nested Accordion |
| A KPI figure with label and delta | `Stat` (`tecton/stat`) | hand-rolled markup |
| A toolbar row that must collapse when narrow | `Overflow` (`tecton/overflow`) | manual media queries |
| Application chrome (header, sidebar, split) | `AppShell` (`tecton/app-shell`) | hand-rolled layout |
| A page title block | `PageHeader` (`tecton/page-header`) | hand-rolled markup |
| A selection-context action bar | `ActionBar` (`tecton/action-bar`) | hand-rolled markup |

The rest of `@tecton/react/tecton/*`: `app-finder`, `background`, `canvas`,
`color-swatch`, `copy-button`, `portal`, `shell-actions`, `shortcuts`.

### 5. Tecton adds variant axes that upstream shadcn does not have

Do not assume the shadcn prop set. These are the values that exist:

| Component | Axis | Values |
| --- | --- | --- |
| `Button` | `variant` | `default` `outline` `secondary` `ghost` `destructive` `link` |
| `Button` | `size` | `default` `xs` `sm` `lg` `icon` `icon-xs` `icon-sm` `icon-lg` |
| `Alert` | `variant` | `default` `destructive` `success` `warning` `info` |
| `Alert` | `appearance` | `default` `outline` `filled` |
| `Badge` / `Chip` | `variant` | `default` `secondary` `destructive` `outline` `ghost` `link` `success` `warning` `info` |
| `Badge` / `Chip` | `appearance` | `solid` `outline` |
| `Badge` / `Chip` | `size` | `default` `md` `lg` |
| `Separator` | `emphasis` | `subtle` `default` `strong` |
| `Input` / `Textarea` | `variant` | `outline` `filled` `text` |
| `SelectTrigger` | `variant` | `outline` `filled` `text` |

There is no `size="md"` on `Button` and no `variant="primary"` anywhere — the default
button variant *is* the primary one.

### 6. Icons

131 Tecton glyphs, imported from `@tecton/react/icons` as `<Name>Icon`
(`AddIcon`, `WellIcon`, `SeismicIcon`). Props are lucide-compatible: `size` (default 24),
`strokeWidth`, `absoluteStrokeWidth`, plus `variant="outlined" | "filled"`. An icon is
`aria-hidden` unless you pass `aria-label`.

Inside a Button, mark the icon so it gets the right spacing:

```tsx
<Button><AddIcon data-icon="inline-start" />Add well</Button>
```

`lucide-react` also works and is what the generated components import internally.

### 7. Dark first

Tecton applications run dark by default; both modes come from the same token export. Use
semantic tokens and palette steps and you do not need `dark:` variants at all.

### 8. Do not restyle the components

The look belongs to the component and the theme. In `className`, **layout is yours, the
control's own box and appearance are not**:

| | Examples |
| --- | --- |
| Allowed | `w-full`, `mt-4`, `flex-1`, `col-span-2`, `absolute top-0`, `gap-2` |
| Denied | `bg-blue-600`, `h-12`, `p-6`, `rounded-full`, `text-[13px]`, `border-slate-200` |

`h-12` on a `Button` overrides its `size` variant by hand — use `size="lg"`. Never target
a component with `.style-*`, `[data-slot]` or `@layer` overrides, and never use
`style={{…}}`. If the design needs something no variant provides, add the variant to the
library rather than patching it at the call site.

This is enforced: applications install `@tecton/eslint-config`, which reports raw
palette colours, unknown classes, arbitrary values and variant overrides — with the
correct token named in the error. Run the linter and fix what it reports rather than
working around it.

### 9. Only blocks come from the registry — never components

Blocks are full-page compositions (dashboards, sidebars, error pages, domain panels).
They are the **only** thing the `@tecton` registry publishes:

```bash
npx shadcn@latest add @tecton/dashboard-01   # a block — correct
```

Components are **never** installed. They ship inside `@tecton/react` and are imported
from it, so every application runs the same themed build. Never run
`npx shadcn@latest add <component>` without the `@tecton/` namespace: that pulls from the
**public** shadcn registry and installs a Radix component with the stock Tailwind palette
— the wrong base and the wrong theme. If you find yourself importing from
`@/components/ui/...`, that is the mistake; import from `@tecton/react/components/...`
instead.

Installed blocks import their primitives from `@tecton/react/...`, so the package must be
a dependency of the consuming app.
