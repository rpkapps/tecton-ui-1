"use client"

/**
 * Internal to `@tecton/react`: `<Table virtualized>`. The table's container
 * becomes the scroll element and `TableBody` mounts only the rows in view,
 * with a spacer row above and below standing in for the rest, so a table of
 * thousands of rows renders as fast as a short one.
 *
 * - Rows come from `items` and a render function, called only for the rows
 *   in view (a sort renders a screenful, not every row), or as elements.
 * - Rows are one height, measured from the rows rendered (the distance
 *   between two rows, so collapsed borders count once). A row marked
 *   `data-variable-height` (a table's detail row) is measured on its own
 *   once rendered, and again as it resizes; until then it counts as one
 *   row. Its height is kept by its item, so it stays right as rows sort.
 *   A row above the view that turns out taller or shorter moves the
 *   scroll position by as much, before the browser paints, so the rows in
 *   view stay where they are (the browser's own scroll anchoring is off:
 *   the spacers it would anchor to are this module's).
 * - The columns are locked in px (a `colgroup`, `table-fixed`): with
 *   automatic layout every scroll would resize them to the rows mounted.
 *   Each keeps the width of its content as first laid out (the header and
 *   the rows first rendered); the space left goes to the columns of text,
 *   the last one taking the rest, while a column of controls only (a
 *   checkbox, a drag handle) stays as narrow as its control. When the
 *   container is too narrow for them all, the table scrolls sideways. A
 *   table the caller made `table-fixed`, or whose header cells or own
 *   `colgroup` have widths, keeps its own.
 * - A scroll is applied before the browser paints it, with a viewport of
 *   rows ready beyond each edge, and rows that stay in view do not
 *   re-render: a fast flick never shows a blank strip.
 * - A scrollbar drag is scrolled by the browser ahead of the rows: while
 *   the pointer is on the scrollbar and while scrolls jump, the rows in
 *   view are pinned where they are (`sticky`), so every frame of the drag
 *   shows rows. In a grid table (DataTable), the rows a jump brings take
 *   the place of the rows that left (`recycle`), so a frame of the drag
 *   updates rows rather than building them.
 * - The header sticks to the top of the container; the window starts below
 *   it.
 * - The row holding focus stays mounted when it scrolls out of view, so a
 *   focused checkbox or link is never lost.
 * - Each row keeps the `nth-child` parity of its index, so a striped
 *   table's stripes stay on their rows as rows mount and unmount. With
 *   rows that are not striped on their own (a detail row, which takes its
 *   row's fill), the grid's `rowParity` gives each row's instead.
 * - The table announces its true size: `aria-rowcount` on the table and
 *   `aria-rowindex` on each rendered row.
 *
 * Used by the generated `Table`, `TableHeader` and `TableBody` (the overlay's
 * table hunk); not part of the public API.
 */
import * as React from "react"
import { flushSync } from "react-dom"

import { useVirtualList } from "./primitives/virtual-list"
import { atContentWidth } from "./grid-dom"
import {
  useTableGridContext,
  useTableGridOptions,
  type RowDescription,
  type TableGridBody,
} from "./table-grid"

type TableVirtualContextValue = {
  container: HTMLElement | null
  setRowCount: (count: number | undefined) => void
}

const TableVirtualContext =
  React.createContext<TableVirtualContextValue | null>(null)

/** Row height before any layout (and on the server): Tecton's cells. */
const ESTIMATED_ROW = 49

/** Cells of locked columns clip what no longer fits, with an ellipsis. */
const LOCKED_CLASS = "table-fixed [&_td]:overflow-hidden [&_td]:text-ellipsis"

/**
 * Rows updated in place for others (`recycle`, the body's
 * `data-recycling`) start no transitions: a badge or a row changing colour
 * as it takes another row's place is not a change the user made.
 */
const RECYCLING_CLASS = "[&>tbody[data-recycling]_*]:transition-none"

/**
 * Room past a control (a checkbox, a drag handle): its 2 px focus ring
 * and 4 px clear of it, so no zoom level rounds the ring away.
 */
const CONTROL_SLACK = 6

type LockedColumn = {
  span: number
  /** The width of the column's content, in px, as first laid out. */
  content: number
  /** Cells with no text, only a control: such a column never grows. */
  control: boolean
}

/**
 * Locked columns, measured at their content's width (the header's text and
 * the rows first rendered); the space left is spread over the columns of
 * text when the table is drawn.
 */
type Columns =
  | { state: "measuring" }
  | { state: "caller" }
  | { state: "locked"; signature: string; columns: Array<LockedColumn> }

/** What the header's first row says: a change re-measures the columns. */
function signatureOf(row: HTMLTableRowElement) {
  // Whether each cell is laid out too: a column hidden below a breakpoint
  // (`hidden md:table-cell`) that shows was measured at no width.
  return [...row.cells]
    .map(
      (cell) =>
        `${cell.colSpan}:${cell.getClientRects().length > 0}:${cell.textContent}`
    )
    .join("|")
}

/**
 * The header's first row as columns: each cell's content width per column
 * it spans, and whether the rows show only controls under it.
 */
function measureColumns(table: HTMLTableElement, head: HTMLTableRowElement) {
  const cells = [...head.cells]
  const total = cells.reduce((sum, cell) => sum + cell.colSpan, 0)
  const rows = [
    ...(table.tBodies.item(0)?.querySelectorAll("tr[data-index]") ?? []),
  ].filter((row) => (row as HTMLTableRowElement).cells.length === total)
  let start = 0
  return cells.map((cell): LockedColumn => {
    const at = start
    start += cell.colSpan
    const control =
      cell.colSpan === 1 &&
      rows.length > 0 &&
      rows.every((row) => {
        const body = (row as HTMLTableRowElement).cells[at]
        return !body.textContent.trim() && !!body.firstElementChild
      })
    return {
      span: cell.colSpan,
      content:
        Math.ceil(cell.getBoundingClientRect().width / cell.colSpan) +
        (control ? CONTROL_SLACK : 0),
      control,
    }
  })
}

/**
 * Each column's width in px for a container `available` px wide: the
 * space left goes to the columns of text, by their widths, and the last
 * column takes it (no width of its own); when nothing is left, every
 * column keeps its content's width and the table scrolls sideways.
 */
function widthsFor(columns: Array<LockedColumn>, available: number) {
  const span = (column: LockedColumn) => column.content * column.span
  const used = columns.reduce((sum, column) => sum + span(column), 0)
  const left = Math.max(0, available - used)
  const growing = columns.some((column) => !column.control)
    ? columns.filter((column) => !column.control)
    : columns
  const share = growing.reduce((sum, column) => sum + span(column), 0)
  return columns.map((column, at) => {
    if (left > 0 && at === columns.length - 1) return null
    const grow = growing.includes(column) && share > 0
    return column.content + (grow ? (left * column.content) / share : 0)
  })
}

/**
 * For `Table`: the container's ref, the table's `aria-rowcount`, and the
 * locked columns (a `colgroup` and the table's classes).
 */
function useTableVirtualizer(virtualized: boolean) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const [rowCount, setRowCount] = React.useState<number | undefined>()
  const [columns, setColumns] = React.useState<Columns>({ state: "measuring" })
  const [available, setAvailable] = React.useState(0)
  const context = React.useMemo<TableVirtualContextValue | null>(
    () => (virtualized ? { container, setRowCount } : null),
    [virtualized, container]
  )
  const locked = virtualized && columns.state === "locked"

  // The container's inner width: the space the locked columns share.
  React.useLayoutEffect(() => {
    if (!locked || !container) return
    const update = () => setAvailable(container.clientWidth)
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [locked, container])

  React.useLayoutEffect(() => {
    if (!virtualized) return
    const table = container?.querySelector("table")
    const head = table?.tHead?.rows[0]
    if (!table || !head) return
    // The caller's own widths win: header cells with a width of their own
    // (column resizing), a `colgroup` of the caller's, or a table the
    // caller made `table-fixed`. The lock sets none of them, so each one is
    // the caller's, and taking them away gives the columns back to the lock.
    const callerWidths =
      [...head.cells].some((cell) => cell.style.width) ||
      [...table.children].some(
        (child) =>
          child.tagName === "COLGROUP" &&
          child.getAttribute("data-slot") !== "table-virtual-columns"
      )
    if (columns.state === "locked") {
      if (callerWidths) setColumns({ state: "caller" })
      // New, moved or renamed columns: measure them again.
      else if (signatureOf(head) !== columns.signature)
        setColumns({ state: "measuring" })
      return
    }
    const callerFixed =
      callerWidths || getComputedStyle(table).tableLayout === "fixed"
    if (columns.state === "caller") {
      if (!callerFixed) setColumns({ state: "measuring" })
      return
    }
    if (callerFixed) {
      setColumns({ state: "caller" })
      return
    }
    // Wait for rows: a header alone would make every column too narrow.
    if (!table.tBodies.item(0)?.querySelector("tr[data-index]")) return
    if (table.getBoundingClientRect().width <= 0) return
    setColumns({
      state: "locked",
      signature: signatureOf(head),
      columns: atContentWidth(table, () => measureColumns(table, head)),
    })
  })

  const widths =
    columns.state === "locked"
      ? widthsFor(columns.columns, available || (container?.clientWidth ?? 0))
      : []
  return {
    context,
    containerRef: virtualized ? setContainer : undefined,
    rowCount: virtualized ? rowCount : undefined,
    tableClassName: virtualized
      ? locked
        ? `${LOCKED_CLASS} ${RECYCLING_CLASS}`
        : RECYCLING_CLASS
      : undefined,
    colgroup: locked ? (
      <colgroup data-slot="table-virtual-columns">
        {columns.columns.map((column, at) => (
          <col
            key={at}
            span={column.span > 1 ? column.span : undefined}
            style={widths[at] == null ? undefined : { width: widths[at] }}
          />
        ))}
      </colgroup>
    ) : null,
  }
}

function TableVirtualProvider({
  value,
  children,
}: {
  value: TableVirtualContextValue | null
  children: React.ReactNode
}) {
  return (
    <TableVirtualContext.Provider value={value}>
      {children}
    </TableVirtualContext.Provider>
  )
}

/** For `TableHeader`: whether it sticks to the top of the container. */
function useTableVirtualized() {
  return React.useContext(TableVirtualContext) !== null
}

type Measures = {
  stride: number
  headerHeight: number
  headerRows: number
  columns: number
}

const NO_ROWS: Array<React.ReactNode> = []

/** Sub-pixel noise between two measures does not re-render the rows. */
const near = (a: number, b: number) => Math.abs(a - b) < 0.01

function sameMeasures(a: Measures, b: Measures) {
  return (
    near(a.stride, b.stride) &&
    near(a.headerHeight, b.headerHeight) &&
    a.headerRows === b.headerRows &&
    a.columns === b.columns
  )
}

type RenderRow<T> = (item: T, index: number) => React.ReactNode

/** `TableBody`'s props: rows as elements, or `items` and a render function. */
type TableBodyRowsProps<T> = Omit<React.ComponentProps<"tbody">, "children"> & {
  /** The rows' data; `children` is then `(item, index) => <TableRow …>`. */
  items?: ReadonlyArray<T>
  children?: React.ReactNode | RenderRow<T>
  /** Shown in a single row across every column when there are no rows. */
  empty?: React.ReactNode
}

/** The row `empty` is shown in, across `columns` columns. */
function emptyRow(empty: React.ReactNode, columns: number) {
  return (
    <tr key="table-empty" data-slot="table-empty">
      <td
        colSpan={columns}
        className="h-24 px-4 py-3 text-center align-middle text-muted-foreground"
      >
        {empty}
      </td>
    </tr>
  )
}

/** The columns of the table a body is in: its header's first row, or its first row. */
function columnCount(body: HTMLTableSectionElement) {
  const table = body.closest("table")
  const row = table?.tHead?.rows[0] ?? table?.rows[0]
  if (!row) return 1
  return Math.max(
    1,
    [...row.cells].reduce((sum, cell) => sum + cell.colSpan, 0)
  )
}

/** Every row of `items`, for a table that is not virtualized. */
function renderAll<T>(items: ReadonlyArray<T>, render: RenderRow<T>) {
  return items.map((item, index) => render(item, index))
}

/** A rendered row's key: its own, or one it took over (`recycle`). */
type Slot = {
  key: string | null
  own: boolean
  type: unknown
  /** The row as given (`base`), and with `key` (`element`). */
  base: React.ReactNode
  element: React.ReactNode
}

/**
 * The key each row renders with. While the scrollbar is dragged (`jumping`)
 * every frame brings a screenful of rows that were not there: each one takes
 * the key of a row that left the view, of the same kind, so React updates
 * that row's components and elements in place instead of unmounting one
 * row and mounting another. The frame then builds no elements and restyles
 * only what changed in them, as cheap as the rows' new text. Once the
 * scrolling settles, every such row takes its own key back: React moves
 * the instance rendered with that key (which may have stood in for another
 * row meanwhile) back to its row, or mounts one when no row has the key.
 * A row that stays in view keeps its key throughout (the focused row, kept
 * mounted) and is never moved among the others: a row coming before it
 * takes no key that was after it, its own included (it keeps the one it
 * had, or takes a new one and mounts afresh).
 */
function recycle({
  rows,
  previous,
  jumping,
  unique,
}: {
  rows: ReadonlyMap<number, React.ReactNode>
  previous: ReadonlyMap<number, Slot>
  jumping: boolean
  unique: () => string
}) {
  const next = new Map<number, Slot>()
  const used = new Set<string>()
  const typeOf = (row: React.ReactNode) =>
    React.isValidElement(row) ? row.type : undefined
  const ownKey = (row: React.ReactNode) =>
    React.isValidElement(row) ? row.key : null
  const place = (index: number, row: React.ReactNode, key: string | null) => {
    const own = key === ownKey(row)
    const before = previous.get(index)
    const element =
      own || !React.isValidElement(row)
        ? row
        : before?.base === row && before.key === key
          ? before.element
          : React.cloneElement(row, { key })
    if (key !== null) used.add(key)
    next.set(index, { key, own, type: typeOf(row), base: row, element })
  }
  // The rows staying keep their keys.
  for (const [index, row] of rows) {
    const before = previous.get(index)
    if (!before) continue
    const kept = before.own
      ? before.key === ownKey(row)
      : jumping && before.type === typeOf(row)
    if (kept && (before.key === null || !used.has(before.key)))
      place(index, row, before.key)
  }
  // Each row's place among the rows rendered before, in the order they
  // were rendered (by index: `previous` lists the rows staying first).
  const places = new Map<string, number>()
  for (const index of [...previous.keys()].sort((a, b) => a - b)) {
    const key = previous.get(index)!.key
    if (key !== null) places.set(key, places.size)
  }
  // The keys of the rows that left, for the rows coming, in their order.
  const freed = jumping
    ? [...previous].flatMap(([index, slot]) =>
        rows.has(index) || slot.key === null
          ? []
          : [{ slot, place: places.get(slot.key) ?? 0 }]
      )
    : []
  // A row staying is never moved among the others (React would take focus
  // off it): a row coming before it takes the key of a row that was
  // before it too.
  const staying = [...next].map(([index, slot]) => ({
    index,
    place: slot.key === null ? Infinity : (places.get(slot.key) ?? Infinity),
  }))
  for (const [index, row] of rows) {
    if (next.has(index)) continue
    const own = ownKey(row)
    if (own === null) {
      place(index, row, null)
      continue
    }
    const limit = staying.find((stay) => stay.index > index)?.place ?? Infinity
    const at = freed.findIndex(
      ({ slot, place: was }) =>
        was < limit &&
        slot.type === typeOf(row) &&
        slot.key !== null &&
        !used.has(slot.key)
    )
    if (at !== -1) {
      place(index, row, freed[at].slot.key)
      freed.splice(at, 1)
      continue
    }
    // Its own key, unless a row took it over or it was after the row
    // staying next (React would move that row to put it back): the one it
    // had, on the same terms, or a new one.
    const free = (key: string | null | undefined): key is string =>
      key != null && !used.has(key) && (places.get(key) ?? -1) < limit
    const before = previous.get(index)?.key
    place(index, row, free(own) ? own : free(before) ? before : unique())
  }
  return next
}

/**
 * For `TableBody`: the `tbody`'s props, with the rows windowed when the
 * table is virtualized (the caller's `ref`, `onFocus` and `onBlur` still
 * run).
 */
function useVirtualRows<T>(
  props: TableBodyRowsProps<T>
): React.ComponentProps<"tbody"> {
  const {
    items,
    children,
    empty,
    ref,
    onFocus: ownFocus,
    onBlur: ownBlur,
    ...rest
  } = props
  const context = React.useContext(TableVirtualContext)
  const grid = useTableGridContext()
  const gridConfig = useTableGridOptions()
  const describeItem = gridConfig?.describeItem
  const rowParity = gridConfig?.rowParity
  const virtualized = context !== null
  const render = typeof children === "function" ? children : null
  const elements = React.useMemo(
    () =>
      virtualized && !(items && render)
        ? React.Children.toArray(children as React.ReactNode)
        : NO_ROWS,
    [virtualized, items, render, children]
  )
  const count = items && render ? items.length : elements.length
  const body = React.useRef<HTMLTableSectionElement | null>(null)
  // A body without rows shows `empty` across the columns, counted once laid out.
  const [emptyColumns, setEmptyColumns] = React.useState(1)
  const [focused, setFocused] = React.useState<number | null>(null)
  const [measures, setMeasures] = React.useState<Measures>({
    stride: ESTIMATED_ROW,
    headerHeight: 0,
    headerRows: 1,
    columns: 1,
  })
  const [fonts, setFonts] = React.useState(0)
  // Rows grow or shrink as the web fonts arrive: measure them again.
  React.useEffect(() => {
    if (!virtualized || typeof document === "undefined") return
    const set = document.fonts as FontFaceSet | undefined
    if (!set) return
    const done = () => setFonts((n) => n + 1)
    set.addEventListener("loadingdone", done)
    return () => set.removeEventListener("loadingdone", done)
  }, [virtualized])
  const measured = React.useRef("")

  // The rows of their own height, by item (by index for elements).
  const heights = React.useRef(new Map<unknown, number>())
  const [heightsChanged, setHeightsChanged] = React.useState(0)
  const keyOf = React.useCallback(
    (index: number): unknown => (items && render ? items[index] : index),
    [items, render]
  )
  const sizes = React.useMemo(() => {
    void heightsChanged
    if (heights.current.size === 0) return undefined
    const found = new Map<number, number>()
    const kept = new Map<unknown, number>()
    for (let index = 0; index < count; index++) {
      const key = keyOf(index)
      const height = heights.current.get(key)
      if (height === undefined) continue
      found.set(index, height)
      kept.set(key, height)
    }
    // The rows that went are forgotten; one that comes back is measured again.
    heights.current = kept
    return found
  }, [heightsChanged, count, keyOf])

  const virtual = useVirtualList({
    count,
    stride: measures.stride,
    start: measures.headerHeight,
    sizes,
    keep: focused === null ? [] : [focused],
    // A viewport of rows ready beyond each edge, applied in the frame; a
    // jump (the scrollbar dragged) mounts only the view plus two rows, and
    // the rest once the scrolling stops.
    overscan: 2,
    overscanViews: 1,
    settleMs: 150,
    sync: true,
    enabled: virtualized,
  })

  // The container scrolls: the list listens to it.
  const container = context?.container ?? null
  const attach = virtual.ref
  React.useLayoutEffect(() => {
    if (!virtualized) return
    attach(container)
    return () => attach(null)
  }, [virtualized, container, attach])

  // The rows' height, the header's, the view's, and the column count for
  // the spacers.
  React.useLayoutEffect(() => {
    if (!virtualized || !body.current) return
    const table = body.current.closest("table")
    const head = table?.tHead ?? null
    // Rows of their own height are measured apart (below).
    const rendered = body.current.querySelectorAll<HTMLElement>(
      "tr[data-index]:not([data-variable-height])"
    )
    // Only when something that sets the rows' height may have changed (the
    // table's classes and size; the view; the fonts; the first rows), not
    // on every scroll: reading a size lays the page out.
    const key = [
      table?.className,
      table?.dataset.size,
      virtual.viewHeight,
      fonts,
      Math.min(rendered.length, 2),
      head?.rows.length,
    ].join("|")
    if (key === measured.current) return
    measured.current = key
    // Across the longest run of adjacent rows, in fractional px: a row of
    // 44.5 px measured as 45 would drift by a row every 90.
    let stride = measures.stride
    let run = { from: 0, to: 0 }
    let from = 0
    for (let at = 1; at <= rendered.length; at++) {
      const adjacent =
        at < rendered.length &&
        Number(rendered[at].dataset.index) ===
          Number(rendered[at - 1].dataset.index) + 1
      if (adjacent) continue
      if (at - 1 - from > run.to - run.from) run = { from, to: at - 1 }
      from = at
    }
    if (run.to > run.from) {
      const top = (row: HTMLElement) => row.getBoundingClientRect().top
      const step =
        (top(rendered[run.to]) - top(rendered[run.from])) / (run.to - run.from)
      if (step > 0) stride = step
    } else if (rendered.length === 1) {
      const height = rendered[0].getBoundingClientRect().height
      if (height > 0) stride = height
    }
    const firstHeadRow = head?.rows[0]
    const columns = firstHeadRow
      ? [...firstHeadRow.cells].reduce((sum, cell) => sum + cell.colSpan, 0)
      : ((rendered[0] as HTMLTableRowElement | undefined)?.cells.length ?? 1)
    const next: Measures = {
      stride,
      headerHeight: head?.getBoundingClientRect().height ?? 0,
      headerRows: head?.rows.length ?? 0,
      columns: Math.max(columns, 1),
    }
    setMeasures((previous) => (sameMeasures(previous, next) ? previous : next))
  })

  // Rows of their own height: measured as they render and as they resize.
  const latestKeyOf = React.useRef(keyOf)
  latestKeyOf.current = keyOf
  // Made for a virtualized body only, once it has a row to watch.
  const sizeObserver = React.useRef<ResizeObserver | null>(null)
  // Where rows are now, for a row measured above the view.
  const anchor = React.useRef({
    offset: virtual.offset,
    start: measures.headerHeight,
    stride: measures.stride,
  })
  anchor.current = {
    offset: virtual.offset,
    start: measures.headerHeight,
    stride: measures.stride,
  }
  /** The scroll the rows above the view moved by, applied once they render. */
  const shift = React.useRef(0)
  /** Keeps a row's height; whether it changed. */
  function record(row: HTMLElement) {
    if (!row.isConnected || row.dataset.index === undefined) return false
    const height = row.getBoundingClientRect().height
    const index = Number(row.dataset.index)
    const key = latestKeyOf.current(index)
    const before = heights.current.get(key) ?? anchor.current.stride
    if (height <= 0 || near(before, height)) return false
    heights.current.set(key, height)
    // Wholly above the view: the rows in view would move by the difference.
    const scroller = context?.container
    if (scroller && anchor.current.offset(index) + before <= scroller.scrollTop)
      shift.current += height - before
    return true
  }
  React.useLayoutEffect(() => {
    const scroller = context?.container
    if (!scroller || shift.current === 0) return
    scroller.scrollTop += shift.current
    shift.current = 0
  })
  // The scroll position is this module's to keep (above).
  React.useLayoutEffect(() => {
    const scroller = context?.container
    if (!virtualized || !scroller) return
    const before = scroller.style.overflowAnchor
    scroller.style.overflowAnchor = "none"
    return () => {
      scroller.style.overflowAnchor = before
    }
  }, [virtualized, context?.container])
  /** The rows of their own height watched, with the index each was measured at. */
  const observed = React.useRef(new Map<HTMLElement, string | undefined>())
  React.useLayoutEffect(() => {
    if (!virtualized || !body.current) return
    let changed = false
    const rows = body.current.querySelectorAll<HTMLElement>(
      "tr[data-index][data-variable-height]"
    )
    for (const row of rows) {
      const index = observed.current.get(row)
      if (index !== undefined) {
        // A row updated in place for another (`recycle`): its height is
        // that one's.
        if (index !== row.dataset.index) {
          observed.current.set(row, row.dataset.index)
          changed = record(row) || changed
        }
        continue
      }
      if (!sizeObserver.current && typeof ResizeObserver !== "undefined")
        sizeObserver.current = new ResizeObserver((entries) => {
          let resized = false
          for (const entry of entries)
            resized = record(entry.target as HTMLElement) || resized
          // Rendered before the next paint, with the scroll kept.
          if (resized) flushSync(() => setHeightsChanged((n) => n + 1))
        })
      observed.current.set(row, row.dataset.index)
      sizeObserver.current?.observe(row)
      changed = record(row) || changed
    }
    for (const row of observed.current.keys())
      if (!row.isConnected) {
        observed.current.delete(row)
        sizeObserver.current?.unobserve(row)
      }
    if (changed) setHeightsChanged((n) => n + 1)
  })
  // Effects run again (strict mode, a hidden `Activity` shown) start over:
  // every row is watched again, by a new observer.
  React.useEffect(
    () => () => {
      sizeObserver.current?.disconnect()
      sizeObserver.current = null
      observed.current.clear()
    },
    []
  )

  // A scrollbar drag scrolls in the browser's compositor, ahead of this
  // module: each frame of it is a jump to rows not mounted yet, and a frame
  // the compositor draws before they are shows the spacers, blank. While
  // the pointer is on the scrollbar (from before it is pressed: the drag's
  // first frame is the compositor's too), and while scrolls jump, every
  // row in view is pinned where it is (`sticky`, top and bottom): the
  // compositor keeps the last rows in view until the next ones are there.
  const [onScrollbar, setOnScrollbar] = React.useState(false)
  React.useEffect(() => {
    const view = container?.ownerDocument.defaultView
    if (!virtualized || !container || !view) return
    // On the scrollbar (its thumb, its track): in the container's box,
    // outside its client area. The browser targets the container or an
    // element around it, never one inside or over it.
    const onBar = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof view.Node) || !target.contains(container))
        return false
      const box = container.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      if (x < 0 || x >= box.width || y < 0 || y >= box.height) return false
      const client =
        x >= container.clientLeft &&
        x < container.clientLeft + container.clientWidth &&
        y >= container.clientTop &&
        y < container.clientTop + container.clientHeight
      return !client
    }
    const down = (event: PointerEvent) => {
      if (onBar(event)) setOnScrollbar(true)
    }
    // Pressed, it stays on until released, wherever the pointer goes.
    const move = (event: PointerEvent) => {
      if (event.buttons === 0) setOnScrollbar(onBar(event))
    }
    const up = (event: PointerEvent) => setOnScrollbar(onBar(event))
    // Out of the page.
    const out = (event: PointerEvent) => {
      if (!event.relatedTarget) setOnScrollbar(false)
    }
    view.addEventListener("pointerdown", down, true)
    view.addEventListener("pointermove", move, true)
    view.addEventListener("pointerup", up, true)
    view.addEventListener("pointercancel", up, true)
    view.addEventListener("pointerout", out, true)
    return () => {
      view.removeEventListener("pointerdown", down, true)
      view.removeEventListener("pointermove", move, true)
      view.removeEventListener("pointerup", up, true)
      view.removeEventListener("pointercancel", up, true)
      view.removeEventListener("pointerout", out, true)
    }
  }, [virtualized, container])
  const pin = virtualized && (onScrollbar || virtual.jumping)
  const pinned = React.useRef(new Set<HTMLElement>())
  /** The rows' heights as last laid out (`ResizeObserver`), by row. */
  const laidOut = React.useRef(new WeakMap<Element, number>())
  const rowObserver = React.useRef<ResizeObserver | null>(null)
  const watched = React.useRef(new Set<Element>())
  const pinFrom = React.useRef({
    pin,
    scrolled: 0,
    view: 0,
    offset: virtual.offset,
  })
  pinFrom.current = {
    pin,
    scrolled: virtual.viewTop - measures.headerHeight,
    view: virtual.viewHeight,
    offset: virtual.offset,
  }
  // Where each row is in the view, from the top of the body down: the
  // spacers' heights (the list's), and each row's as last laid out (the
  // list's until then), so a scroll reads no layout. A row whose height
  // was not known is placed again once it is laid out, before the frame
  // is painted. Only the rows in view: one pinned out of view would stay
  // there.
  const placePins = React.useCallback(function place() {
    const { pin: on, scrolled, view, offset } = pinFrom.current
    const rows = pinned.current
    const section = body.current
    const pins = new Map<HTMLElement, [number, number]>()
    if (on && section && view > 0) {
      if (!rowObserver.current && typeof ResizeObserver !== "undefined")
        rowObserver.current = new ResizeObserver((entries) => {
          for (const entry of entries)
            laidOut.current.set(
              entry.target,
              entry.target.getBoundingClientRect().height
            )
          place()
        })
      let y = -scrolled
      let last = -1
      for (const row of section.rows) {
        if (row.dataset.index === undefined) continue
        const index = Number(row.dataset.index)
        // After a spacer: as tall as the list made it (its style, read
        // back, is rounded).
        if (index !== last + 1) y += offset(index) - offset(last + 1)
        last = index
        const height =
          laidOut.current.get(row) ?? offset(index + 1) - offset(index)
        if (!watched.current.has(row)) {
          watched.current.add(row)
          rowObserver.current?.observe(row)
        }
        if (y + height > 0 && y < view) pins.set(row, [y, view - y - height])
        y += height
      }
    }
    for (const row of watched.current)
      if (!on || !row.isConnected) {
        rowObserver.current?.unobserve(row)
        watched.current.delete(row)
      }
    for (const row of rows)
      if (!pins.has(row)) {
        row.style.position = ""
        row.style.top = ""
        row.style.bottom = ""
        rows.delete(row)
      }
    for (const [row, [top, bottom]] of pins) {
      row.style.position = "sticky"
      row.style.top = `${top}px`
      row.style.bottom = `${bottom}px`
      rows.add(row)
    }
  }, [])
  React.useLayoutEffect(() => placePins())
  React.useEffect(() => () => rowObserver.current?.disconnect(), [])

  // The grid reaches the rows out of view through the body: how many
  // there are, what they are (read from their items), and scrolling one
  // into view to focus it.
  const latestCount = React.useRef(count)
  latestCount.current = count
  const reader = React.useMemo(() => {
    if (!virtualized || !items || !render || !describeItem) return null
    const read = describeItem as (item: T, index: number) => RowDescription
    return {
      describe: () => items.map(read),
      describeAt: (index: number) => read(items[index], index),
    }
  }, [virtualized, items, render, describeItem])
  const describe = reader?.describe ?? null
  const describeAt = reader?.describeAt ?? null
  const scrollToIndex = virtual.scrollToIndex
  React.useLayoutEffect(() => {
    if (!grid || !virtualized) return
    const handle: TableGridBody = {
      count: () => latestCount.current,
      describe,
      describeAt,
      scrollToIndex,
    }
    grid.setBody(handle)
    return () => grid.setBody(null)
  }, [grid, virtualized, describe, describeAt, scrollToIndex])
  // A row the grid was asked to focus may have just been rendered.
  React.useLayoutEffect(() => {
    grid?.flush()
  })

  const isEmpty =
    empty !== undefined &&
    (virtualized || (items && render)
      ? count === 0
      : React.Children.count(children as React.ReactNode) === 0)
  React.useLayoutEffect(() => {
    if (!isEmpty || !body.current) return
    const columns = columnCount(body.current)
    setEmptyColumns((previous) => (previous === columns ? previous : columns))
  })

  const setRowCount = context?.setRowCount
  React.useLayoutEffect(() => {
    if (!setRowCount) return
    setRowCount(measures.headerRows + count)
    // A body that goes counts no rows.
    return () => setRowCount(undefined)
  }, [setRowCount, measures.headerRows, count])

  const bodyRef = React.useCallback(
    (element: HTMLTableSectionElement | null) => {
      body.current = element
      if (typeof ref === "function") return ref(element)
      if (ref) ref.current = element
    },
    [ref]
  )

  // The rows rendered last time, reused while their source is unchanged:
  // React skips an element it has already rendered, so a scroll renders
  // only the rows entering the view. New data, a new render function or
  // new elements start over.
  const cache = React.useRef<{
    sources: unknown
    rows: Map<number, { rowIndex: number; row: React.ReactNode }>
  }>({ sources: null, rows: new Map() })
  /** The key each row was rendered with, by index (`recycle`). */
  const slots = React.useRef(new Map<number, Slot>())
  const unique = React.useRef(0)

  if (!virtualized) {
    const rows =
      items && render ? renderAll(items, render) : (children as React.ReactNode)
    return {
      ...rest,
      ref: bodyRef,
      onFocus: ownFocus,
      onBlur: ownBlur,
      children: isEmpty ? emptyRow(empty, emptyColumns) : rows,
    }
  }

  const onFocus = (event: React.FocusEvent<HTMLTableSectionElement>) => {
    ownFocus?.(event)
    const row = (event.target as Element).closest<HTMLElement>("tr[data-index]")
    if (row) setFocused(Number(row.dataset.index))
  }
  const onBlur = (event: React.FocusEvent<HTMLTableSectionElement>) => {
    ownBlur?.(event)
    const next = event.relatedTarget as Node | null
    if (!next || !body.current?.contains(next)) setFocused(null)
  }

  // What the rows are made from, compared by identity.
  const sources: ReadonlyArray<unknown> =
    items && render ? [items, render] : [elements]
  const cached = cache.current.sources as ReadonlyArray<unknown> | null
  const previousRows =
    cached?.length === sources.length &&
    cached.every((source, at) => source === sources[at])
      ? cache.current.rows
      : new Map<number, { rowIndex: number; row: React.ReactNode }>()
  const rowsNow = new Map<number, { rowIndex: number; row: React.ReactNode }>()

  const { headerRows, columns } = measures
  /** A row standing in for the rows `from` to `to` (exclusive). */
  const spacer = (key: string, from: number, to: number) => (
    <tr key={key} aria-hidden="true" data-slot="table-virtual-spacer">
      <td
        colSpan={columns}
        style={{
          height: virtual.offset(to) - virtual.offset(from),
          padding: 0,
          border: 0,
        }}
      />
    </tr>
  )
  // Every row keeps the parity of its index among the body's children, so
  // `nth-child` (a striped table) is the same whichever rows are mounted:
  // an empty row makes up the difference before a row that would shift.
  const parity = (key: string) => (
    <tr key={key} aria-hidden="true" data-slot="table-virtual-parity" />
  )
  const bases = new Map<number, React.ReactNode>()
  for (const index of virtual.indices) {
    const rowIndex = headerRows + index + 1
    const kept = previousRows.get(index)
    let row: React.ReactNode
    if (kept && kept.rowIndex === rowIndex) {
      row = kept.row
    } else {
      const source =
        items && render ? render(items[index], index) : elements[index]
      row = React.isValidElement<Record<string, unknown>>(source)
        ? React.cloneElement(source, {
            "aria-rowindex": rowIndex,
            "data-index": index,
          })
        : source
    }
    rowsNow.set(index, { rowIndex, row })
    bases.set(index, row)
  }
  const keyed = recycle({
    rows: bases,
    previous: slots.current,
    // A grid table's rows (DataTable's) while the scrollbar is dragged.
    jumping: grid !== null && virtual.jumping,
    unique: () => `table-virtual-row-${unique.current++}`,
  })
  slots.current = keyed

  const rendered: Array<React.ReactNode> = []
  let previous = -1
  for (const index of virtual.indices) {
    if (index > previous + 1)
      rendered.push(
        spacer(
          previous === -1 ? "spacer-start" : `spacer-${index}`,
          previous + 1,
          index
        )
      )
    const stripe = rowParity ? rowParity(index) : index % 2
    if (stripe !== null && rendered.length % 2 !== stripe)
      rendered.push(parity(`parity-${index}`))
    rendered.push(keyed.get(index)?.element ?? bases.get(index))
    previous = index
  }
  if (previous < count - 1)
    rendered.push(spacer("spacer-end", previous + 1, count))
  if (isEmpty) rendered.push(emptyRow(empty, columns))
  cache.current = { sources, rows: rowsNow }

  const recycling = [...keyed.values()].some((slot) => !slot.own)
  return {
    ...rest,
    children: rendered,
    ref: bodyRef,
    onFocus,
    onBlur,
    ...{ "data-recycling": recycling ? "" : undefined },
  }
}

export {
  recycle,
  TableVirtualProvider,
  useTableVirtualized,
  useTableVirtualizer,
  useVirtualRows,
}
export type { Slot, TableBodyRowsProps }
