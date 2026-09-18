# Button

Displays a button or a component that looks like a button.

Source: /docs/components/button.md  
React Aria docs: https://react-aria.adobe.com/Button  
React Aria API: https://react-aria.adobe.com/Button#api

**Example — `button-demo`**

```tsx
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
```

## Usage

```tsx
import { Button } from "@tecton/react/components/button"
```

```tsx
<Button variant="outline">Button</Button>
```

## Cursor

Tailwind v4 [switched](https://tailwindcss.com/docs/upgrade-guide#buttons-use-the-default-cursor) from `cursor: pointer` to `cursor: default` for the button component.

If you want to keep the `cursor: pointer` behavior, add the following code to your CSS file:

```css showLineNumbers title="globals.css"
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

## Size

Use the `size` prop to change the size of the button.

**Example — `button-size`**

```tsx
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonSize() {
  return (
    <div className="flex flex-col items-start gap-8 sm:flex-row">
      <div className="flex items-start gap-2">
        <Button size="xs" variant="outline">
          Extra Small
        </Button>
        <Button size="icon-xs" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button size="sm" variant="outline">
          Small
        </Button>
        <Button size="icon-sm" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline">Default</Button>
        <Button size="icon" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button size="icon-lg" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
    </div>
  )
}
```

## Default

**Example — `button-default`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonDefault() {
  return <Button>Button</Button>
}
```

## Outline

**Example — `button-outline`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonOutline() {
  return <Button variant="outline">Outline</Button>
}
```

## Secondary

**Example — `button-secondary`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonSecondary() {
  return <Button variant="secondary">Secondary</Button>
}
```

## Ghost

**Example — `button-ghost`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonGhost() {
  return <Button variant="ghost">Ghost</Button>
}
```

## Destructive

**Example — `button-destructive`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonDestructive() {
  return <Button variant="destructive">Destructive</Button>
}
```

## Link

**Example — `button-link`**

```tsx
import { Button } from "@tecton/react/components/button"

export default function ButtonLink() {
  return <Button variant="link">Link</Button>
}
```

## Icon

**Example — `button-icon`**

```tsx
import { CircleFadingArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonIcon() {
  return (
    <Button variant="outline" size="icon">
      <CircleFadingArrowUpIcon />
    </Button>
  )
}
```

## With Icon

Remember to add the `data-icon="inline-start"` or `data-icon="inline-end"` attribute to the icon for the correct spacing.

**Example — `button-with-icon`**

```tsx
import { GitBranchIcon, GitForkIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonWithIcon() {
  return (
    <div className="flex gap-2">
      <Button variant="outline">
        <GitBranchIcon data-icon="inline-start" /> New Branch
      </Button>
      <Button variant="outline">
        Fork
        <GitForkIcon data-icon="inline-end" />
      </Button>
    </div>
  )
}
```

## Rounded

Use the `rounded-full` class to make the button rounded.

**Example — `button-rounded`**

```tsx
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonRounded() {
  return (
    <div className="flex gap-2">
      <Button className="rounded-full">Get Started</Button>
      <Button variant="outline" size="icon" className="rounded-full">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
```

## Spinner

Render a `<Spinner />` component inside the button to show a loading state. Remember to add the `data-icon="inline-start"` or `data-icon="inline-end"` attribute to the spinner for the correct spacing.

**Example — `button-spinner`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"

export default function ButtonLoading() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" isDisabled>
        <Spinner data-icon="inline-start" />
        Generating
      </Button>
      <Button variant="secondary" isDisabled>
        Downloading
        <Spinner data-icon="inline-start" />
      </Button>
    </div>
  )
}
```

## Button Group

To create a button group, use the `ButtonGroup` component. See the [Button Group](/docs/components/button-group.md) documentation for more details.

**Example — `button-group-demo`**

```tsx
"use client"

import * as React from "react"
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  ListFilterIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export default function ButtonGroupDemo() {
  const [label, setLabel] = React.useState("personal")

  return (
    <ButtonGroup>
      <ButtonGroup className="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeftIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Snooze</Button>
        <DropdownMenuTrigger>
          <Button variant="outline" size="icon" aria-label="More Options">
            <MoreHorizontalIcon />
          </Button>
          <DropdownMenu placement="bottom end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MailCheckIcon />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArchiveIcon />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <ClockIcon />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarPlusIcon />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListFilterIcon />
                Add to List
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TagIcon />
                  Label As...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  selectionMode="single"
                  selectedKeys={[label]}
                  onSelectionChange={(keys) => setLabel([...keys][0] as string)}
                >
                  <DropdownMenuItem id="personal">Personal</DropdownMenuItem>
                  <DropdownMenuItem id="work">Work</DropdownMenuItem>
                  <DropdownMenuItem id="other">Other</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <Trash2Icon />
                Trash
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </ButtonGroup>
    </ButtonGroup>
  )
}
```

## As Link

You can use the `buttonVariants` helper to make a link look like a button.

**Do not use `<Button>` for links.** The React Aria `Button` component always applies `role="button"`, which overrides the semantic link role on `<a>` elements. Use `buttonVariants` with a plain `<a>` tag instead.

**Example — `button-render`**

```tsx
"use client"

import { buttonVariants } from "@tecton/react/components/button"

export default function ButtonRender() {
  return (
    <a
      href="#"
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      Login
    </a>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `button-rtl`**

```tsx
"use client"

import { ArrowRightIcon, PlusIcon } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      button: "Button",
      submit: "Submit",
      delete: "Delete",
      loading: "Loading",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      button: "زر",
      submit: "إرسال",
      delete: "حذف",
      loading: "جاري التحميل",
    },
  },
  he: {
    dir: "rtl",
    values: {
      button: "כפתור",
      submit: "שלח",
      delete: "מחק",
      loading: "טוען",
    },
  },
}

export function ButtonRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row" dir={dir}>
      <Button variant="outline">{t.button}</Button>
      <Button variant="destructive">{t.delete}</Button>
      <Button variant="outline">
        {t.submit}{" "}
        <ArrowRightIcon className="rtl:rotate-180" data-icon="inline-end" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button variant="secondary" isDisabled>
        <Spinner data-icon="inline-start" /> {t.loading}
      </Button>
    </div>
  )
}
```

## Floating action button

A Tecton FAB is a `Button` recipe: `className="h-10 rounded-full shadow-md"` for the extended form and `size="icon" className="rounded-full shadow-md"` (with an `aria-label`) for the round one. Any `variant` works; `default`, `secondary`, `ghost` and `outline` correspond to the design system's primary, secondary, tertiary and outlined FABs.

**Example — `button-fab`**

```tsx
import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

const variants = ["default", "secondary", "ghost", "outline"] as const

export default function ButtonFab() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {variants.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            className="h-10 rounded-full shadow-md"
          >
            <PlusIcon data-icon="inline-start" /> New well
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {variants.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            size="icon"
            className="rounded-full shadow-md"
            aria-label="New well"
          >
            <PlusIcon />
          </Button>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

### Button

The `Button` component is a wrapper around the `button` element that adds a variety of styles and functionality.

| Prop      | Type                                                                                 | Default     |
| --------- | ------------------------------------------------------------------------------------ | ----------- |
| `variant` | `"default" \| "outline" \| "ghost" \| "destructive" \| "secondary" \| "link"`        | `"default"` |
| `size`    | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` | `"default"` |

See the [React Aria](https://react-aria.adobe.com/Button#api) documentation for more information.
