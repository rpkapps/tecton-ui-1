# Panel

Titled application surface for side panels, tool panels and dashboard sections, with a scrolling body and a pinned footer.

Source: /docs/tecton/panel.md

**Example — `panel-demo`**

```tsx
import { SettingsIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Panel, PanelActions, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

export default function PanelDemo() {
  return (
    <Panel className="w-full max-w-sm">
      <PanelHeader>
        <PanelTitle>Well properties</PanelTitle>
        <PanelActions>
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <SettingsIcon />
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="text-sm text-muted-foreground">
        34/10-A-12 · Gullfaks · TD 3 250 m
      </PanelContent>
    </Panel>
  )
}
```

## Usage

```tsx
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelActions,
  PanelContent,
  PanelFooter,
} from "@tecton/react/tecton/panel"
```

```tsx
<Panel>
  <PanelHeader>
    <PanelTitle>Well properties</PanelTitle>
    <PanelActions>…</PanelActions>
  </PanelHeader>
  <PanelContent>…</PanelContent>
  <PanelFooter>…</PanelFooter>
</Panel>
```

> [Card](/docs/components/card.md) is for content; `Panel` is the application chrome around a tool: it fills its container, scrolls its body and pins its footer.

## Composition

Use the following composition:

```text
Panel
├── PanelHeader
│   ├── PanelTitle
│   ├── PanelDescription
│   └── PanelActions
├── PanelContent
└── PanelFooter
```

## Variants

Use the `variant` prop: bordered `default`, `elevated` with a shadow, `flat` without border and `outline` on a transparent background.

**Example — `panel-variants`**

```tsx
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

const variants = ["default", "elevated", "flat", "outline"] as const

export default function PanelVariants() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      {variants.map((variant) => (
        <Panel key={variant} variant={variant}>
          <PanelHeader>
            <PanelTitle className="capitalize">{variant}</PanelTitle>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">
            variant="{variant}"
          </PanelContent>
        </Panel>
      ))}
    </div>
  )
}
```

## Sizes

Use the `size` prop to scale the padding of header, content and footer.

**Example — `panel-sizes`**

```tsx
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

export default function PanelSizes() {
  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Panel key={size} size={size}>
          <PanelHeader>
            <PanelTitle>Size {size}</PanelTitle>
            <PanelDescription>Padding scales with size.</PanelDescription>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">Content</PanelContent>
        </Panel>
      ))}
    </div>
  )
}
```

## Footer

Give the panel a height: `PanelContent` scrolls and `PanelFooter` stays pinned to the bottom.

**Example — `panel-footer`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Meter } from "@tecton/react/tecton/meter"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

export default function PanelFooterExample() {
  return (
    <Panel className="h-72 w-full max-w-sm" variant="elevated">
      <PanelHeader>
        <PanelTitle>Alternative B</PanelTitle>
        <PanelDescription>4 wells, 1 template — base case</PanelDescription>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        <Meter label="Geological risk" value={30} color="auto" valueLabel="Low" />
        <Meter label="Drilling complexity" value={70} color="auto" valueLabel="High" />
        <Meter label="Confidence" value={85} color="info" showValue />
      </PanelContent>
      <PanelFooter className="justify-end">
        <Button variant="ghost" size="sm">
          Compare
        </Button>
        <Button size="sm">Open</Button>
      </PanelFooter>
    </Panel>
  )
}
```

## Many actions

`PanelActions` is a plain slot: one to three icon buttons beside a title that truncates. When a panel carries more, put an [Overflow](/docs/tecton/overflow.md) `Toolbar` inside the slot. The title then keeps its natural width up to 60% of the header, the slot takes the rest, and the actions move into a More menu lowest priority first. Panels that do not opt in pay nothing.

**Example — `panel-actions`**

```tsx
"use client"

import {
  DownloadIcon,
  EllipsisIcon,
  MaximizeIcon,
  PinIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShareIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  OverflowItem,
  OverflowMenu,
  Toolbar,
} from "@tecton/react/tecton/overflow"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

const actions = [
  { id: "refresh", label: "Refresh", icon: RefreshCwIcon, priority: 2 },
  { id: "pin", label: "Pin", icon: PinIcon, priority: 1 },
  { id: "share", label: "Share", icon: ShareIcon },
  { id: "export", label: "Export", icon: DownloadIcon },
  { id: "maximize", label: "Maximize", icon: MaximizeIcon },
]

export default function PanelActionsExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {/* Drag the corner: the icons move into the More menu, lowest priority first. */}
      <div className="min-w-48 resize-x overflow-hidden">
        <Panel>
          <PanelHeader>
            <PanelTitle>Production forecast</PanelTitle>
            <PanelActions>
              {/* Icon-only actions: labels="never" gives every button its tooltip.
                  A custom More trigger keeps the panel's small button size. */}
              <Toolbar
                aria-label="Panel actions"
                labels="never"
                menu={false}
                className="gap-1"
              >
                {actions.map(({ id, label, icon: Icon, priority }) => (
                  <OverflowItem
                    key={id}
                    id={id}
                    label={label}
                    icon={<Icon />}
                    priority={priority}
                  >
                    <Button variant="ghost" size="icon-sm" aria-label={label}>
                      <Icon />
                    </Button>
                  </OverflowItem>
                ))}
                {/* Unwrapped: settings never leaves the header. */}
                <Button variant="ghost" size="icon-sm" aria-label="Settings">
                  <SettingsIcon />
                </Button>
                <OverflowMenu
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More actions"
                    >
                      <EllipsisIcon />
                    </Button>
                  }
                />
              </Toolbar>
            </PanelActions>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">
            34/10-A-12 · 1 240 bbl/d · updated 5 min ago
          </PanelContent>
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
```

## API Reference

### Panel

A `section` element.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "elevated" \| "flat" \| "outline"` | "default" | Surface style. |
| `size` | `"sm" \| "md" \| "lg"` | "md" | Padding scale. |

### PanelHeader, PanelTitle, PanelDescription, PanelActions, PanelContent, PanelFooter

Structural parts; `PanelActions` sits at the end of the header, `PanelContent` scrolls.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - |  |
