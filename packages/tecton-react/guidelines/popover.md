---
component: Popover
module: "@tecton/react/components/popover"
family: overlays
exports: [Popover, PopoverTrigger, PopoverHeader, PopoverTitle, PopoverDescription]
notFor:
  - need: a short label on a control
    use: Tooltip
  - need: a preview that appears when the pointer rests on a link
    use: HoverCard
  - need: a decision that must block the rest of the page
    use: Dialog
  - need: a form long enough to need its own header and footer
    use: Sheet
related: [HoverCard, Tooltip, Dialog]
---

## Use it when

- A few controls belong to one trigger and should appear next to it: dimensions, a colour, a filter.
- The user opens it deliberately by pressing, and the page behind it stays live.
- The content is interactive — inputs, buttons, a small form — so a `Tooltip` is out.

## Do

- Wrap the trigger `Button` and the `Popover` in one `PopoverTrigger` (it is React Aria's `DialogTrigger`), and control it with `isOpen` / `onOpenChange` there.
- Position with `placement` (`"bottom start"`, `"top"`, `"right end"`) and nudge with `offset` / `crossOffset`.
- Structure the top with `PopoverHeader`, `PopoverTitle` and `PopoverDescription`; the popover is already a `flex flex-col gap-4`.
- Use `className` for width only (`w-80`): the popover owns its padding, radius, shadow and surface.

## Don't

### HIGH Radix side and align props

Wrong:

```tsx
<PopoverTrigger>
  <Button variant="outline">Dimensions</Button>
  <Popover side="top" align="start" sideOffset={8}>
    <PopoverTitle>Dimensions</PopoverTitle>
  </Popover>
</PopoverTrigger>
```

Correct:

```tsx
<PopoverTrigger>
  <Button variant="outline">Dimensions</Button>
  <Popover placement="top start" offset={8}>
    <PopoverTitle>Dimensions</PopoverTitle>
  </Popover>
</PopoverTrigger>
```

React Aria takes one `placement` string; `side`, `align` and `sideOffset` are not part of its positioning contract, so the popover silently keeps the default `placement="bottom"`.

### MEDIUM Repainting the popover surface with className

Wrong:

```tsx
<Popover className="w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
  <PopoverTitle>Filter wells</PopoverTitle>
</Popover>
```

Correct:

```tsx
<Popover className="w-80">
  <PopoverTitle>Filter wells</PopoverTitle>
</Popover>
```

Tecton resets Tailwind's stock palette, so `border-gray-200` emits no CSS at all, and the padding and radius duplicate what the component already owns — `no-restyle` reports both.
