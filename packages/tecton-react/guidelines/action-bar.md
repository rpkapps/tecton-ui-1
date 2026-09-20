---
component: ActionBar
module: "@tecton/react/tecton/action-bar"
family: actions
exports: [ActionBar, ActionBarSelection, ActionBarMessage, ActionBarActions, actionBarVariants]
notFor:
  - need: a permanent row of page actions
    use: ButtonGroup
  - need: a transient confirmation that carries no actions
    use: toast
  - need: a list of actions behind a single button
    use: DropdownMenu
related: [ButtonGroup, DropdownMenu]
---

## Use it when

- Rows are selected in a table or list and the actions apply to that selection.
- A form has unsaved changes and needs Save or Discard without moving the page.
- The bar should exist only while there is something to act on, then disappear.

## Do

- Control it with `isOpen` and dismiss with `onDismiss`; the bar owns Escape and the enter transition.
- Give it an `aria-label`; it renders a `div` with `role="region"`.
- Summarise with `ActionBarSelection` (`count`, `total`, `label`, `onClear`) or with `ActionBarMessage`.
- Put the actions in `ActionBarActions`, wrapping collapsible ones in `OverflowItem` and leaving the primary action bare.
- Choose `placement="toolbar"` to fill a table's toolbar row, `"floating"` for a sticky card inside the scroll container.

## Don't

### HIGH A hand-written selection summary and Clear button

Wrong:

```tsx
<ActionBar isOpen={selected.size > 0} aria-label="Selected wells">
  <span>{selected.size} of {wells.length} selected</span>
  <Button variant="ghost" size="sm" onPress={clear}>Clear</Button>
</ActionBar>
```

Correct:

```tsx
<ActionBar isOpen={selected.size > 0} onDismiss={clear} aria-label="Selected wells">
  <ActionBarSelection count={selected.size} total={wells.length} label="wells" onClear={clear} />
</ActionBar>
```

`ActionBarSelection` carries the visually hidden `aria-live` announcement and the container queries that compact the text to "12 selected" and then to a count badge; a plain span announces nothing and overflows as the bar narrows.

### HIGH Bare buttons inside the ActionBarActions toolbar

Wrong:

```tsx
<ActionBarActions aria-label="Selection actions">
  <Button variant="outline" size="sm"><TagIcon data-icon="inline-start" />Add tag</Button>
  <Button size="sm" onPress={assign}>Assign</Button>
</ActionBarActions>
```

Correct:

```tsx
<ActionBarActions aria-label="Selection actions">
  <OverflowItem id="tag" label="Add tag" icon={<TagIcon />} onAction={addTag}>
    <Button variant="outline" size="sm"><TagIcon data-icon="inline-start" /><OverflowLabel>Add tag</OverflowLabel></Button>
  </OverflowItem>
  <Button size="sm" onPress={assign}>Assign</Button>
</ActionBarActions>
```

`ActionBarActions` is an overflow `Toolbar`, and only an `OverflowItem` can be measured and moved into the More menu, so unwrapped actions never collapse and the row clips instead.

### MEDIUM A floating bar sized with w-fit

Wrong:

```tsx
<ActionBar placement="floating" className="mx-auto w-fit" aria-label="Selected documents">
  <ActionBarSelection count={selected.size} onClear={clear} />
</ActionBar>
```

Correct:

```tsx
<ActionBar placement="floating" className="mx-auto max-w-md" aria-label="Selected documents">
  <ActionBarSelection count={selected.size} onClear={clear} />
</ActionBar>
```

The bar is its own `@container`, so a fit-content inline size resolves from its padding alone: the toolbar measures no room and collapses every action into the More menu.
