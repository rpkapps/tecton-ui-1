"use client"

/**
 * Column reordering, loaded on demand (`lazy.ts`, the `dragAndDrop`
 * feature): one drag and drop per list of columns that move among
 * themselves (the top level, each group's columns), on the shared
 * primitives Reorderable is built on. It renders beside the table, never
 * around it, so the table is not mounted again when this arrives: the
 * header cells (`column-order.ts`) find their list's drag here.
 *
 * Each list draws its drop line between the header cells it moves, down
 * the whole table, and names its drop targets for the keyboard and screen
 * readers ("Insert between Field and Status"). A drop moves the column, or
 * the group with its columns, in `view.columns.order`; a keyboard drop
 * puts focus back on the moved header.
 */
import * as React from "react"
import { cn } from "cn"

import { useDirection } from "@tecton/react/tecton/provider"

import * as DragAndDropPrimitive from "../primitives/drag-and-drop/index.parts"
import {
  createListStrategy,
  listPlacement,
  moveInList,
  type ListDropPlace,
} from "../primitives/drag-and-drop/list-strategy"
import { useDragAndDrop } from "../primitives/drag-and-drop/use-drag-and-drop"
import { useStore } from "../store"
import type { ColumnOrder } from "./column-order"

function ColumnList({
  order,
  list,
}: {
  order: ColumnOrder
  /** The group whose columns move; `null` for the top level. */
  list: string | null
}) {
  const direction = useDirection()
  const latest = React.useRef(direction)
  React.useInsertionEffect(() => {
    latest.current = direction
  })
  const [strategy] = React.useState(() =>
    createListStrategy({
      items: () => order.items(list),
      axis: () => "x",
      direction: () => latest.current,
    })
  )
  const drag = useDragAndDrop<ListDropPlace>({
    strategy,
    axis: "x",
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) => order.element(key),
    getContainer: order.frame,
    // In the frame (fixed, so not clipped by it): the drop line, drawn
    // over it, stays in view in any stacking context the page has.
    getPreviewContainer: order.frame,
    onDrop: (place, keys) => {
      const key = keys.at(0)
      if (key === undefined) return
      const shown = order.items(list).map((item) => item.value)
      order.reorder(
        list,
        moveInList(order.siblings(list), shown, key, place.gap)
      )
    },
    focusItem: (key) => order.element(key)?.focus(),
  })
  React.useLayoutEffect(() => order.connect(list, drag), [order, list, drag])
  // The dragged header carries `data-dragging`.
  React.useEffect(
    () =>
      drag.store.subscribe(() => {
        const { mode, dragging } = drag.store.get()
        order.setDragging(mode === null ? null : (dragging.at(0) ?? null))
      }),
    [order, drag]
  )
  const getPlacement = React.useCallback(
    (place: ListDropPlace) => {
      const frame = order.frame()
      return frame
        ? listPlacement(frame, order.items(list), place, "x", latest.current)
        : null
    },
    [order, list]
  )
  return (
    <DragAndDropPrimitive.DropIndicator
      data-slot="data-table-column-drop-indicator"
      // Over the dragged header's preview (z-50), which would hide it.
      className="z-[51] w-0"
      dragAndDrop={drag}
      getPlacement={getPlacement}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 -start-px w-0.5 rounded-full bg-primary-active",
          // A dot at its top, as a tree's drop line has at its start.
          "before:absolute before:top-0.5 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rounded-full before:border-2 before:border-primary-active before:bg-background"
        )}
      />
    </DragAndDropPrimitive.DropIndicator>
  )
}

/** The drag and drop of every list of columns with something to move. */
function DataTableColumnReorder({ order }: { order: ColumnOrder }) {
  const lists = useStore(order.store, (state) => state.lists)
  return lists.map((list) => (
    <ColumnList key={list ?? ""} order={order} list={list} />
  ))
}

export { DataTableColumnReorder }
