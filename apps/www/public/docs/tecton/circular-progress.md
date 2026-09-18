# Circular Progress

Determinate progress ring with an optional centred value, or an indeterminate spinner.

Source: /docs/tecton/circular-progress.md  
React Aria docs: https://react-aria.adobe.com/ProgressBar

**Example — `circular-progress-demo`**

```tsx
import { CircularProgress } from "@tecton/react/tecton/circular-progress"

export default function CircularProgressDemo() {
  return <CircularProgress aria-label="Resampling" value={64} showValue />
}
```

## Usage

```tsx
import { CircularProgress } from "@tecton/react/tecton/circular-progress"
```

```tsx
<CircularProgress aria-label="Resampling" value={64} showValue />
```

> The shadcn [Progress](/docs/components/progress.md) is a linear bar and [Spinner](/docs/components/spinner.md) is an icon. Tecton's circular progress with a value label is a separate component.

## Sizes

Use the `size` prop from 16 px (`xs`) to 96 px (`xl`). Stroke width and label size scale with it.

**Example — `circular-progress-sizes`**

```tsx
import { CircularProgress } from "@tecton/react/tecton/circular-progress"

const sizes = ["xs", "sm", "md", "lg", "xl"] as const

export default function CircularProgressSizes() {
  return (
    <div className="flex items-end gap-6">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <CircularProgress size={size} value={64} aria-label={`Size ${size}`} showValue={size !== "xs"} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  )
}
```

## Colors

Use the `color` prop for the ring colour.

**Example — `circular-progress-colors`**

```tsx
import { CircularProgress } from "@tecton/react/tecton/circular-progress"

const colors = ["primary", "foreground", "info", "success", "warning", "error"] as const

export default function CircularProgressColors() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {colors.map((color) => (
        <div key={color} className="flex flex-col items-center gap-2">
          <CircularProgress color={color} value={72} aria-label={color} />
          <span className="text-xs text-muted-foreground">{color}</span>
        </div>
      ))}
    </div>
  )
}
```

## Value label

Set `showValue` to render the formatted value in the centre, or pass children for custom content. `minValue`, `maxValue` and `formatOptions` come from React Aria.

**Example — `circular-progress-value`**

```tsx
import { CheckIcon } from "lucide-react"

import { CircularProgress } from "@tecton/react/tecton/circular-progress"

export default function CircularProgressValue() {
  return (
    <div className="flex items-center gap-8">
      <CircularProgress size="lg" value={38} aria-label="Wells drilled" showValue />
      <CircularProgress size="lg" value={7} minValue={0} maxValue={12} aria-label="Templates" formatOptions={{ style: "decimal" }}>
        7/12
      </CircularProgress>
      <CircularProgress size="lg" value={100} color="success" aria-label="Export">
        <CheckIcon className="size-5 text-success" />
      </CircularProgress>
    </div>
  )
}
```

## Indeterminate

Set `isIndeterminate` for a spinning ring while the amount of work is unknown.

**Example — `circular-progress-indeterminate`**

```tsx
import { CircularProgress } from "@tecton/react/tecton/circular-progress"

export default function CircularProgressIndeterminate() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <CircularProgress size="sm" isIndeterminate aria-label="Loading well logs" />
      Loading well logs…
    </div>
  )
}
```

## API Reference

### CircularProgress

React Aria [`ProgressBar`](https://react-aria.adobe.com/ProgressBar); accepts all its props (`value`, `minValue`, `maxValue`, `isIndeterminate`, `formatOptions`, `valueLabel`…).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | "md" | Diameter 16 / 24 / 40 / 64 / 96 px. |
| `color` | `"primary" \| "foreground" \| "success" \| "warning" \| "error" \| "info"` | "primary" | Ring colour. |
| `showValue` | `boolean` | false | Show the formatted value in the centre. |
| `children` | `ReactNode` | - | Custom centre content (overrides `showValue`). |
| `aria-label` | `string` | - | Accessible name (required without a visible label). |
