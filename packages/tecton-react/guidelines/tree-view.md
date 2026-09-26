---
component: TreeView
module: "@tecton/react/tecton/tree-view"
family: data
exports: [TreeView, TreeViewItem, TreeViewItemContent, TreeViewAction, TreeViewVisibilityToggle, TreeViewCollection]
notFor:
  - need: stacked sections that expand, with no parent and child structure
    use: Accordion
  - need: a flat list of rows with media, a title and actions
    use: Item
related: [Accordion, Item, ColorSwatch]
---

## Use it when

- A hierarchy is browsed rather than read: a project tree, a field and well inventory, a layer list.
- Rows carry more than a label: selection, disabled, hidden, a colour, a count, a per-row menu.
- Arrow-key navigation, expansion and type-ahead have to work across the whole structure.

## Do

- Give `TreeView` an `aria-label` and every `TreeViewItem` a unique `value`; add `label` when the row content is not plain text.
- Put `TreeViewItemContent` first inside each `TreeViewItem`, then the child `TreeViewItem`s — or `items` on `TreeView` and a `TreeViewCollection` per node for data.
- Drive state with string arrays: `selectionMode`, `value` / `defaultValue` / `onValueChange` and `expanded` / `defaultExpanded` / `onExpandedChange`; mark rows with `disabled` and `hidden` on `TreeViewItem`, and open a row through `onActivate` (Enter, double click on a selectable row), never an `onClick` on its content.
- Hang the extras on `TreeViewItemContent`: `colorTag`, `suffix`, `endAdornment` (`TreeViewVisibilityToggle` with `visible` / `onVisibleChange`, `TreeViewAction` with `onClick`).
- Style rows from the presence attributes `data-selected`, `data-expanded`, `data-disabled`, `data-hidden` and from `:hover` / `:focus-visible` (`group-hover/tree-item:opacity-100`). Write the selected state as `data-[selected]:…`: shadcn's `data-selected:` variant matches only `"true"`.

## Don't

### CRITICAL A tree built from nested Collapsibles

Wrong:

```tsx
<Collapsible>
  <CollapsibleTrigger>Wells</CollapsibleTrigger>
  <CollapsibleContent className="ps-4">
    <Collapsible>
      <CollapsibleTrigger>34/10-A-12</CollapsibleTrigger>
      <CollapsibleContent className="ps-4">Completions</CollapsibleContent>
    </Collapsible>
  </CollapsibleContent>
</Collapsible>
```

Correct:

```tsx
<TreeView aria-label="Project" selectionMode="single" defaultExpanded={["wells"]}>
  <TreeViewItem value="wells">
    <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
    <TreeViewItem value="a12">
      <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
    </TreeViewItem>
  </TreeViewItem>
</TreeView>
```

Each `Collapsible` is its own widget, so the result is a pile of buttons with no `role="treegrid"`, no arrow-key or type-ahead movement between rows and no selection.

### HIGH Indenting rows with padding classes

Wrong:

```tsx
<TreeViewItemContent className="ps-8">34/10-A-12</TreeViewItemContent>
```

Correct:

```tsx
<TreeViewItem value="wells">
  <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
  <TreeViewItem value="a12">
    <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
  </TreeViewItem>
</TreeViewItem>
```

`TreeViewItemContent` writes `paddingInlineStart` as an inline style from the row's depth, which no `className` can outrank, so the nesting sets the indent and `ps-8` is dead weight.

### MEDIUM Styling rows on hover or focus attributes

Wrong:

```tsx
<TreeViewAction className="opacity-0 group-data-hovered/tree-item:opacity-100" aria-label="Actions" />
```

Correct:

```tsx
<TreeViewAction className="opacity-0 group-hover/tree-item:opacity-100 group-focus-within/tree-item:opacity-100" aria-label="Actions" />
```

Rows expose no hover, press or focus attributes: use `:hover`, `:active`, `:focus-visible` and `:focus-within`, and the presence attributes for state.
