/**
 * Dates in the query. A date is read as a run of whole calendar days, or
 * as one instant:
 *
 * - a year, `2015`; a month, `2015-06`, `2015-6`, `2015/06`, `6/2015`; a
 *   day, `2015-06-30`, `2015/6/30`, or the locale's numeric order with a
 *   four-digit year (`6/30/2015` in English, `30.6.2015` in German, `/`,
 *   `.` or `-` between the numbers);
 * - month names, the locale's (long or short, as `Intl` writes them, any
 *   case and accents, a unique prefix of two letters or more) or else
 *   English: `jun 2015`, `june 2015`, `30 jun 2015`, `jun 30, 2015`,
 *   skipping the locale's own words between the fields ("de" in Spanish);
 * - a relative preset, from today (the day `now` falls on): `today`,
 *   `yesterday`, `thismonth`, `lastmonth`, `thisyear`, `lastyear` (whole
 *   months and years), `last<N>d`, `last<N>w`, `last<N>m`, `last<N>y`
 *   (the `N` days, weeks, months or years up to today, today included:
 *   `last30d` on November 12 is October 14 to November 12);
 * - an instant, as an ISO date and time with its zone
 *   (`2015-06-30T10:30:00.000Z`): what the query writes for a filter end
 *   that is not the start of a day (a view set by the application).
 *
 * A day is a day in the column's time zone (its `format.timeZone`, else
 * the local one), as the date filter's calendar picks it: its start is
 * `startOfDay` there. A year with fewer than four digits, a day or month
 * without a year, and a month prefix that fits two months are ambiguous;
 * anything else unreadable is not a date.
 */
import { foldText } from "../format"
import { dayOf, startOfDay } from "../values"
import { asciiDigits } from "./numbers"

/** A calendar day, as days since 1970-01-01 (UTC arithmetic: no zone). */
type Day = number

const DAY_MS = 86_400_000

/** The day `day` (from 1) of month `month` (from 0, overflow allowed). */
function toDay(year: number, month: number, day: number): Day {
  const date = new Date(0)
  date.setUTCFullYear(year, month, day)
  return Math.round(date.getTime() / DAY_MS)
}

function partsOf(day: Day) {
  const date = new Date(day * DAY_MS)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  }
}

const daysInMonth = (year: number, month: number) =>
  partsOf(toDay(year, month + 1, 0)).day

/** The first instant of `day` in `timeZone` (the local zone without one). */
function startOf(day: Day, timeZone: string | undefined): Date {
  const p = partsOf(day)
  return startOfDay(p.year, p.month, p.day, timeZone)
}

/** The day `date` falls on in `timeZone`, and whether it is that day's start. */
function dayOfDate(date: Date, timeZone: string | undefined) {
  const p = dayOf(date, timeZone)
  return { day: toDay(p.year, p.month, p.day), midnight: p.midnight }
}

/** What a date in the query reads as. */
type DateLiteral =
  | {
      readonly kind: "days"
      readonly first: Day
      readonly last: Day
      /** The relative preset it was written as, folded (`last30d`). */
      readonly preset?: string
    }
  | { readonly kind: "instant"; readonly time: number }

type DateProblem = {
  readonly error: "badDate" | "ambiguousDate"
  /** For `ambiguousDate`: what is missing or fits twice. */
  readonly reason?: "noYear" | "twoDigitYear" | "month"
}

type DateField = "year" | "month" | "day"

/** What reading dates in a locale takes: its order and its words. */
type DateLocale = {
  readonly order: ReadonlyArray<DateField>
  /** Each month's names (folded, without dots), the locale's. */
  readonly months: ReadonlyArray<ReadonlyArray<string>>
  /** The same in English, read when the locale's do not fit. */
  readonly english: ReadonlyArray<ReadonlyArray<string>>
  /** The locale's words between a date's fields ("de"), skipped. */
  readonly literals: ReadonlySet<string>
}

const dateLocales = new Map<string, DateLocale>()

const plainWord = (text: string) => foldText(text).replace(/\./g, "").trim()

function monthNames(locale: string) {
  const formats = [
    { month: "long" },
    { month: "short" },
    { day: "numeric", month: "long" },
    { day: "numeric", month: "short" },
  ].map(
    (options) =>
      new Intl.DateTimeFormat(locale, {
        ...(options as Intl.DateTimeFormatOptions),
        calendar: "gregory",
        numberingSystem: "latn",
        timeZone: "UTC",
      })
  )
  return Array.from({ length: 12 }, (_, month) => {
    const names = new Set<string>()
    for (const format of formats)
      for (const part of format.formatToParts(Date.UTC(2015, month, 15)))
        if (part.type === "month") {
          const name = plainWord(part.value)
          // Numeric months ("6月") are read as numbers.
          if (name && !/\d/.test(name)) names.add(name)
        }
    return [...names]
  })
}

/** How `locale` writes dates, for reading them (kept per locale). */
function dateLocale(locale: string): DateLocale {
  let info = dateLocales.get(locale)
  if (!info) {
    const options = {
      calendar: "gregory",
      numberingSystem: "latn",
      timeZone: "UTC",
    } as const
    const numeric = new Intl.DateTimeFormat(locale, {
      ...options,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(Date.UTC(2015, 10, 23))
    const order = numeric
      .map((part) => part.type)
      .filter(
        (type): type is DateField =>
          type === "year" || type === "month" || type === "day"
      )
    const literals = new Set<string>()
    for (const part of new Intl.DateTimeFormat(locale, {
      ...options,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(Date.UTC(2015, 10, 23)))
      if (part.type === "literal")
        for (const word of foldText(part.value).match(/\p{L}+/gu) ?? [])
          literals.add(word)
    info = {
      order: order.length === 3 ? order : ["month", "day", "year"],
      months: monthNames(locale),
      english: locale === "en-US" ? [] : monthNames("en-US"),
      literals,
    }
    dateLocales.set(locale, info)
  }
  return info
}

/**
 * The month `word` (folded) names among `months`: a name, or a unique
 * prefix of two letters or more; `"ambiguous"` for a prefix of several.
 */
function monthIn(
  word: string,
  months: ReadonlyArray<ReadonlyArray<string>>
): number | "ambiguous" | undefined {
  for (const [month, names] of months.entries())
    if (names.includes(word)) return month
  if (word.length < 2) return undefined
  const found = new Set<number>()
  for (const [month, names] of months.entries())
    if (names.some((name) => name.startsWith(word))) found.add(month)
  if (found.size > 1) return "ambiguous"
  return found.size ? [...found][0] : undefined
}

function monthOf(word: string, locale: DateLocale) {
  return monthIn(word, locale.months) ?? monthIn(word, locale.english)
}

/** The months (from 0) a name of which in `locale` `word` (folded) begins, for suggestions. */
function monthsStartingWith(word: string, locale: DateLocale): Array<number> {
  if (!word) return []
  const found: Array<number> = []
  for (let month = 0; month < 12; month++)
    if (
      [...locale.months[month], ...(locale.english[month] ?? [])].some((name) =>
        name.startsWith(word)
      )
    )
      found.push(month)
  return found
}

const RELATIVE = /^last(\d{1,4})([dwmy])$/

/** Today and the other relative presets, as days (see the module comment). */
function resolvePreset(
  word: string,
  today: Day
): { first: Day; last: Day } | undefined {
  const { year, month } = partsOf(today)
  switch (word) {
    case "today":
      return { first: today, last: today }
    case "yesterday":
      return { first: today - 1, last: today - 1 }
    case "thismonth":
      return { first: toDay(year, month, 1), last: toDay(year, month + 1, 0) }
    case "lastmonth":
      return { first: toDay(year, month - 1, 1), last: toDay(year, month, 0) }
    case "thisyear":
      return { first: toDay(year, 0, 1), last: toDay(year, 11, 31) }
    case "lastyear":
      return { first: toDay(year - 1, 0, 1), last: toDay(year - 1, 11, 31) }
  }
  const relative = RELATIVE.exec(word)
  if (!relative) return undefined
  const n = Number(relative[1])
  if (n === 0) return undefined
  switch (relative[2]) {
    case "d":
      return { first: today - n + 1, last: today }
    case "w":
      return { first: today - 7 * n + 1, last: today }
    default: {
      // Months and years back from today, the day kept within the month
      // (a month before March 31 is February 28 or 29).
      const months = relative[2] === "m" ? n : 12 * n
      const p = partsOf(today)
      const back = partsOf(toDay(p.year, p.month - months, 1))
      const day = Math.min(p.day, daysInMonth(back.year, back.month))
      return { first: toDay(back.year, back.month, day) + 1, last: today }
    }
  }
}

/** The presets the suggestions offer while nothing narrows them, in order. */
const PRESETS = [
  "today",
  "yesterday",
  "last7d",
  "last30d",
  "last90d",
  "thismonth",
  "lastmonth",
  "thisyear",
  "lastyear",
] as const

const INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})t(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(z|[+-]\d{2}:?\d{2})$/

function readInstant(match: RegExpExecArray): DateLiteral | DateProblem {
  const [year, month, day, hour, minute, second = "0", ms = "0"] = match.slice(
    1,
    8
  )
  const zone = match[8]
  const y = Number(year)
  const m = Number(month) - 1
  const d = Number(day)
  if (!validDay(y, m, d) || Number(hour) > 23 || Number(minute) > 59)
    return { error: "badDate" }
  if (Number(second) > 59) return { error: "badDate" }
  const date = new Date(0)
  date.setUTCFullYear(y, m, d)
  date.setUTCHours(
    Number(hour),
    Number(minute),
    Number(second),
    Number(ms.padEnd(3, "0"))
  )
  let offset = 0
  if (zone !== "z") {
    const sign = zone[0] === "-" ? -1 : 1
    const digits = zone.slice(1).replace(":", "")
    offset = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)))
  }
  return { kind: "instant", time: date.getTime() - offset * 60_000 }
}

const validDay = (year: number, month: number, day: number) =>
  month >= 0 && month <= 11 && day >= 1 && day <= daysInMonth(year, month)

function days(
  year: number,
  month?: number,
  day?: number
): DateLiteral | DateProblem {
  if (month === undefined)
    return { kind: "days", first: toDay(year, 0, 1), last: toDay(year, 11, 31) }
  if (month < 0 || month > 11) return { error: "badDate" }
  if (day === undefined)
    return {
      kind: "days",
      first: toDay(year, month, 1),
      last: toDay(year, month + 1, 0),
    }
  if (!validDay(year, month, day)) return { error: "badDate" }
  const at = toDay(year, month, day)
  return { kind: "days", first: at, last: at }
}

const YEAR_FIRST = /^(\d{4})(?:[-/.](\d{1,2})(?:[-/.](\d{1,2}))?)?$/
const NUMERIC = /^(\d{1,4})[-/.](\d{1,4})(?:[-/.](\d{1,4}))?$/

/** A matched number, as `read` makes it; `undefined` when not matched. */
const optional = (
  part: string | undefined,
  read: (n: number) => number = (n) => n
) => (part === undefined ? undefined : read(Number(part)))

/** Numbers alone: `2015-06-30`, `6/30/2015` (see the module comment). */
function readNumeric(
  text: string,
  locale: DateLocale
): DateLiteral | DateProblem | undefined {
  const yearFirst = YEAR_FIRST.exec(text)
  if (yearFirst)
    return days(
      Number(yearFirst[1]),
      optional(yearFirst.at(2), (month) => month - 1),
      optional(yearFirst.at(3))
    )
  const numeric = NUMERIC.exec(text)
  if (!numeric) return undefined
  const numbers = [numeric[1], numeric[2], numeric.at(3)].filter(
    (part): part is string => part !== undefined
  )
  if (numbers.length === 2) {
    // A month and its year: `6/2015`.
    const [month, year] = numbers
    if (year.length === 4 && month.length <= 2)
      return days(Number(year), Number(month) - 1)
    return { error: "ambiguousDate", reason: "noYear" }
  }
  const field = (name: DateField) => numbers[locale.order.indexOf(name)]
  const year = field("year")
  if (year.length !== 4)
    return {
      error: "ambiguousDate",
      reason: year.length === 2 ? "twoDigitYear" : undefined,
    }
  if (field("month").length > 2 || field("day").length > 2)
    return { error: "badDate" }
  return days(Number(year), Number(field("month")) - 1, Number(field("day")))
}

/** With a month name: `jun 2015`, `30 jun 2015`, `jun 30, 2015`. */
function readWords(
  text: string,
  locale: DateLocale
): DateLiteral | DateProblem {
  const tokens = text.match(/\p{L}+\.?|\d+|[^\p{L}\d]+/gu) ?? []
  let month: number | undefined
  const numbers: Array<string> = []
  for (const token of tokens) {
    if (/^\d/.test(token)) numbers.push(token)
    else if (/^\p{L}/u.test(token)) {
      const word = token.replace(/\.$/, "")
      if (locale.literals.has(word)) continue
      const named = monthOf(word, locale)
      if (named === "ambiguous")
        return { error: "ambiguousDate", reason: "month" }
      if (named === undefined || month !== undefined)
        return { error: "badDate" }
      month = named
    } else if (!/^[\s,./-]+$/.test(token)) return { error: "badDate" }
  }
  if (month === undefined) return { error: "badDate" }
  const years = numbers.filter((number) => number.length === 4)
  const others = numbers.filter((number) => number.length !== 4)
  if (numbers.length === 0 || (years.length === 0 && others.length === 1))
    return { error: "ambiguousDate", reason: "noYear" }
  if (years.length === 1 && others.length === 0)
    return days(Number(years[0]), month)
  if (years.length === 1 && others.length === 1 && others[0].length <= 2)
    return days(Number(years[0]), month, Number(others[0]))
  if (
    years.length === 0 &&
    others.length === 2 &&
    others.every((n) => n.length <= 2)
  )
    return { error: "ambiguousDate", reason: "twoDigitYear" }
  return { error: "badDate" }
}

/** What `text` reads as (see the module comment); `today` for the presets. */
function parseDateLiteral(
  text: string,
  locale: DateLocale,
  today: Day
): DateLiteral | DateProblem {
  const folded = asciiDigits(foldText(text.trim()))
  if (!folded) return { error: "badDate" }
  const range = resolvePreset(folded, today)
  if (range) return { kind: "days", ...range, preset: folded }
  const instant = INSTANT.exec(folded)
  if (instant) return readInstant(instant)
  if (!/\p{L}/u.test(folded))
    return readNumeric(folded, locale) ?? { error: "badDate" }
  return readWords(folded, locale)
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0")

/** `2015-06-30`, `2015-06` or `2015`. */
function formatDay(day: Day, unit: "day" | "month" | "year" = "day") {
  const p = partsOf(day)
  if (unit === "year") return pad(p.year, 4)
  if (unit === "month") return `${pad(p.year, 4)}-${pad(p.month + 1)}`
  return `${pad(p.year, 4)}-${pad(p.month + 1)}-${pad(p.day)}`
}

/** A comparison of the query. */
type Comparison = ">=" | "<=" | ">" | "<" | "="

/**
 * The ends of a date filter a comparison with a date makes, as days of
 * the date (a filter's `to` is its last day's start): `>` from the day
 * after its last, `>=` from its first, `<` up to the day before its first,
 * `<=` up to its last, `=` both of its own. Each is `k` of `dayAt`; an
 * instant is itself at either end (and `>` the instant after it).
 */
const BOUNDS: Record<Comparison, readonly [from?: number, to?: number]> = {
  ">": [2],
  ">=": [0],
  "<": [undefined, -1],
  "<=": [undefined, 1],
  "=": [0, 1],
}

/** Day `k` of `BOUNDS` of `literal`: its first plus `k` (to 0), else its last plus `k - 1`. */
const dayAt = (literal: DateLiteral, k: number, zone: string | undefined) =>
  literal.kind === "instant"
    ? new Date(literal.time + (k > 1 ? 1 : 0))
    : startOf(k > 0 ? literal.last + k - 1 : literal.first + k, zone)

/** The date filter range `op` with `literal` makes (`BOUNDS`). */
function dateBounds(
  op: Comparison,
  literal: DateLiteral,
  zone: string | undefined
): { from?: Date; to?: Date } {
  const [from, to] = BOUNDS[op]
  return {
    ...(from === undefined ? {} : { from: dayAt(literal, from, zone) }),
    ...(to === undefined ? {} : { to: dayAt(literal, to, zone) }),
  }
}

/**
 * A date filter's end as the query writes it, the inverse of `dateBounds`
 * at `>=` and `<=`: its day when it is that day's start in `zone`
 * (`2015-06-30`), else the instant.
 */
function boundText(date: Date, zone: string | undefined) {
  const day = dayOfDate(date, zone)
  return {
    ...day,
    text: day.midnight ? formatDay(day.day) : date.toISOString(),
  }
}

/** The day `now` falls on in `timeZone`. */
const todayIn = (now: Date, timeZone: string | undefined) =>
  dayOfDate(now, timeZone).day

export {
  boundText,
  dateBounds,
  PRESETS,
  RELATIVE,
  dateLocale,
  dayOfDate,
  daysInMonth,
  formatDay,
  monthsStartingWith,
  parseDateLiteral,
  partsOf,
  resolvePreset,
  startOf,
  toDay,
  todayIn,
}
export type { Comparison, DateLiteral, DateLocale, DateProblem, Day }
