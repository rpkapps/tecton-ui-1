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
    pagination: "Pagination",
    // `DataTablePagination`: the rows of the page ({from}, {to} and {total}
    // are formatted numbers), the short labels of its previous and next
    // buttons, and the name of a page's button.
    rowRange: "{from}–{to} of {total}",
    previous: "Previous",
    next: "Next",
    goToPage: "Page {page}",
    // The page shown, where the table is too narrow for the page buttons.
    pageOf: "Page {page} of {pageCount}",
    previousPage: "Previous page",
    nextPage: "Next page",
    // The page picker, opened from the pagination's ellipses (named after
    // it) and from "Page 3 of 5": its page field's label, the field's hint
    // (the pages there are; {from} and {to} are formatted numbers), its
    // button, and its message for a page outside them.
    pagePicker: "Go to page",
    pagePickerHint: "{from}–{to}",
    pagePickerGo: "Go",
    pagePickerInvalid: "Enter a page from {from} to {to}",
    // The plural form follows the number of rows to select ({total}).
    selectAllMatching: { other: "Select all {total}" },
    clearSelection: "Clear selection",
    // `DataTableActionBar`: its name, and its actions' toolbar.
    selectionBar: "Selected rows",
    selectionActions: "Actions for the selected rows",
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
    // The name of `DataTableToolbar`.
    toolbar: "Table tools",
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
    // A missing value: what screen readers read for the dash of a cell
    // without one, a filter's choice for the rows without one, and the
    // group of those rows.
    noValue: "No value",
    // A filter's value that also keeps the rows without one ("1,000–2,000
    // or no value"); {value} is the rest of the filter in words.
    filterOrNoValue: "{value} or no value",
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
    // ("Field: Gullfaks"; `noValue` for the rows that have none), and the
    // number of rows in the group ({total} is formatted).
    groupLabel: "{columnName}: {value}",
    groupCount: { one: "{total} row", other: "{total} rows" },
    // A group row's name for screen readers: its label and its count,
    // with a pause between them ("Field: Gullfaks, 6 rows").
    groupRowLabel: "{label}, {rows}",
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
  datePicker: {
    // The trigger's text while no date is picked.
    placeholder: "Pick a date",
    rangePlaceholder: "Pick a date range",
    // The calendar button of the date input, and the calendar's popover.
    chooseDate: "Choose a date",
    chooseDateRange: "Choose a date range",
    // The buttons under a range calendar that pick a range at once.
    presets: "Presets",
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    thisMonth: "This month",
    lastMonth: "Last month",
    // The button under the calendar that empties the date or the range.
    clear: "Clear",
  },
  actionBar: {
    // The selection summary. The plural form follows the number selected
    // ({selected}); {total} is how many there are; both are formatted.
    // {label} is the application's noun for the items, e.g. "wells".
    selectedOfTotal: { other: "{selected} of {total} selected" },
    selectedOfTotalLabelled: {
      other: "{selected} of {total} {label} selected",
    },
    selected: { other: "{selected} selected" },
    selectedLabelled: { other: "{selected} {label} selected" },
    clear: "Clear",
    clearSelection: "Clear selection",
    // The name of the actions toolbar.
    actions: "Actions",
  },
  overflow: {
    // The name of the "⋯" button that opens the menu of the items that do
    // not fit in a toolbar or row.
    moreActions: "More actions",
  },
} as const satisfies TranslationTable

export default enUS
