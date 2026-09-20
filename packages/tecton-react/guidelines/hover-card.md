---
component: HoverCard
module: "@tecton/react/components/hover-card"
family: overlays
exports: [HoverCard, HoverCardTrigger]
notFor:
  - need: a short label on a control
    use: Tooltip
  - need: content the user opens deliberately and works in
    use: Popover
  - need: a row of a list with media, title and actions
    use: Item
related: [Tooltip, Popover]
---

## Use it when

- A link or a name in running text has more behind it: a person, a well, a document.
- The extra detail is a courtesy — the user can reach the same content by following the link.
- It is a preview, not a control panel: nothing inside it is the only way to do something.

## Do

- Wrap the trigger and the `HoverCard` in one `HoverCardTrigger` (React Aria's `PreviewTrigger`), which opens on hover, focus and long press.
- Tune the timing with `delay` and `closeDelay` on `HoverCardTrigger` — the defaults are 600 ms and 200 ms.
- Position with `placement` on `HoverCard`, and set width with `className` (`w-72`) only.
- Make the trigger something the keyboard can reach — a `Button variant="link"` or a `Link` — so focus can open the card.

## Don't

### HIGH Labelling an icon button with a hover card

Wrong:

```tsx
<HoverCardTrigger>
  <Button variant="ghost" size="icon-sm">
    <InfoIcon />
  </Button>
  <HoverCard>Reservoir pressure, measured 2025-03-14.</HoverCard>
</HoverCardTrigger>
```

Correct:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="About this reading">
    <InfoIcon />
  </Button>
  <Tooltip>Reservoir pressure, measured 2025-03-14.</Tooltip>
</TooltipTrigger>
```

`PreviewTrigger` marks the button `aria-haspopup="dialog"` and only points `aria-describedby` at the card while it is open, so the icon button still reaches a screen reader with no accessible name.

### MEDIUM Radix openDelay on the card

Wrong:

```tsx
<HoverCardTrigger openDelay={100} closeDelay={200}>
  <Button variant="link">@peduarte</Button>
  <HoverCard>Joined December 2021.</HoverCard>
</HoverCardTrigger>
```

Correct:

```tsx
<HoverCardTrigger delay={100} closeDelay={200}>
  <Button variant="link">@peduarte</Button>
  <HoverCard>Joined December 2021.</HoverCard>
</HoverCardTrigger>
```

React Aria's `PreviewTrigger` names the open delay `delay`; `openDelay` is dropped and the card keeps waiting the default 600 ms, which reads as the hover card being broken.
