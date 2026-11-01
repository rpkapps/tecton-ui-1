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
 * A grid (`axis: "grid"`) is items in rows that wrap, in reading order (a
 * CSS grid, a wrapping flex row). The pointer picks the row under it, then
 * the gap in that row; the gap after a row's last item is the one before
 * the next row's first, drawn where the pointer is (`end`: at the end of
 * the row above). The arrow keys across the rows aim the nearest gap of the
 * row above or below (`move`).
 */
import type { Translator } from "../../i18n/translations"
import type { Point } from "./pointer-drag"
import type { DropStrategy } from "./use-drag-and-drop"

type ListDropPlace = {
  gap: number
  /** In a grid: drawn at the end of the row above the gap, not the start of the next. */
  end?: boolean
}

type ListItem = { value: string; element: HTMLElement; label: string }

type ListAxis = "x" | "y" | "grid"

/** A row of a grid: the items shown from `start` to before `end`. */
type GridRow = { start: number; end: number; top: number; bottom: number }

/** The rows of a grid's items, top to bottom. */
function rowsOf(rects: ReadonlyArray<DOMRect>) {
  const rows: Array<GridRow> = []
  rects.forEach((rect, index) => {
    const row = rows.at(-1)
    const first = row && rects[row.start]
    // A new row starts below the middle of the row's first item.
    if (!row || !first || rect.top >= first.top + first.height / 2) {
      rows.push({
        start: index,
        end: index + 1,
        top: rect.top,
        bottom: rect.bottom,
      })
      return
    }
    row.end = index + 1
    row.top = Math.min(row.top, rect.top)
    row.bottom = Math.max(row.bottom, rect.bottom)
  })
  return rows
}

/** The row holding gap `gap` (`end`: the row it ends). */
function rowOfGap(rows: ReadonlyArray<GridRow>, gap: number, end = false) {
  return (
    rows.find((row) =>
      end ? gap === row.end : gap >= row.start && gap < row.end
    ) ?? rows.at(-1)
  )
}

/**
 * The line of a grid's gap, in viewport px: its inline position and the
 * height of its row. Between two items of a row it is halfway between them;
 * at a row's edge, half a column gap outside the item.
 */
function gridLine(
  rects: ReadonlyArray<DOMRect>,
  { gap, end = false }: ListDropPlace,
  rtl: boolean
) {
  const rows = rowsOf(rects)
  const row = rowOfGap(rows, gap, end || gap >= rects.length)
  if (!row) return null
  const leading = (rect: DOMRect) => (rtl ? rect.right : rect.left)
  const trailing = (rect: DOMRect) => (rtl ? rect.left : rect.right)
  // Half the space between two items of a row, signed along the reading
  // direction (none in a grid of one column).
  const pair = rows.find((r) => r.end - r.start > 1)
  const half = pair
    ? (leading(rects[pair.start + 1]) - trailing(rects[pair.start])) / 2
    : 0
  let x: number
  if (gap > row.start && gap < row.end)
    x = (trailing(rects[gap - 1]) + leading(rects[gap])) / 2
  else if (gap >= row.end) x = trailing(rects[row.end - 1]) + half
  else x = leading(rects[gap]) - half
  return { x, top: row.top, bottom: row.bottom }
}

type ListStrategyOptions = {
  /** The items shown, in order. */
  items: () => ReadonlyArray<ListItem>
  /**
   * "y": a column of items (rows); "x": a row of items (columns); "grid":
   * rows of items that wrap.
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
        const rects = list.map(({ element }) => element.getBoundingClientRect())
        const rows = rowsOf(rects)
        // The row under the pointer, or the nearest one.
        let row = rows[0]
        let distance = Infinity
        for (const r of rows) {
          const d = Math.max(r.top - point.y, 0, point.y - r.bottom)
          if (d < distance) [row, distance] = [r, d]
        }
        // In it, the first item whose middle the pointer has not passed.
        let gap = row.end
        for (let at = row.start; at < row.end; at++) {
          const mid = rects[at].left + rects[at].width / 2
          if (rtl ? point.x > mid : point.x < mid) {
            gap = at
            break
          }
        }
        if (index >= 0 && isStay(index, gap)) return null
        return gap === row.end && gap < list.length
          ? { gap, end: true }
          : { gap }
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

    // In a grid, Up and Down aim the gap of the row above or below nearest
    // the aimed one.
    move(event, place, dragging) {
      if (axis() !== "grid" || !place) return undefined
      const up = event.key === "ArrowUp"
      if (!up && event.key !== "ArrowDown") return undefined
      const list = items()
      const rects = list.map(({ element }) => element.getBoundingClientRect())
      const rtl = direction() === "rtl"
      const rows = rowsOf(rects)
      const row = rowOfGap(
        rows,
        place.gap,
        place.end || place.gap >= list.length
      )
      const line = gridLine(rects, place, rtl)
      if (!row || !line) return place
      const index = list.findIndex((item) => item.value === dragging[0])
      const allowed = (gap: number) => index < 0 || !isStay(index, gap)
      for (
        let at = rows.indexOf(row) + (up ? -1 : 1);
        at >= 0 && at < rows.length;
        at += up ? -1 : 1
      ) {
        const target = rows[at]
        let best: ListDropPlace | null = null
        let distance = Infinity
        for (let gap = target.start; gap <= target.end; gap++) {
          if (!allowed(gap)) continue
          const candidate: ListDropPlace =
            gap === target.end && gap < list.length
              ? { gap, end: true }
              : { gap }
          const x = gridLine(rects, candidate, rtl)?.x
          if (x === undefined) continue
          const d = Math.abs(x - line.x)
          if (d < distance) [best, distance] = [candidate, d]
        }
        if (best) return best
      }
      return place
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
