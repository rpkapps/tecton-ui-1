/**
 * The rows the suggestions count, through the engine's own filtering: a
 * query source answers, for a column and the rest of the query (its
 * filters and search, the column's own filter left out as the filter
 * popover's counts leave it), how many rows have each value (`countFacets`),
 * the range of a number or date column, how many fall in each of a list of
 * intervals (years, months, presets), and which of a text column's values
 * contain what is typed (by the search index, whose `indexOf` scans find
 * them without formatting the other rows).
 *
 * The rest's predicate is compiled once and kept for the next questions
 * about the same rest (a keystroke asks several), and so are a number or
 * date column's numbers over it, sorted in one pass: its range is their
 * ends, and an interval's rows two binary searches.
 *
 * `createQuerySource` takes the engine's parts, so a table's source shares
 * its search index; `querySourceOf` builds them from items, for tests and
 * for a table that has none at hand.
 */
import { getColumnModel, type ColumnModel, type EngineColumn } from "../columns"
import { buildCore, type Core } from "../core"
import { countFacets, type Facets } from "../facets"
import {
  compileFilter,
  createSearchIndex,
  searchMask,
  type RowPredicate,
  type SearchIndex,
} from "../filter"
import {
  foldText,
  getFormatter,
  hasNoValue,
  type FormatLabels,
  type Formatter,
} from "../format"
import type { DataTableColumns } from "../types"
import { sameFilters } from "../view"
import type { QueryView } from "./types"

/** A text column's value that contains what is typed, with its number of rows. */
type TextMatch = {
  /** The display text. */
  readonly text: string
  readonly count: number
  /** Whether the text starts with what is typed. */
  readonly prefix: boolean
}

type QuerySource = {
  /** Rows per value of `column` over `rest` (`countFacets`), the column's own filter left out. */
  facets: (column: string, rest: QueryView) => Facets
  /** Rows of `rest` without a value in `column` (its "No value"). */
  missing: (column: string, rest: QueryView) => number
  /** The smallest and largest number (a date's time) of `column` over `rest`; `null` for none. */
  extent: (
    column: string,
    rest: QueryView
  ) => { min: number; max: number } | null
  /**
   * Rows of `rest` whose number (a date's time) in `column` is in each
   * interval `[bounds[i], bounds[i + 1])`: `bounds.length - 1` counts.
   */
  histogram: (
    column: string,
    rest: QueryView,
    bounds: ReadonlyArray<number>
  ) => Uint32Array
  /**
   * The values of a column whose display text contains `fragment` (case
   * and accents folded), over `rest`: those it starts with first, then by
   * number of rows, the first `limit`.
   */
  textMatches: (
    column: string,
    rest: QueryView,
    fragment: string,
    limit: number
  ) => Array<TextMatch>
}

type QuerySourceParts<T> = {
  model: ColumnModel<T>
  /** Every row, depth first (`Core`). */
  core: Core<T>
  formatter: Formatter<T>
  index: SearchIndex<T>
  /** Hidden columns, which search does not read. */
  hidden?: ReadonlyArray<string>
}

/** How many previous rests' predicates and numbers are kept. */
const KEPT = 4

/**
 * The value `cache` keeps for `rest` and `key` (a column or the one left
 * out), else `make`'s, kept in its place (the last of `KEPT` goes).
 */
function kept<TKey, TValue>(
  cache: Array<{ rest: QueryView; key: TKey; value: TValue }>,
  rest: QueryView,
  key: TKey,
  make: () => TValue
): TValue {
  const found = cache.find(
    (entry) =>
      entry.key === key &&
      entry.rest.search === rest.search &&
      sameFilters(entry.rest.filters, rest.filters)
  )
  if (found) return found.value
  const value = make()
  cache.unshift({ rest, key, value })
  if (cache.length > KEPT) cache.pop()
  return value
}

function createQuerySource<T>({
  model,
  core,
  formatter,
  index,
  hidden = [],
}: QuerySourceParts<T>): QuerySource {
  const { items } = core
  const hiddenIds = new Set(hidden)
  const searched = model.leaves.filter(
    (column) => column.searchable && !hiddenIds.has(column.id)
  )
  const predicates: Array<{
    rest: QueryView
    key: string
    value: RowPredicate<T> | null
  }> = []
  const masks = new Map<string, Uint8Array | null>()
  const predicateOf = (rest: QueryView, exclude: string) =>
    kept(predicates, rest, exclude, () => {
      const query = rest.search.trim()
      let mask = masks.get(query)
      if (mask === undefined) {
        mask = searchMask(index, searched, query, items.length)
        if (masks.size >= KEPT) masks.clear()
        masks.set(query, mask)
      }
      return compileFilter(
        model.byId,
        rest.filters,
        index,
        mask,
        items.length,
        exclude
      )
    })
  const columnOf = (id: string): EngineColumn<T> | undefined =>
    model.byId.get(id)
  const sorted: Array<{
    rest: QueryView
    key: EngineColumn<T>
    value: { numbers: Float64Array; missing: number }
  }> = []
  /**
   * The matching rows' numbers (dates' times) in `column`, sorted, and how
   * many have no value: one pass over the rows for every question about
   * the column (its range, its presets, years and months).
   */
  const numbersOf = (column: EngineColumn<T>, rest: QueryView) =>
    kept(sorted, rest, column, () => {
      const predicate = predicateOf(rest, column.id)
      const all = new Float64Array(items.length)
      let count = 0
      let missing = 0
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (predicate && !predicate(i, item)) continue
        const n = column.sortValue(item)
        if (typeof n === "number") all[count++] = n
        else if (hasNoValue(column, column.getValue(item))) missing++
      }
      return { numbers: all.slice(0, count).sort(), missing }
    })
  const ordered = (column: EngineColumn<T>) =>
    column.type === "number" || column.type === "date"
  /** How many of `sorted` are below `n`. */
  const below = (sorted: Float64Array, n: number) => {
    let low = 0
    let high = sorted.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (sorted[middle] < n) low = middle + 1
      else high = middle
    }
    return low
  }

  return {
    facets(id, rest) {
      const column = columnOf(id)
      if (!column) return { counts: new Map(), empty: 0 }
      return countFacets(core, column, predicateOf(rest, id), formatter)
    },
    missing(id, rest) {
      const column = columnOf(id)
      if (!column) return 0
      if (ordered(column)) return numbersOf(column, rest).missing
      const predicate = predicateOf(rest, id)
      let count = 0
      for (let i = 0; i < items.length; i++)
        if (
          (!predicate || predicate(i, items[i])) &&
          hasNoValue(column, column.getValue(items[i]))
        )
          count++
      return count
    },
    extent(id, rest) {
      const column = columnOf(id)
      if (!column || !ordered(column)) return null
      const { numbers } = numbersOf(column, rest)
      return numbers.length
        ? { min: numbers[0], max: numbers[numbers.length - 1] }
        : null
    },
    histogram(id, rest, bounds) {
      const counts = new Uint32Array(Math.max(0, bounds.length - 1))
      const column = columnOf(id)
      if (!column || !ordered(column) || counts.length === 0) return counts
      const { numbers } = numbersOf(column, rest)
      let previous = below(numbers, bounds[0])
      for (let i = 0; i < counts.length; i++) {
        const next = below(numbers, bounds[i + 1])
        counts[i] = Math.max(0, next - previous)
        previous = next
      }
      return counts
    },
    textMatches(id, rest, fragment, limit) {
      const column = columnOf(id)
      const query = foldText(fragment)
      if (!column || !query) return []
      const predicate = predicateOf(rest, id)
      const { text, offsets } = index.texts(column)
      const found = new Map<string, { count: number; prefix: boolean }>()
      let row = 0
      let from = 0
      for (;;) {
        const at = text.indexOf(query, from)
        if (at === -1) break
        while (offsets[row + 1] <= at) row++
        from = offsets[row + 1]
        const item = items[row]
        if (predicate && !predicate(row, item)) continue
        if (hasNoValue(column, column.getValue(item))) continue
        const shown = formatter.text(column, item)
        const entry = found.get(shown)
        if (entry) entry.count++
        else found.set(shown, { count: 1, prefix: at === offsets[row] })
      }
      return [...found]
        .map(([shown, { count, prefix }]) => ({ text: shown, count, prefix }))
        .sort(
          (a, b) =>
            Number(b.prefix) - Number(a.prefix) ||
            b.count - a.count ||
            a.text.localeCompare(b.text, formatter.locale)
        )
        .slice(0, limit)
    },
  }
}

type QuerySourceOptions<T> = {
  /** A BCP 47 tag; `en-US` when left out or invalid. */
  locale?: string
  labels?: FormatLabels
  /** A tree's children: their rows count too. */
  itemToChildren?: (item: T) => ReadonlyArray<T> | undefined
  hidden?: ReadonlyArray<string>
}

/** A query source over `items`, building the engine's parts for them. */
function querySourceOf<T>(
  items: ReadonlyArray<T>,
  columns: DataTableColumns<T>,
  { locale, labels, itemToChildren, hidden }: QuerySourceOptions<T> = {}
): QuerySource {
  const model = getColumnModel(columns)
  const formatter = getFormatter(model, locale, labels)
  let position = 0
  const core = buildCore(items, () => String(position++), itemToChildren)
  return createQuerySource({
    model,
    core,
    formatter,
    index: createSearchIndex(core.items, formatter),
    hidden,
  })
}

export { createQuerySource, querySourceOf }
export type { QuerySource, QuerySourceOptions, QuerySourceParts, TextMatch }
