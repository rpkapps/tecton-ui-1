/**
 * Internal to `@tecton/react`: DataTable's engine, plain TypeScript with no
 * React. The parts build on it; `data-table.tsx` re-exports `createColumns`
 * and the public types of `./types` only.
 *
 * - `columns`: `createColumns`, the column model, header rows.
 * - `layout`: the columns a view shows, in order, pinned, with widths;
 *   `sizing`: their widths in px and where pinned columns stick.
 * - `format`: display text in the locale, and search's text folding.
 * - `view`: defaults, reconciliation and the view reducers.
 * - `engine`: the row pipeline (`createDataTableEngine`), over the stages
 *   of `core` (rows as positions), `filter` (search, filters, facets),
 *   `group` (groups as ranges), `sort` (rank-based sorting) and `rows`
 *   (display rows and pages; the content adds detail rows with
 *   `withDetailRows`); `idle` prepares ranks and the search index.
 * - `changes`: the rows a change of items added (`addedIds`, for live
 *   data's highlights).
 * - `aggregate`, `pagination`, `selection`: what group rows, the footer
 *   and selection compute.
 *
 * CSV export is in the engine's csv module, left out here so the root can
 * load it on demand, as a separate chunk, when an export is first asked for.
 */
export { aggregate, aggregateColumns } from "./aggregate"
export {
  buildHeaderRows,
  childrenOf,
  clampColumnWidth,
  createColumns,
  getColumnModel,
  orderSiblings,
  parentOf,
  siblingsInOrder,
} from "./columns"
export type {
  ColumnModel,
  ColumnNode,
  EngineColumn,
  EngineColumnGroup,
  HeaderCell,
  HeaderRow,
} from "./columns"
export { addedIds } from "./changes"
export type { CsvOptions } from "./csv"
export { createDataTableEngine } from "./engine"
export type {
  DataTableDataMode,
  DataTableEngine,
  DataTableEngineInput,
  DataTableRowModel,
  SearchParts,
} from "./engine"
export {
  DEFAULT_LABELS,
  foldText,
  getFormatter,
  numberUnit,
  resolveLocale,
} from "./format"
export type { FormatLabels, Formatter, NumberUnit } from "./format"
export type { NumberFacets } from "./filter"
export { layoutColumns } from "./layout"
export type { ColumnLayout } from "./layout"
export {
  columnWidth,
  DEFAULT_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  sizeColumns,
} from "./sizing"
export type { ColumnSizing, SizingOptions } from "./sizing"
export {
  clampPage,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  getPageCount,
  resolvePageSize,
  shouldResetPage,
} from "./pagination"
export {
  ALL_CLOSED,
  ALL_OPEN,
  createDetailCache,
  isGroupClosed,
  withDetailRows,
} from "./rows"
export type {
  BodyRow,
  ClosedGroups,
  DetailCache,
  DetailRow,
  DisplayRow,
  EngineRow,
  GroupRow,
  ItemRow,
  TotalsRow,
} from "./rows"
export type { IdIssues } from "./core"
export {
  allMatchingAfterViewChange,
  allMatchingValue,
  enterAllMatching,
  selectAllIds,
  selectedCount,
  selectionState,
  setSelectedInAllMatching,
  toggleIds,
} from "./selection"
export type { DataTableAllMatching } from "./selection"
export type * from "./types"
export {
  clearFilters,
  createDefaultView,
  DEFAULT_CAPABILITIES,
  hidesEveryColumn,
  reconcileView,
  resetColumns,
  sameColumns,
  sameIds,
  sameFilters,
  sameFilterValue,
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
} from "./view"
export type { ViewCapabilities } from "./view"
