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

- Drive it with `value` / `defaultValue` / `onChange` on `RadioGroup`; React Aria hands you the string, not an event.
- Give each `RadioGroupItem` a `value`; add `id` only so a `FieldLabel htmlFor` can point at it.
- Name the group with `aria-label`, or wrap it in `FieldSet` and `FieldLegend`.
- Disable everything with `isDisabled` on the group, one option with `isDisabled` on the item.
- Mark errors with `isInvalid` on the group and `data-invalid` on each `Field` row.

## Don't

### CRITICAL Radix onValueChange instead of onChange

Wrong:

```tsx
<RadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
  <RadioGroupItem value="compact" id="density-compact" />
</RadioGroup>
```

Correct:

```tsx
<RadioGroup aria-label="Density" value={density} onChange={setDensity}>
  <RadioGroupItem value="compact" id="density-compact" />
</RadioGroup>
```

React Aria's `RadioGroup` reports the new value through `onChange`; `onValueChange` is not part of its props, so it is dropped and a controlled group can never leave its initial value.

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

Unlike the collection components, a `Radio` identifies itself to its group by `value` and `id` is only the DOM id used by `htmlFor`, so nothing matches `defaultValue` and no option renders as selected.

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
