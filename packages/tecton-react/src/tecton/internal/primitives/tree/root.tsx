"use client"

import * as React from "react"

import { useDirection } from "@tecton/react/tecton/provider"

import { createStore, useStore } from "../../store"
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "../event-details"
import { edgeKey, nextKey, useTypeahead } from "../navigation"
import { hidden, usePrimitive, type PrimitiveProps } from "../render"
import { useRovingFocus } from "../roving-focus"
import {
  type SelectionMode,
  type SelectionReason,
  useSelection,
} from "../selection"
import { useSelectionAnnouncement } from "../selection-announcement"
import { useControlled } from "../use-controlled"
import { useVirtualList } from "../virtual-list"
import {
  buildTree,
  renderCollection,
  visibleRows,
  type TreeNode,
} from "./collection"
import {
  TreeRootContext,
  TreeRowContext,
  type ExpandReason,
  type TreeDragAndDropConnection,
  type TreeHandle,
  type TreeRootContextValue,
  type TreeState,
} from "./context"

type TreeRootState = {
  empty: boolean
  /** Hidden from the DOM; for `className` functions. */
  virtualized: boolean
  selectionMode: SelectionMode
}

type TreeRootProps<T> = Omit<
  PrimitiveProps<"div", TreeRootState>,
  "children" | "defaultValue" | "onChange"
> & {
  /** Data for the top-level rows; `children` is then a render function. */
  items?: Iterable<T>
  /** Rows (`TreePrimitive.Item`s), or a function rendering one per item. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  selectionMode?: SelectionMode
  value?: Array<string>
  defaultValue?: Array<string>
  onValueChange?: (
    value: Array<string>,
    eventDetails: ChangeEventDetails<SelectionReason>
  ) => void
  disallowEmptySelection?: boolean
  /**
   * Called when a row is activated: Enter, or a click (a double click when
   * rows are selectable, where a click selects).
   */
  onActivate?: (value: string) => void
  expanded?: Array<string>
  defaultExpanded?: Array<string>
  onExpandedChange?: (
    expanded: Array<string>,
    eventDetails: ChangeEventDetails<ExpandReason>
  ) => void
  /** Rendered in a single row when there are no rows. */
  empty?: React.ReactNode
  /** Renders only the rows in view; rows are then `rowHeight` px apart. */
  virtualized?: false | { rowHeight: number; gap?: number }
  /** Drag and drop, from `useTreeDragAndDrop`. */
  dragAndDrop?: TreeDragAndDropConnection
}

const EMPTY: Array<string> = []
const ROW_SELECTOR = '[role="row"][data-value]'
const CONTROL_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([role="row"])'

const isMac = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform)

/** One row of the rendered list: memoized, so unchanged rows skip rendering. */
const Row = React.memo(function Row({
  node,
  style,
  rowIndex,
}: {
  node: TreeNode
  style: React.CSSProperties | undefined
  rowIndex: number | undefined
}) {
  const context = React.useMemo(
    () => ({ node, style, rowIndex }),
    [node, style, rowIndex]
  )
  return <TreeRowContext value={context}>{node.element}</TreeRowContext>
})

/**
 * A tree of rows as an ARIA treegrid: one tab stop, rows moved through with
 * the arrow keys (mirrored right to left), Home, End, Page Up / Down and
 * type-ahead; Right / Left expand, collapse, and step into and out of a
 * row's controls. Selection follows Base UI's `value` / `onValueChange`.
 */
function TreeRoot<T>({
  items,
  children,
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  disallowEmptySelection,
  onActivate,
  expanded: expandedProp,
  defaultExpanded = EMPTY,
  onExpandedChange,
  empty,
  virtualized = false,
  dragAndDrop,
  ...props
}: TreeRootProps<T>) {
  const rtl = useDirection() === "rtl"
  const element = React.useRef<HTMLDivElement | null>(null)
  const rowElements = React.useRef(new Map<string, HTMLElement>())
  const chevrons = React.useRef(new WeakSet<Element>())

  // The rows: from data with a render function (cached), or as given.
  const rootChildren =
    typeof children === "function"
      ? renderCollection(
          items ?? [],
          children as (item: unknown) => React.ReactNode
        )
      : children
  const tree = React.useMemo(() => buildTree(rootChildren), [rootChildren])

  const [expandedList, setExpandedList] = useControlled(
    expandedProp,
    defaultExpanded
  )
  const expanded = React.useMemo(() => new Set(expandedList), [expandedList])
  const rows = React.useMemo(
    () => visibleRows(tree, expanded),
    [tree, expanded]
  )
  const rowIndex = React.useMemo(
    () => new Map(rows.map((node, index) => [node.value, index])),
    [rows]
  )

  const latest = React.useRef({
    tree,
    rows,
    rowIndex,
    expandedList,
    onExpandedChange,
    onActivate,
  })
  React.useInsertionEffect(() => {
    latest.current = {
      tree,
      rows,
      rowIndex,
      expandedList,
      onExpandedChange,
      onActivate,
    }
  })
  const isDisabled = (key: string) =>
    !!latest.current.tree.byValue.get(key)?.disabled

  const behavior = onActivate ? "replace" : "toggle"
  const selection = useSelection({
    mode: selectionMode,
    behavior,
    value,
    defaultValue,
    onValueChange,
    disallowEmptySelection,
    isSelectable: (key) => !isDisabled(key),
    getOrder: () => latest.current.rows.map((node) => node.value),
    getAllKeys: () => latest.current.tree.order,
  })

  const [store] = React.useState(() =>
    createStore<TreeState>({
      selected: selection.selected,
      expanded,
      dragging: new Set(),
      dropTarget: null,
    })
  )
  React.useLayoutEffect(() => {
    store.set({ selected: selection.selected, expanded })
  }, [store, selection.selected, expanded])

  const stride = virtualized
    ? virtualized.rowHeight + (virtualized.gap ?? 0)
    : 0
  const focus = useRovingFocus({
    getElement: (key) => rowElements.current.get(key),
    ensureRendered: (key) => {
      const index = latest.current.rowIndex.get(key)
      if (index !== undefined) virtual.scrollToIndex(index)
    },
  })
  const focused = useStore(focus.store, (s) => (virtualized ? s.focused : null))
  const keepValues = [focused, ...(dragAndDrop?.keep() ?? [])]
  const virtual = useVirtualList({
    count: rows.length,
    stride: stride || 1,
    enabled: !!virtualized,
    keep: keepValues.flatMap((key) => {
      const index = key === null ? undefined : rowIndex.get(key)
      return index === undefined ? [] : [index]
    }),
  })

  const toggle = React.useCallback(
    (key: string, event?: React.SyntheticEvent, open?: boolean) => {
      const { tree, expandedList, onExpandedChange } = latest.current
      const node = tree.byValue.get(key)
      if (!node || node.disabled || !node.children.length) return
      const isOpen = expandedList.includes(key)
      const next = open ?? !isOpen
      if (next === isOpen) return
      const list = next
        ? [...expandedList, key]
        : expandedList.filter((k) => k !== key)
      const details = createChangeEventDetails<ExpandReason>(
        event?.type === "keydown" ? "keyboard" : "item-press",
        event
      )
      onExpandedChange?.(list, details)
      if (details.isCanceled) return
      setExpandedList(list)
      // Focus inside the closed row goes to the row.
      const { focused: current } = focus.store.get()
      if (!next && current !== null && current !== key) {
        for (
          let n = tree.byValue.get(current);
          n;
          n = n.parent === null ? undefined : tree.byValue.get(n.parent)
        ) {
          if (n.parent === key) {
            if (
              element.current?.contains(
                element.current.ownerDocument.activeElement
              )
            )
              focus.focus(key)
            else focus.setFocused(key)
            break
          }
        }
      }
    },
    [focus, setExpandedList]
  )

  const activate = React.useCallback((key: string) => {
    if (!isDisabled(key)) latest.current.onActivate?.(key)
  }, [])

  const typeahead = useTypeahead({
    getKeys: () => latest.current.rows.map((node) => node.value),
    getText: (key) => latest.current.tree.byValue.get(key)?.textValue ?? "",
    isDisabled,
    getFocused: () => focus.store.get().focused,
    onMatch: (key) => moveTo(key),
  })

  useSelectionAnnouncement({
    selected: selection.selected,
    mode: selectionMode,
    behavior,
    hasFocus: () =>
      !!element.current?.contains(element.current.ownerDocument.activeElement),
    getText: (key) => tree.byValue.get(key)?.textValue ?? key,
    getAllKeys: () => tree.order.filter((key) => !isDisabled(key)),
  })

  /** Focuses `key` from the keyboard; with "replace", the selection follows. */
  function moveTo(
    key: string | null,
    event?: React.KeyboardEvent,
    { extend = false }: { extend?: boolean } = {}
  ) {
    if (key === null) return
    focus.focus(key)
    if (!event) return
    const mod = isMac() ? event.metaKey : event.ctrlKey
    if (extend && selectionMode === "multiple")
      selection.select(key, { range: true, event, reason: "keyboard" })
    else if (behavior === "replace" && !mod && selectionMode !== "none")
      selection.select(key, { event, reason: "keyboard" })
    else return
  }

  const controlsOf = (row: HTMLElement) =>
    Array.from(row.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)).filter(
      (el) =>
        !chevrons.current.has(el) &&
        !el.closest('[aria-hidden="true"]') &&
        el.closest(ROW_SELECTOR) === row
    )

  const pageSize = () => {
    const el = element.current
    const height =
      stride || el?.querySelector<HTMLElement>(ROW_SELECTOR)?.offsetHeight || 32
    return Math.max(1, Math.floor((el?.clientHeight ?? 0) / height) || 10)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const row = target.closest<HTMLElement>(ROW_SELECTOR)
    if (!row || row.closest('[role="treegrid"]') !== element.current) return
    if (
      target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
    )
      return
    const key = row.dataset.value!
    const node = tree.byValue.get(key)
    if (!node) return
    const onRow = target === row
    const keys = rows.map((n) => n.value)
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const backward = rtl ? "ArrowRight" : "ArrowLeft"
    const mod = isMac() ? event.metaKey : event.ctrlKey
    const handled = () => {
      event.preventDefault()
      event.stopPropagation()
    }

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        handled()
        const step = event.key === "ArrowDown" ? 1 : -1
        return moveTo(nextKey(keys, key, step, isDisabled), event, {
          extend: event.shiftKey,
        })
      }
      case "Home":
      case "End":
        handled()
        return moveTo(
          edgeKey(keys, event.key === "Home" ? 1 : -1, isDisabled),
          event,
          { extend: event.shiftKey && mod }
        )
      case "PageDown":
      case "PageUp": {
        handled()
        const step = (event.key === "PageDown" ? 1 : -1) * pageSize()
        return moveTo(nextKey(keys, key, step, isDisabled), event, {
          extend: event.shiftKey,
        })
      }
      case forward: {
        const controls = controlsOf(row)
        if (onRow && node.children.length && !expanded.has(key)) {
          handled()
          return toggle(key, event, true)
        }
        const index = onRow ? -1 : controls.indexOf(target)
        const next = controls[index + 1] as HTMLElement | undefined
        if (next) {
          handled()
          next.focus()
        }
        return
      }
      case backward: {
        if (!onRow) {
          handled()
          const controls = controlsOf(row)
          const index = controls.indexOf(target)
          ;(index > 0 ? controls[index - 1] : row).focus()
          return
        }
        handled()
        if (node.children.length && expanded.has(key))
          return toggle(key, event, false)
        if (node.parent !== null) moveTo(node.parent, event)
        return
      }
      case "Enter":
        if (!onRow) return
        handled()
        if (onActivate) return activate(key)
        if (node.children.length) toggle(key, event)
        return
      case " ":
        if (!onRow) return
        if (typeahead(event)) return
        handled()
        selection.select(key, {
          toggle: mod || behavior === "toggle",
          range: event.shiftKey,
          event,
          reason: "keyboard",
        })
        return
      case "Escape":
        if (
          selectionMode !== "none" &&
          selection.selected.size > 0 &&
          !disallowEmptySelection
        ) {
          handled()
          selection.clear(event)
        }
        return
      case "Tab": {
        // One tab stop: Tab leaves the tree rather than visiting row controls.
        const el = element.current!
        if (event.shiftKey) {
          el.focus({ preventScroll: true })
        } else {
          const all = el.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)
          const last = all[all.length - 1] as HTMLElement | undefined
          if (last && last !== target) {
            const tabIndex = last.tabIndex
            last.tabIndex = 0
            last.focus({ preventScroll: true })
            requestAnimationFrame(() => {
              last.tabIndex = tabIndex
            })
          }
        }
        return
      }
      default:
        if (mod && event.key.toLowerCase() === "a" && onRow) {
          if (selectionMode === "multiple") {
            handled()
            selection.selectAll(event)
          }
          return
        }
        if (onRow) typeahead(event)
    }
  }

  // The tab stop: the focused row while it shows and is enabled, else the first.
  React.useLayoutEffect(() => {
    const { focused: current } = focus.store.get()
    const keys = rows.map((n) => n.value)
    const tabStop =
      current !== null && rowIndex.has(current) && !isDisabled(current)
        ? current
        : edgeKey(keys, 1, isDisabled)
    focus.store.set({ tabStop })
    focus.flush()
  })

  const registerChevron = React.useCallback((el: HTMLElement | null) => {
    if (el) chevrons.current.add(el)
  }, [])

  const context = React.useMemo<TreeRootContextValue>(
    () => ({
      store,
      focus,
      selectionMode,
      selectionBehavior: behavior,
      select: (key, options) => selection.select(key, options),
      activate: onActivate ? (key) => activate(key) : null,
      toggle,
      dragAndDrop: dragAndDrop ?? null,
      registerChevron,
    }),
    [
      store,
      focus,
      selectionMode,
      behavior,
      selection,
      onActivate,
      activate,
      toggle,
      dragAndDrop,
      registerChevron,
    ]
  )

  // Drag and drop and other add-ons reach the live tree through this.
  const handle: TreeHandle = {
    element: element.current,
    tree,
    rows,
    store,
    rowHeight: stride || null,
    getRowElement: (key) => rowElements.current.get(key) ?? null,
    setExpanded: (key, open) => toggle(key, undefined, open),
    focusRow: (key) => focus.focus(key),
    scrollToRow: (key) => {
      const index = rowIndex.get(key)
      if (index === undefined) return
      if (virtualized) virtual.scrollToIndex(index)
      else rowElements.current.get(key)?.scrollIntoView({ block: "nearest" })
    },
  }
  React.useLayoutEffect(() => {
    handle.element = element.current
    dragAndDrop?.connect(handle)
  })

  const virtualRef = virtual.ref
  const rootRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      element.current = el
      virtualRef(el)
    },
    [virtualRef]
  )

  const isEmpty = rows.length === 0
  const renderRow = (node: TreeNode, index: number) => (
    <Row
      key={node.value}
      node={node}
      rowIndex={virtualized ? index + 1 : undefined}
      style={
        virtualized
          ? virtualStyle(virtual.offset(index), virtualized.rowHeight)
          : undefined
      }
    />
  )
  const content = isEmpty ? (
    empty === undefined ? null : (
      <div role="row" aria-level={1}>
        <div role="gridcell">{empty}</div>
      </div>
    )
  ) : virtualized ? (
    <div
      role="presentation"
      style={{ position: "relative", height: virtual.size }}
    >
      {virtual.indices.map((index) => renderRow(rows[index], index))}
    </div>
  ) : (
    rows.map(renderRow)
  )

  const rendered = usePrimitive(
    "div",
    props,
    { empty: isEmpty, virtualized: !!virtualized, selectionMode },
    {
      ref: rootRef,
      role: "treegrid",
      tabIndex: -1,
      "aria-multiselectable": selectionMode === "multiple" ? true : undefined,
      "aria-rowcount": rows.length,
      onKeyDown,
      children: (
        <>
          {content}
          {dragAndDrop?.indicator}
        </>
      ),
    },
    { virtualized: hidden, selectionMode: hidden }
  )

  return (
    <TreeRootContext value={context}>
      <RowRegistry value={rowElements.current}>{rendered}</RowRegistry>
    </TreeRootContext>
  )
}

/** The row elements by value, filled in by the rows as they mount. */
const RowRegistry = React.createContext<Map<string, HTMLElement> | null>(null)

const styleCache = new Map<string, React.CSSProperties>()
/** A virtualized row's position; the same object for the same place. */
function virtualStyle(top: number, height: number) {
  const key = `${top}:${height}`
  let style = styleCache.get(key)
  if (!style) {
    style = { position: "absolute", top, insetInline: 0, height, margin: 0 }
    if (styleCache.size > 5000) styleCache.clear()
    styleCache.set(key, style)
  }
  return style
}

export { TreeRoot, RowRegistry }
export type { TreeRootProps, TreeRootState }
