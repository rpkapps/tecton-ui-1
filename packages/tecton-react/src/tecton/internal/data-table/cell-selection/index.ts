/**
 * Cell selection's code, loaded on demand (`lazy.ts`, the `cellSelection`
 * feature): what the keys, a press and a drag do to the ranges, copying,
 * pasting, clearing and filling down. The ranges as drawn are resolved
 * with the table (`engine/cells.ts`); everything here reads the engine,
 * never the DOM, so cells of rows out of view are copied and written too.
 *
 * - Moving focus selects the cell it goes to; with Shift, the range from
 *   its anchor (where it was begun) to that cell. A click selects the cell,
 *   Shift + click extends the range, Ctrl / Cmd + click adds a range.
 *   Focus is on the corner that moves (the range's `end`), so it is read
 *   with its "selected" state, and the next Shift + arrow goes on from it.
 * - With no range, the focused cell stands for the selection (copy, paste,
 *   Delete).
 * - Copy (Excel's rules for several ranges): of one range, its cells; of
 *   ranges in the same rows, their columns side by side; in the same
 *   columns, their rows one under the other; of others, nothing, and the
 *   reason is announced. The display text of each cell, as tab-separated
 *   text and an HTML table.
 * - Paste: one value fills every selected cell; a block pastes from the
 *   range's first cell, repeated over a range that is a multiple of it,
 *   else once (beyond the range when larger, cut at the table's last row
 *   and column), and the range becomes the cells pasted. Not into several
 *   ranges (but one value).
 * - Fill down: each range's first row into the rows below it, in each
 *   column; a range of one row takes the row above it.
 * - Every write goes through `writeCells` (`cell-write.ts`), which writes
 *   only the cells that can be; the result is announced ("Pasted 6 cells,
 *   2 not editable").
 */
import { announce } from "../../primitives/live-announcer"
import type { Translator } from "../../i18n/translations"
import { describeWrite, writeCells, type CellWrite } from "../cell-write"
import type { CellCommand, CellEnvironment, CellEvent } from "../cells"
import type { DataTableContextValue } from "../context"
import { cellCount, forEachCell, itemRowsIn } from "../engine/cell-ranges"
import { resolveCells, type CellGrid, type CellRect } from "../engine/cells"
import type { EngineRow, ItemRow } from "../engine/rows"
import type {
  DataTableCellPosition,
  DataTableCellRange,
  DataTableCellSelectionChangeReason,
} from "../engine/types"
import { startCellDrag } from "./drag"
import { parseTsv, toHtml, toTsv } from "./tsv"

type CellHost = {
  context: DataTableContextValue<unknown>
  t: Translator<"dataTable">
  /** The focused data cell: the selection while there is no range. */
  focused: DataTableCellPosition | null
}

/** The selection as it is now (changes not rendered yet included), over the rows shown. */
function gridOf(host: CellHost): CellGrid<unknown> {
  const { store, actions } = host.context
  const state = store.get()
  const ranges = actions.currentCellSelection()
  if (state.cellGrid && state.cellGrid.ranges === ranges) return state.cellGrid
  return resolveCells(ranges, state.model, state.layout.columns)
}

/** The ranges in effect, or the focused cell's when there is none. */
function rectsOf(host: CellHost, grid: CellGrid<unknown>) {
  if (grid.rects.length || !host.focused) return grid
  const focused = resolveCells(
    [{ start: host.focused, end: host.focused }],
    grid.model,
    grid.columns
  )
  return focused
}

function select(
  host: CellHost,
  ranges: ReadonlyArray<DataTableCellRange>,
  reason: DataTableCellSelectionChangeReason,
  event?: Event
) {
  return host.context.actions.setCellSelection(ranges, reason, event)
}

/** Whether a cell is shown: its row an item row shown, its column shown. */
function isShown(grid: CellGrid<unknown>, at: DataTableCellPosition) {
  const index = grid.model.indexOfRow(at.row)
  return (
    index >= 0 &&
    grid.rows[index]?.kind === "item" &&
    grid.columnIndex(at.column) >= 0
  )
}

/** Focus moved to a cell (`to`), from `from`; `extend`: Shift, `add`: Ctrl / Cmd (a press). */
function navigate(
  host: CellHost,
  to: DataTableCellPosition,
  from: DataTableCellPosition | null,
  { extend, add }: { extend: boolean; add: boolean },
  reason: DataTableCellSelectionChangeReason,
  event?: Event
) {
  const { store, actions } = host.context
  const range = store.get().options.cellSelectionMode === "range"
  const ranges = actions.currentCellSelection()
  if (range && extend) {
    const grid = gridOf(host)
    const last = ranges.at(-1)
    const anchor = last && isShown(grid, last.start) ? last.start : (from ?? to)
    return select(
      host,
      [...ranges.slice(0, -1), { start: anchor, end: to }],
      reason,
      event
    )
  }
  if (range && add)
    return select(host, [...ranges, { start: to, end: to }], reason, event)
  return select(host, [{ start: to, end: to }], reason, event)
}

/** The first and last item rows shown, on every page. */
function edgeRows(rows: ReadonlyArray<EngineRow<unknown>>) {
  let first: ItemRow<unknown> | undefined
  let last: ItemRow<unknown> | undefined
  for (const row of rows)
    if (row.kind === "item") {
      first ??= row
      last = row
    }
  return first && last ? { first, last } : null
}

function announceSelected(host: CellHost) {
  const grid = gridOf(host)
  const count = cellCount(grid)
  const { locale } = host.context.store.get().formatter
  if (count > 0)
    announce(
      host.t("cellsSelected", {
        count,
        total: count.toLocaleString(locale),
      })
    )
}

/** A key's command (`cells.tsx` tells them apart). */
function runCommand(host: CellHost, command: CellCommand, event?: Event) {
  const { actions } = host.context
  const grid = gridOf(host)
  const { columns, rows } = grid
  const firstColumn = columns.at(0)
  const lastColumn = columns.at(-1)
  const current = actions.currentCellSelection()
  const last =
    current.at(-1) ??
    (host.focused ? { start: host.focused, end: host.focused } : null)
  switch (command) {
    case "select-all": {
      const edges = edgeRows(rows)
      if (!edges || !firstColumn || !lastColumn) return
      if (
        select(
          host,
          [
            {
              start: { row: edges.first.id, column: firstColumn.id },
              end: { row: edges.last.id, column: lastColumn.id },
            },
          ],
          "select-all",
          event
        )
      )
        announceSelected(host)
      return
    }
    case "select-row":
      if (!last || !firstColumn || !lastColumn) return
      if (
        select(
          host,
          [
            ...current.slice(0, -1),
            {
              start: { row: last.start.row, column: firstColumn.id },
              end: { row: last.end.row, column: lastColumn.id },
            },
          ],
          "keyboard",
          event
        )
      )
        announceSelected(host)
      return
    case "select-column": {
      const edges = edgeRows(rows)
      if (!last || !edges) return
      if (
        select(
          host,
          [
            ...current.slice(0, -1),
            {
              start: { row: edges.first.id, column: last.start.column },
              end: { row: edges.last.id, column: last.end.column },
            },
          ],
          "keyboard",
          event
        )
      )
        announceSelected(host)
      return
    }
    case "clear-selection":
      select(host, [], "clear", event)
      return
    case "clear":
      clearCells(host, event)
      return
    case "fill":
      fillDown(host, event)
  }
}

function locale(host: CellHost) {
  return host.context.store.get().formatter.locale
}

function clearCells(host: CellHost, event?: Event) {
  const writes: Array<CellWrite> = []
  forEachCell(rectsOf(host, gridOf(host)), (row, column) => {
    writes.push({ row: row.id, column: column.id, value: null })
  })
  if (writes.length === 0) return
  const outcome = writeCells(host, writes, "clear", event)
  if (!outcome.canceled)
    announce(describeWrite(host.t, locale(host), "clear", outcome))
}

/** The item row before `index`, if any. */
function rowAbove(rows: ReadonlyArray<EngineRow<unknown>>, index: number) {
  for (let r = index - 1; r >= 0; r--) {
    const row = rows[r]
    if (row.kind === "item") return row
  }
  return undefined
}

function fillDown(host: CellHost, event?: Event) {
  const grid = rectsOf(host, gridOf(host))
  const { rows, columns } = grid
  // By cell: where ranges overlap, the later one's value.
  const writes = new Map<string, CellWrite>()
  for (const rect of grid.rects) {
    const shown = itemRowsIn(rows, rect.top, rect.bottom)
    const source = shown.length > 1 ? rows[shown[0]] : rowAbove(rows, rect.top)
    if (source?.kind !== "item") continue
    const targets = shown.length > 1 ? shown.slice(1) : shown
    for (let c = rect.first; c <= rect.last; c++) {
      const column = columns[c]
      const value = column.getValue(source.item)
      for (const r of targets) {
        const row = rows[r] as ItemRow<unknown>
        writes.set(`${c}\u0000${row.id}`, {
          row: row.id,
          column: column.id,
          value,
        })
      }
    }
  }
  if (writes.size === 0) return
  const outcome = writeCells(host, [...writes.values()], "fill", event)
  if (!outcome.canceled)
    announce(describeWrite(host.t, locale(host), "fill", outcome))
}

/** The rows and columns to copy (Excel's rules for several ranges), or why not. */
function copyArea(
  rects: ReadonlyArray<CellRect>,
  rows: ReadonlyArray<EngineRow<unknown>>
): { rows: Array<number>; columns: Array<number> } | null {
  const span = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const [first] = rects
  const sameRows = rects.every(
    (rect) => rect.top === first.top && rect.bottom === first.bottom
  )
  if (sameRows) {
    const columns = new Set<number>()
    for (const rect of rects)
      for (const c of span(rect.first, rect.last)) columns.add(c)
    return {
      rows: itemRowsIn(rows, first.top, first.bottom),
      columns: [...columns].sort((a, b) => a - b),
    }
  }
  const sameColumns = rects.every(
    (rect) => rect.first === first.first && rect.last === first.last
  )
  if (!sameColumns) return null
  const indices = new Set<number>()
  for (const rect of rects)
    for (const r of itemRowsIn(rows, rect.top, rect.bottom)) indices.add(r)
  return {
    rows: [...indices].sort((a, b) => a - b),
    columns: span(first.first, first.last),
  }
}

type Copied =
  { tsv: string; html: string; count: number } | { error: string } | null

/** The selected cells as text (see the module comment); `null` with nothing selected. */
function copyCells(host: CellHost): Copied {
  const grid = rectsOf(host, gridOf(host))
  if (grid.rects.length === 0) return null
  const area = copyArea(grid.rects, grid.rows)
  if (!area) return { error: host.t("copyMultiple") }
  const { formatter } = host.context.store.get()
  const columns = area.columns.map((index) => grid.columns[index])
  const fields = area.rows.map((index) => {
    const { item } = grid.rows[index] as ItemRow<unknown>
    return columns.map((column) => formatter.text(column, item))
  })
  return {
    tsv: toTsv(fields),
    html: toHtml(fields),
    count: fields.length * columns.length,
  }
}

function announceCopied(host: CellHost, copied: Copied) {
  if (!copied) return
  if ("error" in copied) return announce(copied.error)
  announce(
    host.t("cellsCopied", {
      count: copied.count,
      total: copied.count.toLocaleString(locale(host)),
    })
  )
}

/**
 * Copies the selection: into a copy event's `clipboardData` when given
 * (synchronous, both formats), else through the Clipboard API. Returns the
 * text copied, `""` for none.
 */
async function copy(host: CellHost, data?: DataTransfer | null) {
  const copied = copyCells(host)
  if (!copied || "error" in copied) {
    announceCopied(host, copied)
    return ""
  }
  if (data) {
    data.setData("text/plain", copied.tsv)
    data.setData("text/html", copied.html)
  } else {
    const clipboard = clipboardApi()
    if (!clipboard?.writeText) return copied.tsv
    try {
      if (typeof ClipboardItem === "function" && clipboard.write)
        await clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([copied.tsv], { type: "text/plain" }),
            "text/html": new Blob([copied.html], { type: "text/html" }),
          }),
        ])
      else await clipboard.writeText(copied.tsv)
    } catch {
      announce(host.t("copyFailed"))
      return copied.tsv
    }
  }
  announceCopied(host, copied)
  return copied.tsv
}

/** The Clipboard API, where the browser has it (secure contexts only). */
function clipboardApi(): Partial<Clipboard> | undefined {
  return typeof navigator === "undefined"
    ? undefined
    : (navigator as { clipboard?: Clipboard }).clipboard
}

/** The item rows from `top` down, `count` of them at most. */
function rowsFrom(
  rows: ReadonlyArray<EngineRow<unknown>>,
  top: number,
  count: number
) {
  const found: Array<ItemRow<unknown>> = []
  for (let r = top; r < rows.length && found.length < count; r++) {
    const row = rows[r]
    if (row.kind === "item") found.push(row)
  }
  return found
}

/** Pastes tab-separated text into the selection (see the module comment). */
function paste(host: CellHost, text: string, event?: Event) {
  const state = host.context.store.get()
  if (!state.options.editable) return
  const block = parseTsv(text)
  if (block.length === 0) return
  const grid = rectsOf(host, gridOf(host))
  const { rows, columns, rects } = grid
  if (rects.length === 0) return
  const single = block.length === 1 && block[0].length === 1
  if (rects.length > 1 && !single) return announce(host.t("pasteMultiple"))
  const writes: Array<CellWrite> = []
  let area: DataTableCellRange | null = null
  if (single) {
    const [[value]] = block
    forEachCell(grid, (row, column) => {
      writes.push({ row: row.id, column: column.id, text: value })
    })
  } else {
    const [rect] = rects
    const shown = itemRowsIn(rows, rect.top, rect.bottom)
    const height = block.length
    const width = block[0].length
    const across = rect.last - rect.first + 1
    const tiled =
      shown.length % height === 0 &&
      across % width === 0 &&
      (shown.length > height || across > width)
    const targets = tiled
      ? shown.map((index) => rows[index] as ItemRow<unknown>)
      : rowsFrom(rows, rect.top, height)
    const last = tiled
      ? rect.last
      : Math.min(rect.first + width - 1, columns.length - 1)
    targets.forEach((row, i) => {
      for (let c = rect.first; c <= last; c++)
        writes.push({
          row: row.id,
          column: columns[c].id,
          text: block[i % height][(c - rect.first) % width],
        })
    })
    if (targets.length)
      area = {
        start: { row: targets[0].id, column: columns[rect.first].id },
        end: { row: targets.at(-1)!.id, column: columns[last].id },
      }
  }
  const outcome = writeCells(host, writes, "paste", event)
  if (outcome.canceled) return
  if (area) select(host, [area], "paste", event)
  announce(describeWrite(host.t, locale(host), "paste", outcome))
}

/**
 * What a table's cells do with what the user did (`cells.tsx` records it):
 * `run` acts on one event, `stop` ends a drag still going.
 */
function createCellController(environment: CellEnvironment) {
  let stopDrag: (() => void) | null = null
  const host = (focused: DataTableCellPosition | null): CellHost => ({
    context: environment.context,
    t: environment.t(),
    focused,
  })
  const drag = (press: { x: number; y: number }) => {
    const table = environment.table()
    const container = environment.container()
    if (!table || !container) return
    stopDrag?.()
    stopDrag = startCellDrag({
      table,
      container,
      x: press.x,
      y: press.y,
      cellAt: (cell) => environment.positionOf(cell) !== null,
      onCell: (cell) => {
        const to = environment.positionOf(cell)
        if (!to) return
        environment.grid.current?.focusCell(cell, false)
        navigate(
          host(null),
          to,
          null,
          { extend: true, add: false },
          "item-press"
        )
      },
    })
  }
  const run = (entry: CellEvent) => {
    switch (entry.kind) {
      case "navigate":
        navigate(
          host(entry.from),
          entry.to,
          entry.from,
          entry,
          entry.press ? "item-press" : "keyboard",
          entry.event
        )
        if (
          entry.press &&
          !entry.press.released &&
          environment.context.store.get().options.cellSelectionMode === "range"
        )
          drag(entry.press)
        return
      case "command":
        runCommand(host(entry.focused), entry.command, entry.event)
        return
      case "paste": {
        if (entry.text !== null) {
          paste(host(entry.focused), entry.text, entry.event)
          return
        }
        clipboardApi()
          ?.readText?.()
          .then((text) => paste(host(entry.focused), text, entry.event))
          .catch(() => undefined)
        return
      }
      case "copy":
        void copy(host(entry.focused), entry.data)
    }
  }
  return {
    run,
    stop: () => {
      stopDrag?.()
      stopDrag = null
    },
  }
}

/** A command of `useDataTable`; resolves with the text copied (`""` otherwise). */
async function runCellCommand(
  host: CellHost,
  command: "copy" | "paste" | "clear" | "fill",
  text?: string
): Promise<string> {
  switch (command) {
    case "copy":
      return copy(host)
    case "paste":
      paste(host, text ?? "")
      return ""
    case "clear":
      clearCells(host)
      return ""
    case "fill":
      fillDown(host)
      return ""
  }
}

export {
  copy,
  createCellController,
  navigate,
  paste,
  runCellCommand,
  runCommand,
}
export type { CellHost }
