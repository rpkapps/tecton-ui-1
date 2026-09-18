# Dialog

A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.

Source: /docs/components/dialog.md  
React Aria docs: https://react-aria.adobe.com/Modal  
React Aria API: https://react-aria.adobe.com/Modal#api

**Example — `dialog-demo`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import { Field, FieldGroup } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"

export function DialogDemo() {
  return (
    <DialogTrigger>
      <form>
        <Button variant="outline">Open Dialog</Button>
        <Dialog className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </Field>
            <Field>
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose variant="outline">Cancel</DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </Dialog>
      </form>
    </DialogTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
```

```tsx showLineNumbers
<DialogTrigger>
  <Button>Open</Button>
  <Dialog>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
  </Dialog>
</DialogTrigger>
```

## Composition

Use the following composition to build a `Dialog`:

```text
DialogTrigger
├── Button
└── Dialog
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    └── DialogFooter
```

## Custom Close Button

Replace the default close control with your own button.

**Example — `dialog-close-button`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"

export function DialogCloseButton() {
  return (
    <DialogTrigger>
      <Button variant="outline">Share</Button>
      <Dialog className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone who has this link will be able to view this.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue="https://ui.shadcn.com/docs/installation"
              readOnly
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose type="button">Close</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  )
}
```

## No Close Button

Use `showCloseButton={false}` to hide the close button.

**Example — `dialog-no-close-button`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"

export function DialogNoCloseButton() {
  return (
    <DialogTrigger>
      <Button variant="outline">No Close Button</Button>
      <Dialog showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
          <DialogDescription>
            This dialog doesn&apos;t have a close button in the top-right
            corner.
          </DialogDescription>
        </DialogHeader>
      </Dialog>
    </DialogTrigger>
  )
}
```

## Sticky Footer

Keep actions visible while the content scrolls.

**Example — `dialog-sticky-footer`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"

export function DialogStickyFooter() {
  return (
    <DialogTrigger>
      <Button variant="outline">Sticky Footer</Button>
      <Dialog>
        <DialogHeader>
          <DialogTitle>Sticky Footer</DialogTitle>
          <DialogDescription>
            This dialog has a sticky footer that stays visible while the content
            scrolls.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="mb-4 leading-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          ))}
        </div>
        <DialogFooter>
          <DialogClose variant="outline">Close</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  )
}
```

## Scrollable Content

Long content can scroll while the header stays in view.

**Example — `dialog-scrollable-content`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"

export function DialogScrollableContent() {
  return (
    <DialogTrigger>
      <Button variant="outline">Scrollable Content</Button>
      <Dialog>
        <DialogHeader>
          <DialogTitle>Scrollable Content</DialogTitle>
          <DialogDescription>
            This is a dialog with scrollable content.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="mb-4 leading-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          ))}
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `dialog-rtl`**

```tsx
"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import { Field, FieldGroup } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      openDialog: "Open Dialog",
      editProfile: "Edit profile",
      description:
        "Make changes to your profile here. Click save when you're done.",
      name: "Name",
      username: "Username",
      cancel: "Cancel",
      saveChanges: "Save changes",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      openDialog: "فتح الحوار",
      editProfile: "تعديل الملف الشخصي",
      description:
        "قم بإجراء تغييرات على ملفك الشخصي هنا. انقر فوق حفظ عند الانتهاء.",
      name: "الاسم",
      username: "اسم المستخدم",
      cancel: "إلغاء",
      saveChanges: "حفظ التغييرات",
    },
  },
  he: {
    dir: "rtl",
    values: {
      openDialog: "פתח דיאלוג",
      editProfile: "ערוך פרופיל",
      description: "בצע שינויים בפרופיל שלך כאן. לחץ על שמור כשתסיים.",
      name: "שם",
      username: "שם משתמש",
      cancel: "בטל",
      saveChanges: "שמור שינויים",
    },
  },
}

export function DialogRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")

  return (
    <DialogTrigger>
      <form>
        <Button variant="outline">{t.openDialog}</Button>
        <Dialog
          className="sm:max-w-sm"
          dir={dir}
          data-lang={dir === "rtl" ? language : undefined}
        >
          <DialogHeader>
            <DialogTitle>{t.editProfile}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">{t.name}</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </Field>
            <Field>
              <Label htmlFor="username-1">{t.username}</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose variant="outline">{t.cancel}</DialogClose>
            <Button type="submit">{t.saveChanges}</Button>
          </DialogFooter>
        </Dialog>
      </form>
    </DialogTrigger>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Modal#api) documentation for more information.
