/**
 * Internal to `@tecton/react`: the drop strategy of a grid of widgets
 * (`WidgetGrid`), for `useDragAndDrop`. A place is the rectangle the
 * dragged item is asked to cover; `grid-layout` decides where it ends up
 * and what makes way, and the grid shows that as the drag goes.
 *
 * - Pointer: the cells nearest the lifted item's top corner on the inline
 *   start side, as the pointer moves it (a new item from a source: centred
 *   under the pointer, and only over the grid).
 * - Keyboard: the arrow keys move the item a cell (or past the item in the
 *   way, when one cell would change nothing), Shift and the arrow keys
 *   resize it a cell, mirrored in a right-to-left page. Tab steps through
 *   the places of the other items and the end of the grid.
 * - Screen reader on a touch screen: the item's own place, the places of
 *   the others and the end of the grid, each a button.
 */
import type { Translator } from "../../i18n/translations"
import {
  bottomOf,
  inReadingOrder,
  resolveLayout,
  sameRect,
  stepMove,
  stepResize,
  type GridActive,
  type GridLayoutItem,
  type GridOptions,
  type GridRect,
} from "./grid-layout"
import type { Point } from "./pointer-drag"
import type { DropStrategy } from "./use-drag-and-drop"

type GridDropPlace = GridRect & {
  /** What the place stands for, as a virtual drop target names it. */
  target?: "keep" | "end" | { item: string }
}

/** The grid's geometry in the viewport, its content box. */
type GridMetrics = {
  left: number
  right: number
  top: number
  bottom: number
  /** A column and its gap, a row and its gap, in px. */
  columnPitch: number
  rowPitch: number
  /** The gaps between columns and between rows, in px. */
  columnGap: number
  rowGap: number
}

type GridStrategyOptions = {
  /** The layout as committed, resolved. */
  layout: () => ReadonlyArray<GridLayoutItem>
  options: () => GridOptions
  /** The item a drag of `key` carries: one of the layout, or a new one. */
  itemOf: (key: string) => GridLayoutItem | null
  /** The item's name. */
  labelOf: (key: string) => string
  metrics: () => GridMetrics | null
  /**
   * Where the press was in the dragged item (px from its top-left corner)
   * and the item's width.
   */
  grab: () => { x: number; y: number; width: number } | null
  direction: () => "ltr" | "rtl"
  t: () => Translator<"widgetGrid">
}

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function createGridStrategy({
  layout,
  options,
  itemOf,
  labelOf,
  metrics,
  grab,
  direction,
  t,
}: GridStrategyOptions) {
  const ownOf = (key: string) => layout().find((item) => item.id === key)

  /** What `place` asks of `key`: a resize when its corner stays. */
  const activeOf = (
    key: string,
    place: GridRect,
    as?: GridActive["kind"]
  ): GridActive | null => {
    const item = itemOf(key)
    if (!item) return null
    const own = ownOf(key)
    const kind =
      as ??
      (!own
        ? "add"
        : own.x === place.x && own.y === place.y
          ? "resize"
          : "move")
    const { x, y, w, h } = place
    return { item: { ...item, id: key, x, y, w, h }, kind }
  }

  /**
   * The layout `place` gives, every item where it would end up; `kind`
   * says what the change is when its corner does not (a resize from the
   * top or the start side moves the corner).
   */
  const preview = (
    key: string,
    place: GridRect | null,
    kind?: GridActive["kind"]
  ) => {
    const active = place ? activeOf(key, place, kind) : null
    return resolveLayout(layout(), options(), active)
  }

  /** Where `key` ends up for `place`. */
  const landing = (key: string, place: GridRect) =>
    preview(key, place).find((item) => item.id === key) ?? place

  const position = (rect: GridRect) =>
    t()("position", {
      column: rect.x + 1,
      row: rect.y + 1,
      width: rect.w,
      height: rect.h,
    })

  const strategy: DropStrategy<GridDropPlace> = {
    placeAt(point: Point, dragging) {
      const key = dragging.at(0)
      const m = metrics()
      const item = key === undefined ? null : itemOf(key)
      if (key === undefined || !m || !item) return null
      const { columns, rows = 0 } = options()
      const rtl = direction() === "rtl"
      /** Px from the grid's inline start. */
      const inline = (x: number) => (rtl ? m.right - x : x - m.left)
      let x: number
      let y: number
      if (ownOf(key)) {
        const press = grab() ?? { x: 0, y: 0, width: 0 }
        // The lifted item's corner on the inline start side.
        const edge = rtl ? point.x - press.x + press.width : point.x - press.x
        x = Math.round(inline(edge) / m.columnPitch)
        y = Math.round((point.y - press.y - m.top) / m.rowPitch)
      } else {
        // A new item: over the grid only, centred under the pointer.
        const margin = m.rowPitch / 2
        if (
          point.x < m.left - margin ||
          point.x > m.right + margin ||
          point.y < m.top - margin ||
          point.y > m.bottom + m.rowPitch * item.h
        )
          return null
        x = Math.round(inline(point.x) / m.columnPitch - item.w / 2)
        y = Math.floor((point.y - m.top) / m.rowPitch)
      }
      const w = Math.min(item.w, columns)
      return {
        x: clamp(x, 0, columns - w),
        // A row below the items, or anywhere in the grid's own rows.
        y: clamp(y, 0, Math.max(bottomOf(layout()) + 1, rows - item.h)),
        w,
        h: item.h,
      }
    },

    places(dragging) {
      const key = dragging.at(0)
      const item = key === undefined ? null : itemOf(key)
      if (key === undefined || !item) return { places: [], start: 0 }
      const { columns } = options()
      const own = ownOf(key)
      const { w, h } = own ?? item
      const places: Array<GridDropPlace> = []
      if (own) places.push({ x: own.x, y: own.y, w, h, target: "keep" })
      const others = layout().filter(
        (other) => other.id !== key && !other.locked
      )
      for (const other of inReadingOrder(others))
        places.push({
          x: clamp(other.x, 0, columns - w),
          y: other.y,
          w,
          h,
          target: { item: other.id },
        })
      places.push({ x: 0, y: bottomOf(others), w, h, target: "end" })
      return { places, start: own ? 0 : places.length - 1 }
    },

    isSame: sameRect,

    label(place, _t, dragging) {
      const key = dragging.at(0)
      if (key === undefined) return ""
      const own = t()
      const at = position(landing(key, place))
      const { target } = place
      if (target === "keep")
        return own("keepHere", { itemText: labelOf(key), position: at })
      if (target === "end") return own("atEnd", { position: at })
      if (target)
        return own("placeOf", { otherText: labelOf(target.item), position: at })
      return own("aimed", { itemText: labelOf(key), position: at })
    },

    // The arrow keys move the item a cell, Shift and the arrow keys resize
    // it a cell; at a limit, it stays.
    move(event, place, dragging) {
      const way = ARROWS[event.key] as { x: number; y: number } | undefined
      if (!way || event.altKey || event.ctrlKey || event.metaKey)
        return undefined
      const key = dragging.at(0)
      const item = key === undefined ? null : itemOf(key)
      if (key === undefined || !item) return place
      const dx = direction() === "rtl" ? -way.x : way.x
      const from = place ? landing(key, place) : (ownOf(key) ?? item)
      const rect = { x: from.x, y: from.y, w: from.w, h: from.h }
      const next = event.shiftKey
        ? stepResize(item, options(), rect, dx, way.y)
        : stepMove(layout(), options(), key, rect, dx, way.y)
      return next ? { ...next } : place
    },
  }

  return { strategy, preview, landing, position }
}

export { createGridStrategy }
export type { GridDropPlace, GridMetrics, GridStrategyOptions }
