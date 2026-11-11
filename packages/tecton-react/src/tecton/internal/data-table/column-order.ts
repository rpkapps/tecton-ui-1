"use client"

/**
 * What the headers and the on-demand column reordering share
 * (`reorderableColumns`): the header cells, the list each column or group
 * moves within, and the drag of each list once its code has loaded
 * (`column-reorder.tsx`, the `dragAndDrop` feature of `lazy.ts`).
 *
 * The headers render as they will from the first paint (a tab stop, the
 * grab cursor): only their handlers wait for the code, which loads in idle
 * time once the table is shown. A press before it has arrived asks for it
 * and waits: Enter or Space starts the keyboard drag once it has (unless
 * focus has left the header or another key was pressed since), and a
 * pointer press starts dragging then if the pointer is still down. Nothing
 * here imports drag and drop.
 *
 * A column moves among its siblings: the columns and groups of its group,
 * or of the top level; a group moves with its columns. Pinned columns, and
 * a group split around them, stay where they are.
 */
import type * as React from "react"

import type { ListDropPlace } from "../primitives/drag-and-drop/list-strategy"
import type { DragAndDrop } from "../primitives/drag-and-drop/use-drag-and-drop"
import { createStore, useStore, type Store } from "../store"
import type { DataTableActions } from "./context"
import {
  getColumnModel,
  orderSiblings,
  parentOf,
  setColumnOrder,
  siblingsInOrder,
  type ColumnLayout,
  type DataTableColumns,
} from "./engine/index"

type ColumnDrag = DragAndDrop<ListDropPlace>

/** The columns and groups that can move now, and their names. */
type ColumnOrderSnapshot = {
  columns: DataTableColumns<unknown>
  /** The ids of the columns and groups the user can drag, each in one header cell. */
  movable: ReadonlySet<string>
  labels: ReadonlyMap<string, string>
}

type ColumnOrderState = {
  /** The column or group being dragged. */
  dragging: string | null
  /** The lists that have something to move: a group's id, `null` for the top level. */
  lists: ReadonlyArray<string | null>
}

type ColumnOrder = {
  store: Store<ColumnOrderState>
  /** The ref of a column's or group's header cell. */
  register: (id: string) => (element: HTMLElement | null) => void
  element: (id: string) => HTMLElement | null
  /** The table's frame, where the drop line is drawn. */
  frame: () => HTMLElement | null
  /** A list's items shown, in order: what a drop goes between. */
  items: (
    list: string | null
  ) => Array<{ value: string; element: HTMLElement; label: string }>
  /** A list's columns and groups in the view's order, shown or not. */
  siblings: (list: string | null) => Array<string>
  /** Puts a list's columns and groups in a new order (a drop). */
  reorder: (list: string | null, siblings: ReadonlyArray<string>) => void
  /** A list's drag, from its on-demand code; returns the disconnect. */
  connect: (list: string | null, drag: ColumnDrag) => () => void
  /** The drag of the list `id` is in, once loaded. */
  drag: (id: string) => ColumnDrag | undefined
  setDragging: (id: string | null) => void
  /**
   * A press on `id`'s header before the code has arrived: asks for it, and
   * starts the drag once it has (a pointer press, if the pointer is still
   * down).
   */
  wait: (
    id: string,
    press: { key: string } | { pointer: React.PointerEvent<HTMLElement> }
  ) => void
  /** The latest columns, set by the content on every render. */
  snapshot: { current: ColumnOrderSnapshot }
}

function createColumnOrder(
  actions: DataTableActions<unknown>,
  frame: () => HTMLElement | null,
  /** Asks for the code now. */
  load: () => void,
  initial: ColumnOrderSnapshot
): ColumnOrder {
  const store = createStore<ColumnOrderState>({ dragging: null, lists: [] })
  const elements = new Map<string, HTMLElement>()
  const refs = new Map<string, (element: HTMLElement | null) => void>()
  const drags = new Map<string | null, ColumnDrag>()
  const snapshot = { current: initial }
  const model = () => getColumnModel(snapshot.current.columns)
  /** The press waiting for the code, and how to stop waiting. */
  let waiting: {
    id: string
    start: (drag: ColumnDrag, element: HTMLElement) => void
    stop: () => void
  } | null = null
  const stopWaiting = () => {
    waiting?.stop()
    waiting = null
  }

  return {
    store,
    snapshot,
    frame,
    wait(id, press) {
      stopWaiting()
      if ("key" in press) {
        const { key } = press
        // Given up when focus leaves the header or another key is pressed.
        const element = elements.get(id)
        const view = element?.ownerDocument.defaultView ?? window
        const cancel = () => stopWaiting()
        element?.addEventListener("focusout", cancel)
        view.addEventListener("keydown", cancel, true)
        waiting = {
          id,
          // What a keyboard drag reads of the key that starts it.
          start: (drag, element) =>
            drag.onHandleKeyDown(
              {
                key,
                currentTarget: element,
                preventDefault: () => undefined,
                stopPropagation: () => undefined,
              } as unknown as React.KeyboardEvent<HTMLElement>,
              id
            ),
          stop: () => {
            element?.removeEventListener("focusout", cancel)
            view.removeEventListener("keydown", cancel, true)
          },
        }
      } else {
        const { pointer } = press
        const view = pointer.currentTarget.ownerDocument.defaultView ?? window
        // Let go before the code arrives: a click, no drag.
        const release = (event: PointerEvent) => {
          if (event.pointerId === pointer.pointerId) stopWaiting()
        }
        const stop = () => {
          view.removeEventListener("pointerup", release, true)
          view.removeEventListener("pointercancel", release, true)
        }
        view.addEventListener("pointerup", release, true)
        view.addEventListener("pointercancel", release, true)
        waiting = {
          id,
          start: (drag) => drag.onPointerDown(pointer, id),
          stop,
        }
      }
      load()
    },
    register(id) {
      let ref = refs.get(id)
      if (!ref) {
        ref = (element) => {
          if (element) elements.set(id, element)
          else elements.delete(id)
        }
        refs.set(id, ref)
      }
      return ref
    },
    element: (id) => elements.get(id) ?? null,
    items(list) {
      const { movable, labels } = snapshot.current
      return this.siblings(list).flatMap((id) => {
        const element = elements.get(id)
        return element && movable.has(id)
          ? [{ value: id, element, label: labels.get(id) ?? id }]
          : []
      })
    },
    siblings(list) {
      // The order as the table has it now: a drop builds on the last one.
      return siblingsInOrder(model(), actions.currentView().columns.order, list)
    },
    reorder(list, siblings) {
      const columns = model()
      actions.updateView(
        (view) =>
          setColumnOrder(
            view,
            orderSiblings(columns, view.columns.order, list, siblings)
          ),
        "reorder"
      )
    },
    connect(list, drag) {
      drags.set(list, drag)
      const press = waiting
      const element = press && elements.get(press.id)
      if (press && element && parentOf(model(), press.id) === list) {
        stopWaiting()
        press.start(drag, element)
      }
      return () => {
        if (drags.get(list) === drag) drags.delete(list)
      }
    },
    drag: (id) => drags.get(parentOf(model(), id)),
    setDragging: (id) => store.set({ dragging: id }),
  }
}

/**
 * The columns and groups the user can drag: with `reorderableColumns`,
 * every shown column not pinned and not opted out (`reorderable: false`),
 * and every group shown in one header cell (not split around pinned or
 * moved columns) whose shown columns are all unpinned.
 */
function movableColumns<T>(
  columns: DataTableColumns<T>,
  layout: ColumnLayout<T>
): ColumnOrderSnapshot {
  const model = getColumnModel(columns)
  const movable = new Set<string>()
  const labels = new Map<string, string>()
  const pinned = new Set<string>()
  layout.columns.forEach((column, index) => {
    labels.set(column.id, column.header)
    if (
      index < layout.pinnedStart ||
      index >= layout.columns.length - layout.pinnedEnd
    )
      pinned.add(column.id)
    else if (column.reorderable) movable.add(column.id)
  })
  const cells = new Map<string, number>()
  for (const row of layout.headerRows)
    for (const cell of row.cells)
      if (cell.kind === "group" && cell.id !== null)
        cells.set(cell.id, (cells.get(cell.id) ?? 0) + 1)
  for (const [id, count] of cells) {
    const group = model.groups.get(id)
    if (!group) continue
    labels.set(id, group.header)
    if (count === 1 && !group.columns.some((leaf) => pinned.has(leaf)))
      movable.add(id)
  }
  return { columns: columns as DataTableColumns<unknown>, movable, labels }
}

/** The lists with something to move, as a key that stays while they do. */
function listsOf<T>(
  columns: DataTableColumns<T>,
  movable: ReadonlySet<string>
) {
  const model = getColumnModel(columns)
  const lists = new Set<string | null>()
  for (const id of movable) lists.add(parentOf(model, id))
  return [...lists]
}

/** For a header cell that is not a reorderable one. */
const NO_ORDER_STORE = createStore<ColumnOrderState>({
  dragging: null,
  lists: [],
})

/** Whether `id`'s header cell is being dragged. */
function useColumnDragging(order: ColumnOrder | null, id: string) {
  return useStore(
    order?.store ?? NO_ORDER_STORE,
    (state) => state.dragging === id
  )
}

/**
 * Fields keep their presses: a drag from one would fight selecting its
 * text. Buttons do not: a press on the sort button that moves drags the
 * column, one that does not is its click.
 */
function isOwnField(event: React.SyntheticEvent<HTMLElement>) {
  const field = (event.target as Element).closest(
    'input, select, textarea, [contenteditable="true"]'
  )
  return (
    !!field &&
    field !== event.currentTarget &&
    event.currentTarget.contains(field)
  )
}

/**
 * The props of a header cell that is its own drag handle: dragged from
 * anywhere on it (a press that does not move stays a click), Enter or Space
 * on the cell starts a keyboard drag, and a screen reader's activation a
 * virtual one. Before the code has loaded, a press asks for it.
 */
function columnDragProps(order: ColumnOrder, id: string) {
  return {
    ref: order.register(id),
    tabIndex: 0,
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (isOwnField(event)) return
      const drag = order.drag(id)
      if (drag) drag.onPointerDown(event, id)
      else if (event.button === 0) order.wait(id, { pointer: event })
    },
    // A link or an image inside would start the browser's own drag.
    onDragStart: (event: React.DragEvent<HTMLElement>) =>
      event.preventDefault(),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return
      const drag = order.drag(id)
      if (drag) drag.onHandleKeyDown(event, id)
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        event.stopPropagation()
        order.wait(id, { key: event.key })
      }
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      if (event.target === event.currentTarget)
        order.drag(id)?.onHandleClick(event, id)
    },
  }
}

export {
  columnDragProps,
  createColumnOrder,
  listsOf,
  movableColumns,
  useColumnDragging,
}
export type { ColumnDrag, ColumnOrder, ColumnOrderSnapshot }
