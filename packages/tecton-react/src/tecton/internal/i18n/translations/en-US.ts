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
    // are formatted numbers).
    rowRange: "{from}–{to} of {total}",
    // The name of the page field, and the words around it ("Page [3] of
    // 5"): {page} is where the field goes, {pageCount} is formatted.
    page: "Page",
    pageOf: "Page {page} of {pageCount}",
    // The names of its arrow buttons.
    previousPage: "Previous page",
    nextPage: "Next page",
    firstPage: "First page",
    lastPage: "Last page",
    // The visible label of the rows-per-page select (named `rowsPerPage`).
    rows: "Rows",
    // The plural form follows the number of rows to select ({total}).
    selectAllMatching: { other: "Select all {total}" },
    clearSelection: "Clear selection",
    // `DataTableActionBar`: its name, and its actions' toolbar.
    selectionBar: "Selected rows",
    selectionActions: "Actions for the selected rows",
    // Read after a load: the plural form follows the number of rows ({total}).
    rowsLoaded: { one: "Showing {total} row", other: "Showing {total} rows" },
    // `loadMore="button"`: the button after the last row, and beside it
    // the rows shown of the rows the view matches (the plural form follows
    // {shown}; {shown} and {total} are formatted).
    showMore: "Show more",
    shownOfTotal: { other: "Showing {shown} of {total}" },
    // Read once "Show more" has loaded rows: the plural form follows the
    // rows added ({total}, formatted).
    moreRowsLoaded: {
      one: "Loaded {total} more row",
      other: "Loaded {total} more rows",
    },
    // Live data (`highlightChanges`). Read when rows are added to the
    // table: the plural form follows the rows added ({total}, formatted).
    rowsAdded: { one: "{total} row added", other: "{total} rows added" },
    // The button over the table's edge for added rows out of view: its
    // text beside an up or down arrow, and its name, which says where
    // they are.
    newRows: { one: "{total} new row", other: "{total} new rows" },
    newRowsAbove: {
      one: "{total} new row above",
      other: "{total} new rows above",
    },
    newRowsBelow: {
      one: "{total} new row below",
      other: "{total} new rows below",
    },
    newRowsOnOtherPages: {
      one: "{total} new row on another page",
      other: "{total} new rows on other pages",
    },
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
    // The column menu's group for the column's direction in a multi-column
    // sort: "Add to sort", or its place ("Sort order: 2 of 3"), then its items.
    addToSort: "Add to sort",
    sortOrderPosition: "Sort order: {position} of {total}",
    ascending: "Ascending",
    descending: "Descending",
    removeFromSort: "Remove from sort",
    // Announced when "Clear sort" removes every sort.
    sortsCleared: "Sorting cleared",
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
    // `DataTableSearch syntax="query"`: its placeholder, and its "?"
    // button and the popover it opens (its other strings are
    // `dataTableQuery`).
    searchOrFilter: "Search or filter",
    searchSyntax: "Search syntax",
    // A filter's button (`DataTableFilter`), named after its column, and
    // the fields in its popover.
    filterBy: "Filter by {columnName}",
    filterContains: "Contains",
    // A text filter: its field ("Contains"), the texts added from it, any
    // of which a row contains (the chips' group), and the field's placeholder.
    filterContainsAny: "Contains any of",
    filterAddText: "Add text…",
    filterMin: "Min",
    filterMax: "Max",
    clearFilter: "Clear",
    noOptions: "No options",
    // A filter's value in words: number and date ranges ({from}, {to} and
    // {value} are formatted numbers or dates).
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    // More than / less than, and a range whose ends are not both included
    // ("> 1,000 and ≤ 3,000"; {min} and {max} are the two ends in words).
    filterMoreThan: "> {value}",
    filterLessThan: "< {value}",
    filterBounds: "{min} and {max}",
    filterFrom: "From {value}",
    filterUntil: "Until {value}",
    // A missing value: what screen readers read for the dash of a cell
    // without one, a filter's choice for the rows without one, and the
    // group of those rows.
    noValue: "No value",
    // A filter's value that also keeps the rows without one ("1,000–2,000
    // or no value"); {value} is the rest of the filter in words.
    filterOrNoValue: "{value} or no value",
    // Under a number or text filter's fields, as they are typed: how many of the
    // rows the search and the other filters keep ({total}) the filter
    // keeps too ({matches}). The plural form follows {matches}; both are
    // formatted.
    filterMatches: {
      one: "{matches} of {total} matches",
      other: "{matches} of {total} match",
    },
    // More than two items chosen in a filter (options, texts, ranges);
    // {total} is formatted.
    optionsSelected: { other: "{total} selected" },
    // Under a number or date filter, which edits a list's first range, when
    // the list has more ({total}, formatted, from a search such as
    // td:<1000,>3000); Clear (`clearFilter`) removes the whole filter.
    filterMoreRanges: {
      one: "This filter has {total} more range. Clear removes it.",
      other: "This filter has {total} more ranges. Clear removes them.",
    },
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
  dataTableQuery: {
    // The help popover (its title is `dataTable.searchSyntax`).
    helpDescription:
      "Type terms side by side: every term applies. A term is text to search for, or a column and its values. Choose an example to add it.",
    // The help's two columns: an example query, and what it finds.
    helpExample: "Example",
    helpFinds: "Finds",
    // What an example finds; {column} is a column's name.
    findsWords: "Rows with this text in any column",
    findsPhrase: "Quotes keep words together",
    findsText: "{column} contains the text",
    findsOptions: "{column} is any of the values listed",
    findsBoolean: "{column} is yes or no",
    findsNumber: "{column} compared with > >= < <=, or a range a..b",
    findsDate:
      "{column} in a year, a month or on a day, before < or after >, in a range a..b, or last30d, thismonth",
    findsNoValue: "{column} has no value",
    helpFooter:
      "Keys and values ignore case. Separate values with commas to match any of them.",
    // A column's type, beside its name in the suggestions.
    typeText: "Text",
    typeNumber: "Number",
    typeDate: "Date",
    typeBoolean: "Yes or no",
    typeOptions: "Options",
    // The groups of the suggestions.
    columnsGroup: "Filter by column",
    matchingGroup: "Matching values",
    compareGroup: "Compare",
    presetsGroup: "Presets",
    yearsGroup: "Years",
    monthsGroup: "Months",
    // Beside "Compare": the column's lowest and highest values among the
    // rows the rest of the search keeps ({min} and {max} are formatted).
    dataRange: "{min} to {max} here",
    // The comparisons offered for a number column, then for a date column.
    equalTo: "Equal to",
    moreThan: "More than",
    atLeast: "At least",
    lessThan: "Less than",
    atMost: "At most",
    between: "Between",
    before: "Before",
    after: "After",
    // Relative dates: the presets the search understands, by name.
    presetToday: "Today",
    presetYesterday: "Yesterday",
    presetThisMonth: "This month",
    presetLastMonth: "Last month",
    presetThisYear: "This year",
    presetLastYear: "Last year",
    // The plural form follows {count}, the number of days, weeks, months
    // or years up to today.
    presetLastDays: { one: "Last {count} day", other: "Last {count} days" },
    presetLastWeeks: { one: "Last {count} week", other: "Last {count} weeks" },
    presetLastMonths: {
      one: "Last {count} month",
      other: "Last {count} months",
    },
    presetLastYears: { one: "Last {count} year", other: "Last {count} years" },
    // The suggestion that moves focus to the calendar, by what it picks.
    pickDates: "Pick dates on the calendar",
    pickDay: "Pick a day on the calendar",
    // Above the calendar, by what the term's value is.
    calendarRange: "Pick a day, or a start and an end",
    calendarBefore: "Before the day you pick",
    calendarAfter: "After the day you pick",
    calendarOnOrBefore: "On or before the day you pick",
    calendarOnOrAfter: "On or after the day you pick",
    // The keys the suggestions take, under them.
    keyMove: "Move",
    keySelect: "Select",
    keyComplete: "Complete",
    keyClose: "Close",
    // The list's line in place of the suggestions when it has none: the
    // free text at the caret is searched for ({text}, as typed, without
    // its quotes), or there is nothing to suggest.
    statusSearching: "Searching all columns for “{text}”",
    noSuggestions: "No suggestions",
    // What the field holds, read with it by screen readers: its filters
    // ({filters}: a list of "Column: value"), its search, its problems
    // (the plural form follows {count}; {problems} are the messages).
    summaryFilters: "Filters: {filters}.",
    summaryNoFilters: "No filters.",
    summarySearch: "Search: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      other: "{count} problems: {problems}",
    },
    // What is wrong with a term. {key} and {value} are as typed, {column}
    // is a column's name, {suggestion} what the user may have meant.
    unknownColumn: "No column is called “{key}”.",
    unknownColumnSuggestion:
      "No column is called “{key}”. Did you mean {suggestion}?",
    columnNotFilterable: "{column} cannot be filtered.",
    unknownValue: "{column} has no value “{value}”.",
    unknownValueSuggestion:
      "{column} has no value “{value}”. Did you mean {suggestion}?",
    notANumber: "“{value}” is not a number.",
    badDate: "“{value}” is not a date.",
    ambiguousNoYear: "“{value}” needs a year, as in 2015-06-30.",
    ambiguousTwoDigitYear:
      "Write the year in full: “{value}” could be in more than one century.",
    ambiguousMonth:
      "“{value}” could be more than one month: write more of its name.",
    backwardsRange: "This range starts after it ends: {from} is after {to}.",
    // The operators the query does not apply, each with what to do instead.
    // {example} is a term of the table's own, written as the user would
    // type it: one of its options columns with two of its values
    // (`status:drilling,producing`); `NoList` when it has none.
    unsupportedOr:
      "OR isn't supported. Rows must match every term. To match one of several values of a column, list them with commas: {example}",
    unsupportedOrNoList:
      "OR isn't supported. Rows must match every term, so search for one thing at a time.",
    // A leading minus (`-plugged`) or NOT and the term after it, left out
    // alike; {example} is a term of the table's own
    // that keeps rows (the options term, else another column's);
    // `NoFilter` when no column can be filtered.
    unsupportedMinus:
      "Excluding isn't supported, so this term is ignored. To search for the text itself, put it in quotes. To narrow the rows, filter for the values to keep instead: {example}",
    unsupportedMinusNoFilter:
      "Excluding isn't supported, so this term is ignored. To search for the text itself, put it in quotes.",
    exclusiveComparison: "Use >= or <= with a date and time.",
    notComparable: "{column} has no order: choose its values instead.",
    duplicateNoMatch: "No row can match both terms on {column}.",
    duplicateNotCombinable:
      "{column} is filtered earlier in the search, and one filter can't require both texts. List them in one term to match any of them.",
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
  numberField: {
    // The names of NumberField's buttons that step the value down and up.
    increase: "Increase",
    decrease: "Decrease",
  },
} as const satisfies TranslationTable

export default enUS
