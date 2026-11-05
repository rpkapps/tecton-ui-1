/**
 * Internal to `@tecton/react`: the layout of a grid of widgets (`WidgetGrid`),
 * pure and serialisable. Each item covers `w` columns and `h` rows from
 * column `x` and row `y` (0-based, `x` from the inline start, so the same
 * layout mirrors in a right-to-left page).
 *
 * `resolveLayout` is the one rule every change goes through, previews
 * included: it clamps the items to the columns and their limits, places the
 * item being moved or resized where it is asked to go, pushes whatever it
 * lands on out of its way and, with `compaction="vertical"`, lets every item
 * float up into the space above it. A layout read from storage goes through
 * it too, so overlaps and holes never show.
 *
 * - The items are placed in reading order (row, then column), the locked
 *   ones first and never moved. An item that lands on placed ones is pushed
 *   down below them; with vertical compaction it then rises as far as it
 *   can, so the grid has no holes.
 * - A moved item takes its place in that order: ahead of every item of its
 *   target row, which make way for it, or after them when it moves down
 *   (to pass below the items it is dragged past). The items it lands on that fit the columns it left fill its old
 *   place, in reading order (two tiles of a row trade places), rather than
 *   being pushed below it.
 * - A resized item goes ahead of every item it grows over, above it too
 *   (its top edge dragged up), and they move below it.
 */

type GridRect = { x: number; y: number; w: number; h: number }

type GridLayoutItem = GridRect & {
  id: string
  /** Size limits, in cells. */
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  /** Stays where it is: never moved, resized or pushed. */
  locked?: boolean
}

type GridCompaction = "vertical" | "none"

type GridOptions = {
  columns: number
  compaction: GridCompaction
  /** The grid's height in rows, at the least: rows a widget can be put in. */
  rows?: number
}

/** The item a change is about, as it is asked to be. */
type GridActive = {
  item: GridLayoutItem
  /**
   * "move": the item goes to `x`, `y`, and the items it lands on may swap
   * into its old place. "resize": the item keeps its corner. "add": a new
   * item.
   */
  kind: "move" | "resize" | "add"
}

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Whether two rectangles share a cell. */
function collides(a: GridRect, b: GridRect) {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  )
}

/** The size limits of `item` within `columns`. */
function limitsOf(item: GridLayoutItem, columns: number) {
  const maxW = clamp(finite(item.maxW, columns), 1, columns)
  const minW = clamp(finite(item.minW, 1), 1, maxW)
  const minH = Math.max(finite(item.minH, 1), 1)
  const maxH = Math.max(finite(item.maxH, Infinity), minH)
  return { minW, maxW, minH, maxH }
}

/** `item` with whole cells, inside the columns and its size limits. */
function clampItem<T extends GridLayoutItem>(item: T, columns: number): T {
  const { minW, maxW, minH, maxH } = limitsOf(item, columns)
  const w = clamp(finite(item.w, minW), minW, maxW)
  const h = clamp(finite(item.h, minH), minH, maxH)
  return {
    ...item,
    w,
    h,
    x: clamp(finite(item.x, 0), 0, columns - w),
    y: Math.max(finite(item.y, 0), 0),
  }
}

/** The layout in reading order: by row, then by column. */
function inReadingOrder<T extends GridRect>(layout: ReadonlyArray<T>) {
  return [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
}

/** The first row below every item. */
function bottomOf(layout: ReadonlyArray<GridRect>) {
  return layout.reduce((bottom, item) => Math.max(bottom, item.y + item.h), 0)
}

/**
 * The layout after `active` (if any), with nothing overlapping: see the
 * module's comment. The items come back in reading order, as new objects.
 */
function resolveLayout<T extends GridLayoutItem>(
  layout: ReadonlyArray<T>,
  { columns, compaction }: GridOptions,
  active?: GridActive | null
): Array<T> {
  const id = active?.item.id
  const items = layout.map((item) => clampItem(item, columns))
  const origin = items.find((item) => item.id === id)
  const moved = active
    ? clampItem({ ...origin, ...active.item } as T, columns)
    : null
  const placed: Array<T> = []
  const free = (rect: GridRect) => !placed.some((p) => collides(p, rect))

  // Locked items first, where they are: the others make way for them.
  for (const item of items) if (item.locked && item.id !== id) placed.push(item)

  // Its place in the order: a resize goes ahead of every item it grows
  // over, above it too (the top edge dragged up), which move below it.
  type Entry = { item: T; rank: number; at?: number }
  const entries: Array<Entry> = []
  if (moved) {
    // The item goes where it is put, ahead of every item of its target
    // row, which make way; only a move down goes after them, to pass below
    // the items it is dragged past.
    const down = !!origin && active?.kind === "move" && moved.y > origin.y
    const at =
      active?.kind === "resize"
        ? Math.min(
            moved.y,
            ...items
              .filter(
                (item) =>
                  item.id !== id && !item.locked && collides(item, moved)
              )
              .map((item) => item.y)
          )
        : undefined
    entries.push({ item: moved, rank: down ? 1 : -1, at })
  }

  // The items a move lands on, swapped into its old place when they fit
  // the columns it left (and nothing is there yet).
  const swapped: Array<GridRect> = []
  for (const item of inReadingOrder(items)) {
    if (item.locked || item.id === id) continue
    let entry = item
    if (
      moved &&
      origin &&
      active?.kind === "move" &&
      collides(item, moved) &&
      item.w <= origin.w
    ) {
      // The first free spot of the area it left, in reading order: the
      // items it lands on fill that area together.
      const fits = (rect: GridRect) =>
        !collides(rect, moved) &&
        free(rect) &&
        !swapped.some((other) => collides(other, rect))
      let to: T | null = null
      search: for (let dy = 0; dy <= Math.max(origin.h - item.h, 0); dy += 1)
        for (let dx = 0; dx + item.w <= origin.w; dx += 1) {
          const rect = { ...item, x: origin.x + dx, y: origin.y + dy }
          if (rect.x + rect.w <= columns && fits(rect)) {
            to = rect
            break search
          }
        }
      if (to) {
        swapped.push(to)
        entry = to
      }
    }
    entries.push({ item: entry, rank: 0 })
  }

  // By row; in a row, the moved item before or after all the others.
  entries.sort(
    (a, b) =>
      (a.at ?? a.item.y) - (b.at ?? b.item.y) ||
      a.rank - b.rank ||
      a.item.x - b.item.x
  )

  for (const { item } of entries) {
    const rect = { ...item }
    // Below whatever it lands on…
    for (let landed = true; landed;) {
      landed = false
      for (const p of placed)
        if (collides(p, rect)) {
          rect.y = Math.max(rect.y, p.y + p.h)
          landed = true
        }
    }
    // …then up into the space above it, as far as the nearest item over
    // its columns: one pass, not a row at a time.
    if (compaction === "vertical") {
      let top = 0
      for (const p of placed)
        if (
          p.x < rect.x + rect.w &&
          rect.x < p.x + p.w &&
          p.y + p.h <= rect.y &&
          p.y + p.h > top
        )
          top = p.y + p.h
      rect.y = top
    }
    placed.push(rect)
  }
  return inReadingOrder(placed)
}

/** The first place, in reading order, where a `w` × `h` item fits. */
function firstFit(
  layout: ReadonlyArray<GridRect>,
  { w, h }: { w: number; h: number },
  columns: number
): { x: number; y: number } {
  const width = clamp(w, 1, columns)
  const bottom = bottomOf(layout)
  for (let y = 0; y <= bottom; y += 1)
    for (let x = 0; x + width <= columns; x += 1) {
      const rect = { x, y, w: width, h }
      if (!layout.some((item) => collides(item, rect))) return { x, y }
    }
  return { x: 0, y: bottom }
}

/** Where `id` ends up when the change `rect` is asked of it. */
function resolvedRect(
  layout: ReadonlyArray<GridLayoutItem>,
  options: GridOptions,
  id: string,
  rect: GridRect,
  kind: GridActive["kind"] = "move"
): GridRect | null {
  const origin = layout.find((item) => item.id === id)
  const item = { ...origin, ...rect, id }
  return (
    resolveLayout([...layout], options, { item, kind }).find(
      (entry) => entry.id === id
    ) ?? null
  )
}

/**
 * The next place of a step of the arrow keys from `from` (where the item
 * shows now): one cell along `dx` (logical, towards the inline end) or
 * `dy`, or further when that one cell changes nothing (with vertical
 * compaction, an item one row lower floats back up: the step goes on past
 * the item below). `null` when no step moves it.
 */
function stepMove(
  layout: ReadonlyArray<GridLayoutItem>,
  options: GridOptions,
  id: string,
  from: GridRect,
  dx: number,
  dy: number
): GridRect | null {
  // Down to a row below the items, or the grid's own last row.
  const limit = Math.max(
    bottomOf(layout) + from.h + 1,
    (options.rows ?? 0) - from.h
  )
  for (let step = 1; step <= limit; step += 1) {
    const x = from.x + dx * step
    const y = from.y + dy * step
    if (x < 0 || x + from.w > options.columns || y < 0 || y > limit) return null
    const rect = { ...from, x, y }
    const to = resolvedRect(layout, options, id, rect)
    if (to && (to.x !== from.x || to.y !== from.y)) return rect
  }
  return null
}

/**
 * The size one cell wider (`dw`, towards the inline end) or taller (`dh`)
 * than `from`, within the item's limits and the columns; `null` at a limit.
 */
function stepResize(
  item: GridLayoutItem,
  options: GridOptions,
  from: GridRect,
  dw: number,
  dh: number
): GridRect | null {
  const { minW, maxW, minH, maxH } = limitsOf(item, options.columns)
  const w = clamp(from.w + dw, minW, Math.min(maxW, options.columns - from.x))
  const h = clamp(from.h + dh, minH, maxH)
  if (w === from.w && h === from.h) return null
  return { ...from, w, h }
}

const sameRect = (a: GridRect, b: GridRect) =>
  a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h

export {
  bottomOf,
  clampItem,
  collides,
  firstFit,
  inReadingOrder,
  limitsOf,
  resolveLayout,
  resolvedRect,
  sameRect,
  stepMove,
  stepResize,
}
export type {
  GridActive,
  GridCompaction,
  GridLayoutItem,
  GridOptions,
  GridRect,
}
