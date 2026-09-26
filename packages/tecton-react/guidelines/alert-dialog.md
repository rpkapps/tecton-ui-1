---
component: AlertDialog
module: "@tecton/react/components/alert-dialog"
family: overlays
exports: [AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogOverlay, AlertDialogPortal]
notFor:
  - need: a form, or a decision the user may walk away from
    use: Dialog
  - need: a confirmation of something the user can undo afterwards
    use: toast
related: [Dialog]
---

## Use it when

- An action destroys or overwrites something: delete, discard, overwrite, revoke.
- The consequence cannot be undone once the user continues.
- The user must answer: there is no outside-press dismissal and no close button.

## Do

- Compose `AlertDialog` > `AlertDialogTrigger render={<Button variant="destructive" />}` + `AlertDialogContent`, as for `Dialog`.
- End the title with a question and state the consequence in `AlertDialogDescription`.
- `AlertDialogCancel` closes the prompt; `AlertDialogAction` is a plain `Button`, so control the dialog with `open` / `onOpenChange` and close it in the action's `onClick` once the work is done.
- Colour the confirm with `variant="destructive"` on `AlertDialogAction` — never with `className` — and use `size="sm"` on `AlertDialogContent` with `AlertDialogMedia` for a short, centred prompt.

## Don't

### HIGH Expecting AlertDialogAction to close the prompt

Wrong:

```tsx
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel>
  <AlertDialogAction variant="destructive" onClick={deleteWell}>Delete</AlertDialogAction>
</AlertDialogFooter>
```

Correct:

```tsx
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel>
  <AlertDialogAction variant="destructive" onClick={() => deleteWell().then(() => setOpen(false))}>
    Delete
  </AlertDialogAction>
</AlertDialogFooter>
```

`AlertDialogAction` is a `Button` with no link to the dialog state, so on an uncontrolled `AlertDialog` the action runs and the prompt stays on screen over the deleted record.

### HIGH The React Aria trigger wrapping the prompt

Wrong:

```tsx
<AlertDialogTrigger>
  <Button variant="destructive">Delete well</Button>
  <AlertDialog>
    <AlertDialogTitle>Delete 34/10-A-12?</AlertDialogTitle>
  </AlertDialog>
</AlertDialogTrigger>
```

Correct:

```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger render={<Button variant="destructive" />}>Delete well</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader><AlertDialogTitle>Delete 34/10-A-12?</AlertDialogTitle></AlertDialogHeader>
  </AlertDialogContent>
</AlertDialog>
```

`AlertDialog` is the root that holds the state and renders nothing itself; the trigger outside it throws, and without `AlertDialogContent` no prompt is drawn.

### MEDIUM A Dialog for a destructive confirmation

Wrong:

```tsx
<Dialog>
  <DialogContent><DialogTitle>Discard 12 unsaved edits?</DialogTitle></DialogContent>
</Dialog>
```

Correct:

```tsx
<AlertDialog>
  <AlertDialogContent><AlertDialogTitle>Discard 12 unsaved edits?</AlertDialogTitle></AlertDialogContent>
</AlertDialog>
```

A `Dialog` closes on a backdrop press and announces itself as `role="dialog"`, so a stray click answers the question; `AlertDialog` is `role="alertdialog"` and has no outside-press dismissal.
