---
component: Tooltip
module: "@tecton/react/components/tooltip"
family: overlays
exports: [Tooltip, TooltipTrigger]
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

- Give `TooltipTrigger` exactly two children, in this order: the trigger element, then the `Tooltip`.
- Give an icon-only trigger its own `aria-label`; the tooltip is `aria-describedby`, not the name.
- Set `delay` and `closeDelay` on `TooltipTrigger` (Tecton opens at `delay={0}`) and `placement` on `Tooltip`; a `Kbd` inside gets its own spacing, as in `Save changes <Kbd>S</Kbd>`.
- To explain a disabled control, wrap it: `<span className="inline-block w-fit"><Button isDisabled>Export</Button></span>`.
- A trigger that is not a control (a `Badge`, a term) needs focus and a role, or React Aria's `Focusable` warns and keyboard users never open it: `<Badge render={(props) => <span {...props} tabIndex={0} role="img" aria-label="TVD" />}>TVD</Badge>`.

## Don't

### CRITICAL An icon button named only by its tooltip

Wrong:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm"><SaveIcon /></Button>
  <Tooltip>Save changes</Tooltip>
</TooltipTrigger>
```

Correct:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="Save changes"><SaveIcon /></Button>
  <Tooltip>Save changes</Tooltip>
</TooltipTrigger>
```

React Aria points `aria-describedby` at the tooltip and only while it is open, so the button's accessible name stays empty and the control is unusable with a screen reader.

### CRITICAL Interactive content inside a tooltip

Wrong:

```tsx
<TooltipTrigger>
  <Button variant="outline">Licence</Button>
  <Tooltip>
    <Link href="/licences/pl-045">Open licence PL-045</Link>
  </Tooltip>
</TooltipTrigger>
```

Correct:

```tsx
<PopoverTrigger>
  <Button variant="outline">Licence</Button>
  <Popover>
    <Link href="/licences/pl-045">Open licence PL-045</Link>
  </Popover>
</PopoverTrigger>
```

React Aria closes the tooltip as soon as focus leaves the trigger, and its contents sit inside `role="tooltip"`, so the link can never be tabbed to and is never announced as a link.

### HIGH More than two children in a TooltipTrigger

Wrong:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><PlusIcon /></Button>
  <Button variant="ghost" size="icon-sm" aria-label="Zoom out"><MinusIcon /></Button>
  <Tooltip>Zoom</Tooltip>
</TooltipTrigger>
```

Correct:

```tsx
<TooltipTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><PlusIcon /></Button>
  <Tooltip>Zoom in</Tooltip>
</TooltipTrigger>
```

Tecton's `TooltipTrigger` destructures its children into `[trigger, tooltip]`, so the second button is rendered where the tooltip belongs and the real `Tooltip` is thrown away.
