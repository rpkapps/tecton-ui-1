/**
 * Pagination (§5.5). Pages count from 1. A page holds `pageSize` rows of the
 * table as shown (item and group rows; a detail row goes with its row and
 * is not counted). The page goes back to 1 when the view's search, filters,
 * sorting or grouping change (`shouldResetPage`), and is clamped to the
 * pages there are when rows go away (`clampPage`). In server mode the
 * server pages: the count of pages comes from `rowCount`, and the loaded
 * rows are the page.
 */
import type { DataTableView } from "./types"
import { sameIds, sameSorting, viewMatchesChanged } from "./view"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_PAGE_SIZES: ReadonlyArray<number> = [10, 20, 50, 100]

/** A whole number of rows from 1; anything else is the default page size. */
function resolvePageSize(pageSize: number | undefined) {
  return pageSize !== undefined && Number.isFinite(pageSize) && pageSize >= 1
    ? Math.floor(pageSize)
    : DEFAULT_PAGE_SIZE
}

/** The number of pages for `rowCount` rows: at least 1, an empty table has one empty page. */
function getPageCount(rowCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(rowCount / resolvePageSize(pageSize)))
}

/** `page` as a whole number from 1 to `pageCount`. */
function clampPage(page: number, pageCount: number) {
  if (!Number.isFinite(page)) return 1
  return Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount))
}

/** Whether going from `previous` to `next` sends the table back to page 1. */
function shouldResetPage(previous: DataTableView, next: DataTableView) {
  return (
    viewMatchesChanged(previous, next) ||
    !sameSorting(previous.sorting, next.sorting) ||
    !sameIds(previous.grouping, next.grouping)
  )
}

export {
  clampPage,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  getPageCount,
  resolvePageSize,
  shouldResetPage,
}
