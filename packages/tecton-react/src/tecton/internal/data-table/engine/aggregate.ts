/**
 * Aggregates: a column's summary over a set of items, for group rows'
 * subtotals and the totals row. The built-ins skip empty values and return
 * `null` when nothing is left to sum (see `DataTableAggregate`); a function
 * gets every value, empty ones too, in row order, with the items.
 *
 * Nested groups add up (`summarize`): a group with groups in it takes
 * `sum`, `avg`, `min`, `max` and `count` from theirs (an average as its
 * sum and count), rather than reading every row once more per level;
 * `countDistinct` and functions read its items.
 */
import type { EngineColumn } from "./columns"
import type { DataTableAggregate, DataTableValue } from "./types"
import { isEmptyIn, toBoolean, toNumber, toTime } from "./values"

/** The built-ins that add up across sets of items. */
type Additive = "sum" | "avg" | "min" | "max" | "count"

/** An additive built-in over some items: their sum and count, or the least or greatest. */
type Running = {
  readonly sum: number
  readonly count: number
  readonly best: number | undefined
}

const isAdditive = <T>(fn: DataTableAggregate<T> | null): fn is Additive =>
  typeof fn === "string" && fn !== "countDistinct"

function running<T>(
  column: EngineColumn<T>,
  fn: Additive,
  items: ReadonlyArray<T>
): Running {
  let sum = 0
  let count = 0
  let best: number | undefined
  switch (fn) {
    case "sum":
    case "avg":
      for (const item of items) {
        const number = toNumber(column.getValue(item))
        if (number === undefined) continue
        sum += number
        count++
      }
      break
    case "count": {
      // A boolean column counts its trues, read as its cells read them.
      const booleans = column.type === "boolean"
      for (const item of items) {
        const value = column.getValue(item)
        if (
          booleans
            ? toBoolean(value) === true
            : value !== false && !isEmptyIn(column, value)
        )
          count++
      }
      break
    }
    default: {
      // Dates stay dates; everything else is read as a number.
      const dates = column.type === "date"
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
    }
  }
  return { sum, count, best }
}

/** `parts` added up: the running result over all their items. */
function combine(fn: Additive, parts: ReadonlyArray<Running>): Running {
  let sum = 0
  let count = 0
  let best: number | undefined
  for (const part of parts) {
    sum += part.sum
    count += part.count
    if (
      part.best !== undefined &&
      (best === undefined ||
        (fn === "min" ? part.best < best : part.best > best))
    )
      best = part.best
  }
  return { sum, count, best }
}

function result<T>(
  column: EngineColumn<T>,
  fn: Additive,
  { sum, count, best }: Running
): DataTableValue {
  switch (fn) {
    case "count":
      return count
    case "sum":
      return count ? sum : null
    case "avg":
      return count ? sum / count : null
    default:
      if (best === undefined) return null
      return column.type === "date" ? new Date(best) : best
  }
}

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
  if (isAdditive(fn)) return result(column, fn, running(column, fn, items))
  const distinct = new Set<unknown>()
  for (const item of items) {
    const value = column.getValue(item)
    if (isEmptyIn(column, value)) continue
    distinct.add(value instanceof Date ? value.getTime() : value)
  }
  return distinct.size
}

/** A set of items' aggregates, with what a group around them adds up. */
type Summary = {
  /** Every aggregate column's aggregate, by column id. */
  readonly values: Readonly<Record<string, DataTableValue>>
  /** The additive built-ins' running results, by column id. */
  readonly running: ReadonlyMap<string, Running>
}

/**
 * Every aggregate column's aggregate over a group's items, by column id:
 * the additive built-ins from `children`'s summaries when it holds groups,
 * the others over `items()` (asked for only then).
 */
function summarize<T>(
  columns: ReadonlyArray<EngineColumn<T>>,
  items: () => ReadonlyArray<T>,
  children: ReadonlyArray<Summary> | null
): Summary {
  const values: Record<string, DataTableValue> = {}
  const runs = new Map<string, Running>()
  let list: ReadonlyArray<T> | undefined
  const all = () => (list ??= items())
  for (const column of columns) {
    const fn = column.aggregate
    if (!fn) continue
    if (isAdditive(fn)) {
      const run = children
        ? combine(
            fn,
            children.map((child) => child.running.get(column.id)!)
          )
        : running(column, fn, all())
      runs.set(column.id, run)
      values[column.id] = result(column, fn, run)
    } else values[column.id] = aggregate(column, all(), fn)
  }
  return { values, running: runs }
}

/** Every aggregate column's aggregate over `items`, by column id. */
function aggregateColumns<T>(
  columns: ReadonlyArray<EngineColumn<T>>,
  items: ReadonlyArray<T>
): Readonly<Record<string, DataTableValue>> {
  return summarize(columns, () => items, null).values
}

export { aggregate, aggregateColumns, summarize }
export type { Summary }
