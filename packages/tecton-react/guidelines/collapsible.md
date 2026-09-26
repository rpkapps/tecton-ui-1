---
component: Collapsible
module: "@tecton/react/components/collapsible"
family: layout
exports: [Collapsible, CollapsibleTrigger, CollapsibleContent]
notFor:
  - need: several stacked sections with one open at a time
    use: Accordion
  - need: a panel that slides in over the page and is dismissed
    use: Sheet
  - need: short content anchored to the control that opened it
    use: Popover
related: [Accordion, Sheet, Popover]
---

## Use it when

- One region shows more detail on demand: advanced settings, a row's sub-fields, a long log.
- The control that toggles it is already on the page and stays where it is.
- Nothing else collapses with it — a second collapsible next to the first is an `Accordion`.

## Do

- Control it with `open` and `onOpenChange` on `Collapsible`, or leave it uncontrolled with `defaultOpen`.
- Style the trigger with `CollapsibleTrigger render={<Button variant="ghost" />}`; on its own it is an unstyled `button`.
- Keep the revealed markup inside `CollapsibleContent`: it is the panel the trigger's `aria-expanded` and `aria-controls` refer to. `Collapsible` itself is one unstyled `div`, so its `className` is yours for the layout.

## Don't

### CRITICAL React Aria disclosure props

Wrong:

```tsx
<Collapsible isExpanded={showDetail} onExpandedChange={setShowDetail}>
  <CollapsibleTrigger render={<Button variant="ghost" />}>Details</CollapsibleTrigger>
  <CollapsibleContent>{detail}</CollapsibleContent>
</Collapsible>
```

Correct:

```tsx
<Collapsible open={showDetail} onOpenChange={setShowDetail}>
  <CollapsibleTrigger render={<Button variant="ghost" />}>Details</CollapsibleTrigger>
  <CollapsibleContent>{detail}</CollapsibleContent>
</Collapsible>
```

`isExpanded` and `onExpandedChange` are not props of `Collapsible`, so the region stays uncontrolled, `showDetail` never changes and anything keyed off it — a chevron, a count, a Save button — never updates.

### HIGH Rendering the region conditionally instead of in CollapsibleContent

Wrong:

```tsx
<Collapsible open={showDetail} onOpenChange={setShowDetail}>
  <CollapsibleTrigger render={<Button variant="outline" />}>Details</CollapsibleTrigger>
  {showDetail ? <div className="rounded-md border p-4">{detail}</div> : null}
</Collapsible>
```

Correct:

```tsx
<Collapsible open={showDetail} onOpenChange={setShowDetail}>
  <CollapsibleTrigger render={<Button variant="outline" />}>Details</CollapsibleTrigger>
  <CollapsibleContent><div className="rounded-md border p-4">{detail}</div></CollapsibleContent>
</Collapsible>
```

The trigger's `aria-controls` points at `CollapsibleContent`, so a hand-rolled conditional leaves it pointing at an element that is not in the document.

### MEDIUM A plain Button toggling the state

Wrong:

```tsx
<Collapsible open={showDetail} onOpenChange={setShowDetail}>
  <Button variant="ghost" onClick={() => setShowDetail(!showDetail)}>Details</Button>
  <CollapsibleContent>{detail}</CollapsibleContent>
</Collapsible>
```

Correct:

```tsx
<Collapsible open={showDetail} onOpenChange={setShowDetail}>
  <CollapsibleTrigger render={<Button variant="ghost" />}>Details</CollapsibleTrigger>
  <CollapsibleContent>{detail}</CollapsibleContent>
</Collapsible>
```

Only `CollapsibleTrigger` carries `aria-expanded` and `aria-controls`, so a plain `Button` opens the region but announces no expanded state.
