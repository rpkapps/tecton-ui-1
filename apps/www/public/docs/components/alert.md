# Alert

Displays a callout for user attention.

Source: /docs/components/alert.md

**Example — `alert-demo`**

```tsx
import { CheckCircle2Icon, InfoIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertDemo() {
  return (
    <div className="grid w-full max-w-md items-start gap-4">
      <Alert>
        <CheckCircle2Icon />
        <AlertTitle>Payment successful</AlertTitle>
        <AlertDescription>
          Your payment of $29.99 has been processed. A receipt has been sent to
          your email address.
        </AlertDescription>
      </Alert>
      <Alert>
        <InfoIcon />
        <AlertTitle>New feature available</AlertTitle>
        <AlertDescription>
          We&apos;ve added dark mode support. You can enable it in your account
          settings.
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
```

```tsx showLineNumbers
<Alert>
  <InfoIcon />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components and dependencies to your app using the cli.
  </AlertDescription>
  <AlertAction>
    <Button variant="outline">Enable</Button>
  </AlertAction>
</Alert>
```

## Composition

Use the following composition to build an `Alert`:

```text
Alert
├── Icon
├── AlertTitle
├── AlertDescription
└── AlertAction
```

## Basic

A basic alert with an icon, title and description.

**Example — `alert-basic`**

```tsx
import { CheckCircle2Icon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertBasic() {
  return (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved. Changes will be reflected
        immediately.
      </AlertDescription>
    </Alert>
  )
}
```

## Destructive

Use `variant="destructive"` to create a destructive alert.

**Example — `alert-destructive`**

```tsx
import { AlertCircleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertDestructive() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        Your payment could not be processed. Please check your payment method
        and try again.
      </AlertDescription>
    </Alert>
  )
}
```

## Action

Use `AlertAction` to add a button or other action element to the alert.

**Example — `alert-action`**

```tsx
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"

export default function AlertActionExample() {
  return (
    <Alert className="max-w-md">
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertDescription>
        Enable it under your profile settings to get started.
      </AlertDescription>
      <AlertAction>
        <Button size="xs" variant="default">
          Enable
        </Button>
      </AlertAction>
    </Alert>
  )
}
```

## Custom Colors

You can customize the alert colors by adding [palette](/docs/theming.md#palette) classes such as `bg-yellow-120 text-yellow-1000` to the `Alert` component (a step is a contrast level, so no `dark:` variant is needed).

**Example — `alert-colors`**

```tsx
import { AlertTriangleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertColors() {
  return (
    <Alert className="max-w-md border-yellow-160 bg-yellow-120 text-yellow-1000">
      <AlertTriangleIcon />
      <AlertTitle>Your subscription will expire in 3 days.</AlertTitle>
      <AlertDescription>
        Renew now to avoid service interruption or upgrade to a paid plan to
        continue using the service.
      </AlertDescription>
    </Alert>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `alert-rtl`**

```tsx
"use client"

import * as React from "react"
import { CheckCircle2Icon, InfoIcon } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      paymentTitle: "Payment successful",
      paymentDescription:
        "Your payment of $29.99 has been processed. A receipt has been sent to your email address.",
      featureTitle: "New feature available",
      featureDescription:
        "We've added dark mode support. You can enable it in your account settings.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      paymentTitle: "تم الدفع بنجاح",
      paymentDescription:
        "تمت معالجة دفعتك البالغة 29.99 دولارًا. تم إرسال إيصال إلى عنوان بريدك الإلكتروني.",
      featureTitle: "ميزة جديدة متاحة",
      featureDescription:
        "لقد أضفنا دعم الوضع الداكن. يمكنك تفعيله في إعدادات حسابك.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      paymentTitle: "התשלום בוצע בהצלחה",
      paymentDescription:
        "התשלום שלך בסך 29.99 דולר עובד. קבלה נשלחה לכתובת האימייל שלך.",
      featureTitle: "תכונה חדשה זמינה",
      featureDescription:
        "הוספנו תמיכה במצב כהה. אתה יכול להפעיל אותו בהגדרות החשבון שלך.",
    },
  },
}

const alerts = [
  {
    icon: CheckCircle2Icon,
    titleKey: "paymentTitle" as const,
    descriptionKey: "paymentDescription" as const,
  },
  {
    icon: InfoIcon,
    titleKey: "featureTitle" as const,
    descriptionKey: "featureDescription" as const,
  },
] as const

export function AlertRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="grid w-full max-w-md items-start gap-4" dir={dir}>
      {alerts.map((alert, index) => {
        const Icon = alert.icon
        return (
          <Alert key={index}>
            <Icon />
            <AlertTitle>{t[alert.titleKey]}</AlertTitle>
            <AlertDescription>{t[alert.descriptionKey]}</AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
```

## Tecton variants

The Tecton style overlay adds the status colours and surface styles of the design system's *StatusAlert* to the shadcn `Alert`. `variant` is the severity (the former `severity` prop) and `appearance` is the surface (the former `variant="filled" | "outlined"`); the icon, title, description and toolbar are composed as in the examples above.

### Severity

Use `variant="success" | "warning" | "info" | "destructive"` and pass a lucide icon as the first child.

**Example — `alert-severities`**

```tsx
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertSeverities() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Three FDA alternatives ranked</AlertTitle>
        <AlertDescription>
          Alternative B has the lowest cost per barrel.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Unsaved changes</AlertTitle>
        <AlertDescription>
          Three horizons have edits that are not yet committed.
        </AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>Model out of date</AlertTitle>
        <AlertDescription>
          Horizon K70 changed after the last run.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Simulation failed</AlertTitle>
        <AlertDescription>
          The grid has 12 cells with negative volume.
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

### Appearance

Use `appearance="outline"` for a transparent alert with a coloured border and text, or `appearance="filled"` for Tecton's filled status surface (`--success-surface`, `--warning-surface`, … with their `-foreground` text colours; note the pale yellow warning surface in light mode). The default appearance keeps the card background and colours the text with the status colour (`--success`, `--warning`, …), which is readable on the page and card surfaces in both modes.

**Example — `alert-appearance`**

```tsx
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

const severities = [
  { variant: "success", icon: CircleCheckIcon, title: "Model saved" },
  { variant: "warning", icon: TriangleAlertIcon, title: "Unsaved changes" },
  { variant: "info", icon: InfoIcon, title: "Model out of date" },
  { variant: "destructive", icon: CircleAlertIcon, title: "Simulation failed" },
] as const

const appearances = ["outline", "filled"] as const

export default function AlertAppearance() {
  return (
    <div className="grid w-full gap-3 md:grid-cols-2">
      {appearances.map((appearance) => (
        <div key={appearance} className="flex flex-col gap-3">
          {severities.map(({ variant, icon: Icon, title }) => (
            <Alert key={variant} variant={variant} appearance={appearance}>
              <Icon />
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>appearance="{appearance}"</AlertDescription>
            </Alert>
          ))}
        </div>
      ))}
    </div>
  )
}
```

### Dismissible

Place the action and the dismiss button in `AlertAction`; hide the alert from state.

**Example — `alert-dismissible`**

```tsx
"use client"

import * as React from "react"
import { CircleCheckIcon, XIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"

export default function AlertDismissible() {
  const [open, setOpen] = React.useState(true)

  if (!open) {
    return (
      <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
        Show alert
      </Button>
    )
  }

  return (
    <Alert variant="success" className="max-w-md">
      <CircleCheckIcon />
      <AlertTitle>Three FDA alternatives ranked</AlertTitle>
      <AlertDescription>
        Alternative B has the lowest cost per barrel.
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="xs">
          View
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onPress={() => setOpen(false)}
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  )
}
```

## API Reference

### Alert

The `Alert` component displays a callout for user attention.

| Prop      | Type                         | Default     |
| --------- | ---------------------------- | ----------- |
| `variant` | `"default" \| "destructive"` | `"default"` |

### AlertTitle

The `AlertTitle` component displays the title of the alert.

| Prop        | Type     | Default |
| ----------- | -------- | ------- |
| `className` | `string` | -       |

### AlertDescription

The `AlertDescription` component displays the description or content of the alert.

| Prop        | Type     | Default |
| ----------- | -------- | ------- |
| `className` | `string` | -       |

### AlertAction

The `AlertAction` component displays an action element (like a button) positioned absolutely in the top-right corner of the alert.

| Prop        | Type     | Default |
| ----------- | -------- | ------- |
| `className` | `string` | -       |
