# Spinner

An indicator that can be used to show a loading state.

Source: /docs/components/spinner.md

**Example — `spinner-demo`**

```tsx
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item variant="muted">
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">Processing payment...</ItemTitle>
        </ItemContent>
        <ItemContent className="flex-none justify-end">
          <span className="text-sm tabular-nums">$100.00</span>
        </ItemContent>
      </Item>
    </div>
  )
}
```

## Usage

```tsx
import { Spinner } from "@tecton/react/components/spinner"
```

```tsx
<Spinner />
```

## Customization

You can replace the default spinner icon with any other icon by editing the `Spinner` component.

**Example — `spinner-custom`**

```tsx
import { cn } from "cn"
import { LoaderIcon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export function SpinnerCustom() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  )
}
```

```tsx showLineNumbers title="@tecton/react/components/spinner.tsx"
import { cn } from "cn"
import { LoaderIcon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
```

## Size

Use the `size-*` utility class to change the size of the spinner.

**Example — `spinner-size`**

```tsx
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerSize() {
  return (
    <div className="flex items-center gap-6">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  )
}
```

## Button

Add a spinner to a button to indicate a loading state. Place the `<Spinner />` before the label with `data-icon="inline-start"` for a start position, or after the label with `data-icon="inline-end"` for an end position.

**Example — `spinner-button`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerButton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button isDisabled size="sm">
        <Spinner data-icon="inline-start" />
        Loading...
      </Button>
      <Button variant="outline" isDisabled size="sm">
        <Spinner data-icon="inline-start" />
        Please wait
      </Button>
      <Button variant="secondary" isDisabled size="sm">
        <Spinner data-icon="inline-start" />
        Processing
      </Button>
    </div>
  )
}
```

## Badge

Add a spinner to a badge to indicate a loading state. Place the `<Spinner />` before the label with `data-icon="inline-start"` for a start position, or after the label with `data-icon="inline-end"` for an end position.

**Example — `spinner-badge`**

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerBadge() {
  return (
    <div className="flex items-center gap-4 [--radius:1.2rem]">
      <Badge>
        <Spinner data-icon="inline-start" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner data-icon="inline-start" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner data-icon="inline-start" />
        Processing
      </Badge>
    </div>
  )
}
```

## Input Group

**Example — `spinner-input-group`**

```tsx
import { ArrowUpIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@tecton/react/components/input-group"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerInputGroup() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <InputGroup>
        <InputGroupInput placeholder="Send a message..." disabled />
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Send a message..." disabled />
        <InputGroupAddon align="block-end">
          <Spinner /> Validating...
          <InputGroupButton className="ml-auto" variant="default">
            <ArrowUpIcon />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

## Empty

**Example — `spinner-empty`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerEmpty() {
  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Processing your request</EmptyTitle>
        <EmptyDescription>
          Please wait while we process your request. Do not refresh the page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </EmptyContent>
    </Empty>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `spinner-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import { Spinner } from "@tecton/react/components/spinner"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      title: "Processing payment...",
      amount: "$100.00",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      title: "جاري معالجة الدفع...",
      amount: "١٠٠.٠٠ دولار",
    },
  },
  he: {
    dir: "rtl",
    values: {
      title: "מעבד תשלום...",
      amount: "$100.00",
    },
  },
}

export function SpinnerRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div
      className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]"
      dir={dir}
    >
      <Item variant="muted" dir={dir}>
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">{t.title}</ItemTitle>
        </ItemContent>
        <ItemContent className="flex-none justify-end">
          <span className="text-sm tabular-nums">{t.amount}</span>
        </ItemContent>
      </Item>
    </div>
  )
}
```
