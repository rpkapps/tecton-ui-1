---
component: ShortcutsProvider
module: "@tecton/react/tecton/shortcuts"
family: infrastructure
exports: [ShortcutsProvider, createShortcutRegistry, useShortcut, useShortcuts, useShortcutRegistry, formatShortcut, ShortcutKeys]
notFor:
  - need: one key cap rendered inside a label or a menu row
    use: Kbd
  - need: the header button whose tooltip shows a shortcut
    use: ShellAction
  - need: a searchable palette of the commands themselves
    use: Command
related: [Kbd, ShellActions, Command]
---

## Use it when

- The host listens for keys once and every mounted application registers against the same registry.
- A shortcut must be listed as well as bound: the help dialog and the command palette read `useShortcuts()`.
- A region owns keys only while focus is inside it — `target` scopes the listener to one element.

## Do

- Wrap the shell in one `ShortcutsProvider`; a nested provider with no `registry` of its own reuses the parent's.
- Register from React with `useShortcut`, which removes the shortcut on unmount and always calls the latest render's handler.
- Create the registry with `createShortcutRegistry()` in the host and hand the object to each mounted application; that shape is versioned public API, so the two sides may be on different package versions.
- Write keys in the registry syntax: `mod+k` for ⌘ / Ctrl, `?` for a symbol, `g w` for a sequence.
- Give every shortcut a stable `id`, a `label` and a `group`, and render its caps with `ShortcutKeys`.

## Don't

### HIGH A shortcut registered with a window listener

Wrong:

```tsx
React.useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "n") openNewWellDialog()
  }
  window.addEventListener("keydown", onKeyDown)
  return () => window.removeEventListener("keydown", onKeyDown)
}, [])
```

Correct:

```tsx
useShortcut({
  id: "wells.new",
  keys: "n",
  label: "Create well",
  group: "Wells",
  onAction: () => openNewWellDialog(),
})
```

The registry suppresses unmodified keys while an input, textarea or editable element has focus, so a hand-rolled listener opens the dialog on the first `n` the user types into a form — and the shortcut never reaches `useShortcuts()`, so neither the help dialog nor the command palette lists it.

### HIGH A mounted application creating its own registry

Wrong:

```tsx
<ShortcutsProvider registry={createShortcutRegistry()}>
  <App />
</ShortcutsProvider>
```

Correct:

```tsx
<ShortcutsProvider registry={props.shortcuts}>
  <App />
</ShortcutsProvider>
```

A registry of its own adds a second `document` listener with a list the host cannot see, so the application's keys are missing from the shell's shortcut dialog, both registries answer the same press, and a fresh object on every render re-subscribes the listener each time.

### MEDIUM Key caps typed out by hand

Wrong:

```tsx
<span>Go to wells <Kbd>G</Kbd> <Kbd>W</Kbd></span>
```

Correct:

```tsx
<span>{shortcut.label} <ShortcutKeys keys={shortcut.keys} /></span>
```

`ShortcutKeys` resolves `mod` to ⌘ or Ctrl for the reader's platform, splits a chord or a sequence into caps and gives the group one accessible name ("G, then W"), where hand-typed caps freeze the author's platform and are read out letter by letter.
