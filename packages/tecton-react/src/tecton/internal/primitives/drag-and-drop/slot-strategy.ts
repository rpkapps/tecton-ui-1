/**
 * Internal to `@tecton/react`: the drop strategy of a layout of slots whose
 * items swap (`Reorderable mode="swap"`), for `useDragAndDrop`. The slots
 * are fixed places, in document order; slot `i` holds item `value[i]`, or
 * none (`null`). A drop on a slot swaps the dragged item with the item
 * there, or moves it into an empty slot; only those two slots change.
 *
 * - Pointer: the slot under the pointer (the nearest one, over the gutter
 *   between slots); its own slot is no place.
 * - Keyboard: every slot, starting on the item's own ("Keep … here"); the
 *   arrow keys go to the nearest slot wholly that way, the same row or
 *   column first (`move`).
 */
import type { Translator } from "../../i18n/translations"
import { nearestTo, type Point } from "./pointer-drag"
import type { DropStrategy } from "./use-drag-and-drop"

type SlotDropPlace = { slot: number }

type SlotItem = {
  element: HTMLElement
  /** The item the slot holds, if any, and its name. */
  item: string | null
  itemLabel: string | null
  /** The slot's own name, for an empty slot. */
  label: string | undefined
}

type SlotStrategyOptions = {
  /** The slots, in document order. */
  slots: () => ReadonlyArray<SlotItem>
  /** Reorderable's strings, in the provider's locale. */
  t: () => Translator<"reorderable">
}

/** `value` with `key` swapped into `slot` (and the item there into its slot). */
function swapInList<T extends string | null>(
  value: ReadonlyArray<T>,
  key: string,
  slot: number
): Array<T> {
  const from = value.indexOf(key as T)
  const next = [...value]
  if (from < 0 || slot < 0 || slot >= value.length || from === slot) return next
  next[from] = value[slot]
  next[slot] = key as T
  return next
}

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/** The distance between the ranges `[a1, a2]` and `[b1, b2]` (0 when they overlap). */
const apart = (a1: number, a2: number, b1: number, b2: number) =>
  Math.max(0, Math.max(a1, b1) - Math.min(a2, b2))

function createSlotStrategy({
  slots,
  t,
}: SlotStrategyOptions): DropStrategy<SlotDropPlace> {
  const originOf = (dragging: ReadonlyArray<string>) =>
    slots().findIndex((slot) => slot.item === dragging[0])

  return {
    placeAt(point: Point, dragging) {
      const list = slots()
      const { index: nearest, distance } = nearestTo(
        list.map((slot) => slot.element),
        point
      )
      if (nearest < 0) return null
      // Over the gutter between slots the nearest one still holds; well
      // outside the layout nothing does.
      const container = list[nearest].element.parentElement
      const gutter =
        (container && parseFloat(getComputedStyle(container).gap)) || 16
      if (distance > gutter || nearest === originOf(dragging)) return null
      return { slot: nearest }
    },

    places(dragging) {
      const list = slots()
      return {
        places: list.map((_, slot) => ({ slot })),
        start: Math.max(originOf(dragging), 0),
      }
    },

    isSame: (a, b) => a.slot === b.slot,

    label({ slot }, _t, dragging) {
      const own = t()
      const entry = slots()[slot] as SlotItem | undefined
      if (!entry) return ""
      if (entry.item !== null && entry.item === dragging[0])
        return own("keepHere", { itemText: entry.itemLabel ?? entry.item })
      if (entry.item !== null)
        return own("swapWith", { itemText: entry.itemLabel ?? entry.item })
      return own("moveTo", {
        slotText: entry.label ?? own("emptySlot", { index: String(slot + 1) }),
      })
    },

    // The arrow keys: the nearest slot wholly that way, in the same row or
    // column first.
    move(event, place, dragging) {
      const way = ARROWS[event.key] as { x: number; y: number } | undefined
      if (!way) return undefined
      const list = slots()
      const from = place?.slot ?? originOf(dragging)
      const source = list[from] as SlotItem | undefined
      if (!source) return place
      const r = source.element.getBoundingClientRect()
      let best: SlotDropPlace | null = place
      let score = Infinity
      list.forEach((slot, index) => {
        if (index === from) return
        const c = slot.element.getBoundingClientRect()
        const ahead =
          way.x < 0
            ? r.left - c.right
            : way.x > 0
              ? c.left - r.right
              : way.y < 0
                ? r.top - c.bottom
                : c.top - r.bottom
        if (ahead < -1) return
        const aside = way.x
          ? apart(c.top, c.bottom, r.top, r.bottom)
          : apart(c.left, c.right, r.left, r.right)
        const s = Math.max(ahead, 0) + aside * 3
        if (s < score) [best, score] = [{ slot: index }, s]
      })
      return best
    },
  }
}

export { createSlotStrategy, swapInList }
export type { SlotDropPlace, SlotItem, SlotStrategyOptions }
