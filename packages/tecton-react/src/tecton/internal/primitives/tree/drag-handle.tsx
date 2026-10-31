"use client"

import { DragHandle } from "../drag-and-drop/parts"
import type { DragAndDrop } from "../drag-and-drop/use-drag-and-drop"
import type { DragHandleProps } from "../drag-and-drop/parts"
import { useTreeRoot, useTreeRow } from "./context"

type TreeDragHandleProps = Omit<
  DragHandleProps,
  "dragAndDrop" | "value" | "label"
>

/** The grip of a draggable row ("Drag Wells"); see `DragAndDropPrimitive.Handle`. */
function TreeDragHandle(props: TreeDragHandleProps) {
  const root = useTreeRoot("TreeViewDragHandle")
  const { node } = useTreeRow("TreeViewDragHandle")
  if (!root.dragAndDrop) return null
  return (
    <DragHandle
      {...props}
      dragAndDrop={root.dragAndDrop.dragAndDrop as DragAndDrop<unknown>}
      value={node.value}
      label={node.textValue || node.value}
    />
  )
}

export { TreeDragHandle }
export type { TreeDragHandleProps }
