/**
 * Two filters on one column, as one: the rows both match (terms side by
 * side all apply), when a filter can say that.
 *
 * A filter matches any item of its list (texts, options, yes / no, number
 * or date ranges) and, with `empty`, the rows without a value; with an
 * empty list and `empty`, those alone. Both match what any item of the one
 * and any item of the other match, and, when both have `empty`, the rows
 * without a value:
 *
 * - options and yes / no: the values both list;
 * - number and date ranges: each range of the one intersected with each of
 *   the other, those that are not empty (once each);
 * - text: the shorter list when the other holds all of it ("contains a or
 *   b" and "contains a" is "contains a"); "contains a" and "contains b" is
 *   no list of texts (`notCombinable`).
 *
 * When nothing would match both, it is `noMatch` rather than a filter that
 * matches nothing.
 */
import type {
  DataTableDateRange,
  DataTableFilterValue,
  DataTableNumberRange,
} from "../types"
import { dayOf, startOfDay } from "../values"
import { sameDateRange, sameNumberRange } from "../view"

type MergeProblem = "noMatch" | "notCombinable"

/** Where a date filter's `to` stops, exclusive: past its day when it is a day's start. */
function endOf(to: Date | undefined, timeZone: string | undefined) {
  if (!to) return Infinity
  const day = dayOf(to, timeZone)
  if (!day.midnight) return to.getTime() + 1
  return startOfDay(day.year, day.month, day.day + 1, timeZone).getTime()
}

/** The rows two number ranges both take, or `null` for none. */
function intersectNumbers(
  a: DataTableNumberRange,
  b: DataTableNumberRange
): DataTableNumberRange | null {
  // The higher low bound, exclusive when the one at that value is.
  const low = (v: DataTableNumberRange) => v.min ?? -Infinity
  const high = (v: DataTableNumberRange) => v.max ?? Infinity
  const min = Math.max(low(a), low(b))
  const max = Math.min(high(a), high(b))
  const minExclusive =
    (low(a) === min && a.minExclusive === true) ||
    (low(b) === min && b.minExclusive === true)
  const maxExclusive =
    (high(a) === max && a.maxExclusive === true) ||
    (high(b) === max && b.maxExclusive === true)
  if (!(min < max || (min === max && !minExclusive && !maxExclusive)))
    return null
  return {
    ...(Number.isFinite(min) ? { min } : {}),
    ...(Number.isFinite(max) ? { max } : {}),
    ...(Number.isFinite(min) && minExclusive ? { minExclusive: true } : {}),
    ...(Number.isFinite(max) && maxExclusive ? { maxExclusive: true } : {}),
  }
}

/** The days two date ranges both take, or `null` for none. */
function intersectDates(
  a: DataTableDateRange,
  b: DataTableDateRange,
  timeZone: string | undefined
): DataTableDateRange | null {
  const fromA = a.from?.getTime() ?? -Infinity
  const fromB = b.from?.getTime() ?? -Infinity
  const from = fromA >= fromB ? a.from : b.from
  const endA = endOf(a.to, timeZone)
  const endB = endOf(b.to, timeZone)
  const to = endA <= endB ? a.to : b.to
  if ((from?.getTime() ?? -Infinity) >= Math.min(endA, endB)) return null
  return { ...(from ? { from } : {}), ...(to ? { to } : {}) }
}

/** Every range of `a` intersected with every range of `b`, without the empty ones or repeats. */
function intersectRanges<TRange>(
  a: ReadonlyArray<TRange>,
  b: ReadonlyArray<TRange>,
  intersect: (x: TRange, y: TRange) => TRange | null,
  same: (x: TRange, y: TRange) => boolean
): Array<TRange> {
  const ranges: Array<TRange> = []
  for (const x of a)
    for (const y of b) {
      const both = intersect(x, y)
      if (both && !ranges.some((range) => same(range, both))) ranges.push(both)
    }
  return ranges
}

function intersectFilters(
  a: DataTableFilterValue,
  b: DataTableFilterValue,
  timeZone: string | undefined
): DataTableFilterValue | MergeProblem {
  if (a.type === "custom" || b.type === "custom" || a.type !== b.type)
    return "notCombinable"
  const empty = a.empty === true && b.empty === true
  const flag = empty ? { empty } : {}
  switch (a.type) {
    case "text": {
      const other = b as typeof a
      // "No value" alone beside a list: the rows without one, if both take them.
      if (!a.values.length || !other.values.length)
        return empty ? { type: "text", values: [], ...flag } : "noMatch"
      const holds = (
        list: ReadonlyArray<string>,
        part: ReadonlyArray<string>
      ) => part.every((value) => list.includes(value))
      const values = holds(other.values, a.values)
        ? a.values
        : holds(a.values, other.values)
          ? other.values
          : undefined
      return values ? { type: "text", values, ...flag } : "notCombinable"
    }
    case "options": {
      const other = b as typeof a
      const values = a.values.filter((value) => other.values.includes(value))
      if (!values.length && !empty) return "noMatch"
      return { type: "options", values, ...flag }
    }
    case "boolean": {
      const other = b as typeof a
      const values = a.values.filter((value) => other.values.includes(value))
      if (!values.length && !empty) return "noMatch"
      return { type: "boolean", values, ...flag }
    }
    case "number": {
      const other = b as typeof a
      const ranges = intersectRanges(
        a.ranges,
        other.ranges,
        intersectNumbers,
        sameNumberRange
      )
      if (!ranges.length && !empty) return "noMatch"
      return { type: "number", ranges, ...flag }
    }
    case "date": {
      const other = b as typeof a
      const ranges = intersectRanges(
        a.ranges,
        other.ranges,
        (x, y) => intersectDates(x, y, timeZone),
        sameDateRange
      )
      if (!ranges.length && !empty) return "noMatch"
      return { type: "date", ranges, ...flag }
    }
  }
}

export { intersectFilters }
export type { MergeProblem }
