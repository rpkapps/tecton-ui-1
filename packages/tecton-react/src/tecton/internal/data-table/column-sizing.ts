"use client"

/**
 * Column widths for `DataTableContent`. A table that resizes or pins
 * columns, or whose columns have a `width`, `minWidth` or `maxWidth`, is
 * laid out with fixed widths: a `colgroup` of px widths, `table-fixed`, as
 * wide as their sum and at least as wide as its frame (the filler column,
 * `engine/sizing.ts`, takes the rest). Any other table keeps the browser's
 * automatic layout.
 *
 * - A column with no width of its own starts at the width of its content:
 *   the table is laid out once without fixed widths, measured before it
 *   is painted (again when such a column is shown, and once rows are there
 *   after a table that had none or was loading), then fixed.
 * - A column hidden below a breakpoint (`hideBelow`) takes no width and
 *   moves no pinned column: the breakpoints the columns use are followed
 *   with `matchMedia` (none on the server, where every column counts).
 * - A column resized by dragging is redrawn by setting its `col`'s width,
 *   the table's, and where pinned columns stick (variables on the frame,
 *   which the pinned cells read) directly (`preview`), with no render of
 *   the table; the view takes the width when the drag ends.
 * - `fit` lays the table out at its content's width for a moment to read a
 *   column's: its widest cell rendered, or its header.
 * - The columns of controls before the data columns (the rows' drag
 *   handles, then the selection checkboxes) are measured too, and size as
 *   one: the engine's selection column, which sticks at the start while a
 *   column is pinned there.
 */
import * as React from "react"

import {
  columnWidth,
  sizeColumns,
  type ColumnLayout,
  type ColumnSizing,
  type EngineColumn,
} from "./engine/index"

type SizingMode = "auto" | "measure" | "fixed"

type Breakpoint = "sm" | "md" | "lg"

/**
 * The breakpoints `hideBelow` names, as its classes use them (`hidden
 * md:table-cell`): Tailwind's `--breakpoint-sm` / `-md` / `-lg`, which
 * Tecton keeps at Tailwind's defaults (`src/styles/` sets none). Change
 * these with them.
 */
const BREAKPOINTS: Record<Breakpoint, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
}

/** One media query list per breakpoint (and `matchMedia`), made when first asked for. */
const queries = new Map<
  Breakpoint,
  { source: typeof matchMedia; list: MediaQueryList }
>()

function queryOf(name: Breakpoint) {
  let query = queries.get(name)
  if (query?.source !== matchMedia) {
    query = { source: matchMedia, list: matchMedia(BREAKPOINTS[name]) }
    queries.set(name, query)
  }
  return query.list
}

/**
 * The breakpoints of `used` the window is below now (as a key, `"sm md"`):
 * the columns hidden below them take no width. Nothing on the server.
 */
function useBelowBreakpoints(used: ReadonlyArray<Breakpoint>) {
  const key = [...new Set(used)].sort().join(" ")
  const supported = typeof matchMedia === "function"
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!key || !supported) return () => undefined
      const lists = key.split(" ").map((name) => queryOf(name as Breakpoint))
      for (const list of lists) list.addEventListener("change", listener)
      return () => {
        for (const list of lists) list.removeEventListener("change", listener)
      }
    },
    [key, supported]
  )
  const below = React.useSyncExternalStore(
    subscribe,
    () =>
      !key || !supported
        ? ""
        : key
            .split(" ")
            .filter((name) => !queryOf(name as Breakpoint).matches)
            .join(" "),
    () => ""
  )
  return React.useMemo(() => new Set(below.split(" ")), [below])
}

/** The key of the selection column's measured width. */
const SELECTION = "\u0000selection"
/** The key of the drag handle column's measured width. */
const HANDLE = "\u0000handle"
/** The selection column before it is measured: a checkbox and the cell's start padding. */
const SELECTION_WIDTH = 32
/** The handle column before it is measured: a small icon button and the cell's padding. */
const HANDLE_WIDTH = 56

/** The frame's variables for `sizing`, the scrollbar's width included at the end. */
function sizingVariables(
  sizing: ColumnSizing,
  scrollbar: number,
  rtl: boolean
): Record<string, string> {
  const variables: Record<string, string> = {
    "--data-table-pinned-start": `${sizing.start}px`,
    "--data-table-pinned-end": `${sizing.end > 0 ? sizing.end + scrollbar : 0}px`,
    "--data-table-fade-start": sizing.start > 0 ? "1" : "0",
    "--data-table-fade-end": sizing.end > 0 ? "1" : "0",
    "--data-table-fade-to": rtl ? "left" : "right",
  }
  sizing.offsets.forEach((offset, index) => {
    if (offset !== undefined)
      variables[`--data-table-pin-${index}`] = `${offset}px`
  })
  return variables
}

/** Where a pinned cell sticks: its variable, so a resize moves it unrendered. */
function pinOffset(index: number) {
  return `var(--data-table-pin-${index})`
}

/** A table's `col` widths: none for the filler, which takes the space left. */
function colWidths(sizing: ColumnSizing) {
  return sizing.widths.map((width, index) =>
    index === sizing.filler ? undefined : width
  )
}

type ColumnSizer = {
  mode: SizingMode
  /** The widths, while they are fixed (or measured). */
  sizing: ColumnSizing | null
  /** The widths of the columns of controls, in px, while fixed. */
  controls: { handle: number; selection: number }
  /** The frame's variables for `sizing`. */
  style: React.CSSProperties | undefined
  /** Draws `column` at `width` until the next render, without rendering. */
  preview: (column: string, width: number) => void
  /** Draws the widths the table has, after a preview the view did not take. */
  restore: () => void
  /** The width of a column's content: its widest cell rendered, or its header. */
  fit: (column: string) => number | null
}

function useColumnSizing({
  frame,
  container,
  layout,
  widths,
  selection,
  handle = false,
  fixed,
  ready,
  rows,
  rtl,
}: {
  frame: React.RefObject<HTMLElement | null>
  /** The table's scroll container. */
  container: React.RefObject<HTMLElement | null>
  layout: ColumnLayout<unknown>
  /** The widths the user set (`view.columns.widths`): such a column never stretches. */
  widths: Readonly<Record<string, number>>
  /** A selection column comes before the data columns. */
  selection: boolean
  /** A drag handle column comes first. */
  handle?: boolean
  /** The table is laid out with fixed widths. */
  fixed: boolean
  /** The table can be measured (not the first load's skeleton). */
  ready: boolean
  /** Rows are shown and not loading: their content is what is measured. */
  rows: boolean
  rtl: boolean
}): ColumnSizer {
  const [measured, setMeasured] = React.useState<{
    widths: Readonly<Partial<Record<string, number>>>
    /** Measured with rows: no need to measure again when rows come. */
    rows: boolean
  }>({ widths: {}, rows: false })
  const [scrollbar, setScrollbar] = React.useState(0)
  // A table hidden while it was to be measured (in a closed tab) is
  // measured once it is shown.
  const [shown, setShown] = React.useState(0)
  const below = useBelowBreakpoints(
    layout.columns.flatMap((column) => column.definition.hideBelow ?? [])
  )
  const hidden = React.useCallback(
    (column: EngineColumn<unknown>) => {
      const { hideBelow } = column.definition
      return hideBelow !== undefined && below.has(hideBelow)
    },
    [below]
  )

  const unsized = layout.columns.filter(
    (column) => layout.width(column.id) === undefined
  )
  const missing =
    fixed &&
    ((selection && measured.widths[SELECTION] === undefined) ||
      (handle && measured.widths[HANDLE] === undefined) ||
      unsized.some((column) => measured.widths[column.id] === undefined) ||
      (rows && !measured.rows && unsized.length > 0))
  const mode: SizingMode = !fixed
    ? "auto"
    : missing && ready
      ? "measure"
      : "fixed"
  const controls = React.useMemo(
    () => ({
      handle: handle ? measured.widths[HANDLE] || HANDLE_WIDTH : 0,
      selection: selection ? measured.widths[SELECTION] || SELECTION_WIDTH : 0,
    }),
    [handle, selection, measured]
  )
  const sizing = React.useMemo(
    () =>
      fixed
        ? sizeColumns(layout, {
            widthOf: (column) => columnWidth(column, layout, measured.widths),
            // The columns of controls size as one.
            selection:
              selection || handle
                ? controls.handle + controls.selection
                : undefined,
            hidden,
            stretches: (column) => !Object.hasOwn(widths, column.id),
          })
        : null,
    [fixed, layout, measured, selection, handle, controls, hidden, widths]
  )
  const lead = (handle ? 1 : 0) + (selection ? 1 : 0)

  React.useLayoutEffect(() => {
    if (mode !== "measure") return
    const element = frame.current
    const table = element?.querySelector("table")
    const head = table?.tHead?.rows
    if (!element || !table || !head?.length) return
    if (table.getBoundingClientRect().width <= 0) {
      if (typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(() => {
        if (element.getBoundingClientRect().width > 0) setShown((n) => n + 1)
      })
      observer.observe(element)
      return () => observer.disconnect()
    }
    // Every column at its content's width, none given the space left.
    const width = table.style.width
    table.style.width = "max-content"
    try {
      const cells = [...head[head.length - 1].cells]
      const next: Partial<Record<string, number>> = { ...measured.widths }
      if (handle) next[HANDLE] = Math.ceil(widthOf(cells[0]))
      if (selection) next[SELECTION] = Math.ceil(widthOf(cells[handle ? 1 : 0]))
      layout.columns.forEach((column, index) => {
        if (layout.width(column.id) !== undefined) return
        const cell = cells[index + lead] as Element | undefined
        // 0: not laid out (hidden below a breakpoint); it takes the default.
        next[column.id] = cell ? Math.ceil(widthOf(cell)) : 0
      })
      setMeasured({ widths: next, rows })
    } finally {
      table.style.width = width
    }
  }, [mode, frame, layout, measured, selection, handle, lead, rows, shown])

  // A pinned end edge sits clear of a vertical scrollbar (a virtualized
  // body), which the fade must leave alone too.
  const pinnedEnd = layout.pinnedEnd > 0
  React.useLayoutEffect(() => {
    if (pinnedEnd) setScrollbar(scrollbarOf(container.current))
  })

  const latest = React.useRef({
    layout,
    measured: measured.widths,
    widths,
    hidden,
    lead,
    sizing,
    rtl,
  })
  React.useInsertionEffect(() => {
    latest.current = {
      layout,
      measured: measured.widths,
      widths,
      hidden,
      lead,
      sizing,
      rtl,
    }
  })

  /** Sets the frame's variables and the `col` widths for `next`. */
  const draw = (next: ColumnSizing) => {
    const element = frame.current
    if (!element) return
    // Only what changed: a variable of the frame's restyles every cell.
    for (const [name, value] of Object.entries(
      sizingVariables(next, scrollbarOf(container.current), latest.current.rtl)
    ))
      if (element.style.getPropertyValue(name) !== value)
        element.style.setProperty(name, value)
    const table = element.querySelector("table")
    if (table) Object.assign(table.style, tableStyle(next))
    const cols = element.querySelectorAll<HTMLElement>(
      'colgroup[data-slot="data-table-columns"] > col'
    )
    const offset = latest.current.lead
    colWidths(next).forEach((value, index) => {
      const col = cols[index + offset] as HTMLElement | undefined
      if (col) col.style.width = value === undefined ? "" : `${value}px`
    })
  }

  const [actions] = React.useState(() => ({
    preview(id: string, width: number) {
      const current = latest.current
      if (!current.sizing) return
      // The column takes the width it is given, stretching or not.
      draw(
        sizeColumns(current.layout, {
          widthOf: (column) =>
            column.id === id
              ? width
              : columnWidth(column, current.layout, current.measured),
          selection: current.sizing.selection,
          hidden: current.hidden,
          stretches: (column) =>
            column.id !== id && !Object.hasOwn(current.widths, column.id),
        })
      )
    },
    restore() {
      const { sizing: current } = latest.current
      if (current) draw(current)
    },
    fit(id: string) {
      const current = latest.current
      const index = current.layout.columns.findIndex(
        (column) => column.id === id
      )
      const table = frame.current?.querySelector("table")
      const head = table?.tHead?.rows
      if (index < 0 || !table || !head?.length) return null
      const offset = current.lead
      const cell = head[head.length - 1].cells[index + offset] as
        HTMLTableCellElement | undefined
      const col = table.querySelector<HTMLElement>(
        `colgroup[data-slot="data-table-columns"] > col:nth-child(${index + offset + 1})`
      )
      if (!cell) return null
      // Laid out at its content's width: the column is as wide as its
      // widest cell (rendered) or its header.
      const { style } = table
      const saved = {
        tableLayout: style.tableLayout,
        width: style.width,
        minWidth: style.minWidth,
        col: col?.style.width ?? "",
      }
      Object.assign(style, {
        tableLayout: "auto",
        width: "max-content",
        minWidth: "0",
      })
      if (col) col.style.width = ""
      try {
        return Math.ceil(widthOf(cell))
      } finally {
        Object.assign(style, {
          tableLayout: saved.tableLayout,
          width: saved.width,
          minWidth: saved.minWidth,
        })
        if (col) col.style.width = saved.col
      }
    },
  }))

  const style = React.useMemo(
    () =>
      sizing
        ? (sizingVariables(sizing, scrollbar, rtl) as React.CSSProperties)
        : undefined,
    [sizing, scrollbar, rtl]
  )
  return { mode, sizing, controls, style, ...actions }
}

function widthOf(element: Element) {
  return element.getBoundingClientRect().width
}

/** The width of the vertical scrollbar of the table's container. */
function scrollbarOf(container: HTMLElement | null) {
  return container
    ? Math.max(0, container.offsetWidth - container.clientWidth)
    : 0
}

/**
 * The table's width: the columns' sum, and at least its frame's while a
 * column stretches to fill it.
 */
function tableStyle(sizing: ColumnSizing) {
  return {
    width: `${sizing.total}px`,
    minWidth: sizing.filler >= 0 ? "100%" : "",
  }
}

export { colWidths, pinOffset, tableStyle, useColumnSizing }
export type { ColumnSizer, SizingMode }
