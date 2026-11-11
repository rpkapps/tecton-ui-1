/**
 * Cell selection's code, loaded on demand (`lazy.ts`, the `cellSelection`
 * feature): the ranges resolved over the rows and columns shown, for the
 * root to draw (`resolveSelection`, `engine/cells.ts`); what the keys, a
 * press and a drag do to them, copying, pasting, clearing and filling
 * down; and the table's side of it once it is there (`attachCells`: what
 * `cells.tsx` kept until then, then its events, and the clipboard's).
 * Everything here reads the engine, never the DOM, so cells of rows out
 * of view are copied and written too.
 *
 * - Tab into a table with no cell selected selects the cell it enters.
 * - Moving focus selects the cell it goes to; with Shift, the range from
 *   its anchor (where it was begun) to that cell. A click selects the cell,
 *   Shift + click extends the range, Ctrl / Cmd + click adds a range.
 * - Focus is on the range's moving corner (its rows' and columns' `end`):
 *   so it is read with its "selected" state, and the next Shift + arrow
 *   goes on from it. Commands that set a range move focus there (whole
 *   rows: the last row, in the focused column; a paste: its last cell);
 *   every cell (`{}`) leaves focus where it is.
 * - Shift + arrows on whole rows move their last row (and on whole columns
 *   their last column): the range stays whole. On every cell, the first
 *   Shift + arrow makes the range the rows (or columns) from the first to
 *   the last, then moves its end; one that cannot (Shift + Down, past the
 *   last row) leaves every cell selected, and focus where it was.
 * - With no range, the focused cell stands for the selection (copy, paste,
 *   Delete). With focus off the data cells (a header, a group or totals
 *   row), copy, paste, Delete and fill down say to select cells first.
 * - Copy (Excel's rules for several ranges): of one range, its cells; of
 *   ranges in the same rows, their columns side by side; in the same
 *   columns, their rows one under the other; of others, nothing, and the
 *   reason is announced. Each cell's display text, as tab-separated text,
 *   an HTML table (numbers and dates carrying their values for Excel, text
 *   marked as text) and the values themselves (a custom type, best effort:
 *   a paste into a table reads them back exactly); past 100,000 cells, the
 *   text only. Text that a spreadsheet would run as a formula gets a
 *   leading `'` (`escapeFormulas`).
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
import { isTextEntry, type TableGridController } from "../../table-grid"
import { describeWrite, writeCells, type CellWrite } from "../cell-write"
import type { CellCommand, CellEvent, CellHandlers, CellSide } from "../cells"
import type { DataTableContextValue } from "../context"
import { forEachCell, itemRowsIn } from "../engine/cell-ranges"
import { resolveSelection, type CellGrid, type CellRect } from "../engine/cells"
import type { EngineColumn } from "../engine/columns"
import type { EngineRow, ItemRow } from "../engine/rows"
import type {
  DataTableCellPosition,
  DataTableCellRange,
  DataTableCellSelectionChangeReason,
  DataTableValue,
} from "../engine/types"
import { partsIn, toDate, toNumber } from "../engine/values"
import { startCellDrag } from "./drag"
import { htmlCell, htmlTable, parseTsv, tsvField } from "./tsv"

type Position = DataTableCellPosition

/** What the code works with: the table, its cells and the grid. */
type CellEnvironment = {
  context: DataTableContextValue<unknown>
  t: () => Translator<"dataTable">
  table: () => HTMLTableElement | null
  /** The table's scroll container. */
  container: () => HTMLElement | null
  grid: { readonly current: TableGridController | null }
  /** A cell's place, when it is a data cell of an item row of this table. */
  positionOf: (cell: Element | null) => Position | null
  /** Whether focus is on this table (not in a field, nor a table nested in it). */
  focusIn: () => boolean
  /** A row's place among the body's rows rendered or not (-1 when not on the page). */
  bodyIndex: (id: string) => number
}

type CellHost = {
  context: DataTableContextValue<unknown>
  t: Translator<"dataTable">
  /** The focused data cell: the selection while there is no range. */
  focused: Position | null
  /** The table's DOM side, to move focus to a range's corner (not for `useDataTable`'s commands). */
  environment?: CellEnvironment
}

/** The custom clipboard type of a copy's values, read back by a paste. */
const VALUES = "application/x-tecton-cells+json"

/** Text a spreadsheet runs as a formula (`exportCsv`'s rule). */
const FORMULA = /^[=+\-@\t\r]/

/** A cell of a single cell. */
const single = (at: Position): DataTableCellRange => ({
  rows: { start: at.row, end: at.row },
  columns: { start: at.column, end: at.column },
})

/** A cell range between two corners. */
const corner = (from: Position, to: Position): DataTableCellRange => ({
  rows: { start: from.row, end: to.row },
  columns: { start: from.column, end: to.column },
})

/** The selection as it is now (changes not rendered yet included), over the rows shown. */
function gridOf(host: CellHost): CellGrid<unknown> | null {
  const state = host.context.store.get()
  if (state.options.cellSelectionMode === "none") return null
  const ranges = host.context.actions.currentCellSelection()
  // The root resolves it once it has rendered with this code.
  const grid =
    state.cellGrid ??
    resolveSelection(
      ranges,
      state.model,
      state.layout.columns,
      state.view.columns.order,
      state.cellBelow
    )
  return grid.ranges === ranges ? grid : grid.resolve(ranges)
}

/** The ranges in effect, or the focused cell's when there is none. */
function rectsOf(host: CellHost, grid: CellGrid<unknown>) {
  if (grid.rects.length || !host.focused) return grid
  return grid.resolve([single(host.focused)])
}

function select(
  host: CellHost,
  ranges: ReadonlyArray<DataTableCellRange>,
  reason: DataTableCellSelectionChangeReason,
  event?: Event
) {
  return host.context.actions.setCellSelection(ranges, reason, event)
}

/** Moves focus to a cell (a range's moving corner), when it is on the page shown. */
function focusAt(host: CellHost, at: Position) {
  const environment = host.environment
  if (!environment) return
  const { layout, options } = host.context.store.get()
  const row = environment.bodyIndex(at.row)
  const column = layout.columns.findIndex((each) => each.id === at.column)
  if (row < 0 || column < 0) return
  // The columns of controls come first.
  const offset =
    (options.selectionMode === "none" ? 0 : 1) +
    (options.reorderableRows ? 1 : 0)
  environment.grid.current?.focusRow(row, offset + column)
}

/** Whether a row and a column are shown (a range's anchor). */
function rowShown(grid: CellGrid<unknown>, row: string) {
  const index = grid.model.indexOfRow(row)
  return index >= 0 && grid.rows[index]?.kind === "item"
}

/** The item row next to `index`, `step` -1 or 1, within `[first, last]`; `index` itself at an end. */
function nextItemRow(
  rows: ReadonlyArray<EngineRow<unknown>>,
  index: number,
  step: number,
  first: number,
  last: number
) {
  for (let at = index + step; at >= first && at <= last; at += step)
    if (rows[at].kind === "item") return at
  return index
}

/** A move that leaves the selection as it is: focus back where it was. */
function keep(host: CellHost, from: Position) {
  focusAt(host, from)
  return false
}

/**
 * Focus moved to a cell (`to`), from `from`; `extend`: Shift, `add`: Ctrl /
 * Cmd (a press). See the module comment.
 */
function navigate(
  host: CellHost,
  to: Position,
  from: Position | null,
  { extend, add }: { extend: boolean; add: boolean },
  reason: DataTableCellSelectionChangeReason,
  event?: Event
) {
  const { store, actions } = host.context
  const grid = gridOf(host)
  const ranges = actions.currentCellSelection()
  if (!grid || store.get().options.cellSelectionMode !== "range")
    return select(host, [single(to)], reason, event)
  if (add) return select(host, [...ranges, single(to)], reason, event)
  if (!extend) return select(host, [single(to)], reason, event)
  const before = ranges.slice(0, -1)
  const last = ranges.at(-1)
  if (!last) return select(host, [corner(from ?? to, to)], reason, event)
  const anchor = from ?? to
  const rowAnchor =
    last.rows && rowShown(grid, last.rows.start) ? last.rows.start : anchor.row
  const columnAnchor =
    last.columns && grid.columnIndex(last.columns.start) >= 0
      ? last.columns.start
      : anchor.column
  // Whole rows stay whole rows, whole columns whole columns.
  if (last.rows && !last.columns)
    return select(
      host,
      [...before, { rows: { start: rowAnchor, end: to.row } }],
      reason,
      event
    )
  if (!last.rows && last.columns)
    return select(
      host,
      [...before, { columns: { start: columnAnchor, end: to.column } }],
      reason,
      event
    )
  if (last.rows && last.columns)
    return select(
      host,
      [...before, corner({ row: rowAnchor, column: columnAnchor }, to)],
      reason,
      event
    )
  // Every cell: a press makes a range from the focused cell; a key makes
  // the axis it moves along first to last, then moves its end.
  if (event?.type === "mousedown" || !from)
    return select(host, [...before, corner(anchor, to)], reason, event)
  const rows = grid.itemRows()
  const columns = grid.cellColumns()
  if (!rows || !columns) return false
  let next: DataTableCellRange
  let focus: Position
  if (from.row !== to.row) {
    const step = Math.sign(
      grid.model.indexOfRow(to.row) - grid.model.indexOfRow(from.row)
    )
    const end = nextItemRow(grid.rows, rows.last, step, rows.first, rows.last)
    // Past the last row: still every cell, and focus where it was.
    if (end === rows.last) return keep(host, from)
    const endId = (grid.rows[end] as ItemRow<unknown>).id
    next = {
      rows: {
        start: (grid.rows[rows.first] as ItemRow<unknown>).id,
        end: endId,
      },
    }
    focus = { row: endId, column: to.column }
  } else {
    const step = Math.sign(
      grid.columnIndex(to.column) - grid.columnIndex(from.column)
    )
    let end = columns.last
    for (
      let at = end + step;
      at >= columns.first && at <= columns.last;
      at += step
    )
      if (grid.skip?.[at] !== 1) {
        end = at
        break
      }
    if (end === columns.last) return keep(host, from)
    const endId = grid.columns[end].id
    next = {
      columns: { start: grid.columns[columns.first].id, end: endId },
    }
    focus = { row: to.row, column: endId }
  }
  const changed = select(host, [...before, next], reason, event)
  focusAt(host, focus)
  return changed
}

function announceSelected(host: CellHost) {
  const grid = gridOf(host)
  if (!grid) return
  const count = grid.count()
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
  const current = host.context.actions.currentCellSelection()
  const focused = host.focused
  const last = current.at(-1) ?? (focused ? single(focused) : null)
  switch (command) {
    case "select-all":
      // Focus stays, and nothing scrolls.
      if (select(host, [{}], "select-all", event)) announceSelected(host)
      return
    case "select-row":
    case "select-column": {
      if (!last) return
      const rows = command === "select-row"
      // Whole rows of whole columns are every cell, and the other way round.
      const axis = rows ? last.rows : last.columns
      const next: DataTableCellRange = axis
        ? rows
          ? { rows: { ...axis } }
          : { columns: { ...axis } }
        : {}
      if (!select(host, [...current.slice(0, -1), next], "keyboard", event))
        return
      announceSelected(host)
      if (axis && focused)
        focusAt(
          host,
          rows
            ? { row: axis.end, column: focused.column }
            : { row: focused.row, column: axis.end }
        )
      return
    }
    case "clear-selection":
      select(host, [], "clear", event)
      return
    case "clear":
      clearCells(host, event)
      return
    case "fill":
      fillCellsDown(host, event)
      return
    case "notice":
      announce(host.t("selectCellsFirst"))
  }
}

function locale(host: CellHost) {
  return host.context.store.get().formatter.locale
}

function clearCells(host: CellHost, event?: Event) {
  const grid = gridOf(host)
  if (!grid) return
  const writes: Array<CellWrite> = []
  forEachCell(rectsOf(host, grid), (row, column) => {
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

function fillCellsDown(host: CellHost, event?: Event) {
  const resolved = gridOf(host)
  if (!resolved) return
  const grid = rectsOf(host, resolved)
  const { rows, columns, skip } = grid
  // By cell: where ranges overlap, the later one's value.
  const writes = new Map<string, CellWrite>()
  for (const rect of grid.rects) {
    const shown = itemRowsIn(rows, rect.top, rect.bottom)
    const source = shown.length > 1 ? rows[shown[0]] : rowAbove(rows, rect.top)
    if (source?.kind !== "item") continue
    const targets = shown.length > 1 ? shown.slice(1) : shown
    for (let c = rect.first; c <= rect.last; c++) {
      if (skip?.[c] === 1) continue
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
  rows: ReadonlyArray<EngineRow<unknown>>,
  skip: Uint8Array | null
): { rows: Array<number>; columns: Array<number> } | null {
  const span = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i).filter(
      (c) => skip?.[c] !== 1
    )
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

/** Excel's serial number of a date (days since 1899-12-30), on its wall clock in `timeZone`. */
function serialOf(date: Date, timeZone: string | undefined) {
  const p = timeZone
    ? partsIn(date.getTime(), timeZone)
    : {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
      }
  const time = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second)
  return (time - Date.UTC(1899, 11, 30)) / 86_400_000
}

const TIME_FIELDS = ["hour", "minute", "second", "timeStyle"]

/**
 * A column's Excel attributes in the HTML flavour, for a cell's value: a
 * number's or a date's value (Latin digits, `x:num`) and format, text
 * marked as text (the classes of `htmlTable`).
 */
function htmlAttributes(
  column: EngineColumn<unknown>
): (value: DataTableValue) => string {
  const format = (column.format ?? {}) as Record<string, unknown>
  switch (column.type) {
    case "number": {
      const percent = format.style === "percent" ? " class=p" : ""
      return (value) => {
        const number = toNumber(value)
        return number === undefined ? "" : ` x:num="${number}"${percent}`
      }
    }
    case "date": {
      const timed = TIME_FIELDS.some((field) => format[field] !== undefined)
      const kind = timed ? " class=dt" : " class=d"
      const zone = format.timeZone as string | undefined
      return (value) => {
        const date = toDate(value)
        return date ? ` x:num="${serialOf(date, zone)}"${kind}` : ""
      }
    }
    case "boolean":
      return () => ""
    default:
      return () => " class=t"
  }
}

/** A value for the custom type: JSON, a date as `{ $date }`. */
function encodeValue(value: DataTableValue) {
  return value instanceof Date
    ? { $date: value.toISOString() }
    : (value ?? null)
}

/**
 * The most cells copied with their HTML and values too: past it, a copy is
 * text only (a spreadsheet still pastes it as cells, and a table reads it
 * back as text), so a copy of a whole large table stays quick.
 */
const RICH_CELLS = 100_000

type Copied =
  | {
      text: string
      /** `null` past `RICH_CELLS`. */
      html: string | null
      values: string | null
      count: number
    }
  | { error: string }
  | null

/**
 * The selected cells (see the module comment), every flavour built in one
 * pass; `null` with nothing selected.
 */
function copyCells(
  host: CellHost,
  {
    escapeFormulas = true,
    html: wantHtml = false,
  }: {
    escapeFormulas?: boolean
    /** HTML however many cells (a write that has promised it). */
    html?: boolean
  } = {}
): Copied {
  const resolved = gridOf(host)
  if (!resolved) return null
  const grid = rectsOf(host, resolved)
  if (grid.rects.length === 0) return null
  const area = copyArea(grid.rects, grid.rows, grid.skip)
  if (!area) return { error: host.t("copyMultiple") }
  const { formatter } = host.context.store.get()
  const columns = area.columns.map((index) => grid.columns[index])
  const attributes = columns.map(htmlAttributes)
  const guarded = columns.map(
    (column) =>
      escapeFormulas && (column.type === "text" || column.type === "options")
  )
  const lines: Array<string> = []
  const rows: Array<string> = []
  const values: Array<Array<unknown>> = []
  const width = columns.length
  const rich = area.rows.length * width <= RICH_CELLS
  const html = rich || wantHtml
  for (const index of area.rows) {
    const { item } = grid.rows[index] as ItemRow<unknown>
    const fields = new Array<string>(width)
    const cells = new Array<string>(width)
    const own = new Array<unknown>(width)
    for (let c = 0; c < width; c++) {
      const column = columns[c]
      const value = column.getValue(item)
      const text = formatter.format(column, value)
      const shown = guarded[c] && FORMULA.test(text) ? `'${text}` : text
      fields[c] = tsvField(shown)
      if (html) cells[c] = htmlCell(shown, attributes[c](value))
      if (rich) own[c] = encodeValue(value)
    }
    lines.push(fields.join("\t"))
    if (html) rows.push(`<tr>${cells.join("")}</tr>`)
    if (rich) values.push(own)
  }
  return {
    text: lines.join("\r\n"),
    html: html ? htmlTable(rows) : null,
    values: rich ? JSON.stringify({ tecton: 1, values }) : null,
    count: lines.length * width,
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

/** The Clipboard API, where the browser has it (secure contexts only). */
function clipboardApi(): Partial<Clipboard> | undefined {
  return typeof navigator === "undefined"
    ? undefined
    : (navigator as { clipboard?: Partial<Clipboard> }).clipboard
}

/** Where a copy goes: a copy event's data, a write already begun (`cells.tsx`), or the Clipboard API. */
type CopySink =
  | { data: DataTransfer }
  | {
      resolve: (copied: { text: string; html: string } | null) => void
      /** Whether the write begun succeeded. */
      written: Promise<boolean>
    }
  | null

/**
 * Copies the selection: into a copy event's `clipboardData` (synchronous,
 * every flavour), into a Clipboard API write begun in the key's event,
 * else through the Clipboard API now. Returns the text copied, `""` for
 * none.
 */
async function copy(
  host: CellHost,
  sink: CopySink,
  options?: { escapeFormulas?: boolean }
): Promise<string> {
  const copied = copyCells(host, {
    ...options,
    html: !!sink && "resolve" in sink,
  })
  if (!copied || "error" in copied) {
    if (sink && "resolve" in sink) sink.resolve(null)
    announceCopied(host, copied)
    return ""
  }
  if (sink && "data" in sink) {
    sink.data.setData("text/plain", copied.text)
    if (copied.html !== null) sink.data.setData("text/html", copied.html)
    // Best effort: a browser may keep only the standard types.
    if (copied.values !== null)
      try {
        sink.data.setData(VALUES, copied.values)
      } catch {
        // The text and HTML are there.
      }
  } else if (sink) {
    sink.resolve({ text: copied.text, html: copied.html ?? "" })
    // Said once the browser has written it (or refused).
    if (!(await sink.written)) {
      announce(host.t("copyFailed"))
      return copied.text
    }
  } else {
    const clipboard = clipboardApi()
    if (!clipboard?.writeText) return copied.text
    try {
      if (typeof ClipboardItem === "function" && clipboard.write)
        await clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([copied.text], { type: "text/plain" }),
            ...(copied.html === null
              ? {}
              : {
                  "text/html": new Blob([copied.html], { type: "text/html" }),
                }),
          }),
        ])
      else await clipboard.writeText(copied.text)
    } catch {
      announce(host.t("copyFailed"))
      return copied.text
    }
  }
  announceCopied(host, copied)
  return copied.text
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

/** What a paste carries: its text, and the values of a copy from a table. */
type Pasted = { text: string; values?: string }

/** A pasted cell: its text, and its value when a table's copy carried it. */
type PastedCell = { t: string; v: unknown }

/**
 * The pasted cells: the text's, with the values of a copy from a table
 * when it carries them for every cell of the text.
 */
function pastedCells(pasted: Pasted): Array<Array<PastedCell>> {
  const texts = parseTsv(pasted.text)
  let values: Array<Array<unknown>> | null = null
  if (pasted.values)
    try {
      const read = JSON.parse(pasted.values) as {
        tecton?: number
        values?: unknown
      }
      if (
        read.tecton === 1 &&
        Array.isArray(read.values) &&
        read.values.length === texts.length &&
        read.values.every(
          (row, r) => Array.isArray(row) && row.length === texts[r].length
        )
      )
        values = read.values as Array<Array<unknown>>
    } catch {
      values = null
    }
  return texts.map((row, r) =>
    row.map((t, c) => ({ t, v: values ? values[r][c] : undefined }))
  )
}

/** A copied value, when it is one the column takes as it is; else its text is read. */
function valueFor(column: EngineColumn<unknown>, cell: PastedCell) {
  const { v } = cell
  if (v === null) return { value: null }
  switch (column.type) {
    case "number":
      return typeof v === "number" ? { value: v } : null
    case "boolean":
      return typeof v === "boolean" ? { value: v } : null
    case "date": {
      const iso = (v as { $date?: unknown } | null)?.$date
      return typeof iso === "string" ? { value: new Date(iso) } : null
    }
    case "options":
      return typeof v === "string" && column.optionIndex.has(v)
        ? { value: v }
        : null
    case "text":
      return typeof v === "string" ? { value: v } : null
  }
}

/** Pastes cells into the selection (see the module comment). */
function paste(host: CellHost, pasted: Pasted, event?: Event) {
  const state = host.context.store.get()
  if (!state.options.editable) return
  const block = pastedCells(pasted)
  if (block.length === 0) return
  const resolved = gridOf(host)
  if (!resolved) return
  const grid = rectsOf(host, resolved)
  const { rows, columns, rects, skip } = grid
  if (rects.length === 0) return
  const single = block.length === 1 && block[0].length === 1
  if (rects.length > 1 && !single) return announce(host.t("pasteMultiple"))
  const write = (
    row: string,
    column: EngineColumn<unknown>,
    cell: PastedCell
  ): CellWrite => {
    const value = cell.v === undefined ? null : valueFor(column, cell)
    return value
      ? { row, column: column.id, value: value.value as DataTableValue }
      : { row, column: column.id, text: cell.t }
  }
  const writes: Array<CellWrite> = []
  let area: { start: Position; end: Position } | null = null
  if (single) {
    const [[cell]] = block
    forEachCell(grid, (row, column) => {
      writes.push(write(row.id, column, cell))
    })
  } else {
    const [rect] = rects
    const shown = itemRowsIn(rows, rect.top, rect.bottom)
    // The columns from the range's first, those hidden below a breakpoint passed over.
    const across: Array<number> = []
    for (let c = rect.first; c < columns.length; c++)
      if (skip?.[c] !== 1) across.push(c)
    const inRange = across.filter((c) => c <= rect.last)
    const height = block.length
    const width = block[0].length
    const tiled =
      shown.length % height === 0 &&
      inRange.length % width === 0 &&
      (shown.length > height || inRange.length > width)
    const targets = tiled
      ? shown.map((index) => rows[index] as ItemRow<unknown>)
      : rowsFrom(rows, rect.top, height)
    const used = tiled ? inRange : across.slice(0, width)
    targets.forEach((row, i) => {
      used.forEach((c, j) => {
        const cell = block[i % height][j % width]
        writes.push(write(row.id, columns[c], cell))
      })
    })
    if (targets.length && used.length)
      area = {
        start: { row: targets[0].id, column: columns[used[0]].id },
        end: {
          row: targets[targets.length - 1].id,
          column: columns[used[used.length - 1]].id,
        },
      }
  }
  const outcome = writeCells(host, writes, "paste", event)
  if (outcome.canceled) return
  if (area) {
    select(host, [corner(area.start, area.end)], "paste", event)
    focusAt(host, area.end)
  }
  announce(describeWrite(host.t, locale(host), "paste", outcome))
}

/**
 * What a table's cells do with what the user did (`cells.tsx` records it),
 * and the clipboard's events while the code is there: `run` acts on one
 * event, `key` on Ctrl / Cmd + C or V, `stop` ends a drag and listening.
 */
function createCellController(environment: CellEnvironment) {
  let stopDrag: (() => void) | null = null
  /** A press in progress: the focus it brings is its own (not Tab's). */
  let pressing = false
  const host = (focused: Position | null): CellHost => ({
    context: environment.context,
    t: environment.t(),
    focused,
    environment,
  })
  const focusedAt = () =>
    environment.positionOf(
      environment.table()?.ownerDocument.activeElement?.closest("td, th") ??
        null
    )
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
  const readClipboard = (focused: Position | null, event: Event) => {
    clipboardApi()
      ?.readText?.()
      .then((text) => paste(host(focused), { text }, event))
      .catch(() => undefined)
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
        // A press let go before this code came (a click) ends its drag at
        // the pointer's first move.
        if (
          entry.press &&
          environment.context.store.get().options.cellSelectionMode === "range"
        )
          drag(entry.press)
        return
      case "focus": {
        // Tab into the table (not a press, nor a move inside it): its cell
        // is the selection, if there is none.
        const from = entry.event.relatedTarget
        if (
          pressing ||
          (from instanceof Node && environment.table()?.contains(from)) ||
          environment.context.actions.currentCellSelection().length > 0
        )
          return
        navigate(
          host(null),
          entry.to,
          null,
          { extend: false, add: false },
          "keyboard",
          entry.event
        )
        return
      }
      case "command":
        runCommand(host(entry.focused), entry.command, entry.event)
        return
      case "paste":
        if (entry.pasted) paste(host(entry.focused), entry.pasted, entry.event)
        else readClipboard(entry.focused, entry.event)
        return
      case "copy":
        void copy(host(entry.focused), entry.sink)
    }
  }

  /** A Ctrl / Cmd + C or V whose clipboard event has not come (yet). */
  let awaited: { handled: boolean } | null = null

  const doc = environment.table()?.ownerDocument ?? document
  const onPress = () => {
    pressing = true
    setTimeout(() => {
      pressing = false
    })
  }
  // Before the grid's own handler, which focuses the cell.
  doc.addEventListener("mousedown", onPress, true)
  const handle = (event: ClipboardEvent, pasting: boolean) => {
    if (!environment.focusIn()) return
    if (pasting && !environment.context.store.get().options.editable) return
    if (awaited) awaited.handled = true
    const focused = focusedAt()
    event.preventDefault()
    // Off the data cells, the selection is not what the user is on.
    if (!focused) return runCommand(host(null), "notice")
    if (pasting)
      paste(
        host(focused),
        {
          text: event.clipboardData?.getData("text/plain") ?? "",
          values: event.clipboardData?.getData(VALUES) || undefined,
        },
        event
      )
    else if (event.clipboardData)
      void copy(host(focused), { data: event.clipboardData })
  }
  const onCopy = (event: ClipboardEvent) => handle(event, false)
  const onPaste = (event: ClipboardEvent) => handle(event, true)
  doc.addEventListener("copy", onCopy)
  doc.addEventListener("paste", onPaste)

  return {
    run,
    /**
     * Ctrl / Cmd + C: a copy event now (`execCommand`, so a browser that
     * sends none for a cell sends one), else the Clipboard API. Ctrl / Cmd
     * + V: the browser's paste event; where none comes, the Clipboard API.
     * Returns whether the key's default is to be prevented.
     */
    key(kind: "copy" | "paste", focused: Position | null, event: Event) {
      if (!focused) {
        runCommand(host(null), "notice")
        return true
      }
      const waiting = { handled: false }
      awaited = waiting
      if (kind === "copy") {
        const copied =
          typeof doc.execCommand === "function" && doc.execCommand("copy")
        if (!copied || !waiting.handled) void copy(host(focused), null)
        awaited = null
        return true
      }
      setTimeout(() => {
        if (awaited === waiting) awaited = null
        if (!waiting.handled) readClipboard(focused, event)
      })
      return false
    },
    stop: () => {
      stopDrag?.()
      stopDrag = null
      doc.removeEventListener("mousedown", onPress, true)
      doc.removeEventListener("copy", onCopy)
      doc.removeEventListener("paste", onPaste)
    },
  }
}

/**
 * The table's side, once this code is there (`cells.tsx`): the controller
 * of its events, after it has replayed those that waited (every move, and
 * the commands while focus is still on the table).
 */
function attachCells(side: CellSide): CellHandlers {
  const table = () =>
    side.container.current?.querySelector<HTMLTableElement>(":scope > table") ??
    null
  const environment: CellEnvironment = {
    context: side.context,
    t: () => side.latest.current.t,
    table,
    container: () => side.container.current,
    grid: side.grid,
    positionOf: side.positionOf,
    focusIn: () => {
      const own = table()
      const active = own?.ownerDocument.activeElement
      return (
        !!own &&
        active instanceof HTMLElement &&
        own.contains(active) &&
        active.closest("table") === own &&
        !isTextEntry(active)
      )
    },
    bodyIndex: (id) => side.latest.current.bodyIndex(id),
  }
  const controller = createCellController(environment)
  const waiting = side.queue.splice(0)
  const focused = environment.focusIn()
  waiting.forEach((entry, index) => {
    // The focus a press brought: the press's (the grid focuses its cell
    // first).
    const next = waiting.at(index + 1)
    if (entry.kind === "focus" && next?.kind === "navigate" && next.press)
      return
    if (entry.kind === "navigate" || entry.kind === "focus" || focused)
      controller.run(entry)
  })
  return controller
}

/** A command of `useDataTable`; resolves with the text copied (`""` otherwise). */
async function runCellCommand(
  host: CellHost,
  command: "copy" | "paste" | "clear" | "fill",
  options: { text?: string; escapeFormulas?: boolean } = {}
): Promise<string> {
  switch (command) {
    case "copy":
      return copy(host, null, options)
    case "paste":
      paste(host, { text: options.text ?? "" })
      return ""
    case "clear":
      clearCells(host)
      return ""
    case "fill":
      fillCellsDown(host)
      return ""
  }
}

export {
  attachCells,
  copy,
  createCellController,
  navigate,
  paste,
  resolveSelection,
  runCellCommand,
  runCommand,
}
export type { CellEnvironment, CellHost, CopySink }
