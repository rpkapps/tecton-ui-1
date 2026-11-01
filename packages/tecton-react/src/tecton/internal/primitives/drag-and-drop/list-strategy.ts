/**
 * Internal to `@tecton/react`: the drop strategy of a flat list (table rows,
 * table columns, a stack of items) for `useDragAndDrop`. A drop goes into a
 * gap between the items shown: gap `g` is before the `g`th item shown, gap
 * `n` after the last. The two gaps next to the dragged item would leave it
 * where it is, so they are not places.
 *
 * The items shown may be a subset of the order (a page of rows, the visible
 * columns): a drop moves the item in the whole order, before the item shown
 * after the gap, or after the item shown before it.
 *
 * A grid (`axis: "grid"`) is items laid out in two dimensions, in reading
 * order: a CSS grid of cards, a wrapping flex row, a bento grid of tiles of
 * several sizes. The pointer drops before or after the item under it (the
 * nearest one, over a gap), by the half of it the pointer is on; the line
 * is drawn on that side of the item, as tall as it (`end`: after the item
 * before the gap, which may sit apart from the item after it). The arrow
 * keys across the rows aim the nearest gap above or below (`move`).
 */
import type { Translator } from "../../i18n/translations"
import { nearestTo, type Point } from "./pointer-drag"
import type { DropStrategy } from "./use-drag-and-drop"

type ListDropPlace = {
  gap: number
  /** In a grid: drawn at the end of the row above the gap, not the start of the next. */
  end?: boolean
}

type ListItem = { value: string; element: HTMLElement; label: string }

type ListAxis = "x" | "y" | "grid"

type Line = { x: number; top: number; bottom: number }

/** The space between items side by side: the narrowest one in the grid. */
function spacingOf(rects: ReadonlyArray<DOMRect>) {
  let spacing = Infinity
  for (let at = 1; at < rects.length; at++) {
    const [a, b] = [rects[at - 1], rects[at]]
    if (Math.min(a.bottom, b.bottom) <= Math.max(a.top, b.top)) continue
    const apart = Math.max(b.left - a.right, a.left - b.right)
    if (apart >= 0) spacing = Math.min(spacing, apart)
  }
  return Number.isFinite(spacing) ? spacing : 0
}

/**
 * The line of a grid's gap, in viewport px. Between two items side by side
 * it is halfway between them, over the height they share; elsewhere it is
 * half the grid's spacing outside the item it belongs to (the one after the
 * gap; the one before with `end`), as tall as that item.
 */
function gridLine(
  rects: ReadonlyArray<DOMRect>,
  { gap, end = false }: ListDropPlace,
  rtl: boolean
): Line | null {
  const before = gap > 0 ? rects.at(gap - 1) : undefined
  const after = gap < rects.length ? rects.at(gap) : undefined
  if (!before && !after) return null
  const leading = (rect: DOMRect) => (rtl ? rect.right : rect.left)
  const trailing = (rect: DOMRect) => (rtl ? rect.left : rect.right)
  const sign = rtl ? -1 : 1
  const spacing = spacingOf(rects)
  if (before && after) {
    const top = Math.max(before.top, after.top)
    const bottom = Math.min(before.bottom, after.bottom)
    const apart = (leading(after) - trailing(before)) * sign
    // Side by side: the item after the gap follows the one before it.
    if (bottom > top && apart >= -1 && apart <= spacing + 1)
      return { x: (trailing(before) + leading(after)) / 2, top, bottom }
  }
  if (before && (end || !after))
    return {
      x: trailing(before) + (sign * spacing) / 2,
      top: before.top,
      bottom: before.bottom,
    }
  if (!after) return null
  return {
    x: leading(after) - (sign * spacing) / 2,
    top: after.top,
    bottom: after.bottom,
  }
}

type ListStrategyOptions = {
  /** The items shown, in order. */
  items: () => ReadonlyArray<ListItem>
  /**
   * "y": a column of items (rows); "x": a row of items (columns); "grid":
   * items in two dimensions (rows that wrap, tiles of several sizes).
   */
  axis: () => ListAxis
  /** Reading direction, for "x" and "grid": in RTL the first item is rightmost. */
  direction: () => "ltr" | "rtl"
}

/**
 * `order` with `key` moved into `gap` of `shown` (the keys shown, in order,
 * a subset of `order`). Returns `order` itself when nothing moves.
 */
function moveInList(
  order: ReadonlyArray<string>,
  shown: ReadonlyArray<string>,
  key: string,
  gap: number
): Array<string> {
  const from = order.indexOf(key)
  if (from < 0 || gap < 0 || gap > shown.length) return [...order]
  const rest = order.filter((value) => value !== key)
  const before = shown.at(gap)
  const after = gap > 0 ? shown.at(gap - 1) : undefined
  let to: number
  if (gap < shown.length && before !== undefined && before !== key)
    to = rest.indexOf(before)
  else if (after !== undefined && after !== key) to = rest.indexOf(after) + 1
  else return [...order]
  if (to < 0) return [...order]
  rest.splice(to, 0, key)
  return rest
}

/** The gaps that would leave the item shown at `index` where it is. */
function isStay(index: number, gap: number) {
  return gap === index || gap === index + 1
}

function createListStrategy({
  items,
  axis,
  direction,
}: ListStrategyOptions): DropStrategy<ListDropPlace> {
  const indexOf = (dragging: ReadonlyArray<string>) =>
    items().findIndex((item) => item.value === dragging[0])

  return {
    placeAt(point: Point, dragging) {
      const list = items()
      const index = indexOf(dragging)
      if (!list.length) return null
      if (axis() === "grid") {
        const rtl = direction() === "rtl"
        // The item under the pointer, or the nearest one.
        const at = nearestTo(
          list.map((item) => item.element),
          point
        ).index
        // Before it or after it, by the half of it the pointer is on.
        const rect = list[at].element.getBoundingClientRect()
        const mid = rect.left + rect.width / 2
        const after = rtl ? point.x < mid : point.x > mid
        const gap = after ? at + 1 : at
        if (index >= 0 && isStay(index, gap)) return null
        return after && gap < list.length ? { gap, end: true } : { gap }
      }
      const horizontal = axis() === "x"
      const rtl = horizontal && direction() === "rtl"
      // The first item whose middle the pointer has not passed.
      let gap = list.findIndex(({ element }) => {
        const rect = element.getBoundingClientRect()
        if (!horizontal) return point.y < rect.top + rect.height / 2
        const mid = rect.left + rect.width / 2
        return rtl ? point.x > mid : point.x < mid
      })
      if (gap < 0) gap = list.length
      if (index >= 0 && isStay(index, gap)) return null
      return { gap }
    },

    places(dragging) {
      const list = items()
      const index = indexOf(dragging)
      const places: Array<ListDropPlace> = []
      let start = -1
      for (let gap = 0; gap <= list.length; gap++) {
        if (index >= 0 && isStay(index, gap)) continue
        if (start < 0 && gap > index) start = places.length
        places.push({ gap })
      }
      return {
        places,
        start: start < 0 ? Math.max(places.length - 1, 0) : start,
      }
    },

    isSame: (a, b) => a.gap === b.gap && !!a.end === !!b.end,
    // The end of a grid row and the start of the next are one stop.
    isStop: (a, b) => a.gap === b.gap,

    // In a grid, Up and Down aim the nearest gap whose line is above or
    // below the aimed one's.
    move(event, place, dragging) {
      if (axis() !== "grid" || !place) return undefined
      const up = event.key === "ArrowUp"
      if (!up && event.key !== "ArrowDown") return undefined
      const list = items()
      const rects = list.map(({ element }) => element.getBoundingClientRect())
      const rtl = direction() === "rtl"
      const line = gridLine(rects, place, rtl)
      if (!line) return place
      const middle = (line.top + line.bottom) / 2
      const index = list.findIndex((item) => item.value === dragging[0])
      let best: ListDropPlace = place
      let score = Infinity
      for (let gap = 0; gap <= list.length; gap++) {
        if (index >= 0 && isStay(index, gap)) continue
        for (const end of gap > 0 && gap < list.length
          ? [false, true]
          : [false]) {
          const candidate: ListDropPlace = end ? { gap, end } : { gap }
          const other = gridLine(rects, candidate, rtl)
          // Wholly past the aimed line's middle, up or down.
          if (!other || (up ? other.bottom > middle : other.top < middle))
            continue
          const dy = up ? line.top - other.bottom : other.top - line.bottom
          // The nearest row first, then the nearest along it.
          const s = Math.max(dy, 0) * 2 + Math.abs(other.x - line.x)
          if (s < score) [best, score] = [candidate, s]
        }
      }
      return best
    },

    label({ gap }, t: Translator<"dragAndDrop">) {
      const list = items()
      const before = list.at(gap - 1)
      const after = gap < list.length ? list.at(gap) : undefined
      if (gap > 0 && before && after)
        return t("insertBetween", {
          beforeItemText: before.label,
          afterItemText: after.label,
        })
      if (after) return t("insertBefore", { itemText: after.label })
      if (before) return t("insertAfter", { itemText: before.label })
      return ""
    },
  }
}

/**
 * Where the line of `gap` goes, in px from `container`'s padding box: across
 * the container at the gap for a column of items, down it for a row. Between
 * two items the line sits halfway across the space between them (their
 * `gap`, margins); before the first item or past the last, on its edge.
 */
function listPlacement(
  container: HTMLElement,
  list: ReadonlyArray<ListItem>,
  place: ListDropPlace,
  axis: ListAxis,
  direction: "ltr" | "rtl"
): {
  top: number
  left: number
  right?: number
  bottom?: number
  height?: number
} | null {
  if (!list.length) return null
  const { gap } = place
  const box = container.getBoundingClientRect()
  const after =
    gap < list.length ? list[gap].element.getBoundingClientRect() : null
  const before =
    gap > 0
      ? list[Math.min(gap, list.length) - 1].element.getBoundingClientRect()
      : null
  // Kept 1 px inside the container: a rounded, clipping frame around it
  // would hide half of the line at its first and last gaps.
  const inside = (at: number, size: number) =>
    Math.min(Math.max(at, 1), Math.max(size - 1, 1))
  if (axis === "grid") {
    const rects = list.map(({ element }) => element.getBoundingClientRect())
    const line = gridLine(rects, place, direction === "rtl")
    if (!line) return null
    return {
      left: inside(
        line.x - box.left - container.clientLeft + container.scrollLeft,
        Math.max(container.scrollWidth, box.width)
      ),
      top: line.top - box.top - container.clientTop + container.scrollTop,
      height: line.bottom - line.top,
    }
  }
  /** Halfway between the end edge before the gap and the start edge after. */
  const between = (end: number | undefined, start: number | undefined) =>
    end !== undefined && start !== undefined
      ? (end + start) / 2
      : (start ?? end ?? 0)
  if (axis === "y") {
    const y = between(before?.bottom, after?.top)
    return {
      top: inside(
        y - box.top - container.clientTop + container.scrollTop,
        Math.max(container.scrollHeight, box.height)
      ),
      left: 0,
      right: 0,
    }
  }
  const rtl = direction === "rtl"
  // The end edge of the item before the gap and the start edge of the item
  // after it.
  const x = between(
    rtl ? before?.left : before?.right,
    rtl ? after?.right : after?.left
  )
  return {
    left: inside(
      x - box.left - container.clientLeft + container.scrollLeft,
      Math.max(container.scrollWidth, box.width)
    ),
    top: 0,
    bottom: 0,
  }
}

export { createListStrategy, listPlacement, moveInList }
export type { ListAxis, ListDropPlace, ListItem, ListStrategyOptions }
