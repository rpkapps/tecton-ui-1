/**
 * What `DataTableSearch syntax="query"` says about a query, in words: a
 * problem's message from its code and parameters, the field's summary for
 * screen readers, what a date term was understood as, the suggestions in
 * groups, the list's line when it has none, and the help's examples, made
 * from the table's own columns.
 * Loaded with the query field (`lazy.ts`, the `query` feature).
 */
import type { Translator } from "../i18n/translations"
import type { ColumnModel, EngineColumn } from "./engine/columns"
import type { Formatter } from "./engine/format"
import type {
  ParsedQuery,
  QueryColumn,
  QueryDiagnostic,
  QueryDiagnosticCode,
  QueryFilterTerm,
  QueryLanguage,
  QuerySuggestion,
  QuerySuggestions,
  QueryTerm,
} from "./engine/query/index"
import { formatDay, RELATIVE, toDay } from "./engine/query/dates"
import { plainSearch } from "./engine/query/serialize"
import { EMPTY_WORDS, quote, valueToken } from "./engine/query/syntax"
import type { DataTableColumnType, DataTableFilterValue } from "./engine/types"
import { filterText } from "./filter-text"

type QueryT = Translator<"dataTableQuery">
type TableT = Translator<"dataTable">

/**
 * Values of a column's data to write examples with: its numbers and years,
 * its most frequent text.
 */
type ColumnSample = (column: QueryColumn) => {
  text?: string
  number?: number
  year?: number
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

/** A key of the query's strings. */
type QueryKey = Parameters<QueryT>[0]

/** The keys of the problems' messages: a code, with what tells its messages apart. */
type ProblemKey = Extract<
  QueryKey,
  | `${QueryDiagnosticCode}${string}`
  | `ambiguous${string}`
  | `duplicate${string}`
  | `unsupported${string}`
>

/** `word` with a capital first letter, as the keys join words. */
const capital = <TWord extends string>(word: TWord) =>
  (word.charAt(0).toUpperCase() + word.slice(1)) as Capitalize<TWord>

/**
 * A problem in words, from its code and parameters: the message's key is
 * the code, then what tells its messages apart (a reason, the suggestion
 * of a typo, the operator and whether the table has an example for it).
 */
function problemMessage(
  diagnostic: QueryDiagnostic,
  language: QueryLanguage,
  model: ColumnModel<unknown>,
  t: QueryT,
  sample: ColumnSample = () => ({})
): string {
  const { code, params } = diagnostic
  const column = language.byId.get(params.column ?? "")
  // What the user may have meant: a column's key, an option's token.
  const suggestion =
    params.suggestion === undefined
      ? undefined
      : code === "unknownColumn"
        ? language.byId.get(params.suggestion)?.key
        : column && language.valueToken(column, params.suggestion)
  // `OR`, `NOT` and `-`: what to type instead, with the table's own terms
  // (a leading minus and NOT leave their term out alike).
  const or = params.operator === "OR"
  const examples =
    code === "unsupportedOperator" ? operatorExamples(language, sample) : {}
  const example = or ? examples.list : examples.keep
  const key =
    code === "ambiguousDate"
      ? `ambiguous${capital(params.reason ?? "noYear")}`
      : code === "duplicateColumn"
        ? `duplicate${capital(params.reason ?? "notCombinable")}`
        : code === "unsupportedOperator"
          ? `unsupported${or ? "Or" : "Minus"}${example ? "" : or ? "NoList" : "NoFilter"}`
          : suggestion
            ? `${code}Suggestion`
            : code
  return t(key as ProblemKey, {
    key: params.key ?? "",
    column:
      column?.header ??
      (params.column === undefined
        ? ""
        : (model.byId.get(params.column)?.header ?? params.column)),
    value: params.value ?? "",
    from: params.from ?? "",
    to: params.to ?? "",
    suggestion: suggestion ?? "",
    example: example ?? "",
  })
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
 * the caret (one without a problem shown): the text searched for
 * ("Searching all columns for “pump”", once typing has `settled`; a
 * space until then, so the line keeps its height), what a filter term
 * applies in its chip's words, or that there is nothing to suggest.
 */
function statusOf(
  term: QueryTerm | undefined,
  settled: boolean,
  model: ColumnModel<unknown>,
  formatter: Formatter<unknown>,
  t: QueryT,
  td: TableT
) {
  if (term?.kind === "text" && term.text)
    return settled ? t("statusSearching", { text: term.text }) : "\u00a0"
  if (term?.kind === "filter") {
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
    }

type SuggestionGroup = {
  readonly value: string
  readonly label: string
  /** Beside the label: the data's range of a comparison group. */
  readonly hint?: string
  readonly items: ReadonlyArray<SuggestionRow>
}

/** The presets' names, and a relative one's by its unit. */
const PRESET_KEYS: Partial<
  Record<
    string,
    `preset${"Today" | "Yesterday" | `${"This" | "Last"}${"Month" | "Year"}`}`
  >
> = {
  today: "presetToday",
  yesterday: "presetYesterday",
  thismonth: "presetThisMonth",
  lastmonth: "presetLastMonth",
  thisyear: "presetThisYear",
  lastyear: "presetLastYear",
}
const UNIT_KEYS = {
  d: "presetLastDays",
  w: "presetLastWeeks",
  m: "presetLastMonths",
  y: "presetLastYears",
} as const

/** A preset's name in words: "Last 30 days". */
function presetLabel(name: string, t: QueryT) {
  const relative = RELATIVE.exec(name)
  if (relative)
    return t(UNIT_KEYS[relative[2] as keyof typeof UNIT_KEYS], {
      count: Number(relative[1]),
    })
  const key = PRESET_KEYS[name]
  return key ? t(key) : name
}

/** The comparisons' names (a date's `<` and `>` are before and after). */
const COMPARISON_KEYS = {
  "=": "equalTo",
  ">": "moreThan",
  ">=": "atLeast",
  "<": "lessThan",
  "<=": "atMost",
  "..": "between",
} as const

/** A comparison's name, by the column's type. */
function comparisonLabel(
  operator: keyof typeof COMPARISON_KEYS,
  type: DataTableColumnType,
  t: QueryT
) {
  return t(
    type !== "date" || operator === ".."
      ? COMPARISON_KEYS[operator]
      : operator.startsWith("<")
        ? "before"
        : "after"
  )
}

const typeLabel = (type: DataTableColumnType, t: QueryT) =>
  t(`type${capital(type)}`)

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

/** The groups, ordered by where they go: the calendar, the values, then comparisons. */
const GROUPS = [
  "calendar",
  "columns",
  "matching",
  "values",
  "presets",
  "years",
  "months",
  "compare",
] as const

/**
 * The suggestions in their groups (`QuerySuggestion.group`), with the
 * calendar's row for a date value; the comparisons with the data's range.
 */
function groupSuggestions(
  suggestions: QuerySuggestions,
  language: QueryLanguage,
  formatter: Formatter<unknown>,
  calendar: "range" | "single" | null,
  t: QueryT,
  td: TableT
): Array<SuggestionGroup> {
  const rows = new Map<string, Array<SuggestionRow>>()
  const column = language.byId.get(suggestions.column ?? "")
  const add = (group: string, row: SuggestionRow) => {
    let items = rows.get(group)
    if (!items) rows.set(group, (items = []))
    items.push(row)
  }
  if (calendar)
    add("calendar", {
      kind: "calendar",
      id: "calendar",
      label: t(calendar === "single" ? "pickDay" : "pickDates"),
    })
  suggestions.items.forEach((suggestion, index) =>
    add(suggestion.group, {
      kind: "suggestion",
      id: `${suggestion.kind}:${index}:${suggestion.text}`,
      label: suggestionLabel(suggestion, language, formatter, t, td),
      suggestion,
    })
  )
  // The comparisons' hint: the data's range, as the column shows it.
  const range = suggestions.items.find(
    (item): item is Extract<QuerySuggestion, { kind: "comparison" }> =>
      item.kind === "comparison" && item.min !== undefined
  )
  const show = (n: number) =>
    formatter.format(column!.column, column!.type === "date" ? new Date(n) : n)
  return GROUPS.flatMap((value) => {
    const items = rows.get(value)
    if (!items) return []
    return [
      {
        value,
        label:
          value === "calendar"
            ? ""
            : value === "values"
              ? (column?.header ?? "")
              : t(`${value}Group`),
        hint:
          value === "compare" && range?.min !== undefined && column
            ? t("dataRange", {
                min: show(range.min),
                max: show(range.max ?? range.min),
              })
            : undefined,
        items,
      },
    ]
  })
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
      finds: t(`finds${capital(column.type)}`, { column: column.header }),
    })
  }
  // Quoted when the data's text would read otherwise (`-5`, `OR`, `a:b`).
  const plain = words?.trim().split(/\s+/)[0]
  if (plain) {
    examples.unshift({
      query: plainSearch(plain) ? plain : quote(plain),
      finds: t("findsWords"),
    })
    if (/\s/.test(words!.trim()))
      examples.splice(1, 0, { query: quote(words!), finds: t("findsPhrase") })
  }
  const first = language.columns.find((column) => column.key !== null)
  if (first)
    examples.push({
      query: `${first.key}:${EMPTY_WORDS[0]}`,
      finds: t("findsNoValue", { column: first.header }),
    })
  return examples
}

export {
  dayText,
  groupSuggestions,
  helpExamples,
  problemMessage,
  statusOf,
  summaryOf,
  termAt,
  typeLabel,
  understood,
}
export type { ColumnSample, HelpExample, SuggestionGroup, SuggestionRow }
