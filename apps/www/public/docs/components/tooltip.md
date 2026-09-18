# Tooltip

A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.

Source: /docs/components/tooltip.md  
React Aria docs: https://react-aria.adobe.com/Tooltip  
React Aria API: https://react-aria.adobe.com/Tooltip#api

**Example — `tooltip-demo`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipDemo() {
  return (
    <TooltipTrigger>
      <Button variant="outline">Hover</Button>
      <Tooltip>
        <p>Add to library</p>
      </Tooltip>
    </TooltipTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
```

```tsx showLineNumbers
<TooltipTrigger>
  <Button>Hover</Button>
  <Tooltip>
    <p>Add to library</p>
  </Tooltip>
</TooltipTrigger>
```

## Composition

Use the following composition to build a `Tooltip`:

```text
TooltipTrigger
├── Button
└── Tooltip
```

## Placement

Use the `placement` prop to change the position of the tooltip.

**Example — `tooltip-sides`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipSides() {
  return (
    <div className="flex flex-wrap gap-2">
      {(["left", "top", "bottom", "right"] as const).map((side) => (
        <TooltipTrigger key={side}>
          <Button variant="outline" className="w-fit capitalize">
            {side}
          </Button>
          <Tooltip placement={side}>
            <p>Add to library</p>
          </Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  )
}
```

## With Keyboard Shortcut

**Example — `tooltip-keyboard`**

```tsx
import { SaveIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Kbd } from "@tecton/react/components/kbd"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipKeyboard() {
  return (
    <TooltipTrigger>
      <Button variant="outline" size="icon-sm">
        <SaveIcon />
      </Button>
      <Tooltip>
        Save Changes <Kbd>S</Kbd>
      </Tooltip>
    </TooltipTrigger>
  )
}
```

## Disabled Button

Show a tooltip on a disabled button by wrapping it with a span.

**Example — `tooltip-disabled`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipDisabled() {
  return (
    <>
      <TooltipTrigger>
        <span className="inline-block w-fit">
          <Button variant="outline" isDisabled>
            Disabled
          </Button>
        </span>
        <Tooltip>
          <p>This feature is currently unavailable</p>
        </Tooltip>
      </TooltipTrigger>
    </>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `tooltip-rtl`**

```tsx
"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      content: "Add to library",
      start: "Start",
      left: "Left",
      top: "Top",
      bottom: "Bottom",
      right: "Right",
      end: "End",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      content: "إضافة إلى المكتبة",
      start: "بداية السطر",
      left: "يسار",
      top: "أعلى",
      bottom: "أسفل",
      right: "يمين",
      end: "نهاية السطر",
    },
  },
  he: {
    dir: "rtl",
    values: {
      content: "הוסף לספרייה",
      start: "תחילת השורה",
      left: "שמאל",
      top: "למעלה",
      bottom: "למטה",
      right: "ימין",
      end: "סוף השורה",
    },
  },
}

const physicalSides = ["left", "top", "bottom", "right"] as const
const logicalPlacements = ["start", "end"] as const

export function TooltipRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {physicalSides.map((side) => (
          <TooltipTrigger key={side}>
            <Button variant="outline">{t[side]}</Button>
            <Tooltip placement={side} dir={dir}>
              {t.content}
            </Tooltip>
          </TooltipTrigger>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {logicalPlacements.map((placement) => (
          <TooltipTrigger key={placement}>
            <Button variant="outline">{t[placement]}</Button>
            <Tooltip placement={placement} dir={dir}>
              {t.content}
            </Tooltip>
          </TooltipTrigger>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

See the [React Aria Tooltip](https://react-aria.adobe.com/Tooltip#api) documentation.
