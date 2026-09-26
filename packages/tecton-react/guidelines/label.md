---
component: Label
module: "@tecton/react/components/label"
family: forms
exports: [Label]
notFor:
  - need: the label of a control that has a description or an error
    use: FieldLabel
  - need: the caption over a group of related controls
    use: FieldLegend
  - need: a heading beside a control that is already inside a label
    use: FieldTitle
related: [Field, FieldLabel]
---

## Use it when

- A control sits on its own — a toolbar filter, a preview switch — with no `Field` around it.
- A caption sits beside a value in a header row and still has to point at a control.
- Something that is not a Tecton form control needs the same label type and disabled behaviour.

## Do

- Pair `htmlFor` with the control's `id`; `Label` is a plain `<label>` and associates nothing by itself.
- For a `Select` the `id` goes on `SelectTrigger`; a `Slider` has no labelable element, so give the `Label` an `id` and pass it as the slider's `aria-labelledby`.
- Reach for `FieldLabel` the moment the control gains a description, an error or a `Field` wrapper.
- Keep `className` to layout; the size, weight and the disabled dimming belong to the component.

## Don't

### CRITICAL Rendering a label with nothing to associate

Wrong:

```tsx
<div className="flex items-center gap-2">
  <Label>Rows per page</Label>
  <Input id="rows" type="number" className="w-20" />
</div>
```

Correct:

```tsx
<div className="flex items-center gap-2">
  <Label htmlFor="rows">Rows per page</Label>
  <Input id="rows" type="number" className="w-20" />
</div>
```

`Label` is a bare `<label>` with nothing to fill in the association, so the input has no accessible name and clicking the text does not focus it.

### HIGH Styling a bare label element by hand

Wrong:

```tsx
<label htmlFor="rows" className="text-sm font-medium text-zinc-700">
  Rows per page
</label>
```

Correct:

```tsx
<Label htmlFor="rows">Rows per page</Label>
```

`text-zinc-700` emits no CSS after the palette reset, and the bare element misses the `peer-disabled` and `group-data-[disabled=true]` rules that dim a label together with its control.

### MEDIUM Using Label where FieldLabel belongs

Wrong:

```tsx
<Field orientation="horizontal">
  <Label htmlFor="alerts">Alerts</Label>
  <Switch id="alerts" />
</Field>
```

Correct:

```tsx
<Field orientation="horizontal">
  <FieldLabel htmlFor="alerts">Alerts</FieldLabel>
  <Switch id="alerts" />
</Field>
```

`Field`'s horizontal and responsive rules select on `data-slot="field-label"`, which `FieldLabel` and `FieldTitle` set and `Label` does not, so a plain `Label` does not take its share of the row.
