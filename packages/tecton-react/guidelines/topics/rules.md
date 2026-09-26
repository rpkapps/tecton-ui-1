---
title: "Rules for every file: imports, setup, palette, className, variants, icons"
description: >
  Foundation for writing any UI with @tecton/react. Covers the import paths
  (@tecton/react/components/<name>, @tecton/react/tecton/<name>,
  @tecton/react/icons — there is no root export, and nothing is imported from
  the libraries underneath), the @tecton/react/globals.css stylesheet and the
  dark-first `dark` class, why components are never installed with `shadcn add`,
  the reset Tailwind palette where bg-red-500 and text-zinc-400 emit no CSS at
  all, the semantic tokens (bg-primary, text-muted-foreground, text-destructive,
  bg-warning-surface) and the Tecton palette steps (bg-blue-120, text-blue-830),
  the rule that variants own colour, shape, size and padding while className
  carries layout only and no stylesheet targets a generated component's
  data-slot, the Tecton variant axes on Alert, Badge, Separator,
  Input, Textarea and SelectTrigger, data-icon="inline-start" spacing, and
  Tecton domain glyphs versus Lucide. Load before writing or editing any Tecton
  markup, className, import or stylesheet.
sources:
  - "../../README.md"
  - "../../apps/www/content/docs/installation.mdx"
  - "../../apps/www/content/docs/theming.mdx"
  - "../../apps/www/content/docs/icons.mdx"
---

# Building with @tecton/react

`@tecton/react` is shadcn/ui themed for Tecton and shipped as one package.
Every component the application uses is already in it. Its props follow one
convention — `onClick`, `disabled`, `checked`, `value` / `onValueChange`,
`open` / `onOpenChange`, `render` — described in `tecton docs conventions`.

## Before you finish

Run this list against the file you just wrote, whatever else you
looked up. Every line is a condition that has to hold in that file.

- **Imports** — every component comes from `@tecton/react/components/<name>`,
  `@tecton/react/tecton/<name>` or `@tecton/react/icons`. Nothing is imported
  from the `@tecton/react` root (there is no `.` export), from a
  `components/ui/` directory, or from `react-aria-components` or
  `@base-ui/react`.
- **No stock Tailwind colour** — no `bg-red-500`, `text-zinc-400`,
  `border-slate-300`, `bg-emerald-600`; the palette is reset, so they emit no
  CSS. A Tecton colour is a semantic token (`bg-primary`,
  `text-muted-foreground`, `text-destructive`, `bg-warning-surface`) or a
  palette step — one of the fifteen families with a step from `50 … 1570`:
  `bg-blue-120`, `text-blue-830`, `border-yellow-160`, no `dark:` pair.
- **`className` carries layout only** — `w-full`, `mt-4`, `flex-1`,
  `col-span-2`, `gap-2`. Not `h-*`, `p-*`, `size-*`, `rounded-*`, `bg-*`, and
  not a colour or typography `text-*` / `font-*` on a component that owns it:
  `size-8` on an icon `Button` is `size="icon-sm"`. No stylesheet or
  `[data-slot=…]` selector restyles a component from outside.
- **Every control in a `Field` is labelled** — the control has an `id` and a
  `FieldLabel htmlFor` points at it; for a `Select` that `id` goes on
  `SelectTrigger`, which renders the button. A group of controls — a
  `RadioGroup`, a `ChipGroup`, a set of checkboxes — is named by `FieldSet` +
  `FieldLegend`, never by a stray `FieldLabel`.
- **Tecton prop names** — `onClick` not `onPress`, `disabled` not
  `isDisabled`, `checked` / `onCheckedChange` not `isSelected`, `value` /
  `defaultValue` / `onValueChange` (an array for multi-value) not `selectedKey`
  / `onSelectionChange`, `value` as an item's identity not `id`, and `open` /
  `onOpenChange` on the root not `isOpen`.
- **Overlays are Root + Trigger + Content** — `Dialog`, `AlertDialog`,
  `Sheet`, `Drawer`, `Popover`, `HoverCard`, `Tooltip`, `DropdownMenu` and
  `ContextMenu` hold a trigger that takes its button as
  `render={<Button />}` (never a nested `Button`, never `asChild`) and a
  `*Content` part that carries `side` / `align` and the width.
- **Empty results are `Empty`** — a list, table, panel or search result with
  nothing to show renders `Empty` with `EmptyTitle` and `EmptyDescription`, not
  a stack of divs; an empty `Table` shows it in place of the table or in one
  cell spanning every column.
- **Confirmations** — a transient one is `toast` from `sonner` with exactly one
  `<Toaster />` mounted at the application root; one that stays on the page
  until the user reads or resolves it is an `Alert` with a `variant`.
- **The component that already exists** — a KPI is a `Stat` (`StatLabel`,
  `StatValue`, `StatDelta`), a status label is a `Badge` with a `variant`, and a
  tag the user selects or removes is a `Chip` inside a `ChipGroup`. None of the
  three is a `div` with classes.
- **Icons and spinners inside controls** — every icon or `Spinner` child of a
  `Button`, `Badge`, `Chip`, `TabsTrigger` or `InputGroupAddon` carries
  `data-icon="inline-start"` or `data-icon="inline-end"`.
- **Icon-only controls are named** — every `Button`, `Toggle`,
  `ToggleGroupItem`, `InputGroupButton` and `AppShellAction` with no text child
  has an `aria-label`; a `Tooltip` describes, it does not name.
- **Menu items act through `onClick`** — on the `DropdownMenuItem` or
  `ContextMenuItem` itself (never `onAction` or `onSelect`); a `CommandItem`
  acts through `onSelect`.
- **The `AlertDialog` confirm is `AlertDialogAction`** — it runs its `onClick`
  and closes the prompt, like `AlertDialogCancel`; a plain `Button` in the
  footer leaves an uncontrolled prompt open.
- **Shortcuts are the application's** — Tecton binds no keys; a `Kbd`, a
  `DropdownMenuShortcut` or a `shortcut` prop only shows a key the application
  handles itself.

## Setup

Import the stylesheet once. It carries Tailwind, the shadcn runtime styles, the
Tecton tokens and the theme variables.

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";
```

Tecton is dark-first: put the `dark` class on `<html>` (for example with
`next-themes`, `attribute="class" defaultTheme="dark"`). Without it you get the
Tecton light theme, which is equally complete. Mount one `TectonProvider`
(`@tecton/react/tecton/provider`) at the root for the locale, the direction and
the router. Then import each component from its own module:

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { WellIcon } from "@tecton/react/icons"

export function WellHeader() {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => createWell()}>
        <WellIcon data-icon="inline-start" /> New well
      </Button>
      <Badge variant="success">Active</Badge>
    </div>
  )
}
```

Nothing at build time checks the rules above: a stock colour class type-checks,
builds and renders unstyled. The *Before you finish* list is the check.

## Three import namespaces, no root export

| Path | Holds |
| --- | --- |
| `@tecton/react/components/<name>` | The shadcn components: `button`, `badge`, `alert`, `select`, `dialog`, `field`, `input`, `tabs`, `table`, … |
| `@tecton/react/tecton/<name>` | Tecton-only components: `chip`, `count-badge`, `circular-progress`, `meter`, `tree-view`, `stat`, `panel`, `page-header`, `app-shell`, `copy-button`, `link`, `provider`, `theme-root`, … |
| `@tecton/react/icons` | The Tecton domain glyphs (`WellIcon`, `SeismicIcon`, `HorizonIcon`, `DrillBitIcon`, …); everything generic comes from `lucide-react` |

The `exports` map is enumerated, one entry per module, so a typo fails at
resolve time. Only **blocks** are published to the `@tecton` registry
(`npx shadcn@latest add @tecton/dashboard-01`); the copied block files import
their components from `@tecton/react`.

## Colour comes from tokens, never from Tailwind's stock palette

`globals.css` resets Tailwind's palette (`--color-*: initial`) and replaces it
with Tecton's fifteen contrast ramps, so `bg-red-500` and `text-zinc-400`
generate **no CSS at all**.

1. **A semantic token first**: `bg-primary`, `text-primary-foreground`,
   `bg-card`, `text-muted-foreground`, `border-border`, `text-destructive`,
   `text-success`, `text-warning`, `text-info`, `bg-warning-surface`,
   `bg-surface-alt`, `border-border-subtle`, `border-border-strong`.
2. **A Tecton palette step** for a chart series or a custom tag:
   `bg-blue-120 text-blue-830` (tinted surface), `bg-green-560 text-green-50`
   (solid fill), `text-red-560`, `border-yellow-160`. Families: `azure blue
   graphite gray green lemon lilac lime mauve orchid pink red saffron violet
   yellow`. Steps run `50 … 1570`, not `50 … 950`.

A step is a **contrast level**, not a lightness: `blue-120` is pale on light and
deep on dark, so it never takes a `dark:` pair. A colour the palette does not
cover is a change to the Tecton token export (`tecton docs theming`).

## Variants own the look, className carries layout

The Tecton variant axes that replace hand-styling:

```tsx
<Alert variant="warning" appearance="filled">…</Alert>
<Badge variant="success" appearance="outline" size="lg">Producing</Badge>
<Separator emphasis="strong" />
<Input variant="filled" />
<Textarea variant="text" />
<SelectTrigger variant="filled">…</SelectTrigger>
```

`Alert` takes `variant="default" | "destructive" | "success" | "warning" | "info"`
and `appearance="default" | "outline" | "filled"`. `Badge` takes the same status
variants plus `secondary`, `outline`, `ghost` and `link`, with
`appearance="solid" | "outline"` and `size="default" | "md" | "lg"`. `Separator`
takes `emphasis="subtle" | "default" | "strong"`. `Input`, `Textarea` and
`SelectTrigger` take `variant="outline" | "filled" | "text"`. `Button` takes
`variant="default" | "outline" | "secondary" | "ghost" | "destructive" | "link"`
and `size="default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"`.

## Icons

Tecton's domain glyphs share the Lucide signature and add
`variant="outlined" | "filled"`. Use a Tecton glyph whenever one exists,
Lucide for everything else. Inside a control an icon carries
`data-icon="inline-start"` / `"inline-end"`, which tightens the padding on that
side of a `Button`, `Badge` or `TabsTrigger`.

## Common Mistakes

### [CRITICAL] Stock Tailwind colour renders nothing

Wrong:

```tsx
<div className="rounded-md bg-red-500 p-4 text-zinc-50">Rig offline</div>
```

Correct:

```tsx
<Alert variant="destructive" appearance="filled">
  <AlertTitle>Rig offline</AlertTitle>
</Alert>
```

`globals.css` sets `--color-*: initial` before declaring the Tecton ramps, so
Tailwind has no `red-500` or `zinc-50` to generate and both utilities compile to
nothing at all.

### [CRITICAL] Installing a component with the shadcn CLI

Wrong:

```tsx
import { Button } from "@/components/ui/button" // after `npx shadcn@latest add button`
```

Correct:

```tsx
import { Button } from "@tecton/react/components/button"
```

Without the `@tecton` namespace the CLI installs from the public shadcn
registry: the stock component with the stock palette and the wrong theme, which
renders next to the real ones and drifts on every upgrade.

### [HIGH] Importing from the package root

Wrong:

```tsx
import { Button, Badge } from "@tecton/react"
```

Correct:

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
```

The `exports` map has no `.` entry, so the root specifier resolves to nothing.

### [HIGH] className overriding what a variant owns

Wrong:

```tsx
<Button className="h-12 rounded-full bg-blue-600 px-6">Run simulation</Button>
```

Correct:

```tsx
<Button size="lg" className="w-full">Run simulation</Button>
```

`cn` merges the call-site classes last, so the height, radius and padding of the
`size` variant are replaced silently, while `bg-blue-600` is not a Tecton step
and emits no CSS.

### [HIGH] Hand-built status colours where a variant exists

Wrong:

```tsx
<Badge className="bg-green-600">Producing</Badge>
```

Correct:

```tsx
<Badge variant="success">Producing</Badge>
```

Tecton's ramps step `50, 100, 105, 110, 115, 120, 130, 140, 160, 190, 220, 260,
310, 370, 460, 560, 680, 830, 1000, 1170, 1300, 1440, 1570`, so `green-600` is
not one: the badge falls back to the default fill.

## Looking further

| Run | When |
| --- | --- |
| `tecton search "<what the UI must do>"` | Deciding which component a need maps to. |
| `tecton docs <id>[,<id>]` | Before using a component: Use it when, Not for, Do, Don't and its family checklist. |
| `tecton docs conventions` | Before writing any prop, handler, controlled state or state selector. |
| `tecton docs theming` | Colours, modes, an inverted section, `ThemeRoot`, micro-frontends. |
| `tecton docs icons` | The Tecton domain glyphs by name. |

Re-read *Before you finish* against the file you wrote before you report it done.
