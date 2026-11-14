/**
 * The query a view's filters and search read as (`serializeQuery`), and the
 * view a query makes (`applyQuery`).
 *
 * The query is canonical: the filters in column order, each by the
 * column's key (`language.ts`), then the search. `parseQuery` reads it back
 * as the same filters and search (`sameFilters`, and the search as it is,
 * or `""` for one of spaces only). A filter's list is its items in order,
 * separated by commas:
 *
 * - text: `name:a-12,b-3`, each quoted when it has to be (`name:"a, b"`);
 * - options: the options by label in lower case, when that names them, else
 *   by value, in the filter's order: `status:drilling,"shut in"`;
 * - yes / no: the boolean filter's labels (`yes`), else `yes` / `no`;
 * - number: `td:3000`, `td:>=3000`, `td:<=3000`, `td:1000..3000`, and with
 *   an exclusive bound `td:>3000`, `td:<3000` (`td:<1000,>3000`); a lone
 *   range with both ends and an exclusive one is written as its two ends,
 *   `td:>1000 td:<=3000` (read back as one filter);
 * - date: whole years, months or days as such (`spud:2015`,
 *   `spud:2015-06..2015-08`, `spud:2015-06-30`), else `from..to`, `>=from`,
 *   `<=to` by day (`spud:>=2015-07-01`); an end that is not a day's start
 *   in the column's time zone as an instant (`2015-06-30T10:30:00.000Z`).
 *   A relative preset the previous query wrote (`previous`) is kept while
 *   the filter is still that preset's days: `spud:last30d`, not its dates;
 * - "No value": `none` after the rest (`td:>=3000,none`), alone without it.
 *
 * What the query cannot say is left out: a custom filter value, a filter of
 * another type than its column's, a column no key names, and a number range
 * with both ends and an exclusive one beside other ranges (its two ends
 * would be two terms, which keep the rows both match). `applyQuery` keeps
 * those in the view, but for a column the query filters.
 */
import type {
  DataTableDateRange,
  DataTableFilterValue,
  DataTableNumberRange,
  DataTableView,
} from "../types"
import { sameFilters, sameFilterValue } from "../view"
import { boundText, daysInMonth, formatDay, partsOf } from "./dates"
import type { QueryColumn, QueryLanguage } from "./language"
import { formatNumber, joinsNumber } from "./numbers"
import { parseQuery } from "./parse"
import { EMPTY_WORDS, isQuote, KEYWORDS, quote, valueToken } from "./syntax"
import type { ParsedQuery, QueryView } from "./types"

type SerializeOptions = {
  /** The moment relative dates are from; now by default. */
  now?: Date
  /** The query the field held before the view changed: its presets are kept. */
  previous?: ParsedQuery
}

/** A number range one item cannot write: both ends, one of them exclusive. */
const twoTerms = (range: DataTableNumberRange) =>
  range.min !== undefined &&
  range.max !== undefined &&
  (range.minExclusive === true || range.maxExclusive === true)

/** Whether the query can say `value` as the filter of column `id`. */
function canSay(
  language: QueryLanguage,
  id: string,
  value: DataTableFilterValue
) {
  const column = language.byId.get(id)
  return (
    column !== undefined &&
    column.key !== null &&
    value.type === column.type &&
    !(
      value.type === "number" &&
      value.ranges.length > 1 &&
      value.ranges.some(twoTerms)
    )
  )
}

/** A date range as the query writes it; `null` for one without an end. */
function dateRange(
  column: QueryColumn,
  { from, to }: DataTableDateRange
): string | null {
  const zone = column.timeZone
  const end = (date: Date) => boundText(date, zone)
  if (from && to) {
    const a = end(from)
    const b = end(to)
    if (!a.midnight || !b.midnight)
      return from.getTime() === to.getTime() ? a.text : `${a.text}..${b.text}`
    const first = partsOf(a.day)
    const last = partsOf(b.day)
    const unit =
      first.month === 0 &&
      first.day === 1 &&
      last.month === 11 &&
      last.day === 31
        ? "year"
        : first.day === 1 && last.day === daysInMonth(last.year, last.month)
          ? "month"
          : "day"
    const low = formatDay(a.day, unit)
    const high = formatDay(b.day, unit)
    return low === high ? low : `${low}..${high}`
  }
  if (from) return `>=${end(from).text}`
  if (to) return `<=${end(to).text}`
  return null
}

/**
 * A number range as the query writes it: `null` for one without a bound,
 * or its two ends (`twoTerms`) for a range with both and an exclusive one.
 */
function numberRange(
  language: QueryLanguage,
  range: DataTableNumberRange
): string | { low: string; high: string } | null {
  const n = (v: number) => formatNumber(v, language.numbers)
  const { min, max, minExclusive, maxExclusive } = range
  const low = min === undefined ? null : `${minExclusive ? ">" : ">="}${n(min)}`
  const high =
    max === undefined ? null : `${maxExclusive ? "<" : "<="}${n(max)}`
  if (low && high && (minExclusive || maxExclusive)) return { low, high }
  if (min !== undefined && max !== undefined)
    return min === max ? n(min) : `${n(min)}..${n(max)}`
  return low ?? high
}

/** Items joined by commas; `null` for none. */
const listOf = (items: ReadonlyArray<string | null>) => {
  const written = items.filter((item): item is string => item !== null)
  return written.length ? written.join(",") : null
}

/** A filter's value as the query writes it, after its key and colon. */
function filterValue(
  language: QueryLanguage,
  column: QueryColumn,
  value: Exclude<DataTableFilterValue, { type: "custom" }>
): string {
  const none = value.empty ? EMPTY_WORDS[0] : null
  let text: string | null
  switch (value.type) {
    case "text":
      text = listOf(value.values.map(valueToken))
      break
    case "options":
    case "boolean":
      text = listOf(
        value.values.map((v: string | boolean) =>
          language.valueToken(column, v)
        )
      )
      break
    case "number": {
      const ranges = value.ranges.map((range) => numberRange(language, range))
      const [only] = ranges
      if (ranges.length === 1 && only !== null && typeof only === "object")
        // Two terms on the column, the second after its key again; "No
        // value" in both, as two terms keep it only when both have it.
        return [only.low, `${column.key}:${only.high}`]
          .map((term) => listOf([term, none]))
          .join(" ")
      const written: Array<string> = []
      for (const range of ranges) {
        if (typeof range !== "string") continue
        // A comma the locale writes in numbers would join this range to
        // the one before (`3,5` in German): its first number is quoted.
        const previous = written.at(-1)
        written.push(
          previous !== undefined &&
            joinsNumber(previous, range, language.numbers)
            ? range.replace(/^(?:(?!\.\.).)+/, (first) => quote(first))
            : range
        )
      }
      text = listOf(written)
      break
    }
    case "date":
      text = listOf(value.ranges.map((range) => dateRange(column, range)))
  }
  return listOf([text, none]) ?? ""
}

/**
 * The previous query's text for column `id`'s filter, when it holds a
 * relative date preset that still makes `value` (read again at `now`).
 */
function keptPreset(
  language: QueryLanguage,
  previous: ParsedQuery | undefined,
  column: QueryColumn,
  value: DataTableFilterValue,
  now: Date | undefined
) {
  if (!previous || column.type !== "date") return undefined
  for (const term of previous.terms) {
    if (term.kind !== "filter" || term.column !== column.id || !term.applied)
      continue
    if (
      !previous.spans.some(
        (span) =>
          span.kind === "preset" &&
          span.start >= term.valueStart &&
          span.end <= term.end
      )
    )
      continue
    const written = `${column.key}:${previous.text.slice(term.valueStart, term.end).trim()}`
    const read = parseQuery(language, written, { now }).filters[column.id] as
      DataTableFilterValue | undefined
    if (read && sameFilterValue(read, value)) return written
  }
  return undefined
}

/** Whether search words written as they are read back as `search`. */
function plainSearch(search: string) {
  return search
    .split(" ")
    .every(
      (word) =>
        word !== "" &&
        !/[\s:\\]/.test(word) &&
        ![...word].some(isQuote) &&
        !word.startsWith("-") &&
        !KEYWORDS.has(word)
    )
}

/** The canonical query of `view`'s filters and search (see the module comment). */
function serializeQuery(
  language: QueryLanguage,
  view: QueryView,
  { now, previous }: SerializeOptions = {}
): string {
  const parts: Array<string> = []
  for (const column of language.columns) {
    const value = view.filters[column.id] as DataTableFilterValue | undefined
    if (
      !value ||
      value.type === "custom" ||
      !canSay(language, column.id, value)
    )
      continue
    const kept = keptPreset(language, previous, column, value, now)
    if (kept) parts.push(kept)
    else {
      const text = filterValue(language, column, value)
      if (text) parts.push(`${column.key}:${text}`)
    }
  }
  if (view.search.trim() !== "")
    parts.push(plainSearch(view.search) ? view.search : quote(view.search))
  return parts.join(" ")
}

/**
 * `view` with the filters and search of `parsed`, keeping the filters the
 * query cannot say on the columns it does not filter (a typed term
 * replaces such a filter, as it replaces any other); `view` itself when
 * they are the same.
 */
function applyQuery(
  language: QueryLanguage,
  view: DataTableView,
  parsed: ParsedQuery
): DataTableView {
  const filters: Record<string, DataTableFilterValue> = { ...parsed.filters }
  for (const [id, value] of Object.entries(view.filters))
    if (!(id in parsed.filters) && !canSay(language, id, value))
      filters[id] = value
  const same = sameFilters(filters, view.filters)
  if (same && parsed.search === view.search) return view
  return {
    ...view,
    filters: same ? view.filters : filters,
    search: parsed.search,
  }
}

export { applyQuery, plainSearch, serializeQuery }
export type { SerializeOptions }
