"use client"

/**
 * Row reordering, loaded on demand (`lazy.ts`, the `dragAndDrop` feature):
 * the drag and drop of the rows shown, on the shared primitives Reorderable
 * is built on. It renders beside the table, never around it, so the table
 * is not mounted again when this arrives: the handles (`row-order.tsx`)
 * find the drag here.
 *
 * A drop goes into a gap between the rows shown, every one of them, not
 * only those rendered (a virtualized body renders those in view): the
 * pointer aims at the rendered rows (the view scrolls at its edges, and the
 * rows come in), and a keyboard or screen reader drag steps through every
 * gap, scrolling the row after it into view. The drop line is drawn across
 * the frame where the gap's rows are rendered, and each drop target is
 * named after them ("Insert between Well 03 and Well 04").
 */
import * as React from "react"

import { useDirection } from "@tecton/react/tecton/provider"

import type { Translator } from "../i18n/translations"
import * as DragAndDropPrimitive from "../primitives/drag-and-drop/index.parts"
import {
  listPlacement,
  type ListDropPlace,
} from "../primitives/drag-and-drop/list-strategy"
import type { Point } from "../primitives/drag-and-drop/pointer-drag"
import {
  useDragAndDrop,
  type DropStrategy,
} from "../primitives/drag-and-drop/use-drag-and-drop"
import { useStore } from "../store"
import type { RowOrder } from "./row-order"

/** The gaps that would leave the row at `index` where it is. */
const isStay = (index: number, gap: number) =>
  gap === index || gap === index + 1

function createRowStrategy(order: RowOrder): DropStrategy<ListDropPlace> {
  const shown = () => order.snapshot.current.shown
  const indexOf = (dragging: ReadonlyArray<string>) =>
    shown().indexOf(dragging[0] ?? "")
  return {
    placeAt({ y }: Point, dragging) {
      const rows = shown()
      const index = indexOf(dragging)
      // The first rendered row whose middle the pointer has not passed.
      let last = -1
      let gap = -1
      for (let at = 0; at < rows.length; at++) {
        const element = order.element(rows[at])
        if (!element) continue
        const rect = element.getBoundingClientRect()
        if (y < rect.top + rect.height / 2) {
          gap = at
          break
        }
        last = at
      }
      if (gap < 0) {
        if (last < 0) return null
        gap = last + 1
      }
      return index >= 0 && isStay(index, gap) ? null : { gap }
    },
    // From the row's own place (a drop there moves nothing), one place a key.
    places(dragging) {
      const count = shown().length
      const index = indexOf(dragging)
      const places: Array<ListDropPlace> = []
      let start = 0
      for (let gap = 0; gap <= count; gap++) {
        if (index >= 0 && gap === index + 1) continue
        if (gap === index) start = places.length
        places.push({ gap })
      }
      return { places, start }
    },
    isSame: (a, b) => a.gap === b.gap,
    // Named after the rows around the place but the dragged one.
    label({ gap }, t: Translator<"dragAndDrop">, dragging) {
      const index = indexOf(dragging)
      const rows = shown().filter((id) => id !== dragging.at(0))
      const { label } = order.snapshot.current
      const at = index >= 0 && gap > index ? gap - 1 : gap
      const before = at > 0 ? rows.at(at - 1) : undefined
      const after = at < rows.length ? rows.at(at) : undefined
      if (before !== undefined && after !== undefined)
        return t("insertBetween", {
          beforeItemText: label(before),
          afterItemText: label(after),
        })
      if (after !== undefined)
        return t("insertBefore", { itemText: label(after) })
      if (before !== undefined)
        return t("insertAfter", { itemText: label(before) })
      return ""
    },
    // The keyboard and a screen reader's drop targets show the row after
    // the gap aimed (the last one, past the end).
    onAim(place, mode) {
      if (!place || mode === "pointer") return
      const rows = shown()
      const id = rows.at(Math.min(place.gap, rows.length - 1))
      if (id !== undefined) order.scrollToRow(id)
    },
  }
}

/** The drag and drop of the rows; renders the drop line and targets. */
function DataTableRowReorder({ order }: { order: RowOrder }) {
  const direction = useDirection()
  const [strategy] = React.useState(() => createRowStrategy(order))
  const drag = useDragAndDrop<ListDropPlace>({
    strategy,
    axis: "y",
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) => order.element(key),
    getContainer: order.frame,
    // In the frame (fixed, so not clipped by it): the drop line, drawn
    // over it, stays in view in any stacking context the page has.
    getPreviewContainer: order.frame,
    // Opaque, moving along the table only, and inside its frame.
    preview: { locked: true, clip: order.frame, solid: true },
    onDrop: (place, keys, details) => {
      const key = keys.at(0)
      if (key !== undefined) order.drop(key, place.gap, details.mode)
    },
    // Back on the moved row's handle, once the new order has rendered.
    focusItem: (key) =>
      setTimeout(() =>
        order
          .element(key)
          ?.querySelector<HTMLElement>('[data-slot="data-table-row-handle"]')
          ?.focus()
      ),
  })
  React.useLayoutEffect(() => order.connect(drag), [order, drag])
  // The dragged row's handle carries `data-dragging`.
  React.useEffect(
    () =>
      drag.store.subscribe(() => {
        const { mode, dragging } = drag.store.get()
        order.setDragging(mode === null ? null : (dragging.at(0) ?? null))
      }),
    [order, drag]
  )
  // Rows scrolled into view (a keyboard drag in a virtualized body) move
  // the line to them.
  const rendered = useStore(order.store, (state) => state.rendered)
  const getPlacement = React.useCallback(
    (place: ListDropPlace) => {
      void rendered
      const frame = order.frame()
      const rows = order.snapshot.current.shown
      const before =
        place.gap > 0 ? order.element(rows[place.gap - 1]) : undefined
      const after =
        place.gap < rows.length ? order.element(rows[place.gap]) : undefined
      // The rendered rows on either side of the gap, as a list of their own.
      const list = [before, after].flatMap((element) =>
        element ? [{ value: "", element, label: "" }] : []
      )
      if (!frame || !list.length) return null
      return listPlacement(frame, list, { gap: before ? 1 : 0 }, "y", direction)
    },
    [order, direction, rendered]
  )
  return (
    <DragAndDropPrimitive.DropIndicator
      data-slot="data-table-row-drop-indicator"
      // Over the dragged row's preview (z-50), which would hide it.
      className="z-[51] h-0"
      dragAndDrop={drag}
      getPlacement={getPlacement}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-0.5 rounded-full bg-primary-active"
      />
    </DragAndDropPrimitive.DropIndicator>
  )
}

export { createRowStrategy, DataTableRowReorder }
