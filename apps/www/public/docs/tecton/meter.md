# Meter

Segmented gauge for risk, complexity and confidence readouts, with automatic colour by value.

Source: /docs/tecton/meter.md  
React Aria docs: https://react-aria.adobe.com/Meter

**Example — `meter-demo`**

```tsx
import { Meter } from "@tecton/react/tecton/meter"

export default function MeterDemo() {
  return <Meter className="max-w-xs" label="Drilling complexity" value={60} valueLabel="Medium" />
}
```

## Usage

```tsx
import { Meter } from "@tecton/react/tecton/meter"
```

```tsx
<Meter label="Drilling complexity" value={60} valueLabel="Medium" color="auto" />
```

> The segmented gauge from the FDA and Well Design cards has no shadcn equivalent; [Progress](/docs/components/progress.md) is kept for task progress.

## Segments

Use `segments` to control the number of blocks; `segments={1}` renders a continuous bar. Partially filled segments show the exact value.

**Example — `meter-segments`**

```tsx
import { Meter } from "@tecton/react/tecton/meter"

export default function MeterSegments() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Meter label="Continuous" segments={1} value={45} showValue />
      <Meter label="3 segments" segments={3} value={45} showValue />
      <Meter label="5 segments (default)" value={45} showValue />
      <Meter label="10 segments" segments={10} value={45} showValue />
    </div>
  )
}
```

## Auto color

Use `color="auto"` to pick `success`, `warning` or `error` from the value (below 34 %, below 67 %, otherwise).

**Example — `meter-auto-color`**

```tsx
import * as React from "react"

import { Meter } from "@tecton/react/tecton/meter"
import { Slider } from "@tecton/react/components/slider"

export default function MeterAutoColor() {
  const [risk, setRisk] = React.useState(25)

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Meter
        label="Geological risk"
        color="auto"
        value={risk}
        valueLabel={risk >= 67 ? "High" : risk >= 34 ? "Medium" : "Low"}
      />
      <Slider aria-label="Risk" value={risk} onChange={(v) => setRisk(Array.isArray(v) ? v[0] : v)} />
    </div>
  )
}
```

## Colors

Or use a fixed `color`.

**Example — `meter-colors`**

```tsx
import { Meter } from "@tecton/react/tecton/meter"

const colors = ["primary", "info", "success", "warning", "error"] as const

export default function MeterColors() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      {colors.map((color) => (
        <Meter key={color} label={color} color={color} value={60} />
      ))}
    </div>
  )
}
```

## Sizes

Use the `size` prop for the track height.

**Example — `meter-sizes`**

```tsx
import { Meter } from "@tecton/react/tecton/meter"

export default function MeterSizes() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Meter size="sm" label="Small" value={80} showValue />
      <Meter size="md" label="Medium" value={80} showValue />
      <Meter size="lg" label="Large" value={80} showValue />
    </div>
  )
}
```

## API Reference

### Meter

React Aria [`Meter`](https://react-aria.adobe.com/Meter); accepts all its props (`value`, `minValue`, `maxValue`, `formatOptions`…).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `ReactNode` | - | Visible label; use `aria-label` otherwise. |
| `segments` | `number` | 5 | Number of blocks; `1` for a continuous bar. |
| `color` | `"primary" \| "success" \| "warning" \| "error" \| "info" \| "auto"` | "primary" | Fill colour. |
| `size` | `"sm" \| "md" \| "lg"` | "md" | Track height 4 / 6 / 10 px. |
| `showValue` | `boolean` | false | Show the formatted value at the end of the label row. |
| `valueLabel` | `ReactNode` | - | Custom value text (e.g. "High"). |
