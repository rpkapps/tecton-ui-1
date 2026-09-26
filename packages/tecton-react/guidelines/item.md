---
component: Item
module: "@tecton/react/components/item"
family: surfaces
exports: [Item, ItemGroup, ItemSeparator, ItemHeader, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemFooter]
notFor:
  - need: a standalone block with its own title, body and footer
    use: Card
  - need: rows with columns, sorting, paging and selection
    use: TanStack Table
  - need: the trailing actions of a panel header
    use: PanelActions
related: [Card, Panel, Separator]
---

## Use it when

- One row of a list: a file, a person, a well, a setting with a switch beside it.
- The row has a shape — media, then title and description, then actions.
- A stack of rows should look and space consistently: wrap them in `ItemGroup`.

## Do

- Compose it: `ItemMedia`, then `ItemContent` with `ItemTitle` and `ItemDescription`, then `ItemActions`.
- Make the whole row a link with `render={<a href="/wells/34-10-a-12" />}` (or the router's `Link`); the `[a]:` rules give it the hover and focus states.
- Choose the look with `variant="default" | "outline" | "muted"` and the density with `size="default" | "sm" | "xs"`.
- Use `ItemMedia variant="icon"` for a glyph and `variant="image"` for a thumbnail; an `Avatar` goes in the plain `ItemMedia`.
- Separate rows inside an `ItemGroup` with `ItemSeparator`, never with a border class on the row.

## Don't

### CRITICAL A row made clickable with onClick

Wrong:

```tsx
<Item variant="outline" onClick={() => navigate("/wells/34-10-a-12")}>
  <ItemContent>
    <ItemTitle>34/10-A-12</ItemTitle>
  </ItemContent>
</Item>
```

Correct:

```tsx
<Item variant="outline" render={<a href="/wells/34-10-a-12" />}>
  <ItemContent>
    <ItemTitle>34/10-A-12</ItemTitle>
  </ItemContent>
</Item>
```

`Item` renders a plain `div` unless `render` makes it an anchor, so `onClick` gives the row no role, no tab stop and no Enter key: it is reachable with a mouse only.

### MEDIUM Sizing and colouring the row by hand

Wrong:

```tsx
<Item className="gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
  <ItemContent>
    <ItemTitle>Seismic survey 2024</ItemTitle>
  </ItemContent>
</Item>
```

Correct:

```tsx
<Item variant="outline" size="sm">
  <ItemContent>
    <ItemTitle>Seismic survey 2024</ItemTitle>
  </ItemContent>
</Item>
```

`size="sm"` already is `gap-2.5 px-3 py-2.5` and `variant="outline"` already is the themed border; the hand-written version desynchronises from the other rows, and `border-gray-200` emits no CSS because Tecton resets the stock palette.
