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
      role="region"
      aria-label="Shortcut demo"
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
          <li
            key={shortcut.id}
            className="flex items-center justify-between gap-4"
          >
            <span>
              {shortcut.label}
              {shortcut.id === "save" && locked ? (
                <span className="text-muted-foreground">
                  {" "}
                  (disabled while locked)
                </span>
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
