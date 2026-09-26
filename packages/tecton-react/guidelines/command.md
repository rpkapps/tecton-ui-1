---
component: Command
module: "@tecton/react/components/command"
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
- Put `CommandEmpty` inside `CommandList`: it shows only when the filter matches nothing.
- Give an item whose children are JSX a `value` (and `keywords` for synonyms), so the filter matches the words, not the markup.
- Group with `CommandGroup heading="…"`, divide with `CommandSeparator`, hint keys with `CommandShortcut` — a label only, since Tecton binds no keys.
- Open the palette with `CommandDialog` and its `open` / `onOpenChange` props, wrapping a `Command`.

## Don't

### CRITICAL The React Aria onAction prop instead of onSelect

Wrong:

```tsx
<CommandItem onAction={() => router.navigate({ to: "/wells" })}>Go to wells</CommandItem>
```

Correct:

```tsx
<CommandItem onSelect={() => router.navigate({ to: "/wells" })}>Go to wells</CommandItem>
```

`CommandItem` is a cmdk item whose activation handler is `onSelect`; `onAction` is not in its props, so pressing Enter or clicking the row does nothing at all.

### HIGH A React Aria textValue on a JSX item

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

### MEDIUM An empty search that renders nothing

Wrong:

```tsx
<Command>
  <CommandInput placeholder="Type a command or search…" />
  <CommandList>{items}</CommandList>
</Command>
```

Correct:

```tsx
<Command>
  <CommandInput placeholder="Type a command or search…" />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    {items}
  </CommandList>
</Command>
```

With no `CommandEmpty` a search that matches nothing leaves a blank panel under the input, which reads as the palette having broken.
