"use client"

/**
 * Tecton DataTable — a complete data table over records: columns by type
 * (`createColumns`), sorting by one column or several, row selection (with
 * "select all" over every page, and every matching row in server mode),
 * pages, trees, virtualized rows, links, and the empty, no results, error
 * and loading states, with the keyboard and screen reader support of a
 * grid. Data is sorted and paged by the table (`dataMode="client"`) or by
 * the application's server (`"server"`), which the table tells of each
 * change.
 *
 *   <DataTable items={wells} columns={columns} selectionMode="multiple" pagination>
 *     <DataTableContent aria-label="Wells" />
 *     <DataTableFooter>
 *       <DataTableSelectionCount />
 *       <DataTablePageSize />
 *       <DataTablePageInfo />
 *       <DataTablePageButtons />
 *     </DataTableFooter>
 *   </DataTable>
 *
 * Each part is a module of its own: an application bundles the parts it
 * imports.
 */
export { createColumns } from "./internal/data-table/engine/columns"
export { DataTable } from "./internal/data-table/root"
export { DataTableContent } from "./internal/data-table/content"
export { DataTableToolbar } from "./internal/data-table/toolbar"
export { DataTableFooter } from "./internal/data-table/footer"
export { DataTableSelectionCount } from "./internal/data-table/selection-count"
export {
  DataTablePageButtons,
  DataTablePageInfo,
  DataTablePageSize,
} from "./internal/data-table/pagination"
export { useDataTable } from "./internal/data-table/use-data-table"

export type * from "./internal/data-table/engine/types"
export type { DataTableAllMatching } from "./internal/data-table/engine/selection"
export type { DataTableProps } from "./internal/data-table/root"
export type { DataTableContentProps } from "./internal/data-table/content"
export type {
  DataTableChangeDetails,
  DataTableExpandedChangeReason,
  DataTableExportOptions,
  DataTablePageChangeReason,
  DataTablePageSizeChangeReason,
  DataTableSelectionChangeDetails,
  DataTableSelectionChangeReason,
  DataTableSelectionMode,
} from "./internal/data-table/context"
export type { UseDataTableResult } from "./internal/data-table/use-data-table"
