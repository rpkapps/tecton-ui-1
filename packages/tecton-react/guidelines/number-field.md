---
component: NumberField
module: "@tecton/react/number-field"
family: forms
exports: [NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldUnit, NumberFieldIncrement, NumberFieldDecrement, NumberFieldScrubArea, NumberFieldSlider]
notFor:
  - need: an approximate value picked by moving a thumb along a track, or a range with two thumbs
    use: Slider
  - need: free text, an identifier or a phone number made of digits
    use: Input
  - need: a fixed set of numeric options
    use: Select
related: [Field, Slider, InputGroup]
---

## Use it when

- A parameter the user types or nudges: cell size, offset, depth, threshold, opacity.
- The value has bounds, a step, a unit or a locale-specific format (decimals, percent, thousands separators).
- A dense property panel needs drag-to-change on the field itself, as in 3D tools: `NumberFieldSlider`.
- The value is optional: an empty field reports `null`.

## Do

- Compose `NumberField` > `NumberFieldGroup` > `NumberFieldDecrement`, `NumberFieldInput`, `NumberFieldUnit`, `NumberFieldIncrement`: minus first, plus last. Swap the group for `NumberFieldSlider` to get the fill and the drag. `NumberFieldGroup` already draws the border, focus ring and height, so never wrap it, or `NumberFieldInput`, in an `InputGroup`.
- Bound and step it on `NumberField` with `min`, `max`, `step`, `largeStep` (Shift) and `smallStep` (Alt); drive it with `value` / `defaultValue` and `onValueChange(value: number | null)`, and save on `onValueCommitted`.
- Format with `format` (`Intl.NumberFormat` options); the locale comes from `TectonProvider`. Put a unit that `Intl` cannot write ("ft", "psi", "bbl/d") in `NumberFieldUnit`.
- Inside a `Field`, put the `id` on `NumberField` and point `FieldLabel htmlFor` at it; wrap the label in `NumberFieldScrubArea` to scrub from the label. For a value past a soft limit, set `data-invalid` on the `Field` and `aria-invalid` on `NumberFieldInput`, and show the `FieldError` in place of the `FieldDescription`; `min` / `max` stay the hard bounds.
- Give `NumberFieldSlider` both `min` and `max`: the fill and the drag speed come from the range. Pick the surface with `variant="outline" | "filled" | "text"` on the group or the slider.

## Don't

### HIGH minValue and maxValue instead of min and max

Wrong:

```tsx
<NumberField minValue={0} maxValue={100} defaultValue={20}>
  <NumberFieldGroup>
    <NumberFieldInput aria-label="Threshold" />
  </NumberFieldGroup>
</NumberField>
```

Correct:

```tsx
<NumberField min={0} max={100} defaultValue={20}>
  <NumberFieldGroup>
    <NumberFieldInput aria-label="Threshold" />
  </NumberFieldGroup>
</NumberField>
```

`minValue` and `maxValue` are not number field props, so nothing clamps the value and the minus and plus buttons never disable at the ends.

### HIGH An Input with type number and a suffix span

Wrong:

```tsx
<div className="flex items-center gap-1">
  <Input
    type="number"
    value={depth}
    onChange={(e) => setDepth(Number(e.target.value))}
  />
  <span>ft</span>
</div>
```

Correct:

```tsx
<NumberField value={depth} onValueChange={setDepth} min={0}>
  <NumberFieldGroup>
    <NumberFieldInput aria-label="Depth" />
    <NumberFieldUnit>ft</NumberFieldUnit>
  </NumberFieldGroup>
</NumberField>
```

`Number("")` turns a cleared field into `0`, the native spinner ignores the locale, and the loose span is never announced with the value; `NumberFieldUnit` describes the input and `onValueChange` reports `null` for an empty field.
