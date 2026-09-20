---
component: Card
module: "@tecton/react/components/card"
family: surfaces
exports: [Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter]
notFor:
  - need: a titled tool surface whose body scrolls and whose footer stays put
    use: Panel
  - need: one row in a list of records
    use: Item
  - need: the title block at the top of a page
    use: PageHeader
  - need: rows with sorting, paging and selection
    use: TanStack Table
related: [Panel, Item, PageHeader]
---

## Use it when

- A self-contained piece of content stands on its own: a summary, a sign-in form, a media tile.
- The card is as tall as its content — it does not scroll and it is not part of the app chrome.
- It sits in a grid or a stack of siblings that should all look the same.

## Do

- Compose it: `CardHeader` with `CardTitle`, `CardDescription` and `CardAction`, then `CardContent`, then `CardFooter`.
- Set density with `size="sm"`, or with the documented `[--card-spacing:--spacing(4)]` on `Card` when a design needs another step.
- Divide sections with a bare `border-b` on `CardHeader` or `border-t` on `CardFooter`; the card adds the matching padding itself.
- Bleed content to the edges with `-mx-(--card-spacing)`, so it still lines up with the card inset.
- Keep `className` to placement and width (`w-full max-w-sm`): the card owns the surface, ring, radius and padding.

## Don't

### HIGH Re-declaring the card's own padding and shape

Wrong:

```tsx
<Card className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <CardTitle>Reserves</CardTitle>
</Card>
```

Correct:

```tsx
<Card size="sm" className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Reserves</CardTitle>
  </CardHeader>
</Card>
```

`Card` pads itself through `--card-spacing` and its parts read the same variable, so `p-6` double-pads the header, while `rounded-xl` and `border-gray-200` override the radius and colour the variant already owns; `border-gray-200` is also stock Tailwind, which Tecton resets to nothing, so it emits no CSS besides.

### MEDIUM A hand-drawn rule between header and content

Wrong:

```tsx
<Card>
  <CardHeader className="border-b border-gray-200 pb-4">
    <CardTitle>Alternative B</CardTitle>
  </CardHeader>
  <CardContent>4 wells, 1 template</CardContent>
</Card>
```

Correct:

```tsx
<Card>
  <CardHeader className="border-b">
    <CardTitle>Alternative B</CardTitle>
  </CardHeader>
  <CardContent>4 wells, 1 template</CardContent>
</Card>
```

`CardHeader` already carries `[.border-b]:pb-(--card-spacing)`, so the bare `border-b` picks up the themed border colour and the right padding, while `border-gray-200` emits no CSS and `pb-4` fights the spacing variable.
