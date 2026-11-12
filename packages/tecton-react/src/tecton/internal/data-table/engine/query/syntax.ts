/**
 * The query's text, below its meaning: chunks (what lies between spaces,
 * a quoted part keeping its spaces), value items (what lies between
 * commas, outside quotes), quoting and the key forms columns are named by.
 *
 * Quotes are `"` (or the typographic “ ” a phone keyboard writes), any of
 * them closing any; inside one a backslash escapes the next character, so
 * `"say \"hi\""` holds `say "hi"`. A quote left open runs to the end of
 * the text (the user is typing it). Outside quotes a backslash is itself.
 */
import { foldText } from "../format"

/** A piece of the text between spaces, `start`–`end` in it. */
type Chunk = { readonly start: number; readonly end: number }

const SPACE = /\s/
const QUOTES = new Set(['"', "“", "”"])

const isQuote = (char: string | undefined) =>
  char !== undefined && QUOTES.has(char)

/** The chunks of `text`, in order. */
function chunksOf(text: string): Array<Chunk> {
  const chunks: Array<Chunk> = []
  let i = 0
  while (i < text.length) {
    if (SPACE.test(text[i])) {
      i++
      continue
    }
    const start = i
    let quoted = false
    while (i < text.length && (quoted || !SPACE.test(text[i]))) {
      const char = text[i]
      if (quoted && char === "\\") i++
      else if (isQuote(char)) quoted = !quoted
      i++
    }
    chunks.push({ start, end: Math.min(i, text.length) })
  }
  return chunks
}

/**
 * The index of the first `char` in `text[from, to)` outside quotes, or -1.
 */
function indexOutsideQuotes(
  text: string,
  char: string,
  from: number,
  to: number
) {
  let quoted = false
  for (let i = from; i < to; i++) {
    const c = text[i]
    if (quoted && c === "\\") i++
    else if (isQuote(c)) quoted = !quoted
    else if (!quoted && c === char) return i
  }
  return -1
}

/** What a piece of text says: its quoted parts unescaped, the rest as it is. */
function unquote(raw: string): string {
  let out = ""
  let quoted = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (quoted && c === "\\" && i + 1 < raw.length) out += raw[++i]
    else if (isQuote(c)) quoted = !quoted
    else out += c
  }
  return out
}

/** Whether `raw` has a quote (outside of which a keyword is not one). */
const hasQuote = (raw: string) => [...raw].some(isQuote)

/** A value item: what lies between two commas, `start`–`end` in the text. */
type Item = { readonly start: number; readonly end: number }

/** The items of `text[from, to)`, split on commas outside quotes. */
function itemsOf(text: string, from: number, to: number): Array<Item> {
  const items: Array<Item> = []
  let start = from
  for (;;) {
    const comma = indexOutsideQuotes(text, ",", start, to)
    if (comma === -1) {
      items.push({ start, end: to })
      return items
    }
    items.push({ start, end: comma })
    start = comma + 1
  }
}

/** `text` in quotes, with its quotes and backslashes escaped. */
function quote(text: string) {
  return `"${text.replace(/[\\"“”]/g, (char) => `\\${char}`)}"`
}

/**
 * The form a column's key is compared in: case and accents folded
 * (`foldText`), everything but letters and digits removed, so "Spud date",
 * `spud_date` and `spuddate` are one key.
 */
function keyForm(text: string) {
  return foldText(text).replace(/[^\p{L}\p{N}]/gu, "")
}

/**
 * What a chunk's text before its first colon must be to be a key: letters,
 * digits and `_ - . ( )`, starting with a letter, a digit or `_`, with a
 * letter somewhere ("10:30" is text).
 */
const KEY = /^[\p{L}\p{N}_][\p{L}\p{M}\p{N}_\-.()]*$/u
const LETTER = /\p{L}/u
const isKeyText = (text: string) => KEY.test(text) && LETTER.test(text)

/** `none` and `empty`: a filter's "No value", written unquoted. */
const isEmptyWord = (raw: string) => {
  const word = raw.trim().toLowerCase()
  return word === "none" || word === "empty"
}

/**
 * Whether `text` stands for itself as a value, unquoted: not empty, no
 * space, quote, backslash or comma, and not a "No value" word.
 */
function isPlainValue(text: string) {
  return (
    text !== "" &&
    !/[\s,\\]/.test(text) &&
    ![...text].some(isQuote) &&
    !isEmptyWord(text)
  )
}

/** A value as the query writes it: as it is when plain, else quoted. */
const valueToken = (text: string) => (isPlainValue(text) ? text : quote(text))

export {
  chunksOf,
  hasQuote,
  indexOutsideQuotes,
  isEmptyWord,
  isKeyText,
  isPlainValue,
  isQuote,
  itemsOf,
  keyForm,
  quote,
  unquote,
  valueToken,
}
export type { Chunk, Item }
