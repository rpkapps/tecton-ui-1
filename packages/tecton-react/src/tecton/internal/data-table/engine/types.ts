/**
 * The public types of `DataTable`'s columns and view. `data-table.tsx`
 * re-exports them as they are, so nothing here names the libraries the
 * engine runs on, and every type is plain data (the view is JSON but for the
 * `Date`s of a date filter).
 */
import type * as React from "react"
import type { VariantProps } from "class-variance-authority"

import type { badgeVariants } from "@tecton/react/badge"

/** How a column's values are shown, sorted, filtered, edited and summed. */
type DataTableColumnType = "text" | "number" | "date" | "boolean" | "options"

/** A cell's value, as a column's `accessor` returns it. */
type DataTableValue = string | number | boolean | Date | null | undefined

/** The `Badge` variant an option is drawn with. */
type DataTableBadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>

/** One value of an `options` column. */
type DataTableOption = {
  value: string
  label: string
  variant?: DataTableBadgeVariant
  /** The number of matching rows, shown in the filter in server mode. */
  count?: number
}

/**
 * How group rows and the totals row sum up a column: a built-in, or a
 * function of the group's values (in row order) and items.
 *
 * - `sum`, `avg`: of the numeric values.
 * - `min`, `max`: of the numbers or dates.
 * - `count`: of the values that are there (not empty, not `false`), so a
 *   boolean column counts its `true`s.
 * - `countDistinct`: of the different values, `false` included.
 *
 * Empty values are skipped; with no value to sum, the result is `null`.
 */
type DataTableAggregate<T> =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "countDistinct"
  | ((
      values: ReadonlyArray<DataTableValue>,
      items: ReadonlyArray<T>
    ) => DataTableValue)

/** The second argument of a column's `cell`. */
type DataTableCellDetails = {
  /** The row's id. */
  id: string
  /** The column's id. */
  column: string
  /** The cell's value, from the column's `accessor`. */
  value: DataTableValue
  /** The value as display text, formatted in the locale. */
  text: string
  /** How deep the row is in a tree or in groups, from 0. */
  depth: number
  /**
   * What the column shows for no value (`text` is `""`): its `emptyValue`,
   * or the muted em dash read as "No value". Return it for an empty value
   * to keep the table's convention.
   */
  emptyValue: React.ReactNode
}

/** The argument of a column's `renderHeader`. */
type DataTableHeaderDetails = {
  /** The column's id. */
  column: string
  /** The column's `header`. */
  header: string
  /** The column's sort direction, `null` while it is not sorted. */
  sorted: DataTableSort["direction"] | null
}

type DataTableLeafColumn<T> = {
  /** Unique among the table's columns and groups. */
  id: string
  /** Plain text: the header, and the column's name in menus, resizing and announcements. */
  header: string
  /** Shown as an info tooltip in the header (units, definitions). */
  description?: string
  /** `"text"` by default. */
  type?: DataTableColumnType
  /** The cell's value: a key of the item, or a function. `item[id]` by default. */
  accessor?: keyof T | ((item: T) => DataTableValue)
  /** `Intl.NumberFormatOptions` for a number column, `Intl.DateTimeFormatOptions` for a date column. */
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions
  /** For an `options` column: its values, in sort order. */
  options?: ReadonlyArray<DataTableOption>
  cell?: (item: T, details: DataTableCellDetails) => React.ReactNode
  /**
   * What a cell with no value shows (`null`, `undefined`, `""`, an invalid
   * number or date): a muted em dash, read as "No value", by default;
   * `null` leaves the cell blank. A `cell` gets it as `emptyValue`.
   */
  emptyValue?: React.ReactNode
  renderHeader?: (details: DataTableHeaderDetails) => React.ReactNode
  /** By type by default: numbers at the end, booleans centred, the rest at the start. */
  align?: "start" | "center" | "end"
  /** By type by default: `sum` for numbers, `count` for booleans, none otherwise. */
  aggregate?: DataTableAggregate<T>
  renderAggregate?: (
    value: DataTableValue,
    details: { items: ReadonlyArray<T> }
  ) => React.ReactNode
  /** Sorts the column's rows in place of its type's order; ascending, like `Array#sort`. */
  compare?: (a: T, b: T) => number
  /** Filters the column's rows in place of its type's filter, for any filter value. */
  filter?: (item: T, filterValue: DataTableFilterValue) => boolean
  /** In px. */
  width?: number
  /** In px. */
  minWidth?: number
  /** In px. */
  maxWidth?: number
  /** Multi-line text. */
  wrap?: boolean
  hideBelow?: "sm" | "md" | "lg"
  /** Names the row and carries the tree's chevron and indent: the first column by default. */
  rowHeader?: boolean
  sortable?: false
  filterable?: false
  groupable?: false
  resizable?: false
  reorderable?: false
  hideable?: false
  pinnable?: false
  columns?: never
}

/** Columns under a shared header. */
type DataTableColumnGroup<T> = {
  /** Unique among the table's columns and groups. */
  id: string
  header: string
  description?: string
  columns: ReadonlyArray<DataTableColumn<T>>
}

type DataTableColumn<T> = DataTableLeafColumn<T> | DataTableColumnGroup<T>

declare const dataTableColumns: unique symbol

/** Columns made by `createColumns`, for `DataTable`'s `columns`. */
type DataTableColumns<T> = {
  readonly [dataTableColumns]: (item: T) => void
}

type DataTableSort = {
  column: string
  direction: "ascending" | "descending"
}

/**
 * A number filter's range. Both ends are included and either may be left
 * out; `minExclusive: true` / `maxExclusive: true` leave the bound's own
 * value out (more than `min`, less than `max`): what the search's `>` and
 * `<` set.
 */
type DataTableNumberRange = {
  min?: number
  max?: number
  /** `min` itself does not match: more than `min`. */
  minExclusive?: true
  /** `max` itself does not match: less than `max`. */
  maxExclusive?: true
}

/**
 * A date filter's range. Both ends are included and either may be left
 * out; a `to` at midnight includes that whole day.
 */
type DataTableDateRange = { from?: Date; to?: Date }

/**
 * A column's filter, by the column's type; `custom` is for a column with a
 * `filter` function. Every type holds a list, and a row matches when its
 * value matches any item of it: a text it contains, one of the options or
 * of yes / no, a number or date range it is in.
 *
 * `empty: true` is the filter's "No value": the rows without a value match
 * too, besides those the list matches, or alone when the list is empty.
 * Without it an empty value never matches.
 */
type DataTableFilterValue =
  | { type: "text"; values: ReadonlyArray<string>; empty?: boolean }
  | {
      type: "number"
      ranges: ReadonlyArray<DataTableNumberRange>
      empty?: boolean
    }
  | {
      type: "date"
      ranges: ReadonlyArray<DataTableDateRange>
      empty?: boolean
    }
  | { type: "boolean"; values: ReadonlyArray<boolean>; empty?: boolean }
  | { type: "options"; values: ReadonlyArray<string>; empty?: boolean }
  | { type: "custom"; value: unknown }

/**
 * What the table shows: serializable as JSON, but for the `Date`s of a date
 * filter (an ISO string there is read as a date).
 */
type DataTableView = {
  sorting: ReadonlyArray<DataTableSort>
  search: string
  filters: Readonly<Record<string, DataTableFilterValue>>
  grouping: ReadonlyArray<string>
  columns: {
    order: ReadonlyArray<string>
    hidden: ReadonlyArray<string>
    widths: Readonly<Record<string, number>>
    pinned: { start: ReadonlyArray<string>; end: ReadonlyArray<string> }
  }
}

/** A view with any part left out, as `defaultView` takes it. */
type DataTablePartialView = {
  sorting?: ReadonlyArray<DataTableSort>
  search?: string
  filters?: Readonly<Record<string, DataTableFilterValue>>
  grouping?: ReadonlyArray<string>
  columns?: {
    order?: ReadonlyArray<string>
    hidden?: ReadonlyArray<string>
    widths?: Readonly<Record<string, number>>
    pinned?: { start?: ReadonlyArray<string>; end?: ReadonlyArray<string> }
  }
}

type DataTableViewChangeReason =
  | "sort"
  | "search"
  | "filter"
  | "group"
  | "resize"
  | "reorder"
  | "hide"
  | "pin"
  | "reset"

export type {
  DataTableAggregate,
  DataTableBadgeVariant,
  DataTableCellDetails,
  DataTableColumn,
  DataTableColumnGroup,
  DataTableColumns,
  DataTableColumnType,
  DataTableDateRange,
  DataTableFilterValue,
  DataTableHeaderDetails,
  DataTableLeafColumn,
  DataTableNumberRange,
  DataTableOption,
  DataTablePartialView,
  DataTableSort,
  DataTableValue,
  DataTableView,
  DataTableViewChangeReason,
}
