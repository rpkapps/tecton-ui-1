/**
 * English (United States) strings of `DataTableSearch syntax="query"`, a
 * deferred namespace (`../../translations.ts`): loaded with the query
 * field, never bundled with the table, and the source of its types.
 */
import type { TranslationTable } from "../../translations"

const enUS = {
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
    footerAll: "Terms side by side all apply",
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
    unsupportedOr:
      "OR is not supported: every term applies. To match any of several values, separate them with commas.",
    unsupportedNot:
      "Excluding is not supported: filter for the values to keep instead. To search for this text, put it in quotes.",
    exclusiveComparison: "Use >= or <= with a date and time.",
    notComparable: "{column} has no order: choose its values instead.",
    multipleBoolean: "{column} is yes or no, not both.",
    multipleDates: "{column} takes one date or one range, as in 2015..2016.",
    duplicateNoMatch: "No row can match both terms on {column}.",
    duplicateNotCombinable:
      "{column} is filtered earlier in the search: put both in one term.",
  },
} as const satisfies TranslationTable

export default enUS
