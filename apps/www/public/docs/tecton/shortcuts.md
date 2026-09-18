# Shortcuts

A keyboard shortcut registry for the shell: the host listens once, applications register their shortcuts, and the shell lists them.

Source: /docs/tecton/shortcuts.md

**Example — `shortcuts-demo`**

```tsx
"use client"

import * as React from "react"

import {
  ShortcutKeys,
  ShortcutsProvider,
  useShortcut,
  useShortcuts,
} from "@tecton/react/tecton/shortcuts"

/**
 * A scoped registry: `target` limits the listener to this region, so the
 * shortcuts only fire while focus is inside it.
 */
export default function ShortcutsDemo() {
  const [target, setTarget] = React.useState<HTMLDivElement | null>(null)

  return (
    <div
      ref={setTarget}
      tabIndex={0}
      className="w-full max-w-md rounded-lg border p-4 text-sm outline-none focus-within:ring-2 focus-within:ring-ring/50"
    >
      <ShortcutsProvider target={target}>
        <Editor />
      </ShortcutsProvider>
    </div>
  )
}

function Editor() {
  const [lastAction, setLastAction] = React.useState<string | null>(null)
  const [locked, setLocked] = React.useState(false)
  const shortcuts = useShortcuts()

  useShortcut({
    id: "new-well",
    keys: "n",
    label: "Create well",
    group: "Wells",
    onAction: () => setLastAction("Create well"),
  })
  useShortcut({
    id: "go-wells",
    keys: "g w",
    label: "Go to wells",
    group: "Navigate",
    onAction: () => setLastAction("Go to wells"),
  })
  useShortcut({
    id: "save",
    keys: "mod+s",
    label: "Save",
    group: "Wells",
    isEnabled: () => !locked,
    onAction: () => setLastAction("Save"),
  })
  useShortcut({
    id: "lock",
    keys: "l",
    label: locked ? "Unlock" : "Lock",
    group: "Wells",
    onAction: () => setLocked((value) => !value),
  })

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground">
        Click here, then press a shortcut. Registered by this component:
      </p>
      <ul className="flex flex-col gap-1">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.id} className="flex items-center justify-between gap-4">
            <span>
              {shortcut.label}
              {shortcut.id === "save" && locked ? (
                <span className="text-muted-foreground"> (disabled while locked)</span>
              ) : null}
            </span>
            <ShortcutKeys keys={shortcut.keys} />
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="border-t pt-3">
        {lastAction ? (
          <>
            Last action: <span className="font-medium">{lastAction}</span>
          </>
        ) : (
          <span className="text-muted-foreground">No shortcut pressed yet</span>
        )}
      </p>
    </div>
  )
}
```

## Usage

```tsx
import {
  ShortcutsProvider,
  useShortcut,
  useShortcuts,
  createShortcutRegistry,
  ShortcutKeys,
} from "@tecton/react/tecton/shortcuts"
```

The host wraps the shell in one provider. Anything below it registers shortcuts with the hook; the handler always sees the latest render.

```tsx
<ShortcutsProvider>
  <Shell />
</ShortcutsProvider>

function WellsPage() {
  useShortcut({
    id: "wells.new",
    keys: "n",
    label: "Create well",
    group: "Wells",
    onAction: () => openNewWellDialog(),
  })
}
```

## Registering from a micro-frontend

An application that is not part of the host's React tree registers against the registry object instead. The host creates it, passes it to the provider and hands it to the mounted application (through its mount props, a module-federation shared module or `window`). `register` returns the function that removes the shortcuts again; call it when the application unmounts.

```tsx
// host
const registry = createShortcutRegistry()

<ShortcutsProvider registry={registry}>…</ShortcutsProvider>
mountApplication(container, { shortcuts: registry })

// mounted application
const unregister = props.shortcuts.register([
  { id: "wells.new", keys: "n", label: "Create well", group: "Wells", onAction: openNewWell },
  { id: "wells.list", keys: "g w", label: "Go to wells", group: "Wells", onAction: goToWells },
])

// on unmount
unregister()
```

Registering an id again replaces the earlier shortcut, and when two shortcuts share the same keys the most recently registered one wins, so an application can override a host default while it is mounted.

## Key syntax

| Syntax | Meaning |
| --- | --- |
| `mod+k` | ⌘K on macOS, Ctrl+K elsewhere. |
| `ctrl+shift+p`, `alt+enter` | Explicit modifiers: `ctrl`, `alt`, `shift`, `meta`. |
| `?`, `/`, `.` | A symbol; matches with or without Shift, whatever the layout. |
| `g w` | A sequence: `g` then `w` within a second, shown as `G + W`. |
| `escape`, `enter`, `arrowup` | Named keys (`esc`, `up`, `space` are aliases). |

Shortcuts without Ctrl, ⌘ or Alt do not fire while an input, textarea or editable element has focus, so `n` never steals a letter from a form. Set `allowInInput` to change that for one shortcut.

## Listing shortcuts

`useShortcuts()` returns the registered shortcuts and re-renders when they change; the shell's command palette and `?` dialog are built on it. `ShortcutKeys` renders a shortcut as key caps.

```tsx
const shortcuts = useShortcuts()

{shortcuts.map((shortcut) => (
  <li key={shortcut.id}>
    {shortcut.label} <ShortcutKeys keys={shortcut.keys} />
  </li>
))}
```

## Scoping

By default the provider listens on `document`. Pass `target` to listen on one element instead, for example a canvas or an editor region that has its own shortcuts only while it is focused. The demo above is scoped that way.

> See the [Application shell](/blocks/shell-01) block for the whole loop: the host registers ⌘K and `?`, the mounted application registers its own, and both show up in the palette and the shortcut dialog.

## API Reference

### ShortcutsProvider

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `registry` | `ShortcutRegistry` | created | The registry to expose; create one with `createShortcutRegistry` to share it outside React. |
| `target` | `HTMLElement \| Document \| null` | `document` | Element whose `keydown` events are dispatched. |

A nested provider without a `registry` reuses the parent's.

### useShortcut

Registers one shortcut for the lifetime of the component.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | - | Stable id; re-registering replaces. |
| `keys` | `string` | - | Chord or sequence, see key syntax. |
| `label` | `string` | - | Shown in shortcut lists. |
| `group` | `string` | "General" | Heading in shortcut lists. |
| `onAction` | `(event: KeyboardEvent) => void` | - | Handler. |
| `allowInInput` | `boolean` | modifiers only | Fire while typing in a field. |
| `isEnabled` | `() => boolean` | - | Skip the shortcut when false. |
| `hidden` | `boolean` | false | Keep out of lists. |

### ShortcutRegistry

| Member | Description |
| --- | --- |
| `register(shortcut \| shortcut[])` | Adds shortcuts; returns the function that removes them. |
| `unregister(id)` | Removes one shortcut. |
| `getAll()` | Registered shortcuts, in registration order. |
| `subscribe(listener)` | Called when the set changes; returns the unsubscribe function. |
| `handleKeyDown(event)` | Dispatches a key event; `true` when a shortcut handled it. |

### useShortcuts, formatShortcut, ShortcutKeys

`useShortcuts()` returns the live `Shortcut[]`. `formatShortcut(keys)` returns the key caps per chord (`[["⌘", "K"]]`) for custom rendering; `ShortcutKeys` renders them with `Kbd`.
