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
