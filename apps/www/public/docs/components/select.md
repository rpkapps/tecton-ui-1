# Select

Displays a list of options for the user to pick from—triggered by a button.

Source: /docs/components/select.md  
React Aria docs: https://react-aria.adobe.com/Select  
React Aria API: https://react-aria.adobe.com/Select#api

**Example — `select-demo`**

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const items = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Blueberry", value: "blueberry" },
  { label: "Grapes", value: "grapes" },
  { label: "Pineapple", value: "pineapple" },
]

export function SelectDemo() {
  return (
    <Select placeholder="Select a fruit" className="w-full max-w-48">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {items.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
```

```tsx showLineNumbers
const items = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
]

<Select placeholder="Theme">
  <SelectTrigger className="w-[180px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} id={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

## Composition

Use the following composition to build a `Select`:

```text
Select
├── SelectTrigger
│   └── SelectValue
└── SelectContent
    ├── SelectGroup
    │   ├── SelectLabel
    │   ├── SelectItem
    │   └── SelectItem
    ├── SelectSeparator
    └── SelectGroup
        ├── SelectLabel
        ├── SelectItem
        └── SelectItem
```

## Groups

Use `SelectGroup`, `SelectLabel`, and `SelectSeparator` to organize items.

**Example — `select-groups`**

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

export function SelectGroups() {
  const fruits = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Blueberry", value: "blueberry" },
  ]
  const vegetables = [
    { label: "Carrot", value: "carrot" },
    { label: "Broccoli", value: "broccoli" },
    { label: "Spinach", value: "spinach" },
  ]
  const allItems = [...fruits, ...vegetables]
  return (
    <Select placeholder="Select a fruit" className="w-full max-w-48">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {fruits.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          {vegetables.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

## Scrollable

A select with many items that scrolls.

**Example — `select-scrollable`**

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const northAmerica = [
  { label: "Eastern Standard Time", value: "est" },
  { label: "Central Standard Time", value: "cst" },
  { label: "Mountain Standard Time", value: "mst" },
  { label: "Pacific Standard Time", value: "pst" },
  { label: "Alaska Standard Time", value: "akst" },
  { label: "Hawaii Standard Time", value: "hst" },
]

const europeAfrica = [
  { label: "Greenwich Mean Time", value: "gmt" },
  { label: "Central European Time", value: "cet" },
  { label: "Eastern European Time", value: "eet" },
  { label: "Western European Summer Time", value: "west" },
  { label: "Central Africa Time", value: "cat" },
  { label: "East Africa Time", value: "eat" },
]

const asia = [
  { label: "Moscow Time", value: "msk" },
  { label: "India Standard Time", value: "ist" },
  { label: "China Standard Time", value: "cst_china" },
  { label: "Japan Standard Time", value: "jst" },
  { label: "Korea Standard Time", value: "kst" },
  { label: "Indonesia Central Standard Time", value: "ist_indonesia" },
]

const australiaPacific = [
  { label: "Australian Western Standard Time", value: "awst" },
  { label: "Australian Central Standard Time", value: "acst" },
  { label: "Australian Eastern Standard Time", value: "aest" },
  { label: "New Zealand Standard Time", value: "nzst" },
  { label: "Fiji Time", value: "fjt" },
]

const southAmerica = [
  { label: "Argentina Time", value: "art" },
  { label: "Bolivia Time", value: "bot" },
  { label: "Brasilia Time", value: "brt" },
  { label: "Chile Standard Time", value: "clt" },
]

const items = [
  ...northAmerica,
  ...europeAfrica,
  ...asia,
  ...australiaPacific,
  ...southAmerica,
]

export function SelectScrollable() {
  return (
    <Select placeholder="Select a timezone" className="w-full max-w-64">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          {northAmerica.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          {europeAfrica.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          {asia.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Australia & Pacific</SelectLabel>
          {australiaPacific.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>South America</SelectLabel>
          {southAmerica.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

## Disabled

**Example — `select-disabled`**

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

export function SelectDisabled() {
  const items = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Blueberry", value: "blueberry" },
    { label: "Grapes", value: "grapes", disabled: true },
    { label: "Pineapple", value: "pineapple" },
  ]
  return (
    <Select isDisabled placeholder="Select a fruit" className="w-full max-w-48">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem
              key={item.value}
              id={item.value}
              isDisabled={item.disabled}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

## Invalid

Add the `data-invalid` attribute to the `Field` component and the `isInvalid` prop to the `SelectTrigger` component to show an error state.

```tsx showLineNumbers /data-invalid/ /aria-invalid/
<Field data-invalid>
  <FieldLabel>Fruit</FieldLabel>
  <Select isInvalid>{/* ... */}</Select>
</Field>
```

**Example — `select-invalid`**

```tsx
import { Field, FieldError, FieldLabel } from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const items = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Blueberry", value: "blueberry" },
]

export function SelectInvalid() {
  return (
    <Field data-invalid className="w-full max-w-48">
      <FieldLabel>Fruit</FieldLabel>
      <Select placeholder="Select a fruit" isInvalid>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} id={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError>Please select a fruit.</FieldError>
    </Field>
  )
}
```

## Searchable

Use the [Autocomplete](https://react-aria.adobe.com/Autocomplete) component from React Aria to add search support.

**Example — `select-autocomplete`**

```tsx
"use client"

import { Autocomplete, useFilter } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import {
  Select,
  SelectEmpty,
  SelectGroup,
  SelectInput,
  SelectItem,
  SelectList,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const countries = [
  {
    code: "ar",
    value: "argentina",
    label: "Argentina",
    continent: "South America",
  },
  { code: "au", value: "australia", label: "Australia", continent: "Oceania" },
  { code: "br", value: "brazil", label: "Brazil", continent: "South America" },
  { code: "ca", value: "canada", label: "Canada", continent: "North America" },
  { code: "cn", value: "china", label: "China", continent: "Asia" },
  {
    code: "co",
    value: "colombia",
    label: "Colombia",
    continent: "South America",
  },
  { code: "eg", value: "egypt", label: "Egypt", continent: "Africa" },
  { code: "fr", value: "france", label: "France", continent: "Europe" },
  { code: "de", value: "germany", label: "Germany", continent: "Europe" },
  { code: "it", value: "italy", label: "Italy", continent: "Europe" },
  { code: "jp", value: "japan", label: "Japan", continent: "Asia" },
  { code: "ke", value: "kenya", label: "Kenya", continent: "Africa" },
  { code: "mx", value: "mexico", label: "Mexico", continent: "North America" },
  {
    code: "nz",
    value: "new-zealand",
    label: "New Zealand",
    continent: "Oceania",
  },
  { code: "ng", value: "nigeria", label: "Nigeria", continent: "Africa" },
  {
    code: "za",
    value: "south-africa",
    label: "South Africa",
    continent: "Africa",
  },
  { code: "kr", value: "south-korea", label: "South Korea", continent: "Asia" },
  {
    code: "gb",
    value: "united-kingdom",
    label: "United Kingdom",
    continent: "Europe",
  },
  {
    code: "us",
    value: "united-states",
    label: "United States",
    continent: "North America",
  },
]

export function SelectAutocomplete() {
  const { contains } = useFilter({ sensitivity: "base" })
  return (
    <Select placeholder="Select country" className="w-full max-w-48">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <Autocomplete filter={contains}>
        <SelectPopover>
          <SelectInput />
          <SelectList
            renderEmptyState={() => <SelectEmpty>No items found.</SelectEmpty>}
          >
            <SelectGroup items={countries}>
              {(item) => <SelectItem id={item.value}>{item.label}</SelectItem>}
            </SelectGroup>
          </SelectList>
        </SelectPopover>
      </Autocomplete>
    </Select>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `select-rtl`**

```tsx
"use client"

import * as React from "react"
import { type Key } from "react-aria-components"

import {
  useTranslation,
  type Language,
  type Translations,
} from "@/components/language-selector"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      selectFruit: "Select a fruit",
      fruits: "Fruits",
      apple: "Apple",
      banana: "Banana",
      blueberry: "Blueberry",
      grapes: "Grapes",
      pineapple: "Pineapple",
      vegetables: "Vegetables",
      carrot: "Carrot",
      broccoli: "Broccoli",
      spinach: "Spinach",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      selectFruit: "اختر فاكهة",
      fruits: "الفواكه",
      apple: "تفاح",
      banana: "موز",
      blueberry: "توت أزرق",
      grapes: "عنب",
      pineapple: "أناناس",
      vegetables: "الخضروات",
      carrot: "جزر",
      broccoli: "بروكلي",
      spinach: "سبانخ",
    },
  },
  he: {
    dir: "rtl",
    values: {
      selectFruit: "בחר פרי",
      fruits: "פירות",
      apple: "תפוח",
      banana: "בננה",
      blueberry: "אוכמניה",
      grapes: "ענבים",
      pineapple: "אננס",
      vegetables: "ירקות",
      carrot: "גזר",
      broccoli: "ברוקולי",
      spinach: "תרד",
    },
  },
}

export function SelectRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")
  const [selectedFruit, setSelectedFruit] = React.useState<Key | null>(null)

  const fruits = [
    { label: t.apple, value: "apple" },
    { label: t.banana, value: "banana" },
    { label: t.blueberry, value: "blueberry" },
    { label: t.grapes, value: "grapes" },
    { label: t.pineapple, value: "pineapple" },
  ]

  const vegetables = [
    { label: t.carrot, value: "carrot" },
    { label: t.broccoli, value: "broccoli" },
    { label: t.spinach, value: "spinach" },
  ]

  const allItems = [...fruits, ...vegetables]

  return (
    <Select
      value={selectedFruit}
      onChange={setSelectedFruit}
      placeholder={t.selectFruit}
      className="w-32"
    >
      <SelectTrigger dir={dir}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir={dir} data-lang={dir === "rtl" ? language : undefined}>
        <SelectGroup>
          <SelectLabel>{t.fruits}</SelectLabel>
          {fruits.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>{t.vegetables}</SelectLabel>
          {vegetables.map((item) => (
            <SelectItem key={item.value} id={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

## Variants

`SelectTrigger` accepts `variant="outline" | "filled" | "text"`, the same surface styles as [Input](/docs/components/input.md). Label, description and error message come from `Field` (see [Forms](/docs/forms.md)).

**Example — `select-variants`**

```tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function SelectVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`select-variants-${variant}`}>
            {label}
          </FieldLabel>
          <Select
            placeholder="Datum"
            defaultSelectedKey="msl"
            className="w-full"
          >
            <SelectTrigger id={`select-variants-${variant}`} variant={variant}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="msl">Mean sea level</SelectItem>
              <SelectItem id="kb">Kelly bushing</SelectItem>
              <SelectItem id="gl">Ground level</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
```

## API Reference

See the [React Aria Select](https://react-aria.adobe.com/Select#api) documentation.
