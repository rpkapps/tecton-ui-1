/**
 * DataTable's query language (`engine/query`): reading a query into the
 * view's filters and search, its problems, writing a view back as a query
 * (and reading that back as the same view), and the suggestions at the
 * caret with their counts. In Los Angeles, where a day's start is not UTC
 * midnight, so days are read in the right zone.
 */
import { afterAll, describe, expect, it } from "vitest"

import {
  createColumns,
  createDefaultView,
  getColumnModel,
  reconcileView,
  sameFilters,
  type ColumnModel,
  type DataTableFilterValue,
  type DataTableView,
} from "../internal/data-table/engine"
import {
  applyQuery,
  getQueryLanguage,
  parseQuery,
  querySourceOf,
  serializeQuery,
  suggestQuery,
  type ParsedQuery,
  type QueryDiagnosticCode,
  type QuerySuggestion,
} from "../internal/data-table/engine/query"
import { startOfDay } from "../internal/data-table/engine/values"
import {
  problemMessage,
  type ColumnSample,
} from "../internal/data-table/query-model"
import { createTranslator } from "../internal/i18n/translations"
import queryEnglish from "../internal/i18n/translations/data-table-query/en-US"

const zone = process.env.TZ
process.env.TZ = "America/Los_Angeles"

afterAll(() => {
  process.env.TZ = zone
})

type Well = {
  id: string
  name: string
  operator: string | null
  status: string | null
  td: number | null
  spud: Date | null
  logged: Date | null
  subsea: boolean | null
  notes: string
}

const STATUS = [
  { value: "drilling", label: "Drilling" },
  { value: "producing", label: "Producing" },
  { value: "shut-in", label: "Shut in" },
  { value: "pa", label: "Plugged & abandoned" },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "operator", header: "Operator" },
  { id: "status", header: "Status", type: "options", options: STATUS },
  { id: "td", header: "TD (m)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
  {
    id: "logged",
    header: "Logged",
    type: "date",
    format: { dateStyle: "medium", timeZone: "Asia/Tokyo" },
  },
  { id: "subsea", header: "Subsea", type: "boolean" },
  { id: "notes", header: "Notes", filterable: false },
])
const model = getColumnModel(columns)
const en = getQueryLanguage(model, "en-US")
const de = getQueryLanguage(model, "de-DE", { yes: "Ja", no: "Nein" })
const NOW = new Date(2026, 10, 12, 15, 30)
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)
const tokyo = (y: number, m: number, d: number) =>
  startOfDay(y, m - 1, d, "Asia/Tokyo")

const parse = (text: string, language = en) =>
  parseQuery(language, text, { now: NOW })
const codes = (parsed: ParsedQuery) =>
  parsed.diagnostics.map((diagnostic) => diagnostic.code)
/** The filter `text` sets on `column`, with no problem. */
const filterOf = (text: string, column: string, language = en) => {
  const parsed = parse(text, language)
  expect(parsed.diagnostics).toEqual([])
  return parsed.filters[column]
}
const problem = (text: string, language = en) => {
  const parsed = parse(text, language)
  expect(parsed.diagnostics).toHaveLength(1)
  return parsed.diagnostics[0]
}

describe("parseQuery: terms and search", () => {
  it("reads free words and phrases as the search, joined by a space", () => {
    const parsed = parse(`gull  "aker bp"   fak`)
    expect(parsed.search).toBe("gull aker bp fak")
    expect(parsed.filters).toEqual({})
    expect(parsed.terms.map((term) => term.kind)).toEqual([
      "text",
      "text",
      "text",
    ])
  })

  it("keeps the search apart from filters, wherever they are", () => {
    const parsed = parse("gull status:drilling fak")
    expect(parsed.search).toBe("gull fak")
    expect(parsed.filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
  })

  it("unescapes quotes and backslashes in a phrase, and runs an open one to the end", () => {
    expect(parse(String.raw`"say \"hi\" \\ now"`).search).toBe(
      String.raw`say "hi" \ now`
    )
    expect(parse(`"open phrase`).search).toBe("open phrase")
    expect(parse(`“curly quotes”`).search).toBe("curly quotes")
  })

  it("reads a quoted colon, a time and a key-less colon as text", () => {
    expect(parse(`"status:drilling"`).filters).toEqual({})
    expect(parse(`"status:drilling"`).search).toBe("status:drilling")
    expect(parse("10:30").search).toBe("10:30")
  })

  it("accepts AND, which changes nothing", () => {
    const parsed = parse("status:drilling AND subsea:yes")
    expect(parsed.diagnostics).toEqual([])
    expect(Object.keys(parsed.filters)).toEqual(["status", "subsea"])
    expect(parsed.search).toBe("")
  })

  it("names a column by id or header, case, accents, spaces and punctuation left out", () => {
    for (const key of ["spud", "SpudDate", "spud_date", "spuddate", "SPÚDDATE"])
      expect(Object.keys(parse(`${key}:2015`).filters)).toEqual(["spud"])
    expect(Object.keys(parse("tdm:1000").filters)).toEqual(["td"])
    expect(Object.keys(parse("td(m):1000").filters)).toEqual(["td"])
    expect(Object.keys(parse("well:a").filters)).toEqual(["name"])
  })

  it("gives spans to draw every part of the query", () => {
    const parsed = parse(`status:drilling,none td:>=3000 "a b" AND`)
    expect(
      parsed.spans.map((span) => [
        parsed.text.slice(span.start, span.end),
        span.kind,
      ])
    ).toEqual([
      ["status", "key"],
      [":", "colon"],
      ["drilling", "value"],
      [",", "separator"],
      ["none", "empty"],
      ["td", "key"],
      [":", "colon"],
      [">=", "operator"],
      ["3000", "value"],
      [`"a b"`, "text"],
      ["AND", "keyword"],
    ])
    expect(parse("spud:last30d").spans.at(-1)?.kind).toBe("preset")
  })

  it("leaves an incomplete term out without a problem", () => {
    for (const text of [
      "status:",
      "status:,",
      "td:",
      "td:>",
      "td:..",
      "spud:",
      "name:",
      `name:""`,
    ]) {
      const parsed = parse(text)
      expect(parsed.diagnostics).toEqual([])
      expect(parsed.filters).toEqual({})
      expect(parsed.terms[0]).toMatchObject({
        kind: "filter",
        incomplete: true,
        applied: false,
      })
    }
  })
})

describe("parseQuery: values by column type", () => {
  it("reads options by value or label, in the order typed, without repeats", () => {
    expect(
      filterOf(`status:producing,Drilling,"shut in",shutin,PA`, "status")
    ).toEqual({
      type: "options",
      values: ["producing", "drilling", "shut-in", "pa"],
    })
    expect(filterOf(`status:"plugged & abandoned"`, "status")).toEqual({
      type: "options",
      values: ["pa"],
    })
  })

  it("adds No value to options, or filters by it alone", () => {
    expect(filterOf("status:drilling,none", "status")).toEqual({
      type: "options",
      values: ["drilling"],
      empty: true,
    })
    expect(filterOf("status:empty", "status")).toEqual({
      type: "options",
      values: [],
      empty: true,
    })
  })

  it("reads yes / no, true / false and the boolean filter's labels", () => {
    expect(filterOf("subsea:yes", "subsea")).toEqual({
      type: "boolean",
      value: true,
    })
    expect(filterOf("subsea:FALSE", "subsea")).toEqual({
      type: "boolean",
      value: false,
    })
    expect(filterOf("subsea:nein", "subsea", de)).toEqual({
      type: "boolean",
      value: false,
    })
    expect(filterOf("subsea:ja,none", "subsea", de)).toEqual({
      type: "boolean",
      value: true,
      empty: true,
    })
    expect(filterOf("subsea:none", "subsea")).toEqual({
      type: "boolean",
      empty: true,
    })
  })

  it("reads a text column's value as the text it contains, commas and all", () => {
    expect(filterOf("name:a-12", "name")).toEqual({
      type: "text",
      value: "a-12",
    })
    expect(filterOf(`name:"a, b "`, "name")).toEqual({
      type: "text",
      value: "a, b ",
    })
    expect(filterOf("name:a,b", "name")).toEqual({ type: "text", value: "a,b" })
    expect(filterOf("name:>5", "name")).toEqual({ type: "text", value: ">5" })
    expect(filterOf("name:a:b", "name")).toEqual({ type: "text", value: "a:b" })
    expect(filterOf("name:a,none", "name")).toEqual({
      type: "text",
      value: "a",
      empty: true,
    })
    expect(filterOf("name:none", "name")).toEqual({
      type: "text",
      value: "",
      empty: true,
    })
    expect(filterOf(`name:"none"`, "name")).toEqual({
      type: "text",
      value: "none",
    })
  })

  it("reads > and < on numbers as exclusive bounds", () => {
    expect(filterOf("td:>3000", "td")).toEqual({
      type: "number",
      min: 3000,
      minExclusive: true,
    })
    expect(filterOf("td:<3000", "td")).toEqual({
      type: "number",
      max: 3000,
      maxExclusive: true,
    })
    expect(filterOf("td:>3000,none", "td")).toEqual({
      type: "number",
      min: 3000,
      minExclusive: true,
      empty: true,
    })
    // Two terms on the column: the bounds of both, each exclusive or not
    // as its term has it, and the stricter one at the same value.
    expect(filterOf("td:>1000 td:<=3000", "td")).toEqual({
      type: "number",
      min: 1000,
      max: 3000,
      minExclusive: true,
    })
    expect(filterOf("td:>=1000 td:>1000", "td")).toEqual({
      type: "number",
      min: 1000,
      minExclusive: true,
    })
    expect(filterOf("td:>1000 td:>=2000", "td")).toEqual({
      type: "number",
      min: 2000,
    })
    expect(filterOf("td:3000 td:<=3000", "td")).toEqual({
      type: "number",
      min: 3000,
      max: 3000,
    })
    // Nothing is more than and less than 3000.
    const parsed = parse("td:>3000 td:<3000")
    expect(codes(parsed)).toEqual(["duplicateColumn"])
    expect(parsed.diagnostics[0].params.reason).toBe("noMatch")
    expect(codes(parse("td:3000 td:<3000"))).toEqual(["duplicateColumn"])
  })

  it("writes exclusive bounds as > and <, a range of them as two terms", () => {
    const write = (value: DataTableFilterValue) =>
      serializeQuery(en, { filters: { td: value }, search: "" })
    expect(write({ type: "number", min: 3000, minExclusive: true })).toBe(
      "tdm:>3000"
    )
    expect(write({ type: "number", max: 3000, maxExclusive: true })).toBe(
      "tdm:<3000"
    )
    expect(
      write({ type: "number", min: 1000, max: 3000, maxExclusive: true })
    ).toBe("tdm:>=1000 tdm:<3000")
    expect(
      write({
        type: "number",
        min: 1000,
        max: 3000,
        minExclusive: true,
        maxExclusive: true,
        empty: true,
      })
    ).toBe("tdm:>1000,none tdm:<3000,none")
  })

  it("reads numbers, comparisons and ranges, ends included", () => {
    expect(filterOf("td:3000", "td")).toEqual({
      type: "number",
      min: 3000,
      max: 3000,
    })
    expect(filterOf("td:=3000", "td")).toEqual({
      type: "number",
      min: 3000,
      max: 3000,
    })
    expect(filterOf("td:>=3000", "td")).toEqual({ type: "number", min: 3000 })
    expect(filterOf("td:≥3000", "td")).toEqual({ type: "number", min: 3000 })
    expect(filterOf("td:<=3000", "td")).toEqual({ type: "number", max: 3000 })
    expect(filterOf("td:1000..3000", "td")).toEqual({
      type: "number",
      min: 1000,
      max: 3000,
    })
    expect(filterOf("td:1000..", "td")).toEqual({ type: "number", min: 1000 })
    expect(filterOf("td:..3000", "td")).toEqual({ type: "number", max: 3000 })
    expect(filterOf("td:-5..-1.5", "td")).toEqual({
      type: "number",
      min: -5,
      max: -1.5,
    })
    expect(filterOf("td:>=3000,none", "td")).toEqual({
      type: "number",
      min: 3000,
      empty: true,
    })
    expect(filterOf("td:none", "td")).toEqual({ type: "number", empty: true })
    expect(filterOf("td:25%", "td")).toEqual({
      type: "number",
      min: 0.25,
      max: 0.25,
    })
  })

  it("reads numbers as the table's locale writes them", () => {
    expect(filterOf("td:1,234.5", "td")).toEqual({
      type: "number",
      min: 1234.5,
      max: 1234.5,
    })
    expect(filterOf("td:1,00,000", "td")).toEqual({
      type: "number",
      min: 100000,
      max: 100000,
    })
    expect(filterOf("td:3,5", "td", de)).toEqual({
      type: "number",
      min: 3.5,
      max: 3.5,
    })
    expect(filterOf("td:3.000..4.000,5,none", "td", de)).toEqual({
      type: "number",
      min: 3000,
      max: 4000.5,
      empty: true,
    })
    expect(filterOf("td:>=−7", "td")).toEqual({ type: "number", min: -7 })
    expect(filterOf("td:١٢٣", "td", getQueryLanguage(model, "ar-EG"))).toEqual({
      type: "number",
      min: 123,
      max: 123,
    })
    expect(problem("td:3,5").code).toBe("notANumber")
    expect(problem("td:3.5", de).code).toBe("notANumber")
  })

  it("reads years, months and days as their days, in the local zone", () => {
    expect(filterOf("spud:2015", "spud")).toEqual({
      type: "date",
      from: day(2015, 1, 1),
      to: day(2015, 12, 31),
    })
    for (const text of [
      "2015-06",
      "2015-6",
      "2015/06",
      "6/2015",
      "jun 2015",
      "June 2015",
      "JUNE-2015",
    ])
      expect(filterOf(`spud:${text}`, "spud")).toEqual({
        type: "date",
        from: day(2015, 6, 1),
        to: day(2015, 6, 30),
      })
    for (const text of [
      "2015-06-30",
      "2015/6/30",
      "2015.06.30",
      "6/30/2015",
      "30 jun 2015",
      "jun 30, 2015",
      "30-jun-2015",
    ])
      expect(filterOf(`spud:${text}`, "spud")).toEqual({
        type: "date",
        from: day(2015, 6, 30),
        to: day(2015, 6, 30),
      })
  })

  it("reads the locale's numeric order and month names", () => {
    const june30 = {
      type: "date",
      from: day(2015, 6, 30),
      to: day(2015, 6, 30),
    }
    expect(filterOf("spud:30.6.2015", "spud", de)).toEqual(june30)
    expect(
      filterOf("spud:30/06/2015", "spud", getQueryLanguage(model, "en-GB"))
    ).toEqual(june30)
    expect(filterOf("spud:30 juni 2015", "spud", de)).toEqual(june30)
    expect(filterOf("spud:30 jun 2015", "spud", de)).toEqual(june30)
    const fr = getQueryLanguage(model, "fr-FR")
    expect(filterOf("spud:févr. 2016", "spud", fr)).toEqual({
      type: "date",
      from: day(2016, 2, 1),
      to: day(2016, 2, 29),
    })
    const es = getQueryLanguage(model, "es-ES")
    expect(filterOf("spud:30 de junio de 2015", "spud", es)).toEqual(june30)
  })

  it("reads comparisons and ranges of dates by whole days", () => {
    expect(filterOf("spud:>2015-06", "spud")).toEqual({
      type: "date",
      from: day(2015, 7, 1),
    })
    expect(filterOf("spud:>=2015-06", "spud")).toEqual({
      type: "date",
      from: day(2015, 6, 1),
    })
    expect(filterOf("spud:<2015", "spud")).toEqual({
      type: "date",
      to: day(2014, 12, 31),
    })
    expect(filterOf("spud:<=2015", "spud")).toEqual({
      type: "date",
      to: day(2015, 12, 31),
    })
    expect(filterOf("spud:2010..2015-06", "spud")).toEqual({
      type: "date",
      from: day(2010, 1, 1),
      to: day(2015, 6, 30),
    })
    expect(filterOf("spud:jun 2015..dec 2016", "spud")).toEqual({
      type: "date",
      from: day(2015, 6, 1),
      to: day(2016, 12, 31),
    })
    expect(filterOf("spud:>= jun 2015", "spud")).toEqual({
      type: "date",
      from: day(2015, 6, 1),
    })
    expect(filterOf("spud:2015..", "spud")).toEqual({
      type: "date",
      from: day(2015, 1, 1),
    })
    expect(filterOf("spud:..2015", "spud")).toEqual({
      type: "date",
      to: day(2015, 12, 31),
    })
    expect(filterOf("spud:2015,none", "spud")).toEqual({
      type: "date",
      from: day(2015, 1, 1),
      to: day(2015, 12, 31),
      empty: true,
    })
  })

  it("takes the words after a date only when they make it one", () => {
    const parsed = parse("spud:jun 2015 gullfaks")
    expect(parsed.search).toBe("gullfaks")
    expect(parsed.terms[0]).toMatchObject({ kind: "filter", start: 0, end: 13 })
    // A date already: the next word is a word.
    expect(parse("spud:2015 jun").search).toBe("jun")
    expect(parse("spud:2015 2016").search).toBe("2016")
    // Never a term or a phrase.
    expect(parse(`spud:jun status:drilling`).filters.status).toBeDefined()
  })

  it("resolves relative presets against now, today included", () => {
    const cases: Array<[string, Date, Date]> = [
      ["today", day(2026, 11, 12), day(2026, 11, 12)],
      ["yesterday", day(2026, 11, 11), day(2026, 11, 11)],
      ["last30d", day(2026, 10, 14), day(2026, 11, 12)],
      ["last2w", day(2026, 10, 30), day(2026, 11, 12)],
      ["last3m", day(2026, 8, 13), day(2026, 11, 12)],
      ["last1y", day(2025, 11, 13), day(2026, 11, 12)],
      ["thismonth", day(2026, 11, 1), day(2026, 11, 30)],
      ["lastmonth", day(2026, 10, 1), day(2026, 10, 31)],
      ["thisyear", day(2026, 1, 1), day(2026, 12, 31)],
      ["lastyear", day(2025, 1, 1), day(2025, 12, 31)],
    ]
    for (const [preset, from, to] of cases)
      expect(filterOf(`spud:${preset}`, "spud")).toEqual({
        type: "date",
        from,
        to,
      })
    // A month back from March 31 stops at the end of February.
    expect(
      parseQuery(en, "spud:last1m", { now: new Date(2024, 2, 31, 9) }).filters
        .spud
    ).toEqual({ type: "date", from: day(2024, 3, 1), to: day(2024, 3, 31) })
  })

  it("reads a column's days in its time zone, as its date filter does", () => {
    expect(filterOf("logged:2015-06", "logged")).toEqual({
      type: "date",
      from: tokyo(2015, 6, 1),
      to: tokyo(2015, 6, 30),
    })
    // 15:30 in Los Angeles on November 12 is November 13 in Tokyo.
    expect(filterOf("logged:today", "logged")).toEqual({
      type: "date",
      from: tokyo(2026, 11, 13),
      to: tokyo(2026, 11, 13),
    })
    expect(filterOf("logged:>2015-06-30", "logged")).toEqual({
      type: "date",
      from: tokyo(2015, 7, 1),
    })
  })

  it("reads an instant exactly", () => {
    expect(filterOf("spud:>=2015-06-30T10:30:00.000Z", "spud")).toEqual({
      type: "date",
      from: new Date("2015-06-30T10:30:00.000Z"),
    })
    expect(filterOf("spud:2015-06-30T12:00+02:00..2015-07-01", "spud")).toEqual(
      {
        type: "date",
        from: new Date("2015-06-30T10:00:00.000Z"),
        to: day(2015, 7, 1),
      }
    )
  })

  it("gives each filter term the value it alone was understood as", () => {
    const parsed = parse("spud:jun 2015 spud:>=2015-06-15")
    const [first, second] = parsed.terms
    expect(first).toMatchObject({
      value: { type: "date", from: day(2015, 6, 1), to: day(2015, 6, 30) },
    })
    expect(second).toMatchObject({
      value: { type: "date", from: day(2015, 6, 15) },
    })
    expect(parsed.filters.spud).toEqual({
      type: "date",
      from: day(2015, 6, 15),
      to: day(2015, 6, 30),
    })
  })
})

describe("parseQuery: one column twice", () => {
  it("keeps the rows both terms match, when one filter says it", () => {
    expect(filterOf("td:>=1000 td:<=3000", "td")).toEqual({
      type: "number",
      min: 1000,
      max: 3000,
    })
    expect(filterOf("td:>=1000,none td:<=3000,none", "td")).toEqual({
      type: "number",
      min: 1000,
      max: 3000,
      empty: true,
    })
    expect(
      filterOf("status:drilling,producing status:producing,pa", "status")
    ).toEqual({
      type: "options",
      values: ["producing"],
    })
    expect(filterOf("spud:2015 spud:>=2015-06", "spud")).toEqual({
      type: "date",
      from: day(2015, 6, 1),
      to: day(2015, 12, 31),
    })
    expect(filterOf("name:a name:a,none", "name")).toEqual({
      type: "text",
      value: "a",
    })
    expect(filterOf("subsea:yes subsea:yes", "subsea")).toEqual({
      type: "boolean",
      value: true,
    })
  })

  it("is a problem on the second term otherwise, the first applied", () => {
    const cases: Array<[string, string]> = [
      ["status:drilling status:producing", "noMatch"],
      ["td:>=3000 td:<=1000", "noMatch"],
      ["subsea:yes subsea:no", "noMatch"],
      ["name:a name:b", "notCombinable"],
      ["spud:2015 spud:2016", "noMatch"],
    ]
    for (const [text, reason] of cases) {
      const parsed = parse(text)
      expect(parsed.diagnostics).toMatchObject([
        { code: "duplicateColumn", params: { reason } },
      ])
      const second = text.indexOf(" ") + 1
      expect(parsed.diagnostics[0]).toMatchObject({
        start: second,
        end: text.length,
      })
      expect(parsed.terms[0].applied).toBe(true)
      expect(parsed.terms[1].applied).toBe(false)
      expect(parsed.filters).toEqual({
        [Object.keys(parsed.filters)[0]]: (
          parsed.terms[0] as { value: unknown }
        ).value,
      })
    }
  })
})

describe("parseQuery: problems", () => {
  const cases: Array<
    [string, QueryDiagnosticCode, Record<string, unknown>, string]
  > = [
    [
      "stauts:drilling",
      "unknownColumn",
      { key: "stauts", suggestion: "status" },
      "stauts:drilling",
    ],
    ["foo:bar", "unknownColumn", { key: "foo" }, "foo:bar"],
    ["notes:x", "columnNotFilterable", { column: "notes" }, "notes:x"],
    [
      "status:driling",
      "unknownValue",
      { column: "status", value: "driling", suggestion: "drilling" },
      "driling",
    ],
    ["status:drilling,nope", "unknownValue", { value: "nope" }, "nope"],
    [
      "subsea:maybe",
      "unknownValue",
      { column: "subsea", value: "maybe" },
      "maybe",
    ],
    ["td:abc", "notANumber", { column: "td", value: "abc" }, "abc"],
    ["td:>=1k", "notANumber", { value: "1k" }, "1k"],
    ["spud:2015-13", "badDate", { value: "2015-13" }, "2015-13"],
    ["spud:2015-02-30", "badDate", {}, "2015-02-30"],
    ["spud:soon", "badDate", {}, "soon"],
    ["spud:last0d", "badDate", {}, "last0d"],
    ["spud:6/30/15", "ambiguousDate", { reason: "twoDigitYear" }, "6/30/15"],
    ["spud:jun", "ambiguousDate", { reason: "noYear" }, "jun"],
    ["spud:6/30", "ambiguousDate", { reason: "noYear" }, "6/30"],
    ["spud:ju 2015", "ambiguousDate", { reason: "month" }, "ju"],
    [
      "td:3000..1000",
      "backwardsRange",
      { from: "3000", to: "1000" },
      "3000..1000",
    ],
    [
      "spud:2016..2015",
      "backwardsRange",
      { from: "2016", to: "2015" },
      "2016..2015",
    ],
    ["drilling OR producing", "unsupportedOperator", { operator: "OR" }, "OR"],
    [
      "NOT drilling",
      "unsupportedOperator",
      { operator: "NOT" },
      "NOT drilling",
    ],
    [
      "-status:drilling",
      "unsupportedOperator",
      { operator: "-" },
      "-status:drilling",
    ],
    ["-gullfaks", "unsupportedOperator", { operator: "-" }, "-gullfaks"],
    [
      "spud:>2015-06-30T10:00:00Z",
      "exclusiveComparison",
      { operator: ">" },
      ">2015-06-30T10:00:00Z",
    ],
    ["status:>drilling", "notComparable", { operator: ">" }, ">drilling"],
    ["subsea:1..2", "notComparable", { operator: ".." }, "1..2"],
    ["subsea:yes,no", "multipleValues", { column: "subsea" }, "yes,no"],
    ["spud:2015,2016", "multipleValues", { column: "spud" }, "2015,2016"],
  ]
  it.each(cases)("%s: %s", (text, code, params, span) => {
    const parsed = parse(text)
    expect(parsed.diagnostics).toHaveLength(1)
    const [diagnostic] = parsed.diagnostics
    expect(diagnostic.code).toBe(code)
    expect(diagnostic.params).toMatchObject(params)
    expect(text.slice(diagnostic.start, diagnostic.end)).toBe(span)
    // A term with a problem is not applied.
    expect(parsed.filters).toEqual({})
    expect(
      parsed.terms.some(
        (term) =>
          term.kind !== "keyword" && term.applied && term.kind === "filter"
      )
    ).toBe(false)
  })

  it("applies the other terms beside a problem", () => {
    const parsed = parse("status:drilling td:abc gullfaks OR")
    expect(codes(parsed)).toEqual(["notANumber", "unsupportedOperator"])
    expect(parsed.filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
    expect(parsed.search).toBe("gullfaks")
  })

  it("does not search for a negated word", () => {
    expect(parse("-gullfaks").search).toBe("")
    expect(parse(`"-gullfaks"`).search).toBe("-gullfaks")
  })

  it("takes the term after NOT out with it, never applying the opposite of what was meant", () => {
    // Searching for "drilling" would keep exactly the rows NOT meant to drop.
    const word = parse("NOT drilling")
    expect(word.search).toBe("")
    const filter = parse("status:producing NOT status:drilling gullfaks")
    expect(filter.filters).toEqual({
      status: { type: "options", values: ["producing"] },
    })
    expect(filter.search).toBe("gullfaks")
    const [diagnostic] = filter.diagnostics
    expect(diagnostic.params).toMatchObject({ operator: "NOT" })
    expect(filter.text.slice(diagnostic.start, diagnostic.end)).toBe(
      "NOT status:drilling"
    )
    // With nothing after it, or another keyword, NOT alone is the problem.
    for (const text of [
      "gullfaks NOT",
      "NOT OR gullfaks",
      "NOT AND gullfaks",
    ]) {
      const parsed = parse(text)
      expect(parsed.search).toBe("gullfaks")
      const not = parsed.diagnostics.find(
        (each) => each.params.operator === "NOT"
      )!
      expect(text.slice(not.start, not.end)).toBe("NOT")
    }
  })
})

describe("serializeQuery", () => {
  const view = (
    filters: Record<string, DataTableFilterValue>,
    search = ""
  ) => ({ filters, search })
  const write = (
    filters: Record<string, DataTableFilterValue>,
    search = "",
    language = en
  ) => serializeQuery(language, view(filters, search), { now: NOW })

  it("writes filters in column order by their keys, then the search", () => {
    expect(
      write(
        {
          subsea: { type: "boolean", value: true },
          status: {
            type: "options",
            values: ["shut-in", "drilling"],
            empty: true,
          },
          td: { type: "number", min: 1000, max: 3000 },
        },
        "gull fak"
      )
    ).toBe(`status:"shut in",drilling,none tdm:1000..3000 subsea:yes gull fak`)
  })

  it("writes dates by whole years, months or days", () => {
    expect(
      write({
        spud: { type: "date", from: day(2015, 1, 1), to: day(2015, 12, 31) },
      })
    ).toBe("spuddate:2015")
    expect(
      write({
        spud: { type: "date", from: day(2015, 1, 1), to: day(2016, 12, 31) },
      })
    ).toBe("spuddate:2015..2016")
    expect(
      write({
        spud: { type: "date", from: day(2015, 6, 1), to: day(2015, 8, 31) },
      })
    ).toBe("spuddate:2015-06..2015-08")
    expect(
      write({
        spud: { type: "date", from: day(2015, 6, 30), to: day(2015, 6, 30) },
      })
    ).toBe("spuddate:2015-06-30")
    expect(
      write({
        spud: { type: "date", from: day(2015, 6, 2), to: day(2015, 7, 1) },
      })
    ).toBe("spuddate:2015-06-02..2015-07-01")
    expect(write({ spud: { type: "date", from: day(2015, 6, 1) } })).toBe(
      "spuddate:>=2015-06-01"
    )
    expect(
      write({ spud: { type: "date", to: day(2015, 6, 30), empty: true } })
    ).toBe("spuddate:<=2015-06-30,none")
    expect(
      write({
        logged: {
          type: "date",
          from: tokyo(2015, 6, 1),
          to: tokyo(2015, 6, 30),
        },
      })
    ).toBe("logged:2015-06")
    expect(
      write({ spud: { type: "date", from: new Date("2015-06-30T10:30:00Z") } })
    ).toBe("spuddate:>=2015-06-30T10:30:00.000Z")
  })

  it("writes numbers exactly, in the table's locale", () => {
    expect(write({ td: { type: "number", min: 1.5e-7, max: 1e21 } })).toBe(
      "tdm:0.00000015..1000000000000000000000"
    )
    expect(write({ td: { type: "number", min: -2.5 } }, "", de)).toBe(
      "tdm:>=-2,5"
    )
    expect(write({ subsea: { type: "boolean", value: false } }, "", de)).toBe(
      "subsea:nein"
    )
  })

  it("quotes what has to be", () => {
    expect(write({ name: { type: "text", value: `a "b", c` } })).toBe(
      String.raw`well:"a \"b\", c"`
    )
    expect(write({ name: { type: "text", value: "none" } })).toBe(`well:"none"`)
    expect(write({}, "status:drilling")).toBe(`"status:drilling"`)
    expect(write({}, "-5 OR 6")).toBe(`"-5 OR 6"`)
    expect(write({}, " padded  ")).toBe(`" padded  "`)
    expect(write({}, "   ")).toBe("")
  })

  it("leaves out what the query cannot say, and applyQuery keeps it", () => {
    const filters: Record<string, DataTableFilterValue> = {
      notes: { type: "text", value: "x" },
      name: { type: "custom", value: 1 },
      status: { type: "options", values: ["pa"] },
    }
    expect(write(filters)).toBe(`status:"plugged & abandoned"`)
    const base = reconcileView(
      columns,
      {},
      createDefaultView(columns, undefined, {
        sortable: true,
        filterable: true,
        groupable: true,
      }),
      {
        sortable: true,
        filterable: true,
        groupable: true,
      }
    )
    const current: DataTableView = { ...base, filters }
    const next = applyQuery(en, current, parse("status:drilling gull"))
    expect(next.filters).toEqual({
      notes: { type: "text", value: "x" },
      name: { type: "custom", value: 1 },
      status: { type: "options", values: ["drilling"] },
    })
    expect(next.search).toBe("gull")
    // Nothing new: the same view.
    const same = {
      ...base,
      filters: { status: { type: "options" as const, values: ["drilling"] } },
      search: "gull",
    }
    expect(applyQuery(en, same, parse("status:drilling gull"))).toBe(same)
  })

  it("keeps a relative preset while the view still holds its days", () => {
    const previous = parse("spud:last30d status:drilling")
    const filters = {
      ...previous.filters,
      subsea: { type: "boolean", value: true } as const,
    }
    expect(serializeQuery(en, view(filters), { now: NOW, previous })).toBe(
      "status:drilling spuddate:last30d subsea:yes"
    )
    // The next day, last30d is other days: the dates are written.
    expect(
      serializeQuery(en, view(previous.filters), {
        now: new Date(2026, 10, 13, 9),
        previous,
      })
    ).toBe("status:drilling spuddate:2026-10-14..2026-11-12")
    // Another range: dates.
    expect(
      serializeQuery(
        en,
        view({ spud: { type: "date", from: day(2026, 10, 1) } }),
        { now: NOW, previous }
      )
    ).toBe("spuddate:>=2026-10-01")
  })
})

describe("parse(serialize(view)) is the view", () => {
  /** mulberry32 */
  function random(seed: number) {
    let state = seed
    return () => {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const next = random(20261112)
  const pick = <T>(list: ReadonlyArray<T>) =>
    list[Math.floor(next() * list.length)]
  const chance = (p: number) => next() < p
  const TEXTS = [
    "a",
    "A-12",
    "a b",
    "a,b",
    `say "hi"`,
    "back\\slash",
    "none",
    "  x ",
    ">5",
    "a:b",
    "ø",
    "-x",
    "OR",
    "x..y",
    "“q”",
    "",
  ]
  const NUMBERS = [
    0,
    -0.5,
    3000,
    1234.5678,
    1e-7,
    2.5e21,
    -42,
    0.1 + 0.2,
    Number.MAX_SAFE_INTEGER,
  ]
  const someDate = (zone?: string) => {
    if (chance(0.2))
      return new Date(
        Date.UTC(2000 + Math.floor(next() * 30), 0, 1) +
          Math.floor(next() * 3e11)
      )
    const y = 1990 + Math.floor(next() * 50)
    const m = Math.floor(next() * 12)
    const d = chance(0.3) ? 1 : 1 + Math.floor(next() * 28)
    return startOfDay(y, m, d, zone)
  }
  const empty = () => (chance(0.3) ? { empty: true as const } : {})
  const filterFor = (column: string): DataTableFilterValue | undefined => {
    switch (column) {
      case "name": {
        const value = pick(TEXTS)
        const e = empty()
        return value.trim() === "" && !e.empty
          ? undefined
          : { type: "text", value, ...e }
      }
      case "status": {
        const values = STATUS.filter(() => chance(0.4)).map(
          (option) => option.value
        )
        if (chance(0.5)) values.reverse()
        const e = empty()
        return values.length || e.empty
          ? { type: "options", values, ...e }
          : undefined
      }
      case "td": {
        const e = empty()
        let min = chance(0.6) ? pick(NUMBERS) : undefined
        let max = chance(0.6) ? pick(NUMBERS) : undefined
        if (min !== undefined && max !== undefined && min > max)
          [min, max] = [max, min]
        if (chance(0.15)) max = min
        // Exclusive bounds, but not on both ends of one number (that
        // matches nothing, and reads back as a problem).
        const point = min !== undefined && min === max
        const minExclusive = min !== undefined && !point && chance(0.3)
        const maxExclusive = max !== undefined && !point && chance(0.3)
        if (minExclusive || maxExclusive) types.add("number+exclusive")
        return min === undefined && max === undefined && !e.empty
          ? undefined
          : {
              type: "number",
              ...(min === undefined ? {} : { min }),
              ...(max === undefined ? {} : { max }),
              ...(minExclusive ? { minExclusive: true as const } : {}),
              ...(maxExclusive ? { maxExclusive: true as const } : {}),
              ...e,
            }
      }
      case "spud":
      case "logged": {
        const zone = column === "logged" ? "Asia/Tokyo" : undefined
        const e = empty()
        let from = chance(0.6) ? someDate(zone) : undefined
        let to = chance(0.6) ? someDate(zone) : undefined
        if (from && to && from > to) [from, to] = [to, from]
        if (from && to && chance(0.2)) {
          // Whole months and years.
          const y = from.getUTCFullYear()
          from = startOfDay(y, chance(0.5) ? 0 : 5, 1, zone)
          to = startOfDay(
            y + Math.floor(next() * 2),
            chance(0.5) ? 12 : 7,
            0,
            zone
          )
        }
        return !from && !to && !e.empty
          ? undefined
          : {
              type: "date",
              ...(from ? { from } : {}),
              ...(to ? { to } : {}),
              ...e,
            }
      }
      case "subsea": {
        const e = empty()
        const value = chance(0.7) ? chance(0.5) : undefined
        return value === undefined && !e.empty
          ? undefined
          : { type: "boolean", ...(value === undefined ? {} : { value }), ...e }
      }
    }
    return undefined
  }
  /** The kinds of filter written, for the check that each one was. */
  const types = new Set<string>()
  const SEARCHES = [
    "",
    "gull",
    "gull fak",
    "  two  spaces ",
    "a:b c",
    `"quoted"`,
    "-neg",
    "OR",
    "AND",
    "ünïcödé",
    "x\\y",
  ]

  it.each([
    ["en-US", en],
    ["de-DE", de],
    ["ar-EG", getQueryLanguage(model, "ar-EG")],
    ["fr-FR", getQueryLanguage(model, "fr-FR")],
  ] as const)("in %s, over 400 random views", (_, language) => {
    types.clear()
    for (let run = 0; run < 400; run++) {
      const filters: Record<string, DataTableFilterValue> = {}
      for (const column of ["name", "status", "td", "spud", "logged", "subsea"])
        if (chance(0.5)) {
          const value = filterFor(column)
          if (value) filters[column] = value
        }
      const search = pick(SEARCHES)
      const text = serializeQuery(language, { filters, search }, { now: NOW })
      const parsed = parseQuery(language, text, { now: NOW })
      expect(parsed.diagnostics, text).toEqual([])
      expect(
        sameFilters(parsed.filters, filters),
        `${text}\n${JSON.stringify(parsed.filters)}\n${JSON.stringify(filters)}`
      ).toBe(true)
      expect(parsed.search, text).toBe(search.trim() === "" ? "" : search)
      // And written again, the same text.
      expect(serializeQuery(language, parsed, { now: NOW })).toBe(text)
      // Its spans in order, apart.
      parsed.spans.forEach((span, i) => {
        expect(span.end).toBeGreaterThan(span.start)
        if (i > 0)
          expect(span.start).toBeGreaterThanOrEqual(parsed.spans[i - 1].end)
      })
      for (const value of Object.values(filters))
        types.add(
          `${value.type}${value.type !== "custom" && value.empty ? "+empty" : ""}`
        )
    }
    // Every type, with and without "No value", and exclusive bounds, were
    // written.
    expect(types.size).toBe(11)
  })

  it("round-trips what the calendar writes", () => {
    for (const text of [
      "spud:2015-06-03..2015-07-14",
      "spud:>2015-06-30",
      "spud:<2015-06-30",
      "spud:>=2015-06-30",
      "spud:<=2015-06-30",
    ]) {
      const parsed = parse(text)
      expect(parsed.diagnostics).toEqual([])
      const again = parse(serializeQuery(en, parsed, { now: NOW }))
      expect(sameFilters(again.filters, parsed.filters)).toBe(true)
    }
  })
})

describe("suggestQuery", () => {
  const wells: Array<Well> = [
    {
      id: "1",
      name: "Gullfaks A-1",
      operator: "Equinor",
      status: "drilling",
      td: 3200,
      spud: day(2015, 6, 3),
      logged: null,
      subsea: true,
      notes: "",
    },
    {
      id: "2",
      name: "Gullfaks A-2",
      operator: "Equinor",
      status: "producing",
      td: 2800,
      spud: day(2015, 7, 9),
      logged: null,
      subsea: false,
      notes: "",
    },
    {
      id: "3",
      name: "Oseberg B-1",
      operator: "Equinor",
      status: "producing",
      td: 4100,
      spud: day(2016, 1, 20),
      logged: null,
      subsea: true,
      notes: "",
    },
    {
      id: "4",
      name: "Ivar Aasen",
      operator: "Aker BP",
      status: "shut-in",
      td: null,
      spud: day(2026, 10, 20),
      logged: null,
      subsea: null,
      notes: "",
    },
    {
      id: "5",
      name: "Valhall",
      operator: "Aker BP",
      status: null,
      td: 1500,
      spud: null,
      logged: null,
      subsea: false,
      notes: "",
    },
    {
      id: "6",
      name: "Edvard Grieg",
      operator: "Equinor",
      status: "pa",
      td: 3900,
      spud: day(2026, 11, 2),
      logged: null,
      subsea: false,
      notes: "",
    },
  ]
  const source = querySourceOf(wells, columns, { locale: "en-US" })
  const suggest = (marked: string, language = en, withSource = true) => {
    const caret = marked.indexOf("|")
    const text = marked.replace("|", "")
    return suggestQuery(
      language,
      parseQuery(language, text, { now: NOW }),
      caret,
      {
        source: withSource ? source : undefined,
        now: NOW,
      }
    )
  }
  const brief = (item: QuerySuggestion) =>
    `${item.kind}:${item.text.trim()}${"count" in item && item.count !== undefined ? `=${item.count}` : ""}`

  it("offers every column between terms", () => {
    const result = suggest("status:drilling |")
    expect(result).toMatchObject({ context: "column", start: 16, end: 16 })
    expect(result.items.map((item) => item.text)).toEqual([
      "well:",
      "operator:",
      "status:",
      "tdm:",
      "spuddate:",
      "logged:",
      "subsea:",
    ])
    expect(result.items[0]).toMatchObject({
      kind: "column",
      column: "name",
      type: "text",
      caret: 5,
    })
  })

  it("offers the columns a key begins, and the closest one for a mistyped key", () => {
    const result = suggest("st|")
    expect(result.items.slice(0, 1).map(brief)).toEqual(["column:status:"])
    const key = suggest("sp|ud:2015")
    expect(key).toMatchObject({ context: "column", start: 0, end: 5 })
    expect(key.items.map(brief)).toEqual(["column:spuddate:"])
    const typo = suggest("stauts:dri|")
    expect(typo.context).toBe("column")
    expect(typo.items[0]).toMatchObject({ column: "status" })
  })

  it("counts an options column's values over the rest of the query", () => {
    expect(suggest("status:|").items.map(brief)).toEqual([
      "value:drilling=1",
      "value:producing=2",
      `value:"shut in"=1`,
      `value:"plugged & abandoned"=1`,
      "empty:none=1",
    ])
    expect(suggest("operator:equinor status:|").items.map(brief)).toEqual([
      "value:drilling=1",
      "value:producing=2",
      `value:"shut in"=0`,
      `value:"plugged & abandoned"=1`,
    ])
    // The search counts too, and the column's own filter does not.
    expect(suggest("status:drilling,| oseberg").items.map(brief)).toEqual([
      "value:producing=1",
      `value:"shut in"=0`,
      `value:"plugged & abandoned"=0`,
    ])
    const typed = suggest("status:sh|")
    expect(typed).toMatchObject({
      context: "value",
      column: "status",
      start: 7,
      end: 9,
    })
    expect(typed.items.map(brief)).toEqual([`value:"shut in"=1`])
    expect(typed.items[0]).toMatchObject({ text: `"shut in" `, caret: 10 })
  })

  it("offers yes and no with their rows, and No value", () => {
    expect(suggest("subsea:|").items.map(brief)).toEqual([
      "value:yes=2",
      "value:no=3",
      "empty:none=1",
    ])
    expect(suggest("subsea:n|").items.map(brief)).toEqual([
      "value:no=3",
      "empty:none=1",
    ])
  })

  it("offers a text column's values that contain what is typed, those it begins first", () => {
    expect(suggest("well:g|").items.map(brief)).toEqual([
      `value:"Gullfaks A-1"=1`,
      `value:"Gullfaks A-2"=1`,
      `value:"Edvard Grieg"=1`,
      `value:"Oseberg B-1"=1`,
    ])
    expect(suggest("well:iv|").items.map(brief)).toEqual([
      `value:"Ivar Aasen"=1`,
    ])
    expect(suggest("operator:|").items.map(brief)).toEqual([
      `value:Equinor=4`,
      `value:"Aker BP"=2`,
    ])
  })

  it("offers comparisons with the data's range, and No value, for a number column", () => {
    const result = suggest("tdm:|")
    expect(result.items.map(brief)).toEqual([
      "comparison:=",
      "comparison:>",
      "comparison:>=",
      "comparison:<",
      "comparison:<=",
      "comparison:..",
      "empty:none=1",
    ])
    expect(result.items[0]).toMatchObject({ min: 1500, max: 4100, caret: 1 })
    expect(result.items[1]).toMatchObject({ caret: 1 })
    expect(result.items[2]).toMatchObject({ caret: 2 })
    expect(result.items[5]).toMatchObject({ caret: 0 })
    expect(suggest("tdm:no|").items.map(brief)).toEqual(["empty:none=1"])
    expect(suggest("tdm:>=3|").items).toEqual([])
  })

  it("offers presets, the data's years and comparisons for a date column", () => {
    const result = suggest("spud:|")
    expect(result.items.map(brief)).toEqual([
      "preset:today=0",
      "preset:yesterday=0",
      "preset:last7d=0",
      "preset:last30d=2",
      "preset:last90d=2",
      "preset:thismonth=1",
      "preset:lastmonth=1",
      "preset:thisyear=2",
      "preset:lastyear=0",
      "year:2026=2",
      "year:2016=1",
      "year:2015=2",
      "comparison:<",
      "comparison:>",
      "comparison:..",
      "empty:none=1",
    ])
    expect(result.items[3]).toMatchObject({
      preset: "last30d",
      from: day(2026, 10, 14),
      to: day(2026, 11, 12),
    })
    expect(result.items[9]).toMatchObject({
      year: 2026,
      from: day(2026, 1, 1),
      to: day(2026, 12, 31),
    })
  })

  it("offers last<N> as days, weeks, months and years as it is typed", () => {
    const result = suggest("spud:last3|")
    expect(result.items.map(brief)).toEqual([
      "preset:last3d=0",
      "preset:last3w=1",
      "preset:last3m=2",
      "preset:last3y=2",
    ])
    expect(result.items[2]).toMatchObject({
      from: day(2026, 8, 13),
      to: day(2026, 11, 12),
    })
    expect(suggest("spud:last3w|").items.map(brief)).toEqual([
      "preset:last3w=1",
    ])
    expect(suggest("spud:la|").items.map((item) => item.text.trim())).toEqual([
      "last7d",
      "last30d",
      "last90d",
      "lastmonth",
      "lastyear",
    ])
  })

  it("offers a year's months from `2015` and `2015-`, and months by name", () => {
    expect(suggest("spud:2015|").items.map(brief)).toEqual([
      "year:2015=2",
      "month:2015-06=1",
      "month:2015-07=1",
    ])
    expect(suggest("spud:2015-|").items.map(brief)).toEqual([
      "month:2015-06=1",
      "month:2015-07=1",
    ])
    expect(suggest("spud:2015-07|").items.map(brief)).toEqual([
      "month:2015-07=1",
    ])
    expect(suggest("spud:20|").items.map(brief)).toEqual([
      "year:2026=2",
      "year:2016=1",
      "year:2015=2",
    ])
    expect(suggest("spud:jun|").items.map(brief)).toEqual(["month:2015-06=1"])
    const month = suggest("spud:2015-|").items[0]
    expect(month).toMatchObject({
      kind: "month",
      year: 2015,
      month: 5,
      from: day(2015, 6, 1),
      to: day(2015, 6, 30),
    })
  })

  it("offers a range's other end in place", () => {
    const result = suggest("spud:2015..20|")
    expect(result).toMatchObject({ start: 11, end: 13 })
    expect(result.items.map(brief)).toEqual([
      "year:2026=2",
      "year:2016=1",
      "year:2015=2",
    ])
    const op = suggest("spud:>=|")
    expect(op).toMatchObject({ start: 7, end: 7 })
    expect(
      op.items.some(
        (item) => item.kind === "comparison" || item.kind === "empty"
      )
    ).toBe(false)
  })

  it("offers columns and values across columns for a free word", () => {
    const result = suggest("aker|")
    expect(result).toMatchObject({ context: "word", start: 0, end: 4 })
    expect(result.items.map(brief)).toEqual([`value:operator:"Aker BP"=2`])
    expect(suggest("aa|").items.map(brief)).toEqual([
      `value:well:"Ivar Aasen"=1`,
    ])
    expect(suggest("pro|").items.map(brief)).toEqual([
      "value:status:producing=2",
    ])
    expect(suggest("op|").items.map(brief)).toEqual(["column:operator:"])
    // The rest of the query counts.
    expect(suggest("status:producing gull|").items.map(brief)).toEqual([
      `value:well:"Gullfaks A-2"=1`,
    ])
  })

  it("puts the caret after the space that follows a completed value", () => {
    const before = suggest("status:dri| td:>=1")
    expect(before.items[0]).toMatchObject({ text: "drilling", caret: 9 })
    const inList = suggest("status:dri|,pa")
    expect(inList.items[0]).toMatchObject({ text: "drilling", caret: 8 })
  })

  it("offers values without counts, but the options' own, with no rows to count", () => {
    expect(suggest("status:|", en, false).items.map(brief)).toEqual([
      "value:drilling",
      "value:producing",
      `value:"shut in"`,
      `value:"plugged & abandoned"`,
      "empty:none",
    ])
    expect(suggest("spud:2015-|", en, false).items).toHaveLength(12)
  })

  it("offers nothing in a keyword, a negated term or a phrase", () => {
    expect(suggest("OR|").items).toEqual([])
    expect(suggest("-stat|").items).toEqual([])
    expect(suggest(`"gull|`).items).toEqual([])
  })
})

describe("problemMessage: OR, NOT and a leading minus in words", () => {
  const t = createTranslator(
    "dataTableQuery",
    "en-US",
    undefined,
    queryEnglish.dataTableQuery
  )
  /** The message of the one problem in `text`, in a table of `of`'s columns (the wells' by default). */
  const message = (
    text: string,
    of: ColumnModel<Well> = model,
    sample: ColumnSample = () => ({})
  ) => {
    // Untyped, as the field reads it from the table's context.
    const columns = of as unknown as ColumnModel<unknown>
    const language = getQueryLanguage(columns, "en-US")
    return problemMessage(problem(text, language), language, columns, t, sample)
  }
  const OR = "OR isn't supported. Rows must match every term."
  const MINUS =
    "Excluding isn't supported, so this term is ignored. To search for the text itself, put it in quotes."
  const KEEP = "To narrow the rows, filter for the values to keep instead:"

  it("shows how to write either value with the table's first options column", () => {
    expect(message("drilling OR producing")).toBe(
      `${OR} To match one of several values of a column, list them with commas: status:drilling,producing`
    )
    expect(message("-gullfaks")).toBe(
      `${MINUS} ${KEEP} status:drilling,producing`
    )
    expect(message("NOT gullfaks")).toBe(
      `${MINUS} ${KEEP} status:drilling,producing`
    )
  })

  it("has no list to offer without an options column, and keeps rows with another column, from the data", () => {
    const wells = getColumnModel(
      createColumns<Well>([
        { id: "name", header: "Well" },
        { id: "td", header: "TD", type: "number" },
        { id: "spud", header: "Spud date", type: "date" },
      ])
    )
    expect(message("a OR b", wells)).toBe(
      `${OR.slice(0, -1)}, so search for one thing at a time.`
    )
    // A number before a date or a text; the data's middle when it has one.
    expect(message("-a", wells)).toBe(`${MINUS} ${KEEP} td:>=100`)
    expect(
      message("-a", wells, (column) =>
        column.type === "number" ? { number: 3000 } : {}
      )
    ).toBe(`${MINUS} ${KEEP} td:>=3000`)
    const flags = getColumnModel(
      createColumns<Well>([
        { id: "td", header: "TD", type: "number" },
        { id: "subsea", header: "Subsea", type: "boolean" },
      ])
    )
    expect(message("NOT a", flags)).toBe(`${MINUS} ${KEEP} subsea:yes`)
  })

  it("says only what happened when no column can be filtered", () => {
    const none = getColumnModel(
      createColumns<Well>([{ id: "name", header: "Well", filterable: false }])
    )
    expect(message("a OR b", none)).toBe(
      `${OR.slice(0, -1)}, so search for one thing at a time.`
    )
    expect(message("-a", none)).toBe(MINUS)
    expect(message("NOT a", none)).toBe(MINUS)
  })
})
