# Tree View

Hierarchical project, inventory and file structures on React Aria Tree, with folder and item rows, states, colour tags and row actions.

Source: /docs/tecton/tree-view.md  
React Aria docs: https://react-aria.adobe.com/Tree

**Example — `tree-view-demo`**

```tsx
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function TreeViewDemo() {
  return (
    <TreeView
      aria-label="Project"
      className="max-w-sm"
      selectionMode="single"
      defaultExpandedKeys={["wells"]}
    >
      <TreeViewItem id="wells" textValue="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem id="a12" textValue="34/10-A-12">
          <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="b3" textValue="34/10-B-3">
          <TreeViewItemContent>34/10-B-3</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem id="horizons" textValue="Horizons">
        <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
        <TreeViewItem id="balder" textValue="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  )
}
```

## Usage

```tsx
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewAction,
  TreeViewVisibilityToggle,
  TreeViewCollection,
} from "@tecton/react/tecton/tree-view"
```

```tsx
<TreeView aria-label="Project" selectionMode="single" defaultExpandedKeys={["wells"]}>
  <TreeViewItem id="wells" textValue="Wells">
    <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
    <TreeViewItem id="a12" textValue="34/10-A-12">
      <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
    </TreeViewItem>
  </TreeViewItem>
</TreeView>
```

> shadcn has no tree component; the closest is the file tree built from `Collapsible` and `Sidebar`. `TreeView` uses React Aria `Tree` for keyboard navigation, selection and expansion, and adds the Tecton row anatomy.

## Nested

Nest `TreeViewItem`s inside each other. For dynamic data pass `items` to `TreeView` and use `TreeViewCollection` for the children of each node; indentation follows the level automatically.

**Example — `tree-view-nested`**

```tsx
import {
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

type Node = { id: string; name: string; children?: Node[] }

const project: Node[] = [
  {
    id: "fields",
    name: "Fields",
    children: [
      {
        id: "gullfaks",
        name: "Gullfaks",
        children: [
          {
            id: "gullfaks-wells",
            name: "Wells",
            children: [
              { id: "a12", name: "34/10-A-12" },
              { id: "a13", name: "34/10-A-13" },
            ],
          },
          { id: "gullfaks-horizons", name: "Horizons", children: [] },
        ],
      },
      { id: "statfjord", name: "Statfjord", children: [] },
    ],
  },
]

function renderNode(node: Node) {
  return (
    <TreeViewItem id={node.id} textValue={node.name}>
      <TreeViewItemContent kind={node.children ? "folder" : "item"}>
        {node.name}
      </TreeViewItemContent>
      <TreeViewCollection items={node.children ?? []}>
        {renderNode}
      </TreeViewCollection>
    </TreeViewItem>
  )
}

export default function TreeViewNested() {
  return (
    <TreeView
      aria-label="Fields"
      className="max-w-sm"
      items={project}
      defaultExpandedKeys={["fields", "gullfaks", "gullfaks-wells"]}
    >
      {renderNode}
    </TreeView>
  )
}
```

## States

Selection, disabled and expanded state come from React Aria (`selectionMode`, `disabledKeys`, `expandedKeys`). `isHidden` on `TreeViewItem` renders the dimmed *hidden* state from the design system.

**Example — `tree-view-states`**

```tsx
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function TreeViewStates() {
  return (
    <TreeView
      aria-label="Horizons"
      className="max-w-sm"
      selectionMode="multiple"
      defaultSelectedKeys={["sele"]}
      disabledKeys={["brent"]}
      defaultExpandedKeys={["horizons"]}
    >
      <TreeViewItem id="horizons" textValue="Horizons">
        <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
        <TreeViewItem id="balder" textValue="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="sele" textValue="Top Sele (selected)">
          <TreeViewItemContent>Top Sele (selected)</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="bcu" textValue="Base Cretaceous (hidden)" isHidden>
          <TreeViewItemContent>Base Cretaceous (hidden)</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="brent" textValue="Top Brent (disabled)">
          <TreeViewItemContent>Top Brent (disabled)</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  )
}
```

## Adornments

`TreeViewItemContent` has slots for a `colorTag` (a [ColorSwatch](/docs/tecton/color-swatch.md)), a `suffix` (a [Badge](/docs/components/badge.md)) and an `endAdornment` such as `TreeViewVisibilityToggle` or `TreeViewAction`.

**Example — `tree-view-adornments`**

```tsx
import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import {
  TreeView,
  TreeViewAction,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
} from "@tecton/react/tecton/tree-view"

const horizons = [
  { id: "balder", name: "Top Balder", color: "#f59e0b", picks: 12 },
  { id: "sele", name: "Top Sele", color: "#38bdf8", picks: 8 },
  { id: "bcu", name: "Base Cretaceous", color: "#a3e635", picks: 0 },
]

export default function TreeViewAdornments() {
  const [hidden, setHidden] = React.useState<Set<string>>(new Set(["bcu"]))

  return (
    <TreeView aria-label="Horizons" className="max-w-sm" defaultExpandedKeys={["horizons"]}>
      <TreeViewItem id="horizons" textValue="Horizons">
        <TreeViewItemContent kind="folder" endAdornment={<TreeViewAction aria-label="More" />}>
          Horizons
        </TreeViewItemContent>
        {horizons.map((horizon) => (
          <TreeViewItem key={horizon.id} id={horizon.id} textValue={horizon.name} isHidden={hidden.has(horizon.id)}>
            <TreeViewItemContent
              colorTag={<ColorSwatch color={horizon.color} aria-label={`${horizon.name} colour`} />}
              suffix={
                horizon.picks > 0 && (
                  <Badge variant="info">{horizon.picks} picks</Badge>
                )
              }
              endAdornment={
                <>
                  <TreeViewVisibilityToggle
                    isVisible={!hidden.has(horizon.id)}
                    onChange={(visible) =>
                      setHidden((prev) => {
                        const next = new Set(prev)
                        if (visible) next.delete(horizon.id)
                        else next.add(horizon.id)
                        return next
                      })
                    }
                  />
                  <TreeViewAction aria-label={`${horizon.name} actions`} />
                </>
              }
            >
              {horizon.name}
            </TreeViewItemContent>
          </TreeViewItem>
        ))}
      </TreeViewItem>
    </TreeView>
  )
}
```

## API Reference

### TreeView

React Aria [`Tree`](https://react-aria.adobe.com/Tree); accepts all its props (`items`, `selectionMode`, `selectedKeys`, `expandedKeys`, `disabledKeys`, `onAction`…).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | `string` | - | Accessible name of the tree. |
| `selectionMode` | `"none" \| "single" \| "multiple"` | "none" | Row selection. |
| `defaultExpandedKeys` | `Iterable<Key>` | - | Initially expanded rows. |

### TreeViewItem

React Aria `TreeItem`. Put a `TreeViewItemContent` first, then child `TreeViewItem`s or a `TreeViewCollection`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `Key` | - | Unique key. |
| `textValue` | `string` | - | Plain-text label (required). |
| `isHidden` | `boolean` | false | Dimmed hidden state. |

### TreeViewItemContent

Row layout: chevron, icon, colour tag, label, suffix and end adornment.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `kind` | `"folder" \| "item"` | "item" | Folder icon or a small dot. |
| `icon` | `ReactNode` | - | Custom leading icon. |
| `colorTag` | `ReactNode` | - | 12 px colour tag after the icon. |
| `suffix` | `ReactNode` | - | Content after the label. |
| `endAdornment` | `ReactNode` | - | Trailing actions. |

### TreeViewAction

24 px icon button for row actions; renders a vertical ellipsis by default.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onPress` | `(e: PressEvent) => void` | - | Press handler. |
| `children` | `ReactNode` | `<MoreVerticalIcon />` | Custom icon. |

### TreeViewVisibilityToggle

Eye / eye-off toggle built on `TreeViewAction`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isVisible` | `boolean` | true | Current visibility. |
| `onChange` | `(visible: boolean) => void` | - | Called with the next value. |
