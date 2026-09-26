---
component: DropdownMenu
module: "@tecton/react/components/dropdown-menu"
family: actions
exports: [DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuPortal, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent]
notFor:
  - need: a menu opened by right click on the content
    use: ContextMenu
  - need: choosing a value for a form field
    use: Select
  - need: a searchable palette of commands
    use: Command
related: [ContextMenu, Button, Select]
---

## Use it when

- A button opens a short list of actions: row actions, an account menu, a "more" overflow.
- Some of those entries are toggles or one exclusive choice, shown with check marks.
- The list wants submenus, shortcut hints, or a destructive entry at the end.

## Do

- Compose `DropdownMenu` (the root) > `DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}` + `DropdownMenuContent`.
- Run actions from `onClick` on `DropdownMenuItem`; the menu closes after it.
- Show toggles with `DropdownMenuCheckboxItem` (`checked` / `onCheckedChange`) and one exclusive choice with `DropdownMenuRadioGroup` (`value` / `onValueChange`) holding `DropdownMenuRadioItem value="…"`.
- Title groups with `DropdownMenuLabel` inside a `DropdownMenuGroup`, divide with `DropdownMenuSeparator`, hint keys with `DropdownMenuShortcut` (a label only — Tecton binds no keys).
- Place with `side` / `align` on `DropdownMenuContent` and nest with `DropdownMenuSub`, `DropdownMenuSubTrigger` and `DropdownMenuSubContent`.

## Don't

### HIGH React Aria or Radix item handlers

Wrong:

```tsx
<DropdownMenuItem onAction={() => archive(well.id)}>Archive</DropdownMenuItem>
<DropdownMenuItem onSelect={() => exportLas(well.id)}>Export LAS</DropdownMenuItem>
```

Correct:

```tsx
<DropdownMenuItem onClick={() => archive(well.id)}>Archive</DropdownMenuItem>
<DropdownMenuItem onClick={() => exportLas(well.id)}>Export LAS</DropdownMenuItem>
```

`onAction` is not an item prop and `onSelect` is the DOM text-selection event, so neither runs when the item is chosen: the menu closes and nothing happens.

### HIGH Check marks by hand on a plain item

Wrong:

```tsx
<DropdownMenuItem onClick={() => setShowPanel(!showPanel)}>
  {showPanel ? <CheckIcon /> : null} Panel
</DropdownMenuItem>
```

Correct:

```tsx
<DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
  Panel
</DropdownMenuCheckboxItem>
```

A plain item is `role="menuitem"` with no checked state, so the mark is decoration a screen reader never announces; `DropdownMenuCheckboxItem` is `menuitemcheckbox` with `aria-checked` and draws the indicator in its reserved slot.

### MEDIUM Colouring a destructive item with className

Wrong:

```tsx
<DropdownMenuItem className="text-red-600" onClick={remove}>Delete</DropdownMenuItem>
```

Correct:

```tsx
<DropdownMenuItem variant="destructive" onClick={remove}>Delete</DropdownMenuItem>
```

Tailwind's stock palette is reset, so `text-red-600` emits no CSS, while `variant="destructive"` is what sets the label, the icon and the focus background for the whole row.
