# Switch

A control that allows the user to toggle between checked and not checked.

Source: /docs/components/switch.md  
React Aria docs: https://react-aria.adobe.com/Switch  
React Aria API: https://react-aria.adobe.com/Switch#api

**Example — `switch-demo`**

```tsx
import { Label } from "@tecton/react/components/label"
import { Switch } from "@tecton/react/components/switch"

export function SwitchDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  )
}
```

## Usage

```tsx
import { Switch } from "@tecton/react/components/switch"
```

```tsx
<Switch />
```

## Description

**Example — `switch-description`**

```tsx
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchDescription() {
  return (
    <Field orientation="horizontal" className="max-w-sm">
      <FieldContent>
        <FieldLabel htmlFor="switch-focus-mode">
          Share across devices
        </FieldLabel>
        <FieldDescription>
          Focus is shared across devices, and turns off when you leave the app.
        </FieldDescription>
      </FieldContent>
      <Switch id="switch-focus-mode" />
    </Field>
  )
}
```

## Choice Card

Card-style selection where `FieldLabel` wraps the entire `Field` for a clickable card pattern.

**Example — `switch-choice-card`**

```tsx
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchChoiceCard() {
  return (
    <FieldGroup className="w-full max-w-sm">
      <FieldLabel htmlFor="switch-share">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Share across devices</FieldTitle>
            <FieldDescription>
              Focus is shared across devices, and turns off when you leave the
              app.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-share" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="switch-notifications">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Enable notifications</FieldTitle>
            <FieldDescription>
              Receive notifications when focus mode is enabled or disabled.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-notifications" defaultSelected />
        </Field>
      </FieldLabel>
    </FieldGroup>
  )
}
```

## Disabled

Add the `isDisabled` prop to the `Switch` component to disable the switch. Add the `data-disabled` prop to the `Field` component for styling.

**Example — `switch-disabled`**

```tsx
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchDisabled() {
  return (
    <Field orientation="horizontal" data-disabled className="w-fit">
      <Switch id="switch-disabled-unchecked" isDisabled />
      <FieldLabel htmlFor="switch-disabled-unchecked">Disabled</FieldLabel>
    </Field>
  )
}
```

## Invalid

Add the `data-invalid` prop to the `Switch` component to indicate an invalid state. Add the `data-invalid` prop to the `Field` component for styling.

**Example — `switch-invalid`**

```tsx
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchInvalid() {
  return (
    <Field orientation="horizontal" className="max-w-sm" data-invalid>
      <FieldContent>
        <FieldLabel htmlFor="switch-terms">
          Accept terms and conditions
        </FieldLabel>
        <FieldDescription>
          You must accept the terms and conditions to continue.
        </FieldDescription>
      </FieldContent>
      <Switch id="switch-terms" data-invalid />
    </Field>
  )
}
```

## Size

Use the `size` prop to change the size of the switch.

**Example — `switch-sizes`**

```tsx
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchSizes() {
  return (
    <FieldGroup className="w-full max-w-[10rem]">
      <Field orientation="horizontal">
        <Switch id="switch-size-sm" size="sm" />
        <FieldLabel htmlFor="switch-size-sm">Small</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="switch-size-default" size="default" />
        <FieldLabel htmlFor="switch-size-default">Default</FieldLabel>
      </Field>
    </FieldGroup>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `switch-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Share across devices",
      description:
        "Focus is shared across devices, and turns off when you leave the app.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "المشاركة عبر الأجهزة",
      description:
        "يتم مشاركة التركيز عبر الأجهزة، ويتم إيقاف تشغيله عند مغادرة التطبيق.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "שיתוף בין מכשירים",
      description: "המיקוד משותף בין מכשירים, וכבה כשאתה עוזב את האפליקציה.",
    },
  },
}

export function SwitchRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Field orientation="horizontal" className="max-w-sm" dir={dir}>
      <FieldContent>
        <FieldLabel htmlFor="switch-focus-mode-rtl" dir={dir}>
          {t.label}
        </FieldLabel>
        <FieldDescription dir={dir}>{t.description}</FieldDescription>
      </FieldContent>
      <Switch id="switch-focus-mode-rtl" dir={dir} />
    </Field>
  )
}
```

## API Reference

See the [React Aria Switch](https://react-aria.adobe.com/Switch#api) documentation.
