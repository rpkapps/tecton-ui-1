"use client"

import { DropIndicator, type DropIndicatorProps } from "../drag-and-drop/parts"
import { useTreeRoot } from "./context"
import type { TreeDropPlace } from "./context"

type TreeDropIndicatorProps = Omit<
  DropIndicatorProps<TreeDropPlace>,
  "dragAndDrop" | "getPlacement" | "grid"
>

/**
 * The line a drop between rows lands on, placed with `top` and the
 * `--tree-drop-level` custom property (the level, from 1, of the rows it
 * goes between) for its indent.
 */
function TreeDropIndicator(props: TreeDropIndicatorProps) {
  const root = useTreeRoot("TreeViewDropIndicator")
  const connection = root.dragAndDrop
  if (!connection) return null
  return (
    <DropIndicator
      {...props}
      grid
      dragAndDrop={connection.dragAndDrop}
      getPlacement={connection.getPlacement}
    />
  )
}

export { TreeDropIndicator }
export type { TreeDropIndicatorProps }
