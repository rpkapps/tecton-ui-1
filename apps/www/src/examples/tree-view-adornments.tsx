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
