"use client"

/**
 * Internal to `@tecton/react` (not in the package `exports` map): drag to
 * reorder a row or a column of items, with a mouse, a pen or a finger. The
 * caller owns the order; the hook moves the items with transforms while the
 * pointer is down and reports one move when it is released.
 *
 * - The dragged item follows the pointer along the axis, clamped to the
 *   items' extent (a scrolling or clipping container would hide it).
 * - Another item is passed once the dragged item's leading edge crosses its
 *   middle (its trailing edge, for the items after it), so the first and the
 *   last slot are reachable whatever the sizes.
 * - The items between the old and the new slot step aside by the dragged
 *   item's size.
 * - Touch: items need `touch-action` set to the returned `touchAction`, so a
 *   drag along the axis reaches the page instead of panning it; panning
 *   across the axis still scrolls. A cancelled pointer (the browser took the
 *   gesture) puts everything back.
 *
 * The dragged item carries `data-dragging` while it moves.
 */
import * as React from "react"

type DragReorderAxis = "x" | "y"

type DragReorderOptions = {
  /** The items that can move, in DOM order, read when a drag starts. */
  getItems: () => Array<HTMLElement>
  /** Default `"x"`. */
  axis?: DragReorderAxis
  /** Reading direction, for `axis="x"`: in RTL the first item is rightmost. */
  direction?: "ltr" | "rtl"
  /** Pointer travel, in px, before a press becomes a drag. Default 4. */
  threshold?: number
  /** Checked when a press starts; `false` leaves the press alone. */
  enabled?: () => boolean
  /**
   * Called on release when the item moved: `from` and `to` index into the
   * items `getItems` returned.
   */
  onReorder: (from: number, to: number, items: Array<HTMLElement>) => void
}

type DragReorder = {
  /** Put on each item (or on a parent and pass the item's element). */
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  /** Ends a drag in progress without moving anything. */
  cancel: () => void
  /** The `touch-action` the items need for touch drags. */
  touchAction: "pan-y" | "pan-x"
}

type Box = { start: number; end: number; mid: number }

function boxOf(element: Element, axis: DragReorderAxis): Box {
  const rect = element.getBoundingClientRect()
  const start = axis === "x" ? rect.left : rect.top
  const end = axis === "x" ? rect.right : rect.bottom
  return { start, end, mid: (start + end) / 2 }
}

/**
 * The slot the dragged item lands in, from where its edges are now.
 * `reversed` is true when the first item is physically last (RTL).
 */
function targetSlot(
  boxes: Array<Box>,
  index: number,
  start: number,
  end: number,
  reversed: boolean
) {
  let target = 0
  boxes.forEach((box, at) => {
    if (at < index) {
      const passed = reversed ? end > box.mid : start < box.mid
      if (!passed) target++
    } else if (at > index) {
      const passed = reversed ? start < box.mid : end > box.mid
      if (passed) target++
    }
  })
  return target
}

function useDragReorder({
  getItems,
  axis = "x",
  direction = "ltr",
  threshold = 4,
  enabled,
  onReorder,
}: DragReorderOptions): DragReorder {
  const options = React.useRef({
    getItems,
    axis,
    direction,
    threshold,
    enabled,
    onReorder,
  })
  React.useInsertionEffect(() => {
    options.current = {
      getItems,
      axis,
      direction,
      threshold,
      enabled,
      onReorder,
    }
  })
  const active = React.useRef<(() => void) | null>(null)

  const cancel = React.useCallback(() => active.current?.(), [])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = options.current
      // The primary button of a mouse; any touch or pen contact.
      if (active.current || event.button !== 0) return
      if (current.enabled && !current.enabled()) return
      const element = event.currentTarget
      const items = current.getItems()
      const index = items.indexOf(element)
      if (index < 0 || items.length < 2) return

      const { axis: along, threshold: slop } = current
      const reversed = along === "x" && current.direction === "rtl"
      const translate = along === "x" ? "translateX" : "translateY"
      const coordinate = (pointer: PointerEvent | React.PointerEvent) =>
        along === "x" ? pointer.clientX : pointer.clientY
      const doc = element.ownerDocument
      const pointerId = event.pointerId
      const origin = coordinate(event)
      const boxes = items.map((item) => boxOf(item, along))
      const own = boxes[index]
      const size = own.end - own.start
      const minDelta = Math.min(...boxes.map((box) => box.start)) - own.start
      const maxDelta = Math.max(...boxes.map((box) => box.end)) - own.end
      let started = false
      let target = index

      const onMove = (pointer: PointerEvent) => {
        if (pointer.pointerId !== pointerId) return
        const travel = coordinate(pointer) - origin
        if (!started) {
          if (Math.abs(travel) < slop) return
          started = true
          element.dataset.dragging = ""
          for (const item of items)
            if (item !== element) item.style.transition = "transform 150ms ease"
        }
        const delta = Math.min(Math.max(travel, minDelta), maxDelta)
        element.style.transform = `${translate}(${delta}px)`
        target = targetSlot(
          boxes,
          index,
          own.start + delta,
          own.end + delta,
          reversed
        )
        let slot = 0
        items.forEach((item, at) => {
          if (at === index) return
          const shift = (slot < target ? slot : slot + 1) - at
          item.style.transform = shift
            ? `${translate}(${shift * size * (reversed ? -1 : 1)}px)`
            : ""
          slot++
        })
      }

      const finish = (commit: boolean) => {
        active.current = null
        doc.removeEventListener("pointermove", onMove)
        doc.removeEventListener("pointerup", onUp)
        doc.removeEventListener("pointercancel", onCancel)
        if (!started) return
        for (const item of items) {
          item.style.transform = ""
          item.style.transition = ""
        }
        delete element.dataset.dragging
        if (commit && target !== index)
          options.current.onReorder(index, target, items)
      }
      const onUp = (pointer: PointerEvent) => {
        if (pointer.pointerId === pointerId) finish(true)
      }
      const onCancel = (pointer: PointerEvent) => {
        if (pointer.pointerId === pointerId) finish(false)
      }

      active.current = () => finish(false)
      doc.addEventListener("pointermove", onMove)
      doc.addEventListener("pointerup", onUp)
      doc.addEventListener("pointercancel", onCancel)
    },
    []
  )

  React.useEffect(() => () => active.current?.(), [])

  return {
    onPointerDown,
    cancel,
    touchAction: axis === "x" ? "pan-y" : "pan-x",
  }
}

export { useDragReorder, targetSlot }
export type { DragReorder, DragReorderAxis, DragReorderOptions }
