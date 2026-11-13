/**
 * The query language's budgets over 100,000 seeded rows, as the engine's
 * (`data-table-perf.test.ts`): each case runs once to warm up, then `RUNS`
 * times, and its median is checked against the budget times `HEADROOM`.
 * What a keystroke in the field costs: reading the query, writing a view
 * back, and the suggestions at the caret with their counts over the rest
 * of the query. Each timed run has a fresh query source (nothing kept from
 * the run before); the search index is prepared, as the table's idle time
 * has it by the time a user types.
 *
 * Measured (median, ms) in a 4-core Linux cloud sandbox, Node 22, jsdom,
 * November 2026; two runs:
 *   parse a query of 9 terms .............. 0.3 / 0.3  (budget 5)
 *   write a view of 6 filters ............. 0.03 / 0.02 (5)
 *   suggest an options column's values .... 8.5 / 7.0  (50)
 *   suggest a text column's values ........ 12.6 / 10.6 (50)
 *   suggest a number column's comparisons . 6.2 / 6.4  (50)
 *   suggest a date column's presets, years  6.4 / 7.3  (50)
 *   suggest a year's months ............... 13.3 / 13.7 (50)
 *   suggest values across columns ......... 30.3 / 32.7 (50: "we" is in
 *     every row's name, each formatted and counted)
 */
import { describe, expect, it } from "vitest"

import {
  createColumns,
  getColumnModel,
  getFormatter,
  type DataTableFilterValue,
} from "../internal/data-table/engine"
import { buildCore } from "../internal/data-table/engine/core"
import { createSearchIndex } from "../internal/data-table/engine/filter"
import {
  createQuerySource,
  getQueryLanguage,
  parseQuery,
  serializeQuery,
  suggestQuery,
} from "../internal/data-table/engine/query"

const ROWS = 100_000
const RUNS = 5
const HEADROOM = 2

type Well = {
  id: string
  name: string
  operator: string
  field: string
  status: string
  oil: number
  spud: Date
  active: boolean
}

/** mulberry32: the same rows on every run. */
function random(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const OPERATORS = [
  "Equinor",
  "Aker BP",
  "Vår Energi",
  "ConocoPhillips",
  "TotalEnergies",
  "Shell",
  "Wintershall Dea",
  "OKEA",
]
const STATUSES = ["drilling", "producing", "shut-in", "suspended", "plugged"]

const wells: Array<Well> = (() => {
  const next = random(20261111)
  const start = new Date(2015, 0, 1).getTime()
  return Array.from({ length: ROWS }, (_, i) => ({
    id: `w${i}`,
    name: `Well ${Math.floor(next() * 90_000) + 10_000}-${String.fromCharCode(65 + Math.floor(next() * 6))}`,
    operator: OPERATORS[Math.floor(next() * OPERATORS.length)],
    field: `Field ${Math.floor(next() * 200)}`,
    status: STATUSES[Math.floor(next() * STATUSES.length)],
    oil: Math.round(next() * 5_000_00) / 100,
    spud: new Date(start + Math.floor(next() * 3650) * 86_400_000),
    active: next() > 0.3,
  }))
})()

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "operator", header: "Operator" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: STATUSES.map((value) => ({ value, label: value.toUpperCase() })),
  },
  { id: "oil", header: "Oil (bbl/d)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
  { id: "active", header: "Active", type: "boolean" },
])
const model = getColumnModel(columns)
const language = getQueryLanguage(model, "en-US")
const formatter = getFormatter(model, "en-US")
const core = buildCore(wells, (well) => well.id, undefined)
const index = createSearchIndex(core.items, formatter)
// The index the table prepares in idle time.
for (const column of model.leaves) index.texts(column)
const NOW = new Date(2024, 11, 20, 12)

/** The median of `RUNS` timed runs of `measured`, after one warm-up; `prepare` is not timed. */
function median<TState>(
  prepare: () => TState,
  measured: (state: TState) => unknown
) {
  const times: Array<number> = []
  for (let run = 0; run <= RUNS; run++) {
    const state = prepare()
    const start = performance.now()
    measured(state)
    const time = performance.now() - start
    if (run > 0) times.push(time)
  }
  times.sort((a, b) => a - b)
  return times[Math.floor(times.length / 2)]
}

/** The suggestions at `|` in `marked`, with a fresh source; the median time. */
function timeSuggest(marked: string) {
  const caret = marked.indexOf("|")
  const text = marked.replace("|", "")
  let count = 0
  const time = median(
    () => ({
      parsed: parseQuery(language, text, { now: NOW }),
      source: createQuerySource({ model, core, formatter, index }),
    }),
    ({ parsed, source }) => {
      count = suggestQuery(language, parsed, caret, { source, now: NOW }).items
        .length
    }
  )
  expect(count).toBeGreaterThan(0)
  return time
}

describe(
  `DataTable query language with ${ROWS.toLocaleString("en-US")} rows`,
  { timeout: 300_000 },
  () => {
    it("parses a query of 9 terms within 5 ms", () => {
      const text = `status:drilling,producing oil:>=1000 oil:<=4000 spud:jun 2015..dec 2016 active:yes operator:"aker bp" well:12 field:none gullfaks`
      const time = median(
        () => undefined,
        () => parseQuery(language, text, { now: NOW })
      )
      expect(
        Object.keys(parseQuery(language, text, { now: NOW }).filters)
      ).toHaveLength(7)
      expect(time).toBeLessThan(5 * HEADROOM)
    })

    it("writes a view of 6 filters within 5 ms", () => {
      const filters: Record<string, DataTableFilterValue> = {
        status: { type: "options", values: ["drilling", "producing"] },
        oil: { type: "number", min: 1000, max: 4000, empty: true },
        spud: {
          type: "date",
          from: new Date(2015, 5, 1),
          to: new Date(2016, 11, 31),
        },
        active: { type: "boolean", value: true },
        operator: { type: "text", value: "aker bp" },
        name: { type: "text", value: "12" },
      }
      const time = median(
        () => undefined,
        () =>
          serializeQuery(language, { filters, search: "gull" }, { now: NOW })
      )
      expect(time).toBeLessThan(5 * HEADROOM)
    })

    it("suggests an options column's values, counted over the rest, within 50 ms", () => {
      expect(timeSuggest("oil:>=1000 gull status:|")).toBeLessThan(
        50 * HEADROOM
      )
    })

    it("suggests a text column's values that contain what is typed within 50 ms", () => {
      expect(timeSuggest("status:drilling well:12|")).toBeLessThan(
        50 * HEADROOM
      )
    })

    it("suggests a number column's comparisons with its range within 50 ms", () => {
      expect(timeSuggest("status:drilling oil:|")).toBeLessThan(50 * HEADROOM)
    })

    it("suggests a date column's presets and years with their rows within 50 ms", () => {
      expect(timeSuggest("status:drilling spud:|")).toBeLessThan(50 * HEADROOM)
    })

    it("suggests a year's months within 50 ms", () => {
      expect(timeSuggest("spud:2019-|")).toBeLessThan(50 * HEADROOM)
    })

    it("suggests values across columns for a free word within 50 ms", () => {
      expect(timeSuggest("status:producing we|")).toBeLessThan(50 * HEADROOM)
    })
  }
)
