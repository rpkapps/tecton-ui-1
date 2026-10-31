"use client"

/**
 * Internal to `@tecton/react`: `<Table virtualized>`. The table's container
 * becomes the scroll element and `TableBody` mounts only the rows in view,
 * with a spacer row above and below standing in for the rest, so a table of
 * thousands of rows renders as fast as a short one.
 *
 * - Rows are one height, measured from the rows rendered (the distance
 *   between two rows, so collapsed borders count once).
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

/** For `Table`: the container's ref and the table's `aria-rowcount`. */
function useTableVirtualizer(virtualized: boolean) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const [rowCount, setRowCount] = React.useState<number | undefined>()
  const context = React.useMemo<TableVirtualContextValue | null>(
    () => (virtualized ? { container, setRowCount } : null),
    [virtualized, container]
  )
  return {
    context,
    containerRef: virtualized ? setContainer : undefined,
    rowCount: virtualized ? rowCount : undefined,
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

type BodyProps = React.ComponentProps<"tbody">

/**
 * For `TableBody`: its props, with the rows windowed when the table is
 * virtualized (the caller's `ref`, `onFocus` and `onBlur` still run).
 */
function useVirtualRows(props: BodyProps): BodyProps {
  const { children, ref, onFocus: ownFocus, onBlur: ownBlur } = props
  const context = React.useContext(TableVirtualContext)
  const virtualized = context !== null
  const rows = virtualized ? React.Children.toArray(children) : NO_ROWS
  const count = rows.length
  const body = React.useRef<HTMLTableSectionElement | null>(null)
  const [focused, setFocused] = React.useState<number | null>(null)
  const [measures, setMeasures] = React.useState<Measures>({
    stride: ESTIMATED_ROW,
    headerHeight: 0,
    headerRows: 1,
    columns: 1,
  })

  const virtual = useVirtualList({
    count,
    stride: measures.stride,
    start: measures.headerHeight,
    keep: focused === null ? [] : [focused],
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

  // The rows' height, the header's, and the column count for the spacers.
  React.useLayoutEffect(() => {
    if (!virtualized || !body.current) return
    const table = body.current.closest("table")
    const head = table?.tHead ?? null
    const rendered =
      body.current.querySelectorAll<HTMLElement>("tr[data-index]")
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

  if (!virtualized) return props

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
    const row = rows[index]
    rendered.push(
      React.isValidElement<Record<string, unknown>>(row)
        ? React.cloneElement(row, {
            "aria-rowindex": headerRows + index + 1,
            "data-index": index,
          })
        : row
    )
    previous = index
  }
  if (previous < count - 1)
    rendered.push(spacer("spacer-end", count - 1 - previous))

  return { ...props, children: rendered, ref: bodyRef, onFocus, onBlur }
}

export {
  TableVirtualProvider,
  useTableVirtualized,
  useTableVirtualizer,
  useVirtualRows,
}
