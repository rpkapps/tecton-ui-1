---
component: HoverCard
module: "@tecton/react/components/hover-card"
family: overlays
exports: [HoverCard, HoverCardTrigger, HoverCardContent]
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

- Compose `HoverCard` (the root) > `HoverCardTrigger` + `HoverCardContent`; the trigger renders an `a`, so give it the `href` it previews.
- Tune the timing with `delay` and `closeDelay` on `HoverCardTrigger` — the defaults are 600 ms and 300 ms.
- Position with `side` / `align` on `HoverCardContent`, and set width with `className` (`w-72`) only.
- Keep the trigger reachable by keyboard — a real link — so focus can open the card.

## Don't

### HIGH Labelling an icon button with a hover card

Wrong:

```tsx
<HoverCard>
  <HoverCardTrigger render={<Button variant="ghost" size="icon-sm" />}><InfoIcon /></HoverCardTrigger>
  <HoverCardContent>Reservoir pressure, measured 2025-03-14.</HoverCardContent>
</HoverCard>
```

Correct:

```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="About this reading" />}>
    <InfoIcon />
  </TooltipTrigger>
  <TooltipContent>Reservoir pressure, measured 2025-03-14.</TooltipContent>
</Tooltip>
```

A hover card is a preview of a link's destination, not a name: the icon button still reaches a screen reader with no accessible name, and touch users never see the card.

### MEDIUM openDelay instead of delay on the trigger

Wrong:

```tsx
<HoverCard>
  <HoverCardTrigger href="/people/peduarte" openDelay={100}>@peduarte</HoverCardTrigger>
  <HoverCardContent>Joined December 2021.</HoverCardContent>
</HoverCard>
```

Correct:

```tsx
<HoverCard>
  <HoverCardTrigger href="/people/peduarte" delay={100}>@peduarte</HoverCardTrigger>
  <HoverCardContent>Joined December 2021.</HoverCardContent>
</HoverCard>
```

The open delay is `delay`; `openDelay` is not a prop, so the card keeps waiting the default 600 ms, which reads as the hover card being broken.
