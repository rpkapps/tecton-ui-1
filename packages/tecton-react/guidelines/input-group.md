---
component: InputGroup
module: "@tecton/react/components/input-group"
family: forms
exports: [InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea]
notFor:
  - need: a plain field with nothing attached to it
    use: Input
  - need: a verification code split into separate boxes
    use: InputOTP
  - need: the label, description and error message around the group
    use: Field
related: [Input, Textarea, Field]
---

## Use it when

- An icon, unit, hint or status belongs inside the field's border: search, currency, `https://`.
- A button acts on the value in place: clear, copy, reveal, remove, send.
- A textarea needs a toolbar or a footer row that shares its border and focus ring.

## Do

- Compose `InputGroup` > `InputGroupInput` or `InputGroupTextarea`, then the addons; the group owns the border, ring and height.
- Always place `InputGroupAddon` **after** the control in the DOM and position it with `align`: `inline-start` / `inline-end` beside an input, `block-start` / `block-end` above or below a textarea.
- Put buttons in `InputGroupButton` (`size="xs" | "icon-xs" | "sm" | "icon-sm"`, `onPress`, `aria-label` when icon-only), static copy in `InputGroupText`, and mark errors with `aria-invalid` on the control.

## Don't

### HIGH Putting a plain Input inside the group

Wrong:

```tsx
<InputGroup>
  <Input id="q" placeholder="Search wells" />
  <InputGroupAddon><SearchIcon /></InputGroupAddon>
</InputGroup>
```

Correct:

```tsx
<InputGroup>
  <InputGroupInput id="q" placeholder="Search wells" />
  <InputGroupAddon><SearchIcon /></InputGroupAddon>
</InputGroup>
```

`InputGroupInput` is the same `Input` with `data-slot="input-group-control"` and its own border, ring and radius removed; a plain `Input` keeps them, so a box appears inside the box and the group's focus ring never fires.

### HIGH Placing the addon before the control

Wrong:

```tsx
<InputGroup>
  <InputGroupAddon>
    <InputGroupButton>Filters</InputGroupButton>
  </InputGroupAddon>
  <InputGroupInput id="q" placeholder="Search" />
</InputGroup>
```

Correct:

```tsx
<InputGroup>
  <InputGroupInput id="q" placeholder="Search" />
  <InputGroupAddon align="inline-start">
    <InputGroupButton>Filters</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

`align` moves the addon visually with `order-first`, but tab order follows the DOM, so a leading addon puts its button ahead of the field the user came to type in.

### MEDIUM Aligning a textarea addon inline

Wrong:

```tsx
<InputGroup>
  <InputGroupTextarea id="reply" placeholder="Message" />
  <InputGroupAddon align="inline-end">Send</InputGroupAddon>
</InputGroup>
```

Correct:

```tsx
<InputGroup>
  <InputGroupTextarea id="reply" placeholder="Message" />
  <InputGroupAddon align="block-end">Send</InputGroupAddon>
</InputGroup>
```

Only `block-start` and `block-end` switch the group to a column, so an inline addon holds the single row and squeezes the textarea beside the button.
