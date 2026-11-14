/**
 * Search and column filters (§5.4); what a column's filter counts is in
 * `facets.ts`.
 *
 * Rows are read by their position in the core's depth-first list. The
 * search index keeps, per column, every row's folded display text in one
 * string (separated by NUL, which a query never holds) with each row's
 * offset: a search is a few native `indexOf` scans over it, and the index
 * costs one string per column rather than one per cell. It is built per
 * column on first use, or ahead in idle time (`indexTask`).
 *
 * Search matches the rows where any searchable, shown column's display text
 * contains the whole query, ignoring case and accents (`foldText`); a query
 * with a letter skips the number columns whose text cannot have one (no
 * value shown as it is has a letter, `SearchIndex.lettered`). A
 * column's filter, by its type:
 * - text: the display text contains any of `values`, like search;
 * - number: the value is in any of `ranges`: `min` ≤ value ≤ `max` (either
 *   may be left out), `min` < value with `minExclusive` and value < `max`
 *   with `maxExclusive`;
 * - date: the date is in any of `ranges`: `from` ≤ date ≤ `to`, where a `to`
 *   at midnight takes in that day (midnight in the column's
 *   `format.timeZone`, which its days are shown in, or the local zone);
 * - boolean and options: the value (yes / no, an option) is one of `values`;
 * - the column's own `filter` function, for any filter value, when it has one.
 * An empty value (`hasNoValue`) never matches a filter, but one with `empty`
 * (its "No value"): that matches the rows without a value too, or only them
 * when the filter's list is empty.
 *
 * In a tree (`filterRows`) a matching row keeps its whole subtree, which
 * follows the usual expanded state, and its ancestors, which are kept as
 * context (`RowSet.context`: they do not count as matches) and shown
 * expanded (`RowSet.holdsMatch`), as is any row with a match below it.
 */
import type { EngineColumn } from "./columns"
import type { Core, RowSet } from "./core"
import { listOf, type ListFilterValue } from "./filter-lists"
import { createFolder, foldText, hasNoValue, type Formatter } from "./format"
import type { IdleTask } from "./idle"
import type {
  DataTableDateRange,
  DataTableFilterValue,
  DataTableNumberRange,
  DataTableView,
} from "./types"
import { dayOf, startOfDay, toBoolean, toNumber, toTime } from "./values"

/** Whether the row at `index` (depth first) holding `item` matches. */
type RowPredicate<T> = (index: number, item: T) => boolean

/** A column's folded texts: row `i` is `text[offsets[i], offsets[i + 1] - 1)`. */
type ColumnText = { readonly text: string; readonly offsets: Uint32Array }

type SearchIndex<T> = {
  /** The column's texts, built now if they are not yet. */
  texts: (column: EngineColumn<T>) => ColumnText
  /** Building the column's texts as an idle task. */
  task: (column: EngineColumn<T>) => IdleTask
  /**
   * Whether a number column has a value it shows as it is (a string it
   * cannot read as a number) with a letter in it ("N/A"): looked for once.
   */
  lettered: (column: EngineColumn<T>) => boolean
}

/** Rows per building step. */
const STEP = 4096

const LETTER = /\p{L}/u

function* buildTexts<T>(
  items: ReadonlyArray<T>,
  column: EngineColumn<T>,
  formatter: Formatter<T>,
  fold: (text: string) => string
): Generator<void, ColumnText> {
  const n = items.length
  const offsets = new Uint32Array(n + 1)
  const chunks: Array<string> = []
  let chunk: Array<string> = []
  let offset = 0
  for (let i = 0; i < n; i++) {
    if (chunk.length === STEP) {
      chunks.push(chunk.join("\u0000"))
      chunk = []
      yield
    }
    const text = fold(formatter.text(column, items[i]))
    offsets[i] = offset
    offset += text.length + 1
    chunk.push(text)
  }
  if (chunk.length) chunks.push(chunk.join("\u0000"))
  offsets[n] = offset
  return { text: `${chunks.join("\u0000")}\u0000`, offsets }
}

function createSearchIndex<T>(
  items: ReadonlyArray<T>,
  formatter: Formatter<T>
): SearchIndex<T> {
  const built = new Map<EngineColumn<T>, ColumnText>()
  const building = new Map<EngineColumn<T>, Generator<void, ColumnText>>()
  // Folds of non-ASCII text are shared by the index's columns.
  const fold = createFolder()
  const steps = (column: EngineColumn<T>) => {
    let job = building.get(column)
    if (!job) {
      job = buildTexts(items, column, formatter, fold)
      building.set(column, job)
    }
    return job
  }
  const lettered = new Map<EngineColumn<T>, boolean>()
  const finish = (column: EngineColumn<T>, texts: ColumnText) => {
    built.set(column, texts)
    building.delete(column)
    return texts
  }
  return {
    texts(column) {
      const texts = built.get(column)
      if (texts) return texts
      const job = steps(column)
      let step = job.next()
      while (!step.done) step = job.next()
      return finish(column, step.value)
    },
    task: (column) => ({
      done: () => built.has(column),
      step() {
        const step = steps(column).next()
        if (step.done) finish(column, step.value)
      },
    }),
    lettered(column) {
      let found = lettered.get(column)
      if (found === undefined) {
        // The values alone, not their texts: most are numbers.
        found = items.some((item) => {
          const value = column.getValue(item)
          return (
            typeof value === "string" &&
            toNumber(value) === undefined &&
            LETTER.test(value)
          )
        })
        lettered.set(column, found)
      }
      return found
    },
  }
}

/** Marks in `mask` the rows whose text in `texts` contains `query`. */
function markMatches(
  { text, offsets }: ColumnText,
  query: string,
  mask: Uint8Array
) {
  let row = 0
  let from = 0
  for (;;) {
    const at = text.indexOf(query, from)
    if (at === -1) return
    while (offsets[row + 1] <= at) row++
    mask[row] = 1
    from = offsets[row + 1]
  }
}

/**
 * Whether a number column's numbers are written with digits, signs,
 * separators and `%` only: decimal or percent, in standard notation
 * (currencies, units, and compact or scientific notation can write
 * letters). Its values that are not numbers show as they are, and may.
 */
function lettersFree<T>(column: EngineColumn<T>) {
  if (column.type !== "number") return false
  const { style, notation } = (column.format ?? {}) as Intl.NumberFormatOptions
  return (
    (style === undefined || style === "decimal" || style === "percent") &&
    (notation === undefined || notation === "standard")
  )
}

/**
 * The rows `search` matches over `columns` (1 in the mask), or `null` for
 * an empty search. Expects a trimmed search.
 */
function searchMask<T>(
  index: SearchIndex<T>,
  columns: ReadonlyArray<EngineColumn<T>>,
  search: string,
  rowCount: number
): Uint8Array | null {
  const query = foldText(search)
  if (!query) return null
  const mask = new Uint8Array(rowCount)
  // A plain number's text has no letters: a query with one cannot match
  // it, and a column of them alone (the costliest to format) is not read.
  const letters = LETTER.test(query)
  for (const column of columns)
    if (!letters || !lettersFree(column) || index.lettered(column))
      markMatches(index.texts(column), query, mask)
  return mask
}

/**
 * The end of a date filter's `to`: the next day's start when it is a
 * midnight in `timeZone` (or the local zone), exclusive.
 */
function rangeEnd(to: Date, timeZone: string | undefined) {
  const day = dayOf(to, timeZone)
  if (!day.midnight) return { time: to.getTime(), inclusive: true }
  const next = startOfDay(day.year, day.month, day.day + 1, timeZone)
  return { time: next.getTime(), inclusive: false }
}

function columnPredicate<T>(
  column: EngineColumn<T>,
  value: DataTableFilterValue,
  index: SearchIndex<T>,
  rowCount: number
): RowPredicate<T> | null {
  const { filter, getValue } = column
  if (filter) return (_, item) => filter(item, value)
  if (value.type === "custom") return null
  const matches = valuePredicate(column, value, index, rowCount)
  if (!value.empty) return matches ?? null
  // "No value": the rows without one, and those the rest matches.
  const blank: RowPredicate<T> = (_, item) => hasNoValue(column, getValue(item))
  if (!matches) return blank
  return (row, item) => blank(row, item) || matches(row, item)
}

/** A number range's bounds as numbers, for `inBounds`. */
type NumberBounds = {
  readonly min: number
  readonly max: number
  readonly above: boolean
  readonly below: boolean
}

/** A number range's bounds: its ends left out are infinite. */
const boundsOf = ({
  min = -Infinity,
  max = Infinity,
  minExclusive,
  maxExclusive,
}: DataTableNumberRange): NumberBounds => ({
  min,
  max,
  above: minExclusive === true,
  below: maxExclusive === true,
})

/** Whether `n` is within `bounds`. */
const inBounds = (n: number, { min, max, above, below }: NumberBounds) =>
  (above ? n > min : n >= min) && (below ? n < max : n <= max)

/** Whether a number range has a bound: one without filters nothing. */
const hasBound = (range: DataTableNumberRange) =>
  range.min !== undefined || range.max !== undefined

/** Whether a date range has an end: one without filters nothing. */
const hasEnd = (range: DataTableDateRange) =>
  range.from !== undefined || range.to !== undefined

/** A date range's times as number bounds: its end as `rangeEnd` reads it. */
function dateBounds(
  { from, to }: DataTableDateRange,
  timeZone: string | undefined
): NumberBounds {
  const end = to ? rangeEnd(to, timeZone) : { time: Infinity, inclusive: true }
  return {
    min: from?.getTime() ?? -Infinity,
    max: end.time,
    above: false,
    below: !end.inclusive,
  }
}

/**
 * The rows a filter's list matches (its "No value", `empty`, aside), or
 * `null` when the list is empty.
 */
function valuePredicate<T>(
  column: EngineColumn<T>,
  value: ListFilterValue,
  index: SearchIndex<T>,
  rowCount: number
): RowPredicate<T> | null {
  const { getValue } = column
  if (value.type === "text") {
    const queries = new Set(
      value.values.map((text) => foldText(text.trim())).filter(Boolean)
    )
    if (!queries.size) return null
    // A scan of the column's texts per value, into one mask.
    const mask = new Uint8Array(rowCount)
    const texts = index.texts(column)
    for (const query of queries) markMatches(texts, query, mask)
    return (row) => mask[row] === 1
  }
  if (value.type === "number" || value.type === "date") {
    // Numbers and times, within any of the bounds.
    const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
    const bounds =
      value.type === "number"
        ? value.ranges.filter(hasBound).map(boundsOf)
        : value.ranges
            .filter(hasEnd)
            .map((range) => dateBounds(range, timeZone))
    if (!bounds.length) return null
    const read = value.type === "number" ? toNumber : toTime
    return (_, item) => {
      const n = read(getValue(item))
      return n !== undefined && bounds.some((bound) => inBounds(n, bound))
    }
  }
  // Yes / no and options: the value, as the list's items read, is one of them.
  const list = listOf(value)
  if (!list.length) return null
  const wanted = new Set(list.map(String))
  const boolean = value.type === "boolean"
  return (_, item) => {
    const own = boolean ? toBoolean(getValue(item)) : getValue(item)
    return own !== null && own !== undefined && wanted.has(String(own))
  }
}

/**
 * The predicate of `filters` (but `exclude`'s) and the search mask, or
 * `null` when they filter nothing. Expects reconciled filters.
 */
function compileFilter<T>(
  columns: ReadonlyMap<string, EngineColumn<T>>,
  filters: DataTableView["filters"],
  index: SearchIndex<T>,
  search: Uint8Array | null,
  rowCount: number,
  exclude?: string
): RowPredicate<T> | null {
  const predicates: Array<RowPredicate<T>> = []
  for (const [id, value] of Object.entries(filters)) {
    if (id === exclude) continue
    const column = columns.get(id)
    const predicate = column && columnPredicate(column, value, index, rowCount)
    if (predicate) predicates.push(predicate)
  }
  if (search) predicates.push((row) => search[row] === 1)
  if (!predicates.length) return null
  if (predicates.length === 1) return predicates[0]
  return (row, item) => predicates.every((predicate) => predicate(row, item))
}

/** The rows of `core` that `predicate` keeps (see the module comment). */
function filterRows<T>(core: Core<T>, predicate: RowPredicate<T>): RowSet {
  const { items, children } = core
  const n = items.length
  if (!children) {
    const kept = new Uint32Array(n)
    let count = 0
    for (let i = 0; i < n; i++) if (predicate(i, items[i])) kept[count++] = i
    const roots = kept.slice(0, count)
    return {
      roots,
      children: null,
      all: roots,
      context: null,
      matches: count,
      holdsMatch: null,
    }
  }
  const matched = new Uint8Array(n)
  for (let i = 0; i < n; i++) if (predicate(i, items[i])) matched[i] = 1
  const keptChildren: Array<Uint32Array | undefined> = []
  const context = new Uint8Array(n)
  let contextCount = 0
  const holdsMatch = new Uint8Array(n)
  // The kept rows of `rows` and whether a match is among them or below.
  const visit = (
    rows: Uint32Array,
    underMatch: boolean
  ): { kept: Uint32Array; match: boolean } => {
    const kept: Array<number> = []
    let match = false
    for (const row of rows) {
      const own = children[row]
      const keep = underMatch || matched[row] === 1
      const below = own ? visit(own, keep) : undefined
      if (below?.match) holdsMatch[row] = 1
      if (keep) {
        keptChildren[row] = own
        kept.push(row)
        match ||= matched[row] === 1 || below?.match === true
      } else if (below?.kept.length) {
        keptChildren[row] = below.kept
        context[row] = 1
        contextCount++
        kept.push(row)
        match = true
      }
    }
    return {
      kept: underMatch ? rows : Uint32Array.from(kept),
      match,
    }
  }
  const roots = visit(core.roots, false).kept
  const all: Array<number> = []
  const collect = (rows: Uint32Array) => {
    for (const row of rows) {
      all.push(row)
      const kids = keptChildren[row]
      if (kids) collect(kids)
    }
  }
  collect(roots)
  return {
    roots,
    children: keptChildren,
    all: Uint32Array.from(all),
    context,
    matches: all.length - contextCount,
    holdsMatch,
  }
}

export {
  boundsOf,
  columnPredicate,
  compileFilter,
  createSearchIndex,
  filterRows,
  hasBound,
  hasEnd,
  inBounds,
  searchMask,
}
export type { ColumnText, NumberBounds, RowPredicate, SearchIndex }
