---
component: Chip
module: "@tecton/react/tecton/chip"
family: labels
exports: [Chip, ChipGroup, ChipList, ChipRemove]
notFor:
  - need: a label that is never selected or removed
    use: Badge
  - need: a count or dot pinned to the corner of an icon or avatar
    use: CountBadge
  - need: a confirmation that a tag was removed
    use: toast
related: [Badge, CountBadge]
---

## Use it when

- The user toggles the label: active filters, selected facies, chosen horizons.
- The user removes the label: applied filters, recipients, keywords, attachments.
- The set is small enough that every chip is on screen at once.

## Do

- Compose `ChipGroup > ChipList > Chip` and name the group with `aria-label`; the list is the `role="grid"` it names.
- Give every `Chip` a `value`: it is what `value`, `onValueChange` and `onRemove` hold. Add a `label` when the children are not plain text.
- Turn on selection with `selectionMode="single" | "multiple"` and `value` / `onValueChange` (or `defaultValue`) on the group; `disabled` on a chip or on the whole group.
- Turn on removal with `onRemove` on the group: every chip gets its remove button, and Delete or Backspace removes the focused one.
- Take the look from the Badge axes: `variant`, `appearance="outline"`, `size`. `className` is for layout only; style state with `data-[selected]:` (shadcn's `data-selected:` matches only `"true"`), `data-disabled`, `:hover` and `:focus-visible`.

## Don't

### CRITICAL Rendering a Chip outside its group

Wrong:

```tsx
<div className="flex flex-wrap gap-1.5">
  <Chip value="sandstone" variant="info">Sandstone</Chip>
</div>
```

Correct:

```tsx
<ChipGroup aria-label="Facies" selectionMode="multiple">
  <ChipList>
    <Chip value="sandstone" variant="info">Sandstone</Chip>
  </ChipList>
</ChipGroup>
```

A `Chip` is a row of the group's grid: outside a `ChipList` there is no grid to build it into, so it throws and takes the surrounding tree down with it.

### HIGH Building the remove button by hand

Wrong:

```tsx
<ChipGroup aria-label="Horizons">
  <ChipList>
    <Chip value="balder">
      Top Balder
      <Button variant="ghost" size="icon-xs" onClick={() => remove("balder")}><XIcon /></Button>
    </Chip>
  </ChipList>
</ChipGroup>
```

Correct:

```tsx
<ChipGroup aria-label="Horizons" onRemove={(values) => remove(values)}>
  <ChipList>
    <Chip value="balder">Top Balder</Chip>
  </ChipList>
</ChipGroup>
```

`onRemove` on the group renders a named remove button in every chip and binds Delete and Backspace; a nested button removes by mouse only and adds a focus stop the grid's arrow keys do not expect.

### HIGH Colouring a chip with className

Wrong:

```tsx
<Chip value="fault" className="bg-orange-500 text-white">Fault seal</Chip>
```

Correct:

```tsx
<Chip value="fault" variant="warning">Fault seal</Chip>
```

The chip's `className` is merged over `badgeVariants`, so `bg-orange-500` replaces `bg-secondary`, and `orange` is not a Tecton family: the palette emits nothing and the chip loses its surface.
