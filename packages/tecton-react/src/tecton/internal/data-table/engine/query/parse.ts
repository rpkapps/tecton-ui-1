/**
 * `parseQuery`: a query's terms, the filters and search they make, how to
 * draw them and what is wrong with them.
 *
 *   query  := term*                       side by side: every term applies
 *   term   := word | "phrase" | key ":" value | AND
 *   value  := item ("," item)*            any of the items
 *   item   := none | (the column's type's item)
 *   none   := none | empty                the filter's "No value"
 *
 * Free words and phrases are the view's `search`, joined by a space. A key
 * names a column (`language.ts`); its value becomes that column's filter,
 * exactly as the filter's own controls make it. The value is a list for
 * every type, read alike: a comma always means "any of", and the column's
 * type says what one item is:
 *
 * - options: an option, by value or label (`status:drilling,"shut in"`);
 * - yes / no: one of them (`subsea:yes`);
 * - text: a text the column's values contain (`name:a-12,b-3`); a comma in
 *   quotes is the text's own (`name:"a, b"`);
 * - number: `n` (that number), `>=n`, `<=n`, `a..b`, `a..`, `..b`, ends
 *   included, and `>n`, `<n`, the bound left out (`minExclusive`,
 *   `maxExclusive`), in the table's locale (`numbers.ts`): a range of
 *   `ranges` (`td:<1000,>3000`);
 * - date: a date (`dates.ts`: a year, a month, a day, a preset) is its
 *   days, `>d` the days after them, `>=d` from their first, `<d` before
 *   them, `<=d` up to their last, `a..b` from a's first day to b's last
 *   (days in the column's time zone, as its date filter has them). An
 *   instant is itself, and `>` / `<` are refused with it; as a filter's
 *   `to`, an instant that is a day's start takes in that day, as the date
 *   filter reads such a `to` (the query writes that end as its day).
 *   A date with spaces in it (`jun 2015`, `30 jun 2015`) takes the words
 *   after it that make it one, when it is not a date without them. Each
 *   item is a range of `ranges` (`spud:2015,last30d`). A number's or a
 *   date's range may have a space before its `..` (`spud:2015 ..2016`);
 * - `none` or `empty`, for any type, is "No value" (`status:none`,
 *   `td:>=3000,none`).
 *
 * A column filtered twice keeps the rows both terms match, when one filter
 * can say that (`td:>=1000 td:<=3000` is `1000..3000`); otherwise the second
 * term is a problem (`duplicateColumn`). `OR`, `NOT` and a leading `-` are
 * problems too (a `-` alone is text, as in `A - 12`): filters cannot say "either" or "not", and a term with a
 * problem is not applied rather than applied otherwise. A problem in an
 * item of a list (an unknown option, a number or a date that cannot be
 * read, a backwards range) is that item's alone: it is not applied, the
 * list's other items are (`status:legacy,producing` is `producing`), and a
 * list with no item left is not applied at all. `NOT` takes the
 * term after it with it, as `-` does its own (`NOT drilling` searches for
 * nothing, never for "drilling"). Quote a word to
 * search for it as it is (`"-5"`, `"OR"`, `"10:30"`, `"http://..."`).
 * `AND` is accepted and changes nothing.
 */
import type {
  DataTableDateRange,
  DataTableFilterValue,
  DataTableNumberRange,
} from "../types"
import { sameDateRange, sameNumberRange } from "../view"
import {
  dateBounds,
  parseDateLiteral,
  todayIn,
  type DateLiteral,
  type DateProblem,
  type Day,
} from "./dates"
import type { QueryColumn, QueryLanguage } from "./language"
import { joinsNumber, parseNumber } from "./numbers"
import {
  chunksOf,
  hasQuote,
  indexOutsideQuotes,
  isEmptyWord,
  isKeyText,
  isQuote,
  itemsOf,
  KEYWORDS,
  OPERATOR,
  unquote,
  type Chunk,
  type Item,
} from "./syntax"
import type {
  ParsedQuery,
  QueryDiagnostic,
  QueryDiagnosticCode,
  QueryDiagnosticParams,
  QueryFilterTerm,
  QueryKeywordTerm,
  QuerySpan,
  QuerySpanKind,
  QueryTerm,
} from "./types"
import { intersectFilters } from "./merge"

type ParseOptions = {
  /** The moment relative dates are from (`today`, `last30d`); now by default. */
  now?: Date
}

/** What one term's reading collects. */
type Reading = {
  spans: Array<QuerySpan>
  diagnostics: Array<QueryDiagnostic>
}

type FilterReading = Reading & {
  value: DataTableFilterValue | undefined
  incomplete: boolean
}

const COMPARISON: Record<string, ">=" | "<=" | ">" | "<" | "="> = {
  ">=": ">=",
  "≥": ">=",
  "<=": "<=",
  "≤": "<=",
  ">": ">",
  "<": "<",
  "=": "=",
}

/** The reading of one filter term's value, over `text[start, end)`. */
class TermReader {
  readonly spans: Array<QuerySpan> = []
  readonly diagnostics: Array<QueryDiagnostic> = []

  constructor(
    readonly text: string,
    readonly language: QueryLanguage,
    readonly column: QueryColumn,
    readonly today: (timeZone: string | undefined) => Day
  ) {}

  span(start: number, end: number, kind: QuerySpanKind) {
    if (end > start) this.spans.push({ start, end, kind })
  }

  problem(
    code: QueryDiagnosticCode,
    start: number,
    end: number,
    params: Omit<QueryDiagnosticParams, "column"> = {}
  ) {
    this.diagnostics.push({
      code,
      start,
      end: Math.max(end, start),
      params: { column: this.column.id, ...params },
    })
  }

  raw(item: Item) {
    return this.text.slice(item.start, item.end)
  }

  /** A "No value" word (unquoted). */
  isEmpty(item: Item) {
    const raw = this.raw(item)
    return !hasQuote(raw) && isEmptyWord(raw)
  }

  /** `text[start, end)` without the spaces around it. */
  trimmed(start: number, end: number) {
    while (start < end && /\s/.test(this.text[start])) start++
    while (end > start && /\s/.test(this.text[end - 1])) end--
    return { start, end }
  }

  /**
   * The value's items, the same way for every type: the commas between
   * them drawn, blank ones skipped, `none` taken as "No value" (`empty`),
   * each other item read by `item` (`undefined` when it has a problem,
   * which it reported, or says nothing yet), its values kept once; the
   * filter the items without a problem make (`status:legacy,producing` is
   * `producing`, `legacy` reported alone), none when no item makes one.
   */
  list(items: ReadonlyArray<Item>): FilterReading {
    const { type } = this.column
    const same = (
      type === "number"
        ? sameNumberRange
        : type === "date"
          ? sameDateRange
          : Object.is
    ) as (a: unknown, b: unknown) => boolean
    const values: Array<unknown> = []
    let empty = false
    for (const [index, item] of items.entries()) {
      if (index > 0) this.span(item.start - 1, item.start, "separator")
      const raw = this.raw(item)
      if (raw.trim() === "") continue
      if (this.isEmpty(item)) {
        empty = true
        this.span(item.start, item.end, "empty")
        continue
      }
      const value = this.item(item, raw)
      if (value !== undefined && !values.some((other) => same(other, value)))
        values.push(value)
    }
    const problem = this.diagnostics.length > 0
    const value =
      values.length || empty
        ? ({
            type,
            [type === "number" || type === "date" ? "ranges" : "values"]:
              values,
            ...(empty ? { empty } : {}),
          } as DataTableFilterValue)
        : undefined
    return {
      spans: this.spans,
      diagnostics: this.diagnostics,
      value,
      incomplete: !problem && !value,
    }
  }

  /**
   * Whether an option or yes / no item is a comparison or a range, which a
   * column without an order has none of (`notComparable`, reported).
   */
  notComparable(item: Item, raw: string) {
    if (hasQuote(raw) || !(OPERATOR.test(raw) || raw.includes("..")))
      return false
    this.problem("notComparable", item.start, item.end, {
      operator: OPERATOR.exec(raw)?.[1] ?? "..",
    })
    return true
  }

  /** One item of the value, by the column's type (see `list`). */
  item(item: Item, raw: string) {
    const { column, language } = this
    if (column.type === "number") return this.numberRange(item)
    if (column.type === "date") return this.dateRange(item)
    this.span(item.start, item.end, "value")
    const value = unquote(raw)
    // A text as it is typed: spaces are its own only in quotes, where
    // they keep the chunk together, but blank texts find every row.
    if (column.type === "text") return value.trim() === "" ? undefined : value
    const name = value.trim()
    if (column.type === "boolean") {
      const wanted = language.boolean(name)
      if (wanted === undefined && !this.notComparable(item, raw))
        this.problem("unknownValue", item.start, item.end, { value: name })
      return wanted
    }
    if (this.notComparable(item, raw)) return undefined
    const option = language.option(column, name)
    if (!option)
      this.problem("unknownValue", item.start, item.end, {
        value: name,
        ...suggestion(language.closestOption(column, name)?.value),
      })
    return option?.value
  }

  /** A number item's range: a comparison or `a..b`. */
  numberRange(item: Item): DataTableNumberRange | undefined {
    const expression = this.expression(
      item.start,
      item.end,
      (text, start, end) => {
        const n = parseNumber(text, this.language.numbers)
        if (n === undefined) {
          this.problem("notANumber", start, end, { value: text })
          return undefined
        }
        this.span(start, end, "value")
        return n
      }
    )
    if (!expression) return undefined
    if (expression.kind === "compare") {
      const { op, literal: n } = expression
      return {
        ...(op !== "<=" && op !== "<" ? { min: n } : {}),
        ...(op !== ">=" && op !== ">" ? { max: n } : {}),
        ...(op === ">" ? { minExclusive: true } : {}),
        ...(op === "<" ? { maxExclusive: true } : {}),
      }
    }
    const { low: min, high: max } = expression
    if (min !== undefined && max !== undefined && min > max) {
      this.problem("backwardsRange", item.start, item.end, expression.texts)
      return undefined
    }
    return {
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
    }
  }

  /** Whether a date item reads as a range, or "No value", without a problem. */
  readsAsDate(item: Item) {
    if (this.raw(item).trim() === "" || this.isEmpty(item)) return true
    const probe = new TermReader(
      this.text,
      this.language,
      this.column,
      this.today
    )
    return probe.dateRange(item) !== undefined && !probe.diagnostics.length
  }

  /**
   * A date's own comma (`jun 30, 2015`): an item that is no date alone
   * takes the next one when together they make one.
   */
  joinDates(items: ReadonlyArray<Item>): Array<Item> {
    const joined: Array<Item> = []
    for (let i = 0; i < items.length; i++) {
      let item = items[i]
      if (i + 1 < items.length && !this.readsAsDate(item)) {
        const longer = { start: item.start, end: items[i + 1].end }
        if (this.readsAsDate(longer)) {
          item = longer
          i++
        }
      }
      joined.push(item)
    }
    return joined
  }

  /** A date item's comparison or range, its dates read (`expression`). */
  dateExpression(item: Item) {
    return this.expression(item.start, item.end, (text, start, end) => {
      const literal = parseDateLiteral(
        text,
        this.language.dates,
        this.today(this.column.timeZone)
      )
      if ("error" in literal) {
        this.dateProblem(literal, text, start, end)
        return undefined
      }
      this.span(
        start,
        end,
        literal.kind === "days" && literal.preset ? "preset" : "value"
      )
      return literal
    })
  }

  /** A date item's range: its days, a comparison or `a..b` (`dateBounds`). */
  dateRange(
    item: Item,
    expression = this.dateExpression(item)
  ): DataTableDateRange | undefined {
    if (!expression) return undefined
    const zone = this.column.timeZone
    if (expression.kind === "compare") {
      const { op, literal } = expression
      if (literal.kind === "instant" && (op === ">" || op === "<")) {
        this.problem("exclusiveComparison", item.start, item.end, {
          operator: op,
        })
        return undefined
      }
      return dateBounds(op, literal, zone)
    }
    const { low, high } = expression
    const range = {
      ...(low && dateBounds(">=", low, zone)),
      ...(high && dateBounds("<=", high, zone)),
    }
    // Starting after its end: the instant or the day after it.
    if (
      range.from &&
      high &&
      range.from >= (dateBounds(">", high, zone).from as Date)
    ) {
      this.problem("backwardsRange", item.start, item.end, expression.texts)
      return undefined
    }
    return range
  }

  dateProblem(problem: DateProblem, text: string, start: number, end: number) {
    this.span(start, end, "value")
    this.problem(problem.error, start, end, {
      value: text,
      ...(problem.reason ? { reason: problem.reason } : {}),
    })
  }

  /**
   * A comparison (`>=n`) or a range (`a..b`, either end left out) over
   * `text[start, end)`, its literals read by `read` (`undefined` when one
   * is not readable: `read` has said why). `null` when there is nothing to
   * read yet or a literal is not readable.
   */
  expression<TLiteral>(
    start: number,
    end: number,
    read: (text: string, start: number, end: number) => TLiteral | undefined
  ):
    | { kind: "compare"; op: ">=" | "<=" | ">" | "<" | "="; literal: TLiteral }
    | {
        kind: "range"
        low: TLiteral | undefined
        high: TLiteral | undefined
        texts: { from: string; to: string }
      }
    | null {
    const literal = (from: number, to: number) => {
      const at = this.trimmed(from, to)
      if (at.end <= at.start) return { empty: true as const }
      const text = unquote(this.text.slice(at.start, at.end)).trim()
      return {
        empty: false as const,
        value: read(text, at.start, at.end),
        text,
      }
    }
    const at = this.trimmed(start, end)
    const operator = OPERATOR.exec(this.text.slice(at.start, at.end))
    if (operator) {
      const opEnd = at.start + operator[1].length
      this.span(at.start, opEnd, "operator")
      const value = literal(opEnd, at.end)
      if (value.empty || value.value === undefined) return null
      return {
        kind: "compare",
        op: COMPARISON[operator[1]],
        literal: value.value,
      }
    }
    const range = rangeAt(this.text, at.start, at.end)
    if (range !== -1) {
      this.span(range, range + 2, "operator")
      const low = literal(at.start, range)
      const high = literal(range + 2, at.end)
      if (low.empty && high.empty) return null
      if (
        (!low.empty && low.value === undefined) ||
        (!high.empty && high.value === undefined)
      )
        return null
      return {
        kind: "range",
        low: low.empty ? undefined : low.value,
        high: high.empty ? undefined : high.value,
        texts: {
          from: low.empty ? "" : low.text,
          to: high.empty ? "" : high.text,
        },
      }
    }
    const value = literal(at.start, at.end)
    if (value.empty || value.value === undefined) return null
    return { kind: "compare", op: "=", literal: value.value }
  }
}

/** The first `..` of `text[start, end)` outside quotes, or -1. */
function rangeAt(text: string, start: number, end: number) {
  for (let at = start; ; at++) {
    at = indexOutsideQuotes(text, ".", at, end)
    if (at === -1 || at + 1 >= end) return -1
    if (text[at + 1] === ".") return at
  }
}

const suggestion = (value: string | undefined) =>
  value === undefined ? {} : { suggestion: value }

/**
 * The items of a value over `text[from, to)` (`itemsOf`), as `reader`'s
 * column reads them: a number keeps its own commas (`1,234.5`, `3,5` in
 * German), a date its own (`jun 30, 2015`).
 */
function itemsIn(reader: TermReader, from: number, to: number) {
  const { text, language, column } = reader
  const items = itemsOf(
    text,
    from,
    to,
    column.type === "number"
      ? (before, after) => joinsNumber(before, after, language.numbers)
      : undefined
  )
  return column.type === "date" ? reader.joinDates(items) : items
}

/**
 * The items of column `column`'s value over `text[from, to)`, as the
 * parser reads them (`itemsIn`): what the suggestions and the calendar
 * take the item at the caret from.
 */
function valueItems(
  language: QueryLanguage,
  column: QueryColumn,
  text: string,
  from: number,
  to: number,
  now = new Date()
) {
  return itemsIn(
    new TermReader(text, language, column, (zone) => todayIn(now, zone)),
    from,
    to
  )
}

/** The date item at the caret (`readDateItem`). */
type DateItem = {
  /** The item, from after its leading spaces. */
  readonly start: number
  readonly end: number
  /** Its comparison as typed (`>=`, `≤`); `""` for none. */
  readonly operator: string
  /** Its days, read alone; `undefined` when it filters nothing yet or has a problem. */
  readonly range: DataTableDateRange | undefined
  /**
   * The day a comparison names, for a calendar to show: its first for
   * `>=` and `<`, its last for `<=` and `>` (`>2015-06`: June 30).
   */
  readonly day: Day | undefined
}

/**
 * The item of a date term's value the caret is in (after a comma, the
 * next one; past the last, the last), read alone: what the calendar of
 * the suggestions shows and writes. `undefined` when the caret is not in
 * a date term's value.
 */
function readDateItem(
  language: QueryLanguage,
  parsed: ParsedQuery,
  caret: number,
  now = new Date()
): DateItem | undefined {
  const { text } = parsed
  const term = parsed.terms.find(
    (one) => caret >= one.start && caret <= one.end
  )
  if (term?.kind !== "filter" || caret <= term.key.end) return undefined
  const column = language.byId.get(term.column ?? "")
  if (column?.type !== "date") return undefined
  const reader = new TermReader(text, language, column, (zone) =>
    todayIn(now, zone)
  )
  const items = itemsIn(reader, term.valueStart, term.end)
  const item =
    items.find((one) => caret >= one.start && caret <= one.end) ??
    items[items.length - 1]
  const { start } = reader.trimmed(item.start, item.end)
  const operator = OPERATOR.exec(text.slice(start, item.end))?.[1] ?? ""
  const expression = reader.dateExpression(item)
  const range = reader.dateRange(item, expression)
  const literal = expression?.kind === "compare" ? expression.literal : null
  const op = expression?.kind === "compare" ? expression.op : ""
  return {
    start,
    end: item.end,
    operator,
    range: reader.diagnostics.length ? undefined : range,
    day:
      literal?.kind === "days"
        ? op === "<=" || op === ">"
          ? literal.last
          : literal.first
        : undefined,
  }
}

/** Reads the filter term `key:value` over `text[start, end)`, its colon at `colon`. */
function readFilter(
  text: string,
  language: QueryLanguage,
  today: (timeZone: string | undefined) => Day,
  start: number,
  colon: number,
  end: number
): { reading: FilterReading; column: QueryColumn | undefined } {
  const key = text.slice(start, colon)
  const spans: Array<QuerySpan> = [
    { start, end: colon, kind: "key" },
    { start: colon, end: colon + 1, kind: "colon" },
  ]
  const resolved = language.resolveKey(key)
  if (!resolved || "unfilterable" in resolved) {
    if (end > colon + 1) spans.push({ start: colon + 1, end, kind: "value" })
    return {
      column: undefined,
      reading: {
        spans,
        diagnostics: [
          {
            code: resolved ? "columnNotFilterable" : "unknownColumn",
            start,
            end,
            params: resolved
              ? { key, column: resolved.unfilterable.id }
              : { key, ...suggestion(language.closestKey(key)?.id) },
          },
        ],
        value: undefined,
        incomplete: false,
      },
    }
  }
  const { column } = resolved
  const reader = new TermReader(text, language, column, today)
  reader.spans.push(...spans)
  return { column, reading: reader.list(itemsIn(reader, colon + 1, end)) }
}

/** Whether a date's value may run on into `chunk`: a plain word, not a term. */
function continuesDate(text: string, chunk: Chunk) {
  const raw = text.slice(chunk.start, chunk.end)
  if (isQuote(raw[0]) || raw.startsWith("-")) return false
  if (KEYWORDS.has(raw)) return false
  const colon = indexOutsideQuotes(text, ":", chunk.start, chunk.end)
  return colon === -1 || !isKeyText(text.slice(chunk.start, colon))
}

/** The query's terms, filters, search, spans and problems (see the module comment). */
function parseQuery(
  language: QueryLanguage,
  text: string,
  { now }: ParseOptions = {}
): ParsedQuery {
  const chunks = chunksOf(text)
  const terms: Array<QueryTerm> = []
  const spans: Array<QuerySpan> = []
  const diagnostics: Array<QueryDiagnostic> = []
  const filters: Record<string, DataTableFilterValue> = {}
  const search: Array<string> = []
  const moment = now ?? new Date()
  // Today in each time zone a date column is in, for relative dates.
  const todays = new Map<string | undefined, Day>()
  const today = (timeZone: string | undefined) => {
    let day = todays.get(timeZone)
    if (day === undefined)
      todays.set(timeZone, (day = todayIn(moment, timeZone)))
    return day
  }
  // Where a `NOT` waiting for the term it takes out starts.
  let not: number | undefined
  const notAlone = () => {
    if (not === undefined) return
    diagnostics.push({
      code: "unsupportedOperator",
      start: not,
      end: not + "NOT".length,
      params: { operator: "NOT" },
    })
    not = undefined
  }
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    const raw = text.slice(chunk.start, chunk.end)
    if (KEYWORDS.has(raw)) {
      // A keyword after `NOT` leaves it with no term to take out.
      notAlone()
      spans.push({ start: chunk.start, end: chunk.end, kind: "keyword" })
      terms.push({
        kind: "keyword",
        keyword: raw as QueryKeywordTerm["keyword"],
        start: chunk.start,
        end: chunk.end,
        applied: raw === "AND",
      })
      if (raw === "NOT") not = chunk.start
      else if (raw === "OR")
        diagnostics.push({
          code: "unsupportedOperator",
          start: chunk.start,
          end: chunk.end,
          params: { operator: raw },
        })
      continue
    }
    // A minus alone is text (`A - 12`): it excludes nothing.
    const minus = raw.length > 1 && raw.startsWith("-")
    const negatedBy = not
    not = undefined
    const negated = minus || negatedBy !== undefined
    const start = minus ? chunk.start + 1 : chunk.start
    if (minus) spans.push({ start: chunk.start, end: start, kind: "keyword" })
    const colon = indexOutsideQuotes(text, ":", start, chunk.end)
    let term: QueryTerm
    let own: Array<QueryDiagnostic>
    if (colon !== -1 && isKeyText(text.slice(start, colon))) {
      const read = (end: number) =>
        readFilter(text, language, today, start, colon, end)
      let end = chunk.end
      let result = read(end)
      // A range's end after a space (`spud:2015 ..2016`).
      const next = chunks.at(index + 1)
      if (
        (result.column?.type === "date" || result.column?.type === "number") &&
        next &&
        text.startsWith("..", next.start)
      ) {
        index++
        result = read((end = next.end))
      }
      // A date with spaces: the words after it, when they make it one.
      if (
        result.column?.type === "date" &&
        (result.reading.diagnostics.length || result.reading.incomplete)
      ) {
        let taken = 0
        for (let more = 1; more <= 4 && index + more < chunks.length; more++) {
          const next = chunks[index + more]
          if (!continuesDate(text, next)) break
          const longer = read(next.end)
          if (
            !longer.reading.diagnostics.length &&
            !longer.reading.incomplete
          ) {
            result = longer
            end = next.end
            taken = more
          }
        }
        index += taken
      }
      const { reading, column } = result
      spans.push(...reading.spans)
      own = reading.diagnostics
      const filter: QueryFilterTerm = {
        kind: "filter",
        start: chunk.start,
        end,
        applied: !negated && reading.value !== undefined,
        key: { start, end: colon, text: text.slice(start, colon) },
        column: column?.id,
        valueStart: colon + 1,
        value: reading.value,
        incomplete: reading.incomplete,
      }
      term = filter
      if (filter.applied && column && reading.value) {
        const previous = filters[column.id] as DataTableFilterValue | undefined
        if (!previous) filters[column.id] = reading.value
        else {
          const merged = intersectFilters(
            previous,
            reading.value,
            column.timeZone
          )
          if (typeof merged === "string") {
            own = [
              ...own,
              {
                code: "duplicateColumn",
                start: chunk.start,
                end,
                params: { column: column.id, reason: merged },
              },
            ]
            term = { ...filter, applied: false }
          } else filters[column.id] = merged
        }
      }
    } else {
      const body = text.slice(start, chunk.end)
      const value = unquote(body)
      if (body) spans.push({ start, end: chunk.end, kind: "text" })
      const quoted = hasQuote(body)
      const applied = !negated && (quoted ? value !== "" : value.trim() !== "")
      term = {
        kind: "text",
        start: chunk.start,
        end: chunk.end,
        text: value,
        quoted,
        applied,
      }
      if (applied) search.push(value)
      own = []
    }
    if (negated) {
      // Not applied, whatever else is the matter with it; `NOT` and its
      // term are one problem.
      own = [
        {
          code: "unsupportedOperator",
          start: negatedBy ?? chunk.start,
          end: term.end,
          params: { operator: negatedBy === undefined ? "-" : "NOT" },
        },
      ]
    }
    diagnostics.push(...own)
    terms.push(term)
  }
  notAlone()
  return {
    text,
    terms,
    spans: spans.sort((a, b) => a.start - b.start),
    diagnostics: diagnostics.sort((a, b) => a.start - b.start),
    filters,
    search: search.join(" "),
  }
}

export { parseQuery, readDateItem, valueItems }
export type { DateItem, ParseOptions }
