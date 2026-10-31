import * as React from "react"
import {
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"

import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@tecton/react/components/context-menu"
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

const horizons = [
  { id: "balder", name: "Top Balder" },
  { id: "sele", name: "Top Sele" },
  { id: "bcu", name: "Base Cretaceous" },
]

export default function TreeViewContextMenu() {
  const [hidden, setHidden] = React.useState<Set<string>>(new Set())
  const [last, setLast] = React.useState("Right-click a horizon")

  const nameOf = (value: string) =>
    horizons.find((horizon) => horizon.id === value)?.name ?? value

  const toggleHidden = (value: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <TreeView
        aria-label="Horizons"
        defaultExpanded={["horizons"]}
        contextMenu={(value) =>
          // The folder has no menu.
          value === "horizons" ? null : (
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem
                  onClick={() => setLast(`Rename ${nameOf(value)}`)}
                >
                  <PencilIcon />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => setLast(`Duplicate ${nameOf(value)}`)}
                >
                  <CopyIcon />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem onClick={() => toggleHidden(value)}>
                  {hidden.has(value) ? <EyeIcon /> : <EyeOffIcon />}
                  {hidden.has(value) ? "Show" : "Hide"}
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onClick={() => setLast(`Delete ${nameOf(value)}`)}
              >
                <TrashIcon />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          )
        }
      >
        <TreeViewItem value="horizons">
          <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
          {horizons.map((horizon) => (
            <TreeViewItem
              key={horizon.id}
              value={horizon.id}
              hidden={hidden.has(horizon.id)}
            >
              <TreeViewItemContent>{horizon.name}</TreeViewItemContent>
            </TreeViewItem>
          ))}
        </TreeViewItem>
      </TreeView>
      <p className="text-sm text-muted-foreground">{last}</p>
    </div>
  )
}
