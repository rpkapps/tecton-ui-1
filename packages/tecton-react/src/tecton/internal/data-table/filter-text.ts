/**
 * A filter's value in words, for its `DataTableFilter` button and its chip
 * in `DataTableActiveFilters`, each item of its list side by side ("A-12,
 * B-3"; with `short`, "3 selected" past two): the texts a text filter looks
 * for, a number range ("1,000–3,000", "≥ 1,000", "> 1,000", "> 1,000 and ≤ 3,000" with an
 * exclusive bound), a range of days (one day when both
 * ends are the same), Yes / No, the options' labels ("Producing,
 * Drilling"), each with its "No value"
 * ("No value" alone, "1,000–3,000 or no value", "Producing, No value").
 * Numbers read as the column formats them, days as its date fields (its
 * `dateStyle`, else medium) in its time zone, never its time; a custom
 * filter value has no words (`null`).
 */
import type { Translator } from "../i18n/translations"
import type {
  DataTableFilterValue,
  EngineColumn,
  Formatter,
} from "./engine/index"
import type { DataTableDateRange, DataTableNumberRange } from "./engine/types"
import { dayOf } from "./engine/values"

const dayFormats = new Map<string, Intl.DateTimeFormat>()

/** A date column's days, without their time: its date fields and zone. */
function dayFormat<T>(column: EngineColumn<T>, locale: string) {
  const {
    dateStyle,
    timeZone,
    calendar,
    numberingSystem,
    era,
    year,
    month,
    day,
    weekday,
  } = (column.format ?? {}) as Intl.DateTimeFormatOptions
  const fields = { era, year, month, day, weekday }
  const own = Object.values(fields).some((field) => field !== undefined)
  const options: Intl.DateTimeFormatOptions = {
    ...(dateStyle || !own ? { dateStyle: dateStyle ?? "medium" } : fields),
    timeZone,
    calendar,
    numberingSystem,
  }
  const key = `${locale}|${JSON.stringify(options)}`
  let format = dayFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dayFormats.set(key, format)
  }
  return format
}

function filterText<T>(
  column: EngineColumn<T>,
  value: DataTableFilterValue,
  formatter: Formatter<T>,
  t: Translator<"dataTable">,
  { short = false }: { short?: boolean } = {}
): string | null {
  if (value.type === "custom") return null
  if (value.type === "options")
    return optionsText(column, value, formatter, t, short)
  const items = itemTexts(column, value, formatter, t)
  const count = items.length + (value.empty ? 1 : 0)
  if (short && count > 2) return selected(count, formatter, t)
  const text = items.length ? listText(items, formatter) : null
  if (!value.empty) return text
  // "No value": alone, or after the rest of the filter.
  return text ? t("filterOrNoValue", { value: text }) : t("noValue")
}

/** "3 selected": a filter's items past two, on its button. */
const selected = <T>(
  count: number,
  formatter: Formatter<T>,
  t: Translator<"dataTable">
) =>
  t("optionsSelected", {
    count,
    total: count.toLocaleString(formatter.locale),
  })

/** Items side by side: "A-12, B-3". */
const listText = <T>(items: ReadonlyArray<string>, formatter: Formatter<T>) =>
  new Intl.ListFormat(formatter.locale, {
    style: "short",
    type: "unit",
  }).format(items)

/** The words of each item of a filter's list, its "No value" aside. */
function itemTexts<T>(
  column: EngineColumn<T>,
  value: Exclude<DataTableFilterValue, { type: "custom" | "options" }>,
  formatter: Formatter<T>,
  t: Translator<"dataTable">
): Array<string> {
  switch (value.type) {
    case "text":
      return value.values.map((text) => text.trim()).filter(Boolean)
    case "number":
      return value.ranges.flatMap((range) => {
        const text = numberText(column, range, formatter, t)
        return text === null ? [] : [text]
      })
    case "date": {
      const days = dayFormat(column, formatter.locale)
      return value.ranges.flatMap((range) => {
        const text = dateText(range, days, t)
        return text === null ? [] : [text]
      })
    }
    case "boolean":
      return value.values.map((wanted) => formatter.format(column, wanted))
  }
}

/** A number range in words; `null` without a bound. */
function numberText<T>(
  column: EngineColumn<T>,
  { min, max, minExclusive, maxExclusive }: DataTableNumberRange,
  formatter: Formatter<T>,
  t: Translator<"dataTable">
) {
  const format = (raw: number) => formatter.format(column, raw)
  const low =
    min === undefined
      ? null
      : t(minExclusive ? "filterMoreThan" : "filterAtLeast", {
          value: format(min),
        })
  const high =
    max === undefined
      ? null
      : t(maxExclusive ? "filterLessThan" : "filterAtMost", {
          value: format(max),
        })
  if (min !== undefined && max !== undefined)
    return minExclusive || maxExclusive
      ? t("filterBounds", { min: low ?? "", max: high ?? "" })
      : t("filterRange", { from: format(min), to: format(max) })
  return low ?? high
}

/** A date range in words (one day when both ends are that day); `null` without an end. */
function dateText(
  { from, to }: DataTableDateRange,
  days: Intl.DateTimeFormat,
  t: Translator<"dataTable">
) {
  const { timeZone } = days.resolvedOptions()
  const same = (a: Date, b: Date) => {
    const x = dayOf(a, timeZone)
    const y = dayOf(b, timeZone)
    return x.year === y.year && x.month === y.month && x.day === y.day
  }
  if (from && to)
    return same(from, to)
      ? days.format(from)
      : t("filterRange", { from: days.format(from), to: days.format(to) })
  if (from) return t("filterFrom", { value: days.format(from) })
  if (to) return t("filterUntil", { value: days.format(to) })
  return null
}

/** The options chosen, by label, "No value" last (`short`: a count past two). */
function optionsText<T>(
  column: EngineColumn<T>,
  value: Extract<DataTableFilterValue, { type: "options" }>,
  formatter: Formatter<T>,
  t: Translator<"dataTable">,
  short: boolean
) {
  const count = value.values.length + (value.empty ? 1 : 0)
  if (short && count > 2) return selected(count, formatter, t)
  // In the column's order, by label.
  const chosen = new Set(value.values)
  const labels = column.options
    .filter((option) => chosen.has(option.value))
    .map((option) => option.label)
  const known = new Set(column.options.map((option) => option.value))
  for (const other of value.values) if (!known.has(other)) labels.push(other)
  if (value.empty) labels.push(t("noValue"))
  return listText(labels, formatter)
}

export { filterText }
