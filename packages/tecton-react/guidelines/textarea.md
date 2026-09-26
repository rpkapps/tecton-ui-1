---
component: Textarea
module: "@tecton/react/components/textarea"
family: forms
exports: [Textarea]
notFor:
  - need: a single line of text
    use: Input
  - need: a toolbar, a counter or a send button attached to the box
    use: InputGroupTextarea
  - need: the label, description and error message around the control
    use: Field
related: [Field, Input, InputGroup]
---

## Use it when

- Several lines of free text: a description, a note, a comment, a message.
- The content grows while the user types and the box should follow it.
- Inside a `Field`, so the control arrives with a label and room for an error.

## Do

- Pick the surface with `variant="outline" | "filled" | "text"` — the same three axes as `Input`.
- Set the starting height with `rows`; the box already carries `field-sizing-content` and `min-h-16` and grows from there.
- `Textarea` is a real `<textarea>`: use `value`, `onChange(event)`, `disabled`, `required` and `aria-invalid`.
- Mirror the state on the `Field`: `data-disabled` beside `disabled`, `data-invalid` beside `aria-invalid`.
- Keep `className` to layout only — `w-full`, `col-span-2`.

## Don't

### MEDIUM Pinning the textarea to a fixed height

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="notes">Notes</FieldLabel>
  <Textarea id="notes" className="h-[120px] resize-none" />
</Field>
```

Correct:

```tsx
<Field>
  <FieldLabel htmlFor="notes">Notes</FieldLabel>
  <Textarea id="notes" rows={5} />
</Field>
```

`field-sizing-content` grows the box with its value, so a fixed `h-[120px]` freezes it and long text scrolls inside a short field.

### HIGH Turning the border red for an invalid value

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="about">About</FieldLabel>
  <Textarea id="about" className="border-red-500 focus:border-red-500" />
</Field>
```

Correct:

```tsx
<Field data-invalid>
  <FieldLabel htmlFor="about">About</FieldLabel>
  <Textarea id="about" aria-invalid />
  <FieldError>Keep this under 500 characters.</FieldError>
</Field>
```

`border-red-500` emits no CSS after the palette reset, while `aria-invalid` is both what `textareaVariants` styles and what assistive tech reads.

### HIGH Putting the send button outside the control

Wrong:

```tsx
<div className="flex items-end gap-2">
  <Textarea id="reply" placeholder="Write a reply" />
  <Button type="submit">Send</Button>
</div>
```

Correct:

```tsx
<InputGroup>
  <InputGroupTextarea id="reply" placeholder="Write a reply" />
  <InputGroupAddon align="block-end">
    <InputGroupButton variant="default">Send</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

A sibling button sits outside the control's border and its focus ring; `align="block-end"` switches the group to a column and keeps the button inside the field.
