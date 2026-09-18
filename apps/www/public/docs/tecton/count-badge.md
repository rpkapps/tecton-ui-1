# Count Badge

A count or status dot anchored to the corner of an avatar, icon button or tab.

Source: /docs/tecton/count-badge.md

**Example — `count-badge-demo`**

```tsx
import { BellIcon, MailIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { CountBadge } from "@tecton/react/tecton/count-badge"

export default function CountBadgeDemo() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge count={4}>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <BellIcon />
        </Button>
      </CountBadge>
      <CountBadge count={128} color="error">
        <Button variant="outline" size="icon" aria-label="Messages">
          <MailIcon />
        </Button>
      </CountBadge>
    </div>
  )
}
```

## Usage

```tsx
import { CountBadge } from "@tecton/react/tecton/count-badge"
```

```tsx
<CountBadge count={4} color="error">
  <Button variant="outline" size="icon" aria-label="Notifications">
    <BellIcon />
  </Button>
</CountBadge>
```

> **Naming**
>
> This is the Tecton *Badge* from the design system. It is named `CountBadge` in the library so it does not collide with the shadcn `Badge`, which Tecton uses for chip-like labels (the interactive [Chip](/docs/tecton/chip.md) shares its variants).

## Colors

Use the `color` prop. `neutral` uses the Tecton neutral surface, the others map to the shadcn semantic variables.

**Example — `count-badge-colors`**

```tsx
import { CountBadge } from "@tecton/react/tecton/count-badge"

const colors = [
  "default",
  "primary",
  "info",
  "success",
  "warning",
  "error",
  "neutral",
] as const

export default function CountBadgeColors() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {colors.map((color, index) => (
        <CountBadge key={color} color={color} count={index + 1}>
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            {color.slice(0, 3)}
          </span>
        </CountBadge>
      ))}
    </div>
  )
}
```

## Dot

Use `variant="dot"` for a presence or status indicator without a number.

**Example — `count-badge-dot`**

```tsx
import { Avatar, AvatarFallback } from "@tecton/react/components/avatar"
import { CountBadge } from "@tecton/react/tecton/count-badge"

export default function CountBadgeDot() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge variant="dot" color="success" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </CountBadge>
      <CountBadge variant="dot" color="warning" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </CountBadge>
      <CountBadge variant="dot" color="neutral" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
      </CountBadge>
    </div>
  )
}
```

## Anchor

Use the `anchor` prop to place the badge on any corner of its child.

**Example — `count-badge-anchor`**

```tsx
import { CountBadge } from "@tecton/react/tecton/count-badge"

const anchors = ["top-left", "top-right", "bottom-left", "bottom-right"] as const

export default function CountBadgeAnchor() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      {anchors.map((anchor) => (
        <CountBadge key={anchor} anchor={anchor} count={3}>
          <span className="flex size-10 items-center justify-center rounded-md border bg-card text-[0.625rem] text-muted-foreground">
            {anchor.replace("-", " ")}
          </span>
        </CountBadge>
      ))}
    </div>
  )
}
```

## Max, zero and custom content

Counts above `max` render as `max+`. A count of `0` hides the badge unless `showZero` is set; `content` replaces the number with arbitrary content.

**Example — `count-badge-max`**

```tsx
import { InboxIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { CountBadge } from "@tecton/react/tecton/count-badge"

function Inbox() {
  return (
    <Button variant="outline" size="icon" aria-label="Inbox">
      <InboxIcon />
    </Button>
  )
}

export default function CountBadgeMax() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge count={0}>
        <Inbox />
      </CountBadge>
      <CountBadge count={0} showZero color="neutral">
        <Inbox />
      </CountBadge>
      <CountBadge count={1250} max={999} color="error">
        <Inbox />
      </CountBadge>
      <CountBadge content="New" color="success">
        <Inbox />
      </CountBadge>
    </div>
  )
}
```

## API Reference

### CountBadge

Wraps its child in a relatively positioned `span` and renders the badge absolutely.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | - | Number to display. |
| `max` | `number` | 99 | Counts above this render as `max+`. |
| `showZero` | `boolean` | false | Render the badge when `count` is 0. |
| `content` | `ReactNode` | - | Custom content instead of the count. |
| `invisible` | `boolean` | false | Hide the badge but keep the anchor. |
| `color` | `"default" \| "primary" \| "error" \| "warning" \| "info" \| "success" \| "neutral"` | "primary" | Badge colour. |
| `variant` | `"standard" \| "dot"` | "standard" | Number pill or 8 px dot. |
| `anchor` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left"` | "top-right" | Corner of the child. |
