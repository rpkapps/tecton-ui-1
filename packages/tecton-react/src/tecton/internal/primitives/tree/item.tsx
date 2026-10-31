"use client"

import * as React from "react"

import { useStore } from "../../store"
import { hidden, usePrimitive, type PrimitiveProps } from "../render"
import { useTabIndex } from "../roving-focus"
import type { SelectionMode } from "../selection"
import { defineTreeItem, isTreePart } from "./collection"
import { useTreeRoot, useTreeRow } from "./context"
import { RowRegistry } from "./root"

type TreeItemState = {
  value: string
  level: number
  selected: boolean
  expanded: boolean
  disabled: boolean
  dragging: boolean
  dropTarget: boolean
  /** Hidden from the DOM; for `className` functions. */
  selectionMode: SelectionMode
  hasChildren: boolean
}

type TreeItemProps = Omit<PrimitiveProps<"div", TreeItemState>, "children"> & {
  /** The row's identity in the tree's `value`, `expanded` and drag moves. */
  value: string
  /** The row's plain text: its accessible name and type-ahead text. */
  textValue?: string
  disabled?: boolean
  /** Takes drops inside even without child rows. */
  folder?: boolean
  /** The row's content, then its child rows (rendered by the tree). */
  children?: React.ReactNode
}

const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"]'

/**
 * A row. Rendered by the tree (with its level, position and state) rather
 * than where it is written: its child rows render after it, as rows of
 * their own. Pressing it selects it (or activates it, in a tree that only
 * activates); a press on a control inside it is left to the control.
 */
function TreeItem({
  children,
  value: _value,
  textValue: _text,
  folder: _folder,
  disabled: _disabled,
  ...props
}: TreeItemProps) {
  const root = useTreeRoot("TreeViewItem")
  const { node, style, rowIndex } = useTreeRow("TreeViewItem")
  const registry = React.useContext(RowRegistry)
  const { value } = node
  const hasChildren = node.children.length > 0
  const selected = useStore(root.store, (s) => s.selected.has(value))
  const expanded = useStore(
    root.store,
    (s) => hasChildren && s.expanded.has(value)
  )
  const dragging = useStore(root.store, (s) => s.dragging.has(value))
  const dropTarget = useStore(root.store, (s) => s.dropTarget === value)
  const tabIndex = useTabIndex(root.focus.store, value)

  const ref = React.useCallback(
    (element: HTMLElement | null) => {
      if (!registry) return
      if (element) registry.set(value, element)
      else if (registry.get(value)) registry.delete(value)
    },
    [registry, value]
  )

  const state: TreeItemState = {
    value,
    level: node.level,
    selected,
    expanded,
    disabled: node.disabled,
    dragging,
    dropTarget,
    selectionMode: root.selectionMode,
    hasChildren,
  }
  const fromControl = (event: React.SyntheticEvent) => {
    const control = (event.target as Element).closest(INTERACTIVE)
    return (
      !!control &&
      control !== event.currentTarget &&
      event.currentTarget.contains(control)
    )
  }
  const isMac =
    typeof navigator !== "undefined" &&
    /mac|iphone|ipad|ipod/i.test(navigator.platform)

  return usePrimitive(
    "div",
    props,
    state,
    {
      ref,
      role: "row",
      "aria-label": node.textValue || undefined,
      "aria-level": node.level,
      "aria-posinset": node.posInSet,
      "aria-setsize": node.setSize,
      "aria-rowindex": rowIndex,
      "aria-expanded": hasChildren ? expanded : undefined,
      "aria-selected": root.selectionMode === "none" ? undefined : selected,
      "aria-disabled": node.disabled || undefined,
      tabIndex,
      style,
      onFocus: (event: React.FocusEvent) => {
        if (event.target === event.currentTarget) root.focus.setFocused(value)
      },
      onClick: (event: React.MouseEvent) => {
        if (node.disabled || fromControl(event) || event.button !== 0) return
        const mod = isMac ? event.metaKey : event.ctrlKey
        if (root.selectionMode === "none") {
          root.activate?.(value, event)
          return
        }
        root.select(value, { range: event.shiftKey, toggle: mod, event })
      },
      onPointerDown: root.dragAndDrop?.enabled
        ? (event: React.PointerEvent<HTMLElement>) => {
            if (node.disabled || fromControl(event)) return
            root.dragAndDrop?.dragAndDrop.onPointerDown(event, value)
          }
        : undefined,
      onDoubleClick: (event: React.MouseEvent) => {
        if (
          node.disabled ||
          fromControl(event) ||
          root.selectionMode === "none"
        )
          return
        root.activate?.(value, event)
      },
      children: (
        <div role="gridcell" aria-colindex={1} style={{ display: "contents" }}>
          {React.Children.toArray(children).filter(
            (child) => !isTreePart(child)
          )}
        </div>
      ),
    },
    { selectionMode: hidden, hasChildren: hidden }
  )
}

defineTreeItem(TreeItem, (props: TreeItemProps) => ({
  value: props.value,
  textValue: props.textValue ?? "",
  disabled: !!props.disabled,
  folder: !!props.folder,
  children: props.children,
}))

export { TreeItem }
export type { TreeItemProps, TreeItemState }
