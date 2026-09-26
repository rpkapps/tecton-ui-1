---
component: ButtonGroup
module: "@tecton/react/components/button-group"
family: actions
exports: [ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants]
notFor:
  - need: options that hold an on or off state
    use: ToggleGroup
  - need: sections of content the user moves between
    use: Tabs
  - need: a long list of actions behind one trigger
    use: DropdownMenu
related: [Button, ToggleGroup, DropdownMenu]
---

## Use it when

- Two or more controls belong to one object: a split button, a toolbar cluster, an input with a button.
- The controls should read as a single joined shape rather than separate buttons.
- Text, an `Input`, an `InputGroup` or a `SelectTrigger` has to sit flush against a button.

## Do

- Wrap the children and let the group join them; use `orientation="vertical"` for a stacked cluster.
- Give the group an `aria-label` or `aria-labelledby`; it renders a bare `div` with `role="group"`.
- Put a `ButtonGroupSeparator` between filled buttons; `variant="outline"` buttons already carry a border.
- Use `ButtonGroupText` for static text, with its `render` prop when the text must be a `Label`.
- Nest `ButtonGroup`s to separate clusters; the outer group adds the gap itself.

## Don't

### HIGH Joining the buttons by hand with className

Wrong:

```tsx
<div className="flex">
  <Button variant="outline" className="rounded-r-none">Archive</Button>
  <Button variant="outline" className="-ml-px rounded-l-none">Report</Button>
</div>
```

Correct:

```tsx
<ButtonGroup aria-label="Message actions">
  <Button variant="outline">Archive</Button>
  <Button variant="outline">Report</Button>
</ButtonGroup>
```

`ButtonGroup` already strips the inner corners and overlaps the borders with logical properties, so hand-written physical corners duplicate the work and flip to the wrong side in RTL.

### HIGH A button group holding a selected state

Wrong:

```tsx
<ButtonGroup aria-label="View">
  <Button variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}>List</Button>
  <Button variant={view === "map" ? "secondary" : "ghost"} onClick={() => setView("map")}>Map</Button>
</ButtonGroup>
```

Correct:

```tsx
<ToggleGroup aria-label="View" value={[view]} onValueChange={([next]) => next && setView(next)}>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="map">Map</ToggleGroupItem>
</ToggleGroup>
```

`ButtonGroup` is a presentational `role="group"`, so a colour swap is the only signal: nothing sets `aria-pressed` and assistive technology cannot tell which view is current.

### MEDIUM Adding gap utilities inside a button group

Wrong:

```tsx
<ButtonGroup className="gap-2" aria-label="Mail actions">
  <Button variant="outline">Archive</Button>
  <Button variant="outline">Snooze</Button>
</ButtonGroup>
```

Correct:

```tsx
<ButtonGroup aria-label="Mail actions">
  <ButtonGroup><Button variant="outline">Archive</Button></ButtonGroup>
  <ButtonGroup><Button variant="outline">Snooze</Button></ButtonGroup>
</ButtonGroup>
```

The corner and negative-margin rules stay active whatever the gap is, so a bare `gap-2` yields separated buttons with flattened inner edges; a nested group is what the variant spaces apart.
