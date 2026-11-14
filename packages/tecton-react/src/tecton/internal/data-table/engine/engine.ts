/**
 * The row pipeline: items in, the rows to render out, with the lookups the
 * parts need to work on rows that are not rendered.
 *
 * `createDataTableEngine()` returns an engine to keep for the table's
 * lifetime (one per `DataTable`); `run(input)` returns the row model. One
 * stage per concern, each memoized on its inputs, so a run where nothing
 * changed returns the previous model itself, and changing one input redoes
 * only the stages after it:
 *
 *   items → core rows (`core.ts`: positions, ids, tree links)
 *     → search and filters (`filter.ts`; the search index is built in idle
 *       time while the table is filterable, else on the first search)
 *     → grouping (`group.ts`) → sorting (`sort.ts`; ranks kept per data and
 *       column, prepared in idle time) of rows within each tree parent and
 *       each group
 *     → display rows by expanded / collapsed state (`rows.ts`; rows that
 *       did not change are the previous build's objects) → page → model
 *       (totals, group contents and lookups computed when asked for; a
 *       column's facets from its `searchParts`, `facets.ts`).
 *
 * View pieces, `expanded` and `collapsedGroups` are compared by value, so
 * equal ones made anew each render redo nothing. `itemToId`,
 * `itemToChildren` and `isItemDisabled` are read through their latest
 * values (the root passes inline functions): the rows are rebuilt for new
 * `items`; for the same `items`, when an expanded row whose children were
 * `undefined` now has some (loaded on expanding), but not when a row whose
 * children were loaded gets new ones: pass new `items` for that; and the
 * model changes when `isItemDisabled` gives other answers. It is asked for
 * every item when the items or the function change, not on other runs:
 * pass a function that stays the same (module level, memoized) to keep a
 * large table's runs from asking it again.
 *
 * Data modes (§4.3): in `"client"` mode the engine searches, filters, sorts
 * and pages. In `"server"` mode `items` are the server's rows for the view:
 * the engine does none of that (while the view has a search, a tree's rows
 * with children are shown expanded, as the server's matches are below
 * them), but still builds the tree, groups and aggregates the loaded rows,
 * and counts pages from `rowCount`.
 *
 * In a filtered tree, the results are the matching rows and their whole
 * subtrees (a match's children belong to it, shown as it is expanded). The
 * ancestors kept to show where matches are are context rows: shown, but
 * not results. Select all (`matchingIds`), `matchingCount`, all-matching,
 * `filteredItems` and the totals all count the results, and only them. A
 * tree's totals sum its result leaf rows only (rows without children), so
 * a parent and its children are not counted twice.
 */
import { aggregateColumns, summarize, type Summary } from "./aggregate"
import { getColumnModel, type ColumnModel, type EngineColumn } from "./columns"
import {
  buildCore,
  childrenLoaded,
  NO_ROWS,
  type Core,
  type IdIssues,
  type RowSet,
} from "./core"
import {
  compileFilter,
  createSearchIndex,
  filterRows,
  searchMask,
  type RowPredicate,
  type SearchIndex,
} from "./filter"
import { getFormatter, type FormatLabels, type Formatter } from "./format"
import {
  groupRows,
  orderGroups,
  type Grouping,
  type OrderedGroups,
} from "./group"
import { createIdleWorker } from "./idle"
import { layoutColumns } from "./layout"
import {
  DEFAULT_PAGE_SIZE,
  getPageCount,
  resolvePageSize,
  clampPage,
} from "./pagination"
import {
  ALL_OPEN,
  buildRows,
  createRowCache,
  displayOrder,
  indexRows,
  lazy,
  pageRows,
  type ClosedGroups,
  type EngineRow,
  type TotalsRow,
} from "./rows"
import { rankingTask, sortRows, type SortPass } from "./sort"
import type {
  DataTableColumns,
  DataTableSort,
  DataTableValue,
  DataTableView,
} from "./types"
import { sameFilters, sameIds, sameSorting } from "./view"

type DataTableDataMode = "client" | "server"

type DataTableEngineInput<T> = {
  items: ReadonlyArray<T>
  columns: DataTableColumns<T>
  /** A reconciled view (`reconcileView`). */
  view: DataTableView
  /** A BCP 47 tag; `en-US` when left out or invalid. */
  locale?: string
  /** A boolean's display text; "Yes" / "No" when left out. */
  labels?: FormatLabels
  /** `String(item.id)` by default. */
  itemToId?: (item: T) => string
  /** A tree's children; `undefined` for none (in server mode: not loaded yet). */
  itemToChildren?: (item: T) => ReadonlyArray<T> | undefined
  isItemDisabled?: (item: T) => boolean
  /** `"client"` by default. */
  dataMode?: DataTableDataMode
  /** The root's `sortable` (default `true`): without it nothing sorts and no ranks are prepared. */
  sortable?: boolean
  /** The root's `filterable` (default `false`): with it the search index is prepared in idle time. */
  filterable?: boolean
  /** Expanded tree rows, by item id. */
  expanded?: ReadonlyArray<string> | ReadonlySet<string>
  /**
   * Closed groups, by group key: groups are open unless listed; or which
   * are closed (`ClosedGroups`, every group but some with `all`).
   */
  collapsedGroups?: ReadonlyArray<string> | ReadonlySet<string> | ClosedGroups
  /** Pages from 1; `null` or left out for no pagination. */
  pagination?: { page: number; pageSize: number } | null
  /** Server mode: the number of rows the view matches on the server. */
  rowCount?: number
}

/**
 * What the table searches and filters, for another reader of its rows (a
 * column's facets, `facets.ts`; the query language's suggestions,
 * `query/source.ts`): the columns, every row, the formatter and the search
 * index (shared: its texts are built once), the hidden columns, which
 * search does not read, the rows the search matches and the filters.
 */
type SearchParts<T> = {
  readonly model: ColumnModel<T>
  readonly core: Core<T>
  readonly formatter: Formatter<T>
  readonly index: SearchIndex<T>
  readonly hidden: ReadonlyArray<string>
  /** The rows the search matches, as flags; `null` for no search, or in server mode. */
  readonly search: Uint8Array | null
  readonly filters: DataTableView["filters"]
  readonly server: boolean
}

type DataTableRowModel<T> = {
  /** The body rows to render: the page's when paginated (with its continued ancestors first). */
  readonly rows: ReadonlyArray<EngineRow<T>>
  /** Every body row, on every page. */
  readonly allRows: ReadonlyArray<EngineRow<T>>
  /** The page shown (clamped), from 1. */
  readonly page: number
  readonly pageCount: number
  readonly pageSize: number
  /** The item and group rows shown, on every page: what client pages count. */
  readonly displayRowCount: number
  /** The items the view matches: the server's `rowCount` in server mode, `matchingCount` in client mode. */
  readonly rowCount: number
  /** Every item, at every level of a tree. */
  readonly itemCount: number
  /** The items search and filters keep (all in server mode), at every level, context rows not counted. */
  readonly matchingCount: number
  /** Whether search or filters apply (never in server mode). */
  readonly filtering: boolean
  /** Duplicate and missing item ids, for a development warning. */
  readonly idIssues: IdIssues
  /** The index in `rows` of an item id or group key; -1 when not there. */
  indexOf: (id: string) => number
  /** The index in `allRows` of an item id or group key; -1 when not there. */
  indexOfRow: (id: string) => number
  /** The item with this id, matching or not. */
  item: (id: string) => T | undefined
  /** `isItemDisabled` of the item with this id. */
  isDisabled: (id: string) => boolean
  /** The display text of an item's row header cell, or a group's text: for type-ahead. */
  textOf: (id: string) => string
  /** The ids of the matching items, at every level, in display order. */
  matchingIds: () => ReadonlyArray<string>
  /**
   * The ids "select all" selects: the matching items that are not
   * disabled, in display order. The same array while the rows that match,
   * their order and `isItemDisabled`'s answers stay (a group or tree row
   * opening or closing, a new page keep it).
   */
  selectableIds: () => ReadonlyArray<string>
  /** Every item, depth first, in data order. */
  allItems: () => ReadonlyArray<T>
  /**
   * Every item's id, in `allItems`' order: the same array while the items
   * are (`liveChanges.ts` compares two models' ids).
   */
  readonly ids: ReadonlyArray<string>
  /** Whether an item has this id, at any level of a tree, matching or not. */
  has: (id: string) => boolean
  /** A tree item's parent's id: `null` at the top level, in a flat list, or for an unknown id. */
  treeParentOf: (id: string) => string | null
  /** Whether a tree item's children are `undefined`: not loaded yet (server mode). */
  childrenUnloaded: (id: string) => boolean
  /**
   * Whether the search and filters keep an item (a match, or a filtered
   * tree's context row): shown once the tree rows and groups over it open.
   */
  kept: (id: string) => boolean
  /** The matching items, at every level, in display order. */
  filteredItems: () => ReadonlyArray<T>
  /** The items of the item rows in `rows`. */
  pageItems: () => ReadonlyArray<T>
  /** Every group's key, nested and closed ones too: for "collapse all". */
  groupKeys: () => ReadonlyArray<string>
  /** A group's item ids, nested groups included, in display order. */
  groupIds: (key: string) => ReadonlyArray<string>
  /**
   * A group's item ids that can be selected (not disabled), in display
   * order: what its checkbox selects. The same array while the groups and
   * `isItemDisabled`'s answers stay (a group opening or closing keeps it).
   */
  groupSelectableIds: (key: string) => ReadonlyArray<string>
  groupItems: (key: string) => ReadonlyArray<T>
  /** A group's subtotals, by column id; kept while the groups stay. */
  groupAggregates: (key: string) => Readonly<Record<string, DataTableValue>>
  /**
   * The keys of the groups an item (by id) or a group (by key) is in, the
   * outermost first; empty when not grouped.
   */
  groupPath: (id: string) => ReadonlyArray<string>
  /** The totals row over the matching items (a tree's matching leaves). */
  totals: () => TotalsRow<T>
  /**
   * What the table searches and filters, the same object for the same
   * model: what a column's facets are counted over (`facets.ts`).
   */
  searchParts: () => SearchParts<T>
}

type DataTableEngine<T> = {
  run: (input: DataTableEngineInput<T>) => DataTableRowModel<T>
}

const EMPTY_SET: ReadonlySet<string> = new Set()
const NO_IDS: ReadonlyArray<string> = []

/** An item's id when the table has no `itemToId`: `String(item.id)`. */
function defaultItemToId(item: unknown) {
  return String((item as { id?: unknown } | null)?.id)
}

/** The last result of `fn`, recomputed when an argument changes (`Object.is`). */
function memoOne<TArgs extends Array<unknown>, TResult>(
  fn: (...args: TArgs) => TResult
) {
  let last: { args: TArgs; result: TResult } | undefined
  return (...args: TArgs): TResult => {
    if (last && last.args.every((arg, i) => Object.is(arg, args[i])))
      return last.result
    const result = fn(...args)
    last = { args, result }
    return result
  }
}

/** `next`, or the previous value when it is equal by `same`: keeps identities steady for the memos. */
function steady<TValue>(same: (a: TValue, b: TValue) => boolean) {
  let previous: { value: TValue } | undefined
  return (next: TValue): TValue => {
    if (previous && same(previous.value, next)) return previous.value
    previous = { value: next }
    return next
  }
}

function toSet(ids: ReadonlyArray<string> | ReadonlySet<string> | undefined) {
  if (!ids) return EMPTY_SET
  return ids instanceof Set ? ids : new Set(ids)
}

const firstDays = new Map<string, number>()

/**
 * A locale's first day of the week, 1 (Monday) to 7 (Sunday): from
 * `Intl.Locale`'s week info where the engine has it, else Monday.
 */
function firstDayOf(locale: string) {
  let day = firstDays.get(locale)
  if (day === undefined) {
    type WeekInfo = { firstDay?: number }
    const info = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo
      weekInfo?: WeekInfo
    }
    day = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay ?? 1
    firstDays.set(locale, day)
  }
  return day
}

function closedOf(
  collapsed: DataTableEngineInput<unknown>["collapsedGroups"]
): ClosedGroups {
  if (!collapsed) return ALL_OPEN
  return "all" in collapsed ? collapsed : { all: false, keys: toSet(collapsed) }
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a === b) return true
  if (a.size !== b.size) return false
  for (const id of a) if (!b.has(id)) return false
  return true
}

function sameFlags(a: Uint8Array | null, b: Uint8Array | null) {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function createDataTableEngine<T>(): DataTableEngine<T> {
  // The latest functions, read by the stages.
  const latest: {
    itemToId: (item: T) => string
    itemToChildren: ((item: T) => ReadonlyArray<T> | undefined) | undefined
  } = {
    itemToId: defaultItemToId,
    itemToChildren: undefined,
  }
  const worker = createIdleWorker()
  const cache = createRowCache<T>()
  /** Groups' selectable ids and subtotals, by the groups they are of (`model`). */
  const groupCache = new WeakMap<
    object,
    {
      disabled: Uint8Array | null
      aggregates: ReadonlyArray<EngineColumn<T>>
      ids: Map<string, ReadonlyArray<string>>
      summaries: Map<number, Summary>
    }
  >()
  /** The positions a filtered set keeps, as flags, by the set. */
  const keptCache = new WeakMap<RowSet, Uint8Array>()
  /** A tree's parent positions (-1 at the top level), by the rows they are of. */
  const parentCache = new WeakMap<Core<T>, Int32Array>()
  const parentsOf = (rows: Core<T>) => {
    let parents = parentCache.get(rows)
    if (!parents) {
      parents = new Int32Array(rows.items.length).fill(-1)
      rows.children?.forEach((list, position) => {
        if (list) for (const child of list) parents![child] = position
      })
      parentCache.set(rows, parents)
    }
    return parents
  }

  const steadySorting = steady<ReadonlyArray<DataTableSort>>(sameSorting)
  const steadyFilters = steady<DataTableView["filters"]>(sameFilters)
  const steadyGrouping = steady<ReadonlyArray<string>>(sameIds)
  const steadyHidden = steady<ReadonlyArray<string>>(sameIds)
  const steadyExpanded = steady<ReadonlySet<string>>(sameSet)
  const steadyCollapsed = steady<ClosedGroups>(
    (a, b) => a.all === b.all && sameSet(a.keys, b.keys)
  )
  const steadyDisabled = steady<Uint8Array | null>(sameFlags)

  // Bumped when loaded children call for new core rows over the same items.
  let loads = 0
  const core = memoOne(
    (items: ReadonlyArray<T>, tree: boolean, _loads: number): Core<T> =>
      buildCore(
        items,
        (item) => latest.itemToId(item),
        tree ? (item) => latest.itemToChildren?.(item) : undefined
      )
  )
  const searchColumns = memoOne(
    (model: ColumnModel<T>, hidden: ReadonlyArray<string>) => {
      const hiddenIds = new Set(hidden)
      return model.leaves.filter(
        (column) => column.searchable && !hiddenIds.has(column.id)
      )
    }
  )
  const searchIndex = memoOne(
    (rows: Core<T>, formatter: Formatter<T>): SearchIndex<T> =>
      createSearchIndex(rows.items, formatter)
  )
  const mask = memoOne(
    (
      index: SearchIndex<T>,
      columns: ReadonlyArray<EngineColumn<T>>,
      search: string,
      rowCount: number
    ) => searchMask(index, columns, search, rowCount)
  )
  const predicate = memoOne(
    (
      model: ColumnModel<T>,
      index: SearchIndex<T>,
      search: Uint8Array | null,
      filters: DataTableView["filters"],
      rowCount: number
    ): RowPredicate<T> | null =>
      compileFilter(model.byId, filters, index, search, rowCount)
  )
  const filtered = memoOne(
    (rows: Core<T>, filter: RowPredicate<T> | null): RowSet =>
      filter ? filterRows(rows, filter) : rows
  )
  const grouped = memoOne(
    (
      rows: Core<T>,
      set: RowSet,
      model: ColumnModel<T>,
      grouping: ReadonlyArray<string>
    ): Grouping<T> | null => {
      const columns = grouping.flatMap((id) => model.byId.get(id) ?? [])
      if (!columns.length || set.children) return null
      return groupRows(rows, set.roots, columns)
    }
  )
  const sortPasses = memoOne(
    (
      model: ColumnModel<T>,
      sorting: ReadonlyArray<DataTableSort>,
      enabled: boolean
    ): Array<SortPass<T>> =>
      enabled
        ? sorting.flatMap((sort) => {
            // Only what the column allows: a view that was not reconciled
            // for this table cannot sort a column that cannot.
            const column = model.byId.get(sort.column)
            return column?.sortable
              ? [{ column, descending: sort.direction === "descending" }]
              : []
          })
        : []
  )
  const sortedSet = memoOne(
    (
      rows: Core<T>,
      set: RowSet,
      passes: ReadonlyArray<SortPass<T>>
    ): RowSet => {
      if (!passes.length) return set
      const roots = sortRows(rows.items, set.roots, passes)
      const children =
        set.children?.map((list) =>
          list ? sortRows(rows.items, list, passes) : undefined
        ) ?? null
      return { ...set, roots, children }
    }
  )
  const ordered = memoOne(
    (
      rows: Core<T>,
      grouping: Grouping<T> | null,
      passes: ReadonlyArray<SortPass<T>>,
      server: boolean,
      firstDay: number
    ): OrderedGroups<T> | null =>
      grouping && orderGroups(rows, grouping, passes, server, firstDay)
  )
  const aggregateColumnsOf = memoOne((model: ColumnModel<T>) =>
    model.leaves.filter((column) => column.aggregate)
  )
  // By position; `null` when nothing is disabled, so that an
  // `isItemDisabled` that disables nothing is the same as none. Asked again
  // only for other rows or another function: a run for a new selection or
  // page does not call it for every item.
  const disabledFlags = memoOne(
    (rows: Core<T>, isItemDisabled: ((item: T) => boolean) | undefined) => {
      if (!isItemDisabled) return null
      const flags = new Uint8Array(rows.items.length)
      let any = false
      for (let i = 0; i < flags.length; i++)
        if (isItemDisabled(rows.items[i])) {
          flags[i] = 1
          any = true
        }
      return any ? flags : null
    }
  )
  const prepare = memoOne(
    (
      rows: Core<T>,
      model: ColumnModel<T>,
      index: SearchIndex<T>,
      search: ReadonlyArray<EngineColumn<T>>,
      sortable: boolean,
      filterable: boolean
    ) =>
      worker.request([
        ...(filterable ? search.map((column) => index.task(column)) : []),
        ...(sortable
          ? model.leaves
              .filter((column) => column.sortable)
              .map((column) => rankingTask(rows.items, column))
          : []),
      ])
  )
  const body = memoOne(
    (
      rows: Core<T>,
      set: RowSet,
      groups: OrderedGroups<T> | null,
      formatter: Formatter<T>,
      server: boolean,
      disabled: Uint8Array | null,
      expanded: ReadonlySet<string>,
      autoExpanded: Uint8Array | "parents" | null,
      closedGroups: ClosedGroups
    ) =>
      buildRows({
        core: rows,
        set,
        groups,
        formatter,
        server,
        disabled,
        expanded,
        autoExpanded,
        closedGroups,
        cache,
      })
  )
  const rowIndex = memoOne(indexRows<T>)
  // The matching rows in display order (not context), their ids, and those
  // that can be selected: kept across the models that only open, close or
  // page rows, for "select all" and the header checkbox to compare by
  // identity.
  const matchingOrder = memoOne(
    (set: RowSet, groups: OrderedGroups<T> | null): Uint32Array => {
      const order = displayOrder(set, groups)
      return set.context
        ? order.filter((position) => set.context?.[position] !== 1)
        : order
    }
  )
  const matchingIdList = memoOne(
    (order: Uint32Array, rows: Core<T>): ReadonlyArray<string> =>
      Array.from(order, (position) => rows.ids[position])
  )
  const selectableIdList = memoOne(
    (
      order: Uint32Array,
      rows: Core<T>,
      disabled: Uint8Array | null
    ): ReadonlyArray<string> => {
      if (!disabled) return matchingIdList(order, rows)
      const list: Array<string> = []
      for (const position of order)
        if (disabled[position] !== 1) list.push(rows.ids[position])
      return list
    }
  )
  const paging = memoOne(
    (
      allRows: ReadonlyArray<EngineRow<T>>,
      paginated: boolean,
      server: boolean,
      requestedPage: number,
      requestedSize: number,
      serverCount: number | undefined,
      matching: number
    ) => {
      const pageSize = resolvePageSize(requestedSize)
      const counted = allRows.length
      const rowCount = server ? (serverCount ?? matching) : matching
      if (server) {
        const pageCount = paginated ? getPageCount(rowCount, pageSize) : 1
        return {
          rows: allRows,
          counted,
          rowCount,
          pageSize,
          pageCount,
          page: clampPage(requestedPage, pageCount),
        }
      }
      if (!paginated)
        return {
          rows: allRows,
          counted,
          rowCount,
          pageSize,
          pageCount: 1,
          page: 1,
        }
      const page = pageRows(allRows, requestedPage, pageSize, () =>
        rowIndex(allRows)
      )
      return { ...page, rowCount, pageSize }
    }
  )

  const model = memoOne(
    (
      rows: Core<T>,
      columns: ColumnModel<T>,
      formatter: Formatter<T>,
      set: RowSet,
      groups: OrderedGroups<T> | null,
      allRows: ReadonlyArray<EngineRow<T>>,
      page: ReturnType<typeof paging>,
      disabled: Uint8Array | null,
      filters: DataTableView["filters"],
      index: SearchIndex<T>,
      search: Uint8Array | null,
      filtering: boolean,
      rowHeader: EngineColumn<T> | undefined,
      server: boolean,
      matchingCount: number,
      hidden: ReadonlyArray<string>
    ): DataTableRowModel<T> => {
      const { items, ids } = rows
      const aggregates = aggregateColumnsOf(columns)
      const pageIndex = lazy(() => indexRows(page.rows))
      const item = (id: string) => {
        const position = rows.positions.get(id)
        return position === undefined ? undefined : items[position]
      }
      // The matching rows (not context) in display order.
      const matching = lazy(() => matchingOrder(set, groups))
      const filteredItems = lazy(() =>
        Array.from(matching(), (position) => items[position])
      )
      const groupIndex = lazy(
        () => new Map(groups?.grouping.keys.map((key, group) => [key, group]))
      )
      const groupRange = (key: string) => {
        const group = groupIndex().get(key)
        return group === undefined || !groups
          ? undefined
          : groups.rows.subarray(groups.start[group], groups.end[group])
      }
      // Kept with the groups, across the models of their opening and
      // closing: a group's checkbox and subtotals are not worked out again.
      let kept = groupCache.get(groups ?? set)
      if (kept?.disabled !== disabled || kept.aggregates !== aggregates) {
        kept = { disabled, aggregates, ids: new Map(), summaries: new Map() }
        groupCache.set(groups ?? set, kept)
      }
      const known = kept
      // A group's subtotals: a group of groups adds up theirs (`summarize`).
      const summaryOf = (ordered: OrderedGroups<T>, group: number): Summary => {
        let summary = known.summaries.get(group)
        if (!summary) {
          const { order, start, end, childStart, childEnd } = ordered
          // The next level's groups; none past the last.
          const inner = order.at(ordered.grouping.level[group] + 1)
          summary = summarize(
            aggregates,
            () =>
              Array.from(
                ordered.rows.subarray(start[group], end[group]),
                (position) => items[position]
              ),
            inner
              ? Array.from(
                  inner.subarray(childStart[group], childEnd[group]),
                  (child) => summaryOf(ordered, child)
                )
              : null
          )
          known.summaries.set(group, summary)
        }
        return summary
      }
      const parts = lazy((): SearchParts<T> => ({
        model: columns,
        core: rows,
        formatter,
        index,
        hidden,
        search,
        filters,
        server,
      }))
      return {
        rows: page.rows,
        allRows,
        page: page.page,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        displayRowCount: page.counted,
        rowCount: page.rowCount,
        itemCount: items.length,
        matchingCount,
        filtering,
        idIssues: rows.idIssues,
        indexOf: (id) => pageIndex().get(id) ?? -1,
        indexOfRow: (id) => rowIndex(allRows).get(id) ?? -1,
        item,
        isDisabled: (id) => {
          const position = rows.positions.get(id)
          return position !== undefined && disabled?.[position] === 1
        },
        textOf: (id) => {
          const position = rows.positions.get(id)
          if (position !== undefined)
            return rowHeader ? formatter.text(rowHeader, items[position]) : ""
          const group = groupIndex().get(id)
          if (group === undefined || !groups) return ""
          const column = groups.grouping.columns[groups.grouping.level[group]]
          return formatter.groupText(
            column,
            items[groups.grouping.first[group]]
          )
        },
        matchingIds: () => matchingIdList(matching(), rows),
        selectableIds: () => selectableIdList(matching(), rows, disabled),
        allItems: () => items,
        ids,
        has: (id) => rows.positions.has(id),
        treeParentOf: (id) => {
          const position = rows.positions.get(id)
          if (position === undefined || !rows.children) return null
          const parent = parentsOf(rows)[position]
          return parent < 0 ? null : ids[parent]
        },
        childrenUnloaded: (id) => {
          const position = rows.positions.get(id)
          return position !== undefined && rows.unloaded?.[position] === 1
        },
        kept: (id) => {
          const position = rows.positions.get(id)
          if (position === undefined) return false
          if (set.all === rows.all) return true
          let flags = keptCache.get(set)
          if (!flags) {
            flags = new Uint8Array(items.length)
            for (const at of set.all) flags[at] = 1
            keptCache.set(set, flags)
          }
          return flags[position] === 1
        },
        filteredItems,
        pageItems: lazy(() =>
          page.rows.flatMap((row) =>
            row.kind === "item" && !row.continued ? [row.item] : []
          )
        ),
        groupKeys: () => groups?.grouping.keys ?? NO_IDS,
        groupIds: (key) => {
          const range = groupRange(key)
          return range ? Array.from(range, (position) => ids[position]) : NO_IDS
        },
        groupItems: (key) => {
          const range = groupRange(key)
          return range ? Array.from(range, (position) => items[position]) : []
        },
        groupPath: (id) => {
          if (!groups) return NO_IDS
          const { grouping } = groups
          const position = rows.positions.get(id)
          const self = groupIndex().get(id)
          // An item's group at the last level, or a group's parent; -1 for none.
          let group =
            position !== undefined
              ? grouping.leafOf[position]
              : self !== undefined
                ? grouping.parent[self]
                : -1
          const path: Array<string> = []
          for (; group >= 0; group = grouping.parent[group])
            path.unshift(grouping.keys[group])
          return path
        },
        groupSelectableIds: (key) => {
          let selectable = known.ids.get(key)
          if (!selectable) {
            const list: Array<string> = []
            for (const position of groupRange(key) ?? NO_ROWS)
              if (disabled?.[position] !== 1) list.push(ids[position])
            selectable = list
            known.ids.set(key, selectable)
          }
          return selectable
        },
        groupAggregates: (key) => {
          const group = groupIndex().get(key)
          return group === undefined || !groups
            ? aggregateColumns(aggregates, [])
            : summaryOf(groups, group).values
        },
        totals: lazy(() => {
          // A tree sums its leaves: a parent's figures are usually its children's.
          const counted = rows.children
            ? Array.from(matching()).filter(
                (position) => rows.children?.[position] === undefined
              )
            : matching()
          const list = Array.from(counted, (position) => items[position])
          const values = lazy(() => aggregateColumns(aggregates, list))
          return {
            kind: "totals",
            key: "totals",
            count: list.length,
            items: list,
            get aggregates() {
              return values()
            },
          }
        }),
        searchParts: parts,
      }
    }
  )

  return {
    run(input) {
      latest.itemToId = input.itemToId ?? defaultItemToId
      latest.itemToChildren = input.itemToChildren

      const columns = getColumnModel(input.columns)
      const formatter = getFormatter(columns, input.locale, input.labels)
      const server = input.dataMode === "server"
      const sortable = !server && input.sortable !== false
      const view = input.view
      const tree = input.itemToChildren !== undefined
      const expanded = steadyExpanded(toSet(input.expanded))

      let rows = core(input.items, tree, loads)
      if (
        tree &&
        childrenLoaded(
          rows,
          expanded,
          input.itemToChildren ?? (() => undefined)
        )
      ) {
        loads++
        rows = core(input.items, tree, loads)
      }
      const disabled = steadyDisabled(disabledFlags(rows, input.isItemDisabled))
      const index = searchIndex(rows, formatter)
      const hidden = steadyHidden(view.columns.hidden)
      const shown = searchColumns(columns, hidden)
      const query = view.search.trim()
      const search = server
        ? null
        : mask(index, shown, query, rows.items.length)
      const filters = steadyFilters(view.filters)
      const filter = server
        ? null
        : predicate(columns, index, search, filters, rows.items.length)
      const set = filtered(rows, filter)
      const passes = sortPasses(columns, steadySorting(view.sorting), sortable)
      prepare(
        rows,
        columns,
        index,
        shown,
        sortable,
        !server && input.filterable === true
      )

      const groups = ordered(
        rows,
        grouped(rows, set, columns, steadyGrouping(view.grouping)),
        passes,
        server,
        firstDayOf(formatter.locale)
      )
      const sorted = server || groups ? set : sortedSet(rows, set, passes)
      const filtering = filter !== null
      const autoExpanded =
        server && tree && query !== ""
          ? "parents"
          : filtering && set.holdsMatch
            ? set.holdsMatch
            : null
      const allRows = body(
        rows,
        sorted,
        groups,
        formatter,
        server,
        disabled,
        // Only a tree's rows open: a flat list's detail rows are the
        // content's, and opening one redoes nothing here.
        tree ? expanded : EMPTY_SET,
        autoExpanded,
        steadyCollapsed(closedOf(input.collapsedGroups))
      )
      const matchingCount = set.matches
      const page = paging(
        allRows,
        input.pagination != null,
        server,
        input.pagination?.page ?? 1,
        input.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
        input.rowCount,
        matchingCount
      )
      const rowHeaderId = layoutColumns(input.columns, view).rowHeader
      return model(
        rows,
        columns,
        formatter,
        sorted,
        groups,
        allRows,
        page,
        disabled,
        filters,
        index,
        search,
        filtering,
        rowHeaderId === undefined ? undefined : columns.byId.get(rowHeaderId),
        server,
        matchingCount,
        hidden
      )
    },
  }
}

export { createDataTableEngine, defaultItemToId }
export type {
  DataTableDataMode,
  DataTableEngine,
  DataTableEngineInput,
  DataTableRowModel,
  SearchParts,
}
