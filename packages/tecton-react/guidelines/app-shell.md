---
component: AppShell
module: "@tecton/react/tecton/app-shell"
family: surfaces
exports: [AppShell, AppShellHeader, AppShellBrand, AppShellNav, AppShellActions, AppShellAction, AppShellCommandTrigger, AppShellDivider, AppShellOverflow, AppShellUserMenu, AppShellBody, AppShellSidebar, AppShellMain, AppShellAside, AppShellSplit, AppShellSplitPanel, AppShellSplitHandle, useMinWidth]
notFor:
  - need: a titled tool surface inside the work area
    use: Panel
  - need: the title block at the top of the page inside the main area
    use: PageHeader
  - need: actions that belong to the page rather than to the shell
    use: PageHeaderActions
  - need: a panel that floats over the page and is dismissed
    use: Sheet
  - need: a toolbar that folds into a More menu by measured width
    use: Overflow
  - need: switching between applications from the header
    use: AppFinder
related: [Panel, PageHeader, Sheet, AppFinder, Overflow]
---

## Use it when

- The outermost frame of an application: a top bar, an optional left rail, a work area, an optional right aside.
- The frame fills the viewport (`h-svh`) and clips its own overflow, so each region scrolls on its own.
- The header carries the host's own cluster — search, help, settings, the account menu — so every mounted application shows the same set.
- A tool panel lives beside the content and the user may drag the divider between them.

## Do

- Compose it: `AppShellHeader` (with `AppShellBrand`, `AppShellNav`, `AppShellActions`), then `AppShellBody` holding `AppShellSidebar`, `AppShellMain` and `AppShellAside`.
- Put the page content in `AppShellMain`; it is the scrolling region of the work area.
- Give every `AppShellAction` a `label` — both the accessible name and the tooltip — separate groups with `AppShellDivider`, and on a narrow header hide the low-priority ones (`hidden lg:inline-flex`) in favour of `AppShellOverflow` (`lg:hidden`).
- For a draggable divider, wrap the regions in `AppShellSplit` with an `AppShellSplitPanel` each and an `AppShellSplitHandle` between them, and gate a full-height aside on `useMinWidth(1280)`.
- Inside an `AppShellSplitPanel` give the `AppShellAside` `className="h-full w-full border-l-0"`; otherwise `className` overrides the height alone (`h-full` in an embedded context) and the shell keeps its surfaces and borders.

## Don't

### CRITICAL An icon Button with a title instead of AppShellAction

Wrong:

```tsx
<Button variant="ghost" size="icon-sm" title="Settings" onPress={openSettings}>
  <SettingsIcon />
</Button>
```

Correct:

```tsx
<AppShellAction label="Settings" onPress={openSettings}>
  <SettingsIcon />
</AppShellAction>
```

`title` is not a `Button` prop, and React Aria's `filterDOMProps` keeps only `id`, `data-*`, labelling and global DOM attributes, so it never reaches the `button`: an icon-only button with no text node is left with no accessible name and no tooltip either, while `AppShellAction` sets `aria-label` from `label` and wraps the button in the `TooltipTrigger` that also opens on keyboard focus.

### HIGH Page content placed straight into AppShellBody

Wrong:

```tsx
<AppShellBody className="overflow-y-auto p-6">{page}</AppShellBody>
```

Correct:

```tsx
<AppShellBody>
  <AppShellMain className="p-6">{page}</AppShellMain>
</AppShellBody>
```

`AppShellBody` is the `flex min-h-0 overflow-hidden` row that holds the regions side by side, so content dropped into it is clipped at the fold and the sidebar and aside have nothing to sit beside.

### HIGH The key hint mistaken for a registration

Wrong:

```tsx
function ShellSearch({ open }: { open: () => void }) {
  return <AppShellCommandTrigger shortcut="⌘K" onPress={open}>Search</AppShellCommandTrigger>
}
```

Correct:

```tsx
function ShellSearch({ open }: { open: () => void }) {
  useShortcut({ id: "shell.palette", keys: "mod+k", label: "Command palette", onAction: open })
  return <AppShellCommandTrigger shortcut="⌘K" onPress={open}>Search</AppShellCommandTrigger>
}
```

`shortcut` on `AppShellCommandTrigger` only renders a `Kbd` and binds nothing, so ⌘K never opens the palette and the key is missing from `useShortcuts()` — the list the shell's help dialog and command palette are built from.
