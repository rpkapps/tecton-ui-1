"use client"

/**
 * What the rows and the on-demand row reordering share (`reorderableRows`):
 * each row's element, the rows a drop goes between, and the drag once its
 * code has loaded (`row-reorder.tsx`, the `dragAndDrop` feature of
 * `lazy.ts`).
 *
 * Each row has a drag handle in a column of its own at its start, drawn
 * from the first paint; only its handlers wait for the code, which loads in
 * idle time once the table is shown, and a press before then waits for it
 * (`drag-wait.ts`). The handle is one of its cell's controls: the grid's
 * arrow keys reach it, Enter or Space on it starts moving the row with the
 * keyboard. Nothing here imports drag and drop.
 *
 * Rows move only in the order of the items: while the view sorts, searches,
 * filters or groups, the handles are not drawn (the column stays, so the
 * table does not shift). A drop reports every item's id in the new order
 * (`onRowOrderChange`); the rows shown may be a page of them.
 */
import * as React from "react"
import { cn } from "cn"
import { GripVerticalIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/button"

import { useTranslations } from "../i18n/translations"
import type { ListDropPlace } from "../primitives/drag-and-drop/list-strategy"
import type { DragAndDrop } from "../primitives/drag-and-drop/use-drag-and-drop"
import { createStore, useStore, type Store } from "../store"
import type { TableGridController } from "../table-grid"
import type { DataTableActions, DataTableRowOrderChangeReason } from "./context"
import { createDragWait } from "./drag-wait"
import type { DataTableView } from "./engine/index"

/** A drop between the rows shown: gap `g` is before the `g`th, `n` after the last. */
type RowDrag = DragAndDrop<ListDropPlace>

type RowOrderState = {
  /** The row being dragged. */
  dragging: string | null
  /** Bumped as rows mount and unmount: where a drop line goes may change. */
  rendered: number
}

/** What the rows are now, set by the content on every render. */
type RowOrderSnapshot = {
  /** The item rows shown (the page's), in order. */
  shown: ReadonlyArray<string>
  /** Every item's id in order: what a drop reorders. */
  all: () => ReadonlyArray<string>
  /** A row's name, for its handle and the drop targets. */
  label: (id: string) => string
}

type RowOrder = {
  store: Store<RowOrderState>
  snapshot: { current: RowOrderSnapshot }
  /** The ref of a row's `tr`. */
  register: (id: string) => (element: HTMLElement | null) => void
  element: (id: string) => HTMLElement | null
  /** The table's frame, where the drop line is drawn. */
  frame: () => HTMLElement | null
  /** Scrolls a row into view, rendered or not (a virtualized body). */
  scrollToRow: (id: string) => void
  /** Reports the order after `id` is dropped into `gap` of the rows shown. */
  drop: (id: string, gap: number, reason: DataTableRowOrderChangeReason) => void
  /** The drag, from its on-demand code; returns the disconnect. */
  connect: (drag: RowDrag) => () => void
  drag: () => RowDrag | undefined
  setDragging: (id: string | null) => void
  /** A press on a handle before the code has arrived: asks for it and waits. */
  wait: (
    id: string,
    element: HTMLElement,
    press: { key: string } | { pointer: React.PointerEvent<HTMLElement> }
  ) => void
}

/** `order` with `id` moved into `gap` of `shown` (a run of `order`). */
function moveRow(
  order: ReadonlyArray<string>,
  shown: ReadonlyArray<string>,
  id: string,
  gap: number
) {
  const rest = order.filter((other) => other !== id)
  const after = shown
    .slice(0, gap)
    .filter((other) => other !== id)
    .at(-1)
  const before = shown.slice(gap).find((other) => other !== id)
  const at =
    before !== undefined
      ? rest.indexOf(before)
      : after !== undefined
        ? rest.indexOf(after) + 1
        : -1
  if (at < 0) return [...order]
  rest.splice(at, 0, id)
  return rest
}

function createRowOrder(
  actions: DataTableActions<unknown>,
  frame: () => HTMLElement | null,
  grid: { current: TableGridController | null },
  /** Asks for the code now. */
  load: () => void
): RowOrder {
  const store = createStore<RowOrderState>({ dragging: null, rendered: 0 })
  const elements = new Map<string, HTMLElement>()
  const refs = new Map<string, (element: HTMLElement | null) => void>()
  const snapshot: { current: RowOrderSnapshot } = {
    current: { shown: [], all: () => [], label: (id) => id },
  }
  const waiting = createDragWait<RowDrag>(true)
  let drag: RowDrag | undefined
  // Rows mount and unmount many at a time: one update for them all.
  let queued = false
  const changed = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      store.set({ rendered: store.get().rendered + 1 })
    })
  }
  return {
    store,
    snapshot,
    frame,
    register(id) {
      let ref = refs.get(id)
      if (!ref) {
        ref = (element) => {
          if (element) elements.set(id, element)
          else {
            // Gone (scrolled out, filtered away): a later row gets a new ref.
            elements.delete(id)
            refs.delete(id)
          }
          changed()
        }
        refs.set(id, ref)
      }
      return ref
    },
    element: (id) => elements.get(id) ?? null,
    scrollToRow: (id) => grid.current?.scrollToRow(id),
    drop(id, gap, reason) {
      const { shown, all } = snapshot.current
      const order = all()
      const next = moveRow(order, shown, id, gap)
      if (next.every((other, index) => other === order[index])) return
      actions.reorderRows(next, reason)
    },
    connect(next) {
      drag = next
      const id = waiting.waiting()
      const element = id === null ? null : elements.get(id)
      const handle = element?.querySelector<HTMLElement>(HANDLE)
      if (handle) waiting.start(next, handle)
      return () => {
        if (drag === next) drag = undefined
      }
    },
    drag: () => drag,
    setDragging: (id) => store.set({ dragging: id }),
    wait(id, element, press) {
      waiting.wait(id, element, press)
      load()
    },
  }
}

const HANDLE = '[data-slot="data-table-row-handle"]'

/** Whether the rows show in the items' order, where they can be moved. */
function inItemOrder(view: DataTableView) {
  return (
    view.sorting.length === 0 &&
    view.search.trim() === "" &&
    Object.keys(view.filters).length === 0 &&
    view.grouping.length === 0
  )
}

/** A row's drag handle (see the module comment). */
function DataTableRowHandle({
  order,
  id,
  label,
  size,
}: {
  order: RowOrder
  id: string
  /** The row's name: the handle is "Drag {label}". */
  label: string
  size: "default" | "sm"
}) {
  const t = useTranslations("dragAndDrop")
  const dragging = useStore(order.store, (state) => state.dragging === id)
  return (
    <button
      type="button"
      data-slot="data-table-row-handle"
      data-dragging={dragging ? "" : undefined}
      tabIndex={-1}
      aria-label={t("dragItem", { itemText: label })}
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: size === "sm" ? "icon-xs" : "icon-sm",
        }),
        "cursor-grab touch-none text-muted-foreground data-dragging:cursor-grabbing"
      )}
      onPointerDown={(event) => {
        const drag = order.drag()
        if (drag) drag.onPointerDown(event, id, { handle: true })
        else if (event.button === 0)
          order.wait(id, event.currentTarget, { pointer: event })
      }}
      // A link or an image inside the row would start the browser's own drag.
      onDragStart={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        const drag = order.drag()
        if (drag) return drag.onHandleKeyDown(event, id)
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        event.stopPropagation()
        order.wait(id, event.currentTarget, { key: event.key })
      }}
      onClick={(event) => order.drag()?.onHandleClick(event, id)}
    >
      <GripVerticalIcon aria-hidden />
    </button>
  )
}

export { createRowOrder, DataTableRowHandle, inItemOrder, moveRow }
export type { RowDrag, RowOrder, RowOrderSnapshot }
