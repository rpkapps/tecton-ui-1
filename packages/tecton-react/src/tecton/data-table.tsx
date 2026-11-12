"use client"

/**
 * Tecton DataTable — a complete data table over records: columns by type
 * (`createColumns`), sorting by one column or several, search and filters,
 * grouping with subtotals, row selection (with "select all" over every
 * page, and every matching row in server mode), pages, rows loaded as the
 * user scrolls, trees, detail rows, a totals row, virtualized rows, links,
 * columns the user resizes, reorders, hides and pins, CSV export, and the
 * empty, no results, error and loading states, with the keyboard and
 * screen reader support of a grid. Data is sorted and paged by the table
 * (`dataMode="client"`) or by the application's server (`"server"`), which
 * the table tells of each change.
 *
 *   <DataTable items={wells} columns={columns} selectionMode="multiple" pagination filterable>
 *     <DataTableToolbar>
 *       <DataTableSearch />
 *       <DataTableFilter column="status" />
 *     </DataTableToolbar>
 *     <DataTableActiveFilters />
 *     <DataTableActionBar>
 *       <Button size="sm">Shut in</Button>
 *     </DataTableActionBar>
 *     <DataTableContent aria-label="Wells" />
 *     <DataTableFooter>
 *       <DataTablePagination pageSizes={[10, 25, 50]} />
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
export { DataTableSearch } from "./internal/data-table/search"
export { DataTableFilter } from "./internal/data-table/filter"
export { DataTableActiveFilters } from "./internal/data-table/active-filters"
export { DataTableColumnsMenu } from "./internal/data-table/columns-menu"
export { DataTableGroupBy } from "./internal/data-table/group-by"
export { DataTableRowActions } from "./internal/data-table/row-actions"
export { DataTableFooter } from "./internal/data-table/footer"
export { DataTableActionBar } from "./internal/data-table/action-bar"
export { DataTablePagination } from "./internal/data-table/pagination"
export { useDataTable } from "./internal/data-table/use-data-table"

export type * from "./internal/data-table/engine/types"
export type { DataTableAllMatching } from "./internal/data-table/engine/selection"
export type { DataTableProps } from "./internal/data-table/root"
export type { DataTableContentProps } from "./internal/data-table/content"
export type { DataTableSearchProps } from "./internal/data-table/search"
export type { DataTableFilterProps } from "./internal/data-table/filter"
export type { DataTableActiveFiltersProps } from "./internal/data-table/active-filters"
export type { DataTableColumnsMenuProps } from "./internal/data-table/columns-menu"
export type { DataTableGroupByProps } from "./internal/data-table/group-by"
export type { DataTableRowActionsProps } from "./internal/data-table/row-actions"
export type { DataTableToolbarProps } from "./internal/data-table/toolbar"
export type { DataTableFooterProps } from "./internal/data-table/footer"
export type { DataTableActionBarProps } from "./internal/data-table/action-bar"
export type { DataTablePaginationProps } from "./internal/data-table/pagination"
export type {
  DataTableChangeDetails,
  DataTableExpandedChangeReason,
  DataTableExportOptions,
  DataTablePageChangeReason,
  DataTablePageSizeChangeReason,
  DataTableRowOrderChangeReason,
  DataTableSelectionChangeDetails,
  DataTableSelectionChangeReason,
  DataTableSelectionMode,
} from "./internal/data-table/context"
export type { UseDataTableResult } from "./internal/data-table/use-data-table"
