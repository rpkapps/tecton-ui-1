# Native Select

A styled native HTML select element with consistent design system integration.

Source: /docs/components/native-select.md

> For a styled select component, see the [Select](/docs/components/select.md)
> component.

**Example — `native-select-demo`**

```tsx
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export default function NativeSelectDemo() {
  return (
    <NativeSelect>
      <NativeSelectOption value="">Select status</NativeSelectOption>
      <NativeSelectOption value="todo">Todo</NativeSelectOption>
      <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
      <NativeSelectOption value="done">Done</NativeSelectOption>
      <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
    </NativeSelect>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@tecton/react/components/native-select"
```

```tsx showLineNumbers
<NativeSelect>
  <NativeSelectOption value="">Select a fruit</NativeSelectOption>
  <NativeSelectOption value="apple">Apple</NativeSelectOption>
  <NativeSelectOption value="banana">Banana</NativeSelectOption>
  <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
  <NativeSelectOption value="pineapple">Pineapple</NativeSelectOption>
</NativeSelect>
```

## Composition

### Simple

Options placed directly under `NativeSelect` (no `NativeSelectOptGroup`).

```text
NativeSelect
├── NativeSelectOption
├── NativeSelectOption
├── NativeSelectOption
└── NativeSelectOption
```

### With groups

Use `NativeSelectOptGroup` to organize options into categories.

```text
NativeSelect
├── NativeSelectOptGroup
│   ├── NativeSelectOption
│   └── NativeSelectOption
└── NativeSelectOptGroup
    ├── NativeSelectOption
    └── NativeSelectOption
```

## Groups

Use `NativeSelectOptGroup` to organize options into categories.

**Example — `native-select-groups`**

```tsx
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export default function NativeSelectGroups() {
  return (
    <NativeSelect>
      <NativeSelectOption value="">Select department</NativeSelectOption>
      <NativeSelectOptGroup label="Engineering">
        <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
        <NativeSelectOption value="backend">Backend</NativeSelectOption>
        <NativeSelectOption value="devops">DevOps</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Sales">
        <NativeSelectOption value="sales-rep">Sales Rep</NativeSelectOption>
        <NativeSelectOption value="account-manager">
          Account Manager
        </NativeSelectOption>
        <NativeSelectOption value="sales-director">
          Sales Director
        </NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Operations">
        <NativeSelectOption value="support">
          Customer Support
        </NativeSelectOption>
        <NativeSelectOption value="product-manager">
          Product Manager
        </NativeSelectOption>
        <NativeSelectOption value="ops-manager">
          Operations Manager
        </NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  )
}
```

## Disabled

Add the `disabled` prop to the `NativeSelect` component to disable the select.

**Example — `native-select-disabled`**

```tsx
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export function NativeSelectDisabled() {
  return (
    <NativeSelect disabled>
      <NativeSelectOption value="">Disabled</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  )
}
```

## Invalid

Use `aria-invalid` to show validation errors and the `data-invalid` attribute to the `Field` component for styling.

**Example — `native-select-invalid`**

```tsx
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export function NativeSelectInvalid() {
  return (
    <NativeSelect aria-invalid="true">
      <NativeSelectOption value="">Error state</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  )
}
```

## Native Select vs Select

- Use `NativeSelect` for native browser behavior, better performance, or mobile-optimized dropdowns.
- Use `Select` for custom styling, animations, or complex interactions.

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `native-select-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      placeholder: "Select status",
      todo: "Todo",
      inProgress: "In Progress",
      done: "Done",
      cancelled: "Cancelled",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      placeholder: "اختر الحالة",
      todo: "مهام",
      inProgress: "قيد التنفيذ",
      done: "منجز",
      cancelled: "ملغي",
    },
  },
  he: {
    dir: "rtl",
    values: {
      placeholder: "בחר סטטוס",
      todo: "לעשות",
      inProgress: "בתהליך",
      done: "הושלם",
      cancelled: "בוטל",
    },
  },
}

export function NativeSelectRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <NativeSelect dir={dir}>
      <NativeSelectOption value="">{t.placeholder}</NativeSelectOption>
      <NativeSelectOption value="todo">{t.todo}</NativeSelectOption>
      <NativeSelectOption value="in-progress">
        {t.inProgress}
      </NativeSelectOption>
      <NativeSelectOption value="done">{t.done}</NativeSelectOption>
      <NativeSelectOption value="cancelled">{t.cancelled}</NativeSelectOption>
    </NativeSelect>
  )
}
```

## API Reference

### NativeSelect

The main select component that wraps the native HTML select element.

```tsx
<NativeSelect>
  <NativeSelectOption value="option1">Option 1</NativeSelectOption>
  <NativeSelectOption value="option2">Option 2</NativeSelectOption>
</NativeSelect>
```

### NativeSelectOption

Represents an individual option within the select.

| Prop       | Type      | Default |
| ---------- | --------- | ------- |
| `value`    | `string`  |         |
| `disabled` | `boolean` | `false` |

### NativeSelectOptGroup

Groups related options together for better organization.

| Prop       | Type      | Default |
| ---------- | --------- | ------- |
| `label`    | `string`  |         |
| `disabled` | `boolean` | `false` |

```tsx
<NativeSelectOptGroup label="Fruits">
  <NativeSelectOption value="apple">Apple</NativeSelectOption>
  <NativeSelectOption value="banana">Banana</NativeSelectOption>
</NativeSelectOptGroup>
```
