/**
 * Search and column filters (§5.4), and facet counts.
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
 * with a letter skips the number columns whose text cannot have one. A
 * column's filter, by its type:
 * - text: the display text contains the value, like search;
 * - number: `min` ≤ value ≤ `max` (either may be left out);
 * - date: `from` ≤ date ≤ `to`, where a `to` at midnight takes in that day
 *   (midnight in the column's `format.timeZone`, which its days are shown
 *   in, or the local zone);
 * - boolean: the value is `value` (an empty value matches neither: rows
 *   without one show only with no filter);
 * - options: the value is one of `values`;
 * - the column's own `filter` function, for any filter value, when it has one.
 * An empty value never matches a number, date or options filter.
 *
 * In a tree (`filterRows`) a matching row keeps its whole subtree, which
 * follows the usual expanded state, and its ancestors, which are kept as
 * context (`RowSet.context`: they do not count as matches) and shown
 * expanded (`RowSet.holdsMatch`), as is any row with a match below it.
 *
 * Facets (`countFacets`) count, per value of a column, the rows matching the
 * search and every filter but the column's own: by option value for an
 * options column, by display text for the others.
 */
import type { EngineColumn } from "./columns"
import type { Core, RowSet } from "./core"
import { createFolder, foldText, type Formatter } from "./format"
import type { IdleTask } from "./idle"
import type { DataTableFilterValue, DataTableView } from "./types"
import {
  dayOf,
  isEmptyValue,
  startOfDay,
  toBoolean,
  toNumber,
  toTime,
} from "./values"

/** Whether the row at `index` (depth first) holding `item` matches. */
type RowPredicate<T> = (index: number, item: T) => boolean

/** A column's folded texts: row `i` is `text[offsets[i], offsets[i + 1] - 1)`. */
type ColumnText = { readonly text: string; readonly offsets: Uint32Array }

type SearchIndex<T> = {
  /** The column's texts, built now if they are not yet. */
  texts: (column: EngineColumn<T>) => ColumnText
  /** Building the column's texts as an idle task. */
  task: (column: EngineColumn<T>) => IdleTask
}

/** Rows per building step. */
const STEP = 4096

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

const LETTER = /\p{L}/u

/**
 * Whether a number column's display text is digits, signs, separators and
 * `%` only: decimal or percent, in standard notation (currencies, units,
 * and compact or scientific notation can write letters).
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
  // it, and its column (the costliest to format) is not read at all.
  const letters = LETTER.test(query)
  for (const column of columns)
    if (!letters || !lettersFree(column))
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
  switch (value.type) {
    case "text": {
      const mask = new Uint8Array(rowCount)
      markMatches(index.texts(column), foldText(value.value.trim()), mask)
      return (row) => mask[row] === 1
    }
    case "number": {
      const { min = -Infinity, max = Infinity } = value
      return (_, item) => {
        const number = toNumber(getValue(item))
        return number !== undefined && number >= min && number <= max
      }
    }
    case "date": {
      const from = value.from?.getTime() ?? -Infinity
      const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
      const end = value.to
        ? rangeEnd(value.to, timeZone)
        : { time: Infinity, inclusive: true }
      return (_, item) => {
        const time = toTime(getValue(item))
        return (
          time !== undefined &&
          time >= from &&
          (end.inclusive ? time <= end.time : time < end.time)
        )
      }
    }
    case "boolean":
      return (_, item) => toBoolean(getValue(item)) === value.value
    case "options": {
      const values = new Set(value.values)
      return (_, item) => {
        const v = getValue(item)
        return v !== null && v !== undefined && values.has(String(v))
      }
    }
    case "custom":
      return null
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
      holdsMatch: null,
    }
  }
  const matched = new Uint8Array(n)
  for (let i = 0; i < n; i++) if (predicate(i, items[i])) matched[i] = 1
  const keptChildren: Array<Uint32Array | undefined> = []
  const context = new Uint8Array(n)
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
    holdsMatch,
  }
}

/** How many rows `predicate` keeps per value of `column` (see the module comment). */
function countFacets<T>(
  core: Core<T>,
  column: EngineColumn<T>,
  predicate: RowPredicate<T> | null,
  formatter: Formatter<T>
): ReadonlyMap<string, number> {
  const { items } = core
  const others = new Map<string, number>()
  const add = (key: string) => others.set(key, (others.get(key) ?? 0) + 1)
  if (column.type === "options") {
    const counts = new Uint32Array(column.options.length)
    for (let i = 0; i < items.length; i++) {
      if (predicate && !predicate(i, items[i])) continue
      const value = column.getValue(items[i])
      if (isEmptyValue(value)) continue
      const option = column.optionIndex.get(String(value))
      if (option === undefined) add(String(value))
      else counts[option]++
    }
    const facets = new Map(
      column.options.map((option, i) => [option.value, counts[i]])
    )
    for (const [key, count] of others) facets.set(key, count)
    return facets
  }
  for (let i = 0; i < items.length; i++) {
    if (predicate && !predicate(i, items[i])) continue
    const text = formatter.text(column, items[i])
    if (text !== "") add(text)
  }
  return others
}

export { compileFilter, countFacets, createSearchIndex, filterRows, searchMask }
export type { ColumnText, RowPredicate, SearchIndex }
