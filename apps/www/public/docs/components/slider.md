# Slider

An input where the user selects a value from within a given range.

Source: /docs/components/slider.md  
React Aria docs: https://react-aria.adobe.com/Slider  
React Aria API: https://react-aria.adobe.com/Slider#api

**Example — `slider-demo`**

```tsx
import { Slider } from "@tecton/react/components/slider"

export function SliderDemo() {
  return (
    <Slider
      aria-label="Slider"
      defaultValue={[75]}
      maxValue={100}
      step={1}
      className="mx-auto w-full max-w-xs"
    />
  )
}
```

## Usage

```tsx
import { Slider } from "@tecton/react/components/slider"
```

```tsx
<Slider defaultValue={[33]} max={100} step={1} />
```

## Range

Use an array with two values for a range slider.

**Example — `slider-range`**

```tsx
import { Slider } from "@tecton/react/components/slider"

export function SliderRange() {
  return (
    <Slider
      aria-label="Range"
      defaultValue={[25, 50]}
      maxValue={100}
      step={5}
      className="mx-auto w-full max-w-xs"
    />
  )
}
```

## Multiple Thumbs

Use an array with multiple values for multiple thumbs.

**Example — `slider-multiple`**

```tsx
import { Slider } from "@tecton/react/components/slider"

export function SliderMultiple() {
  return (
    <Slider
      aria-label="Multiple slider"
      defaultValue={[10, 20, 70]}
      maxValue={100}
      step={10}
      className="mx-auto w-full max-w-xs"
    />
  )
}
```

## Vertical

Use `orientation="vertical"` for a vertical slider.

**Example — `slider-vertical`**

```tsx
import { Slider } from "@tecton/react/components/slider"

export function SliderVertical() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-6">
      <Slider
        aria-label="Vertical slider"
        defaultValue={[50]}
        maxValue={100}
        step={1}
        orientation="vertical"
        className="h-40"
      />
      <Slider
        aria-label="Vertical slider"
        defaultValue={[25]}
        maxValue={100}
        step={1}
        orientation="vertical"
        className="h-40"
      />
    </div>
  )
}
```

## Controlled

**Example — `slider-controlled`**

```tsx
"use client"

import * as React from "react"

import { Label } from "@tecton/react/components/label"
import { Slider } from "@tecton/react/components/slider"

export function SliderControlled() {
  const [value, setValue] = React.useState([0.3, 0.7])

  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slider-demo-temperature">Temperature</Label>
        <span className="text-sm text-muted-foreground">
          {value.join(", ")}
        </span>
      </div>
      <Slider
        aria-label="Temperature"
        id="slider-demo-temperature"
        value={value}
        onChange={(value) => setValue(value as number[])}
        minValue={0}
        maxValue={1}
        step={0.1}
      />
    </div>
  )
}
```

## Disabled

Use the `disabled` prop to disable the slider.

**Example — `slider-disabled`**

```tsx
import { Slider } from "@tecton/react/components/slider"

export function SliderDisabled() {
  return (
    <Slider
      aria-label="Disabled slider"
      defaultValue={[50]}
      maxValue={100}
      step={1}
      isDisabled
      className="mx-auto w-full max-w-xs"
    />
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `slider-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Slider } from "@tecton/react/components/slider"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {},
  },
  ar: {
    dir: "rtl",
    values: {},
  },
  he: {
    dir: "rtl",
    values: {},
  },
}

export function SliderRtl() {
  const { dir } = useTranslation(translations, "ar")

  return (
    <Slider
      aria-label="RTL slider"
      defaultValue={[75]}
      maxValue={100}
      step={1}
      className="mx-auto w-full max-w-xs"
      dir={dir}
    />
  )
}
```

## API Reference

See the [React Aria Slider](https://react-aria.adobe.com/Slider#api) documentation.
