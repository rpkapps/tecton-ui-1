---
component: TableSelectionCheckbox
module: "@tecton/react/tecton/table-selection-checkbox"
docs: "components/data-table#keyboard-navigation"
family: data
exports: [TableSelectionCheckbox]
notFor:
  - need: a checkbox in a form, a filter or a settings list
    use: Checkbox
  - need: selecting items of a hierarchy without columns
    use: TreeView
related: [Table, Checkbox, "TanStack Table"]
---

## Use it when

- The rows of a `<Table grid selectionMode="multiple">` (or `"single"`) are selected with checkboxes, in a column of their own.
- The header needs one checkbox that selects or clears every row and shows a dash while only some are selected.

## Do

- Put one `TableSelectionCheckbox` in the header's selection cell and one in each row's: it reads the row it is in and the table's selection, and takes no `checked` or `onCheckedChange`.
- Give every `TableRow` its `value`: the checkbox toggles that value in the table's `value` / `onValueChange`, and is disabled with the row.
- Keep the selection where the rest of the table state is (TanStack Table's `rowSelection`): `value={Object.keys(rowSelection)}`, and `onValueChange` written back to it.
- Make the identifying cell the row's header (`TableHead scope="row"`), or give the row a `textValue`: the checkbox is named "Select" and that text.

## Don't

### HIGH A Checkbox per row wired by hand in a grid table

Wrong:

```tsx
<Table grid selectionMode="multiple" value={selected} onValueChange={setSelected}>
  …
  <TableRow value={well.id}>
    <TableCell><Checkbox checked={selected.includes(well.id)} onCheckedChange={() => toggle(well.id)} /></TableCell>
  </TableRow>
</Table>
```

Correct:

```tsx
<Table grid selectionMode="multiple" value={selected} onValueChange={setSelected}>
  …
  <TableRow value={well.id}>
    <TableCell><TableSelectionCheckbox /></TableCell>
  </TableRow>
</Table>
```

A hand-wired `Checkbox` keeps a selection of its own beside the table's: Space and Shift + arrows on the row change one and not the other, Shift + click selects no range, and each checkbox is named alike.

### HIGH TableSelectionCheckbox outside a grid table

Wrong:

```tsx
<Table>
  <TableBody>
    <TableRow><TableCell><TableSelectionCheckbox /></TableCell></TableRow>
  </TableBody>
</Table>
```

Correct:

```tsx
<Table grid selectionMode="multiple">
  <TableBody>
    <TableRow value={well.id}><TableCell><TableSelectionCheckbox /></TableCell></TableRow>
  </TableBody>
</Table>
```

The checkbox selects through the grid table it is in; outside one it has no selection to show and throws.
