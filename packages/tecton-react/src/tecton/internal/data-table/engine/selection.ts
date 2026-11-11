/**
 * Row selection over the row model (§5.3), not the DOM: rows out of view and
 * on other pages count. Rows select independently (a tree's parents too);
 * disabled rows never select, whichever `disabledBehavior`.
 *
 * - "Select all" (header checkbox, Ctrl+A) selects every matching item: on
 *   every page in client mode, the loaded items in server mode
 *   (`selectAllIds`), not the rows a filtered tree shows only as context
 *   for its matches; the header checkbox shows `selectionState`.
 * - A group row's checkbox selects or clears its items (`toggleIds`).
 * - Server mode "Select all N" enters all-matching (`enterAllMatching`):
 *   `value` is the loaded items, `allMatching.except` the rows deselected
 *   since; rows loaded later come selected (`allMatchingValue`), and a
 *   change of search or filters leaves it (`allMatchingAfterViewChange`).
 *
 * Values are arrays of ids in the order rows were selected; the functions
 * take a `Set` too, for large selections.
 */
import type { DataTableRowModel } from "./engine"
import type { GroupRow } from "./rows"
import type { DataTableView } from "./types"
import { viewMatchesChanged } from "./view"

/** Server mode's "every row the view matches", but `except`. */
type DataTableAllMatching = { except: ReadonlyArray<string> }

type Ids = ReadonlyArray<string> | ReadonlySet<string>

function asSet(ids: Ids): ReadonlySet<string> {
  return ids instanceof Set ? ids : new Set(ids)
}

/** The items "select all" selects: every matching item that is not disabled. */
function selectAllIds<T>(model: DataTableRowModel<T>): Array<string> {
  return model.matchingIds().filter((id) => !model.isDisabled(id))
}

/** A group's items that can be selected. */
function groupIds<T>(
  model: DataTableRowModel<T>,
  group: GroupRow
): Array<string> {
  return model.groupIds(group.key).filter((id) => !model.isDisabled(id))
}

/**
 * How many of `ids` are selected, for a checkbox over them: `"all"`
 * (checked), `"some"` (indeterminate) or `"none"`; an empty `ids` is `"none"`.
 */
function selectionState(
  selected: Ids,
  ids: ReadonlyArray<string>
): "all" | "some" | "none" {
  const set = asSet(selected)
  let count = 0
  for (const id of ids) if (set.has(id)) count++
  return count === 0 ? "none" : count === ids.length ? "all" : "some"
}

/** What a checkbox over `ids` does: selects them all, or clears them when all are selected. */
function toggleIds(selected: Ids, ids: ReadonlyArray<string>): Array<string> {
  const current = [...selected]
  if (selectionState(selected, ids) === "all") {
    const remove = new Set(ids)
    return current.filter((id) => !remove.has(id))
  }
  const set = new Set(current)
  for (const id of ids) if (!set.has(id)) current.push(id)
  return current
}

/** Server mode "Select all N": the loaded items selected, nothing excepted. */
function enterAllMatching<T>(model: DataTableRowModel<T>): {
  value: Array<string>
  allMatching: DataTableAllMatching
} {
  return { value: selectAllIds(model), allMatching: { except: [] } }
}

/** Selects or deselects one row while in all-matching: a deselected row is excepted. */
function setSelectedInAllMatching(
  value: ReadonlyArray<string>,
  allMatching: DataTableAllMatching,
  id: string,
  selected: boolean
): { value: Array<string>; allMatching: DataTableAllMatching } {
  const except = allMatching.except.filter((other) => other !== id)
  if (selected)
    return {
      value: value.includes(id) ? [...value] : [...value, id],
      allMatching: { except },
    }
  return {
    value: value.filter((other) => other !== id),
    allMatching: { except: [...except, id] },
  }
}

/** The selection while in all-matching: every loaded, selectable item but the excepted. */
function allMatchingValue<T>(
  model: DataTableRowModel<T>,
  allMatching: DataTableAllMatching
): Array<string> {
  const except = new Set(allMatching.except)
  return selectAllIds(model).filter((id) => !except.has(id))
}

/** All-matching after a view change: left (`null`) when search or filters changed. */
function allMatchingAfterViewChange(
  previous: DataTableView,
  next: DataTableView,
  allMatching: DataTableAllMatching | null
): DataTableAllMatching | null {
  return allMatching && viewMatchesChanged(previous, next) ? null : allMatching
}

/**
 * The number of selected rows: in all-matching, the rows the server
 * matches (`rowCount`) but the excepted; else the selection's size.
 */
function selectedCount(
  selected: Ids,
  allMatching: DataTableAllMatching | null,
  rowCount: number
): number {
  if (allMatching) return Math.max(0, rowCount - allMatching.except.length)
  return asSet(selected).size
}

export {
  allMatchingAfterViewChange,
  allMatchingValue,
  enterAllMatching,
  groupIds,
  selectAllIds,
  selectedCount,
  selectionState,
  setSelectedInAllMatching,
  toggleIds,
}
export type { DataTableAllMatching }
