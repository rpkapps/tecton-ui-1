/**
 * The query a view's filters and search read as (`serializeQuery`), and the
 * view a query makes (`applyQuery`).
 *
 * The query is canonical: the filters in column order, each by the
 * column's key (`language.ts`), then the search. `parseQuery` reads it back
 * as the same filters and search (`sameFilters`, and the search as it is,
 * or `""` for one of spaces only):
 *
 * - text: `name:a-12`, quoted when it has to be (`name:"a, b"`);
 * - options: the options by label in lower case, when that names them, else
 *   by value, in the filter's order: `status:drilling,"shut in"`;
 * - yes / no: the boolean filter's label (`yes`), else `yes` / `no`;
 * - number: `td:3000`, `td:>=3000`, `td:<=3000`, `td:1000..3000`, and with
 *   an exclusive bound `td:>3000`, `td:<3000`; a range with one is written
 *   as its two ends, `td:>1000 td:<=3000` (read back as one filter);
 * - date: whole years, months or days as such (`spud:2015`,
 *   `spud:2015-06..2015-08`, `spud:2015-06-30`), else `from..to`, `>=from`,
 *   `<=to` by day (`spud:>=2015-07-01`); an end that is not a day's start
 *   in the column's time zone as an instant (`2015-06-30T10:30:00.000Z`).
 *   A relative preset the previous query wrote (`previous`) is kept while
 *   the filter is still that preset's days: `spud:last30d`, not its dates;
 * - "No value": `none` after the rest (`td:>=3000,none`), alone without it.
 *
 * What the query cannot say is left out: a custom filter value, a filter of
 * another type than its column's, a column no key names. `applyQuery` keeps
 * those in the view.
 */
import type { DataTableFilterValue, DataTableView } from "../types"
import { sameFilters, sameFilterValue } from "../view"
import { dayOfDate, daysInMonth, formatDay, partsOf } from "./dates"
import type { QueryColumn, QueryLanguage } from "./language"
import { formatNumber } from "./numbers"
import { parseQuery } from "./parse"
import { isQuote, quote, valueToken } from "./syntax"
import type { ParsedQuery, QueryView } from "./types"

type SerializeOptions = {
  /** The moment relative dates are from; now by default. */
  now?: Date
  /** The query the field held before the view changed: its presets are kept. */
  previous?: ParsedQuery
}

/** Whether the query can say `value` as the filter of column `id`. */
function canSay(
  language: QueryLanguage,
  id: string,
  value: DataTableFilterValue
) {
  const column = language.byId.get(id)
  return (
    column !== undefined && column.key !== null && value.type === column.type
  )
}

function dateValue(
  column: QueryColumn,
  value: Extract<DataTableFilterValue, { type: "date" }>
): string | null {
  const { from, to } = value
  const zone = column.timeZone
  const end = (date: Date) => {
    const day = dayOfDate(date, zone)
    return {
      ...day,
      text: day.midnight ? formatDay(day.day) : date.toISOString(),
    }
  }
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

/** A filter's value as the query writes it, after its key and colon. */
function filterValue(
  language: QueryLanguage,
  column: QueryColumn,
  value: Exclude<DataTableFilterValue, { type: "custom" }>
): string {
  let text: string | null
  switch (value.type) {
    case "text":
      text = value.value === "" ? null : valueToken(value.value)
      break
    case "options":
      text = value.values.length
        ? value.values.map((v) => language.valueToken(column, v)).join(",")
        : null
      break
    case "boolean":
      text =
        value.value === undefined
          ? null
          : language.valueToken(column, value.value)
      break
    case "number": {
      const n = (v: number) => formatNumber(v, language.numbers)
      const { min, max, minExclusive, maxExclusive } = value
      const low =
        min === undefined ? null : `${minExclusive ? ">" : ">="}${n(min)}`
      const high =
        max === undefined ? null : `${maxExclusive ? "<" : "<="}${n(max)}`
      if (low && high && (minExclusive || maxExclusive)) {
        // Two terms on the column, the second after its key again; "No
        // value" in both, as two terms keep it only when both have it.
        const none = value.empty ? ",none" : ""
        return `${low}${none} ${column.key}:${high}${none}`
      }
      text =
        min !== undefined && max !== undefined
          ? min === max
            ? n(min)
            : `${n(min)}..${n(max)}`
          : (low ?? high)
      break
    }
    case "date":
      text = dateValue(column, value)
  }
  if (!value.empty) return text ?? ""
  return text === null ? "none" : `${text},none`
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
        word !== "AND" &&
        word !== "OR" &&
        word !== "NOT"
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
 * query cannot say; `view` itself when they are the same.
 */
function applyQuery(
  language: QueryLanguage,
  view: DataTableView,
  parsed: ParsedQuery
): DataTableView {
  const filters: Record<string, DataTableFilterValue> = { ...parsed.filters }
  for (const [id, value] of Object.entries(view.filters))
    if (!canSay(language, id, value)) filters[id] = value
  const same = sameFilters(filters, view.filters)
  if (same && parsed.search === view.search) return view
  return {
    ...view,
    filters: same ? view.filters : filters,
    search: parsed.search,
  }
}

export { applyQuery, serializeQuery }
export type { SerializeOptions }
