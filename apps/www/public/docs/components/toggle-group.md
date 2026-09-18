# Toggle Group

A set of two-state buttons that can be toggled on or off.

Source: /docs/components/toggle-group.md  
React Aria docs: https://react-aria.adobe.com/ToggleButtonGroup  
React Aria API: https://react-aria.adobe.com/ToggleButtonGroup#api

**Example — `toggle-group-demo`**

```tsx
import { Bold, Italic, Underline } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupDemo() {
  return (
    <ToggleGroup variant="outline" selectionMode="multiple">
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem id="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Usage

```tsx
import { ToggleGroup, ToggleGroupItem } from "@tecton/react/components/toggle-group"
```

```tsx
<ToggleGroup selectionMode="single">
  <ToggleGroupItem value="a">A</ToggleGroupItem>
  <ToggleGroupItem value="b">B</ToggleGroupItem>
  <ToggleGroupItem value="c">C</ToggleGroupItem>
</ToggleGroup>
```

## Composition

Use the following composition to build a `ToggleGroup`:

```text
ToggleGroup
├── ToggleGroupItem
└── ToggleGroupItem
```

## Outline

Use `variant="outline"` for an outline style.

**Example — `toggle-group-outline`**

```tsx
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupOutline() {
  return (
    <ToggleGroup variant="outline" defaultSelectedKeys={["all"]}>
      <ToggleGroupItem id="all" aria-label="Toggle all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem id="missed" aria-label="Toggle missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Size

Use the `size` prop to change the size of the toggle group.

**Example — `toggle-group-sizes`**

```tsx
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupSizes() {
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup size="sm" defaultSelectedKeys={["top"]} variant="outline">
        <ToggleGroupItem id="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem id="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem id="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem id="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup defaultSelectedKeys={["top"]} variant="outline">
        <ToggleGroupItem id="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem id="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem id="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem id="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

## Spacing

Use `spacing` to add spacing between toggle group items.

**Example — `toggle-group-spacing`**

```tsx
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupSpacing() {
  return (
    <ToggleGroup
      size="sm"
      defaultSelectedKeys={["top"]}
      variant="outline"
      spacing={2}
    >
      <ToggleGroupItem id="top" aria-label="Toggle top">
        Top
      </ToggleGroupItem>
      <ToggleGroupItem id="bottom" aria-label="Toggle bottom">
        Bottom
      </ToggleGroupItem>
      <ToggleGroupItem id="left" aria-label="Toggle left">
        Left
      </ToggleGroupItem>
      <ToggleGroupItem id="right" aria-label="Toggle right">
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Vertical

Use `orientation="vertical"` for vertical toggle groups.

**Example — `toggle-group-vertical`**

```tsx
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupVertical() {
  return (
    <ToggleGroup
      selectionMode="multiple"
      orientation="vertical"
      spacing={1}
      defaultSelectedKeys={["bold", "italic"]}
    >
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Disabled

**Example — `toggle-group-disabled`**

```tsx
import { Bold, Italic, Underline } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupDisabled() {
  return (
    <ToggleGroup isDisabled>
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem id="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Custom

A custom toggle group example.

**Example — `toggle-group-font-weight-selector`**

```tsx
"use client"

import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupFontWeightSelector() {
  const [fontWeight, setFontWeight] = React.useState("normal")
  return (
    <Field>
      <FieldLabel>Font Weight</FieldLabel>
      <ToggleGroup
        selectedKeys={[fontWeight]}
        onSelectionChange={(value) => setFontWeight([...value][0] as string)}
        variant="outline"
        spacing={2}
        size="lg"
      >
        <ToggleGroupItem
          id="light"
          aria-label="Light"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-light">Aa</span>
          <span className="text-xs text-muted-foreground">Light</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          id="normal"
          aria-label="Normal"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-normal">Aa</span>
          <span className="text-xs text-muted-foreground">Normal</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          id="medium"
          aria-label="Medium"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-medium">Aa</span>
          <span className="text-xs text-muted-foreground">Medium</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          id="bold"
          aria-label="Bold"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-bold">Aa</span>
          <span className="text-xs text-muted-foreground">Bold</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <FieldDescription>
        Use{" "}
        <code className="rounded-md bg-muted px-1 py-0.5 font-mono">
          font-{fontWeight}
        </code>{" "}
        to set the font weight.
      </FieldDescription>
    </Field>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `toggle-group-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      list: "List",
      grid: "Grid",
      cards: "Cards",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      list: "قائمة",
      grid: "شبكة",
      cards: "بطاقات",
    },
  },
  he: {
    dir: "rtl",
    values: {
      list: "רשימה",
      grid: "רשת",
      cards: "כרטיסים",
    },
  },
}

export function ToggleGroupRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <ToggleGroup variant="outline" defaultSelectedKeys={["list"]} dir={dir}>
      <ToggleGroupItem id="list" aria-label={t.list}>
        {t.list}
      </ToggleGroupItem>
      <ToggleGroupItem id="grid" aria-label={t.grid}>
        {t.grid}
      </ToggleGroupItem>
      <ToggleGroupItem id="cards" aria-label={t.cards}>
        {t.cards}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## API Reference

See the [React Aria ToggleButtonGroup](https://react-aria.adobe.com/ToggleButtonGroup#api) documentation.
