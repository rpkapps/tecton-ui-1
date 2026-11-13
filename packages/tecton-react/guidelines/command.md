---
component: Command
module: "@tecton/react/command"
family: selection
exports: [Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut]
notFor:
  - need: picking a value for a form field
    use: Combobox
  - need: a menu of actions opened from a button
    use: DropdownMenu
  - need: a menu opened by right click
    use: ContextMenu
related: [Combobox, DropdownMenu]
---

## Use it when

- The user should reach commands and records by typing, from anywhere in the application.
- The surface is a palette, usually inside `CommandDialog`, rather than a field in a form.
- The list mixes groups of actions and wants keyboard-shortcut hints beside them.

## Do

- Run the action from `onSelect` on `CommandItem`; it fires on click and on Enter.
- Put `CommandEmpty` inside `CommandList`: it shows only when the filter matches nothing; without it a failed search leaves a blank panel that reads as broken.
- Give an item whose children are JSX a `value` (and `keywords` for synonyms), so the filter matches the words, not the markup.
- Group with `CommandGroup heading="…"`, divide with `CommandSeparator`, hint keys with `CommandShortcut` — a label only, since Tecton binds no keys.
- Open the palette with `CommandDialog` and its `open` / `onOpenChange` props; it always needs a `Command` root inside it.

## Don't

### CRITICAL CommandDialog without a Command root

Wrong:

```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search…" />
  <CommandList>{items}</CommandList>
</CommandDialog>
```

Correct:

```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <Command>
    <CommandInput placeholder="Search…" />
    <CommandList>{items}</CommandList>
  </Command>
</CommandDialog>
```

`CommandDialog` is only the dialog surface and adds no `Command` of its own. `CommandInput`, `CommandList` and `CommandItem` read the search state from `Command`, so without it the palette throws as soon as it opens.

### CRITICAL The onAction prop instead of onSelect

Wrong:

```tsx
<CommandItem onAction={() => router.navigate({ to: "/wells" })}>Go to wells</CommandItem>
```

Correct:

```tsx
<CommandItem onSelect={() => router.navigate({ to: "/wells" })}>Go to wells</CommandItem>
```

`CommandItem` is a cmdk item whose activation handler is `onSelect`; `onAction` is not in its props, so pressing Enter or clicking the row does nothing at all.

### HIGH A textValue instead of value and keywords

Wrong:

```tsx
<CommandItem textValue="Billing" onSelect={openBilling}>
  <CreditCardIcon />
  <span>Billing</span>
</CommandItem>
```

Correct:

```tsx
<CommandItem value="billing" keywords={["invoice", "payment"]} onSelect={openBilling}>
  <CreditCardIcon />
  <span>Billing</span>
</CommandItem>
```

The filter matches an item's `value` and `keywords`; `textValue` is not a prop, so the item is matched on whatever text cmdk reads from its markup and a search for "invoice" finds nothing.
