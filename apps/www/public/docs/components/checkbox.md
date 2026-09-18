# Checkbox

A control that allows the user to toggle between checked and not checked.

Source: /docs/components/checkbox.md  
React Aria docs: https://react-aria.adobe.com/Checkbox  
React Aria API: https://react-aria.adobe.com/Checkbox#api

**Example — `checkbox-demo`**

```tsx
"use client"

import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import { Label } from "@tecton/react/components/label"

export default function CheckboxDemo() {
  return (
    <FieldGroup className="max-w-sm">
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox" name="terms-checkbox" />
        <Label htmlFor="terms-checkbox">Accept terms and conditions</Label>
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          id="terms-checkbox-2"
          name="terms-checkbox-2"
          defaultSelected
        />
        <FieldContent>
          <FieldLabel htmlFor="terms-checkbox-2">
            Accept terms and conditions
          </FieldLabel>
          <FieldDescription>
            By clicking this checkbox, you agree to the terms.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal" data-disabled>
        <Checkbox id="toggle-checkbox" name="toggle-checkbox" isDisabled />
        <FieldLabel htmlFor="toggle-checkbox">Enable notifications</FieldLabel>
      </Field>
      <FieldLabel>
        <Field orientation="horizontal">
          <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
          <FieldContent>
            <FieldTitle>Enable notifications</FieldTitle>
            <FieldDescription>
              You can enable or disable notifications at any time.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  )
}
```

## Usage

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
```

```tsx
<Checkbox />
```

## Checked State

Use `defaultSelected` for uncontrolled checkboxes, or `isSelected` and
`onChange` to control the state.

```tsx showLineNumbers
import * as React from "react"

export function Example() {
  const [checked, setChecked] = React.useState(false)

  return <Checkbox isSelected={checked} onChange={setChecked} />
}
```

## Invalid State

Set `isInvalid` on the checkbox and `data-invalid` on the field wrapper to
show the invalid styles.

**Example — `checkbox-invalid`**

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxInvalid() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal" data-invalid>
        <Checkbox
          id="terms-checkbox-invalid"
          name="terms-checkbox-invalid"
          isInvalid
        />
        <FieldLabel htmlFor="terms-checkbox-invalid">
          Accept terms and conditions
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
```

## Basic

Pair the checkbox with `Field` and `FieldLabel` for proper layout and labeling.

**Example — `checkbox-basic`**

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxBasic() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox-basic" name="terms-checkbox-basic" />
        <FieldLabel htmlFor="terms-checkbox-basic">
          Accept terms and conditions
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
```

## Description

Use `FieldContent` and `FieldDescription` for helper text.

**Example — `checkbox-description`**

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"

export function CheckboxDescription() {
  return (
    <FieldGroup className="mx-auto w-72">
      <Field orientation="horizontal">
        <Checkbox
          id="terms-checkbox-desc"
          name="terms-checkbox-desc"
          defaultSelected
        />
        <FieldContent>
          <FieldLabel htmlFor="terms-checkbox-desc">
            Accept terms and conditions
          </FieldLabel>
          <FieldDescription>
            By clicking this checkbox, you agree to the terms and conditions.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
```

## Disabled

Use the `isDisabled` prop to prevent interaction and add the `data-disabled` attribute to the `<Field>` component for disabled styles.

**Example — `checkbox-disabled`**

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxDisabled() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal" data-disabled>
        <Checkbox
          id="toggle-checkbox-disabled"
          name="toggle-checkbox-disabled"
          isDisabled
        />
        <FieldLabel htmlFor="toggle-checkbox-disabled">
          Enable notifications
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
```

## Group

Use multiple fields to create a checkbox list.

**Example — `checkbox-group`**

```tsx
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@tecton/react/components/field"

export function CheckboxGroup() {
  return (
    <FieldSet>
      <FieldLegend variant="label">
        Show these items on the desktop:
      </FieldLegend>
      <FieldDescription>
        Select the items you want to show on the desktop.
      </FieldDescription>
      <FieldGroup className="gap-3">
        <Field orientation="horizontal">
          <Checkbox
            id="finder-pref-9k2-hard-disks-ljj-checkbox"
            name="finder-pref-9k2-hard-disks-ljj-checkbox"
            defaultSelected
          />
          <FieldLabel
            htmlFor="finder-pref-9k2-hard-disks-ljj-checkbox"
            className="font-normal"
          >
            Hard disks
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="finder-pref-9k2-external-disks-1yg-checkbox"
            name="finder-pref-9k2-external-disks-1yg-checkbox"
            defaultSelected
          />
          <FieldLabel
            htmlFor="finder-pref-9k2-external-disks-1yg-checkbox"
            className="font-normal"
          >
            External disks
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="finder-pref-9k2-cds-dvds-fzt-checkbox"
            name="finder-pref-9k2-cds-dvds-fzt-checkbox"
          />
          <FieldLabel
            htmlFor="finder-pref-9k2-cds-dvds-fzt-checkbox"
            className="font-normal"
          >
            CDs, DVDs, and iPods
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="finder-pref-9k2-connected-servers-6l2-checkbox"
            name="finder-pref-9k2-connected-servers-6l2-checkbox"
          />
          <FieldLabel
            htmlFor="finder-pref-9k2-connected-servers-6l2-checkbox"
            className="font-normal"
          >
            Connected servers
          </FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
```

## Table

**Example — `checkbox-table`**

```tsx
"use client"

import * as React from "react"

import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

const tableData = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    role: "Admin",
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    email: "marcus.rodriguez@example.com",
    role: "User",
  },
  {
    id: "3",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    role: "User",
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@example.com",
    role: "Editor",
  },
]

export function CheckboxInTable() {
  return (
    <Table aria-label="Users" selectionMode="multiple">
      <TableHeader>
        <TableHead className="w-8">
          <Checkbox
            id="select-all-checkbox"
            name="select-all-checkbox"
            slot="selection"
          />
        </TableHead>
        <TableHead isRowHeader>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
      </TableHeader>
      <TableBody>
        {tableData.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Checkbox
                id={`row-${row.id}-checkbox`}
                name={`row-${row.id}-checkbox`}
                slot="selection"
              />
            </TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `checkbox-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import { Label } from "@tecton/react/components/label"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      acceptTerms: "Accept terms and conditions",
      acceptTermsDescription:
        "By clicking this checkbox, you agree to the terms.",
      enableNotifications: "Enable notifications",
      enableNotificationsDescription:
        "You can enable or disable notifications at any time.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      acceptTerms: "قبول الشروط والأحكام",
      acceptTermsDescription: "بالنقر على هذا المربع، فإنك توافق على الشروط.",
      enableNotifications: "تفعيل الإشعارات",
      enableNotificationsDescription:
        "يمكنك تفعيل أو إلغاء تفعيل الإشعارات في أي وقت.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      acceptTerms: "קבל תנאים והגבלות",
      acceptTermsDescription:
        "על ידי לחיצה על תיבת הסימון הזו, אתה מסכים לתנאים.",
      enableNotifications: "הפעל התראות",
      enableNotificationsDescription:
        "אתה יכול להפעיל או להשבית התראות בכל עת.",
    },
  },
}

export function CheckboxRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <FieldGroup className="max-w-sm" dir={dir}>
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox-rtl" name="terms-checkbox" />
        <Label htmlFor="terms-checkbox-rtl">{t.acceptTerms}</Label>
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          id="terms-checkbox-2-rtl"
          name="terms-checkbox-2"
          defaultSelected
        />
        <FieldContent>
          <FieldLabel htmlFor="terms-checkbox-2-rtl">
            {t.acceptTerms}
          </FieldLabel>
          <FieldDescription>{t.acceptTermsDescription}</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal" data-disabled>
        <Checkbox id="toggle-checkbox-rtl" name="toggle-checkbox" isDisabled />
        <FieldLabel htmlFor="toggle-checkbox-rtl">
          {t.enableNotifications}
        </FieldLabel>
      </Field>
      <FieldLabel>
        <Field orientation="horizontal">
          <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
          <FieldContent>
            <FieldTitle>{t.enableNotifications}</FieldTitle>
            <FieldDescription>
              {t.enableNotificationsDescription}
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Checkbox#api) documentation for more information.
