/**
 * Internal to `@tecton/react`: dates as text in a locale, for the date
 * pickers. Formatting is `Intl.DateTimeFormat` on the Gregorian calendar
 * (the calendar grid is Gregorian whatever the locale's default calendar);
 * parsing reads back what a person types in that locale: the formatted text
 * itself ("1. Juni 2025", "١ يونيو ٢٠٢٥", "2025年6月1日"), the numeric
 * form in the locale's order ("01.06.2025", "6/1/2025"), or an ISO date
 * ("2025-06-01"). Month names may be abbreviated; weekday names and the
 * locale's own literals ("de", "г.", "年") are skipped.
 */

type DateField = "day" | "month" | "year"

/** A formatter for `locale` on the Gregorian calendar. */
function dateFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" }
) {
  return new Intl.DateTimeFormat(locale, { calendar: "gregory", ...options })
}

/** `2025-06-01`: the local calendar day of `date`, for a form field. */
function toISODate(date: Date) {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0")
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local midnight of `date`'s day. */
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Whether two dates fall on the same local calendar day. */
function isSameDay(a: Date | undefined, b: Date | undefined) {
  if (!a || !b) return a === b
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Whether `date`'s day lies within `[min, max]` (by day; either may be absent). */
function isWithin(date: Date, min?: Date, max?: Date) {
  const day = startOfDay(date).getTime()
  if (min && day < startOfDay(min).getTime()) return false
  if (max && day > startOfDay(max).getTime()) return false
  return true
}

const DIGIT_RANGES = [0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0xff10]

/** Native digits (Arabic-Indic, Persian, Devanagari, full width…) as ASCII. */
function asciiDigits(text: string) {
  return text.replace(/[٠-٩۰-۹߀-߉०-९০-৯０-９]/g, (digit) => {
    const code = digit.charCodeAt(0)
    const zero = DIGIT_RANGES.find(
      (start) => code >= start && code <= start + 9
    )!
    return String(code - zero)
  })
}

function normalizeWord(word: string, locale: string) {
  return word.normalize("NFC").toLocaleLowerCase(locale).replace(/\./g, "")
}

const WORDS = /[\p{L}\p{M}]+(?:\.[\p{L}\p{M}]+)*\.?/gu

type LocaleWords = {
  order: DateField[]
  /** The names of each month (long and short, standalone and in a date). */
  months: string[][]
  /** Words a date may carry that are not a field: weekdays, literals. */
  skipped: Set<string>
}

const localeWords = new Map<string, LocaleWords>()

/** What the parser knows of a locale: its field order, month names, literals. */
function wordsOf(locale: string): LocaleWords {
  const cached = localeWords.get(locale)
  if (cached) return cached
  const numeric = dateFormatter(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
  const order = numeric
    .formatToParts(new Date(2001, 10, 22))
    .map((part) => part.type)
    .filter(
      (type): type is DateField =>
        type === "day" || type === "month" || type === "year"
    )
  const months: Array<Set<string>> = Array.from(
    { length: 12 },
    () => new Set<string>()
  )
  const skipped = new Set<string>()
  // The words of a formatted date: one that touches the month's part is its
  // name ("ביוני", "in June" in Hebrew), the others are skipped ("de",
  // "г.", "日星期日").
  const collect = (date: Date, options: Intl.DateTimeFormatOptions) => {
    let text = ""
    const monthRanges: Array<[number, number]> = []
    for (const part of dateFormatter(locale, options).formatToParts(date)) {
      const value = asciiDigits(part.value)
      if (part.type === "month")
        monthRanges.push([text.length, text.length + value.length])
      text += value
    }
    for (const match of text.matchAll(WORDS)) {
      const from = match.index
      const to = from + match[0].length
      const word = normalizeWord(match[0], locale)
      if (!word) continue
      if (monthRanges.some(([start, end]) => from < end && to > start))
        months[date.getMonth()].add(word)
      else skipped.add(word)
    }
  }
  const styles: Array<Intl.DateTimeFormatOptions> = [
    { month: "long" },
    { month: "short" },
    { day: "numeric", month: "long" },
    { day: "numeric", month: "short" },
    { dateStyle: "full" },
    { dateStyle: "long" },
    { dateStyle: "medium" },
  ]
  for (let month = 0; month < 12; month++) {
    for (const style of styles) collect(new Date(2001, month, 22), style)
  }
  // Every weekday, alone and in a full date.
  for (let day = 1; day <= 7; day++) {
    for (const style of [
      { weekday: "long" },
      { weekday: "short" },
      { dateStyle: "full" },
    ] satisfies Array<Intl.DateTimeFormatOptions>)
      collect(new Date(2001, 0, day), style)
  }
  // A word every month name carries ("월" in "6월") names no month.
  for (const word of months[0]) {
    if (months.every((names) => names.has(word))) skipped.add(word)
  }
  const result: LocaleWords = {
    order: order.length === 3 ? order : ["month", "day", "year"],
    months: months.map((names) =>
      [...names].filter((name) => !skipped.has(name))
    ),
    skipped,
  }
  localeWords.set(locale, result)
  return result
}

/** The month (0–11) a word names, by its full or abbreviated name. */
function monthOf(word: string, months: string[][]) {
  let found: number | undefined
  for (const [month, names] of months.entries()) {
    const exact = names.includes(word)
    const partial =
      word.length >= 3 &&
      names.some(
        (name) =>
          name.startsWith(word) || (name.length >= 3 && word.startsWith(name))
      )
    if (exact) return month
    if (partial) {
      if (found !== undefined && found !== month) return undefined
      found = month
    }
  }
  return found
}

/** A two-digit year in the century that puts it at most 20 years ahead. */
function fullYear(digits: string) {
  const year = Number(digits)
  if (digits.length !== 2) return year
  const now = new Date().getFullYear()
  const century = Math.floor(now / 100) * 100
  return century + year > now + 20 ? century - 100 + year : century + year
}

type ParseOptions = {
  /**
   * Only a year of four digits: while typing, "6/1/2" is on its way to
   * "6/1/2025", not the year 2002.
   */
  fullYearOnly?: boolean
}

/**
 * The local day `text` names in `locale`, or `null` when it names none.
 * Without a year ("June 1") it is the current year's.
 */
function parseDate(
  text: string,
  locale: string,
  { fullYearOnly = false }: ParseOptions = {}
): Date | null {
  const source = asciiDigits(text.normalize("NFC")).trim()
  if (!source) return null
  const { order, months, skipped } = wordsOf(locale)
  const tokens =
    source.match(/\d+|[\p{L}\p{M}]+(?:\.[\p{L}\p{M}]+)*\.?/gu) ?? []
  const numbers: string[] = []
  let month: number | undefined
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      numbers.push(token)
      continue
    }
    const word = normalizeWord(token, locale)
    const named = monthOf(word, months)
    if (named !== undefined && month === undefined) month = named
    else if (!skipped.has(word)) return null
  }

  let day: string | undefined
  let year: string | undefined
  let monthDigits: string | undefined
  if (month !== undefined) {
    if (numbers.length === 1) [day] = numbers
    else if (numbers.length === 2) {
      // The year is the long one, else the one the locale writes later
      // (or earlier) than the day.
      const [first, second] = numbers
      const yearFirst =
        first.length > 2 || Number(first) > 31
          ? true
          : second.length > 2 || Number(second) > 31
            ? false
            : order.indexOf("year") < order.indexOf("day")
      ;[year, day] = yearFirst ? [first, second] : [second, first]
    } else return null
  } else {
    if (numbers.length !== 3) return null
    // Four digits first is year-month-day (ISO) in every locale.
    const fields: DateField[] =
      numbers[0].length > 2 ? ["year", "month", "day"] : order
    const value = (field: DateField) => numbers[fields.indexOf(field)]
    ;[year, monthDigits, day] = [value("year"), value("month"), value("day")]
  }

  if (year !== undefined) {
    if (year.length !== 4 && (fullYearOnly || year.length !== 2)) return null
  } else if (fullYearOnly) return null
  const y = year === undefined ? new Date().getFullYear() : fullYear(year)
  const m = month ?? Number(monthDigits) - 1
  const d = Number(day)
  const date = new Date(y, m, d)
  // Day 31 of a 30-day month rolls over: not a date.
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d)
    return null
  return date
}

export { dateFormatter, isSameDay, isWithin, parseDate, startOfDay, toISODate }
