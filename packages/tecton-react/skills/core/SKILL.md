---
name: core
description: >
  Foundation for writing any UI with @tecton/react. Covers the import paths
  (@tecton/react/components/<name>, @tecton/react/tecton/<name>,
  @tecton/react/icons — there is no root export), the @tecton/react/globals.css
  stylesheet and the dark-first `dark` class, why components are never installed
  with `shadcn add` and why files under components/ui are the wrong base, the
  reset Tailwind palette where bg-red-500 and text-zinc-400 emit no CSS at all,
  the semantic tokens (bg-primary, text-muted-foreground, text-destructive,
  bg-warning-surface) and the Tecton palette steps (bg-blue-120, text-blue-830),
  the rule that variants own colour, shape, size and padding while className
  carries layout only, the Tecton variant axes on Alert, Badge, Separator, Input,
  Textarea and SelectTrigger, data-icon="inline-start" spacing, Tecton domain
  glyphs versus Lucide, and the @tecton/eslint-config guardrails. Load before
  writing or editing any Tecton markup, className, import or stylesheet.
metadata:
  type: core
  library: "@tecton/react"
  library_version: "0.1.0"
sources:
  - "../../README.md"
  - "../../apps/www/content/docs/installation.mdx"
  - "../../apps/www/content/docs/linting.mdx"
  - "../../apps/www/content/docs/theming.mdx"
  - "../../apps/www/content/docs/icons.mdx"
  - "../eslint-config-tecton/index.js"
---

# Building with @tecton/react

`@tecton/react` is shadcn/ui on the React Aria base, themed for Tecton and
shipped as one package. Every component the application uses is already in it.

Load `@tecton/react#react-aria` before writing props — the controls are React
Aria, not Radix, and `onClick` / `checked` / `value` silently do the wrong thing.

## Before you finish

Run this list against the file you just wrote, whatever family skills you
loaded. Every line is a condition that has to hold in that file.

- **Imports** — every component comes from `@tecton/react/components/<name>`,
  `@tecton/react/tecton/<name>` or `@tecton/react/icons`. Nothing is imported
  from the `@tecton/react` root (there is no `.` export) or from a
  `components/ui/` directory.
- **No stock Tailwind colour** — no `bg-red-500`, `text-zinc-400`,
  `border-slate-300`, `bg-emerald-600`; the palette is reset, so they emit no
  CSS. A Tecton colour is a semantic token (`bg-primary`,
  `text-muted-foreground`, `text-destructive`, `bg-warning-surface`) or a
  palette step — one of the fifteen families with a step from `50 … 1570`:
  `bg-blue-120`, `text-blue-830`, `border-yellow-160`, no `dark:` pair.
- **`className` carries layout only** — `w-full`, `mt-4`, `flex-1`,
  `col-span-2`, `gap-2`. Not `h-*`, `p-*`, `size-*`, `rounded-*`, `bg-*`, and
  not a colour or typography `text-*` / `font-*` on a component that owns it:
  `size-8` on an icon `Button` is `size="icon-sm"`, and `text-muted-foreground`
  or `font-medium` on a `TableCell` replaces styling the part already has.
- **Every control in a `Field` is labelled** — the control has an `id` and a
  `FieldLabel htmlFor` points at it; for a `Select` that `id` goes on
  `SelectTrigger`, which renders the button, because `Select` renders a `div`.
  A group of controls — a `RadioGroup`, a `ChipGroup`, a set of checkboxes — is
  named by `FieldSet` + `FieldLegend`, never by a stray `FieldLabel`.
- **React Aria prop names** — `onPress` not `onClick`, `isDisabled` not
  `disabled`, `isSelected` with `onChange(isSelected: boolean)` not `checked` /
  `onCheckedChange`, `isOpen` / `onOpenChange` not `open`, and `selectedKey` /
  `onSelectionChange` keyed by `id`, with the `Key | null` the handler receives
  narrowed rather than cast away with `as`.
- **Empty results are `Empty`** — a list, table, panel or search result with
  nothing to show renders `Empty` with `EmptyTitle` and `EmptyDescription`, not
  a stack of divs and not a `TableRow` with a `colSpan` cell; inside a `Table`
  it is what `TableBody`'s `renderEmptyState` returns.
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
  has
  an `aria-label`; a `Tooltip` describes, it does not name.
- **Menu items act through `onAction`** — on the `DropdownMenuItem`,
  `ContextMenuItem` or `CommandItem` itself, or `onAction(key)` on the menu with
  an `id` per item.
- **The `AlertDialog` confirm is `AlertDialogAction`** — it is the `Button` that
  carries `slot="close"`, so the action closes the prompt; a plain `Button`
  belongs there only when the dialog must stay open while async work runs.

## Setup

Import the stylesheet once. It carries Tailwind, the shadcn runtime styles, the
Tecton tokens and the theme variables.

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";
```

Tecton is dark-first: put the `dark` class on `<html>`. Without it you get the
Tecton light theme, which is equally complete.

```tsx title="src/app.tsx"
import { ThemeProvider } from "next-themes"

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

Then import each component from its own module:

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { WellIcon } from "@tecton/react/icons"

export function WellHeader() {
  return (
    <div className="flex items-center gap-2">
      <Button onPress={() => createWell()}>
        <WellIcon data-icon="inline-start" /> New well
      </Button>
      <Badge variant="success">Active</Badge>
    </div>
  )
}
```

Add the guardrails; they are the only thing that reports the failures below,
which are otherwise silent:

```js title="eslint.config.js"
import tecton from "@tecton/eslint-config"
import tsParser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...tecton.configs.recommended,
]
```

`configs.recommended` looks at Tecton components only: `shadcn/no-restyle`
(a `className` that overrides what a variant owns), `shadcn/require-static-classes`
(class names assembled at runtime) and `no-restricted-imports` (the `@tecton/react`
root, and anything under `components/ui/`). `configs.strict` adds `no-raw-colors`,
`no-unknown-classes`, `no-arbitrary-values` and `no-inline-styles` over every
`className` in the project, and needs `components.json`'s `tailwind.css` to reach
the Tecton stylesheet outside `node_modules`. `configs.warn` is `recommended` at
warning level for adoption.

## Three import namespaces, no root export

| Path | Holds |
| --- | --- |
| `@tecton/react/components/<name>` | The shadcn components: `button`, `badge`, `alert`, `select`, `dialog`, `field`, `input`, `tabs`, `table`, … |
| `@tecton/react/tecton/<name>` | Tecton-only components with no shadcn counterpart: `chip`, `count-badge`, `circular-progress`, `meter`, `color-swatch`, `tree-view`, `stat`, `panel`, `page-header`, `app-shell`, `copy-button`, `link`, `theme-root` |
| `@tecton/react/icons` | The 131 Tecton glyphs, including the domain set (`WellIcon`, `SeismicIcon`, `HorizonIcon`, `DrillBitIcon`, `FaultIcon`, `LogCurveIcon`, `TrajectoryIcon`, …) |

The `exports` map is enumerated, one entry per module, so a typo fails at resolve
time. Components are never installed one by one. Only **blocks** are published to
the `@tecton` registry (`npx shadcn@latest add @tecton/dashboard-01`); the copied
block files import their components from `@tecton/react`.

## Colour comes from tokens, never from Tailwind's stock palette

`globals.css` resets Tailwind's palette (`--color-*: initial`) and replaces it
with Tecton's fifteen contrast ramps, so `bg-red-500` and `text-zinc-400`
generate **no CSS at all** — they type-check, they lint clean without
`@tecton/eslint-config`, and they render unstyled.

1. **A semantic token first**: `bg-primary`, `text-primary-foreground`,
   `bg-card`, `text-muted-foreground`, `border-border`, `text-destructive`,
   `text-success`, `text-warning`, `text-info`, `bg-warning-surface`,
   `bg-surface-alt`, `border-border-subtle`, `border-border-strong`.
2. **A Tecton palette step** for a chart series or a custom tag:
   `bg-blue-120 text-blue-830` (tinted surface), `bg-green-560 text-green-50`
   (solid fill), `text-red-560` (coloured text), `border-yellow-160`.
   Families: `azure blue graphite gray green lemon lilac lime mauve orchid pink
   red saffron violet yellow`. Steps run `50 … 1570`, not `50 … 950`.

A step is a **contrast level**, not a lightness: `blue-120` is pale on light and
deep on dark. One class serves both modes, so a palette step never takes a
`dark:` pair. An application does not declare its own `--color-*`; a colour the
palette does not cover is a change to the Tecton token export.

## Variants own the look, className carries layout

| | Examples |
| --- | --- |
| **Allowed in `className`** | `w-full`, `mt-4`, `flex-1`, `col-span-2`, `absolute top-0`, `gap-2` |
| **Denied — a variant owns it** | `bg-blue-600`, `h-12`, `p-6`, `rounded-full`, `text-[13px]`, `border-slate-200` |

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

Lucide is what the generated components use internally; Tecton's own 131 glyphs
share the Lucide signature and add `variant="outlined" | "filled"`. Reach for a
Tecton domain glyph whenever one exists, Lucide for the generic ones.

```tsx
import { Button } from "@tecton/react/components/button"
import { SeismicIcon, WellIcon } from "@tecton/react/icons"
import { SearchIcon } from "lucide-react"

export function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline">
        <WellIcon data-icon="inline-start" /> Wells
      </Button>
      <Button size="icon" aria-label="Search">
        <SearchIcon />
      </Button>
      <SeismicIcon variant="filled" size={20} />
    </div>
  )
}
```

`data-icon="inline-start"` / `data-icon="inline-end"` is what tightens the
padding on that side. `Button`, `Badge` and `TabsTrigger` all key their padding
off it.

## Common Mistakes

### [CRITICAL] Stock Tailwind colour renders nothing

Wrong:

```tsx
<div className="rounded-md bg-red-500 p-4 text-zinc-50">Rig offline</div>
```

Correct:

```tsx
<div className="rounded-md bg-destructive-surface p-4 text-destructive-surface-foreground">
  Rig offline
</div>
```

`globals.css` sets `--color-*: initial` before declaring the Tecton ramps, so
Tailwind has no `red-500` or `zinc-50` to generate and both utilities compile to
nothing at all.

Source: apps/www/content/docs/theming.mdx (Palette); packages/tecton-react/src/styles/tecton-palette.css

### [CRITICAL] Installing a component with the shadcn CLI

Wrong:

```bash
npx shadcn@latest add button
```

```tsx
import { Button } from "@/components/ui/button"
```

Correct:

```bash
npx shadcn@latest add @tecton/dashboard-01   # blocks only
```

```tsx
import { Button } from "@tecton/react/components/button"
```

Without the `@tecton` namespace the CLI installs from the public shadcn
registry: a Radix component with the stock palette, the wrong base and the wrong
theme, which renders next to the real ones and drifts on every upgrade.
`no-restricted-imports` flags every import from a `components/ui/` directory.

Source: apps/www/content/docs/linting.mdx (Components come from the package); packages/eslint-config-tecton/index.js:116

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

The `exports` map is enumerated with one entry per module and has no `.` entry,
so the root specifier resolves to nothing; `no-restricted-imports` names the
three real namespaces in its message.

Source: apps/www/content/docs/installation.mdx (Peer requirements); packages/eslint-config-tecton/index.js:109

### [HIGH] className overriding what a variant owns

Wrong:

```tsx
<Button className="h-12 rounded-full bg-blue-600 px-6">
  Run simulation
</Button>
```

Correct:

```tsx
<Button size="lg" variant="default" className="w-full">
  Run simulation
</Button>
```

`cn` merges the call-site classes last, so the height, radius and padding of the
`size` variant are replaced silently, while `bg-blue-600` is not a Tecton step
and emits no CSS — the button ends up the wrong size with the default fill.

Source: apps/www/content/docs/linting.mdx (What you may put in className); packages/eslint-config-tecton/index.js:45

### [HIGH] Hand-built status colours where a variant exists

Wrong:

```tsx
<Badge className="bg-green-600">Producing</Badge>
<div className="rounded border border-amber-400 bg-amber-50 p-3 text-amber-800">
  Pressure trending high
</div>
```

Correct:

```tsx
<Badge variant="success">Producing</Badge>
<Alert variant="warning" appearance="filled">
  <AlertTitle>Pressure trending high</AlertTitle>
</Alert>
```

Tecton has no `amber` family at all, and its ramps step `50, 100, 105, 110, 115,
120, 130, 140, 160, 190, 220, 260, 310, 370, 460, 560, 680, 830, 1000, 1170,
1300, 1440, 1570`, so `green-600` is not one either: the badge falls back to the
default primary fill and the banner loses its border and surface entirely.

Source: apps/www/content/docs/components/badge.mdx (Status colours); apps/www/content/docs/components/alert.mdx (Tecton variants)

### [MEDIUM] Icon inside a control without data-icon

Wrong:

```tsx
<Button variant="outline">
  <WellIcon /> Wells
</Button>
```

Correct:

```tsx
<Button variant="outline">
  <WellIcon data-icon="inline-start" /> Wells
</Button>
```

The size variants tighten the leading or trailing padding with
`has-data-[icon=inline-start]:pl-1.5`, so without the attribute the icon keeps
the full text padding and the control is visibly wider than every other one.

Source: apps/www/content/docs/components/button.mdx (With Icon); packages/tecton-react/src/components/button.tsx:32

## Other skills

| Load | When |
| --- | --- |
| `@tecton/react#react-aria` | Before writing any prop or handler — the Radix-to-React-Aria map. |
| `@tecton/react#theming` | Colours, modes, an inverted section, `ThemeRoot`, micro-frontends. |
| `@tecton/react#choose-component` | Deciding which component a need maps to, across all families. |
| `@tecton/react#labels` | Badge, Chip, CountBadge, Kbd — status, tags, counters, shortcut hints. |
| `@tecton/react#feedback` | Alert, toast, Empty — messages, banners, empty states. |
| `@tecton/react#overlays` | Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip. |
| `@tecton/react#selection` | Select, Combobox, RadioGroup, ToggleGroup, Tabs, Command. |
| `@tecton/react#actions` | Button, LinkButton, Link, ButtonGroup, Toggle, menus, ActionBar. |
| `@tecton/react#progress` | Progress, CircularProgress, Meter, Spinner, Skeleton. |
| `@tecton/react#surfaces` | Card, Panel, Item, PageHeader, AppShell and its header actions, Separator. |
| `@tecton/react#forms` | Field, Input, Textarea, Checkbox, Switch, Slider, InputGroup, InputOTP. |
| `@tecton/react#navigation` | Breadcrumb, Sidebar, Pagination, AppFinder. |
| `@tecton/react#data` | Table and the TanStack Table recipe, TreeView, Chart, Stat, ColorSwatch, Calendar. |
| `@tecton/react#layout` | Accordion, Collapsible, Resizable, ScrollArea, AspectRatio. |
| `@tecton/react#presentation` | Carousel, Avatar, Overflow, Canvas, Background. |
| `@tecton/react#conversation` | Message, MessageScroller, Bubble, Attachment, Questionnaire, Marker. |
| `@tecton/react#infrastructure` | DirectionProvider, PortalProvider, ThemeRoot, Shortcuts — providers and roots. |

Re-read *Before you finish* against the file you wrote before you report it done.
