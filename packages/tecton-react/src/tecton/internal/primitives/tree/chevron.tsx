"use client"

import { useStore } from "../../store"
import { useMessages } from "../messages"
import { hidden, usePrimitive, type PrimitiveProps } from "../render"
import { useTreeRoot, useTreeRow } from "./context"
import { TREE_MESSAGES } from "./messages"

type TreeChevronState = { expanded: boolean; hasChildren: boolean }

type TreeChevronProps = PrimitiveProps<"button", TreeChevronState>

/**
 * Expands and collapses its row. Not a keyboard stop (Right and Left do the
 * same from the row), and hidden from assistive technology on a row with no
 * children.
 */
function TreeChevron(props: TreeChevronProps) {
  const root = useTreeRoot("TreeViewChevron")
  const { node } = useTreeRow("TreeViewChevron")
  const format = useMessages(TREE_MESSAGES)
  const hasChildren = node.children.length > 0
  const expanded = useStore(
    root.store,
    (s) => hasChildren && s.expanded.has(node.value)
  )
  return usePrimitive(
    "button",
    props,
    { expanded, hasChildren },
    {
      ref: root.registerChevron,
      type: "button",
      tabIndex: -1,
      "aria-label": format(expanded ? "collapse" : "expand"),
      "aria-hidden": hasChildren ? undefined : true,
      disabled: node.disabled || undefined,
      onClick: (event: React.MouseEvent) => {
        if (!node.disabled) root.toggle(node.value, event)
      },
    },
    { expanded: hidden, hasChildren: hidden }
  )
}

export { TreeChevron }
export type { TreeChevronProps, TreeChevronState }
