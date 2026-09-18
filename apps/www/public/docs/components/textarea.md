# Textarea

Displays a form textarea or a component that looks like a textarea.

Source: /docs/components/textarea.md  
React Aria docs: https://react-aria.adobe.com/TextField  
React Aria API: https://react-aria.adobe.com/TextField#api

**Example — `textarea-demo`**

```tsx
import { Textarea } from "@tecton/react/components/textarea"

export default function TextareaDemo() {
  return <Textarea placeholder="Type your message here." />
}
```

## Usage

```tsx
import { Textarea } from "@tecton/react/components/textarea"
```

```tsx
<Textarea />
```

## Field

Use `Field`, `FieldLabel`, and `FieldDescription` to create a textarea with a label and description.

**Example — `textarea-field`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

export function TextareaField() {
  return (
    <Field>
      <FieldLabel htmlFor="textarea-message">Message</FieldLabel>
      <FieldDescription>Enter your message below.</FieldDescription>
      <Textarea id="textarea-message" placeholder="Type your message here." />
    </Field>
  )
}
```

## Disabled

Use the `disabled` prop to disable the textarea. To style the disabled state, add the `data-disabled` attribute to the `Field` component.

**Example — `textarea-disabled`**

```tsx
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

export function TextareaDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
      <Textarea
        id="textarea-disabled"
        placeholder="Type your message here."
        disabled
      />
    </Field>
  )
}
```

## Invalid

Use the `aria-invalid` prop to mark the textarea as invalid. To style the invalid state, add the `data-invalid` attribute to the `Field` component.

**Example — `textarea-invalid`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

export function TextareaInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="textarea-invalid">Message</FieldLabel>
      <Textarea
        id="textarea-invalid"
        placeholder="Type your message here."
        aria-invalid
      />
      <FieldDescription>Please enter a valid message.</FieldDescription>
    </Field>
  )
}
```

## Button

Pair with `Button` to create a textarea with a submit button.

**Example — `textarea-button`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Textarea } from "@tecton/react/components/textarea"

export function TextareaButton() {
  return (
    <div className="grid w-full gap-2">
      <Textarea placeholder="Type your message here." />
      <Button>Send message</Button>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `textarea-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Feedback",
      placeholder: "Your feedback helps us improve...",
      description: "Share your thoughts about our service.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "التعليقات",
      placeholder: "تعليقاتك تساعدنا على التحسين...",
      description: "شاركنا أفكارك حول خدمتنا.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "משוב",
      placeholder: "המשוב שלך עוזר לנו להשתפר...",
      description: "שתף את מחשבותיך על השירות שלנו.",
    },
  },
}

export default function TextareaRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Field className="w-full max-w-xs" dir={dir}>
      <FieldLabel htmlFor="feedback" dir={dir}>
        {t.label}
      </FieldLabel>
      <Textarea id="feedback" placeholder={t.placeholder} dir={dir} rows={4} />
      <FieldDescription dir={dir}>{t.description}</FieldDescription>
    </Field>
  )
}
```

## Variants

Use `variant="outline" | "filled" | "text"` for the three Tecton surface styles, the same as on [Input](/docs/components/input.md). Label, description and error message come from `Field` (see [Forms](/docs/forms.md)).

**Example — `textarea-variants`**

```tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function TextareaVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`textarea-variants-${variant}`}>
            {label}
          </FieldLabel>
          <Textarea
            id={`textarea-variants-${variant}`}
            variant={variant}
            placeholder="Notes on the interpretation"
            rows={3}
          />
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
```
