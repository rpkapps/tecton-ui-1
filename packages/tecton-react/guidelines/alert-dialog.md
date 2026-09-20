---
component: AlertDialog
module: "@tecton/react/components/alert-dialog"
family: overlays
exports: [AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogOverlay]
notFor:
  - need: a form, or a decision the user may walk away from
    use: Dialog
  - need: a confirmation of something the user can undo afterwards
    use: toast
  - need: a side panel listing what is about to change
    use: Sheet
related: [Dialog, Sheet]
---

## Use it when

- An action destroys or overwrites something: delete, discard, overwrite, revoke.
- The consequence cannot be undone once the user continues.
- The user must answer: there is no outside-press dismissal and no close button.

## Do

- Wrap the trigger `Button` and the `AlertDialog` in one `AlertDialogTrigger`, as for `Dialog`.
- End the title with a question and state the consequence in `AlertDialogDescription`.
- Use `AlertDialogCancel` and `AlertDialogAction` in the footer; both carry `slot="close"`, so the dialog closes either way.
- Colour the confirm with `variant="destructive"` on `AlertDialogAction` — never with `className` — and use `size="sm"` with `AlertDialogMedia` for a short, centred prompt.

## Don't

### HIGH Confirming with a plain Button

Wrong:

```tsx
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel>
  <Button variant="destructive" onPress={deleteWell}>Delete</Button>
</AlertDialogFooter>
```

Correct:

```tsx
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel>
  <AlertDialogAction variant="destructive" onPress={deleteWell}>Delete</AlertDialogAction>
</AlertDialogFooter>
```

`AlertDialogAction` is a `Button` with `slot="close"`, which React Aria binds to the overlay state; a plain `Button` runs the action and leaves the prompt on screen over the deleted record.

### HIGH Content rendered as a sibling of the trigger

Wrong:

```tsx
<>
  <AlertDialogTrigger>
    <Button variant="destructive">Delete well</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete 34/10-A-12?</AlertDialogTitle>
  </AlertDialogContent>
</>
```

Correct:

```tsx
<AlertDialogTrigger>
  <Button variant="destructive">Delete well</Button>
  <AlertDialog>
    <AlertDialogTitle>Delete 34/10-A-12?</AlertDialogTitle>
  </AlertDialog>
</AlertDialogTrigger>
```

`AlertDialogContent` is an alias of `AlertDialog`, so both names compile; outside the trigger's subtree neither reads its overlay state, and pressing the button does nothing at all.

### MEDIUM Letting a backdrop click answer the question

Wrong:

```tsx
<AlertDialog isDismissable>
  <AlertDialogTitle>Discard 12 unsaved edits?</AlertDialogTitle>
</AlertDialog>
```

Correct:

```tsx
<AlertDialog>
  <AlertDialogTitle>Discard 12 unsaved edits?</AlertDialogTitle>
</AlertDialog>
```

`AlertDialogOverlay` leaves React Aria's `isDismissable` off on purpose, which is the only thing separating this from `Dialog`; turning it on lets a stray backdrop click answer the question.
