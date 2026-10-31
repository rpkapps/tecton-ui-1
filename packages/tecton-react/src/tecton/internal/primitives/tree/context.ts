"use client"

import * as React from "react"

import type { Store } from "../../store"
import type { DragAndDrop } from "../drag-and-drop/use-drag-and-drop"
import type { ChangeEventDetails } from "../event-details"
import type { RovingFocus } from "../roving-focus"
import type {
  SelectOptions,
  SelectionBehavior,
  SelectionMode,
} from "../selection"
import type { Tree, TreeNode } from "./collection"

/** The tree state rows read a slice of: each re-renders only on its own change. */
type TreeState = {
  selected: ReadonlySet<string>
  expanded: ReadonlySet<string>
  /** Rows a drag is carrying, and the row it would drop into. */
  dragging: ReadonlySet<string>
  dropTarget: string | null
}

type ExpandReason = "item-press" | "keyboard"

/** A place a drop can go: before or after a row, or inside it. */
type TreeDropPlace = { key: string; position: "before" | "after" | "inside" }

/** What drag and drop plugs into a tree; see `useTreeDragAndDrop`. */
type TreeDragAndDropConnection = {
  dragAndDrop: DragAndDrop<TreeDropPlace>
  /** Where the drop line goes for a place (`null`: a drop inside a row). */
  getPlacement: (place: TreeDropPlace) => React.CSSProperties | null
  /** Called by the root as it renders, with what the drag needs from it. */
  connect: (tree: TreeHandle) => void
  /** Whether rows show a drag handle. */
  enabled: boolean
  /** Rows the drag needs rendered (the aimed row), for virtualized trees. */
  keep: () => ReadonlyArray<string>
  /** The drop line and the keyboard drop target, rendered in the tree. */
  indicator: React.ReactNode
}

/** The live tree, for drag and drop and other add-ons. */
type TreeHandle = {
  element: HTMLElement | null
  tree: Tree
  rows: ReadonlyArray<TreeNode>
  store: Store<TreeState>
  rowHeight: number | null
  getRowElement: (value: string) => HTMLElement | null
  setExpanded: (value: string, open: boolean) => void
  /** Brings a row into view (and into the DOM, virtualized) and focuses it. */
  focusRow: (value: string) => void
  scrollToRow: (value: string) => void
}

type TreeRootContextValue = {
  store: Store<TreeState>
  focus: RovingFocus
  selectionMode: SelectionMode
  selectionBehavior: SelectionBehavior
  select: (value: string, options?: SelectOptions) => void
  /** Activates (opens) a row, when the tree has `onActivate`. */
  activate: ((value: string, event: React.SyntheticEvent) => void) | null
  toggle: (value: string, event?: React.SyntheticEvent) => void
  dragAndDrop: TreeDragAndDropConnection | null
  registerChevron: (element: HTMLElement | null) => void
}

type TreeRowContextValue = {
  node: TreeNode
  /** Positioning of a virtualized row; undefined otherwise. */
  style: React.CSSProperties | undefined
  /** From 1, for `aria-rowindex` in a virtualized tree. */
  rowIndex: number | undefined
}

const TreeRootContext = React.createContext<TreeRootContextValue | null>(null)
const TreeRowContext = React.createContext<TreeRowContextValue | null>(null)

function useTreeRoot(part: string) {
  const value = React.useContext(TreeRootContext)
  if (!value)
    throw new Error(`Tecton: <${part}> must be placed within <TreeView>.`)
  return value
}

function useTreeRow(part: string) {
  const value = React.useContext(TreeRowContext)
  if (!value)
    throw new Error(`Tecton: <${part}> must be placed within a <TreeViewItem>.`)
  return value
}

export { TreeRootContext, TreeRowContext, useTreeRoot, useTreeRow }
export type {
  ChangeEventDetails,
  ExpandReason,
  TreeDragAndDropConnection,
  TreeDropPlace,
  TreeHandle,
  TreeRootContextValue,
  TreeRowContextValue,
  TreeState,
}
