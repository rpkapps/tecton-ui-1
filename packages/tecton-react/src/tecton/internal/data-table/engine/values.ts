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

/**
 * `isEmptyValue` in a column: `""` is a value of an options column that
 * has an option `""` (its `optionIndex`; other types have none).
 */
function isEmptyIn(
  column: { readonly optionIndex: ReadonlyMap<string, number> },
  value: DataTableValue
) {
  return isEmptyValue(value) && !(value === "" && column.optionIndex.has(""))
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

/** The calendar day of a time in `timeZone` (an IANA zone), as `YYYY-MM-DD`. */
function toDayIn(time: number, timeZone: string) {
  const p = partsIn(time, timeZone)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`
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

const zoneFormats = new Map<string, Intl.DateTimeFormat>()

/** The calendar day and time of `time` in `timeZone` (an IANA zone). */
function partsIn(time: number, timeZone: string) {
  let format = zoneFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
    zoneFormats.set(timeZone, format)
  }
  const parts: Record<string, number> = {}
  for (const part of format.formatToParts(time))
    if (part.type !== "literal") parts[part.type] = Number(part.value)
  return {
    year: parts.year,
    month: parts.month - 1,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

/**
 * The first instant of a calendar day (`month` from 0, overflow allowed) in
 * `timeZone`, or in the local zone without one: where a date column's day
 * begins, as its `format.timeZone` shows days. Usually its midnight; on a
 * day whose midnight the zone skips (summer time starting at 00:00, as in
 * Santiago or Beirut), the moment the clocks jump to, the day's first.
 */
function startOfDay(
  year: number,
  month: number,
  day: number,
  timeZone?: string
): Date {
  // A local midnight the zone skips is moved past the gap: the day's first
  // instant.
  if (!timeZone) return new Date(year, month, day)
  const wanted = Date.UTC(year, month, day)
  // The zone's offset at that moment, twice: once more across a change of
  // offset (summer time) between the guess and the answer.
  let time = wanted
  for (let pass = 0; pass < 2; pass++) {
    const p = partsIn(time, timeZone)
    const shown = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second)
    time -= shown - wanted
  }
  const dayAt = (at: number) => {
    const p = partsIn(at, timeZone)
    return Date.UTC(p.year, p.month, p.day)
  }
  // Midnight skipped: the guess falls in the day before. The day begins at
  // the jump, the first instant whose day is the wanted one (within the
  // few hours a jump can span).
  if (dayAt(time) < wanted) {
    let low = time
    let high = time + 4 * 3_600_000
    if (dayAt(high) < wanted) return new Date(time)
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2)
      if (dayAt(middle) < wanted) low = middle
      else high = middle
    }
    time = high
  }
  return new Date(time)
}

/**
 * The calendar day `date` falls on in `timeZone` (the local zone without
 * one); `midnight`: `date` is that day's first instant (`startOfDay`).
 */
function dayOf(date: Date, timeZone?: string) {
  const p = timeZone
    ? partsIn(date.getTime(), timeZone)
    : {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      }
  const start = startOfDay(p.year, p.month, p.day, timeZone)
  return {
    year: p.year,
    month: p.month,
    day: p.day,
    midnight: start.getTime() === date.getTime(),
  }
}

export {
  dayOf,
  isEmptyIn,
  isEmptyValue,
  startOfDay,
  toBoolean,
  toDate,
  toDay,
  toDayIn,
  toNumber,
  toTime,
}
