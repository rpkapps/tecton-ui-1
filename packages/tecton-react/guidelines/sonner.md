---
component: Toaster
module: "@tecton/react/components/sonner"
family: feedback
exports: [Toaster]
notFor:
  - need: a message that must stay until the user resolves it
    use: Alert
  - need: the state of a list that has nothing in it
    use: Empty
  - need: the progress of a task the user is watching
    use: Progress
related: [Alert, Empty]
---

## Use it when

- Confirming something the user just did, where the page already shows the result: saved, copied, queued, undone.
- Reporting the end of a background task the user is not watching: an export finished, a run failed to start.
- Offering a short-lived undo beside that confirmation.

## Do

- Mount `<Toaster />` once, at the application root; everywhere else import `toast` from `sonner` and call it.
- Use the typed helpers — `toast.success`, `toast.info`, `toast.warning`, `toast.error`, `toast.promise` — so the Toaster's icons and the Tecton outlined status colours apply.
- Put the detail in `description` and a single undo in `action`; a toast is one sentence and at most one action.
- Set the placement once on the Toaster (`position="top-center"`), not per call, and let `toast.promise` own a pending toast so it resolves itself.

## Don't

### CRITICAL Calling toast() with no Toaster mounted

Wrong:

```tsx
import { toast } from "sonner"

export function SaveButton() {
  return <Button onPress={() => toast.success("Model saved")}>Save</Button>
}
```

Correct:

```tsx
import { toast } from "sonner"
import { Toaster } from "@tecton/react/components/sonner"

export function App() {
  return (
    <>
      <Button onPress={() => toast.success("Model saved")}>Save</Button>
      <Toaster position="top-center" />
    </>
  )
}
```

`toast()` pushes onto sonner's global store and returns an id; with no `Toaster` subscribed nothing renders and nothing throws, so the confirmation is lost in silence.

### HIGH A pending toast that is never resolved

Wrong:

```tsx
toast.loading("Running simulation…")
await runSimulation()
toast.success("Simulation finished")
```

Correct:

```tsx
toast.promise(runSimulation(), {
  loading: "Running simulation…",
  success: "Simulation finished",
  error: "Simulation failed",
})
```

`toast.loading` has no duration, so unless its returned id is reused it stays on screen for the rest of the session and the success toast stacks beneath it.

### HIGH Colouring a toast by hand

Wrong:

```tsx
toast("Simulation failed", { className: "bg-red-600 text-white" })
```

Correct:

```tsx
toast.error("Simulation failed", {
  description: "12 cells have negative volume.",
})
```

The Toaster maps sonner's types onto `--error-text`, `--error-border` and the popover surface, and `red-600` is not a Tecton step, so the class emits no CSS and the toast shows no severity at all.
