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
