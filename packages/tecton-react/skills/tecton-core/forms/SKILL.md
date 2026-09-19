---
name: forms
description: >
  Building forms in a Tecton application with the Field component family and
  TanStack Form. Load when writing any form, input, validation or error
  display with @tecton/react. Field/FieldLabel/FieldDescription/FieldError/
  FieldGroup/FieldSet own the layout and a11y wiring but not the form state;
  TanStack Form plus Zod own the state. Covers the crucial split in onChange
  shapes on the React Aria base — Input and Textarea are real DOM inputs and
  give you an event (e.target.value), while Checkbox, Switch and RadioGroup
  give you the value directly and Select gives you a key through
  onSelectionChange — plus isInvalid/aria-invalid error wiring, isRequired,
  and why native browser validation needs disabling for schema validation.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
  - 'tecton-core/components'
sources:
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/forms/index.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/forms/tanstack-form.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/src/examples/form-tanstack-demo.tsx'
---

# Tecton UI — Forms

`Field` gives you labels, descriptions, error messages and layout. It does
**not** own form state. Tecton applications pair it with **TanStack Form**
(headless, and consistent with the TanStack router and table already in use)
and **Zod** for schema validation.

```bash
npm install @tanstack/react-form zod
```

## Non-negotiables

True everywhere in Tecton, whichever skill you loaded.

1. **Stock Tailwind colours emit no CSS.** `globals.css` resets
   `--color-*: initial`, so `bg-red-500` and `text-zinc-400` produce no rule
   and render unstyled — no error, no fallback. Use a semantic token
   (`bg-primary`, `text-success`) or a palette step (`bg-blue-120`).
   Detail: `tecton-core/styling`.
2. **Props are React Aria's, not Radix's.** `onPress` not `onClick`; `is*`
   state props (`isDisabled`, `isSelected`, `isRequired`); `id` not `value`
   on Select, Tabs, Accordion, ToggleGroup and Menu items; no `asChild`.
   Detail: `tecton-core/components`.

## Setup

```tsx
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@tecton/react/components/button"
import {
  Field, FieldDescription, FieldError, FieldGroup, FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

const schema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters."),
})

export function WellForm() {
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => save(value),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Well name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                <FieldDescription>Shown across the suite.</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </FieldGroup>
      <Button type="submit">Save</Button>
    </form>
  )
}
```

The `Field` wrapper takes `data-invalid`; the control takes `aria-invalid`.
Both are needed: the first styles the field's label and description, the second
styles the control and announces the error.

## The `onChange` shape per control

This is the single biggest source of broken Tecton forms. The base is React
Aria, but `Input` and `Textarea` are thin wrappers over real DOM elements,
so they behave like DOM elements — while the *stateful* controls hand you the
value.

| Control                     | Value prop      | `onChange` receives              |
| --------------------------- | --------------- | -------------------------------- |
| `Input`, `Textarea`         | `value`         | a DOM event → `e.target.value`   |
| `Checkbox`, `Switch`        | `isSelected`    | `boolean`                        |
| `RadioGroup`                | `value`         | `string`                         |
| `Select`                    | `selectedKey`   | **`onSelectionChange`** → `Key`  |
| `Combobox`                  | `selectedKey`   | **`onSelectionChange`** → `Key`  |
| `Slider`                    | `value`         | `number` / `number[]`            |

Wired to TanStack Form:

```tsx
// Input / Textarea — event
onChange={(e) => field.handleChange(e.target.value)}

// Checkbox / Switch — boolean
<Checkbox isSelected={field.state.value} onChange={field.handleChange} />

// RadioGroup — string
<RadioGroup value={field.state.value} onChange={field.handleChange}>

// Select — key, through onSelectionChange.
// React Aria uses null for "nothing selected", so map the empty string both ways.
<Select
  selectedKey={field.state.value || null}
  onSelectionChange={(key) => field.handleChange(key ? String(key) : "")}
  placeholder="Select a basin"
>
```

`field.handleChange` takes the value, so it can be passed directly wherever
the control hands over a value — and must be wrapped for `Input`/`Textarea`.

## Required, disabled, invalid

React Aria names them `isRequired` and `isDisabled`. Invalidity splits the same
way the `onChange` shapes do, and for the same reason:

| Control | Mark it invalid with |
| --- | --- |
| `Input`, `Textarea` | `aria-invalid` — they wrap raw DOM elements |
| `Checkbox`, `Select`, `RadioGroup`, `Combobox` | `isInvalid` |
| `Switch` | `data-invalid` — React Aria's `SwitchProps` omits `isInvalid` **and** `isRequired` |

In every case the enclosing `Field` also takes `data-invalid` (see the mistake
below). A prop on the wrong control is dropped as unknown: no destructive
border, no announcement, and no error.

## Structure

| Component          | Use for                                            |
| ------------------ | -------------------------------------------------- |
| `Field`            | One control with its label, description and error    |
| `FieldGroup`       | A stack of fields with consistent spacing            |
| `FieldSet`         | A `<fieldset>` grouping related fields               |
| `FieldLegend`      | The `<legend>` of a `FieldSet`                       |
| `FieldLabel`       | The label; pair `htmlFor` with the control's `id`    |
| `FieldDescription` | Help text, wired as the control's description        |
| `FieldError`       | Error text; takes `errors` from the field meta       |
| `FieldSeparator`   | A divider between field groups                       |

## Common Mistakes

### CRITICAL Reading `e.target.value` from a boolean-valued control

Wrong:

```tsx
<Checkbox
  isSelected={field.state.value}
  onChange={(e) => field.handleChange(e.target.value)}
/>
```

Correct:

```tsx
<Checkbox isSelected={field.state.value} onChange={field.handleChange} />
```

React Aria hands `Checkbox`, `Switch` and `RadioGroup` `onChange` the new value
directly. `e` is a `boolean`, so `e.target` is `undefined` and reading
`.value` throws — or, under a `?.`, writes `undefined` into the form, which
turns the control uncontrolled and silently pins it off.

Source: `apps/www/content/docs/forms/tanstack-form.mdx`

### CRITICAL Passing `field.handleChange` straight to an `Input`

Wrong:

```tsx
<Input value={field.state.value} onChange={field.handleChange} />
```

Correct:

```tsx
<Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
```

`Input` and `Textarea` wrap real DOM elements, so their `onChange` is a DOM
`ChangeEvent`. Passed straight through, the whole event object is written into
the form state: the field holds a React synthetic event instead of a string,
validation fails with an unreadable message, and the submitted payload is
garbage.

Source: `apps/www/src/examples/form-tanstack-demo.tsx`

### HIGH `onChange` on a `Select`

Wrong:

```tsx
<Select value={field.state.value} onChange={(v) => field.handleChange(v)}>
```

Correct:

```tsx
<Select
  selectedKey={field.state.value || null}
  onSelectionChange={(key) => field.handleChange(key ? String(key) : "")}
>
```

React Aria collection components report selection through
`onSelectionChange`, keyed by `id`. `onChange` is not part of `Select`'s prop
type, so the handler never fires and the field keeps its default value through
submit — with no error anywhere. Note the `null` mapping: React Aria uses
`null`, not `""`, for "nothing selected", and an empty string as `selectedKey`
leaves the trigger showing no placeholder.

Source: `apps/www/content/docs/forms/tanstack-form.mdx`

### HIGH Only `data-invalid` or only `aria-invalid`

Wrong:

```tsx
<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
  <Input id={field.name} />
  <FieldError errors={field.state.meta.errors} />
</Field>
```

Correct:

```tsx
<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
  <Input id={field.name} aria-invalid={isInvalid} />
  {isInvalid && <FieldError errors={field.state.meta.errors} />}
</Field>
```

`data-invalid` on the `Field` recolours the label and description; the
control's own destructive border and ring come from `aria-invalid` on the
control. With only one of them the field is half-styled, and an unguarded
`FieldError` renders an empty error slot on a valid, untouched form.

Source: `apps/www/src/examples/form-tanstack-demo.tsx`

### MEDIUM Label not wired to the control

Wrong:

```tsx
<Field>
  <FieldLabel>Well name</FieldLabel>
  <Input name="name" />
</Field>
```

Correct:

```tsx
<Field>
  <FieldLabel htmlFor="well-name">Well name</FieldLabel>
  <Input id="well-name" name="name" />
</Field>
```

`Field` lays the parts out but does not generate ids. Without `htmlFor`/`id`
the label is not associated: clicking it does not focus the input, and the
control is announced with no name.

Source: `apps/www/src/examples/field-demo.tsx`

See also: `tecton-core/components/SKILL.md § The React Aria translation table`
