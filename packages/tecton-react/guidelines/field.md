---
component: Field
module: "@tecton/react/components/field"
family: forms
exports: [Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle]
notFor:
  - need: a label for a control that stands on its own, outside a field
    use: Label
  - need: the single-line text control itself
    use: Input
  - need: form state, validation and typed error objects
    use: TanStack Form
related: [Input, Textarea, Label]
---

## Use it when

- Any control needs a label: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Slider`.
- The control needs helper text, a validation message, or both.
- Related controls need one legend (`FieldSet` + `FieldLegend`) or even spacing (`FieldGroup`).

## Do

- Give the control an `id` and point `FieldLabel htmlFor` at it; `Field` renders `role="group"` and associates nothing. For a `Select` the `id` goes on `SelectTrigger`, which renders the button; for a `Combobox`, on `ComboboxInput`.
- Choose the layout with `orientation="vertical" | "horizontal" | "responsive"`, and add `FieldContent` when the label and description sit beside the control.
- Put state on `Field` as data attributes: `data-invalid` when the value is rejected, `data-disabled` next to a disabled control.
- Write helper text as `FieldDescription` and the message as `FieldError` — children, or `errors={field.state.meta.errors}` for a validator's issue list.

## Don't

### CRITICAL Announcing the error with a red paragraph

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" />
  <p className="mt-1 text-sm text-red-500">Enter a valid email address.</p>
</Field>
```

Correct:

```tsx
<Field data-invalid>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" aria-invalid />
  <FieldError>Enter a valid email address.</FieldError>
</Field>
```

`text-red-500` emits no CSS once the Tecton palette replaces Tailwind's, and the paragraph carries no `role="alert"`, so the message is both invisible and unannounced.

### HIGH Marking the control invalid but not the field

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="user">Username</FieldLabel>
  <Input id="user" aria-invalid />
  <FieldError>Choose another username.</FieldError>
</Field>
```

Correct:

```tsx
<Field data-invalid>
  <FieldLabel htmlFor="user">Username</FieldLabel>
  <Input id="user" aria-invalid />
  <FieldError>Choose another username.</FieldError>
</Field>
```

`fieldVariants` turns the whole block destructive from `data-[invalid=true]` on `Field`, so without it only the input's own ring reacts and the label keeps the default colour.

### HIGH Reaching for FieldTitle where a label belongs

Wrong:

```tsx
<Field orientation="horizontal">
  <FieldTitle>Marketing emails</FieldTitle>
  <Switch id="marketing" />
</Field>
```

Correct:

```tsx
<Field orientation="horizontal">
  <FieldLabel htmlFor="marketing">Marketing emails</FieldLabel>
  <Switch id="marketing" />
</Field>
```

`FieldTitle` renders a `div`, so the switch is left unnamed; it is only for the heading inside a `FieldContent` whose whole `Field` is already wrapped in a `FieldLabel`.
