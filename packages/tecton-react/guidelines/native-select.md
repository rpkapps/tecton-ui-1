---
component: NativeSelect
module: "@tecton/react/components/native-select"
family: selection
exports: [NativeSelect, NativeSelectOption, NativeSelectOptGroup]
notFor:
  - need: a themed popover with icons, rich items or a searchable list
    use: Select
  - need: typing to narrow a long list
    use: Combobox
  - need: two to five options that all stay visible
    use: RadioGroup
related: [Select, Combobox]
---

## Use it when

- You want the platform's own dropdown: native keyboard behaviour and the mobile wheel, with no popover.
- A form posts natively and the value has to come from a real `select` element in the DOM.
- The row is dense and the options are plain text, with no icons or descriptions.

## Do

- Treat it as a `select`: `value` / `defaultValue` / `onChange(event)`, `disabled`, `required`, `name`.
- Set the height with `size="sm" | "default"`; the native row-count `size` is deliberately not available.
- Make the first `NativeSelectOption` an empty-valued row when you need a placeholder.
- Group options with `NativeSelectOptGroup label="…"`.
- Signal errors with `aria-invalid` on the select and `data-invalid` on the surrounding `Field`.

## Don't

### HIGH React Aria props on a native select element

Wrong:

```tsx
<NativeSelect isDisabled onSelectionChange={setStatus}>
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

Correct:

```tsx
<NativeSelect disabled value={status} onChange={(event) => setStatus(event.target.value)}>
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

`NativeSelect` renders a real `select` and spreads its props onto it, so React Aria names like `isDisabled` and `onSelectionChange` reach the DOM as unknown attributes and the control stays enabled and unwired.

### MEDIUM Passing a native row count to size

Wrong:

```tsx
<NativeSelect size={5}>
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

Correct:

```tsx
<NativeSelect size="sm">
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

The component omits the DOM `size` and redefines it as the Tecton height token, so a number is written to `data-size` only, matches no height rule and never expands the list.

### MEDIUM A placeholder prop instead of an empty option

Wrong:

```tsx
<NativeSelect placeholder="Select status">
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

Correct:

```tsx
<NativeSelect defaultValue="">
  <NativeSelectOption value="">Select status</NativeSelectOption>
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
</NativeSelect>
```

`select` elements have no `placeholder` attribute, so the prop is dropped and the field silently shows the first real option as if it had been chosen.
