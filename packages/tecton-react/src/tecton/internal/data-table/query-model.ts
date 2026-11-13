/**
 * What `DataTableSearch syntax="query"` says about a query, in words: a
 * problem's message from its code and parameters, the field's summary for
 * screen readers, what a date term was understood as, the suggestions in
 * groups, the list's line when it has none, and the help's examples, made from the table's own columns.
 * Loaded with the query field (`lazy.ts`, the `query` feature).
 */
import type { Translator } from "../i18n/translations"
import type { ColumnModel, EngineColumn } from "./engine/columns"
import type { Formatter } from "./engine/format"
import type {
  ParsedQuery,
  QueryColumn,
  QueryDiagnostic,
  QueryFilterTerm,
  QueryLanguage,
  QuerySuggestion,
  QuerySuggestions,
  QueryTerm,
} from "./engine/query/index"
import { formatDay, toDay } from "./engine/query/dates"
import { itemsOf, valueToken } from "./engine/query/syntax"
import type { DataTableColumnType, DataTableFilterValue } from "./engine/types"
import { filterText } from "./filter-text"

type QueryT = Translator<"dataTableQuery">
type TableT = Translator<"dataTable">

/** Values of a column's data to write examples with: its numbers and years, its most frequent text. */
type ColumnSample = (column: QueryColumn) => {
  text?: string
  number?: number
  year?: number
}

/** The name of column `id` (a filterable one, or any column of `model`). */
function headerOf(
  language: QueryLanguage,
  model: ColumnModel<unknown>,
  id: string | undefined
) {
  if (id === undefined) return ""
  return language.byId.get(id)?.header ?? model.byId.get(id)?.header ?? id
}

/** The column types a "values to keep" example is written with, best first. */
const KEEP_ORDER = ["options", "boolean", "number", "date", "text"] as const

/**
 * Terms of the table's own for the messages of `OR`, `NOT` and `-`, as the
 * user would type them: `list` one of several values of a column (the first
 * options column with two values: `status:drilling,producing`), `keep` the
 * rows to keep (that term, else the example of the first column of the
 * first type in `KEEP_ORDER`). Each is `undefined` when no column gives
 * one. Only the chosen column is sampled.
 */
function operatorExamples(
  language: QueryLanguage,
  sample: ColumnSample
): { list?: string; keep?: string } {
  const keyed = language.columns.filter((column) => column.key !== null)
  const listed = keyed.find(
    (column) => column.type === "options" && column.column.options.length > 1
  )
  const list = listed && columnExample(listed, language, {})
  if (list !== undefined) return { list, keep: list }
  for (const type of KEEP_ORDER) {
    for (const column of keyed) {
      if (column.type !== type) continue
      const keep = columnExample(column, language, sample(column))
      if (keep !== undefined) return { keep }
    }
  }
  return {}
}

/** A problem in words, from its code and parameters. */
function problemMessage(
  diagnostic: QueryDiagnostic,
  language: QueryLanguage,
  model: ColumnModel<unknown>,
  t: QueryT,
  sample: ColumnSample = () => ({})
): string {
  const { params } = diagnostic
  const column = headerOf(language, model, params.column)
  const value = params.value ?? ""
  switch (diagnostic.code) {
    case "unknownColumn": {
      const key = params.key ?? ""
      const suggested = params.suggestion
        ? language.byId.get(params.suggestion)?.key
        : undefined
      return suggested
        ? t("unknownColumnSuggestion", { key, suggestion: suggested })
        : t("unknownColumn", { key })
    }
    case "columnNotFilterable":
      return t("columnNotFilterable", { column })
    case "unknownValue": {
      const queryColumn = params.column
        ? language.byId.get(params.column)
        : undefined
      const suggested =
        params.suggestion !== undefined && queryColumn
          ? language.valueToken(queryColumn, params.suggestion)
          : undefined
      return suggested
        ? t("unknownValueSuggestion", { column, value, suggestion: suggested })
        : t("unknownValue", { column, value })
    }
    case "notANumber":
      return t("notANumber", { value })
    case "badDate":
      return t("badDate", { value })
    case "ambiguousDate":
      return params.reason === "twoDigitYear"
        ? t("ambiguousTwoDigitYear", { value })
        : params.reason === "month"
          ? t("ambiguousMonth", { value })
          : t("ambiguousNoYear", { value })
    case "backwardsRange":
      return t("backwardsRange", {
        from: params.from ?? "",
        to: params.to ?? "",
      })
    case "unsupportedOperator": {
      // What happened, and what to type instead, with the table's own terms.
      const { list, keep } = operatorExamples(language, sample)
      if (params.operator === "OR")
        return list === undefined
          ? t("unsupportedOrNoList")
          : t("unsupportedOr", { example: list })
      // A leading minus or NOT: the term is left out alike.
      return keep === undefined
        ? t("unsupportedMinusNoFilter")
        : t("unsupportedMinus", { example: keep })
    }
    case "exclusiveComparison":
      return t("exclusiveComparison")
    case "notComparable":
      return t("notComparable", { column })
    case "duplicateColumn":
      return params.reason === "noMatch"
        ? t("duplicateNoMatch", { column })
        : t("duplicateNotCombinable", { column })
  }
}

/** A filter as its chip reads: "Status: Producing, Drilling". */
function filterWords(
  column: EngineColumn<unknown>,
  value: DataTableFilterValue,
  formatter: Formatter<unknown>,
  td: TableT
) {
  const text = filterText(column, value, formatter, td)
  return text === null
    ? null
    : td("filterChip", { columnName: column.header, value: text })
}

/**
 * What the field holds, for screen readers: its filters as their chips read,
 * its search and its problems.
 */
function summaryOf(
  parsed: ParsedQuery,
  messages: ReadonlyArray<string>,
  model: ColumnModel<unknown>,
  formatter: Formatter<unknown>,
  t: QueryT,
  td: TableT
) {
  const filters = Object.entries(parsed.filters).flatMap(([id, value]) => {
    const column = model.byId.get(id)
    const words = column && filterWords(column, value, formatter, td)
    return words ? [words] : []
  })
  const parts = [
    filters.length
      ? t("summaryFilters", {
          filters: new Intl.ListFormat(formatter.locale, {
            type: "unit",
          }).format(filters),
        })
      : t("summaryNoFilters"),
  ]
  if (parsed.search) parts.push(t("summarySearch", { search: parsed.search }))
  if (messages.length)
    parts.push(
      t("summaryProblems", {
        count: messages.length,
        problems: messages.join(" "),
      })
    )
  return parts.join(" ")
}

/** The term the caret is in (at its end counts), if any. */
function termAt(parsed: ParsedQuery, caret: number) {
  return parsed.terms.find((term) => caret >= term.start && caret <= term.end)
}

/**
 * What a filter term alone filters, in its chip's words ("Status:
 * Drilling"); `null` for one that filters nothing yet.
 */
function termWords(
  term: QueryFilterTerm,
  model: ColumnModel<unknown>,
  formatter: Formatter<unknown>,
  td: TableT
) {
  if (!term.column || !term.value) return null
  const column = model.byId.get(term.column)
  return column ? filterWords(column, term.value, formatter, td) : null
}

/**
 * What a date term alone was understood as, in its chip's words ("Spud
 * date: Jun 1, 2015–Jun 30, 2015"); `null` for another term, or one that
 * filters nothing yet.
 */
function understood(
  term: QueryFilterTerm,
  language: QueryLanguage,
  model: ColumnModel<unknown>,
  formatter: Formatter<unknown>,
  td: TableT
) {
  if (!term.column || !term.value) return null
  if (language.byId.get(term.column)?.type !== "date") return null
  return termWords(term, model, formatter, td)
}

/**
 * The list's line when it has no suggestion to offer, about the term at
 * the caret: the text searched for ("Searching all columns for “pump”"),
 * what a filter term applies in its chip's words, or that there is nothing
 * to suggest (for a term with a problem, whose message is atop the list).
 */
function statusOf(
  term: QueryTerm | undefined,
  problem: boolean,
  model: ColumnModel<unknown>,
  formatter: Formatter<unknown>,
  t: QueryT,
  td: TableT
) {
  if (!problem && term?.kind === "text" && term.text)
    return t("statusSearching", { text: term.text })
  if (!problem && term?.kind === "filter") {
    const words = termWords(term, model, formatter, td)
    if (words) return words
  }
  return t("noSuggestions")
}

/** A row of the suggestions: an offer of the engine, or the calendar's. */
type SuggestionRow =
  | {
      readonly kind: "suggestion"
      readonly id: string
      readonly label: string
      readonly suggestion: QuerySuggestion
    }
  | {
      readonly kind: "calendar"
      readonly id: string
      readonly label: string
      readonly single: boolean
    }

type SuggestionGroup = {
  readonly value: string
  readonly label: string
  /** Beside the label: the data's range of a comparison group. */
  readonly hint?: string
  readonly items: ReadonlyArray<SuggestionRow>
}

/** A preset's name in words: "Last 30 days". */
function presetLabel(name: string, t: QueryT) {
  const relative = /^last(\d+)([dwmy])$/.exec(name)
  if (relative) {
    const count = Number(relative[1])
    const key = (
      {
        d: "presetLastDays",
        w: "presetLastWeeks",
        m: "presetLastMonths",
        y: "presetLastYears",
      } as const
    )[relative[2] as "d" | "w" | "m" | "y"]
    return t(key, { count })
  }
  switch (name) {
    case "today":
      return t("presetToday")
    case "yesterday":
      return t("presetYesterday")
    case "thismonth":
      return t("presetThisMonth")
    case "lastmonth":
      return t("presetLastMonth")
    case "thisyear":
      return t("presetThisYear")
    case "lastyear":
      return t("presetLastYear")
  }
  return name
}

/** A comparison's name, by the column's type. */
function comparisonLabel(
  operator: string,
  type: DataTableColumnType,
  t: QueryT
) {
  if (operator === "..") return t("between")
  if (type === "date")
    return operator.startsWith("<") ? t("before") : t("after")
  switch (operator) {
    case "=":
      return t("equalTo")
    case ">":
      return t("moreThan")
    case ">=":
      return t("atLeast")
    case "<":
      return t("lessThan")
    default:
      return t("atMost")
  }
}

const TYPE_KEYS = {
  text: "typeText",
  number: "typeNumber",
  date: "typeDate",
  boolean: "typeBoolean",
  options: "typeOptions",
} as const

function typeLabel(type: DataTableColumnType, t: QueryT) {
  return t(TYPE_KEYS[type])
}

/** An offer's name, for the list's text value and screen readers. */
function suggestionLabel(
  suggestion: QuerySuggestion,
  language: QueryLanguage,
  formatter: Formatter<unknown>,
  t: QueryT,
  td: TableT
): string {
  const column = language.byId.get(suggestion.column)
  switch (suggestion.kind) {
    case "column":
      return column?.header ?? suggestion.key
    case "value": {
      if (typeof suggestion.value === "boolean")
        return suggestion.value ? td("yes") : td("no")
      if (column?.type === "options")
        return (
          column.column.options.find(
            (option) => option.value === suggestion.value
          )?.label ?? String(suggestion.value)
        )
      return String(suggestion.value)
    }
    case "empty":
      return td("noValue")
    case "comparison":
      return comparisonLabel(suggestion.operator, column?.type ?? "number", t)
    case "preset":
      return presetLabel(suggestion.preset, t)
    case "year":
      return String(suggestion.year)
    case "month":
      return new Intl.DateTimeFormat(formatter.locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(Date.UTC(suggestion.year, suggestion.month, 1))
  }
}

/** The suggestions in their groups, with the calendar's row for a date value. */
function groupSuggestions(
  suggestions: QuerySuggestions,
  language: QueryLanguage,
  formatter: Formatter<unknown>,
  calendar: "range" | "single" | null,
  t: QueryT,
  td: TableT
): Array<SuggestionGroup> {
  const groups = new Map<
    string,
    { label: string; hint?: string; items: Array<SuggestionRow> }
  >()
  const column =
    suggestions.column === undefined
      ? undefined
      : language.byId.get(suggestions.column)
  const add = (value: string, label: string, row: SuggestionRow) => {
    let group = groups.get(value)
    if (!group) groups.set(value, (group = { label, items: [] }))
    group.items.push(row)
  }
  if (calendar)
    add("calendar", "", {
      kind: "calendar",
      id: "calendar",
      label: calendar === "single" ? t("pickDay") : t("pickDates"),
      single: calendar === "single",
    })
  for (const [index, suggestion] of suggestions.items.entries()) {
    const row: SuggestionRow = {
      kind: "suggestion",
      id: `${suggestion.kind}:${index}:${suggestion.text}`,
      label: suggestionLabel(suggestion, language, formatter, t, td),
      suggestion,
    }
    const ordered = column?.type === "number" || column?.type === "date"
    switch (suggestion.kind) {
      case "column":
        add("columns", t("columnsGroup"), row)
        break
      case "value":
        if (suggestions.context === "word")
          add("matching", t("matchingGroup"), row)
        else add("values", column?.header ?? "", row)
        break
      case "empty":
        if (ordered) add("compare", t("compareGroup"), row)
        else add("values", column?.header ?? "", row)
        break
      case "comparison":
        add("compare", t("compareGroup"), row)
        break
      case "preset":
        add("presets", t("presetsGroup"), row)
        break
      case "year":
        add("years", t("yearsGroup"), row)
        break
      case "month":
        add("months", t("monthsGroup"), row)
        break
    }
  }
  // The comparisons' hint: the data's range, as the column shows it.
  const compare = groups.get("compare")
  const range = suggestions.items.find(
    (item): item is Extract<QuerySuggestion, { kind: "comparison" }> =>
      item.kind === "comparison" && item.min !== undefined
  )
  if (compare && range && column && range.min !== undefined) {
    const show = (n: number) =>
      column.type === "date"
        ? formatter.format(column.column, new Date(n))
        : formatter.format(column.column, n)
    compare.hint = t("dataRange", {
      min: show(range.min),
      max: show(range.max ?? range.min),
    })
  }
  // Ordered by where they go: the calendar, the values, then comparisons.
  const order = [
    "calendar",
    "columns",
    "matching",
    "values",
    "presets",
    "years",
    "months",
    "compare",
  ]
  return order.flatMap((value) => {
    const group = groups.get(value)
    return group ? [{ value, ...group }] : []
  })
}

/** The comma-separated part of a filter term's value the caret is in. */
function valueItemAt(text: string, term: QueryFilterTerm, caret: number) {
  const items = itemsOf(text, term.valueStart, term.end)
  return (
    items.find((item) => caret >= item.start && caret <= item.end) ??
    items[items.length - 1]
  )
}

/** A calendar day (a local `Date` at midnight) as the query writes it. */
const dayText = (date: Date) =>
  formatDay(toDay(date.getFullYear(), date.getMonth(), date.getDate()))

/** A help example: a query, and what it finds. */
type HelpExample = { readonly query: string; readonly finds: string }

/**
 * A column's example term, written with its key and a value it has: two of
 * its options (`status:drilling,producing`), yes, the data's most frequent
 * text, a number in the middle of its range, its latest year (`data`, else
 * a value of the column's name, `>=100` and this year).
 */
function columnExample(
  column: QueryColumn,
  language: QueryLanguage,
  data: ReturnType<ColumnSample>
): string | undefined {
  if (column.key === null) return undefined
  const key = `${column.key}:`
  switch (column.type) {
    case "options": {
      const tokens = column.column.options
        .slice(0, 2)
        .map((option) => language.valueToken(column, option.value))
      return tokens.length ? key + tokens.join(",") : undefined
    }
    case "boolean":
      return key + language.valueToken(column, true)
    case "text":
      return key + valueToken(textSample(column, data))
    case "number":
      return `${key}>=${data.number ?? 100}`
    case "date":
      return `${key}${data.year ?? new Date().getFullYear()}`
  }
}

/** The text a text column's example searches for. */
function textSample(column: QueryColumn, data: ReturnType<ColumnSample>) {
  return data.text ?? column.header.split(/\s+/)[0].toLowerCase()
}

const FINDS_KEYS = {
  options: "findsOptions",
  boolean: "findsBoolean",
  text: "findsText",
  number: "findsNumber",
  date: "findsDate",
} as const

/**
 * The help's examples, from the table's filterable columns (`language`): one
 * per column (`columnExample`), then free text and "No value".
 */
function helpExamples(
  language: QueryLanguage,
  sample: ColumnSample,
  t: QueryT
): Array<HelpExample> {
  const examples: Array<HelpExample> = []
  let words: string | undefined
  for (const column of language.columns) {
    if (column.key === null) continue
    const data = sample(column)
    const query = columnExample(column, language, data)
    if (query === undefined) continue
    if (column.type === "text") words ??= textSample(column, data)
    examples.push({
      query,
      finds: t(FINDS_KEYS[column.type], { column: column.header }),
    })
  }
  if (words !== undefined) {
    const plain = words.split(/\s+/)[0]
    examples.unshift({ query: plain, finds: t("findsWords") })
    if (/\s/.test(words))
      examples.splice(1, 0, { query: `"${words}"`, finds: t("findsPhrase") })
  }
  const first = language.columns.find((column) => column.key !== null)
  if (first)
    examples.push({
      query: `${first.key}:none`,
      finds: t("findsNoValue", { column: first.header }),
    })
  return examples
}

export {
  dayText,
  groupSuggestions,
  helpExamples,
  headerOf,
  problemMessage,
  statusOf,
  summaryOf,
  termAt,
  typeLabel,
  understood,
  valueItemAt,
}
export type { ColumnSample, HelpExample, SuggestionGroup, SuggestionRow }
