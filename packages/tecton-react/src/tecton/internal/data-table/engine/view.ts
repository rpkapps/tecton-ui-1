/**
 * The view (`DataTableView`): its defaults, merging a partial `defaultView`,
 * reconciling a view against the columns, and the reducers that change one
 * piece of it.
 *
 * Reconciliation runs on every view the table uses, controlled ones too, and
 * never throws:
 * - unknown column ids are ignored;
 * - `columns.order` always lists every leaf column: those it leaves out go
 *   to their default position (after the column before them by default),
 *   and the columns of a group stay side by side, as do groups in groups;
 * - sorting, filters and grouping on unknown columns, or on columns that
 *   cannot (the root's feature off, or the column opted out), are dropped,
 *   and so are duplicates, empty filters (but one with `empty: true`, its
 *   "No value") and filters of another type than the column's (any type
 *   is kept for a column with its own `filter`); a filter's list keeps the
 *   items its type can match (no blank text, no range without an end);
 * - search is `""` while the table is not filterable;
 * - widths that are not positive numbers are dropped, the others clamped to
 *   the column's `minWidth` (48 px by default) and `maxWidth`; a column
 *   pinned to both sides is pinned to the start;
 * - a column with `hideable: false` is never hidden, and neither is every
 *   column: the first in the order then stays shown.
 * A piece that needs no change is returned as it was (and the view itself
 * when nothing changes), so memoized work downstream is kept.
 *
 * The reducers take a view and return the next one, or the same view when
 * the change changes nothing; reconcile their result like any other view.
 */
import {
  clampColumnWidth,
  getColumnModel,
  type ColumnModel,
  type ColumnNode,
  type EngineColumn,
} from "./columns"
import type {
  DataTableColumns,
  DataTableDateRange,
  DataTableFilterValue,
  DataTableNumberRange,
  DataTablePartialView,
  DataTableSort,
  DataTableView,
} from "./types"
import {
  listFilter,
  listOf,
  type ListFilterType,
  type ListFilterValue,
  type ListItem,
} from "./filter-lists"
import { DATE_ONLY, startOfDay, toDate } from "./values"

/** The root's features that decide which parts of a view apply. */
type ViewCapabilities = {
  sortable: boolean
  /** More than one column sorts at once; without it, only the first sort applies. */
  multiSort?: boolean
  filterable: boolean
  groupable: boolean
}

/** As the root's defaults: sortable, not filterable, not groupable. */
const DEFAULT_CAPABILITIES: ViewCapabilities = {
  sortable: true,
  filterable: false,
  groupable: false,
}

const EMPTY_FILTERS: DataTableView["filters"] = Object.freeze({})

/**
 * `partial`'s parts over `base`'s. A part that is all there is kept as the
 * same object, and a complete view is returned as it is.
 */
function mergeView(
  base: DataTableView,
  partial: DataTablePartialView | undefined
): DataTableView {
  if (!partial) return base
  const columns = partial.columns ?? undefined
  const pinnedIn = columns?.pinned ?? undefined
  const pinned =
    pinnedIn?.start && pinnedIn.end
      ? (pinnedIn as DataTableView["columns"]["pinned"])
      : {
          start: pinnedIn?.start ?? base.columns.pinned.start,
          end: pinnedIn?.end ?? base.columns.pinned.end,
        }
  const mergedColumns =
    columns?.order && columns.hidden && columns.widths && pinned === pinnedIn
      ? (columns as DataTableView["columns"])
      : {
          order: columns?.order ?? base.columns.order,
          hidden: columns?.hidden ?? base.columns.hidden,
          widths: columns?.widths ?? base.columns.widths,
          pinned,
        }
  if (
    partial.sorting &&
    partial.search !== undefined &&
    partial.filters &&
    partial.grouping &&
    mergedColumns === columns
  )
    return partial as DataTableView
  return {
    sorting: partial.sorting ?? base.sorting,
    search: partial.search ?? base.search,
    filters: partial.filters ?? base.filters,
    grouping: partial.grouping ?? base.grouping,
    columns: mergedColumns,
  }
}

/**
 * The view a table starts from, and returns to on reset: `defaultView`'s
 * parts over the defaults (no sorting, search, filters or grouping, every
 * column shown in definition order at its own width, none pinned),
 * reconciled.
 */
function createDefaultView<T>(
  columns: DataTableColumns<T>,
  defaultView?: DataTablePartialView,
  capabilities: ViewCapabilities = DEFAULT_CAPABILITIES
): DataTableView {
  const model = getColumnModel(columns)
  const base: DataTableView = {
    sorting: [],
    search: "",
    filters: EMPTY_FILTERS,
    grouping: [],
    columns: {
      order: model.leaves.map((leaf) => leaf.id),
      hidden: [],
      widths: {},
      pinned: { start: [], end: [] },
    },
  }
  return reconcileModelView(model, mergeView(base, defaultView), capabilities)
}

/**
 * `view` made valid for `columns` (see the module comment); the parts it
 * lacks are taken from `defaults` (a view from `createDefaultView`).
 */
function reconcileView<T>(
  columns: DataTableColumns<T>,
  view: DataTablePartialView | undefined,
  defaults: DataTableView,
  capabilities: ViewCapabilities = DEFAULT_CAPABILITIES
): DataTableView {
  return reconcileModelView(
    getColumnModel(columns),
    mergeView(defaults, view),
    capabilities
  )
}

function reconcileModelView<T>(
  model: ColumnModel<T>,
  view: DataTableView,
  capabilities: ViewCapabilities
): DataTableView {
  const sorting = reconcileSorting(model, view.sorting, capabilities)
  const search =
    capabilities.filterable && typeof view.search === "string"
      ? view.search
      : ""
  const filters = reconcileFilters(model, view.filters, capabilities)
  const grouping = reconcileGrouping(model, view.grouping, capabilities)
  const order = reconcileOrder(model, view.columns.order)
  const hidden = reconcileHidden(model, order, view.columns.hidden)
  const widths = reconcileWidths(model, view.columns.widths)
  const start = knownIds(model, view.columns.pinned.start)
  const end = knownIds(model, view.columns.pinned.end, start)
  const pinned =
    start === view.columns.pinned.start && end === view.columns.pinned.end
      ? view.columns.pinned
      : { start, end }
  const columns =
    order === view.columns.order &&
    hidden === view.columns.hidden &&
    widths === view.columns.widths &&
    pinned === view.columns.pinned
      ? view.columns
      : { order, hidden, widths, pinned }
  if (
    sorting === view.sorting &&
    search === view.search &&
    filters === view.filters &&
    grouping === view.grouping &&
    columns === view.columns
  )
    return view
  return { sorting, search, filters, grouping, columns }
}

/** `next`, or `previous` when they hold the same ids in the same order. */
function keepIfSame(
  previous: ReadonlyArray<string> | undefined,
  next: Array<string>
): ReadonlyArray<string> {
  return previous &&
    previous.length === next.length &&
    previous.every((id, i) => id === next[i])
    ? previous
    : next
}

/** The ids `model` knows, once each, leaving out those in `exclude`. */
function knownIds<T>(
  model: ColumnModel<T>,
  ids: ReadonlyArray<string> | undefined,
  exclude?: ReadonlyArray<string>
): ReadonlyArray<string> {
  const list = Array.isArray(ids) ? ids : []
  const seen = new Set(exclude)
  const next: Array<string> = []
  for (const id of list) {
    if (seen.has(id) || !model.byId.has(id)) continue
    seen.add(id)
    next.push(id)
  }
  return keepIfSame(Array.isArray(ids) ? ids : undefined, next)
}

/**
 * The hidden columns: known ones that can be hidden (`hideable: false` is
 * always shown), and never every column: the first in `order` then stays.
 */
function reconcileHidden<T>(
  model: ColumnModel<T>,
  order: ReadonlyArray<string>,
  hidden: ReadonlyArray<string> | undefined
): ReadonlyArray<string> {
  const known = knownIds(model, hidden)
  let next = known.filter((id) => model.byId.get(id)?.hideable !== false)
  if (next.length >= model.leaves.length)
    next = next.filter((id) => id !== order[0])
  return next.length === known.length ? known : next
}

/** Whether `hidden` would hide every column (which reconciliation does not let it). */
function hidesEveryColumn<T>(
  columns: DataTableColumns<T>,
  hidden: ReadonlyArray<string> | undefined
) {
  const { leaves } = getColumnModel(columns)
  const set = new Set(Array.isArray(hidden) ? hidden : [])
  return leaves.length > 0 && leaves.every((leaf) => set.has(leaf.id))
}

/**
 * The items of `input` (when it is an array) that `valid` keeps, a column
 * (`columnOf`) once, at most `limit` of them; none unless `on`. `input`
 * itself when it keeps every item.
 */
function keepValid<TItem>(
  input: ReadonlyArray<TItem> | undefined,
  on: boolean,
  valid: (item: TItem) => boolean,
  columnOf: (item: TItem) => string,
  limit = Infinity
): ReadonlyArray<TItem> {
  const list = Array.isArray(input) ? input : []
  const seen = new Set<string>()
  const next = on
    ? list
        .filter((item) => {
          const keep = valid(item) && !seen.has(columnOf(item))
          if (keep) seen.add(columnOf(item))
          return keep
        })
        .slice(0, limit)
    : []
  return next.length === list.length && Array.isArray(input) ? input : next
}

function reconcileSorting<T>(
  model: ColumnModel<T>,
  sorting: ReadonlyArray<DataTableSort> | undefined,
  capabilities: ViewCapabilities
): ReadonlyArray<DataTableSort> {
  return keepValid(
    sorting,
    capabilities.sortable,
    (sort) =>
      typeof sort === "object" &&
      sort !== null &&
      model.byId.get(sort.column)?.sortable === true &&
      (sort.direction === "ascending" || sort.direction === "descending"),
    (sort) => sort.column,
    capabilities.multiSort === false ? 1 : Infinity
  )
}

function reconcileGrouping<T>(
  model: ColumnModel<T>,
  grouping: ReadonlyArray<string> | undefined,
  capabilities: ViewCapabilities
): ReadonlyArray<string> {
  return keepValid(
    grouping,
    capabilities.groupable,
    (id) => model.byId.get(id)?.groupable === true,
    (id) => id
  )
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

/**
 * The items of a filter's list that `clean` keeps, as it returns them, and
 * whether every item came back as it was (the list can be kept).
 */
function cleanList<TItem>(
  input: unknown,
  clean: (item: unknown) => TItem | undefined
): { items: Array<TItem>; same: boolean } {
  if (!Array.isArray(input)) return { items: [], same: false }
  const items: Array<TItem> = []
  let same = true
  for (const item of input as Array<unknown>) {
    const next = clean(item)
    if (next !== item) same = false
    if (next !== undefined) items.push(next)
  }
  return { items, same }
}

const cleanText = (item: unknown) =>
  typeof item === "string" && item.trim() !== "" ? item : undefined

const cleanOption = (item: unknown) =>
  typeof item === "string" ? item : undefined

const cleanBoolean = (item: unknown) =>
  typeof item === "boolean" ? item : undefined

/** A number range with a bound, its exclusive flags only `true` and with their bound. */
function cleanNumberRange(item: unknown): DataTableNumberRange | undefined {
  if (!item || typeof item !== "object") return undefined
  const range = item as DataTableNumberRange
  const min = finiteNumber(range.min)
  const max = finiteNumber(range.max)
  if (min === undefined && max === undefined) return undefined
  const minExclusive = min !== undefined && range.minExclusive === true
  const maxExclusive = max !== undefined && range.maxExclusive === true
  if (
    min === range.min &&
    max === range.max &&
    (range.minExclusive === undefined || minExclusive) &&
    (range.maxExclusive === undefined || maxExclusive)
  )
    return range
  return {
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    ...(minExclusive ? { minExclusive } : {}),
    ...(maxExclusive ? { maxExclusive } : {}),
  }
}

/**
 * A date range with an end; a view read back from JSON has strings where
 * the dates were. A date-only string ("2024-03-01") is that day's start
 * in `timeZone`, the column's (the local zone without one), as the
 * filter's calendar picks it: a `to` then takes in the whole day.
 */
function cleanDateRange(
  item: unknown,
  timeZone: string | undefined
): DataTableDateRange | undefined {
  if (!item || typeof item !== "object") return undefined
  const range = item as DataTableDateRange
  const date = (value: unknown) => {
    const day = typeof value === "string" ? DATE_ONLY.exec(value) : null
    const parsed = toDate(value as Date | undefined)
    return day && parsed
      ? startOfDay(Number(day[1]), Number(day[2]) - 1, Number(day[3]), timeZone)
      : parsed
  }
  const from = date(range.from)
  const to = date(range.to)
  if (!from && !to) return undefined
  if (from === range.from && to === range.to) return range
  return { ...(from ? { from } : {}), ...(to ? { to } : {}) }
}

/** A list filter type's items: how one is cleaned (`undefined`: dropped), and compared. */
type ListRules<TItem> = {
  clean: (item: unknown, timeZone: string | undefined) => TItem | undefined
  same: (a: TItem, b: TItem) => boolean
}

const LISTS: { [TType in ListFilterType]: ListRules<ListItem<TType>> } = {
  text: { clean: cleanText, same: Object.is },
  options: { clean: cleanOption, same: Object.is },
  boolean: { clean: cleanBoolean, same: Object.is },
  number: { clean: cleanNumberRange, same: sameNumberRange },
  date: { clean: cleanDateRange, same: sameDateRange },
}

/**
 * A filter value as `column` can apply it, or `undefined` when it cannot or
 * the value filters nothing. A list keeps the items its type can match
 * (texts that are not blank, number ranges with a bound, date ranges with
 * an end).
 */
function reconcileFilter(
  column: { type: string; filter?: unknown; format?: object },
  input: unknown
): DataTableFilterValue | undefined {
  // Views come from JSON and application state: anything may be here.
  if (!input || typeof input !== "object" || !("type" in input))
    return undefined
  const value = input as DataTableFilterValue
  if (!column.filter && value.type !== column.type) return undefined
  if (value.type === "custom") return column.filter ? value : undefined
  if (!Object.hasOwn(LISTS, value.type)) return undefined
  const rules = LISTS[value.type] as ListRules<ListItem<ListFilterType>>
  const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
  const { items, same } = cleanList(listOf(value), (item) =>
    rules.clean(item, timeZone)
  )
  // "No value": only `true` counts; a flag that is not a boolean goes.
  const next = listFilter(value.type, items, value.empty === true)
  return next &&
    same &&
    (value.empty === undefined || typeof value.empty === "boolean")
    ? value
    : (next ?? undefined)
}

function reconcileFilters<T>(
  model: ColumnModel<T>,
  filters: DataTableView["filters"] | undefined,
  capabilities: ViewCapabilities
): DataTableView["filters"] {
  if (!filters || typeof filters !== "object") return EMPTY_FILTERS
  const entries = Object.entries(filters)
  if (!entries.length) return filters
  if (!capabilities.filterable) return EMPTY_FILTERS
  let changed = false
  const next: Record<string, DataTableFilterValue> = {}
  for (const [id, value] of entries) {
    const column = model.byId.get(id)
    const reconciled =
      column && column.filterable ? reconcileFilter(column, value) : undefined
    if (reconciled !== value) changed = true
    if (reconciled) next[id] = reconciled
  }
  return changed ? next : filters
}

function reconcileWidths<T>(
  model: ColumnModel<T>,
  widths: DataTableView["columns"]["widths"] | undefined
): DataTableView["columns"]["widths"] {
  if (!widths || typeof widths !== "object") return {}
  let changed = false
  const next: Record<string, number> = {}
  for (const [id, width] of Object.entries(widths)) {
    const column = model.byId.get(id)
    const valid = column && finiteNumber(width) !== undefined && width > 0
    const clamped = valid
      ? clampColumnWidth(column.minWidth, column.maxWidth, width)
      : undefined
    if (clamped !== width) changed = true
    if (clamped !== undefined) next[id] = clamped
  }
  return changed ? next : widths
}

/** Every leaf id: `order`'s known ones, the rest at their default place, groups together. */
function reconcileOrder<T>(
  model: ColumnModel<T>,
  order: ReadonlyArray<string> | undefined
): ReadonlyArray<string> {
  const merged = [...knownIds(model, order)]
  const present = new Set(merged)
  for (const leaf of model.leaves) {
    if (present.has(leaf.id)) continue
    const before = model.leaves[leaf.index - 1] as EngineColumn<T> | undefined
    merged.splice(before ? merged.indexOf(before.id) + 1 : 0, 0, leaf.id)
  }
  const position = new Map(merged.map((id, i) => [id, i]))
  // Each node goes where its first column is; a group's columns follow it.
  const arrange = (
    nodes: ReadonlyArray<ColumnNode>
  ): Array<{ at: number; ids: Array<string> }> =>
    nodes
      .map((node) => {
        if (node.kind === "column")
          return { at: position.get(node.id) ?? 0, ids: [node.id] }
        const children = arrange(node.children)
        return {
          at: Math.min(...children.map((child) => child.at)),
          ids: children.flatMap((child) => child.ids),
        }
      })
      .sort((a, b) => a.at - b.at)
  return keepIfSame(
    Array.isArray(order) ? order : undefined,
    arrange(model.tree).flatMap((node) => node.ids)
  )
}

// Equality of view pieces, by value.

function sameSorting(
  a: ReadonlyArray<DataTableSort>,
  b: ReadonlyArray<DataTableSort>
) {
  return (
    a === b ||
    (a.length === b.length &&
      a.every(
        (sort, i) =>
          sort.column === b[i].column && sort.direction === b[i].direction
      ))
  )
}

function sameIds(a: ReadonlyArray<string>, b: ReadonlyArray<string>) {
  return a === b || (a.length === b.length && a.every((id, i) => id === b[i]))
}

function sameTime(a: Date | undefined, b: Date | undefined) {
  return a === b || (a?.getTime() ?? NaN) === (b?.getTime() ?? NaN)
}

/** Whether two lists hold the same items, in order, by `same`. */
function sameList<TItem>(
  a: ReadonlyArray<TItem>,
  b: ReadonlyArray<TItem>,
  same: (x: TItem, y: TItem) => boolean
) {
  return a === b || (a.length === b.length && a.every((x, i) => same(x, b[i])))
}

function sameNumberRange(a: DataTableNumberRange, b: DataTableNumberRange) {
  return (
    a.min === b.min &&
    a.max === b.max &&
    (a.minExclusive === true) === (b.minExclusive === true) &&
    (a.maxExclusive === true) === (b.maxExclusive === true)
  )
}

function sameDateRange(a: DataTableDateRange, b: DataTableDateRange) {
  return sameTime(a.from, b.from) && sameTime(a.to, b.to)
}

function sameFilterValue(a: DataTableFilterValue, b: DataTableFilterValue) {
  if (a === b) return true
  if (a.type !== b.type) return false
  if (a.type === "custom") return Object.is(a.value, (b as typeof a).value)
  const other = b as ListFilterValue
  return (
    (a.empty === true) === (other.empty === true) &&
    sameList(
      listOf(a),
      listOf(other),
      LISTS[a.type].same as ListRules<unknown>["same"]
    )
  )
}

function sameFilters(a: DataTableView["filters"], b: DataTableView["filters"]) {
  if (a === b) return true
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => key in b && sameFilterValue(a[key], b[key]))
  )
}

function sameWidths(
  a: DataTableView["columns"]["widths"],
  b: DataTableView["columns"]["widths"]
) {
  if (a === b) return true
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && a[key] === b[key])
  )
}

/** Whether two views' columns are the same, by value. */
function sameColumns(a: DataTableView["columns"], b: DataTableView["columns"]) {
  return (
    a === b ||
    (sameIds(a.order, b.order) &&
      sameIds(a.hidden, b.hidden) &&
      sameWidths(a.widths, b.widths) &&
      sameIds(a.pinned.start, b.pinned.start) &&
      sameIds(a.pinned.end, b.pinned.end))
  )
}

/** Whether two views are the same, piece by piece, by value. */
function sameView(a: DataTableView, b: DataTableView) {
  if (a === b) return true
  const x = a.columns
  const y = b.columns
  return (
    sameSorting(a.sorting, b.sorting) &&
    a.search === b.search &&
    sameFilters(a.filters, b.filters) &&
    sameIds(a.grouping, b.grouping) &&
    sameColumns(x, y)
  )
}

/**
 * Whether the rows that match differ between two views: search or filters
 * changed, or, while searching, the columns shown (search reads only those).
 */
function viewMatchesChanged(previous: DataTableView, next: DataTableView) {
  const search = next.search.trim()
  return (
    previous.search.trim() !== search ||
    !sameFilters(previous.filters, next.filters) ||
    (search !== "" && !sameIds(previous.columns.hidden, next.columns.hidden))
  )
}

// Reducers.

/**
 * The sorting after a header click on `column` (§5.2): ascending, then
 * descending, then off. Without `multi` the column becomes the only sort;
 * with it (Shift), the column is added at the end, or cycled where it is.
 */
function toggleSorting(
  sorting: ReadonlyArray<DataTableSort>,
  column: string,
  options: { multi?: boolean } = {}
): ReadonlyArray<DataTableSort> {
  const index = sorting.findIndex((sort) => sort.column === column)
  const current = index === -1 ? undefined : sorting[index].direction
  const direction =
    current === undefined
      ? "ascending"
      : current === "ascending"
        ? "descending"
        : undefined
  if (!options.multi) return direction ? [{ column, direction }] : []
  if (index === -1) return [...sorting, { column, direction: "ascending" }]
  return direction
    ? sorting.map((sort, i) => (i === index ? { column, direction } : sort))
    : sorting.filter((_, i) => i !== index)
}

function setSorting(
  view: DataTableView,
  sorting: ReadonlyArray<DataTableSort>
): DataTableView {
  return sameSorting(view.sorting, sorting) ? view : { ...view, sorting }
}

/** A header click on `column`: `toggleSorting` applied to the view. */
function sortColumn(
  view: DataTableView,
  column: string,
  options?: { multi?: boolean }
): DataTableView {
  return setSorting(view, toggleSorting(view.sorting, column, options))
}

function setSearch(view: DataTableView, search: string): DataTableView {
  return view.search === search ? view : { ...view, search }
}

/** Sets `column`'s filter; `null` or `undefined` removes it. */
function setFilter(
  view: DataTableView,
  column: string,
  value: DataTableFilterValue | null | undefined
): DataTableView {
  const current = view.filters[column] as DataTableFilterValue | undefined
  if (!value) {
    if (!current) return view
    const filters = { ...view.filters }
    delete filters[column]
    return { ...view, filters }
  }
  if (current && sameFilterValue(current, value)) return view
  return { ...view, filters: { ...view.filters, [column]: value } }
}

/** Removes every filter and the search, as "Clear all" and "Clear filters" do. */
function clearFilters(view: DataTableView): DataTableView {
  if (!Object.keys(view.filters).length && view.search === "") return view
  return { ...view, filters: EMPTY_FILTERS, search: "" }
}

function setGrouping(
  view: DataTableView,
  grouping: ReadonlyArray<string>
): DataTableView {
  return sameIds(view.grouping, grouping) ? view : { ...view, grouping }
}

function setColumns(
  view: DataTableView,
  patch: Partial<DataTableView["columns"]>
): DataTableView {
  return { ...view, columns: { ...view.columns, ...patch } }
}

/**
 * Puts the columns in `order`; the columns it leaves out follow, in the
 * order they have now. Reconciliation keeps a group's columns together.
 */
function setColumnOrder(
  view: DataTableView,
  order: ReadonlyArray<string>
): DataTableView {
  const listed = new Set(order)
  const next = [
    ...listed,
    ...view.columns.order.filter((id) => !listed.has(id)),
  ]
  return sameIds(view.columns.order, next)
    ? view
    : setColumns(view, { order: next })
}

function setColumnHidden(
  view: DataTableView,
  column: string,
  hidden: boolean
): DataTableView {
  const current = view.columns.hidden
  if (current.includes(column) === hidden) return view
  return setColumns(view, {
    hidden: hidden
      ? [...current, column]
      : current.filter((id) => id !== column),
  })
}

/** Sets `column`'s width in px; `null` returns it to the column's own. */
function setColumnWidth(
  view: DataTableView,
  column: string,
  width: number | null
): DataTableView {
  const current = view.columns.widths[column] as number | undefined
  if (current === (width ?? undefined)) return view
  const widths = { ...view.columns.widths }
  if (width === null) delete widths[column]
  else widths[column] = width
  return setColumns(view, { widths })
}

/**
 * Pins `column` to a side, or unpins it (`null`). Within a side, columns
 * keep the order of `columns.order`.
 */
function setColumnPinned(
  view: DataTableView,
  column: string,
  side: "start" | "end" | null
): DataTableView {
  const { start, end } = view.columns.pinned
  const current = start.includes(column)
    ? "start"
    : end.includes(column)
      ? "end"
      : null
  if (current === side) return view
  const pinned = {
    start: start.filter((id) => id !== column),
    end: end.filter((id) => id !== column),
  }
  if (side) pinned[side] = [...pinned[side], column]
  return setColumns(view, { pinned })
}

/** The column layout (order, hidden, widths, pinned) of `defaults`. */
function resetColumns(
  view: DataTableView,
  defaults: DataTableView
): DataTableView {
  return view.columns === defaults.columns
    ? view
    : { ...view, columns: defaults.columns }
}

export {
  clearFilters,
  createDefaultView,
  hidesEveryColumn,
  DEFAULT_CAPABILITIES,
  reconcileView,
  resetColumns,
  sameColumns,
  sameDateRange,
  sameFilters,
  sameFilterValue,
  sameIds,
  sameNumberRange,
  sameSorting,
  sameView,
  setColumnHidden,
  setColumnOrder,
  setColumnPinned,
  setColumnWidth,
  setFilter,
  setGrouping,
  setSearch,
  setSorting,
  sortColumn,
  toggleSorting,
  viewMatchesChanged,
}
export type { ViewCapabilities }
