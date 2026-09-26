---
component: Slider
module: "@tecton/react/components/slider"
family: forms
exports: [Slider]
notFor:
  - need: an exact number the user types, with units or validation
    use: Input
  - need: the title, description and layout around the control
    use: Field
  - need: an on/off setting rather than a value
    use: Switch
related: [Field, Input]
---

## Use it when

- An approximate value inside a known range: opacity, threshold, zoom, temperature.
- A range with two or more thumbs, such as a price or depth filter.
- The exact number matters less than the gesture of moving through the range.

## Do

- Bound the range with `min`, `max` and `step` (0–100 by default).
- Pass `value` / `defaultValue` as an array — one entry per thumb — and read it back in `onValueChange`, whose type is `number | number[]`, so narrow it; `onValueCommitted` fires once on release.
- Name it with `aria-labelledby` pointing at the visible title's `id`, or with `aria-label` when there is no visible title: the slider forwards either to every thumb's range input.
- Inside a `Field`, use `FieldTitle` (with that `id`) and `FieldDescription`, and show the live value in the description.
- Disable with `disabled`; switch axis with `orientation="vertical"` plus a height class such as `h-40`.

## Don't

### HIGH minValue and maxValue instead of min and max

Wrong:

```tsx
<Slider aria-labelledby="zoom-label" defaultValue={[2]} minValue={0} maxValue={5} step={0.5} />
```

Correct:

```tsx
<Slider aria-labelledby="zoom-label" defaultValue={[2]} min={0} max={5} step={0.5} />
```

`minValue` and `maxValue` are not slider props and never reach the range state, so the slider keeps its default 0–100 range and the thumb barely moves.

### HIGH Labelling the slider with FieldLabel and htmlFor

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="zoom">Zoom</FieldLabel>
  <Slider id="zoom" defaultValue={[50]} />
</Field>
```

Correct:

```tsx
<Field>
  <FieldTitle id="zoom-label">Zoom</FieldTitle>
  <Slider aria-labelledby="zoom-label" defaultValue={[50]} />
</Field>
```

The `id` lands on the slider's wrapper `div`, which a `label htmlFor` cannot address, so the thumb's `input[type=range]` is left with no accessible name.

### MEDIUM A single number instead of an array

Wrong:

```tsx
<Slider aria-labelledby="opacity-label" value={opacity} onValueChange={setOpacity} />
```

Correct:

```tsx
<Slider
  aria-labelledby="opacity-label"
  value={[opacity]}
  onValueChange={(next) => setOpacity(Array.isArray(next) ? next[0] : next)}
/>
```

The component counts thumbs from the array it is given and falls back to `[min, max]` for anything else, so a plain number renders a second, stray thumb on the track.
