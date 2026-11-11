/**
 * The cell selection without React: ranges resolved against the rows and
 * columns shown (`engine/cells.ts`), tab-separated text both ways
 * (`cell-selection/tsv.ts`), and pasted text read as each column type
 * (`cell-parse.ts`).
 */
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  parseCellText,
  parseDate,
  parseNumber,
} from "../internal/data-table/cell-parse"
import {
  parseTsv,
  toHtml,
  toTsv,
} from "../internal/data-table/cell-selection/tsv"
import {
  cellCount,
  forEachCell,
  summarizeCells,
} from "../internal/data-table/engine/cell-ranges"
import {
  BOTTOM,
  createColumns,
  createDataTableEngine,
  createDefaultView,
  decodeMarks,
  END,
  getColumnModel,
  layoutColumns,
  reconcileView,
  resolveCells,
  SELECTED,
  START,
  TOP,
  type DataTableCellRange,
  type DataTablePartialView,
} from "../internal/data-table/engine"

type Well = {
  id: string
  name: string
  field: string
  oil: number | null
  spud: Date | null
  active: boolean
  status: string
}

const WELLS: Array<Well> = Array.from({ length: 8 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  field: i < 4 ? "Gullfaks" : "Snorre",
  oil: i === 5 ? null : (i + 1) * 100,
  spud: new Date(Date.UTC(2020, 0, i + 1)),
  active: i % 2 === 0,
  status: i % 2 === 0 ? "producing" : "shut-in",
}))

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "oil", header: "Oil", type: "number" },
  {
    id: "spud",
    header: "Spud",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  { id: "active", header: "Active", type: "boolean" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing" },
      { value: "shut-in", label: "Shut in" },
    ],
  },
])

const CAPABILITIES = { sortable: true, filterable: true, groupable: true }

function setup(view: DataTablePartialView = {}) {
  const defaults = createDefaultView(columns, undefined, CAPABILITIES)
  const reconciled = reconcileView(columns, view, defaults, CAPABILITIES)
  const model = createDataTableEngine<Well>().run({
    items: WELLS,
    columns,
    view: reconciled,
    sortable: true,
    filterable: true,
  })
  const layout = layoutColumns(columns, reconciled)
  return { model, layout, view: reconciled }
}

/** Ranges resolved against a setup's rows and columns. */
function resolveIn(
  state: ReturnType<typeof setup>,
  ranges: ReadonlyArray<DataTableCellRange>,
  hiddenBelow?: ReadonlySet<string>
) {
  return resolveCells(ranges, state.model, state.layout.columns, {
    order: state.view.columns.order,
    hiddenBelow,
  })
}

const range = (
  startRow: string,
  startColumn: string,
  endRow = startRow,
  endColumn = startColumn
): DataTableCellRange => ({
  rows: { start: startRow, end: endRow },
  columns: { start: startColumn, end: endColumn },
})

describe("cell ranges", () => {
  it("resolves a range to the rows and columns between its corners, either way round", () => {
    const state = setup()
    const grid = resolveIn(state, [range("w3", "oil", "w1", "name")])
    expect(grid.rects).toEqual([{ top: 1, bottom: 3, first: 0, last: 2 }])
    expect(cellCount(grid)).toBe(9)
    expect(grid.rowMarks("w0")).toBe("")
    expect(grid.rowMarks("w1")).toBe("0-2t")
    expect(grid.rowMarks("w2")).toBe("0-2")
    expect(grid.rowMarks("w3")).toBe("0-2b")
  })

  it("follows the order shown: a sort and a column moved", () => {
    const state = setup({
      sorting: [{ column: "oil", direction: "descending" }],
      columns: { order: ["oil", "name", "field", "spud", "active", "status"] },
    })
    // w7 (800) is first, w6 second; "oil" is the first column now.
    const grid = resolveIn(state, [range("w7", "oil", "w6", "name")])
    expect(grid.rects).toEqual([{ top: 0, bottom: 1, first: 0, last: 1 }])
    const seen: Array<string> = []
    forEachCell(grid, (row, column) => seen.push(`${row.id}:${column.id}`))
    expect(seen).toEqual(["w7:oil", "w7:name", "w6:oil", "w6:name"])
  })

  it("sets a range aside while a corner's row is filtered out", () => {
    const filtered = setup({ search: "Well 3" })
    const grid = resolveIn(filtered, [range("w1", "name", "w3", "oil")])
    expect(grid.rects).toEqual([])
    expect(grid.ranges).toHaveLength(1)
  })

  it("keeps the shown columns between corners the view hides, where its order puts them", () => {
    // Hidden "oil" (between field and spud): name…oil keeps name and field.
    const hidden = setup({ columns: { hidden: ["oil"] } })
    expect(resolveIn(hidden, [range("w1", "name", "w3", "oil")]).rects).toEqual(
      [{ top: 1, bottom: 3, first: 0, last: 1 }]
    )
    // Both corners hidden, nothing shown between them: set aside.
    const both = setup({ columns: { hidden: ["oil", "spud"] } })
    expect(resolveIn(both, [range("w1", "oil", "w3", "spud")]).rects).toEqual(
      []
    )
    // A corner hidden past the last column shown.
    const last = setup({ columns: { hidden: ["status"] } })
    expect(
      resolveIn(last, [range("w0", "active", "w0", "status")]).rects
    ).toEqual([{ top: 0, bottom: 0, first: 4, last: 4 }])
  })

  it("keeps whole rows, whole columns and every cell whole across a sort, a filter and new columns", () => {
    const sorted = setup({
      sorting: [{ column: "oil", direction: "descending" }],
    })
    const all = resolveIn(sorted, [{}])
    expect(all.rects).toEqual([{ top: 0, bottom: 7, first: 0, last: 5 }])
    expect(cellCount(all)).toBe(48)
    const filtered = setup({ search: "Well 1" })
    expect(
      cellCount(
        resolveIn(filtered, [{ columns: { start: "oil", end: "oil" } }])
      )
    ).toBe(1)
    const rows = resolveIn(sorted, [{ rows: { start: "w2", end: "w3" } }])
    expect(cellCount(rows)).toBe(12)
    const moved = setup({
      columns: { order: ["status", "name", "field", "oil", "spud", "active"] },
    })
    expect(
      resolveIn(moved, [{ rows: { start: "w2", end: "w2" } }]).rects
    ).toEqual([{ top: 2, bottom: 2, first: 0, last: 5 }])
  })

  it("passes over the columns hidden below the window's breakpoint", () => {
    const state = setup()
    const grid = resolveIn(
      state,
      [range("w0", "name", "w1", "spud")],
      new Set(["field", "spud"])
    )
    // The range ends at the last column it holds a cell in (oil).
    expect(grid.rects).toEqual([{ top: 0, bottom: 1, first: 0, last: 2 }])
    expect(cellCount(grid)).toBe(4)
    const seen: Array<string> = []
    forEachCell(grid, (row, column) => seen.push(column.id))
    expect(seen).toEqual(["name", "oil", "name", "oil"])
    expect(cellCount(resolveIn(state, [{}], new Set(["active"])))).toBe(40)
  })

  it("passes over group rows: not selected, counted or visited", () => {
    const state = setup({ grouping: ["field"] })
    // Gullfaks, w0…w3, Snorre, w4…w7: a range from w2 to w5 holds the
    // Snorre group's row.
    const grid = resolveIn(state, [range("w2", "name", "w5", "name")])
    const [rect] = grid.rects
    expect(rect.bottom - rect.top).toBe(4)
    expect(cellCount(grid)).toBe(4)
    const visited: Array<string> = []
    forEachCell(grid, (row) => visited.push(row.id))
    expect(visited).toEqual(["w2", "w3", "w4", "w5"])
    // A group key is not a cell's row.
    const groupKey = state.model.allRows.find((row) => row.kind === "group")!.id
    expect(resolveIn(state, [range(groupKey, "name")]).rects).toEqual([])
    // Every cell starts and ends at item rows, the group rows passed over.
    const all = resolveIn(state, [{}])
    expect(all.rowMarks("w0")).toBe("0-5t")
    expect(all.rowMarks("w7")).toBe("0-5b")
    expect(cellCount(all)).toBe(48)
  })

  it("counts the cells shared by ranges once", () => {
    const state = setup()
    const grid = resolveIn(state, [
      range("w0", "name", "w2", "field"),
      range("w1", "field", "w3", "oil"),
    ])
    // 3 × 2 and 3 × 2, sharing w1 and w2's field.
    expect(cellCount(grid)).toBe(10)
    let visits = 0
    forEachCell(grid, () => visits++)
    expect(visits).toBe(10)
    expect(grid.rowMarks("w1")).toBe("0-1|1-2t")
  })

  it("decodes a row's marks into each column's flags and edges", () => {
    const flags = decodeMarks("0-1t|3-3tb", 5)!
    expect(flags[0]).toBe(SELECTED | TOP | START)
    expect(flags[1]).toBe(SELECTED | TOP | END)
    expect(flags[2]).toBe(0)
    expect(flags[3]).toBe(SELECTED | TOP | BOTTOM | START | END)
    expect(decodeMarks("", 5)).toBeNull()
  })

  it("sums, averages and counts the numbers and the cells with a value", () => {
    const state = setup()
    const grid = resolveIn(state, [range("w4", "name", "w6", "oil")])
    const summary = summarizeCells(grid)
    // Oil: 500, (none), 700.
    expect(summary).toMatchObject({
      count: 8,
      numericCount: 2,
      sum: 1200,
      average: 600,
    })
    expect(summary.numberColumns.map((column) => column.id)).toEqual(["oil"])
    const text = summarizeCells(
      resolveIn(state, [range("w0", "name", "w2", "field")])
    )
    expect(text).toMatchObject({ count: 6, numericCount: 0, sum: null })
  })
})

describe("tab-separated cells", () => {
  it("quotes fields with tabs, line breaks and quotes, as Excel does", () => {
    const rows = [
      ["34/10-A-12", 'Well "A"', "1,840"],
      ["two\nlines", "tab\there", ""],
    ]
    const text = toTsv(rows)
    expect(text).toBe(
      '34/10-A-12\t"Well ""A"""\t1,840\r\n"two\nlines"\t"tab\there"\t'
    )
    expect(parseTsv(text)).toEqual(rows)
  })

  it("reads LF, CRLF and CR rows, and drops the line break after the last row", () => {
    expect(parseTsv("a\tb\nc\td\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
    expect(parseTsv("a\r\nb\r\n")).toEqual([["a"], ["b"]])
    expect(parseTsv("a\rb")).toEqual([["a"], ["b"]])
    expect(parseTsv("")).toEqual([])
    // Short rows are filled with empty fields.
    expect(parseTsv("a\tb\tc\nd")).toEqual([
      ["a", "b", "c"],
      ["d", "", ""],
    ])
  })

  it("reads a quote that is never closed as text", () => {
    expect(parseTsv('"open\tx')).toEqual([['"open', "x"]])
    expect(parseTsv('5" pipe')).toEqual([['5" pipe']])
  })

  it("writes an HTML table, escaped, line breaks as <br>, with each cell's attributes", () => {
    expect(
      toHtml([
        [
          { text: "<b>", attributes: "" },
          { text: "a\nb", attributes: ' x:num="1"' },
        ],
      ])
    ).toBe(
      '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><style>.t{mso-number-format:"\\@"}.d{mso-number-format:"Short Date"}.dt{mso-number-format:"General Date"}.p{mso-number-format:Percent}</style></head><body><table><tbody><tr><td>&lt;b&gt;</td><td x:num="1">a<br>b</td></tr></tbody></table></body></html>'
    )
  })
})

describe("pasted text as a column's value", () => {
  const { byId } = getColumnModel(columns)
  const context = {
    locale: "en-US",
    labels: { yes: "Yes", no: "No" },
    messages: {
      invalid: "invalid",
      number: "number",
      date: "date",
      boolean: "boolean",
      option: "option",
    },
  }
  const parse = (column: string, text: string, locale = "en-US") =>
    parseCellText(byId.get(column)!, text, WELLS[0], { ...context, locale })

  it("reads numbers in the locale, with JavaScript's form as a fallback", () => {
    expect(parseNumber("1,234.5", "en-US", undefined)).toBe(1234.5)
    expect(parseNumber("1.234,5", "de-DE", undefined)).toBe(1234.5)
    expect(parseNumber("1 234,5", "fr-FR", undefined)).toBe(1234.5)
    expect(parseNumber("1234.5", "de-DE", undefined)).toBe(1234.5)
    expect(parseNumber("1.234", "de-DE", undefined)).toBe(1234)
    expect(parseNumber("−12", "sv-SE", undefined)).toBe(-12)
    expect(parseNumber("(40)", "en-US", undefined)).toBe(-40)
    expect(parseNumber("١٬٢٣٤", "ar-AE", undefined)).toBe(1234)
    expect(parseNumber("12,34,567", "en-IN", undefined)).toBe(1234567)
    expect(
      parseNumber("$1,200.50", "en-US", { style: "currency", currency: "USD" })
    ).toBe(1200.5)
    expect(parseNumber("12%", "en-US", { style: "percent" })).toBe(0.12)
    expect(parseNumber("1e3", "en-US", undefined)).toBe(1000)
    expect(parseNumber("12a", "en-US", undefined)).toBeUndefined()
    expect(parseNumber("1,2,3", "en-US", undefined)).toBeUndefined()
  })

  it("reads dates as the column shows them, ISO dates, and two-digit years as Excel", () => {
    const utc = { timeZone: "UTC" } as const
    expect(parseDate("Jan 5, 2024", "en-US", utc)?.toISOString()).toBe(
      "2024-01-05T00:00:00.000Z"
    )
    expect(parseDate("5. Jan. 2024", "de-DE", utc)?.toISOString()).toBe(
      "2024-01-05T00:00:00.000Z"
    )
    expect(parseDate("05.01.24", "de-DE", utc)?.toISOString()).toBe(
      "2024-01-05T00:00:00.000Z"
    )
    expect(parseDate("1/5/45", "en-US", utc)?.toISOString()).toBe(
      "1945-01-05T00:00:00.000Z"
    )
    expect(parseDate("2024年1月5日", "ja-JP", utc)?.toISOString()).toBe(
      "2024-01-05T00:00:00.000Z"
    )
    expect(parseDate("5 января 2024 г.", "ru-RU", utc)?.toISOString()).toBe(
      "2024-01-05T00:00:00.000Z"
    )
    expect(parseDate("2024-03-01", "en-US", utc)?.toISOString()).toBe(
      "2024-03-01T00:00:00.000Z"
    )
    expect(parseDate("3/1/2024, 2:30 PM", "en-US", utc)?.toISOString()).toBe(
      "2024-03-01T14:30:00.000Z"
    )
    expect(parseDate("2024-02-30", "en-US", utc)).toBeUndefined()
    expect(parseDate("someday", "en-US", utc)).toBeUndefined()
  })

  it("reads every type, and rejects what it cannot read with the type's message", () => {
    expect(parse("name", "  Well 9 ")).toEqual({ value: "  Well 9 " })
    expect(parse("oil", "")).toEqual({ value: null })
    expect(parse("oil", "abc")).toEqual({ error: "number" })
    expect(parse("spud", "abc")).toEqual({ error: "date" })
    expect(parse("active", "yes")).toEqual({ value: true })
    expect(parse("active", "FALSE")).toEqual({ value: false })
    expect(parse("active", "maybe")).toEqual({ error: "boolean" })
    expect(parse("status", "shut in")).toEqual({ value: "shut-in" })
    expect(parse("status", "producing")).toEqual({ value: "producing" })
    expect(parse("status", "Drilling")).toEqual({ error: "option" })
    expect(parse("oil", "1.234,5", "de-DE")).toEqual({ value: 1234.5 })
  })

  it("reads text with a column's own parse, rejected by what it throws", () => {
    const [column] = getColumnModel(
      createColumns<Well>([
        {
          id: "name",
          header: "Well",
          parse: (text) => {
            if (!/^\d+\/\d+-/.test(text)) throw new Error("Not a well name")
            return text.toUpperCase()
          },
        },
      ])
    ).leaves
    expect(parseCellText(column, "34/10-a-12", WELLS[0], context)).toEqual({
      value: "34/10-A-12",
    })
    expect(parseCellText(column, "nope", WELLS[0], context)).toEqual({
      error: "Not a well name",
    })
  })

  it("reads back what it copies: every column's display text", () => {
    const state = setup()
    const grid = resolveIn(state, [range("w0", "name", "w7", "status")])
    forEachCell(grid, (row, column) => {
      if (column.id === "name" || column.id === "field") return
      const value = column.getValue(row.item)
      const text = new Intl.NumberFormat("en-US").format(Number(value))
      const shown =
        column.type === "number"
          ? text
          : column.type === "date"
            ? new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(value as Date)
            : column.type === "boolean"
              ? value
                ? "Yes"
                : "No"
              : column.options.find((option) => option.value === value)!.label
      const parsed = parseCellText(
        column,
        value === null ? "" : shown,
        row.item,
        context
      )
      expect(parsed).toEqual({
        value: value instanceof Date ? value : (value ?? null),
      })
    })
  })
})

describe("pasted text in every Tecton locale", () => {
  const LOCALES = readdirSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../internal/i18n/translations"
    )
  )
    .filter((file) => file.endsWith(".ts"))
    .map((file) => file.slice(0, -3))

  it("reads back every date format a date column shows, in all 34 locales", () => {
    expect(LOCALES).toHaveLength(34)
    const day = new Date(Date.UTC(2024, 2, 1, 14, 30))
    const formats: Array<Intl.DateTimeFormatOptions> = [
      { dateStyle: "short" },
      { dateStyle: "medium" },
      { dateStyle: "long" },
      { dateStyle: "full" },
      { dateStyle: "medium", timeStyle: "short" },
      { year: "numeric", month: "short", day: "numeric" },
    ]
    const failed: Array<string> = []
    for (const locale of LOCALES)
      for (const format of formats) {
        const options = { ...format, timeZone: "UTC" }
        const text = new Intl.DateTimeFormat(locale, options).format(day)
        const wanted = format.timeStyle ? day.getTime() : Date.UTC(2024, 2, 1)
        if (parseDate(text, locale, options)?.getTime() !== wanted)
          failed.push(`${locale} ${JSON.stringify(format)} "${text}"`)
      }
    expect(failed).toEqual([])
  })

  it("reads back every number format a number column shows, but compact notation, in all 34 locales", () => {
    const formats: Array<Intl.NumberFormatOptions> = [
      {},
      { maximumFractionDigits: 0 },
      { style: "percent", maximumFractionDigits: 2 },
      { style: "currency", currency: "EUR" },
      { style: "unit", unit: "meter" },
    ]
    const failed: Array<string> = []
    for (const locale of LOCALES)
      for (const format of formats)
        for (const value of [-1234567.891, 0.5, 42, 1234]) {
          const text = new Intl.NumberFormat(locale, format).format(value)
          const shown =
            Number(
              new Intl.NumberFormat("en-US", {
                ...format,
                style: format.style === "percent" ? "percent" : "decimal",
                currency: undefined,
                unit: undefined,
                useGrouping: false,
                ...(format.style === "currency"
                  ? { maximumFractionDigits: 2 }
                  : {}),
              })
                .format(value)
                .replace(/%$/, "")
            ) / (format.style === "percent" ? 100 : 1)
          const read = parseNumber(text, locale, format)
          if (read === undefined || Math.abs(read - shown) > 1e-9)
            failed.push(
              `${locale} ${JSON.stringify(format)} "${text}" → ${read}`
            )
        }
    expect(failed).toEqual([])
  })

  it("reads groups only as the locale writes them, and drops a copy's formula guard", () => {
    // Two-digit groups only where the locale groups so.
    expect(parseNumber("1,50", "en-US", undefined)).toBeUndefined()
    expect(parseNumber("12,34,567", "en-US", undefined)).toBeUndefined()
    expect(parseNumber("12,34,567", "en-IN", undefined)).toBe(1234567)
    expect(parseNumber("1,234", "en-US", undefined)).toBe(1234)
    // A separator before one or two digits is read as a decimal, not a group.
    expect(parseNumber("1.50", "de-DE", undefined)).toBe(1.5)
    // Direction marks, as Intl writes them in right-to-left text.
    expect(parseNumber("‏-1,234.5‎", "he-IL", undefined)).toBe(-1234.5)
    const [text] = getColumnModel(
      createColumns<Well>([{ id: "name", header: "Well" }])
    ).leaves
    const read = (value: string) =>
      parseCellText(text, value, WELLS[0], {
        locale: "en-US",
        labels: { yes: "Yes", no: "No" },
        messages: {
          invalid: "invalid",
          number: "number",
          date: "date",
          boolean: "boolean",
          option: "option",
        },
      })
    expect(read("'=SUM(A1)")).toEqual({ value: "=SUM(A1)" })
    expect(read("'-5")).toEqual({ value: "-5" })
    expect(read("'quoted")).toEqual({ value: "'quoted" })
  })
})
