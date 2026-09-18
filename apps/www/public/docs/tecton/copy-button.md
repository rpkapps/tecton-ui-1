# Copy Button

Copies a value to the clipboard and shows a check mark for a moment.

Source: /docs/tecton/copy-button.md

**Example — `copy-button-demo`**

```tsx
import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonDemo() {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-card py-1 pr-1 pl-3 font-mono text-sm">
      <span>34/10-A-12</span>
      <CopyButton value="34/10-A-12" />
    </div>
  )
}
```

## Usage

```tsx
import { CopyButton } from "@tecton/react/tecton/copy-button"
```

```tsx
<CopyButton value="34/10-A-12" />
```

## Labelled

Pass children for a labelled button; the size then defaults to `sm` instead of `icon-sm`. All `Button` variants are available.

**Example — `copy-button-labelled`**

```tsx
import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonLabelled() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton value="wellbore://34/10-A-12" variant="outline">
        Copy link
      </CopyButton>
      <CopyButton
        value='{"well":"34/10-A-12","td":3250}'
        variant="secondary"
        timeout={4000}
      >
        Copy JSON
      </CopyButton>
    </div>
  )
}
```

## Feedback

Use `onCopied` to react to a successful copy and `timeout` to control how long the check is shown.

**Example — `copy-button-feedback`**

```tsx
import * as React from "react"

import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonFeedback() {
  const [last, setLast] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <CopyButton value="Top Balder" variant="ghost" onCopied={setLast} />
        <CopyButton value="Top Sele" variant="ghost" onCopied={setLast} />
        <CopyButton value="Base Cretaceous" variant="ghost" onCopied={setLast} />
      </div>
      <p className="text-xs text-muted-foreground">
        {last ? `Copied "${last}"` : "Nothing copied yet"}
      </p>
    </div>
  )
}
```

## API Reference

### CopyButton

The shadcn `Button` with clipboard behaviour; accepts all `Button` props except `onPress`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | - | Text written to the clipboard. |
| `timeout` | `number` | 2000 | Milliseconds the check is shown. |
| `onCopied` | `(value: string) => void` | - | Called after a successful copy. |
| `variant` | `ButtonProps["variant"]` | "ghost" | Button variant. |
| `size` | `ButtonProps["size"]` | "icon-sm" \| "sm" | Defaults by presence of children. |
| `children` | `ReactNode` | - | Label. |
