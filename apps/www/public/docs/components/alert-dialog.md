# Alert Dialog

A modal dialog that interrupts the user with important content and expects a response.

Source: /docs/components/alert-dialog.md  
React Aria docs: https://react-aria.adobe.com/Modal  
React Aria API: https://react-aria.adobe.com/Modal#api

**Example — `alert-dialog-demo`**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export default function AlertDialogDemo() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Show Dialog</Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
```

```tsx showLineNumbers
<AlertDialogTrigger>
  <Button variant="outline">Show Dialog</Button>
  <AlertDialog>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account
        from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialog>
</AlertDialogTrigger>
```

## Composition

Use the following composition to build an `AlertDialog`:

```text
AlertDialogTrigger
├── Button
└── AlertDialog
    ├── AlertDialogHeader
    │   ├── AlertDialogMedia
    │   ├── AlertDialogTitle
    │   └── AlertDialogDescription
    └── AlertDialogFooter
        ├── AlertDialogCancel
        └── AlertDialogAction
```

## Basic

A basic alert dialog with a title, description, and cancel and continue buttons.

**Example — `alert-dialog-basic`**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogBasic() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Show Dialog</Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## Small

Use the `size="sm"` prop to make the alert dialog smaller.

**Example — `alert-dialog-small`**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogSmall() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Show Dialog</Button>
      <AlertDialog size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to allow the USB accessory to connect to this device?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
          <AlertDialogAction>Allow</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## Media

Use the `AlertDialogMedia` component to add a media element such as an icon or image to the alert dialog.

**Example — `alert-dialog-media`**

```tsx
import { CircleFadingPlusIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogWithMedia() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Share Project</Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CircleFadingPlusIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Share this project?</AlertDialogTitle>
          <AlertDialogDescription>
            Anyone with the link will be able to view and edit this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Share</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## Small with Media

Use the `size="sm"` prop to make the alert dialog smaller and the `AlertDialogMedia` component to add a media element such as an icon or image to the alert dialog.

**Example — `alert-dialog-small-media`**

```tsx
import { BluetoothIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogSmallWithMedia() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Show Dialog</Button>
      <AlertDialog size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <BluetoothIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to allow the USB accessory to connect to this device?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
          <AlertDialogAction>Allow</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## Destructive

Use the `AlertDialogAction` component to add a destructive action button to the alert dialog.

**Example — `alert-dialog-destructive`**

```tsx
import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogDestructive() {
  return (
    <AlertDialogTrigger>
      <Button variant="destructive">Delete Chat</Button>
      <AlertDialog size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this chat conversation. View{" "}
            <a href="#">Settings</a> delete any memories saved during this chat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `alert-dialog-rtl`**

```tsx
"use client"

import { BluetoothIcon } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      showDialog: "Show Dialog",
      showDialogSm: "Show Dialog (sm)",
      title: "Are you absolutely sure?",
      description:
        "This action cannot be undone. This will permanently delete your account from our servers.",
      cancel: "Cancel",
      continue: "Continue",
      smallTitle: "Allow accessory to connect?",
      smallDescription:
        "Do you want to allow the USB accessory to connect to this device?",
      dontAllow: "Don't allow",
      allow: "Allow",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      showDialog: "إظهار الحوار",
      showDialogSm: "إظهار الحوار (صغير)",
      title: "هل أنت متأكد تمامًا؟",
      description:
        "لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف حسابك نهائيًا من خوادمنا.",
      cancel: "إلغاء",
      continue: "متابعة",
      smallTitle: "السماح للملحق بالاتصال؟",
      smallDescription: "هل تريد السماح لملحق USB بالاتصال بهذا الجهاز؟",
      dontAllow: "عدم السماح",
      allow: "السماح",
    },
  },
  he: {
    dir: "rtl",
    values: {
      showDialog: "הצג דיאלוג",
      showDialogSm: "הצג דיאלוג (קטן)",
      title: "האם אתה בטוח לחלוטין?",
      description:
        "פעולה זו לא ניתנת לביטול. זה ימחק לצמיתות את החשבון שלך מהשרתים שלנו.",
      cancel: "ביטול",
      continue: "המשך",
      smallTitle: "לאפשר להתקן להתחבר?",
      smallDescription: "האם אתה רוצה לאפשר להתקן USB להתחבר למכשיר זה?",
      dontAllow: "אל תאפשר",
      allow: "אפשר",
    },
  },
}

export function AlertDialogRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")

  return (
    <div className="flex gap-4" dir={dir}>
      <AlertDialogTrigger>
        <Button variant="outline">{t.showDialog}</Button>
        <AlertDialog dir={dir} data-lang={dir === "rtl" ? language : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.title}</AlertDialogTitle>
            <AlertDialogDescription>{t.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction>{t.continue}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      </AlertDialogTrigger>
      <AlertDialogTrigger>
        <Button variant="outline">{t.showDialogSm}</Button>
        <AlertDialog
          size="sm"
          dir={dir}
          data-lang={dir === "rtl" ? language : undefined}
        >
          <AlertDialogHeader>
            <AlertDialogMedia>
              <BluetoothIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.smallTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.smallDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dontAllow}</AlertDialogCancel>
            <AlertDialogAction>{t.allow}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      </AlertDialogTrigger>
    </div>
  )
}
```

## API Reference

### size

Use the `size` props on the `AlertDialogContent` component to control the size of the alert dialog. It accepts the following values:

| Prop   | Type                | Default     |
| ------ | ------------------- | ----------- |
| `size` | `"default" \| "sm"` | `"default"` |

For more information about the other components and their props, see the [React Aria documentation](https://react-aria.adobe.com/Modal#api).
