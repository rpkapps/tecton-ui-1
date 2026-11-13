/**
 * Two filters on one column, as one: the rows both match (terms side by
 * side all apply), when a filter can say that.
 *
 * A filter matches its values (a range, options, a text, yes or no) and,
 * with `empty`, the rows without a value; with nothing but `empty`, those
 * alone. Both match the values both do and, when both have `empty`, the
 * rows without one. Ranges intersect, options are the ones both list, a
 * yes / no or a text must be the same in both (a text filter cannot say
 * "contains this and that": `notCombinable`). When nothing would match
 * both, it is `noMatch` rather than a filter that matches nothing.
 */
import type { DataTableFilterValue } from "../types"
import { dayOf, startOfDay } from "../values"

type MergeProblem = "noMatch" | "notCombinable"

/** Where a date filter's `to` stops, exclusive: past its day when it is a day's start. */
function endOf(to: Date | undefined, timeZone: string | undefined) {
  if (!to) return Infinity
  const day = dayOf(to, timeZone)
  if (!day.midnight) return to.getTime() + 1
  return startOfDay(day.year, day.month, day.day + 1, timeZone).getTime()
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
      const blankA = a.value.trim() === ""
      const blankB = other.value.trim() === ""
      if (a.value === other.value)
        return blankA && !empty
          ? "noMatch"
          : { type: "text", value: a.value, ...flag }
      // "No value" alone, beside a text: the rows without one, if both take them.
      if (blankA || blankB)
        return empty ? { type: "text", value: "", ...flag } : "noMatch"
      return "notCombinable"
    }
    case "options": {
      const other = b as typeof a
      const values = a.values.filter((value) => other.values.includes(value))
      if (!values.length && !empty) return "noMatch"
      return { type: "options", values, ...flag }
    }
    case "boolean": {
      const other = b as typeof a
      const value =
        a.value !== undefined && a.value === other.value ? a.value : undefined
      if (value === undefined && !empty) return "noMatch"
      return {
        type: "boolean",
        ...(value === undefined ? {} : { value }),
        ...flag,
      }
    }
    case "number": {
      const other = b as typeof a
      const has = (v: typeof a) => v.min !== undefined || v.max !== undefined
      if (has(a) && has(other)) {
        // The higher low bound, exclusive when the one at that value is.
        const low = (v: typeof a) => v.min ?? -Infinity
        const high = (v: typeof a) => v.max ?? Infinity
        const min = Math.max(low(a), low(other))
        const max = Math.min(high(a), high(other))
        const minExclusive =
          (low(a) === min && a.minExclusive === true) ||
          (low(other) === min && other.minExclusive === true)
        const maxExclusive =
          (high(a) === max && a.maxExclusive === true) ||
          (high(other) === max && other.maxExclusive === true)
        if (min < max || (min === max && !minExclusive && !maxExclusive))
          return {
            type: "number",
            ...(Number.isFinite(min) ? { min } : {}),
            ...(Number.isFinite(max) ? { max } : {}),
            ...(Number.isFinite(min) && minExclusive
              ? { minExclusive: true }
              : {}),
            ...(Number.isFinite(max) && maxExclusive
              ? { maxExclusive: true }
              : {}),
            ...flag,
          }
      }
      return empty ? { type: "number", ...flag } : "noMatch"
    }
    case "date": {
      const other = b as typeof a
      const has = (v: typeof a) => v.from !== undefined || v.to !== undefined
      if (has(a) && has(other)) {
        const fromA = a.from?.getTime() ?? -Infinity
        const fromB = other.from?.getTime() ?? -Infinity
        const from = fromA >= fromB ? a.from : other.from
        const endA = endOf(a.to, timeZone)
        const endB = endOf(other.to, timeZone)
        const to = endA <= endB ? a.to : other.to
        if ((from?.getTime() ?? -Infinity) < Math.min(endA, endB))
          return {
            type: "date",
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...flag,
          }
      }
      return empty ? { type: "date", ...flag } : "noMatch"
    }
  }
}

export { intersectFilters }
export type { MergeProblem }
