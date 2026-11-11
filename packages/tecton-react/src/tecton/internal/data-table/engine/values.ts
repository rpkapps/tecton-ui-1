/**
 * How the engine reads a cell's value as each column type, for display,
 * sorting, filtering and aggregates alike, so the four always agree. Values
 * of the wrong kind are read leniently (a date column takes ISO strings and
 * timestamps, a number column numeric strings, a boolean column "true" and
 * "false") and never throw: what cannot be read is empty (`undefined`).
 *
 * A date-only ISO string ("2024-03-01") is that day at local midnight, as a
 * date picker gives it: `Date.parse` would read it as UTC midnight, the day
 * before west of Greenwich.
 */
import type { DataTableValue } from "./types"

/** `null`, `undefined`, `""` and invalid numbers or dates. */
function isEmptyValue(value: DataTableValue) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value)) ||
    (value instanceof Date && Number.isNaN(value.getTime()))
  )
}

function toNumber(value: DataTableValue): number | undefined {
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value
  if (typeof value === "string") {
    if (value.trim() === "") return undefined
    const number = Number(value)
    return Number.isNaN(number) ? undefined : number
  }
  if (value instanceof Date) return toTime(value)
  if (typeof value === "boolean") return value ? 1 : 0
  return undefined
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** A date-only ISO string's local midnight, `NaN` for a day that does not exist. */
function parseDay(match: RegExpExecArray) {
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  return date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
    ? date.getTime()
    : NaN
}

/** Milliseconds since the epoch. */
function toTime(value: DataTableValue): number | undefined {
  let time: number
  if (value instanceof Date) time = value.getTime()
  else if (typeof value === "number") time = value
  else if (typeof value === "string" && value !== "") {
    const day = DATE_ONLY.exec(value)
    time = day ? parseDay(day) : Date.parse(value)
  } else return undefined
  return Number.isFinite(time) ? time : undefined
}

/** The local calendar day of a time, as `YYYY-MM-DD`. */
function toDay(time: number) {
  const date = new Date(time)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toDate(value: DataTableValue): Date | undefined {
  if (value instanceof Date)
    return toTime(value) === undefined ? undefined : value
  const time = toTime(value)
  return time === undefined ? undefined : new Date(time)
}

function toBoolean(value: DataTableValue): boolean | undefined {
  if (typeof value === "boolean") return value
  if (isEmptyValue(value)) return undefined
  if (typeof value === "string") {
    const text = value.trim().toLowerCase()
    if (text === "false") return false
    if (text === "true") return true
  }
  return Boolean(value)
}

export { isEmptyValue, toBoolean, toDate, toDay, toNumber, toTime }
