"use client"

import type * as React from "react"

import { useStore } from "../../store"
import { hidden, usePrimitive, type PrimitiveProps } from "../render"
import { useTreeRoot, useTreeRow } from "./context"

type TreeItemContentState = {
  level: number
  expanded: boolean
  hasChildren: boolean
  /** Whether rows show a drag handle. */
  draggable: boolean
}

type TreeItemContentProps = Omit<
  PrimitiveProps<"div", TreeItemContentState>,
  "children"
> & {
  /** The content, or a function of the row's state. */
  children?:
    React.ReactNode | ((state: TreeItemContentState) => React.ReactNode)
}

/** The visible content of a row, with the row's state for its parts. */
function TreeItemContent({ children, ...props }: TreeItemContentProps) {
  const root = useTreeRoot("TreeViewItemContent")
  const { node } = useTreeRow("TreeViewItemContent")
  const hasChildren = node.children.length > 0
  const expanded = useStore(
    root.store,
    (s) => hasChildren && s.expanded.has(node.value)
  )
  const state: TreeItemContentState = {
    level: node.level,
    expanded,
    hasChildren,
    draggable: !!root.dragAndDrop?.enabled,
  }
  return usePrimitive(
    "div",
    props,
    state,
    { children: typeof children === "function" ? children(state) : children },
    { level: hidden, expanded: hidden, hasChildren: hidden, draggable: hidden }
  )
}

export { TreeItemContent }
export type { TreeItemContentProps, TreeItemContentState }
