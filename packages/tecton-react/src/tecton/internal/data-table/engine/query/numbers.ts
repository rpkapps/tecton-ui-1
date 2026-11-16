/**
 * Numbers in the query, as the table's locale writes them: its decimal
 * separator ("3,5" in German, "3.5" in English), its grouping separator
 * optional ("3.000" or "3000" in German) but only where grouping puts it
 * (the integer part's last group three digits: "3,5" is not a number in
 * English), its digits or ASCII ones, a minus sign (`-`, `−`), and a
 * trailing `%` for a hundredth ("25%" is 0.25, as a percent column shows
 * it). No exponent, no currency or unit.
 *
 * The query writes a number exactly (`formatNumber`): its shortest decimal
 * digits, in full (never as an exponent), with the locale's decimal
 * separator and no grouping, so it reads back as the same number. In a
 * number column's list, a comma between digits is a number's own when its
 * locale writes one there (`joinsNumber`).
 */

type NumberSymbols = { readonly decimal: string; readonly group: string }

const symbolsByLocale = new Map<string, NumberSymbols>()

/** The decimal and grouping separators of `locale`. */
function numberSymbols(locale: string): NumberSymbols {
  let symbols = symbolsByLocale.get(locale)
  if (!symbols) {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
    symbols = {
      decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
      group: parts.find((part) => part.type === "group")?.value ?? ",",
    }
    symbolsByLocale.set(locale, symbols)
  }
  return symbols
}

/** The zeros of the decimal digit systems `Intl` writes. */
const ZEROS = [
  0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6,
  0x0c66, 0x0ce6, 0x0d66, 0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x17e0, 0x1810,
  0xff10,
]

/** Digits of other scripts as ASCII ones. */
function asciiDigits(text: string) {
  return text.replace(/\p{Nd}/gu, (digit) => {
    const code = digit.charCodeAt(0)
    if (code <= 0x39) return digit
    const zero = ZEROS.find((start) => code >= start && code <= start + 9)
    return zero === undefined ? digit : String(code - zero)
  })
}

// Direction marks `Intl` puts around signs in right-to-left locales.
const MARKS = /[‎‏؜]/g
const DIGITS = /^\d+$/

/** The number `text` writes in the locale of `symbols`, or `undefined`. */
function parseNumber(text: string, symbols: NumberSymbols): number | undefined {
  let rest = asciiDigits(text.replace(MARKS, "").trim())
  let scale = 1
  if (/[%٪]$/.test(rest)) {
    rest = rest.slice(0, -1)
    scale = 100
  }
  let sign = ""
  if (/^[-−+]/.test(rest)) {
    if (rest[0] !== "+") sign = "-"
    rest = rest.slice(1)
  }
  const point = rest.indexOf(symbols.decimal)
  const whole = point === -1 ? rest : rest.slice(0, point)
  const fraction =
    point === -1 ? "" : rest.slice(point + symbols.decimal.length)
  if (point !== -1 && !DIGITS.test(fraction)) return undefined
  const groups = whole.split(symbols.group)
  if (!groups.every((group) => DIGITS.test(group))) return undefined
  // Grouped: the last group of three, the others of two or three (Indian
  // grouping writes 1,00,000), the first of one to three.
  if (
    groups.length > 1 &&
    (groups[0].length > 3 ||
      groups[groups.length - 1].length !== 3 ||
      groups.slice(1, -1).some((group) => group.length < 2 || group.length > 3))
  )
    return undefined
  const number = Number(
    `${sign}${groups.join("")}${fraction ? `.${fraction}` : ""}`
  )
  if (!Number.isFinite(number)) return undefined
  return scale === 1 ? number : number / scale
}

/**
 * Whether a comma between `before` and `after` (the text on either side of
 * it in a number column's value) is a number's own, its locale's decimal
 * or grouping separator, rather than the list's: with a digit on either
 * side, always when the locale's decimal separator is a comma ("3,5" in
 * German), and when the locale groups with it, where it groups a number
 * ("1,234.5" in English, but "1000,2000" is a list).
 */
function joinsNumber(before: string, after: string, symbols: NumberSymbols) {
  if (symbols.decimal !== "," && symbols.group !== ",") return false
  const left = asciiDigits(before)
  const right = asciiDigits(after)
  if (!/\d$/.test(left) || !/^\d/.test(right)) return false
  if (symbols.decimal === ",") return true
  const whole = /\d[\d,]*$/.exec(left)?.[0] ?? ""
  // The groups after it, as many as make a number (`1,00,000`, `1,234,2000`).
  const groups = (/^\d+(?:,\d+)*/.exec(right)?.[0] ?? "").split(",")
  return groups.some(
    (_, i) =>
      parseNumber(`${whole},${groups.slice(0, i + 1).join(",")}`, symbols) !==
      undefined
  )
}

/** `n`'s shortest digits in full: "0.00000015" for 1.5e-7. */
function plainDigits(n: number) {
  const text = String(Math.abs(n))
  const exponent = text.indexOf("e")
  if (exponent === -1) return text
  const mantissa = text.slice(0, exponent)
  const power = Number(text.slice(exponent + 1))
  const point = mantissa.indexOf(".")
  const digits = mantissa.replace(".", "")
  const at = (point === -1 ? mantissa.length : point) + power
  if (at <= 0) return `0.${"0".repeat(-at)}${digits}`
  if (at >= digits.length) return digits + "0".repeat(at - digits.length)
  return `${digits.slice(0, at)}.${digits.slice(at)}`
}

/** `n` as the query writes it in the locale of `symbols` (see the module comment). */
function formatNumber(n: number, symbols: NumberSymbols) {
  const digits = plainDigits(n).replace(".", symbols.decimal)
  return n < 0 ? `-${digits}` : digits
}

export { asciiDigits, formatNumber, joinsNumber, numberSymbols, parseNumber }
export type { NumberSymbols }
