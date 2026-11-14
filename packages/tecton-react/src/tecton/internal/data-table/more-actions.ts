/**
 * The table's actions that only some parts call: "Select all N" and
 * "Clear" of `DataTableActionBar`, the page size of `DataTablePagination`,
 * "Expand all" and "Collapse all" of `DataTableGroupBy` (and the group
 * counts they are offered by), and the rest of `useDataTable`. Functions
 * of the table's actions (`DataTableActions`, `root.tsx`), built on the
 * same steps (`internals`), in a module of their own: a table whose parts
 * call none of them does not bundle them.
 */
import {
  ALL_CLOSED,
  ALL_OPEN,
  type ClosedGroups,
  enterAllMatching,
  getColumnModel,
  resolvePageSize,
  type DataTableRowModel,
} from "./engine/index"
import type {
  DataTableActions,
  DataTableExportOptions,
  DataTablePageSizeChangeReason,
  DataTableSelectionChangeReason,
  DataTableState,
} from "./context"
import { feature, loadFeature } from "./lazy"
import { emit } from "./root"

/** Back to the default view; whether it changed. */
function resetView<T>(actions: DataTableActions<T>, event?: Event) {
  const current = actions.internals.now()
  current.setClears((count) => count + 1)
  return actions.setView(current.defaults, "reset", event)
}

function setValue<T>(
  actions: DataTableActions<T>,
  value: ReadonlyArray<string>,
  reason: DataTableSelectionChangeReason,
  event?: Event
) {
  actions.internals.commitSelection([...value], reason, event, null)
}

function selectAll<T>(actions: DataTableActions<T>, event?: Event) {
  const { now, commitSelection } = actions.internals
  if (now().selectionMode !== "multiple") return
  commitSelection([...now().selectable()], "select-all", event, null)
}

/** "Select all N": all-matching in server mode, every matching row in client mode. */
function selectAllMatching<T>(actions: DataTableActions<T>, event?: Event) {
  const { now, commitSelection } = actions.internals
  const current = now()
  if (current.selectionMode !== "multiple") return
  if (!current.server) return selectAll(actions, event)
  const { value, allMatching } = enterAllMatching(current.model)
  commitSelection(value, "select-all-matching", event, allMatching)
}

function clearSelection<T>(actions: DataTableActions<T>, event?: Event) {
  actions.internals.commitSelection([], "clear", event, null)
}

// Every group, those of a grouping set in the same handler too: kept as
// "all", not as the groups there are now. Nothing to do without a
// grouping, or with every group so already.
function expandAllGroups<T>(actions: DataTableActions<T>) {
  const { now, closedNow, setClosed } = actions.internals
  const closed = closedNow()
  if (now().view.grouping.length === 0) return
  if (!closed.all && closed.keys.size === 0) return
  setClosed(ALL_OPEN)
}

function collapseAllGroups<T>(actions: DataTableActions<T>) {
  const { now, closedNow, setClosed } = actions.internals
  const closed = closedNow()
  if (now().view.grouping.length === 0) return
  if (closed.all && closed.keys.size === 0) return
  setClosed(ALL_CLOSED)
}

type GroupCounts = { readonly total: number; readonly closed: number }

/** The counts of each set of groups, by their keys and the closed groups. */
const counted = new WeakMap<
  ReadonlyArray<string>,
  WeakMap<ClosedGroups, GroupCounts>
>()

/**
 * How many groups (of those the search and filters keep) there are and
 * how many are closed, for "Expand all" / "Collapse all": counted once
 * per grouping and closing.
 */
function groupCounts<T>({ model, closedGroups }: DataTableState<T>) {
  const keys = model.groupKeys()
  let byClosed = counted.get(keys)
  if (!byClosed) counted.set(keys, (byClosed = new WeakMap()))
  let counts = byClosed.get(closedGroups)
  if (!counts) {
    let listed = 0
    if (closedGroups.keys.size > 0) {
      const shown = new Set(keys)
      for (const key of closedGroups.keys) if (shown.has(key)) listed++
    }
    counts = {
      total: keys.length,
      closed: closedGroups.all ? keys.length - listed : listed,
    }
    byClosed.set(closedGroups, counts)
  }
  return counts
}

function setPageSize<T>(
  actions: DataTableActions<T>,
  pageSize: number,
  reason: DataTablePageSizeChangeReason,
  event?: Event
) {
  const { now, set, changePage } = actions.internals
  const current = now()
  const next = resolvePageSize(pageSize)
  if (next === current.pageSize) return
  if (!emit(current.onPageSizeChange, current.setPageSize, next, reason, event))
    return
  set({ pageSize: next })
  // The page that holds the first row shown, so the reader stays put.
  const { model } = current
  const page = Math.floor(((model.page - 1) * model.pageSize) / next) + 1
  if (page !== current.page) changePage(page, "page-size", event)
}

/** `exportCsv`'s module: loaded when it is first called, never prefetched. */
const CSV = feature(() => import("./engine/csv"))

/** The rows of `ids`: the matching ones in display order, then the rest. */
function itemsOf<T>(model: DataTableRowModel<T>, ids: ReadonlyArray<string>) {
  const wanted = new Set(ids)
  const items: Array<T> = []
  for (const id of model.matchingIds())
    if (wanted.delete(id)) items.push(model.item(id) as T)
  for (const id of wanted) {
    const item = model.item(id)
    if (item !== undefined) items.push(item)
  }
  return items
}

async function exportCsv<T>(
  actions: DataTableActions<T>,
  options: DataTableExportOptions = {}
) {
  const { toCsv } = await loadFeature(CSV)
  // Read once loaded: the state the export was asked for, or later.
  const { model, layout, formatter, value, view, columns } =
    actions.internals.now()
  const rows = options.rows ?? "filtered"
  const items =
    rows === "page"
      ? model.pageItems()
      : rows === "selected"
        ? itemsOf(model, value)
        : model.filteredItems()
  const { byId } = getColumnModel(columns)
  const shown =
    options.columns === "all"
      ? view.columns.order.flatMap((id) => byId.get(id) ?? [])
      : layout.columns
  return toCsv(items, shown, formatter, options)
}

export {
  clearSelection,
  collapseAllGroups,
  expandAllGroups,
  exportCsv,
  groupCounts,
  resetView,
  selectAll,
  selectAllMatching,
  setPageSize,
  setValue,
}
