---
component: AspectRatio
module: "@tecton/react/components/aspect-ratio"
family: layout
exports: [AspectRatio]
notFor:
  - need: a placeholder shape while the content loads
    use: Skeleton
  - need: a round picture of a person or an account
    use: Avatar
  - need: a full-bleed map, schematic or 3D view
    use: Canvas
related: [Avatar, Skeleton, Carousel]
---

## Use it when

- Media has to hold a shape before it loads, so the surrounding layout never jumps: a thumbnail grid, a card cover, a video embed.
- The box should follow its available width rather than a height you picked.
- The ratio is the design decision — 16:9, 1:1, 9:16 — not an approximate height.

## Do

- Pass the ratio as a number: `ratio={16 / 9}`, `ratio={1}`, `ratio={9 / 16}`. It is required and goes straight into `style={{ "--ratio": ratio }}`.
- Make the child fill the box, with `absolute inset-0 size-full object-cover` on an `img`, or `fill` on a framework `Image`; the component only sets `relative`.
- Control the width from outside (`className="w-full max-w-sm"`) and let the height follow.
- Put the radius and the placeholder tone on the `AspectRatio` itself (`rounded-lg bg-muted`) so they show while the media is still loading.

## Don't

### HIGH A child left at its intrinsic size

Wrong:

```tsx
<AspectRatio ratio={16 / 9} className="w-full max-w-sm rounded-lg bg-muted">
  <img src={survey.thumbnail} alt="Survey outline" className="rounded-lg" />
</AspectRatio>
```

Correct:

```tsx
<AspectRatio ratio={16 / 9} className="w-full max-w-sm rounded-lg bg-muted">
  <img
    src={survey.thumbnail}
    alt="Survey outline"
    className="absolute inset-0 size-full rounded-lg object-cover"
  />
</AspectRatio>
```

`AspectRatio` is one `div` with `relative aspect-(--ratio)` and no rules for its children, so the image keeps its own dimensions: it overflows or floats inside the box whose shape it was meant to define.

### MEDIUM A fixed height beside the ratio

Wrong:

```tsx
<AspectRatio ratio={4 / 3} className="h-48 w-full rounded-lg bg-muted">
  <img src={field.map} alt="Field map" className="absolute inset-0 size-full object-cover" />
</AspectRatio>
```

Correct:

```tsx
<AspectRatio ratio={4 / 3} className="w-full rounded-lg bg-muted">
  <img src={field.map} alt="Field map" className="absolute inset-0 size-full object-cover" />
</AspectRatio>
```

`aspect-ratio` only computes the dimension that is not already definite, so on a full-width block `h-48` wins and the ratio is dead weight — a box that needs a fixed height does not need this component at all.

### MEDIUM An AspectRatio with no ratio

Wrong:

```tsx
<AspectRatio className="w-full rounded-lg bg-muted">
  <img src={well.schematic} alt="Well schematic" className="absolute inset-0 size-full object-cover" />
</AspectRatio>
```

Correct:

```tsx
<AspectRatio ratio={1} className="w-full rounded-lg bg-muted">
  <img src={well.schematic} alt="Well schematic" className="absolute inset-0 size-full object-cover" />
</AspectRatio>
```

Unlike the Radix component this one has no default: `ratio` is required, React drops the `undefined` custom property, and `aspect-ratio: var(--ratio)` then resolves to nothing, so the box collapses around an absolutely positioned child and disappears.
