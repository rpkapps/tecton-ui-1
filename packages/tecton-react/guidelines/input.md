---
component: Input
module: "@tecton/react/components/input"
family: forms
exports: [Input]
notFor:
  - need: more than one line of free text
    use: Textarea
  - need: an icon, a prefix or a button inside the field
    use: InputGroup
  - need: the label, description and error message around the control
    use: Field
related: [Field, InputGroup, Textarea]
---

## Use it when

- A single line of text: name, email, password, number, date, file.
- The value is free-form; a fixed set of options belongs in a picker instead.
- Inside a `Field`, so the control arrives with a label and room for an error.

## Do

- Pick the surface with `variant="outline" | "filled" | "text"` — outline in forms, filled in dense panels, text for inline editing.
- Wire the label by hand: `<FieldLabel htmlFor="x">` plus `<Input id="x">`. Nothing associates them implicitly.
- `Input` is a real `<input>`: use the DOM props `value`, `onChange(event)`, `disabled`, `required`, `type` and `aria-invalid`.
- Mirror the state on the `Field` — `data-disabled` beside `disabled`, `data-invalid` beside `aria-invalid` — and keep `className` to layout (`w-full`, `col-span-2`).

## Don't

### HIGH Faking the filled surface with background classes

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="well">Well name</FieldLabel>
  <Input id="well" className="rounded-md border-zinc-300 bg-zinc-100" />
</Field>
```

Correct:

```tsx
<Field>
  <FieldLabel htmlFor="well">Well name</FieldLabel>
  <Input id="well" variant="filled" />
</Field>
```

The Tecton palette resets Tailwind's (`--color-*: initial`), so `bg-zinc-100` and `border-zinc-300` emit no CSS at all and the field renders as a plain outline input.

### HIGH Treating onChange as a value callback

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="title">Title</FieldLabel>
  <Input id="title" value={title} onChange={setTitle} />
</Field>
```

Correct:

```tsx
<Field>
  <FieldLabel htmlFor="title">Title</FieldLabel>
  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
</Field>
```

`Input` is a DOM `<input>` and `onChange` receives the change event, not the value, so `setTitle` stores the `ChangeEvent` and the field renders `[object Object]`.

### HIGH Positioning an icon on top of the input

Wrong:

```tsx
<div className="relative">
  <SearchIcon className="absolute top-2 left-2 size-4" />
  <Input id="q" className="pl-8" placeholder="Search wells" />
</div>
```

Correct:

```tsx
<InputGroup>
  <InputGroupInput id="q" placeholder="Search wells" />
  <InputGroupAddon>
    <SearchIcon />
  </InputGroupAddon>
</InputGroup>
```

`pl-8` overrides the padding `inputVariants` owns, the icon is not clickable into the field, and the overlay is outside the focus ring instead of inside it.
