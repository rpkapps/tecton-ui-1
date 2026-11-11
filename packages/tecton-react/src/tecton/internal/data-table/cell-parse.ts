/**
 * Text as a column's value (§4.1's type table, for pasting): what a cell
 * shows reads back as its value, in the table's locale, so cells copied
 * from the table, or from a spreadsheet in the same language, paste back.
 *
 * - text: as it is.
 * - number: digits with the locale's decimal and group separators
 *   (groups of two or three digits; ASCII and Arabic-Indic digits, and
 *   the Arabic separators), a
 *   leading `+`, `-` or `−`, an accounting `(…)` for a negative, the
 *   column's currency, percent sign or unit around it (a `%` divides by
 *   100 in a percent column); else a number as JavaScript writes it
 *   ("1234.5", "1e3").
 * - date: an ISO date ("2024-03-01", with a time too), or the day, month
 *   and year in the locale's order, the month as a number or a name (long
 *   or short), with a time after it (and AM / PM); a two-digit year is
 *   1930–2029, as Excel reads it. Days are in the column's `timeZone`.
 * - boolean: the Yes / No labels, "true" / "false", "1" / "0".
 * - options: an option's label or value.
 *
 * Case and accents do not matter; an empty text is an empty cell (`null`).
 * A column's `parse` reads its text instead, rejecting it by throwing.
 */
import type { EngineColumn } from "./engine/columns"
import { foldText, resolveLocale, type FormatLabels } from "./engine/format"
import type { DataTableValue } from "./engine/types"
import { partsIn, startOfDay } from "./engine/values"

/** The messages of text a column's type cannot read. */
type ParseMessages = {
  /** A column's `parse` threw without a message. */
  invalid: string
  number: string
  date: string
  boolean: string
  option: string
}

type ParseResult = { value: DataTableValue } | { error: string }

type ParseContext = {
  locale: string
  labels: FormatLabels
  messages: ParseMessages
}

type NumberSymbols = {
  decimal: string
  group: string
  /** Currency symbols, percent signs and units the column's format writes. */
  affixes: ReadonlyArray<string>
  minus: string
}

const numberSymbols = new Map<string, NumberSymbols>()

function symbolsOf(locale: string, format: Intl.NumberFormatOptions = {}) {
  const key = `${locale}|${JSON.stringify(format)}`
  let symbols = numberSymbols.get(key)
  if (!symbols) {
    const plain = new Intl.NumberFormat(locale).formatToParts(-1234567.5)
    const part = (type: string) =>
      plain.find((at) => at.type === type)?.value ?? ""
    const own = new Intl.NumberFormat(locale, format).formatToParts(-1234.5)
    symbols = {
      decimal: part("decimal") || ".",
      group: part("group"),
      affixes: own
        .filter(
          (at) =>
            at.type === "currency" ||
            at.type === "percentSign" ||
            at.type === "unit"
        )
        .map((at) => foldText(at.value).replace(/\s/g, ""))
        .filter(Boolean),
      minus: part("minusSign") || "-",
    }
    numberSymbols.set(key, symbols)
  }
  return symbols
}

const MINUS = /^[-−‒–]/

function parseNumber(
  text: string,
  locale: string,
  format: Intl.NumberFormatOptions | undefined
): number | undefined {
  const symbols = symbolsOf(locale, format)
  // Digits as ASCII, spaces (the no-break ones `Intl` writes) removed,
  // and the Arabic separators as the locale's.
  let rest = foldText(text)
    .replace(/\s/g, "")
    .replace(/\u066c/g, symbols.group)
    .replace(/\u066b/g, symbols.decimal)
  let percent = false
  for (const affix of symbols.affixes) {
    if (!rest.includes(affix)) continue
    if (affix === "%" || affix === "٪") percent = true
    rest = rest.split(affix).join("")
  }
  if (rest.includes("%")) {
    percent = true
    rest = rest.replace(/%/g, "")
  }
  let negative = false
  if (/^\(.*\)$/.test(rest)) {
    negative = true
    rest = rest.slice(1, -1)
  }
  if (rest.startsWith(symbols.minus) || MINUS.test(rest)) {
    negative = !negative
    rest = rest.slice(rest.startsWith(symbols.minus) ? symbols.minus.length : 1)
  } else if (rest.startsWith("+")) rest = rest.slice(1)
  let number = strictNumber(rest, symbols)
  // A number as JavaScript writes it ("1234.5" in a German table).
  if (number === undefined && /^[0-9.]*(e[+-]?\d+)?$/i.test(rest) && rest)
    number = Number(rest)
  if (number === undefined || !Number.isFinite(number)) return undefined
  if (negative) number = -number
  return percent && format?.style === "percent" ? number / 100 : number
}

/** Digits with the locale's separators only; `undefined` otherwise. */
function strictNumber(text: string, symbols: NumberSymbols) {
  const parts = text.split(symbols.decimal)
  if (parts.length > 2) return undefined
  const [whole] = parts
  const fraction = parts.length === 2 ? parts[1] : undefined
  let digits = whole
  if (symbols.group && whole.includes(symbols.group)) {
    const groups = whole.split(symbols.group)
    // 1,234,567 or (Indian) 12,34,567: groups of two or three after the first.
    if (
      !groups[0] ||
      groups.slice(1).some((group) => group.length < 2 || group.length > 3)
    )
      return undefined
    digits = groups.join("")
  }
  if (
    !/^\d*$/.test(digits) ||
    (fraction !== undefined && !/^\d+$/.test(fraction))
  )
    return undefined
  if (!digits && !fraction) return undefined
  return Number(
    `${digits || "0"}${fraction === undefined ? "" : `.${fraction}`}`
  )
}

type DateSymbols = {
  order: ReadonlyArray<"year" | "month" | "day">
  /** Month names (long, short, as in a date and alone), folded, by month from 0. */
  months: ReadonlyMap<string, number>
  am: string
  pm: string
}

const dateSymbols = new Map<string, DateSymbols>()

const strip = (text: string) => foldText(text).replace(/[.\s]/g, "")

function dateSymbolsOf(locale: string) {
  let symbols = dateSymbols.get(locale)
  if (!symbols) {
    const options = { calendar: "gregory", numberingSystem: "latn" } as const
    const order = new Intl.DateTimeFormat(locale, {
      ...options,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(new Date(2033, 10, 22))
      .flatMap((part) =>
        part.type === "year" || part.type === "month" || part.type === "day"
          ? [part.type]
          : []
      )
    const months = new Map<string, number>()
    for (const month of ["long", "short"] as const) {
      const alone = new Intl.DateTimeFormat(locale, { ...options, month })
      const inDate = new Intl.DateTimeFormat(locale, {
        ...options,
        month,
        day: "numeric",
      })
      for (let m = 0; m < 12; m++) {
        const date = new Date(2033, m, 15)
        const names = [
          alone.format(date),
          inDate.formatToParts(date).find((part) => part.type === "month")
            ?.value ?? "",
        ]
        for (const name of names) {
          const key = strip(name)
          // Names with digits (Japanese "1月") are read as numbers.
          if (key && !/\d/.test(key) && !months.has(key)) months.set(key, m)
        }
      }
    }
    const period = (hour: number) =>
      strip(
        new Intl.DateTimeFormat(locale, {
          ...options,
          hour: "numeric",
          hour12: true,
        })
          .formatToParts(new Date(2033, 0, 1, hour))
          .find((part) => part.type === "dayPeriod")?.value ?? ""
      )
    symbols = {
      order: order.length === 3 ? order : ["month", "day", "year"],
      months,
      am: period(1) || "am",
      pm: period(13) || "pm",
    }
    dateSymbols.set(locale, symbols)
  }
  return symbols
}

const ISO =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[t ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
const ISO_ZONED = /^\d{4}-\d{2}-\d{2}t[\d:.]+(z|[+-]\d{2}:?\d{2})$/

/**
 * The instant a wall-clock time shows in `timeZone` (the local zone
 * without one): a day's time read from text, as a date column shows it.
 * Midnight is the day's first instant (`startOfDay`).
 */
function timeIn(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone?: string
): Date {
  if (hour === 0 && minute === 0 && second === 0)
    return startOfDay(year, month, day, timeZone)
  if (!timeZone) return new Date(year, month, day, hour, minute, second)
  const wanted = Date.UTC(year, month, day, hour, minute, second)
  // The zone's offset, twice: once more across a change of offset.
  let time = wanted
  for (let pass = 0; pass < 2; pass++) {
    const p = partsIn(time, timeZone)
    time -=
      Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second) - wanted
  }
  return new Date(time)
}

/** A two-digit year as Excel reads it: 1930–2029. */
function fullYear(token: string) {
  const year = Number(token)
  if (token.length > 2) return year
  return year < 30 ? 2000 + year : 1900 + year
}

function validDay(year: number, month: number, day: number) {
  if (month < 0 || month > 11 || day < 1) return false
  const date = new Date(Date.UTC(year, month, day))
  return date.getUTCMonth() === month && date.getUTCDate() === day
}

function makeDate(
  year: number,
  month: number,
  day: number,
  time: ReadonlyArray<number>,
  timeZone: string | undefined
) {
  const [hour = 0, minute = 0, second = 0] = time
  if (!validDay(year, month, day)) return undefined
  if (hour > 23 || minute > 59 || second > 59) return undefined
  return timeIn(year, month, day, hour, minute, second, timeZone)
}

function parseDate(
  text: string,
  locale: string,
  format: Intl.DateTimeFormatOptions | undefined
): Date | undefined {
  const timeZone = format?.timeZone
  const folded = foldText(text.trim())
  if (ISO_ZONED.test(folded)) {
    const time = Date.parse(text.trim())
    return Number.isFinite(time) ? new Date(time) : undefined
  }
  const iso = ISO.exec(folded)
  if (iso) {
    const [, y, m, d, ...time] = iso
    return makeDate(
      Number(y),
      Number(m) - 1,
      Number(d),
      time.filter(Boolean).map(Number),
      timeZone
    )
  }
  const symbols = dateSymbolsOf(locale)
  const numbers: Array<string> = []
  let month: number | undefined
  let period: "am" | "pm" | undefined
  for (const [token] of folded.matchAll(/\d+|[\p{L}\p{M}]+/gu)) {
    if (/^\d+$/.test(token)) {
      numbers.push(token)
      continue
    }
    const word = token.replace(/\./g, "")
    if (month === undefined && symbols.months.has(word))
      month = symbols.months.get(word)
    else if (word === symbols.am || word === "am") period = "am"
    else if (word === symbols.pm || word === "pm") period = "pm"
  }
  const fields: Partial<Record<"year" | "month" | "day", string>> = {}
  const wanted = symbols.order.filter(
    (field) => field !== "month" || month === undefined
  )
  for (const field of wanted) {
    const next = numbers.shift()
    if (next === undefined) break
    fields[field] = next
  }
  if (fields.year === undefined) return undefined
  const time = numbers.map(Number)
  if (period && time.length > 0) {
    if (period === "pm" && time[0] < 12) time[0] += 12
    if (period === "am" && time[0] === 12) time[0] = 0
  }
  return makeDate(
    fullYear(fields.year),
    month ?? Number(fields.month ?? NaN) - 1,
    Number(fields.day ?? 1),
    time,
    timeZone
  )
}

function parseBoolean(text: string, labels: FormatLabels) {
  const folded = foldText(text.trim())
  if (folded === foldText(labels.yes) || folded === "true" || folded === "1")
    return true
  if (folded === foldText(labels.no) || folded === "false" || folded === "0")
    return false
  return undefined
}

/** Reads `text` as `column`'s value for `item`, or why it cannot be. */
function parseCellText<T>(
  column: EngineColumn<T>,
  text: string,
  item: T,
  context: ParseContext
): ParseResult {
  const { parse } = column.definition
  if (parse) {
    try {
      return { value: parse(text, item) }
    } catch (error) {
      return {
        error:
          error instanceof Error && error.message
            ? error.message
            : context.messages.invalid,
      }
    }
  }
  if (text.trim() === "") return { value: null }
  const locale = resolveLocale(context.locale)
  switch (column.type) {
    case "text":
      return { value: text }
    case "number": {
      const value = parseNumber(text, locale, column.format)
      return value === undefined
        ? { error: context.messages.number }
        : { value }
    }
    case "date": {
      const value = parseDate(text, locale, column.format)
      return value === undefined ? { error: context.messages.date } : { value }
    }
    case "boolean": {
      const value = parseBoolean(text, context.labels)
      return value === undefined
        ? { error: context.messages.boolean }
        : { value }
    }
    case "options": {
      const folded = foldText(text.trim())
      const option = column.options.find(
        (candidate) =>
          candidate.value === text.trim() ||
          foldText(candidate.label) === folded
      )
      return option
        ? { value: option.value }
        : { error: context.messages.option }
    }
  }
}

export { parseCellText, parseDate, parseNumber }
export type { ParseContext, ParseMessages, ParseResult }
