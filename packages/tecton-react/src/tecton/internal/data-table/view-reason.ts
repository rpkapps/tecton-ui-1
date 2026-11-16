/**
 * The reason `onViewChange` gives for a change of the view: the piece that
 * changed, filters before search (clearing both is "filter"), and "reset"
 * when the change is of several column pieces at once or none.
 */
import type { DataTableView, DataTableViewChangeReason } from "./engine/index"

function viewChangeReason(
  previous: DataTableView,
  next: DataTableView
): DataTableViewChangeReason {
  if (previous.sorting !== next.sorting) return "sort"
  if (previous.filters !== next.filters) return "filter"
  if (previous.search !== next.search) return "search"
  if (previous.grouping !== next.grouping) return "group"
  const before = previous.columns
  const after = next.columns
  if (before.widths !== after.widths) return "resize"
  if (before.order !== after.order) return "reorder"
  if (before.hidden !== after.hidden) return "hide"
  if (before.pinned !== after.pinned) return "pin"
  return "reset"
}

export { viewChangeReason }
