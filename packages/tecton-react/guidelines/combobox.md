---
component: Combobox
module: "@tecton/react/components/combobox"
family: selection
exports: [Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ComboboxLabel, ComboboxEmpty, ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipsInput, ComboboxCollection, ComboboxTrigger, ComboboxValue, useComboboxAnchor]
notFor:
  - need: a short fixed list that needs no typing
    use: Select
  - need: a palette that runs commands instead of setting a value
    use: Command
related: [Select, Command, NativeSelect]
---

## Use it when

- The list is long enough that typing to narrow it beats scrolling a popover.
- The user picks several values and should see them as removable chips.
- The field still resolves to values from a known list, not to free text.

## Do

- Pass the options as `items` on `Combobox` and render them with the `ComboboxList` function child: `{(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}`.
- Drive the selection with `value` / `defaultValue` / `onValueChange`; for object items add `itemToStringLabel` so filtering and the input text have a string.
- Put `ComboboxEmpty` inside `ComboboxContent`; it shows only when the filter matches nothing.
- Name the input: `aria-label` on `ComboboxInput`, or an `id` on it with a `FieldLabel htmlFor` inside a `Field`.
- For multi-select pass `multiple`, render `ComboboxChips ref={anchor}` holding `ComboboxValue` → `ComboboxChip`s + `ComboboxChipsInput`, and give `ComboboxContent` the same `anchor` from `useComboboxAnchor()`.

## Don't

### CRITICAL React Aria props on the combobox

Wrong:

```tsx
<Combobox aria-label="Well" selectedKey={well} onSelectionChange={setWell}>
  <ComboboxInput placeholder="Search wells" />
  <ComboboxContent>
    <ComboboxList>{wells.map((w) => <ComboboxItem id={w}>{w}</ComboboxItem>)}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

Correct:

```tsx
<Combobox items={wells} value={well} onValueChange={setWell}>
  <ComboboxInput aria-label="Well" placeholder="Search wells" />
  <ComboboxContent>
    <ComboboxEmpty>No wells found.</ComboboxEmpty>
    <ComboboxList>{(w) => <ComboboxItem key={w} value={w}>{w}</ComboboxItem>}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

`selectedKey`, `onSelectionChange` and `id` are not props here: the item identity is `value`, so nothing is ever selected and the handler never fires.

### CRITICAL The accessible name on the root

Wrong:

```tsx
<Combobox aria-label="Well" items={wells}><ComboboxInput placeholder="Well" /></Combobox>
```

Correct:

```tsx
<Combobox items={wells}><ComboboxInput aria-label="Well" placeholder="Well" /></Combobox>
```

`Combobox` renders no element of its own, so an `aria-label` on it goes nowhere and the input is announced as an unnamed combobox.

### MEDIUM Filtering the items by hand

Wrong:

```tsx
<Combobox value={well} onValueChange={setWell}>
  <ComboboxInput onChange={(e) => setQuery(e.target.value)} />
  <ComboboxContent>
    <ComboboxList>{wells.filter((w) => w.includes(query)).map((w) => <ComboboxItem key={w} value={w}>{w}</ComboboxItem>)}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

Correct:

```tsx
<Combobox items={wells} value={well} onValueChange={setWell}>
  <ComboboxInput aria-label="Well" />
  <ComboboxContent>
    <ComboboxEmpty>No wells found.</ComboboxEmpty>
    <ComboboxList>{(w) => <ComboboxItem key={w} value={w}>{w}</ComboboxItem>}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

Without `items` the combobox has nothing to filter or count, so `ComboboxEmpty` never shows and the hand-written filter drifts from the input's own query (clearing, selecting, reopening).
