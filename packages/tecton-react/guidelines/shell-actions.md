---
component: ShellActions
module: "@tecton/react/tecton/shell-actions"
family: navigation
exports: [ShellActions, ShellAction, ShellCommandTrigger, ShellDivider, ShellOverflow, ShellUserMenu]
notFor:
  - need: actions that belong to the page rather than to the shell
    use: PageHeaderActions
  - need: a toolbar that folds into a More menu by measured width
    use: Overflow
  - need: switching between applications from the header
    use: AppFinder
related: [AppShell, AppFinder, Overflow]
---

## Use it when

- The cluster at the end of the shell header: search, help, settings, the account menu.
- Those controls belong to the host, so every mounted application shows the same set.
- A narrow header has to fold the low-priority ones into a "More" menu.

## Do

- Put the cluster in `ShellActions` inside `AppShellHeader`; it is `ml-auto` and pins itself to the end.
- Give every `ShellAction` a `label` — it is both the accessible name and the tooltip — and a `shortcut` in the registry's key syntax (`"mod+k"`, `"?"`, `"g w"`) for the key hint.
- Register the palette key with `useShortcut` and open the palette from `ShellCommandTrigger`'s `onPress`.
- Hide an action below a breakpoint (`hidden lg:inline-flex`) and show `ShellOverflow` instead (`lg:hidden`).
- Separate groups with `ShellDivider`; keep `className` to visibility and placement.

## Don't

### CRITICAL An icon Button with a title instead of ShellAction

Wrong:

```tsx
<Button variant="ghost" size="icon-sm" title="Settings" onPress={openSettings}>
  <SettingsIcon />
</Button>
```

Correct:

```tsx
<ShellAction label="Settings" onPress={openSettings}>
  <SettingsIcon />
</ShellAction>
```

`title` is not a `Button` prop, and React Aria's `filterDOMProps` keeps only `id`, `data-*`, labelling and global DOM attributes, so it never reaches the `button`: an icon-only button with no text node is left with no accessible name and no tooltip either, while `ShellAction` sets `aria-label` from `label` and wraps the button in the `TooltipTrigger` that also opens on keyboard focus.

### HIGH The key hint mistaken for a registration

Wrong:

```tsx
function ShellSearch({ open }: { open: () => void }) {
  return <ShellCommandTrigger shortcut="⌘K" onPress={open}>Search or jump to…</ShellCommandTrigger>
}
```

Correct:

```tsx
function ShellSearch({ open }: { open: () => void }) {
  useShortcut({ id: "shell.palette", keys: "mod+k", label: "Command palette", onAction: open })
  return <ShellCommandTrigger shortcut="⌘K" onPress={open}>Search or jump to…</ShellCommandTrigger>
}
```

`shortcut` on `ShellCommandTrigger` only renders a `Kbd` and binds nothing, so ⌘K never opens the palette and the key is missing from `useShortcuts()` — the list the shell's help dialog and command palette are built from.

### MEDIUM A hand-built overflow menu in the header

Wrong:

```tsx
<DropdownMenuTrigger>
  <Button variant="ghost" size="icon-sm" aria-label="More">
    <EllipsisVerticalIcon />
  </Button>
  <DropdownMenu>
    <DropdownMenuItem textValue="Settings">Settings</DropdownMenuItem>
  </DropdownMenu>
</DropdownMenuTrigger>
```

Correct:

```tsx
<ShellOverflow className="lg:hidden">
  <DropdownMenuItem textValue="Settings">Settings</DropdownMenuItem>
</ShellOverflow>
```

`DropdownMenu` defaults to `placement="bottom start"` and `min-w-32`, so a hand-built copy on the last control in the header runs off the right edge of the window and is narrower than the other menus in the cluster — `ShellOverflow` is that trigger with its menu already anchored `bottom end` at `min-w-48 rounded-lg`.
