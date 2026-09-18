# Popover

Displays rich content in a portal, triggered by a button.

Source: /docs/components/popover.md  
React Aria docs: https://react-aria.adobe.com/Popover  
React Aria API: https://react-aria.adobe.com/Popover#api

**Example — `popover-demo`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export default function PopoverDemo() {
  return (
    <PopoverTrigger>
      <Button variant="outline">Open popover</Button>
      <Popover className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"
```

```tsx showLineNumbers
<PopoverTrigger>
  <Button variant="outline">Open Popover</Button>
  <Popover>
    <PopoverHeader>
      <PopoverTitle>Title</PopoverTitle>
      <PopoverDescription>Description text here.</PopoverDescription>
    </PopoverHeader>
  </Popover>
</PopoverTrigger>
```

## Composition

Use the following composition to build a `Popover`:

```text
PopoverTrigger
├── Button
└── Popover
```

## Basic

A simple popover with a header, title, and description.

**Example — `popover-basic`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

export function PopoverBasic() {
  return (
    <PopoverTrigger>
      <Button variant="outline">Open Popover</Button>
      <Popover placement="bottom start">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer.
          </PopoverDescription>
        </PopoverHeader>
      </Popover>
    </PopoverTrigger>
  )
}
```

## Align

Use the `placement` prop on `Popover` to control the horizontal alignment.

**Example — `popover-alignments`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function PopoverAlignments() {
  return (
    <>
      <div className="flex gap-6">
        <PopoverTrigger>
          <Button variant="outline" size="sm">
            Start
          </Button>
          <Popover placement="bottom start" className="w-40">
            Aligned to start
          </Popover>
        </PopoverTrigger>
        <PopoverTrigger>
          <Button variant="outline" size="sm">
            Center
          </Button>
          <Popover placement="bottom" className="w-40">
            Aligned to center
          </Popover>
        </PopoverTrigger>
        <PopoverTrigger>
          <Button variant="outline" size="sm">
            End
          </Button>
          <Popover placement="bottom end" className="w-40">
            Aligned to end
          </Popover>
        </PopoverTrigger>
      </div>
    </>
  )
}
```

## With Form

A popover with form fields inside.

**Example — `popover-form`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

export function PopoverForm() {
  return (
    <>
      <PopoverTrigger>
        <Button variant="outline">Open Popover</Button>
        <Popover className="w-64" placement="bottom start">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <FieldGroup className="gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="width" className="w-1/2">
                Width
              </FieldLabel>
              <Input id="width" defaultValue="100%" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="height" className="w-1/2">
                Height
              </FieldLabel>
              <Input id="height" defaultValue="25px" />
            </Field>
          </FieldGroup>
        </Popover>
      </PopoverTrigger>
    </>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `popover-rtl`**

```tsx
"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      title: "Dimensions",
      description: "Set the dimensions for the layer.",
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
      title: "الأبعاد",
      description: "تعيين الأبعاد للطبقة.",
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
      title: "מימדים",
      description: "הגדר את המימדים לשכבה.",
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

export function PopoverRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {physicalSides.map((side) => (
          <PopoverTrigger key={side}>
            <Button variant="outline">{t[side]}</Button>
            <Popover placement={side} dir={dir}>
              <PopoverHeader>
                <PopoverTitle>{t.title}</PopoverTitle>
                <PopoverDescription>{t.description}</PopoverDescription>
              </PopoverHeader>
            </Popover>
          </PopoverTrigger>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {logicalPlacements.map((placement) => (
          <PopoverTrigger key={placement}>
            <Button variant="outline">{t[placement]}</Button>
            <Popover placement={placement} dir={dir}>
              <PopoverHeader>
                <PopoverTitle>{t.title}</PopoverTitle>
                <PopoverDescription>{t.description}</PopoverDescription>
              </PopoverHeader>
            </Popover>
          </PopoverTrigger>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

See the [React Aria Popover](https://react-aria.adobe.com/Popover#api) documentation.
