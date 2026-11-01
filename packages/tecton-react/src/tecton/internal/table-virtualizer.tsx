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
 *   between two rows, so collapsed borders count once).
 * - The columns keep the widths they had when first laid out, in px (a
 *   `colgroup`, `table-fixed`), and the last one takes the space left: with
 *   automatic layout every scroll would resize them to the rows mounted,
 *   and in percentages a narrower container would squeeze a small column
 *   (a checkbox) below its content. A table the caller made `table-fixed`,
 *   or whose header cells have widths, keeps its own.
 * - A scroll is applied before the browser paints it, with a viewport of
 *   rows ready beyond each edge, and rows that stay in view do not
 *   re-render: a fast flick never shows a blank strip.
 * - The header sticks to the top of the container; the window starts below
 *   it.
 * - The row holding focus stays mounted when it scrolls out of view, so a
 *   focused checkbox or link is never lost.
 * - The table announces its true size: `aria-rowcount` on the table and
 *   `aria-rowindex` on each rendered row.
 *
 * Used by the generated `Table`, `TableHeader` and `TableBody` (the overlay's
 * table hunk); not part of the public API.
 */
import * as React from "react"

import { useVirtualList } from "./primitives/virtual-list"

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
 * Locked columns: each one's width in px as first laid out (the last one's
 * is left out: it takes the space left), for the header's text.
 */
type Columns =
  | { state: "measuring" }
  | { state: "caller" }
  | {
      state: "locked"
      signature: string
      widths: Array<{ span: number; px: number | null }>
    }

/** What the header's first row says: a change re-measures the columns. */
function signatureOf(row: HTMLTableRowElement) {
  return [...row.cells]
    .map((cell) => `${cell.colSpan}:${cell.textContent}`)
    .join("|")
}

/**
 * For `Table`: the container's ref, the table's `aria-rowcount`, and the
 * locked columns (a `colgroup` and the table's classes).
 */
function useTableVirtualizer(virtualized: boolean) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const [rowCount, setRowCount] = React.useState<number | undefined>()
  const [columns, setColumns] = React.useState<Columns>({ state: "measuring" })
  const context = React.useMemo<TableVirtualContextValue | null>(
    () => (virtualized ? { container, setRowCount } : null),
    [virtualized, container]
  )

  React.useLayoutEffect(() => {
    if (!virtualized) return
    const table = container?.querySelector("table")
    const head = table?.tHead?.rows[0]
    if (!table || !head) return
    // The caller's own widths win: header cells with a width of their own
    // (column resizing), or a table the caller made `table-fixed`. The
    // lock sets neither, so either one is the caller's, and taking them
    // away gives the columns back to the lock.
    const callerWidths = [...head.cells].some((cell) => cell.style.width)
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
    const cells = [...head.cells]
    setColumns({
      state: "locked",
      signature: signatureOf(head),
      widths: cells.map((cell, at) => ({
        span: cell.colSpan,
        px:
          at === cells.length - 1
            ? null
            : cell.getBoundingClientRect().width / cell.colSpan,
      })),
    })
  })

  const locked = virtualized && columns.state === "locked"
  return {
    context,
    containerRef: virtualized ? setContainer : undefined,
    rowCount: virtualized ? rowCount : undefined,
    tableClassName: locked ? LOCKED_CLASS : undefined,
    colgroup: locked ? (
      <colgroup data-slot="table-virtual-columns">
        {columns.widths.map((column, at) => (
          <col
            key={at}
            span={column.span > 1 ? column.span : undefined}
            style={column.px === null ? undefined : { width: column.px }}
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
}

/** Every row of `items`, for a table that is not virtualized. */
function renderAll<T>(items: ReadonlyArray<T>, render: RenderRow<T>) {
  return items.map((item, index) => render(item, index))
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
    ref,
    onFocus: ownFocus,
    onBlur: ownBlur,
    ...rest
  } = props
  const context = React.useContext(TableVirtualContext)
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

  const virtual = useVirtualList({
    count,
    stride: measures.stride,
    start: measures.headerHeight,
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
    const rendered =
      body.current.querySelectorAll<HTMLElement>("tr[data-index]")
    // Only when something that sets the rows' height may have changed (the
    // table's classes: density; the view; the fonts; the first rows), not
    // on every scroll: reading a size lays the page out.
    const key = [
      table?.className,
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

  const setRowCount = context?.setRowCount
  React.useLayoutEffect(() => {
    setRowCount?.(virtualized ? measures.headerRows + count : undefined)
  }, [setRowCount, virtualized, measures.headerRows, count])

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

  if (!virtualized) {
    return {
      ...rest,
      ref,
      onFocus: ownFocus,
      onBlur: ownBlur,
      children:
        items && render
          ? renderAll(items, render)
          : (children as React.ReactNode),
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

  const { stride, headerRows, columns } = measures
  const spacer = (key: string, rowsSkipped: number) => (
    <tr key={key} aria-hidden="true" data-slot="table-virtual-spacer">
      <td
        colSpan={columns}
        style={{ height: rowsSkipped * stride, padding: 0, border: 0 }}
      />
    </tr>
  )
  const rendered: Array<React.ReactNode> = []
  let previous = -1
  for (const index of virtual.indices) {
    if (index > previous + 1)
      rendered.push(spacer(`spacer-${index}`, index - previous - 1))
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
    rendered.push(row)
    previous = index
  }
  if (previous < count - 1)
    rendered.push(spacer("spacer-end", count - 1 - previous))
  cache.current = { sources, rows: rowsNow }

  return { ...rest, children: rendered, ref: bodyRef, onFocus, onBlur }
}

export {
  TableVirtualProvider,
  useTableVirtualized,
  useTableVirtualizer,
  useVirtualRows,
}
export type { TableBodyRowsProps }
