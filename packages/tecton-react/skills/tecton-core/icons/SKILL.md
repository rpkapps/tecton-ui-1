---
name: icons
description: >
  Icons in a Tecton application. Load when rendering any icon, choosing
  between lucide-react and @tecton/react/icons, or sizing/positioning an icon
  inside a Button, Badge, Alert or menu item. Tecton ships 131 domain glyphs
  (wells, horizons, seismic, drill bits) from @tecton/react/icons with a
  Lucide-compatible signature plus variant="outlined" | "filled"; lucide-react
  stays the icon library the generated shadcn components use internally.
  Covers the data-icon="inline-start" / "inline-end" attribute that makes a
  control adjust its own padding, why you should not set an icon size with
  className, and the lucide-compat alias for rendering Tecton glyphs inside
  the generated components.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/icons.mdx'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/icons/icons.json'
---

# Tecton UI — Icons

Two icon libraries coexist, on purpose.

| Library                | Import                   | Use for                                       |
| ---------------------- | ------------------------ | --------------------------------------------- |
| **Tecton icons** (131) | `@tecton/react/icons`    | Application UI, and every domain glyph        |
| **Lucide**             | `lucide-react`           | What the generated components use internally  |

Lucide stays the shadcn CLI's `iconLibrary` so generated files never change.
In your own code, prefer a Tecton icon when one exists.

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

```tsx
import { WellIcon, SeismicIcon } from "@tecton/react/icons"
import { SearchIcon } from "lucide-react"

;<WellIcon />
<SeismicIcon variant="filled" size={20} />
```

Every Tecton icon is a React component with the Lucide-compatible signature —
`size`, `strokeWidth`, `className` and SVG props — plus
`variant="outlined" | "filled"` (default `outlined`). Names are PascalCase with
an `Icon` suffix: `add.tsx` → `AddIcon`, `chevron-down.tsx` → `ChevronDownIcon`.

## Core patterns

### An icon inside a control

Mark the icon's position with `data-icon`. The control reads it and tightens
the padding on that side itself:

```tsx
<Button>
  <WellIcon data-icon="inline-start" /> New well
</Button>

<Button variant="outline">
  Export <ChevronDownIcon data-icon="inline-end" />
</Button>
```

`Button`, `Badge` and the other controls already size the icon through their
variants (`size-4` at default, `size-3` at `xs`). Do not set a size yourself.

### An icon-only button

```tsx
<Button size="icon" aria-label="Delete well">
  <DeleteIcon />
</Button>
```

The `aria-label` is required — there is no text to name the control.

### Rendering Tecton glyphs inside the generated components

Alias `lucide-react` in the bundler. The generated files keep importing
`lucide-react`; only resolution changes:

```ts title="vite.config.ts"
export default defineConfig({
  resolve: {
    alias: { "lucide-react": "@tecton/react/icons/lucide-compat" },
  },
})
```

The compat module re-exports every Lucide name the components use, mapped to
the matching Tecton icon when one exists and to Lucide otherwise.

## Common Mistakes

### HIGH Sizing an icon with a Tailwind class inside a control

Wrong:

```tsx
<Button size="xs">
  <WellIcon className="size-4" /> New well
</Button>
```

Correct:

```tsx
<Button size="xs">
  <WellIcon data-icon="inline-start" /> New well
</Button>
```

Each button size already sets its icon size — `size-4` at `default`, `size-3`
at `xs`. The rule that does it is written `[&_svg:not([class*='size-'])]`, so
adding any `size-*` class **opts the icon out** of the control's sizing
entirely. The icon then stays 16px in a 24px button.

Source: `packages/tecton-react/src/components/button.tsx`

### HIGH Omitting `data-icon` on an icon beside a label

Wrong:

```tsx
<Button>
  <WellIcon /> New well
</Button>
```

Correct:

```tsx
<Button>
  <WellIcon data-icon="inline-start" /> New well
</Button>
```

The control tightens its leading or trailing padding only when it can see
which side the icon is on (`has-data-[icon=inline-start]:pl-1.5`). Without the
attribute the button keeps full padding on both sides and reads visibly
wider and off-rhythm next to buttons that set it.

Source: `packages/tecton-react/src/components/button.tsx`

### MEDIUM Installing another icon package

Wrong:

```bash
npm install react-icons @heroicons/react
```

Correct:

```tsx
import { WellIcon } from "@tecton/react/icons"
```

The Tecton set is the design system's own export — the glyphs are drawn to the
same grid and stroke weight, and they carry the `filled` variant the components
use for selected states. A third-party set is visually foreign and, because it
sizes itself, ignores the control's icon sizing.

Source: `apps/www/content/docs/icons.mdx`

### MEDIUM Colouring an icon directly

Wrong:

```tsx
<AlertIcon className="text-yellow-500" />
```

Correct:

```tsx
<Alert variant="warning">
  <AlertIcon />
  <AlertTitle>Survey is stale</AlertTitle>
</Alert>
```

Icons inherit `currentColor`, and the status variants already set it
(`*:[svg]:text-current`). `text-yellow-500` is a stock Tailwind class that
emits no CSS, so the icon simply keeps the inherited colour — and had it
worked, it would have fought the variant.

Source: `packages/tecton-react/src/components/alert.tsx`
