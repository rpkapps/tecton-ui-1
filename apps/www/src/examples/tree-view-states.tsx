import * as React from "react"

import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function TreeViewStates() {
  const [value, setValue] = React.useState<string[]>(["sele"])

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <TreeView
        aria-label="Horizons"
        selectionMode="multiple"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["horizons"]}
      >
        <TreeViewItem value="horizons">
          <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
          <TreeViewItem value="balder">
            <TreeViewItemContent>Top Balder</TreeViewItemContent>
          </TreeViewItem>
          <TreeViewItem value="sele">
            <TreeViewItemContent>Top Sele</TreeViewItemContent>
          </TreeViewItem>
          <TreeViewItem value="bcu" hidden>
            <TreeViewItemContent>Base Cretaceous (hidden)</TreeViewItemContent>
          </TreeViewItem>
          <TreeViewItem value="brent" disabled>
            <TreeViewItemContent>Top Brent (disabled)</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
      <p className="text-xs text-muted-foreground">
        Selected: {value.length ? value.join(", ") : "none"}
      </p>
    </div>
  )
}
