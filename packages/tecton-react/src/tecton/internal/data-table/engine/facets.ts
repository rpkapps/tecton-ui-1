/**
 * Facets (§5.4): what a column's filter offers and counts, for
 * `DataTableFilter`'s popover and the query language's suggestions. A
 * module of its own, read through the row model's `searchParts`, so a
 * table without those parts does not bundle it.
 *
 * Facets (`countFacets`) count, per value of a column, the rows matching the
 * search and every filter but the column's own: by option value for an
 * options column (its options first, in order), by "true" and "false" for
 * a boolean one, by display text for the others, and apart the rows
 * without a value (the "No value" choice, offered while any row has none,
 * `hasEmptyValues`). A text or number column's matches (`countMatches`)
 * are those rows, how many of them a filter of the column keeps as it is
 * typed, and a number column's numbers over them, sorted.
 *
 * `getFacets`, `getMatchCounts` and `hasEmptyValues` read them for a row
 * model, each kept across runs of its engine: a filter toggled in the
 * popover counts the column again only when the other filters, the search
 * or the rows change.
 */
import type { EngineColumn } from "./columns"
import type { Core } from "./core"
import type { DataTableRowModel } from "./engine"
import {
  boundsOf,
  columnPredicate,
  compileFilter,
  hasBound,
  type NumberBounds,
  type RowPredicate,
  type SearchIndex,
} from "./filter"
import { hasNoValue, type Formatter } from "./format"
import type {
  DataTableFilterValue,
  DataTableValue,
  DataTableView,
} from "./types"
import { toBoolean, toNumber } from "./values"
import { sameFilters } from "./view"

/**
 * How many rows `predicate` keeps per value of `column`, and without a
 * value (`empty`; see the module comment).
 */
type Facets = {
  readonly counts: ReadonlyMap<string, number>
  readonly empty: number
}

function countFacets<T>(
  core: Core<T>,
  column: EngineColumn<T>,
  predicate: RowPredicate<T> | null,
  formatter: Formatter<T>
): Facets {
  const { items } = core
  // The keys a filter's choices are counted by, each from 0; the values the
  // options do not list follow them as they come.
  const counts = new Map<string, number>(
    column.type === "boolean"
      ? [
          ["true", 0],
          ["false", 0],
        ]
      : column.options.map((option) => [option.value, 0])
  )
  const keyOf =
    column.type === "boolean"
      ? (value: DataTableValue) => String(toBoolean(value))
      : column.type === "options"
        ? String
        : (value: DataTableValue) => formatter.format(column, value)
  let empty = 0
  for (let i = 0; i < items.length; i++) {
    if (predicate && !predicate(i, items[i])) continue
    const value = column.getValue(items[i])
    if (hasNoValue(column, value)) empty++
    else {
      const key = keyOf(value)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return { counts, empty }
}

/**
 * The rows a predicate keeps (the search and every filter but the column's
 * own, as for `Facets`) and how many of them a filter of the column keeps:
 * a number or text column's, as its filter is typed; a number column's
 * values too.
 */
type MatchCounts = {
  /** How many rows the predicate keeps. */
  readonly total: number
  /** The numbers of those rows that have one, ascending; none for a text column. */
  readonly values: Float64Array
  /**
   * How many of those rows `filter` keeps as well (all of them for
   * `null`), as the column's filter would: by its own `filter` function
   * when it has one.
   */
  readonly count: (filter: DataTableFilterValue | null) => number
}

/** The index of the first of the ascending `values` that `before` refuses. */
function boundary(values: Float64Array, before: (value: number) => boolean) {
  let low = 0
  let high = values.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (before(values[middle])) low = middle + 1
    else high = middle
  }
  return low
}

function countMatches<T>(
  core: Core<T>,
  column: EngineColumn<T>,
  predicate: RowPredicate<T> | null,
  index: SearchIndex<T>
): MatchCounts {
  const { items } = core
  const kept: Array<number> = []
  const numbers: Array<number> = []
  let empty = 0
  for (let i = 0; i < items.length; i++) {
    if (predicate && !predicate(i, items[i])) continue
    kept.push(i)
    const value = column.getValue(items[i])
    const number = column.type === "number" ? toNumber(value) : undefined
    if (number !== undefined) numbers.push(number)
    else if (hasNoValue(column, value)) empty++
  }
  const values = Float64Array.from(numbers).sort()
  const total = kept.length
  // The numbers within `bounds`, each end included unless exclusive.
  const between = ({ min, max, above, below }: NumberBounds) =>
    Math.max(
      0,
      boundary(values, (value) => (below ? value < max : value <= max)) -
        boundary(values, (value) => (above ? value <= min : value < min))
    )
  return {
    total,
    values,
    count(filter) {
      if (!filter) return total
      const ranges =
        filter.type === "number" ? filter.ranges.filter(hasBound) : []
      // Ranges side by side may overlap: their rows are counted one by one.
      if (column.filter || filter.type !== "number" || ranges.length > 1) {
        const own = columnPredicate(column, filter, index, items.length)
        if (!own) return total
        let count = 0
        for (const position of kept) if (own(position, items[position])) count++
        return count
      }
      if (!ranges.length && !filter.empty) return total
      return (
        (ranges.length ? between(boundsOf(ranges[0])) : 0) +
        (filter.empty ? empty : 0)
      )
    },
  }
}

const NO_FACETS: Facets = { counts: new Map(), empty: 0 }

/** The filters but `id`'s: what a column's facets are counted over. */
function othersThan(filters: DataTableView["filters"], id: string) {
  const others: Record<string, DataTableFilterValue> = { ...filters }
  delete others[id]
  return others
}

/** A column's facets by its id, with what they were counted over, by the rows they are of. */
const facetCache = new WeakMap<
  Core<unknown>,
  Map<
    string,
    {
      formatter: Formatter<unknown>
      search: Uint8Array | null
      filters: DataTableView["filters"]
      server: boolean
      counts: Facets
    }
  >
>()
/** A text or number column's matches, kept as the facets are. */
const matchCache = new WeakMap<
  Core<unknown>,
  Map<
    string,
    {
      column: EngineColumn<unknown>
      search: Uint8Array | null
      filters: DataTableView["filters"]
      numbers: MatchCounts
    }
  >
>()
/** Whether a column has empty values, by the rows and column (`EngineColumn`) read. */
const emptyCache = new WeakMap<Core<unknown>, WeakMap<object, boolean>>()

/** The cache of `rows` in `caches`, made on first use. */
function cacheOf<TCache>(
  caches: WeakMap<Core<unknown>, TCache>,
  rows: Core<unknown>,
  create: () => TCache
) {
  let cache = caches.get(rows)
  if (!cache) caches.set(rows, (cache = create()))
  return cache
}

/**
 * How many rows match the search and every filter but `column`'s, per
 * value (option values for an options column, "true" and "false" for a
 * boolean one, display text for others), and without a value.
 */
function getFacets<T>(model: DataTableRowModel<T>, id: string): Facets {
  const parts = model.searchParts()
  const { core: rows, formatter, search, filters, server } = parts
  const column = parts.model.byId.get(id)
  if (!column) return NO_FACETS
  const others = othersThan(filters, id)
  const byColumn = cacheOf(facetCache, rows, () => new Map())
  const cached = byColumn.get(id)
  if (
    cached?.formatter === formatter &&
    cached.search === search &&
    cached.server === server &&
    sameFilters(cached.filters, others)
  )
    return cached.counts
  const predicate = server
    ? null
    : compileFilter(
        parts.model.byId,
        filters,
        parts.index,
        search,
        rows.items.length,
        id
      )
  const counts = countFacets(rows, column, predicate, formatter)
  byColumn.set(id, {
    formatter: formatter as Formatter<unknown>,
    search,
    filters: others,
    server,
    counts,
  })
  return counts
}

/**
 * A text or number column's matches (`MatchCounts`): the rows matching the
 * search and every filter but its own, and how many of them a filter
 * keeps; `null` for another column, or in server mode (the table holds
 * only the rows loaded).
 */
function getMatchCounts<T>(
  model: DataTableRowModel<T>,
  id: string
): MatchCounts | null {
  const parts = model.searchParts()
  const { core: rows, search, filters, server } = parts
  const column = parts.model.byId.get(id)
  if (!column || (column.type !== "number" && column.type !== "text") || server)
    return null
  const others = othersThan(filters, id)
  const byColumn = cacheOf(matchCache, rows, () => new Map())
  const cached = byColumn.get(id)
  if (
    cached?.column === column &&
    cached.search === search &&
    sameFilters(cached.filters, others)
  )
    return cached.numbers
  const predicate = compileFilter(
    parts.model.byId,
    filters,
    parts.index,
    search,
    rows.items.length,
    id
  )
  const numbers = countMatches(rows, column, predicate, parts.index)
  byColumn.set(id, {
    column: column as EngineColumn<unknown>,
    search,
    filters: others,
    numbers,
  })
  return numbers
}

/**
 * Whether any row, matching or not, has no value in `column`: its filter
 * then offers "No value" (in server mode, the loaded rows).
 */
function hasEmptyValues<T>(model: DataTableRowModel<T>, id: string) {
  const { core: rows, model: columns } = model.searchParts()
  const column = columns.byId.get(id)
  if (!column) return false
  const byColumn = cacheOf(emptyCache, rows, () => new WeakMap())
  let empty = byColumn.get(column)
  if (empty === undefined) {
    empty = rows.items.some((item) => hasNoValue(column, column.getValue(item)))
    byColumn.set(column, empty)
  }
  return empty
}

export { countFacets, countMatches, getFacets, getMatchCounts, hasEmptyValues }
export type { Facets, MatchCounts }
