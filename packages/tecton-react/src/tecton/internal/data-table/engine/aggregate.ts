/**
 * Aggregates: a column's summary over a set of items, for group rows'
 * subtotals and the totals row. The built-ins skip empty values and return
 * `null` when nothing is left to sum (see `DataTableAggregate`); a function
 * gets every value, empty ones too, in row order, with the items.
 */
import type { EngineColumn } from "./columns"
import type { DataTableAggregate, DataTableValue } from "./types"
import { isEmptyIn, toBoolean, toNumber, toTime } from "./values"

function aggregate<T>(
  column: EngineColumn<T>,
  items: ReadonlyArray<T>,
  fn: DataTableAggregate<T> | null = column.aggregate
): DataTableValue {
  if (!fn) return null
  if (typeof fn === "function")
    return fn(
      items.map((item) => column.getValue(item)),
      items
    )
  switch (fn) {
    case "sum":
    case "avg": {
      let sum = 0
      let count = 0
      for (const item of items) {
        const number = toNumber(column.getValue(item))
        if (number === undefined) continue
        sum += number
        count++
      }
      if (!count) return null
      return fn === "sum" ? sum : sum / count
    }
    case "min":
    case "max": {
      // Dates stay dates; everything else is read as a number.
      const dates = column.type === "date"
      let best: number | undefined
      for (const item of items) {
        const value = column.getValue(item)
        const number = dates ? toTime(value) : toNumber(value)
        if (number === undefined) continue
        if (
          best === undefined ||
          (fn === "min" ? number < best : number > best)
        )
          best = number
      }
      if (best === undefined) return null
      return dates ? new Date(best) : best
    }
    case "count": {
      // A boolean column counts its trues, read as its cells read them.
      const booleans = column.type === "boolean"
      let count = 0
      for (const item of items) {
        const value = column.getValue(item)
        if (
          booleans
            ? toBoolean(value) === true
            : value !== false && !isEmptyIn(column, value)
        )
          count++
      }
      return count
    }
    case "countDistinct": {
      const distinct = new Set<unknown>()
      for (const item of items) {
        const value = column.getValue(item)
        if (isEmptyIn(column, value)) continue
        distinct.add(value instanceof Date ? value.getTime() : value)
      }
      return distinct.size
    }
  }
}

/** Every aggregate column's aggregate over `items`, by column id. */
function aggregateColumns<T>(
  columns: ReadonlyArray<EngineColumn<T>>,
  items: ReadonlyArray<T>
): Readonly<Record<string, DataTableValue>> {
  const values: Record<string, DataTableValue> = {}
  for (const column of columns)
    if (column.aggregate) values[column.id] = aggregate(column, items)
  return values
}

export { aggregate, aggregateColumns }
