import {
  copyInstancePropertiesWithoutMemos,
  type Row,
  type RowData,
  type RowModel,
  type SortingState,
  type Table,
  type TableFeatures,
} from "@tanstack/react-table"

/**
 * A sorted row model for large tables, for the `sortedRowModel` slot of
 * `tableFeatures` in place of `createSortedRowModel()`.
 *
 * The stock model calls a comparator, and through it `row.getValue`, about
 * 2 · n · log n times: 3.4 million calls for 100,000 rows. This one reads
 * each value once, turns a column into integer ranks, and sorts with the
 * engine's native typed-array sort (`rank · n + index`, no comparator).
 * The ranks of a column are kept, so the other direction, or the same
 * column again after another, is a single native sort.
 *
 * Text sorts in natural order ("A-2" before "A-10", case-insensitive),
 * like `alphanumeric`; numbers, dates and booleans by value. `undefined`
 * goes last in either direction, and equal values keep their order.
 * Per-column `sortFn`, `invertSorting` and `sortUndefined` are not read:
 * keep the stock model for columns that need them.
 *
 * While nothing is sorted, the ranks of every column are worked out in
 * idle time, one column per idle callback, so even the first sort of a
 * column is a single native sort.
 */
function createFastSortedRowModel() {
  return <TFeatures extends TableFeatures, TData extends RowData>(
    table: Table<TFeatures, TData>
  ) => {
    let lastSorting: SortingState | undefined
    let lastInput: RowModel<TFeatures, TData> | undefined
    let lastOutput: RowModel<TFeatures, TData> | undefined
    // Per input rows (a new array for new data): each column's ranks.
    const ranks = new WeakMap<ReadonlyArray<unknown>, Map<string, Ranks>>()

    const ranksOf = (rows: Array<Row<TFeatures, TData>>, id: string) => {
      let columns = ranks.get(rows)
      if (!columns) ranks.set(rows, (columns = new Map()))
      let column = columns.get(id)
      if (!column) {
        const accessor = (
          table.getColumn(id) as
            { accessorFn?: (data: TData, index: number) => unknown } | undefined
        )?.accessorFn
        column = rankValues(
          rows.map((row) =>
            accessor ? accessor(row.original, row.index) : row.getValue(id)
          )
        )
        columns.set(id, column)
      }
      return column
    }

    const sortRows = (
      rows: Array<Row<TFeatures, TData>>,
      sorting: SortingState,
      flatRows: Array<Row<TFeatures, TData>>
    ): Array<Row<TFeatures, TData>> => {
      const order = sortIndices(
        sorting.map((sort) => ({
          ranks: ranksOf(rows, sort.id),
          desc: !!sort.desc,
        })),
        rows.length
      )
      const sorted = new Array<Row<TFeatures, TData>>(rows.length)
      for (let i = 0; i < order.length; i++) {
        let row = rows[order[i]]
        flatRows.push(row)
        if (row.subRows.length) {
          const at = flatRows.length - 1
          const subRows = sortRows(row.subRows, sorting, flatRows)
          if (subRows.some((sub, j) => sub !== row.subRows[j])) {
            const copy = Object.create(Object.getPrototypeOf(row)) as Row<
              TFeatures,
              TData
            >
            copyInstancePropertiesWithoutMemos(copy, row)
            copy.subRows = subRows
            row = copy
            flatRows[at] = copy
          }
        }
        sorted[i] = row
      }
      return sorted
    }

    // Ranks worked out ahead, in idle time, for the rows last seen.
    let warmed: ReadonlyArray<unknown> | undefined
    const warm = (rows: Array<Row<TFeatures, TData>>) => {
      if (warmed === rows || typeof requestIdleCallback === "undefined") return
      warmed = rows
      const ids = table
        .getAllLeafColumns()
        .filter((column) => "accessorFn" in column && column.accessorFn)
        .map((column) => column.id)
      const next = () => {
        const id = ids.shift()
        if (id === undefined || warmed !== rows) return
        ranksOf(rows, id)
        requestIdleCallback(next)
      }
      requestIdleCallback(next)
    }

    return (): RowModel<TFeatures, TData> => {
      const input = table.getPreSortedRowModel()
      const sorting = (
        table.atoms as { sorting?: { get: () => SortingState } }
      ).sorting?.get()
      if (input.rows.length) warm(input.rows)
      if (!sorting?.length || !input.rows.length) return input
      if (input === lastInput && sorting === lastSorting && lastOutput)
        return lastOutput
      const flatRows: Array<Row<TFeatures, TData>> = []
      lastInput = input
      lastSorting = sorting
      lastOutput = {
        rows: sortRows(input.rows, sorting, flatRows),
        flatRows,
        rowsById: input.rowsById,
      }
      return lastOutput
    }
  }
}

/** A column as integer ranks: equal values share one, `none` is no value. */
type Ranks = { ranks: Uint32Array; none: number }

/**
 * A text key whose plain string order is natural order: lower case, and
 * each run of digits as a marker after every letter (numbers sort after
 * text, as in `alphanumeric`) and the number zero-padded to 20 digits.
 */
function naturalKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[0-9]+/g, (digits) => "￿" + digits.padStart(20, "0"))
}

function rankValues(values: ReadonlyArray<unknown>): Ranks {
  const n = values.length
  let isText = false
  for (let i = 0; i < n && !isText; i++) {
    const value = values[i]
    isText =
      value !== undefined &&
      value !== null &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      !(value instanceof Date)
  }

  const ranks = new Uint32Array(n)
  if (isText) {
    const keys = values.map((value) =>
      value === undefined || value === null ? null : naturalKey(String(value))
    )
    const distinct = [...new Set(keys)].filter((key) => key !== null)
    distinct.sort()
    const rank = new Map(distinct.map((key, i) => [key, i]))
    const none = distinct.length
    for (let i = 0; i < n; i++) {
      const key = keys[i]
      ranks[i] = key === null ? none : (rank.get(key) ?? none)
    }
    return { ranks, none }
  }

  const numbers = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const value = values[i]
    numbers[i] =
      value === undefined || value === null
        ? NaN
        : value instanceof Date
          ? value.getTime()
          : Number(value)
  }
  // Native sort puts NaN last; the distinct values before it are the ranks.
  const sorted = numbers.slice().sort()
  const rank = new Map<number, number>()
  let none = 0
  for (const value of sorted) {
    if (Number.isNaN(value)) break
    if (!rank.has(value)) rank.set(value, none++)
  }
  for (let i = 0; i < n; i++) {
    const value = numbers[i]
    ranks[i] = Number.isNaN(value) ? none : (rank.get(value) ?? none)
  }
  return { ranks, none }
}

/**
 * The indices of `n` rows in sort order: one native sort per sort column,
 * from the last to the first, each stable on the order before it (its
 * position breaks ties), so the first column decides and equal rows keep
 * their order.
 */
function sortIndices(
  columns: ReadonlyArray<{ ranks: Ranks; desc: boolean }>,
  n: number
) {
  let order = new Uint32Array(n)
  for (let i = 0; i < n; i++) order[i] = i
  const packed = new Float64Array(n)
  for (let c = columns.length - 1; c >= 0; c--) {
    const { ranks, desc } = columns[c]
    const { ranks: rank, none } = ranks
    for (let p = 0; p < n; p++) {
      const r = rank[order[p]]
      // No value: last in either direction.
      const key = r === none ? none : desc ? none - 1 - r : r
      packed[p] = key * n + p
    }
    packed.sort()
    const next = new Uint32Array(n)
    for (let p = 0; p < n; p++) next[p] = order[packed[p] % n]
    order = next
  }
  return order
}

export { createFastSortedRowModel }
