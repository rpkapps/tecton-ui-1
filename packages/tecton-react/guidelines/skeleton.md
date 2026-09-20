---
component: Skeleton
module: "@tecton/react/components/skeleton"
family: progress
exports: [Skeleton]
notFor:
  - need: a measurable percentage
    use: Progress
  - need: a busy indicator inside a button or an input
    use: Spinner
  - need: the state when there is nothing to load
    use: Empty
related: [Spinner, Empty, Progress]
---

## Use it when

- The shape of the content is known before the data arrives: a card, a table, a form, a list of rows.
- The wait is long enough to notice, and the layout must not move when the data lands.
- Several regions load independently and each should keep its place.

## Do

- Give every `Skeleton` a size from the spacing scale: `h-4 w-full`, `size-12 rounded-full`, `aspect-video w-full`.
- Mirror the real layout — the same wrappers, the same gaps, one `Skeleton` per box the content will occupy.
- Vary the widths with fractions (`w-2/3`, `w-3/4`) so a block reads as text.
- `className` is for the box; the pulse and the muted surface belong to the component.

## Don't

### HIGH A skeleton with no height

Wrong:

```tsx
<div className="flex flex-col gap-2">
  <Skeleton className="w-full" />
  <Skeleton className="w-3/4" />
</div>
```

Correct:

```tsx
<div className="flex flex-col gap-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>
```

`Skeleton` is an empty `div` with no intrinsic size, so without `h-*`, an aspect ratio or a child it computes to zero height and nothing appears on the page.

### HIGH Recolouring the placeholder with a stock class

Wrong:

```tsx
<Skeleton className="h-4 w-full bg-gray-200" />
```

Correct:

```tsx
<Skeleton className="h-4 w-full" />
```

`cn` drops the component's `bg-muted` in favour of `bg-gray-200`, which is not a Tecton step and emits no CSS, so the placeholder renders transparent and the region looks empty rather than loading.

### MEDIUM Off-token pixel sizes on a skeleton

Wrong:

```tsx
<Skeleton className="h-[18px] w-[240px]" />
```

Correct:

```tsx
<Skeleton className="h-4 w-60" />
```

Arbitrary values are exactly what `no-arbitrary-values` rejects in `configs.strict`, and a placeholder measured in loose pixels stops matching the line height of the text it stands in for.
