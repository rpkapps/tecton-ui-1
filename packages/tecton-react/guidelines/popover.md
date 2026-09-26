---
component: Popover
module: "@tecton/react/components/popover"
family: overlays
exports: [Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription]
notFor:
  - need: a short label on a control
    use: Tooltip
  - need: a preview that appears when the pointer rests on a link
    use: HoverCard
  - need: a decision that must block the rest of the page
    use: Dialog
related: [HoverCard, Tooltip, Dialog]
---

## Use it when

- A few controls belong to one trigger and should appear next to it: dimensions, a colour, a filter.
- The user opens it deliberately by pressing, and the page behind it stays live.
- The content is interactive — inputs, buttons, a small form — so a `Tooltip` is out.

## Do

- Compose `Popover` (the root) > `PopoverTrigger render={<Button variant="outline" />}` + `PopoverContent`; control it with `open` / `onOpenChange` on `Popover`.
- Position with `side` (`"top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"`) and `align` (`"start" | "center" | "end"`) on `PopoverContent`, nudged with `sideOffset` / `alignOffset`.
- Structure the top with `PopoverHeader`, `PopoverTitle` and `PopoverDescription`; the content is already a `flex flex-col gap-4`.
- Use `className` on `PopoverContent` for width only (`w-80`): it owns its padding, radius, shadow and surface.

## Don't

### HIGH placement and offset instead of side and sideOffset

Wrong:

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Dimensions</PopoverTrigger>
  <PopoverContent placement="top start" offset={8}>
    <PopoverTitle>Dimensions</PopoverTitle>
  </PopoverContent>
</Popover>
```

Correct:

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Dimensions</PopoverTrigger>
  <PopoverContent side="top" align="start" sideOffset={8}>
    <PopoverTitle>Dimensions</PopoverTitle>
  </PopoverContent>
</Popover>
```

`placement` and `offset` are not positioning props here: they land on the popup element as stray attributes and the popover keeps the default `side="bottom"`.

### HIGH Content outside the Popover root

Wrong:

```tsx
<PopoverTrigger>
  <Button variant="outline">Filter</Button>
  <Popover>
    <PopoverTitle>Filter wells</PopoverTitle>
  </Popover>
</PopoverTrigger>
```

Correct:

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Filter</PopoverTrigger>
  <PopoverContent>
    <PopoverTitle>Filter wells</PopoverTitle>
  </PopoverContent>
</Popover>
```

`Popover` is the state root and draws nothing; only `PopoverContent` renders the floating panel, and a trigger outside the root has no state to open.

### MEDIUM Repainting the popover surface with className

Wrong:

```tsx
<PopoverContent className="w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
  <PopoverTitle>Filter wells</PopoverTitle>
</PopoverContent>
```

Correct:

```tsx
<PopoverContent className="w-80"><PopoverTitle>Filter wells</PopoverTitle></PopoverContent>
```

Tecton resets Tailwind's stock palette, so `border-gray-200` emits no CSS at all, and the padding and radius duplicate what the component already owns.
