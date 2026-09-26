---
component: Dialog
module: "@tecton/react/components/dialog"
family: overlays
exports: [Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay, DialogPortal]
notFor:
  - need: a confirmation before a destructive action
    use: AlertDialog
  - need: a side panel that keeps the page visible behind it
    use: Sheet
  - need: a bottom sheet the user drags with a thumb
    use: Drawer
related: [AlertDialog, Sheet, Popover]
---

## Use it when

- A decision or a short form — editing a record's fields, renaming it — must be finished before the page continues.
- The task deserves the whole screen: everything behind it goes inert.
- The user may abandon it — Escape and the backdrop both cancel.

## Do

- Compose `Dialog` (the root, no element) > `DialogTrigger render={<Button />}` + `DialogContent`; the content portals itself and draws the overlay.
- Control it with `open` / `onOpenChange` on `Dialog`; `defaultOpen` for an uncontrolled start.
- Give every dialog a `DialogTitle` inside `DialogHeader`: it is the dialog's accessible name.
- Close from the footer with `DialogClose render={<Button variant="outline" />}`, and pass `disablePointerDismissal` on `Dialog` with `showCloseButton={false}` on `DialogContent` when the user must pick a footer action.
- Keep `className` on `DialogContent` to width and layout (`sm:max-w-lg`): it owns the surface, radius and padding.

## Don't

### HIGH A trigger wrapping the button and the dialog

Wrong:

```tsx
<DialogTrigger>
  <Button variant="outline">Edit well</Button>
  <Dialog>
    <DialogTitle>Edit well</DialogTitle>
  </Dialog>
</DialogTrigger>
```

Correct:

```tsx
<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Edit well</DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Edit well</DialogTitle></DialogHeader>
  </DialogContent>
</Dialog>
```

`DialogTrigger` must sit inside `Dialog`, which holds the state, and only `DialogContent` renders the popup: outside a root the trigger throws, and without `DialogContent` nothing is shown.

### HIGH Controlling the dialog with isOpen

Wrong:

```tsx
<Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Rename well</DialogTitle>
  </DialogContent>
</Dialog>
```

Correct:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Rename well</DialogTitle>
  </DialogContent>
</Dialog>
```

`isOpen` is not a prop of the root, so the dialog keeps its own uncontrolled state and never opens when the page sets it.

### MEDIUM Closing from the footer with your own state

Wrong:

```tsx
<DialogFooter>
  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
</DialogFooter>
```

Correct:

```tsx
<DialogFooter>
  <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
</DialogFooter>
```

In an uncontrolled `Dialog` the state lives in the root, so a `Button` setting page state closes nothing; `DialogClose` closes whichever way the dialog is driven.
