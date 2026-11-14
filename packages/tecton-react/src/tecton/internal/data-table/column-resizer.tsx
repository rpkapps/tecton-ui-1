"use client"

/**
 * A column header's resizer in `DataTableContent` (`resizableColumns`),
 * loaded on demand with `TableColumnResizer` (`RESIZER` in `lazy.ts`):
 * everything a resize does once the resizer is there, which nothing
 * reaches before.
 *
 * - A drag or the keys draw the width through the sizer's `preview`, so
 *   only this resizer renders until the drag ends; the view takes the
 *   width then, and the widths drawn are the table's again after each
 *   commit (the old one when the view did not take the new one).
 * - Resize mode, from the column menu's "Resize column": the resizer has
 *   focus, the keys change the width drawn, Enter, Tab or leaving keeps it
 *   and Escape puts it back; both give focus back to the menu button.
 * - Fit to content (the menu, a double click): the column laid out at its
 *   content's width for a moment, its widest cell rendered or its header.
 */
import * as React from "react"

import { TableColumnResizer } from "../../table-column-resizer"
import { useTranslations } from "../i18n/translations"
import { atContentWidth, cellsByColumn } from "../table-grid"
import { headerWidthOf, type ColumnSizer } from "./column-sizing"
import type { DataTableContextValue } from "./context"
import {
  clampColumnWidth,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  setColumnWidth,
  type EngineColumn,
} from "./engine/index"

/**
 * The width a column shows while its resizer is dragged; the filler shows
 * its real width, which the space it takes makes wider than its own.
 */
function useShownWidth(
  cell: HTMLElement | null,
  filler: boolean,
  width: number
) {
  const [rendered, setRendered] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    if (!filler || !cell || typeof ResizeObserver === "undefined") {
      setRendered(null)
      return
    }
    const update = () =>
      setRendered(Math.round(cell.getBoundingClientRect().width) || null)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(cell)
    return () => observer.disconnect()
  }, [cell, filler])
  return Math.max(width, rendered ?? 0)
}

/**
 * The width of the content of the column whose header `cell` is: laid out
 * at its content's width, its widest cell rendered or its header. `at` is
 * its place among the table's columns, those of controls first.
 */
function fitWidth(cell: HTMLElement, at: number) {
  const table = cell.closest("table")
  const head = table?.tHead?.rows
  if (!table || !head?.length) return null
  const last = head[head.length - 1]
  const header = (cellsByColumn(last) ?? [...last.cells])[at] as
    HTMLTableCellElement | undefined
  if (!header) return null
  const col = table.querySelector<HTMLElement>(
    `colgroup[data-slot="data-table-columns"] > col:nth-child(${at + 1})`
  )
  return atContentWidth(table, () => Math.ceil(headerWidthOf(header)), col)
}

type DataTableColumnResizerProps = {
  column: EngineColumn<unknown>
  context: DataTableContextValue<unknown>
  sizer: ColumnSizer
  /** The column's place among the table's columns, those of controls first. */
  at: number
  /** The column's width as laid out. */
  width: number
  /** The column takes the space left (`ColumnSizing.filler`). */
  filler: boolean
  edge: "start" | "end"
  className: string | undefined
  /** The resizer, which the column's menu focuses ("Resize column"). */
  resizerRef: React.RefObject<HTMLDivElement | null>
  /** The column's menu button, which resize mode gives focus back to. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
  /** Filled with Fit to content, for the column's menu. */
  fitRef: React.RefObject<((event: Event | undefined) => void) | null>
}

function DataTableColumnResizer({
  column,
  context,
  sizer,
  at,
  width,
  filler,
  edge,
  className,
  resizerRef,
  triggerRef,
  fitRef,
}: DataTableColumnResizerProps) {
  const t = useTranslations("dataTable")
  const hintId = `${React.useId()}-resize`
  const [cell, setCell] = React.useState<HTMLElement | null>(null)
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      resizerRef.current = node
      setCell(node?.parentElement ?? null)
    },
    [resizerRef]
  )
  // The resizer's width while it changes: drawn through `preview`, so only
  // this resizer renders until the drag ends (or the keyboard is done).
  const [live, setLive] = React.useState<number | null>(null)
  const shownWidth = useShownWidth(cell, filler, width)
  // After each commit, the widths drawn are the table's again: the new
  // one, or the old one when the view did not take it (cancelled, or a
  // controlled view left as it was).
  const [commits, setCommits] = React.useState(0)
  const { restore } = sizer
  React.useLayoutEffect(() => {
    if (commits > 0) restore()
  }, [commits, restore])
  // The width the column had as a drag or resize mode began: what a commit
  // compares with (the filler's own width follows the preview).
  const start = React.useRef<number | null>(null)
  const commit = (next: number, event: Event | undefined) => {
    const from = start.current ?? shownWidth
    start.current = null
    setLive(null)
    setCommits((count) => count + 1)
    // A width the column had already, which the view does not hold, is no
    // change: a cancelled drag, a key at a bound.
    const set = Object.hasOwn(
      context.store.get().view.columns.widths,
      column.id
    )
    if (!set && next === from) return
    context.actions.updateView(
      (view) => setColumnWidth(view, column.id, next),
      "resize",
      event
    )
  }
  const fit = (event: Event | undefined) => {
    const fitted = cell ? fitWidth(cell, at) : null
    if (fitted !== null)
      commit(clampColumnWidth(column.minWidth, column.maxWidth, fitted), event)
  }
  React.useInsertionEffect(() => {
    fitRef.current = fit
  })
  React.useEffect(
    () => () => {
      fitRef.current = null
    },
    [fitRef]
  )
  // Resize mode, from the menu's "Resize column".
  const [resizing, setResizing] = React.useState(false)
  const keyboard = React.useRef(false)
  const enter = () => {
    keyboard.current = true
    setResizing(true)
  }
  const leave = (keep: boolean, event?: Event) => {
    if (!keyboard.current) return
    keyboard.current = false
    setResizing(false)
    if (keep && live !== null) commit(live, event)
    else if (live !== null) {
      start.current = null
      setLive(null)
      restore()
    }
  }
  const min = column.minWidth ?? MIN_COLUMN_WIDTH
  return (
    <>
      <TableColumnResizer
        ref={ref}
        // Not one of the grid's stops, and a press does not focus it: the
        // menu's "Resize column" reaches it (resize mode).
        tabIndex={-1}
        onMouseDown={(event) => event.preventDefault()}
        aria-describedby={resizing ? hintId : undefined}
        className={className}
        edge={edge}
        label={column.header}
        // A column hidden below a breakpoint has no width: its own then.
        value={Math.max(min, live ?? shownWidth)}
        min={min}
        // The default ceiling bounds the widths the user sets, never the
        // width the column has (a stretched one may be wider).
        max={
          column.maxWidth ??
          Math.max(
            MAX_COLUMN_WIDTH,
            live === null ? shownWidth : (start.current ?? shownWidth)
          )
        }
        // Only the menu's "Resize column" focuses it (a press does not).
        onFocus={enter}
        onBlur={(event) => leave(true, event.nativeEvent)}
        onKeyDown={(event) => {
          const keep = event.key === "Enter" || event.key === "Tab"
          if (!keep && event.key !== "Escape") return
          event.preventDefault()
          event.stopPropagation()
          leave(keep, event.nativeEvent)
          triggerRef.current?.focus()
        }}
        onValueChange={(next) => {
          start.current ??= live ?? shownWidth
          setLive(next)
          sizer.preview(column.id, next)
        }}
        // A drag ends with its width; keys wait for Enter (resize mode).
        onValueCommitted={(next, details) => {
          if (details.reason === "drag") commit(next, details.event)
        }}
        // A double click fits the column to its content.
        onDoubleClick={(event) => {
          event.preventDefault()
          fit(event.nativeEvent)
        }}
      />
      <span id={hintId} hidden>
        {t("resizeHint")}
      </span>
    </>
  )
}

export { DataTableColumnResizer }
export type { DataTableColumnResizerProps }
