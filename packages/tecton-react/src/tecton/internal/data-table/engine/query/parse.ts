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
 *   item is a range of `ranges` (`spud:2015,last30d`);
 * - `none` or `empty`, for any type, is "No value" (`status:none`,
 *   `td:>=3000,none`).
 *
 * A column filtered twice keeps the rows both terms match, when one filter
 * can say that (`td:>=1000 td:<=3000` is `1000..3000`); otherwise the second
 * term is a problem (`duplicateColumn`). `OR`, `NOT` and a leading `-` are
 * problems too: filters cannot say "either" or "not", and a term with a
 * problem is not applied rather than applied otherwise. `NOT` takes the
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
  parseDateLiteral,
  startOf,
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

const OPERATOR = /^(>=|<=|≥|≤|>|<|=)/
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
   * each other item read by `read` (`undefined` when it has a problem,
   * which `read` reported, or says nothing yet), its values kept once.
   */
  list<TItem>(
    items: ReadonlyArray<Item>,
    read: (item: Item, raw: string) => TItem | undefined,
    same: (a: TItem, b: TItem) => boolean = Object.is
  ): { values: Array<TItem>; empty: boolean } {
    const values: Array<TItem> = []
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
      const value = read(item, raw)
      if (value !== undefined && !values.some((other) => same(other, value)))
        values.push(value)
    }
    return { values, empty }
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

  options(items: ReadonlyArray<Item>): FilterReading {
    const { values, empty } = this.list(items, (item, raw) => {
      this.span(item.start, item.end, "value")
      if (this.notComparable(item, raw)) return undefined
      const value = unquote(raw).trim()
      const option = this.language.option(this.column, value)
      if (!option) {
        this.problem("unknownValue", item.start, item.end, {
          value,
          ...suggestion(this.language.closestOption(this.column, value)?.value),
        })
        return undefined
      }
      return option.value
    })
    return this.result(
      values.length || empty
        ? { type: "options", values, ...emptyFlag(empty) }
        : undefined
    )
  }

  boolean(items: ReadonlyArray<Item>): FilterReading {
    const { values, empty } = this.list(items, (item, raw) => {
      this.span(item.start, item.end, "value")
      const value = unquote(raw).trim()
      const wanted = this.language.boolean(value)
      if (wanted === undefined && !this.notComparable(item, raw))
        this.problem("unknownValue", item.start, item.end, { value })
      return wanted
    })
    return this.result(
      values.length || empty
        ? { type: "boolean", values, ...emptyFlag(empty) }
        : undefined
    )
  }

  textFilter(items: ReadonlyArray<Item>): FilterReading {
    const { values, empty } = this.list(items, (item, raw) => {
      this.span(item.start, item.end, "value")
      // As it is typed: spaces are a text's own only in quotes, where they
      // keep the chunk together, but blank texts find every row.
      const value = unquote(raw)
      return value.trim() === "" ? undefined : value
    })
    return this.result(
      values.length || empty
        ? { type: "text", values, ...emptyFlag(empty) }
        : undefined
    )
  }

  number(items: ReadonlyArray<Item>): FilterReading {
    const { values, empty } = this.list(
      items,
      (item) => this.numberRange(item),
      sameNumberRange
    )
    return this.result(
      values.length || empty
        ? { type: "number", ranges: values, ...emptyFlag(empty) }
        : undefined
    )
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

  date(items: ReadonlyArray<Item>): FilterReading {
    const { values, empty } = this.list(
      this.joinDates(items),
      (item) => this.dateRange(item),
      sameDateRange
    )
    return this.result(
      values.length || empty
        ? { type: "date", ranges: values, ...emptyFlag(empty) }
        : undefined
    )
  }

  /** A date item's range: its days, a comparison or `a..b`. */
  dateRange(item: Item): DataTableDateRange | undefined {
    const { timeZone } = this.column
    const expression = this.expression(
      item.start,
      item.end,
      (text, start, end) => {
        const literal = parseDateLiteral(
          text,
          this.language.dates,
          this.today(timeZone)
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
      }
    )
    if (!expression) return undefined
    let from: Date | undefined
    let to: Date | undefined
    if (expression.kind === "compare") {
      const { op, literal } = expression
      if (literal.kind === "instant") {
        if (op === ">" || op === "<") {
          this.problem("exclusiveComparison", item.start, item.end, {
            operator: op,
          })
          return undefined
        }
        if (op !== "<=") from = new Date(literal.time)
        if (op !== ">=") to = new Date(literal.time)
      } else if (op === ">") from = startOf(literal.last + 1, timeZone)
      else if (op === "<") to = startOf(literal.first - 1, timeZone)
      else {
        if (op !== "<=") from = startOf(literal.first, timeZone)
        if (op !== ">=") to = startOf(literal.last, timeZone)
      }
    } else {
      const { low, high } = expression
      if (low)
        from =
          low.kind === "instant"
            ? new Date(low.time)
            : startOf(low.first, timeZone)
      if (high)
        to =
          high.kind === "instant"
            ? new Date(high.time)
            : startOf(high.last, timeZone)
      const end =
        high?.kind === "instant"
          ? high.time + 1
          : high
            ? startOf(high.last + 1, timeZone).getTime()
            : Infinity
      if (from && from.getTime() >= end) {
        this.problem("backwardsRange", item.start, item.end, expression.texts)
        return undefined
      }
    }
    return { ...(from ? { from } : {}), ...(to ? { to } : {}) }
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

  result(value: DataTableFilterValue | undefined): FilterReading {
    return {
      spans: this.spans,
      diagnostics: this.diagnostics,
      value: this.diagnostics.length ? undefined : value,
      incomplete: !this.diagnostics.length && value === undefined,
    }
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

const emptyFlag = (empty: boolean) => (empty ? { empty: true as const } : {})

const suggestion = (value: string | undefined) =>
  value === undefined ? {} : { suggestion: value }

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
    const closest = resolved ? undefined : language.closestKey(key)
    return {
      column: undefined,
      reading: {
        spans,
        diagnostics: [
          resolved
            ? {
                code: "columnNotFilterable",
                start,
                end,
                params: { key, column: resolved.unfilterable.id },
              }
            : {
                code: "unknownColumn",
                start,
                end,
                params: { key, ...suggestion(closest?.id) },
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
  const valueStart = colon + 1
  // A number keeps its own commas (`1,234.5`, `3,5` in German).
  const items = itemsOf(
    text,
    valueStart,
    end,
    column.type === "number"
      ? (before, after) => joinsNumber(before, after, language.numbers)
      : undefined
  )
  let reading: FilterReading
  switch (column.type) {
    case "options":
      reading = reader.options(items)
      break
    case "boolean":
      reading = reader.boolean(items)
      break
    case "number":
      reading = reader.number(items)
      break
    case "date":
      reading = reader.date(items)
      break
    case "text":
      reading = reader.textFilter(items)
  }
  return { column, reading }
}

/** Whether a date's value may run on into `chunk`: a plain word, not a term. */
function continuesDate(text: string, chunk: Chunk) {
  const raw = text.slice(chunk.start, chunk.end)
  if (isQuote(raw[0]) || raw.startsWith("-")) return false
  if (raw === "AND" || raw === "OR" || raw === "NOT") return false
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
    if (raw === "AND" || raw === "OR" || raw === "NOT") {
      // A keyword after `NOT` leaves it with no term to take out.
      notAlone()
      spans.push({ start: chunk.start, end: chunk.end, kind: "keyword" })
      terms.push({
        kind: "keyword",
        keyword: raw,
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
    const minus = raw.startsWith("-")
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

export { parseQuery }
export type { ParseOptions }
