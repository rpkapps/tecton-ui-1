---
component: Meter
module: "@tecton/react/tecton/meter"
family: progress
exports: [Meter]
notFor:
  - need: the completion of a task that will finish
    use: Progress
  - need: an indeterminate wait
    use: Spinner
  - need: a one-word risk label in a row or a header
    use: Badge
related: [Progress, CircularProgress]
---

## Use it when

- A score or a level is being read, not a task being completed: geological risk, drilling complexity, confidence, data quality.
- The value sits on a fixed scale with named bands (low / medium / high).
- The readout belongs on a card, in a table cell or in a panel row, with a label and a word for the value.

## Do

- Name it: `label` renders the visible label that names the meter; use `aria-label` when the name is already beside it.
- State the scale with `min` and `max` whenever it is not 0–100; the segments fill from the percentage.
- Choose `segments` (5 by default, `1` for a continuous bar) and `size="sm" | "md" | "lg"`.
- Let `color="auto"` pick success / warning / error from the value, or fix it with `color`; `color="custom"` reads `--meter-fill`.
- Show the band with `valueLabel="Medium"` and the raw number with `showValue`.

## Don't

### CRITICAL A meter with no accessible name

Wrong:

```tsx
<Meter value={60} valueLabel="Medium" className="max-w-xs" />
```

Correct:

```tsx
<Meter label="Drilling complexity" value={60} valueLabel="Medium" className="max-w-xs" />
```

The segments are plain `span`s and `role="meter"` takes no name from them, so without `label` or `aria-label` the gauge announces a number with nothing to attach it to.

### HIGH A raw score on the default 0–100 scale

Wrong:

```tsx
<Meter label="Confidence" value={4} showValue />
```

Correct:

```tsx
<Meter label="Confidence" value={4} max={5} showValue />
```

`max` defaults to `100`, so a 4-out-of-5 score fills 4 % of the track and is announced as 4 %.

### MEDIUM Re-deriving the colour bands by hand

Wrong:

```tsx
<Meter
  label="Geological risk"
  value={risk}
  color={risk >= 67 ? "error" : risk >= 34 ? "warning" : "success"}
/>
```

Correct:

```tsx
<Meter label="Geological risk" value={risk} color="auto" />
```

`color="auto"` already applies the 34 / 67 thresholds to the percentage, so the hand-written ternary duplicates a design-system decision and disagrees with it as soon as `min` or `max` is not 0–100.

### MEDIUM Colouring the segments with className

Wrong:

```tsx
<Meter label="Data quality" value={80} className="bg-green-600" />
```

Correct:

```tsx
<Meter label="Data quality" value={80} color="success" />
```

`className` lands on the meter's outer flex column, not on the segment fills, which take their class from `color` — and `green-600` is not a Tecton step, so nothing is emitted for it either.
