---
component: Select
module: "@tecton/react/components/select"
family: selection
exports: [Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, selectTriggerVariants]
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

- Drive it with `value` / `defaultValue` / `onValueChange` on `Select`, identify each `SelectItem` by `value`, and narrow the `null` that `onValueChange` hands over when nothing is selected.
- Pass `items` (`{ msl: "Mean sea level" }` or `[{ value, label }]`) so `SelectValue` shows the label, not the raw value; its `placeholder` shows while nothing is selected.
- In a `Field`, put the `id` on `SelectTrigger` and point `FieldLabel htmlFor` at it.
- Choose the surface with `SelectTrigger`'s `variant`, the height with its `size="sm" | "default"`; place the list with `side` / `align` on `SelectContent`.
- Structure long lists with `SelectGroup` and `SelectLabel`, divided by `SelectSeparator`.

## Don't

### CRITICAL selectedKey and onSelectionChange instead of value

Wrong:

```tsx
<Select placeholder="Datum" selectedKey={datum} onSelectionChange={setDatum}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem id="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

Correct:

```tsx
<Select items={datums} value={datum} onValueChange={setDatum}>
  <SelectTrigger><SelectValue placeholder="Datum" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

`selectedKey`, `onSelectionChange`, `id` on an item and `placeholder` on the root are not props here: no item has a `value` to match, the handler never fires and the trigger shows no prompt.

### HIGH Restyling the trigger with className instead of variant

Wrong:

```tsx
<SelectTrigger className="h-10 rounded-full border-slate-300 bg-gray-200"><SelectValue /></SelectTrigger>
```

Correct:

```tsx
<SelectTrigger variant="filled" size="sm"><SelectValue /></SelectTrigger>
```

`SelectTrigger` owns height, border and surface through `size` and `variant`; the stock palette is reset, so `border-slate-300` and `bg-gray-200` emit no CSS and only the hand-set height survives.

### MEDIUM A Select without items showing raw values

Wrong:

```tsx
<Select defaultValue="kb">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="kb">Kelly bushing</SelectItem>
  </SelectContent>
</Select>
```

Correct:

```tsx
<Select items={{ kb: "Kelly bushing", msl: "Mean sea level" }} defaultValue="kb">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="kb">Kelly bushing</SelectItem>
  </SelectContent>
</Select>
```

Before the popup has mounted its items, `SelectValue` can only print the value itself, so the trigger reads `kb` until the user opens the list.
