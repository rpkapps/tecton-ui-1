# Sheet

Extends the Dialog component to display content that complements the main content of the screen.

Source: /docs/components/sheet.md  
React Aria docs: https://react-aria.adobe.com/Modal  
React Aria API: https://react-aria.adobe.com/Modal#api

**Example — `sheet-demo`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

export default function SheetDemo() {
  return (
    <SheetTrigger>
      <Button variant="outline">Open</Button>
      <Sheet>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose variant="outline">Close</SheetClose>
        </SheetFooter>
      </Sheet>
    </SheetTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"
```

```tsx showLineNumbers
<SheetTrigger>
  <Button>Open</Button>
  <Sheet>
    <SheetHeader>
      <SheetTitle>Are you absolutely sure?</SheetTitle>
      <SheetDescription>This action cannot be undone.</SheetDescription>
    </SheetHeader>
  </Sheet>
</SheetTrigger>
```

## Composition

Use the following composition to build a `Sheet`:

```text
SheetTrigger
├── Button
└── Sheet
    ├── SheetHeader
    │   ├── SheetTitle
    │   └── SheetDescription
    └── SheetFooter
```

## Side

Use the `side` prop on `SheetContent` to set the edge of the screen where the sheet appears. Values are `top`, `right`, `bottom`, or `left`.

**Example — `sheet-side`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

const SHEET_SIDES = ["top", "right", "bottom", "left"] as const

export default function SheetSide() {
  return (
    <div className="flex flex-wrap gap-2">
      {SHEET_SIDES.map((side) => (
        <SheetTrigger key={side}>
          <Button variant="outline" className="capitalize">
            {side}
          </Button>
          <Sheet
            side={side}
            className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
          >
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </SheetDescription>
            </SheetHeader>
            <div className="no-scrollbar overflow-y-auto px-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <p key={index} className="mb-2 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              ))}
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose variant="outline">Cancel</SheetClose>
            </SheetFooter>
          </Sheet>
        </SheetTrigger>
      ))}
    </div>
  )
}
```

## No Close Button

Use `showCloseButton={false}` on `SheetContent` to hide the close button.

**Example — `sheet-no-close-button`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

export default function SheetNoCloseButton() {
  return (
    <SheetTrigger>
      <Button variant="outline">Open Sheet</Button>
      <Sheet showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>No Close Button</SheetTitle>
          <SheetDescription>
            This sheet doesn&apos;t have a close button in the top-right corner.
            Click outside to close.
          </SheetDescription>
        </SheetHeader>
      </Sheet>
    </SheetTrigger>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `sheet-rtl`**

```tsx
"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      open: "Open",
      editProfile: "Edit profile",
      description:
        "Make changes to your profile here. Click save when you're done.",
      name: "Name",
      username: "Username",
      save: "Save changes",
      close: "Close",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      open: "فتح",
      editProfile: "تعديل الملف الشخصي",
      description:
        "قم بإجراء تغييرات على ملفك الشخصي هنا. انقر حفظ عند الانتهاء.",
      name: "الاسم",
      username: "اسم المستخدم",
      save: "حفظ التغييرات",
      close: "إغلاق",
    },
  },
  he: {
    dir: "rtl",
    values: {
      open: "פתח",
      editProfile: "עריכת פרופיל",
      description: "בצע שינויים בפרופיל שלך כאן. לחץ שמור כשתסיים.",
      name: "שם",
      username: "שם משתמש",
      save: "שמור שינויים",
      close: "סגור",
    },
  },
}

export function SheetRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")

  return (
    <SheetTrigger>
      <Button variant="outline">{t.open}</Button>
      <Sheet
        dir={dir}
        side={dir === "rtl" ? "left" : "right"}
        data-lang={dir === "rtl" ? language : undefined}
      >
        <SheetHeader>
          <SheetTitle>{t.editProfile}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <FieldGroup className="px-4">
          <Field>
            <FieldLabel htmlFor="sheet-rtl-name">{t.name}</FieldLabel>
            <Input id="sheet-rtl-name" defaultValue="Pedro Duarte" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-rtl-username">{t.username}</FieldLabel>
            <Input id="sheet-rtl-username" defaultValue="peduarte" />
          </Field>
        </FieldGroup>
        <SheetFooter>
          <Button type="submit">{t.save}</Button>
          <SheetClose variant="outline">{t.close}</SheetClose>
        </SheetFooter>
      </Sheet>
    </SheetTrigger>
  )
}
```

## API Reference

See the [React Aria Modal](https://react-aria.adobe.com/Modal#api) documentation.
