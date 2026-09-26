---
component: ContextMenu
module: "@tecton/react/components/context-menu"
family: actions
exports: [ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuPortal, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuLabel, ContextMenuGroup, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent]
notFor:
  - need: a menu opened from a visible button
    use: DropdownMenu
  - need: actions that must be discoverable on the surface
    use: ButtonGroup
  - need: a bar of actions for the current selection
    use: ActionBar
related: [DropdownMenu, ActionBar]
---

## Use it when

- A row, card or canvas object has secondary actions that would clutter the surface.
- Those actions are reachable another way too; the context menu is an accelerator, not the only route.
- The gesture should be the platform's own: right click, Control-click, long press.

## Do

- Compose `ContextMenu` (the root) > `ContextMenuTrigger` + `ContextMenuContent`; the trigger is the `div` area that listens for the gesture, so put the target's content (or `render` its element) there.
- Run actions from `onClick` on `ContextMenuItem`.
- Build toggles with `ContextMenuCheckboxItem` (`checked` / `onCheckedChange`) and exclusive choices with `ContextMenuRadioGroup` (`value` / `onValueChange`) + `ContextMenuRadioItem`.
- Mark the dangerous entry with `variant="destructive"`; nest with `ContextMenuSub`, `ContextMenuSubTrigger` and `ContextMenuSubContent`.

## Don't

### HIGH The React Aria trigger shape

Wrong:

```tsx
<ContextMenuTrigger>
  <div className="rounded-xl border border-dashed p-6">Right click here</div>
  <ContextMenu><ContextMenuItem onAction={reload}>Reload</ContextMenuItem></ContextMenu>
</ContextMenuTrigger>
```

Correct:

```tsx
<ContextMenu>
  <ContextMenuTrigger className="rounded-xl border border-dashed p-6">Right click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={reload}>Reload</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

`ContextMenu` is the state root and draws nothing: a trigger outside it has no menu to open, the items render without a `ContextMenuContent` popup, and `onAction` is not an item prop.

### HIGH The Radix onSelect prop instead of onClick

Wrong:

```tsx
<ContextMenuItem onSelect={() => reload()}>Reload</ContextMenuItem>
```

Correct:

```tsx
<ContextMenuItem onClick={() => reload()}>Reload</ContextMenuItem>
```

`onSelect` is the DOM text-selection event, not the item's activation, so the entry renders, highlights and closes the menu while running nothing.

### MEDIUM A hand-rolled onContextMenu handler and popover

Wrong:

```tsx
<div onContextMenu={(event) => { event.preventDefault(); setOpen(true) }}>
  Right click here
</div>
```

Correct:

```tsx
<ContextMenu>
  <ContextMenuTrigger>Right click here</ContextMenuTrigger>
  <ContextMenuContent><ContextMenuItem onClick={reload}>Reload</ContextMenuItem></ContextMenuContent>
</ContextMenu>
```

`ContextMenuTrigger` adds what the raw event does not: long press for touch, positioning the menu at the pointer, and closing it when the next right click lands outside.
