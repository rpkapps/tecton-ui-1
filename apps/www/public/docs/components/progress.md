# Progress

Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.

Source: /docs/components/progress.md  
React Aria docs: https://react-aria.adobe.com/ProgressBar  
React Aria API: https://react-aria.adobe.com/ProgressBar#api

**Example — `progress-demo`**

```tsx
"use client"

import * as React from "react"

import { Progress } from "@tecton/react/components/progress"

export default function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress aria-label="Loading" value={progress} className="w-[60%]" />
}
```

## Usage

```tsx showLineNumbers
import { Progress } from "@tecton/react/components/progress"
```

```tsx showLineNumbers
<Progress aria-label="Loading" value={33} />
```

## Composition

### With label and value

Use `ProgressLabel` and `ProgressValue` to add a label and value display.

```tsx showLineNumbers
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@tecton/react/components/progress"

;<Progress value={56} className="w-full max-w-sm">
  <ProgressLabel>Upload progress</ProgressLabel>
  <ProgressValue />
</Progress>
```

```text
Progress
├── ProgressLabel
├── ProgressValue
└── ProgressTrack
    └── ProgressIndicator
```

## Label

Use `ProgressLabel` and `ProgressValue` to add a label and value display.

**Example — `progress-label`**

```tsx
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@tecton/react/components/progress"

export function ProgressWithLabel() {
  return (
    <Progress value={56} className="w-full max-w-sm">
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>
  )
}
```

## Controlled

A progress bar that can be controlled by a slider.

**Example — `progress-controlled`**

```tsx
"use client"

import * as React from "react"

import { Progress } from "@tecton/react/components/progress"
import { Slider } from "@tecton/react/components/slider"

export function ProgressControlled() {
  const [value, setValue] = React.useState(50)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Progress aria-label="Loading" value={value} className="w-full" />
      <Slider
        aria-label="Progress"
        value={value}
        onChange={(value) => setValue(value as number)}
        minValue={0}
        maxValue={100}
        step={1}
      />
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `progress-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@tecton/react/components/progress"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Upload progress",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "تقدم الرفع",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "התקדמות העלאה",
    },
  },
}

function toArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumerals[parseInt(digit, 10)])
    .join("")
}

export function ProgressRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")

  const formatNumber = (num: number): string => {
    if (language === "ar") {
      return toArabicNumerals(num)
    }
    return num.toString()
  }

  return (
    <Progress value={56} className="w-full max-w-sm" dir={dir}>
      <ProgressLabel>{t.label}</ProgressLabel>
      <ProgressValue>
        {(value) => (
          <span className="ms-auto">
            {formatNumber(parseFloat(value ?? "0"))}%
          </span>
        )}
      </ProgressValue>
    </Progress>
  )
}
```

## API Reference

See the [React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar#api) documentation.
