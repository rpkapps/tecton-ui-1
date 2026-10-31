import * as React from "react"

import {
  ContextMenuContent,
  ContextMenuItem,
} from "@tecton/react/components/context-menu"
import {
  moveTreeItems,
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

type Node = { id: string; name: string; children?: Node[] }

// 100 fields of 100 wells: 10,100 rows.
const fields: Node[] = Array.from({ length: 100 }, (_, f) => ({
  id: `field-${f}`,
  name: `Field ${String(f + 1).padStart(3, "0")}`,
  children: Array.from({ length: 100 }, (_, w) => ({
    id: `well-${f}-${w}`,
    name: `34/${f + 1}-A-${w + 1}`,
  })),
}))

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

export default function TreeViewLarge() {
  const [items, setItems] = React.useState(fields)
  const [selected, setSelected] = React.useState<string[]>([])
  const [opened, setOpened] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="rounded-md border p-1">
        <TreeView
          aria-label="Wells"
          className="h-80"
          items={items}
          virtualized
          selectionMode="multiple"
          value={selected}
          onValueChange={setSelected}
          defaultExpanded={["field-0", "field-1"]}
          onActivate={setOpened}
          onMove={(move) => setItems((current) => moveTreeItems(current, move))}
          contextMenu={(value) => (
            <ContextMenuContent>
              <ContextMenuItem onClick={() => setOpened(value)}>
                Open
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setSelected([value])}>
                Select only this
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        >
          {renderNode}
        </TreeView>
      </div>
      <p className="text-sm text-muted-foreground">
        {selected.length} of 10,100 rows selected
        {opened && ` · opened ${opened}`}
      </p>
    </div>
  )
}
