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
    // Grouping: the group-by button and menu (`DataTableGroupBy`), where a
    // grouping column moves a level up (before the one above it), and the
    // items of a column header's menu.
    groupBy: "Group by",
    groupOrder: "Order",
    moveGroupUp: "Move {columnName} up",
    ungroupAll: "Ungroup all",
    expandAllGroups: "Expand all groups",
    collapseAllGroups: "Collapse all groups",
    groupByColumn: "Group by column",
    ungroupColumn: "Ungroup column",
    // Announced when the grouping changes; {columnNames} is a list of
    // column names ("Field and Status").
    groupedBy: "Grouped by {columnNames}",
    ungrouped: "Rows no longer grouped",
    // A group row: the grouping column's name and the group's value
    // ("Field: Gullfaks"), the value of rows that have none, and the
    // number of rows in the group ({total} is formatted).
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Empty)",
    groupCount: { one: "{total} row", other: "{total} rows" },
    // A group row's name for screen readers: its label and its count,
    // with a pause between them ("Field: Gullfaks, 6 rows").
    groupRowLabel: "{label}, {rows}",
    // Cell selection: announced as cells are selected, copied, pasted,
    // cleared (Delete) and filled down (Ctrl + D); {total} is formatted.
    cellsSelected: {
      one: "{total} cell selected",
      other: "{total} cells selected",
    },
    cellsCopied: { one: "Copied {total} cell", other: "Copied {total} cells" },
    cellsPasted: {
      "=0": "No cells pasted",
      one: "Pasted {total} cell",
      other: "Pasted {total} cells",
    },
    cellsCleared: {
      "=0": "No cells cleared",
      one: "Cleared {total} cell",
      other: "Cleared {total} cells",
    },
    cellsFilled: {
      "=0": "No cells filled",
      one: "Filled {total} cell",
      other: "Filled {total} cells",
    },
    // After one of the above, in a list with it ("Pasted 6 cells, 2 not
    // editable, 1 not valid, Depth (m): Enter a number").
    cellsSkipped: { other: "{total} not editable" },
    cellsInvalid: { other: "{total} not valid" },
    // A cell's message: its column's name and why its value was refused.
    cellMessage: "{columnName}: {message}",
    // A cell's message in its tooltip and description: the value refused
    // (or not saved) and why.
    refusedValue: "“{value}”: {message}",
    // Copy, paste, Delete or fill down with focus off the data cells (on a
    // header, a group row or the totals row).
    selectCellsFirst: "Select cells first",
    // Announced when a save of written cells fails; {message} is the
    // application's error.
    cellsNotSaved: {
      one: "{total} cell not saved: {message}",
      other: "{total} cells not saved: {message}",
    },
    saveFailed: "The change could not be saved",
    // Several ranges that share neither their rows nor their columns.
    copyMultiple:
      "These ranges cannot be copied together: select ranges in the same rows or in the same columns",
    pasteMultiple: "A block of cells cannot be pasted into several ranges",
    copyFailed: "The cells could not be copied to the clipboard",
    // Why a pasted text is refused, by the column's type ({yes} and {no}
    // are the words above).
    invalidValue: "Not a valid value",
    invalidNumber: "Enter a number",
    invalidDate: "Enter a date",
    invalidBoolean: "Enter {yes} or {no}",
    invalidOption: "Choose one of the options",
    // Editing (`editable`): an editor's name, its column's and its row's
    // ("Depth, Troll A-1"); said once a save that took a while is done;
    // the date editor's calendar button; the options editor's list when
    // nothing matches what was typed; an edit whose row went away (removed
    // or disabled by new data).
    editorLabel: "{columnName}, {rowName}",
    cellSaved: "Saved",
    chooseDate: "Choose a date",
    noMatchingOptions: "No matching options",
    editDiscarded: "Edit discarded: the row is no longer available",
    // `DataTableCellSummary`: its name, and its figures over the selected
    // cells ({value} is formatted).
    cellSummary: "Selected cells",
    summarySum: "Sum: {value}",
    summaryAverage: "Average: {value}",
    summaryNumericCount: "Numerical count: {value}",
    summaryCount: "Count: {value}",
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
