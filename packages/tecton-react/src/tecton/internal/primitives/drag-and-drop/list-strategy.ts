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
 */
import type { Translator } from "../../i18n/translations"
import type { Point } from "./pointer-drag"
import type { DropStrategy } from "./use-drag-and-drop"

type ListDropPlace = { gap: number }

type ListItem = { value: string; element: HTMLElement; label: string }

type ListStrategyOptions = {
  /** The items shown, in order. */
  items: () => ReadonlyArray<ListItem>
  /** "y": a column of items (rows); "x": a row of items (columns). */
  axis: () => "x" | "y"
  /** Reading direction, for `axis="x"`: in RTL the first item is rightmost. */
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

    isSame: (a, b) => a.gap === b.gap,

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
  gap: number,
  axis: "x" | "y",
  direction: "ltr" | "rtl"
): { top: number; left: number; right?: number; bottom?: number } | null {
  if (!list.length) return null
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
export type { ListDropPlace, ListItem, ListStrategyOptions }
