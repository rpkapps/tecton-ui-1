/**
 * Display text: what a cell shows as text, and what search, type-ahead, CSV
 * and copy read, formatted in the locale.
 *
 * - text: the value as a string.
 * - number: `Intl.NumberFormat(locale, format)`.
 * - date: `Intl.DateTimeFormat(locale, format ?? { dateStyle: "medium" })`.
 * - boolean: `labels.yes` / `labels.no` (the cell draws a check instead).
 * - options: the option's label (the value itself when no option has it).
 *
 * Empty values are `""` (`hasNoValue`: the cell draws its empty value, the
 * filters' and groups' "No value"). `Intl` formatters are made once per locale and
 * options and shared; `getFormatter` keeps one formatter per column model,
 * locale and labels, which also remembers the text of repeated dates and
 * numbers. An invalid locale falls back to `en-US` rather than throw.
 *
 * `foldText` is the case- and accent-insensitive form search compares.
 */
import type { ColumnModel, EngineColumn } from "./columns"
import type { DataTableAggregate, DataTableValue } from "./types"
import { toBoolean, toDate, toNumber } from "./values"

/** The words a boolean's text uses; the root passes them localized. */
type FormatLabels = { yes: string; no: string }

type Formatter<T> = {
  readonly locale: string
  /** The display text of a value of `column`. */
  format: (column: EngineColumn<T>, value: DataTableValue) => string
  /** The display text of `column`'s cell for `item`. */
  text: (column: EngineColumn<T>, item: T) => string
  /**
   * The text of a group of `column`'s rows with `item`'s value: its display
   * text, but a date column's day alone (rows group by day, `group.ts`).
   */
  groupText: (column: EngineColumn<T>, item: T) => string
  /**
   * The display text of an aggregate of `column`: counts as plain integers,
   * the other built-ins (and functions) in the column's format.
   */
  formatAggregate: (
    column: EngineColumn<T>,
    value: DataTableValue,
    aggregate?: DataTableAggregate<T> | null
  ) => string
}

const DEFAULT_LABELS: FormatLabels = { yes: "Yes", no: "No" }
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
// Distinct values remembered per column: plenty for the dates and integers
// that repeat, bounded for columns whose values never do.
const TEXT_CACHE_LIMIT = 20_000

const locales = new Map<string, string>()
const numberFormats = new Map<string, Intl.NumberFormat>()
const dateFormats = new Map<string, Intl.DateTimeFormat>()

/** `locale` as `Intl` takes it, or `en-US` when it is not a valid tag. */
function resolveLocale(locale: string | undefined) {
  const tag = locale ?? "en-US"
  let resolved = locales.get(tag)
  if (resolved === undefined) {
    try {
      resolved = Intl.getCanonicalLocales(tag)[0] ?? "en-US"
    } catch {
      resolved = "en-US"
    }
    locales.set(tag, resolved)
  }
  return resolved
}

function getNumberFormat(locale: string, options?: Intl.NumberFormatOptions) {
  const key = `${locale}|${options ? JSON.stringify(options) : ""}`
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, options)
    numberFormats.set(key, format)
  }
  return format
}

function getDateFormat(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`
  let format = dateFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dateFormats.set(key, format)
  }
  return format
}

/** `format`, remembering the text of up to `TEXT_CACHE_LIMIT` keys. */
function remembered(format: (key: number) => string) {
  const cache = new Map<number, string>()
  return (key: number) => {
    let text = cache.get(key)
    if (text === undefined) {
      text = format(key)
      if (cache.size < TEXT_CACHE_LIMIT) cache.set(key, text)
    }
    return text
  }
}

function columnFormat<T>(
  column: EngineColumn<T>,
  locale: string,
  labels: FormatLabels
): (value: DataTableValue) => string {
  switch (column.type) {
    case "number": {
      const format = getNumberFormat(locale, column.format)
      const text = remembered((number) => format.format(number))
      return (value) => {
        const number = toNumber(value)
        if (number !== undefined) return text(number)
        return typeof value === "string" ? value : ""
      }
    }
    case "date": {
      const format = getDateFormat(locale, column.format ?? DEFAULT_DATE_FORMAT)
      const text = remembered((time) => format.format(time))
      return (value) => {
        const date = toDate(value)
        return date ? text(date.getTime()) : ""
      }
    }
    case "boolean":
      return (value) => {
        const boolean = toBoolean(value)
        return boolean === undefined ? "" : boolean ? labels.yes : labels.no
      }
    case "options": {
      const labelsByValue = new Map(
        column.options.map((option) => [option.value, option.label])
      )
      return (value) =>
        value === null || value === undefined
          ? ""
          : (labelsByValue.get(String(value)) ?? String(value))
    }
    case "text":
      return (value) =>
        value === null || value === undefined
          ? ""
          : value instanceof Date
            ? value.toISOString()
            : String(value)
  }
}

/**
 * Whether `value` has no display text in `column`: `null`, `undefined`,
 * `""`, an invalid number or date, or a value a number or date column
 * cannot read. The cell draws the column's empty value for it, and the
 * filters' "No value" matches it.
 */
function hasNoValue<T>(column: EngineColumn<T>, value: DataTableValue) {
  switch (column.type) {
    case "number":
      return (
        toNumber(value) === undefined &&
        (typeof value !== "string" || value === "")
      )
    case "date":
      return toDate(value) === undefined
    case "boolean":
      return toBoolean(value) === undefined
    case "options":
      return (
        value === null ||
        value === undefined ||
        (value === "" && !column.optionIndex.has(""))
      )
    case "text":
      return value === null || value === undefined || value === ""
  }
}

/** The parts of a date format that show a time, not a day. */
const TIME_FIELDS = [
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "dayPeriod",
  "hour12",
  "hourCycle",
  "timeStyle",
  "timeZoneName",
] as const
const DAY_FIELDS = ["era", "year", "month", "day", "weekday", "dateStyle"]

/**
 * A date format's day alone: its time fields left out (the zone, calendar
 * and digits kept), the medium date style when nothing of the day is left.
 */
function dayFormat(
  options: EngineColumn<unknown>["format"] = DEFAULT_DATE_FORMAT
): Intl.DateTimeFormatOptions {
  const day: Record<string, unknown> = { ...options }
  for (const field of TIME_FIELDS) delete day[field]
  return DAY_FIELDS.some((field) => day[field] !== undefined)
    ? day
    : { ...day, dateStyle: "medium" }
}

const formatters = new WeakMap<object, Map<string, Formatter<never>>>()

/**
 * The formatter of `model`'s columns in `locale` (kept, so that the same
 * arguments return the same formatter and its remembered text).
 */
function getFormatter<T>(
  model: ColumnModel<T>,
  locale: string | undefined,
  labels: FormatLabels = DEFAULT_LABELS
): Formatter<T> {
  const resolved = resolveLocale(locale)
  const key = `${resolved}|${labels.yes}|${labels.no}`
  let byKey = formatters.get(model)
  if (!byKey) formatters.set(model, (byKey = new Map()))
  const cached = byKey.get(key) as unknown as Formatter<T> | undefined
  if (cached) return cached

  const perColumn = new Map<
    EngineColumn<T>,
    (value: DataTableValue) => string
  >()
  const formatOf = (column: EngineColumn<T>) => {
    let format = perColumn.get(column)
    if (!format) {
      format = columnFormat(column, resolved, labels)
      perColumn.set(column, format)
    }
    return format
  }
  const dayTexts = new Map<EngineColumn<T>, (time: number) => string>()
  const formatter: Formatter<T> = {
    locale: resolved,
    format: (column, value) => formatOf(column)(value),
    text: (column, item) => formatOf(column)(column.getValue(item)),
    groupText: (column, item) => {
      const value = column.getValue(item)
      if (column.type !== "date") return formatOf(column)(value)
      const date = toDate(value)
      if (!date) return ""
      let text = dayTexts.get(column)
      if (!text) {
        const format = getDateFormat(resolved, dayFormat(column.format))
        text = remembered((time) => format.format(time))
        dayTexts.set(column, text)
      }
      return text(date.getTime())
    },
    formatAggregate: (column, value, aggregate = column.aggregate) => {
      if (aggregate === "count" || aggregate === "countDistinct") {
        const number = toNumber(value)
        return number === undefined
          ? ""
          : getNumberFormat(resolved).format(number)
      }
      // A number column's sum, or a date column's min, reads as the column.
      if (column.type === "number" || column.type === "date")
        return formatOf(column)(value)
      if (typeof value === "number")
        return getNumberFormat(resolved).format(value)
      if (value instanceof Date)
        return getDateFormat(resolved, DEFAULT_DATE_FORMAT).format(value)
      return formatOf(column)(value)
    },
  }
  byKey.set(key, formatter as unknown as Formatter<never>)
  return formatter
}

const NON_ASCII = /[\u0080-\uffff]/
const MARKS = /\p{M}/gu
// Letters that do not decompose into a base letter and a mark.
const LETTERS: Record<string, string> = {
  ı: "i",
  ß: "ss",
  ø: "o",
  đ: "d",
  ħ: "h",
  ł: "l",
  æ: "ae",
  œ: "oe",
}
const LETTER = new RegExp(`[${Object.keys(LETTERS).join("")}]`, "g")
// Arabic-Indic and Eastern Arabic-Indic digits, as the ASCII digits typed.
const DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/g
const SPACES = /\s/g

/**
 * `text` without case and accents, for "contains" matching: lower case,
 * marks removed, a few letters spelled out (ß as ss, ø as o), Arabic
 * digits as ASCII ones and every space (the no-break ones `Intl` writes
 * in numbers and currencies) as a plain one. Both sides of a match go through it, so the result
 * does not depend on the locale.
 */
function foldText(text: string) {
  const lower = text.toLowerCase()
  if (!NON_ASCII.test(lower)) return lower
  return lower
    .normalize("NFD")
    .replace(MARKS, "")
    .replace(LETTER, (letter) => LETTERS[letter] ?? letter)
    .replace(SPACES, " ")
    .replace(DIGITS, (digit) =>
      String(digit.charCodeAt(0) - (digit >= "\u06f0" ? 0x06f0 : 0x0660))
    )
}

/**
 * `foldText` that remembers the folds of non-ASCII text (the costly ones,
 * and usually few distinct: names, places, option labels), up to
 * `TEXT_CACHE_LIMIT` of them.
 */
function createFolder() {
  const cache = new Map<string, string>()
  return (text: string) => {
    if (!NON_ASCII.test(text)) return text.toLowerCase()
    let folded = cache.get(text)
    if (folded === undefined) {
      folded = foldText(text)
      if (cache.size < TEXT_CACHE_LIMIT) cache.set(text, folded)
    }
    return folded
  }
}

/** The parts of a formatted number that are its unit rather than the number. */
const UNIT_PARTS: ReadonlySet<string> = new Set([
  "unit",
  "percentSign",
  "currency",
])

/**
 * A number column's unit apart from its numbers, for a field that holds
 * one of them with the unit beside it (a number filter's).
 */
type NumberUnit = {
  /** The unit as the column writes it ("m", "%", "$"), if it has one. */
  unit: string | undefined
  /**
   * Whether the column writes the unit before its numbers ("$5" in
   * English) or after them ("5 m", "5 %", "5 $" in French).
   */
  side: "start" | "end"
  /** The factor the column shows its numbers at: 100 for a percent. */
  scale: number
}

function numberUnit(
  locale: string,
  options: Intl.NumberFormatOptions | undefined
): NumberUnit {
  const format = getNumberFormat(resolveLocale(locale), options)
  // A plural form that reads for most numbers ("5 meters").
  const five = format.formatToParts(5)
  const unit = five
    .filter((part) => UNIT_PARTS.has(part.type))
    .map((part) => part.value)
    .join("")
  const first = five.findIndex((part) => UNIT_PARTS.has(part.type))
  const integer = five.findIndex((part) => part.type === "integer")
  return {
    unit: unit || undefined,
    side: first !== -1 && first < integer ? "start" : "end",
    scale: options?.style === "percent" ? 100 : 1,
  }
}

export {
  createFolder,
  dayFormat,
  DEFAULT_LABELS,
  foldText,
  getFormatter,
  hasNoValue,
  numberUnit,
  resolveLocale,
}
export type { FormatLabels, Formatter, NumberUnit }
