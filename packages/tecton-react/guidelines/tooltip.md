---
component: Tooltip
module: "@tecton/react/components/tooltip"
family: overlays
exports: [Tooltip, TooltipTrigger, TooltipContent, TooltipProvider]
notFor:
  - need: content with a link, a button or a field inside it
    use: Popover
  - need: a preview of what is behind a link
    use: HoverCard
  - need: a confirmation the user has to answer
    use: AlertDialog
related: [HoverCard, Popover]
---

## Use it when

- A control needs a few words of explanation: what an icon button does, why one is disabled.
- The text is a description, never the only place a fact appears.

## Do

- Compose `Tooltip` (the root) > `TooltipTrigger render={<Button />}` + `TooltipContent`; position with `side` / `align` / `sideOffset` on `TooltipContent`.
- Wrap the app or the toolbar once in `TooltipProvider`: it sets the open delay (Tecton's is `0`) and lets adjacent tooltips open instantly; `delay` / `closeDelay` on one `TooltipTrigger` override it.
- Give an icon-only trigger its own `aria-label`; the tooltip describes, it does not name.
- To explain a disabled control, pass `focusableWhenDisabled` to the `Button` so hover and focus still reach the trigger; a `Kbd` inside gets its own spacing (`Save changes <Kbd>S</Kbd>`).

## Don't

### CRITICAL An icon button named only by its tooltip

Wrong:

```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />}><SaveIcon /></TooltipTrigger>
  <TooltipContent>Save changes</TooltipContent>
</Tooltip>
```

Correct:

```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Save changes" />}>
    <SaveIcon />
  </TooltipTrigger>
  <TooltipContent>Save changes</TooltipContent>
</Tooltip>
```

The tooltip text exists only while it is open, so the button's accessible name stays empty and the control is unusable with a screen reader.

### CRITICAL Interactive content inside a tooltip

Wrong:

```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="outline" />}>Licence</TooltipTrigger>
  <TooltipContent><Link href="/licences/pl-045">Open licence PL-045</Link></TooltipContent>
</Tooltip>
```

Correct:

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Licence</PopoverTrigger>
  <PopoverContent><Link href="/licences/pl-045">Open licence PL-045</Link></PopoverContent>
</Popover>
```

The tooltip closes as soon as the pointer or focus leaves the trigger and its contents sit inside `role="tooltip"`, so the link can never be tabbed to and is never announced as a link.

### HIGH A trigger wrapping the button and the overlay

Wrong:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><PlusIcon /></Button>
  <Tooltip placement="bottom">Zoom in</Tooltip>
</TooltipTrigger>
```

Correct:

```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Zoom in" />}>
    <PlusIcon />
  </TooltipTrigger>
  <TooltipContent side="bottom">Zoom in</TooltipContent>
</Tooltip>
```

`TooltipTrigger` renders its own `button`, so the `Button` child is a button inside a button, and `Tooltip` is the state root: outside it the trigger throws and nothing renders the popup.
