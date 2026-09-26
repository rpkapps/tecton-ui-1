---
component: Select
module: "@tecton/react/components/select"
family: selection
exports: [Select, SelectTrigger, SelectValue, SelectContent, SelectPopover, SelectList, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectInput, SelectEmpty]
notFor:
  - need: a list the user narrows by typing
    use: Combobox
  - need: the browser's own dropdown, for a dense form or a phone
    use: NativeSelect
  - need: two to five options that all stay visible
    use: RadioGroup
  - need: a menu of actions rather than a value
    use: DropdownMenu
related: [Combobox, NativeSelect, RadioGroup]
---

## Use it when

- A field picks one value out of a known, closed list: a datum, a unit, a status.
- The list is short enough to scan and needs no typing to get through.
- The trigger must match the other controls in a field row: `variant="outline" | "filled" | "text"`.

## Do

- Label it with `FieldLabel` inside `Select` (or `aria-labelledby` on `Select`), never `htmlFor` on the trigger, which the trigger's own `aria-labelledby` overrides; put `placeholder` on `Select`, as `SelectValue` takes none.
- Key every item with `id`, drive selection with `value` / `defaultValue` / `onChange(key)`; `selectedKey` and `onSelectionChange` are deprecated.
- Choose the surface with `SelectTrigger`'s `variant`, the height with its `size="sm" | "default"`.
- Structure long lists with `SelectGroup` and `SelectLabel`, divided by `SelectSeparator`.
- To make it searchable, wrap `SelectPopover` in React Aria's `Autocomplete` with `SelectInput` and `SelectList`.

## Don't

### CRITICAL Radix onValueChange and item value instead of onChange and id

Wrong:

```tsx
<Select value={datum} onValueChange={setDatum}>
  <SelectTrigger><SelectValue placeholder="Datum" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

Correct:

```tsx
<Select placeholder="Datum" value={datum} onChange={setDatum}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem id="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

`value` on `Select` is right, but `onValueChange` is not a React Aria prop (the handler is `onChange`, handed `Key | null`), `value` on `SelectItem` is the item's object value rather than its collection key, and `SelectValue` ignores `placeholder`, so the handler never fires, no item ever matches and the trigger shows no prompt.

### HIGH Restyling the trigger with className instead of variant

Wrong:

```tsx
<SelectTrigger className="h-10 rounded-full border-slate-300 bg-gray-200">
  <SelectValue />
</SelectTrigger>
```

Correct:

```tsx
<SelectTrigger variant="filled" size="sm">
  <SelectValue />
</SelectTrigger>
```

`SelectTrigger` owns height, border and surface through `size` and `variant`; the stock palette is reset, so `border-slate-300` and `bg-gray-200` emit no CSS and only the hand-set height survives.

### MEDIUM Disabling with the HTML disabled prop

Wrong:

```tsx
<SelectContent>
  <SelectItem id="kb" disabled>Kelly bushing</SelectItem>
</SelectContent>
```

Correct:

```tsx
<SelectContent>
  <SelectItem id="kb" isDisabled>Kelly bushing</SelectItem>
</SelectContent>
```

React Aria reads `isDisabled` on both `Select` and `SelectItem`; `disabled` is not in either props type, so it is dropped and the option stays selectable.
