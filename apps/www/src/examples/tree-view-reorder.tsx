import * as React from "react"

import {
  moveTreeItems,
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

type Node = { id: string; name: string; children?: Node[] }

const project: Node[] = [
  {
    id: "wells",
    name: "Wells",
    children: [
      { id: "a12", name: "34/10-A-12" },
      { id: "a13", name: "34/10-A-13" },
      { id: "b4", name: "34/10-B-4" },
    ],
  },
  {
    id: "horizons",
    name: "Horizons",
    children: [
      { id: "balder", name: "Top Balder" },
      { id: "sele", name: "Top Sele" },
      { id: "bcu", name: "Base Cretaceous" },
      {
        id: "interpretations",
        name: "Interpretations",
        children: [
          { id: "faults", name: "Faults" },
          { id: "picks", name: "Well picks" },
        ],
      },
    ],
  },
  { id: "archive", name: "Archive", children: [] },
]

function renderNode(node: Node) {
  return (
    <TreeViewItem value={node.id} label={node.name}>
      <TreeViewItemContent kind={node.children ? "folder" : "item"}>
        {node.name}
      </TreeViewItemContent>
      <TreeViewCollection items={node.children ?? []}>
        {renderNode}
      </TreeViewCollection>
    </TreeViewItem>
  )
}

export default function TreeViewReorder() {
  const [items, setItems] = React.useState(project)

  return (
    <TreeView
      aria-label="Project"
      className="max-w-sm"
      items={items}
      selectionMode="multiple"
      defaultExpanded={["wells", "horizons", "interpretations"]}
      onMove={(move) => setItems((current) => moveTreeItems(current, move))}
    >
      {renderNode}
    </TreeView>
  )
}
