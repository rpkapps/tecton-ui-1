/**
 * The public types of `DataTable`'s columns and view. `data-table.tsx`
 * re-exports them as they are, so nothing here names the libraries the
 * engine runs on, and every type is plain data (the view is JSON but for the
 * `Date`s of a date filter).
 */
import type * as React from "react"
import type { VariantProps } from "class-variance-authority"

import type { badgeVariants } from "@tecton/react/components/badge"

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

/**
 * The props of a column's `renderEditor`: an editor of its own for the
 * column's cells, drawn over the cell being edited (the cell keeps its
 * size; the editor fills it). Enter saves and moves down, Shift + Enter
 * up, Tab and Shift + Tab to the next and previous cell, Escape cancels,
 * unless the editor prevents the key's default (a list taking Enter).
 */
type DataTableEditorProps<T> = {
  item: T
  /** The column's id. */
  column: string
  /**
   * The value being edited: the cell's, or the text it began with
   * (`initialText`: the character typed) read as the column's value,
   * `null` when that text does not read as one ("-" in a number column).
   */
  value: DataTableValue
  /**
   * The text the edit began with: the character typed (an edit begun by
   * typing), else the value as the built-in editor shows it (Enter, F2, a
   * double click), or the text of a save that failed. Start a field from
   * it, so a character typed is not lost.
   */
  initialText: string | null
  onValueChange: (value: DataTableValue) => void
  /**
   * Saves the value (checked by the column's `validate` first) and ends
   * the edit; `move`: where focus goes then (`"none"`, the cell, by
   * default).
   */
  commit: (options?: {
    move?: "down" | "up" | "next" | "previous" | "none"
  }) => void
  /** Ends the edit without saving. */
  cancel: () => void
  /** Why the value was not saved (the column's `validate`), `null` while it is valid. */
  error: string | null
  /**
   * For the element that takes focus (an input): its `ref` (focused as the
   * edit begins), its name, `aria-invalid` and `aria-describedby` with the
   * error, and a `className` that makes a text field flush with the cell.
   */
  inputProps: {
    ref: React.RefCallback<HTMLElement>
    "aria-label": string
    "aria-invalid": true | undefined
    "aria-describedby": string | undefined
    className: string
  }
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
  renderHeader?: (details: DataTableHeaderDetails) => React.ReactNode
  /** The cell's editor in place of its type's (`editable`). */
  renderEditor?: (props: DataTableEditorProps<T>) => React.ReactNode
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
  /**
   * Checks a value before it is written (edited, pasted, filled,
   * cleared): a message rejects it, `null` lets it through.
   */
  validate?: (value: DataTableValue, item: T) => string | null
  /**
   * Reads text typed in the cell's editor or pasted as the column's
   * value, in place of its type's reading (a number in the locale, a
   * date, Yes / No, an option's label). Throw an `Error` to reject the
   * text: its message is shown.
   */
  parse?: (text: string, item: T) => DataTableValue
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
  /**
   * Opts the column out of `editable`, or (a function) decides per item
   * whether its cell can be written.
   */
  editable?: false | ((item: T) => boolean)
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
 * A column's filter, by the column's type; `custom` is for a column with a
 * `filter` function. Number and date ranges include their ends, and a `to`
 * at midnight includes that whole day.
 */
type DataTableFilterValue =
  | { type: "text"; value: string }
  | { type: "number"; min?: number; max?: number }
  | { type: "date"; from?: Date; to?: Date }
  | { type: "boolean"; value: boolean }
  | { type: "options"; values: ReadonlyArray<string> }
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

/** A cell, by its row's id and its column's id. */
type DataTableCellPosition = { row: string; column: string }

/**
 * Cells selected together: rows and columns, each between two ids
 * (`start`, where the range was begun, its anchor; `end`, the side that
 * moves) or, left out, every one shown. `{ rows }` is whole rows, `{
 * columns }` whole columns, `{}` every cell; whole axes follow the rows and
 * columns shown (a sort, a filter, new data). Two corners make a rectangle
 * in the order shown, between them.
 */
type DataTableCellRange = {
  rows?: { start: string; end: string }
  columns?: { start: string; end: string }
}

/** Why the cell selection changed. */
type DataTableCellSelectionChangeReason =
  /** A click, a drag. */
  | "item-press"
  | "keyboard"
  /** Ctrl / Cmd + A. */
  | "select-all"
  /** Escape. */
  | "clear"
  /** The selection became the cells a paste wrote. */
  | "paste"
  /** Set through `useDataTable` (`setCellSelection`, `selectAllCells`, `clearCellSelection`). */
  | "none"

/** Why cells were written. */
type DataTableCellsChangeReason = "edit" | "paste" | "clear" | "fill"

/** One cell written, for `onCellsChange`. */
type DataTableCellChange<T> = {
  /** The row's id. */
  row: string
  /** The column's id. */
  column: string
  item: T
  /** The new value, as the column's type reads it (`null` for an empty cell). */
  value: DataTableValue
  /** The value before, from the column's `accessor`. */
  previousValue: DataTableValue
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
  DataTableCellChange,
  DataTableCellDetails,
  DataTableCellPosition,
  DataTableCellRange,
  DataTableCellSelectionChangeReason,
  DataTableCellsChangeReason,
  DataTableColumn,
  DataTableColumnGroup,
  DataTableColumns,
  DataTableColumnType,
  DataTableEditorProps,
  DataTableFilterValue,
  DataTableHeaderDetails,
  DataTableLeafColumn,
  DataTableOption,
  DataTablePartialView,
  DataTableSort,
  DataTableValue,
  DataTableView,
  DataTableViewChangeReason,
}
