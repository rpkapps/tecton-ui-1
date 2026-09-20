---
component: Combobox
module: "@tecton/react/components/combobox"
family: selection
exports: [Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ComboboxLabel, ComboboxEmpty, ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipList, ComboboxChipsInput, ComboboxCollection, ComboboxTrigger, ComboboxValue, useComboboxAnchor]
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
- The field still resolves to keys from a known collection, not to free text.

## Do

- Give every `ComboboxItem` an `id`; read the selection from `value` / `defaultValue` / `onChange`.
- Name the field: `aria-label` on `Combobox`, or a `FieldLabel` when it sits inside a `Field`.
- Pass `allowsEmptyCollection` and a `renderEmptyState` that returns `ComboboxEmpty`.
- Add `textValue` to any item whose children are JSX, so filtering and typeahead have a string.
- For multi-select pass `selectionMode="multiple"` and swap `ComboboxInput` for `ComboboxChips`, `ComboboxChipList`, `ComboboxChip` and `ComboboxChipsInput`.

## Don't

### CRITICAL Radix value props instead of onChange and id

Wrong:

```tsx
<Combobox value={framework} onValueChange={setFramework} allowsEmptyCollection>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxList><ComboboxItem value="remix">Remix</ComboboxItem></ComboboxList>
  </ComboboxContent>
</Combobox>
```

Correct:

```tsx
<Combobox aria-label="Framework" value={framework} onChange={setFramework} allowsEmptyCollection>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxList><ComboboxItem id="remix">Remix</ComboboxItem></ComboboxList>
  </ComboboxContent>
</Combobox>
```

React Aria reports the selected key through `onChange`; `onValueChange` is not a prop and `value` on `ComboboxItem` is the item's object value, so the handler never fires and nothing matches.

### CRITICAL A combobox rendered with no accessible name

Wrong:

```tsx
<Combobox allowsEmptyCollection><ComboboxInput placeholder="Framework" /></Combobox>
```

Correct:

```tsx
<Combobox aria-label="Framework" allowsEmptyCollection>
  <ComboboxInput placeholder="Framework" />
</Combobox>
```

`ComboboxInput` renders a bare `input` inside an `InputGroup` with no label element, so without `aria-label` (or a `Field` label) the control is announced as an unnamed combobox.

### MEDIUM No empty state when the filter matches nothing

Wrong:

```tsx
<Combobox aria-label="Framework">
  <ComboboxInput />
  <ComboboxContent>
    <ComboboxList>{items}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

Correct:

```tsx
<Combobox aria-label="Framework" allowsEmptyCollection>
  <ComboboxInput />
  <ComboboxContent>
    <ComboboxList renderEmptyState={() => <ComboboxEmpty>No items found.</ComboboxEmpty>}>{items}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

Without `allowsEmptyCollection` React Aria closes the popover as soon as the filtered collection is empty, so the typist sees the list vanish instead of a "no results" message.
