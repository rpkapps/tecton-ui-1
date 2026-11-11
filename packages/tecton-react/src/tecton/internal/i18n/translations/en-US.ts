/**
 * English (United States): the default, bundled with every component, and
 * the source of the translation types (namespaces, keys and placeholders).
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import type { TranslationTable } from "../translations"

const enUS = {
  grid: {
    selectedItem: "{item} selected.",
    deselectedItem: "{item} not selected.",
    selectedCount: {
      "=0": "No items selected.",
      one: "{count} item selected.",
      other: "{count} items selected.",
    },
    selectedAll: "All items selected.",
  },
  chip: {
    removeButtonLabel: "Remove",
    removeDescription: "Press Delete to remove tag.",
  },
  tree: {
    expand: "Expand",
    collapse: "Collapse",
  },
  dragAndDrop: {
    dragItem: "Drag {itemText}",
    dragStartedKeyboard:
      "Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.",
    dragStartedVirtual:
      "Started dragging. Navigate to a drop target, then click or press Enter to drop.",
    dropCanceled: "Drop canceled.",
    dropComplete: "Drop complete.",
    dropOnItem: "Drop on {itemText}",
    insertBefore: "Insert before {itemText}",
    insertBetween: "Insert between {beforeItemText} and {afterItemText}",
    insertAfter: "Insert after {itemText}",
  },
  table: {
    select: "Select",
    selectAll: "Select All",
    ascendingSort: "sorted by column {columnName} in ascending order",
    descendingSort: "sorted by column {columnName} in descending order",
  },
  dataTable: {
    loading: "Loading",
    emptyTitle: "No rows",
    emptyDescription: "There is nothing to show here yet.",
    noResultsTitle: "No results",
    noResultsDescription: "No rows match the search and filters.",
    clearFilters: "Clear filters",
    errorTitle: "The rows could not be loaded",
    errorDescription: "Something went wrong while loading the data.",
    retry: "Retry",
    rowsPerPage: "Rows per page",
    pageInfo: "Page {page} of {pageCount}",
    pagination: "Pagination",
    firstPage: "First page",
    previousPage: "Previous page",
    nextPage: "Next page",
    lastPage: "Last page",
    // The plural form follows the number of selected rows ({selected});
    // {total} is the number of rows the view matches. Both are formatted.
    selectedCount: { other: "{selected} of {total} selected" },
    // The plural form follows the number of rows to select ({total}).
    selectAllMatching: { other: "Select all {total}" },
    clearSelection: "Clear selection",
    // Read after a load: the plural form follows the number of rows ({total}).
    rowsLoaded: { one: "Showing {total} row", other: "Showing {total} rows" },
    // In a sort button, when the table sorts by several columns.
    sortPositionAscending:
      "sorted in ascending order, {position} of {total} in sort order",
    sortPositionDescending:
      "sorted in descending order, {position} of {total} in sort order",
    // Announced when a column joins or changes place in a multi-column sort.
    sortAddedAscending: "{columnName} sorted ascending, {position} of {total}",
    sortAddedDescending:
      "{columnName} sorted descending, {position} of {total}",
    sortCleared: "{columnName} no longer sorted",
    yes: "Yes",
    no: "No",
    // The columns menu (`DataTableColumnsMenu`): its button, its sections
    // and its last item.
    columns: "Columns",
    showColumns: "Show columns",
    pinColumns: "Pin columns",
    // Where a column is pinned: the choices for it in the columns menu
    // (the start is the left in left-to-right languages).
    notPinned: "Not pinned",
    pinnedStart: "Start",
    pinnedEnd: "End",
    resetColumns: "Reset columns",
    // A column header's menu button and its items.
    columnMenu: "{columnName} options",
    sortAscending: "Sort ascending",
    sortDescending: "Sort descending",
    clearSort: "Clear sort",
    // Focuses the column's resizer: the arrow keys then resize it.
    resizeColumn: "Resize column",
    fitColumn: "Fit to content",
    resetColumnWidth: "Reset width",
    // Read with the resizer while the arrow keys resize the column.
    resizeHint:
      "Use the left and right arrow keys to resize the column. Press Enter to keep the width or Escape to cancel.",
    hideColumn: "Hide column",
    pinToStart: "Pin to start",
    pinToEnd: "Pin to end",
    unpin: "Unpin",
    // The button in a column header that shows the column's description.
    columnDescription: "About {columnName}",
    // Announced when a column header's menu hides or pins its column.
    columnHidden: "{columnName} hidden",
    columnShown: "{columnName} shown",
    columnPinnedStart: "{columnName} pinned to the start",
    columnPinnedEnd: "{columnName} pinned to the end",
    columnUnpinned: "{columnName} unpinned",
    // The search field (`DataTableSearch`): its placeholder and name, and
    // its clear button.
    search: "Search",
    // The search's chip among the active filters ("Search: well 4"): a noun.
    searchChip: "Search",
    clearSearch: "Clear search",
    // A filter's button (`DataTableFilter`), named after its column, and
    // the fields in its popover.
    filterBy: "Filter by {columnName}",
    filterContains: "Contains",
    filterMin: "Min",
    filterMax: "Max",
    // A yes / no filter's choice that keeps every row.
    filterAny: "Any",
    clearFilter: "Clear",
    noOptions: "No options",
    // A filter's value in words: number and date ranges ({from}, {to} and
    // {value} are formatted numbers or dates).
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "From {value}",
    filterUntil: "Until {value}",
    // More than two options chosen in a filter; {total} is formatted.
    optionsSelected: { other: "{total} selected" },
    // A chip of the active filters: the column's name and the filter's
    // value ("Status: Producing, Drilling").
    filterChip: "{columnName}: {value}",
    activeFilters: "Active filters",
    clearAll: "Clear all",
    // Read once the search or filters change; {total} is formatted.
    resultsCount: { one: "{total} result", other: "{total} results" },
    // The button of a row's menu (`DataTableRowActions`).
    rowActions: "Row actions",
    // The column of the rows' drag handles, for screen readers.
    reorderRowsColumn: "Reorder",
    // Names the totals row.
    total: "Total",
  },
  tableColumnResizer: {
    resize: "Resize {columnName}",
  },
  reorderable: {
    keepHere: "Keep {itemText} here",
    swapWith: "Swap with {itemText}",
    moveTo: "Move to {slotText}",
    emptySlot: "empty slot {index}",
  },
} as const satisfies TranslationTable

export default enUS
