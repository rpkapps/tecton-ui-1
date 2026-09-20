---
component: ContextMenu
module: "@tecton/react/components/context-menu"
family: actions
exports: [ContextMenu, ContextMenuTrigger, ContextMenuItem, ContextMenuLabel, ContextMenuGroup, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent]
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
- The gesture should be the platform's own: right click, Control-click, long press, Shift+F10.

## Do

- Wrap the target in React Aria's `Pressable` and give the wrapped element `role="button"`.
- Give `ContextMenuTrigger` exactly two children: the `Pressable` target and the `ContextMenu`.
- Run actions from `onAction` on `ContextMenuItem`, or `onAction(key)` on `ContextMenu` with an `id` per item.
- Build toggles and exclusive choices with `selectionMode` and `selectedKeys` on `ContextMenuGroup`.
- Mark the dangerous entry with `variant="destructive"`; nest with `ContextMenuSub`, `ContextMenuSubTrigger` and `ContextMenuSubContent`.

## Don't

### CRITICAL A bare element as the context menu target

Wrong:

```tsx
<ContextMenuTrigger>
  <div className="rounded-xl border border-dashed p-6">Right click here</div>
  <ContextMenu><ContextMenuItem onAction={reload}>Reload</ContextMenuItem></ContextMenu>
</ContextMenuTrigger>
```

Correct:

```tsx
<ContextMenuTrigger>
  <Pressable>
    <div role="button" className="rounded-xl border border-dashed p-6">Right click here</div>
  </Pressable>
  <ContextMenu><ContextMenuItem onAction={reload}>Reload</ContextMenuItem></ContextMenu>
</ContextMenuTrigger>
```

React Aria hands the trigger's interaction props down through a press responder that only `Pressable` consumes, so a plain element receives nothing and right click falls through to the browser's own menu.

### HIGH The Radix onSelect prop instead of onAction

Wrong:

```tsx
<ContextMenuItem onSelect={() => reload()}>Reload</ContextMenuItem>
```

Correct:

```tsx
<ContextMenuItem onAction={() => reload()}>Reload</ContextMenuItem>
```

`onSelect` is not part of React Aria's `MenuItemProps`, so it is dropped and the entry renders, highlights and closes the menu while running nothing.

### MEDIUM A hand-rolled onContextMenu handler and popover

Wrong:

```tsx
<div role="button" onContextMenu={(event) => { event.preventDefault(); setOpen(true) }}>
  Right click here
</div>
```

Correct:

```tsx
<ContextMenuTrigger>
  <Pressable>
    <div role="button">Right click here</div>
  </Pressable>
  <ContextMenu><ContextMenuItem onAction={reload}>Reload</ContextMenuItem></ContextMenu>
</ContextMenuTrigger>
```

`ContextMenuTrigger` adds what the raw event does not: long press for touch, positioning the popover at the pointer, and closing the menu when the next right click lands outside it.
