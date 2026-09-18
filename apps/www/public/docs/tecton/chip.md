# Chip

Selectable and removable tags in a group. Static labels are Badges.

Source: /docs/tecton/chip.md  
React Aria docs: https://react-aria.adobe.com/TagGroup

**Example — `chip-demo`**

```tsx
"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const initial = [
  { id: "balder", name: "Top Balder" },
  { id: "sele", name: "Top Sele" },
  { id: "bcu", name: "Base Cretaceous" },
  { id: "brent", name: "Top Brent" },
]

export default function ChipDemo() {
  const [horizons, setHorizons] = React.useState(initial)

  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup
        aria-label="Horizons"
        onRemove={(keys) =>
          setHorizons((prev) => prev.filter((horizon) => !keys.has(horizon.id)))
        }
      >
        <ChipList
          items={horizons}
          renderEmptyState={() => (
            <span className="text-xs text-muted-foreground">No horizons.</span>
          )}
        >
          {(horizon) => (
            <Chip id={horizon.id} textValue={horizon.name} variant="info">
              {horizon.name}
            </Chip>
          )}
        </ChipList>
      </ChipGroup>
      {horizons.length < initial.length && (
        <Button variant="ghost" size="xs" onPress={() => setHorizons(initial)}>
          Reset
        </Button>
      )}
    </div>
  )
}
```

## Usage

```tsx
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"
```

```tsx
<ChipGroup aria-label="Horizons" selectionMode="multiple" onRemove={(keys) => remove(keys)}>
  <ChipList>
    <Chip id="balder" variant="info">Top Balder</Chip>
    <Chip id="sele" variant="info">Top Sele</Chip>
  </ChipList>
</ChipGroup>
```

> **Chip or Badge?**
>
> A static label is the shadcn [Badge](/docs/components/badge.md), which carries the Tecton status colours, the outline appearance and the size scale. `Chip` is the *interactive* label: a React Aria `Tag` inside a `ChipGroup` that can be selected and removed with the keyboard. It is styled with the same `badgeVariants`, so a chip and a badge with the same props look identical. What Tecton calls a *Badge* (a count anchored to an icon) is the [CountBadge](/docs/tecton/count-badge.md) component.

## Removable

When the group has an `onRemove` handler (as in the demo above) every chip renders a `ChipRemove` button and supports the Backspace and Delete keys.

## Selectable

Set `selectionMode="single"` or `"multiple"` on the `ChipGroup` and control it with `selectedKeys` and `onSelectionChange`. `isDisabled` disables a single chip.

**Example — `chip-selectable`**

```tsx
"use client"

import * as React from "react"
import type { Key } from "react-aria-components"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const facies = ["Sandstone", "Shale", "Limestone", "Coal"]

export default function ChipSelectable() {
  const [selected, setSelected] = React.useState<Set<Key>>(
    new Set(["Sandstone"])
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup
        aria-label="Facies"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === "all" ? new Set(facies) : new Set(keys))
        }
      >
        <ChipList>
          {facies.map((name) => (
            <Chip key={name} id={name} variant="default" appearance="outline">
              {name}
            </Chip>
          ))}
          <Chip id="disabled" isDisabled>
            Disabled
          </Chip>
        </ChipList>
      </ChipGroup>
      <p className="text-xs text-muted-foreground">
        Selected: {[...selected].join(", ") || "none"}
      </p>
    </div>
  )
}
```

## Variants and appearance

`variant` and `appearance` are the Badge props: the semantic colours as solid surfaces or as outlines. The default is `variant="secondary"`.

**Example — `chip-variants`**

```tsx
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const variants = [
  "secondary",
  "default",
  "info",
  "success",
  "warning",
  "destructive",
] as const

export default function ChipVariants() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup aria-label="Solid chips" selectionMode="multiple">
        <ChipList>
          {variants.map((variant) => (
            <Chip key={variant} id={variant} variant={variant}>
              {variant}
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
      <ChipGroup aria-label="Outline chips" selectionMode="multiple">
        <ChipList>
          {variants.map((variant) => (
            <Chip
              key={variant}
              id={variant}
              variant={variant}
              appearance="outline"
            >
              {variant}
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
    </div>
  )
}
```

## Sizes

Use `size="default" | "md" | "lg"` (20 / 24 / 28 px). Icons inside the chip scale with the size.

**Example — `chip-sizes`**

```tsx
import { MapPinIcon } from "lucide-react"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

export default function ChipSizes() {
  return (
    <ChipGroup aria-label="Locations" selectionMode="single">
      <ChipList className="items-center">
        <Chip id="lg" size="lg" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Large
        </Chip>
        <Chip id="md" size="md" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Medium
        </Chip>
        <Chip id="default" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Default
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}
```

## API Reference

### ChipGroup

React Aria [`TagGroup`](https://react-aria.adobe.com/TagGroup) with Tecton spacing. Accepts all `TagGroup` props.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `selectionMode` | `"none" \| "single" \| "multiple"` | "none" | Enables selection of chips. |
| `selectedKeys` | `Iterable<Key> \| "all"` | - | Controlled selection (`defaultSelectedKeys` for uncontrolled). |
| `onSelectionChange` | `(keys: Selection) => void` | - | Selection change handler. |
| `onRemove` | `(keys: Set<Key>) => void` | - | When set, chips render a remove button. |
| `disabledKeys` | `Iterable<Key>` | - | Chips that cannot be selected or removed. |
| `aria-label` | `string` | - | Accessible name of the group. |

### ChipList

React Aria `TagList`; pass `items` and a render function, or static `Chip` children.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `Iterable<T>` | - | Dynamic collection items. |
| `renderEmptyState` | `() => ReactNode` | - | Content when the list is empty. |

### Chip

React Aria `Tag` styled with the Badge variants. Accepts all `Tag` props.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `Key` | - | Unique key (required for selection and removal). |
| `textValue` | `string` | - | Plain-text label for typeahead and screen readers. |
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline" \| "ghost" \| "link" \| "success" \| "warning" \| "info"` | "secondary" | Badge colour. |
| `appearance` | `"solid" \| "outline"` | "solid" | Filled surface or coloured border. |
| `size` | `"default" \| "md" \| "lg"` | "default" | Height 20 / 24 / 28 px. |
| `isDisabled` | `boolean` | false | Disables the chip. |

### ChipRemove

A small React Aria `Button` with an `X` icon. It is rendered automatically inside a `Chip` when the group has `onRemove`; pass `children` to replace the icon.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `<XIcon />` | Custom icon. |
