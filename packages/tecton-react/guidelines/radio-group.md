---
component: RadioGroup
module: "@tecton/react/components/radio-group"
family: selection
exports: [RadioGroup, RadioGroupItem]
notFor:
  - need: more than a handful of options
    use: Select
  - need: a compact segmented control in a toolbar
    use: ToggleGroup
  - need: switching between panels of content
    use: Tabs
related: [Select, ToggleGroup]
---

## Use it when

- Two to about six mutually exclusive options are all worth showing at once.
- Each option earns a description or a whole choice card, not just a word.
- The set is fixed and belongs in a form, next to the other fields.

## Do

- Drive it with `value` / `defaultValue` / `onValueChange` on `RadioGroup`; the handler receives the value, not an event.
- Give each `RadioGroupItem` a `value`; add `id` only so a `FieldLabel htmlFor` can point at it.
- Name the group with `aria-label`, or wrap it in `FieldSet` and `FieldLegend`.
- Disable everything with `disabled` on the group, one option with `disabled` on the item.
- Mark errors with `aria-invalid` on the group and `data-invalid` on each `Field` row.

## Don't

### CRITICAL onChange instead of onValueChange on the group

Wrong:

```tsx
<RadioGroup aria-label="Density" value={density} onChange={setDensity}>
  <RadioGroupItem value="compact" id="density-compact" />
</RadioGroup>
```

Correct:

```tsx
<RadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
  <RadioGroupItem value="compact" id="density-compact" />
</RadioGroup>
```

`RadioGroup` reports the new value through `onValueChange`; `onChange` is the DOM change event bubbling from the hidden input, so `setDensity` receives an event object and a controlled group never shows the new value.

### HIGH Keying radio items with id instead of value

Wrong:

```tsx
<RadioGroup aria-label="Density" defaultValue="compact">
  <RadioGroupItem id="compact" />
  <RadioGroupItem id="comfortable" />
</RadioGroup>
```

Correct:

```tsx
<RadioGroup aria-label="Density" defaultValue="compact">
  <RadioGroupItem value="compact" id="density-compact" />
  <RadioGroupItem value="comfortable" id="density-comfortable" />
</RadioGroup>
```

An item identifies itself to its group by `value` and `id` is only the DOM id used by `htmlFor`, so nothing matches `defaultValue` and no option renders as selected.

### MEDIUM A radio group with no accessible name

Wrong:

```tsx
<RadioGroup defaultValue="email">
  <RadioGroupItem value="email" id="notify-email" />
</RadioGroup>
```

Correct:

```tsx
<FieldSet>
  <FieldLegend variant="label">Notifications</FieldLegend>
  <RadioGroup aria-label="Notifications" defaultValue="email">
    <RadioGroupItem value="email" id="notify-email" />
  </RadioGroup>
</FieldSet>
```

`RadioGroup` renders a bare `div` with `role="radiogroup"` and no label of its own, so the group is announced without a name and the options lose the question they answer.
