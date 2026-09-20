---
component: Spinner
module: "@tecton/react/components/spinner"
family: progress
exports: [Spinner]
notFor:
  - need: a measurable percentage
    use: Progress
  - need: a ring with the value in the middle
    use: CircularProgress
  - need: a placeholder that holds the page layout while content loads
    use: Skeleton
related: [Skeleton, CircularProgress, Progress]
---

## Use it when

- A control is busy: a `Button` that is saving, an `InputGroup` that is validating, a `Badge` that says "Generating".
- A small region is waiting, and the wait is short and cannot be measured.
- An `Empty` state stands in for a running operation, with the spinner inside `EmptyMedia`.

## Do

- Inside a `Button`, a `Badge` or an `InputGroupAddon`, give it `data-icon="inline-start"` or `data-icon="inline-end"` so the control trims its padding on that side.
- Disable the control while it spins with `isDisabled`, and make the label a verb: "Saving…".
- Resize with `size-*` (`size-3`, `size-6`); colour it with a semantic text token or a Tecton step, on the spinner itself or on the parent it inherits from, since the stroke is `currentColor` — never a stock Tailwind colour.
- `Spinner` already carries `role="status"` and `aria-label="Loading"`; do not wrap it in a second live region.

## Don't

### HIGH A spinner in a button without data-icon

Wrong:

```tsx
<Button isDisabled size="sm">
  <Spinner />
  Saving…
</Button>
```

Correct:

```tsx
<Button isDisabled size="sm">
  <Spinner data-icon="inline-start" />
  Saving…
</Button>
```

The button trims its leading padding only through `has-data-[icon=inline-start]:pl-1.5`, so without the attribute the spinner sits in full text padding and the button jumps in width the moment it appears.

### HIGH A hand-rolled spinner div with borders

Wrong:

```tsx
<div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
```

Correct:

```tsx
<Spinner />
```

`gray-300` and `blue-600` are not Tecton steps, so the reset palette gives the ring no colour at all, and the bare `div` has neither `role="status"` nor an accessible name.

### MEDIUM Colouring the spinner with a stock class

Wrong:

```tsx
<Spinner className="size-5 text-gray-500" />
```

Correct:

```tsx
<Spinner className="size-5 text-muted-foreground" />
```

`gray-500` is not a Tecton step, so the class emits no CSS and the spinner keeps whatever colour it inherits — it looks right only where the parent already happens to be muted.
