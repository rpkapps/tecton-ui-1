# Input

A text input component for forms and user data entry with built-in styling and accessibility features.

Source: /docs/components/input.md  
React Aria docs: https://react-aria.adobe.com/TextField  
React Aria API: https://react-aria.adobe.com/TextField#api

**Example — `input-demo`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputDemo() {
  return (
    <Field>
      <FieldLabel htmlFor="input-demo-api-key">API Key</FieldLabel>
      <Input id="input-demo-api-key" type="password" placeholder="sk-..." />
      <FieldDescription>
        Your API key is encrypted and stored securely.
      </FieldDescription>
    </Field>
  )
}
```

## Usage

```tsx
import { Input } from "@tecton/react/components/input"
```

```tsx
<Input />
```

## Basic

**Example — `input-basic`**

```tsx
import { Input } from "@tecton/react/components/input"

export function InputBasic() {
  return <Input placeholder="Enter text" />
}
```

## Field

Use `Field`, `FieldLabel`, and `FieldDescription` to create an input with a
label and description.

**Example — `input-field`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputField() {
  return (
    <Field>
      <FieldLabel htmlFor="input-field-username">Username</FieldLabel>
      <Input
        id="input-field-username"
        type="text"
        placeholder="Enter your username"
      />
      <FieldDescription>
        Choose a unique username for your account.
      </FieldDescription>
    </Field>
  )
}
```

## Field Group

Use `FieldGroup` to show multiple `Field` blocks and to build forms.

**Example — `input-fieldgroup`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputFieldgroup() {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
        <Input id="fieldgroup-name" placeholder="Jordan Lee" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
        <Input
          id="fieldgroup-email"
          type="email"
          placeholder="name@example.com"
        />
        <FieldDescription>
          We&apos;ll send updates to this address.
        </FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </Field>
    </FieldGroup>
  )
}
```

## Disabled

Use the `disabled` prop to disable the input. To style the disabled state, add the `data-disabled` attribute to the `Field` component.

**Example — `input-disabled`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="input-demo-disabled">Email</FieldLabel>
      <Input
        id="input-demo-disabled"
        type="email"
        placeholder="Email"
        disabled
      />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  )
}
```

## Invalid

Use the `aria-invalid` prop to mark the input as invalid. To style the invalid state, add the `data-invalid` attribute to the `Field` component.

**Example — `input-invalid`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
      <Input id="input-invalid" placeholder="Error" aria-invalid />
      <FieldDescription>
        This field contains validation errors.
      </FieldDescription>
    </Field>
  )
}
```

## File

Use the `type="file"` prop to create a file input.

**Example — `input-file`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputFile() {
  return (
    <Field>
      <FieldLabel htmlFor="picture">Picture</FieldLabel>
      <Input id="picture" type="file" />
      <FieldDescription>Select a picture to upload.</FieldDescription>
    </Field>
  )
}
```

## Inline

Use `Field` with `orientation="horizontal"` to create an inline input.
Pair with `Button` to create a search input with a button.

**Example — `input-inline`**

```tsx
import { Button } from "@tecton/react/components/button"
import { Field } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputInline() {
  return (
    <Field orientation="horizontal">
      <Input type="search" placeholder="Search..." />
      <Button>Search</Button>
    </Field>
  )
}
```

## Grid

Use a grid layout to place multiple inputs side by side.

**Example — `input-grid`**

```tsx
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputGrid() {
  return (
    <FieldGroup className="grid max-w-sm grid-cols-2">
      <Field>
        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
        <Input id="first-name" placeholder="Jordan" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
        <Input id="last-name" placeholder="Lee" />
      </Field>
    </FieldGroup>
  )
}
```

## Required

Use the `required` attribute to indicate required inputs.

**Example — `input-required`**

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputRequired() {
  return (
    <Field>
      <FieldLabel htmlFor="input-required">
        Required Field <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        id="input-required"
        placeholder="This field is required"
        required
      />
      <FieldDescription>This field must be filled out.</FieldDescription>
    </Field>
  )
}
```

## Badge

Use `Badge` in the label to highlight a recommended field.

**Example — `input-badge`**

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputBadge() {
  return (
    <Field>
      <FieldLabel htmlFor="input-badge">
        Webhook URL{" "}
        <Badge variant="secondary" className="ml-auto">
          Beta
        </Badge>
      </FieldLabel>
      <Input
        id="input-badge"
        type="url"
        placeholder="https://api.example.com/webhook"
      />
    </Field>
  )
}
```

## Input Group

To add icons, text, or buttons inside an input, use the `InputGroup` component. See the [Input Group](/docs/components/input-group.md) component for more examples.

**Example — `input-input-group`**

```tsx
import { InfoIcon } from "lucide-react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@tecton/react/components/input-group"

export function InputInputGroup() {
  return (
    <Field>
      <FieldLabel htmlFor="input-group-url">Website URL</FieldLabel>
      <InputGroup>
        <InputGroupInput id="input-group-url" placeholder="example.com" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InfoIcon />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
```

## Button Group

To add buttons to an input, use the `ButtonGroup` component. See the [Button Group](/docs/components/button-group.md) component for more examples.

**Example — `input-button-group`**

```tsx
import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputButtonGroup() {
  return (
    <Field>
      <FieldLabel htmlFor="input-button-group">Search</FieldLabel>
      <ButtonGroup>
        <Input id="input-button-group" placeholder="Type to search..." />
        <Button variant="outline">Search</Button>
      </ButtonGroup>
    </Field>
  )
}
```

## Form

A full form example with multiple inputs, a select, and a button.

**Example — `input-form`**

```tsx
import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

export function InputForm() {
  const countries = [
    { label: "United States", value: "us" },
    { label: "United Kingdom", value: "uk" },
    { label: "Canada", value: "ca" },
  ]
  return (
    <form className="w-full max-w-sm">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="form-name">Name</FieldLabel>
          <Input
            id="form-name"
            type="text"
            placeholder="Evil Rabbit"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="form-email">Email</FieldLabel>
          <Input id="form-email" type="email" placeholder="john@example.com" />
          <FieldDescription>
            We&apos;ll never share your email with anyone.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
            <Input id="form-phone" type="tel" placeholder="+1 (555) 123-4567" />
          </Field>
          <Field>
            <FieldLabel htmlFor="form-country">Country</FieldLabel>
            <Select defaultValue="us">
              <SelectTrigger id="form-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {countries.map((country) => (
                    <SelectItem key={country.value} id={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="form-address">Address</FieldLabel>
          <Input id="form-address" type="text" placeholder="123 Main St" />
        </Field>
        <Field orientation="horizontal">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `input-rtl`**

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
import { Input } from "@tecton/react/components/input"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      apiKey: "API Key",
      placeholder: "sk-...",
      description: "Your API key is encrypted and stored securely.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      apiKey: "مفتاح API",
      placeholder: "sk-...",
      description: "مفتاح API الخاص بك مشفر ومخزن بأمان.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      apiKey: "מפתח API",
      placeholder: "sk-...",
      description: "מפתח ה-API שלך מוצפן ונשמר בצורה מאובטחת.",
    },
  },
}

export function InputRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Field dir={dir}>
      <FieldLabel htmlFor="input-rtl-api-key">{t.apiKey}</FieldLabel>
      <Input
        id="input-rtl-api-key"
        type="password"
        placeholder={t.placeholder}
        dir={dir}
      />
      <FieldDescription>{t.description}</FieldDescription>
    </Field>
  )
}
```

## Variants

Use `variant="outline" | "filled" | "text"` for the three Tecton surface styles. Label, description and error message come from `Field` (see [Forms](/docs/forms.md)); the `Textarea` and the `SelectTrigger` accept the same `variant`.

**Example — `input-variants`**

```tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function InputVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`input-variants-${variant}`}>{label}</FieldLabel>
          <Input
            id={`input-variants-${variant}`}
            variant={variant}
            placeholder="Well name"
          />
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
```
