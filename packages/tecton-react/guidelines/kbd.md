---
component: Kbd
module: "@tecton/react/components/kbd"
family: labels
exports: [Kbd, KbdGroup]
notFor:
  - need: a status or category label
    use: Badge
  - need: a glyph for an action rather than a key
    use: Tecton icons
related: [Badge]
---

## Use it when

- Naming the key that triggers something: a shortcut hint in a menu item, a tooltip, a button or an input group addon.
- Showing a combination or a sequence: `KbdGroup` around several `Kbd`.
- Documenting a shortcut inline in a sentence.

## Do

- One key per `Kbd`, wrapped in a `KbdGroup` when there is more than one; a combination that reads as a single token (`Ctrl + B`) may stay in one `Kbd`.
- Inside a `Button` or an `InputGroupAddon`, add `data-icon="inline-end"` (or `inline-start`) so the control trims its padding on that side.
- Inside a `TooltipContent` leave it alone: `Kbd` already inverts to the tooltip surface through its `in-data-[slot=tooltip-content]` rules.
- `className` is for nudging placement; the muted surface and the 20 px box belong to the component.

## Don't

### HIGH Expecting a Kbd to be pressable

Wrong:

```tsx
<Kbd onClick={() => setPaletteOpen(true)}>⌘K</Kbd>
```

Correct:

```tsx
<Button variant="outline" onPress={() => setPaletteOpen(true)}>
  Search
  <Kbd data-icon="inline-end">⌘K</Kbd>
</Button>
```

`Kbd` sets `pointer-events-none`, so no pointer event ever reaches it and the handler never fires.

### HIGH Hand-building the key from raw markup

Wrong:

```tsx
<kbd className="rounded border border-gray-300 bg-gray-200 px-1 text-xs text-gray-600">
  ⌘
</kbd>
```

Correct:

```tsx
<Kbd>⌘</Kbd>
```

`gray-200`, `gray-300` and `gray-600` are not Tecton steps, so the reset palette emits no rule for any of them and the key renders as bare text on the page background.

### MEDIUM A key inside a button without data-icon

Wrong:

```tsx
<Button variant="outline">
  Accept
  <Kbd>⏎</Kbd>
</Button>
```

Correct:

```tsx
<Button variant="outline">
  Accept
  <Kbd data-icon="inline-end" className="translate-x-0.5">
    ⏎
  </Kbd>
</Button>
```

The button trims its trailing padding only through `has-data-[icon=inline-end]:pr-1.5`, so without the attribute the key sits in full text padding and the button grows.
