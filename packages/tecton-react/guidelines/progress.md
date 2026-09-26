---
component: Progress
module: "@tecton/react/components/progress"
family: progress
exports: [Progress, ProgressLabel, ProgressValue, ProgressTrack, ProgressIndicator]
notFor:
  - need: a gauge of risk, complexity or confidence
    use: Meter
  - need: a ring with the value in the middle
    use: CircularProgress
  - need: a placeholder for content whose progress cannot be measured
    use: Skeleton
  - need: a busy indicator inside a button
    use: Spinner
related: [CircularProgress, Meter, Spinner]
---

## Use it when

- A task has a start, an end and a measurable fraction between them: an upload, an import, a batch run.
- The bar belongs in the flow of a panel, a row or a dialog, across the available width.
- The number matters as much as the bar: `ProgressLabel` plus `ProgressValue`.

## Do

- Name it: a `ProgressLabel` child, or `aria-label` when the label is already on screen.
- Let `ProgressValue` print the number; it is formatted from `value`, `min`, `max` and `format` (`Intl.NumberFormat` options).
- State the scale when it is not 0–100: `value={loaded} max={total}`.
- Pass `value={null}` while the total is unknown; the bar turns indeterminate.
- `className` sets the width (`w-full max-w-sm`), never the height or the colour.

## Don't

### CRITICAL A progress bar with no accessible name

Wrong:

```tsx
<Progress value={66} className="w-full max-w-sm" />
```

Correct:

```tsx
<Progress value={66} className="w-full max-w-sm">
  <ProgressLabel>Uploading survey</ProgressLabel>
  <ProgressValue />
</Progress>
```

The progressbar takes its name only from a `ProgressLabel` child or `aria-label`, so the bar is announced as an unnamed progressbar with a bare percentage.

### HIGH A fraction on the default 0–100 scale

Wrong:

```tsx
<Progress aria-label="Uploading survey" value={0.66} className="w-full" />
```

Correct:

```tsx
<Progress aria-label="Uploading survey" value={0.66} max={1} className="w-full" />
```

`Progress` defaults to `min={0} max={100}`, so `0.66` is 0.66 % — the indicator is under a pixel wide and the bar looks stuck at zero.

### HIGH Styling the bar through className

Wrong:

```tsx
<Progress aria-label="Uploading survey" value={66} className="h-2 rounded-full bg-blue-600" />
```

Correct:

```tsx
<Progress aria-label="Uploading survey" value={66} className="w-full max-w-sm" />
```

`className` lands on the flex wrapper that `Progress` renders, not on `ProgressTrack` inside it, so the track keeps its own height, and `blue-600` is not a Tecton step, so it emits no CSS anywhere.
