---
component: Sheet
module: "@tecton/react/components/sheet"
family: overlays
exports: [Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetDescription, SheetFooter]
notFor:
  - need: a decision that must be finished before anything else
    use: Dialog
  - need: a bottom sheet the user drags with a thumb on touch
    use: Drawer
  - need: a panel that belongs to the page instead of floating over it
    use: Panel
  - need: content anchored to the control that opened it
    use: Popover
related: [Dialog, Drawer, Panel]
---

## Use it when

- Details, filters or settings that belong to what is on screen: the page stays behind the overlay.
- The content is taller than it is wide — a form, a property list, a history.
- The user should be able to leave by clicking the page behind it.

## Do

- Wrap the trigger `Button` and the `Sheet` in one `SheetTrigger`, exactly as for `Dialog`.
- Pick the edge with `side="right" | "left" | "top" | "bottom"` on `Sheet` (`SheetContent` is an alias of it).
- Let `SheetHeader` and `SheetFooter` carry their own `p-4`; the sheet body is yours, so give it `px-4` and `flex-1`.
- Drop the corner control with `showCloseButton={false}` and close from the footer with `SheetClose`.
- Set width with `className` (`sm:max-w-lg`) only; `Sheet` owns the surface, the edge and the animation.

## Don't

### HIGH Positioning the sheet with className

Wrong:

```tsx
<Sheet className="fixed top-0 left-0 h-full w-96 bg-white p-6">
  <SheetTitle>Well properties</SheetTitle>
</Sheet>
```

Correct:

```tsx
<Sheet side="left" className="sm:max-w-md">
  <SheetHeader>
    <SheetTitle>Well properties</SheetTitle>
  </SheetHeader>
</Sheet>
```

`Sheet` sets its edge, size and enter/exit transforms from `data-side`, so hand-placed `fixed`/`inset` classes fight the variant and the animation slides the panel from the wrong edge.

### HIGH Body content with no padding of its own

Wrong:

```tsx
<Sheet>
  <SheetHeader>
    <SheetTitle>Filters</SheetTitle>
  </SheetHeader>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="field">Field</FieldLabel>
      <Input id="field" />
    </Field>
  </FieldGroup>
</Sheet>
```

Correct:

```tsx
<Sheet>
  <SheetHeader>
    <SheetTitle>Filters</SheetTitle>
  </SheetHeader>
  <FieldGroup className="flex-1 px-4">
    <Field>
      <FieldLabel htmlFor="field">Field</FieldLabel>
      <Input id="field" />
    </Field>
  </FieldGroup>
</Sheet>
```

The padding lives on `SheetHeader` and `SheetFooter`, not on the sheet, so anything in between runs edge to edge against the panel border.
