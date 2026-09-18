# Color Swatch

A colour preview chip with optional label and value, for colour tags, legends and theme documentation.

Source: /docs/tecton/color-swatch.md  
React Aria docs: https://react-aria.adobe.com/ColorSwatch

**Example — `color-swatch-demo`**

```tsx
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchDemo() {
  return (
    <div className="flex items-center gap-4">
      <ColorSwatch color="#f59e0b" aria-label="Sandstone" />
      <ColorSwatch color="#64748b" aria-label="Shale" />
      <ColorSwatch color="#38bdf8" aria-label="Limestone" />
      <ColorSwatch color="#1e293b" aria-label="Coal" />
    </div>
  )
}
```

## Usage

```tsx
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
```

```tsx
<ColorSwatch color="#f59e0b" label="Sandstone" value="#f59e0b" />
```

## Sizes

Use the `size` prop, from 12 px (`xs`) to 48 px (`xl`).

**Example — `color-swatch-sizes`**

```tsx
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

const sizes = ["xs", "sm", "md", "lg", "xl"] as const

export default function ColorSwatchSizes() {
  return (
    <div className="flex items-end gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <ColorSwatch size={size} color="#38bdf8" aria-label={`Size ${size}`} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  )
}
```

## Shapes

Use the `shape` prop for square, rounded or circular swatches.

**Example — `color-swatch-shapes`**

```tsx
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchShapes() {
  return (
    <div className="flex items-center gap-6">
      <ColorSwatch shape="square" size="lg" color="#f59e0b" label="Square" />
      <ColorSwatch shape="rounded" size="lg" color="#f59e0b" label="Rounded" />
      <ColorSwatch shape="circle" size="lg" color="#f59e0b" label="Circle" />
    </div>
  )
}
```

## Labels

Pass `label` and/or `value` to render text next to the swatch; the value is set in the mono font.

**Example — `color-swatch-labels`**

```tsx
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

const facies = [
  { name: "Sandstone", color: "#f59e0b" },
  { name: "Shale", color: "#64748b" },
  { name: "Limestone", color: "#38bdf8" },
  { name: "Coal", color: "#1e293b" },
]

export default function ColorSwatchLabels() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {facies.map((item) => (
        <ColorSwatch
          key={item.name}
          color={item.color}
          label={item.name}
          value={item.color}
        />
      ))}
    </div>
  )
}
```

## Editable

Pass `onChange` to make the swatch a button that opens a picker: a row of preset colours (the Tecton accent fills by default; override with `presets`) and a hex field for a custom colour. `onChange` receives the new colour as a hex string.

**Example — `color-swatch-editable`**

```tsx
import * as React from "react"

import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchEditable() {
  const [color, setColor] = React.useState("#cb8553")
  return (
    <ColorSwatch
      color={color}
      onChange={setColor}
      label="Series colour"
      value={color}
      aria-label="Edit series colour"
    />
  )
}
```

## API Reference

### ColorSwatch

React Aria [`ColorSwatch`](https://react-aria.adobe.com/ColorSwatch); accepts all its props.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string \| Color` | - | Any CSS colour string or React Aria `Color`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | "md" | Swatch size. |
| `shape` | `"square" \| "rounded" \| "circle"` | "rounded" | Corner radius. |
| `label` | `ReactNode` | - | Text next to the swatch. |
| `value` | `ReactNode` | - | Secondary mono text (e.g. the hex value). |
| `onChange` | `(color: string) => void` | - | Makes the swatch editable; called with the picked colour as hex. |
| `presets` | `string[]` | Tecton accents | Preset colours shown by the editable picker. |
| `aria-label` | `string` | - | Accessible name when no label is rendered. |
