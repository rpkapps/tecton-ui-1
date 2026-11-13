/**
 * Facets (§5.4): what a column's filter offers and counts, for
 * `DataTableFilter`'s popover and the query language's suggestions. A
 * module of its own, read through the row model's `searchParts`, so a
 * table without those parts does not bundle it.
 *
 * Facets (`countFacets`) count, per value of a column, the rows matching the
 * search and every filter but the column's own: by option value for an
 * options column, by "true" and "false" for a boolean one, by display text
 * for the others, and apart the rows without a value (the "No value"
 * choice, offered while any row has none, `hasEmptyValues`). A number
 * column's (`countNumbers`) are its numbers over those rows, sorted: the
 * range they span, and the rows a number filter keeps as it is typed.
 *
 * `getFacets`, `getNumberFacets` and `hasEmptyValues` read them for a row
 * model, each kept across runs of its engine: a filter toggled in the
 * popover counts the column again only when the other filters, the search
 * or the rows change.
 */
import type { EngineColumn } from "./columns"
import type { Core } from "./core"
import type { DataTableRowModel } from "./engine"
import {
  columnPredicate,
  compileFilter,
  type RowPredicate,
  type SearchIndex,
} from "./filter"
import { hasNoValue, type Formatter } from "./format"
import type { DataTableFilterValue, DataTableView } from "./types"
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
  const others = new Map<string, number>()
  const add = (key: string) => others.set(key, (others.get(key) ?? 0) + 1)
  let empty = 0
  if (column.type === "options") {
    const counts = new Uint32Array(column.options.length)
    for (let i = 0; i < items.length; i++) {
      if (predicate && !predicate(i, items[i])) continue
      const value = column.getValue(items[i])
      if (hasNoValue(column, value)) {
        empty++
        continue
      }
      const option = column.optionIndex.get(String(value))
      if (option === undefined) add(String(value))
      else counts[option]++
    }
    const facets = new Map(
      column.options.map((option, i) => [option.value, counts[i]])
    )
    for (const [key, count] of others) facets.set(key, count)
    return { counts: facets, empty }
  }
  if (column.type === "boolean") {
    let yes = 0
    let no = 0
    for (let i = 0; i < items.length; i++) {
      if (predicate && !predicate(i, items[i])) continue
      const value = toBoolean(column.getValue(items[i]))
      if (value === undefined) empty++
      else if (value) yes++
      else no++
    }
    return {
      counts: new Map([
        ["true", yes],
        ["false", no],
      ]),
      empty,
    }
  }
  for (let i = 0; i < items.length; i++) {
    if (predicate && !predicate(i, items[i])) continue
    const text = formatter.text(column, items[i])
    if (text === "") empty++
    else add(text)
  }
  return { counts: others, empty }
}

/**
 * A number column's values over the rows a predicate keeps (the search and
 * every filter but the column's own, as for `Facets`).
 */
type NumberFacets = {
  /** How many rows the predicate keeps. */
  readonly total: number
  /** The numbers of those rows that have one, ascending. */
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

function countNumbers<T>(
  core: Core<T>,
  column: EngineColumn<T>,
  predicate: RowPredicate<T> | null,
  index: SearchIndex<T>
): NumberFacets {
  const { items } = core
  const kept: Array<number> = []
  const numbers: Array<number> = []
  let empty = 0
  for (let i = 0; i < items.length; i++) {
    if (predicate && !predicate(i, items[i])) continue
    kept.push(i)
    const value = column.getValue(items[i])
    const number = toNumber(value)
    if (number !== undefined) numbers.push(number)
    else if (hasNoValue(column, value)) empty++
  }
  const values = Float64Array.from(numbers).sort()
  const total = kept.length
  // The numbers from `min` to `max`, each included unless exclusive.
  const between = (min: number, max: number, above: boolean, below: boolean) =>
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
      if (column.filter || filter.type !== "number") {
        const own = columnPredicate(column, filter, index, items.length)
        if (!own) return total
        let count = 0
        for (const position of kept) if (own(position, items[position])) count++
        return count
      }
      const bounded = filter.min !== undefined || filter.max !== undefined
      if (!bounded && !filter.empty) return total
      return (
        (bounded
          ? between(
              filter.min ?? -Infinity,
              filter.max ?? Infinity,
              filter.minExclusive === true,
              filter.maxExclusive === true
            )
          : 0) + (filter.empty ? empty : 0)
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
/** A number column's numbers, kept as the facets are. */
const numberCache = new WeakMap<
  Core<unknown>,
  Map<
    string,
    {
      column: EngineColumn<unknown>
      search: Uint8Array | null
      filters: DataTableView["filters"]
      numbers: NumberFacets
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
 * A number column's numbers over the rows matching the search and every
 * filter but its own, and how many of those rows a filter keeps; `null`
 * for another column, or in server mode (the table holds only the rows
 * loaded).
 */
function getNumberFacets<T>(
  model: DataTableRowModel<T>,
  id: string
): NumberFacets | null {
  const parts = model.searchParts()
  const { core: rows, search, filters, server } = parts
  const column = parts.model.byId.get(id)
  if (!column || column.type !== "number" || server) return null
  const others = othersThan(filters, id)
  const byColumn = cacheOf(numberCache, rows, () => new Map())
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
  const numbers = countNumbers(rows, column, predicate, parts.index)
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

export { countFacets, countNumbers, getFacets, getNumberFacets, hasEmptyValues }
export type { Facets, NumberFacets }
