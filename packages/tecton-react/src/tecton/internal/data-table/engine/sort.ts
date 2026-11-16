/**
 * Sorting large sets of rows without a comparator.
 *
 * A comparator sort calls its comparator about 2 · n · log n times: 3.4
 * million value reads and comparisons for 100,000 rows. Here each column's
 * values are read once and turned into integer ranks (equal values share
 * one), kept per data and column (`getRanks`), so sorting is packing
 * `rank · m + position` into a `Float64Array` and one native typed-array
 * sort per sort column: the other direction, or the same column again
 * after another, costs only that.
 *
 * - Text ranks in natural order ("A-2" before "A-10", digits before
 *   letters), ignoring case and accents (`foldText`: "Ärzte" with the A's,
 *   "Émile" with the E's), ties broken by the text itself, so the order is
 *   stable whatever the data's. Orders a language has apart from that (å
 *   after z in Swedish, ch after h in Czech) are not followed.
 * - Numbers, dates (as timestamps), booleans (false first) and options (by
 *   their order) rank by value.
 * - Rows without a value (`null`, `undefined`, `""`, invalid numbers and
 *   dates) go last in either direction; equal rows keep their order.
 * - A column with `compare` is sorted with it, a stable comparator sort,
 *   for its own pass; its rows without a value are kept out of it and go
 *   last.
 * - Several sort columns are stable passes from the last to the first, so
 *   the first decides.
 *
 * Ranking runs in steps (`rankingSteps`): `getRanks` runs them all at once,
 * `rankingTask` one at a time, for the idle worker, which prepares ranks
 * before a column is first sorted.
 */
import type { EngineColumn } from "./columns"
import { foldText } from "./format"
import type { IdleTask } from "./idle"
import { isEmptyValue } from "./values"

/** A column as integer ranks by row: equal values share one, `none` is no value. */
type Ranks = { readonly ranks: Uint32Array; readonly none: number }

type SortPass<T> = {
  column: EngineColumn<T>
  descending: boolean
}

/** Rows per ranking step. */
const STEP = 4096

/**
 * A text key whose plain string order is natural, case- and accent-blind
 * order: folded, and each run of digits as a marker before every letter
 * (numbers sort before text, as with `Intl.Collator`'s `numeric`), its
 * length without leading zeros, then the digits. The marker and length are
 * Latin-1 characters, so Latin text keeps V8's one-byte strings, which
 * compare much faster. Lengths are capped at 190 digits: longer runs
 * compare as if that long. Text that needs neither folding nor digit runs
 * is only lowercased.
 */
function naturalKey(text: string) {
  let digits = false
  let ascii = true
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code > 127) ascii = false
    else if (code >= 48 && code <= 57) digits = true
  }
  const lower = ascii ? text.toLowerCase() : foldText(text)
  // Folding turns Arabic digits into ASCII ones.
  if (!digits && (ascii || !/[0-9]/.test(lower))) return lower
  let key = ""
  let copied = 0
  for (let i = 0; i < lower.length; i++) {
    if (!isDigit(lower.charCodeAt(i))) continue
    let end = i + 1
    while (end < lower.length && isDigit(lower.charCodeAt(end))) end++
    let start = i
    while (start < end - 1 && lower.charCodeAt(start) === 48) start++
    key +=
      lower.slice(copied, i) +
      "\u0001" +
      String.fromCharCode(0x41 + Math.min(end - start, 190)) +
      lower.slice(start, end)
    copied = end
    i = end - 1
  }
  return copied ? key + lower.slice(copied) : lower
}

function isDigit(code: number) {
  return code >= 48 && code <= 57
}

/**
 * The indices of distinct `texts` in natural, case- and accent-blind order
 * (see `naturalKey`), texts with the same key in their own order. Sorting
 * the keys with their index appended (after a NUL, so a key sorts before
 * the keys it is a prefix of; in one-byte characters, base 255) gives each
 * its place without a map.
 */
function* orderTexts(
  texts: ReadonlyArray<string>
): Generator<void, Uint32Array> {
  const d = texts.length
  let width = 1
  for (let size = 255; size < d; size *= 255) width++
  const keys = new Array<string>(d)
  const tagged = new Array<string>(d)
  for (let slot = 0; slot < d; slot++) {
    if (slot % STEP === STEP - 1) yield
    const key = naturalKey(texts[slot])
    keys[slot] = key
    let tag = "\u0000"
    for (let digit = 0, rest = slot; digit < width; digit++) {
      tag += String.fromCharCode(1 + (rest % 255))
      rest = Math.floor(rest / 255)
    }
    tagged[slot] = key + tag
  }
  yield
  tagged.sort()
  yield
  const order = new Uint32Array(d)
  for (let r = 0; r < d; r++) {
    const key = tagged[r]
    let slot = 0
    for (let digit = width - 1; digit >= 0; digit--)
      slot = slot * 255 + key.charCodeAt(key.length - width + digit) - 1
    order[r] = slot
  }
  // Texts with the same key ("A1", "a1") go by the text itself.
  for (let start = 0; start < d;) {
    let end = start + 1
    while (end < d && keys[order[end]] === keys[order[start]]) end++
    if (end - start > 1)
      order
        .subarray(start, end)
        .sort((a, b) =>
          texts[a] < texts[b] ? -1 : texts[a] > texts[b] ? 1 : 0
        )
    start = end
  }
  return order
}

/** `orderTexts`, all at once. */
function sortTexts(texts: ReadonlyArray<string>): Uint32Array {
  const steps = orderTexts(texts)
  let step = steps.next()
  while (!step.done) step = steps.next()
  return step.value
}

function* rankText<T>(
  items: ReadonlyArray<T>,
  column: EngineColumn<T>
): Generator<void, Ranks> {
  const n = items.length
  // Each distinct text gets a slot as it is first seen.
  const slots = new Map<string, number>()
  const distinct: Array<string> = []
  const slotOf = new Int32Array(n)
  for (let i = 0; i < n; i++) {
    if (i % STEP === STEP - 1) yield
    const value = column.sortValue(items[i])
    if (value === undefined) {
      slotOf[i] = -1
      continue
    }
    const text = typeof value === "string" ? value : String(value)
    let slot = slots.get(text)
    if (slot === undefined) {
      slot = distinct.length
      slots.set(text, slot)
      distinct.push(text)
    }
    slotOf[i] = slot
  }
  const d = distinct.length
  const order = yield* orderTexts(distinct)
  const rankOfSlot = new Uint32Array(d)
  for (let r = 0; r < d; r++) rankOfSlot[order[r]] = r
  const ranks = new Uint32Array(n)
  for (let i = 0; i < n; i++) {
    if (i % STEP === STEP - 1) yield
    const slot = slotOf[i]
    ranks[i] = slot === -1 ? d : rankOfSlot[slot]
  }
  return { ranks, none: d }
}

function* rankNumbers<T>(
  items: ReadonlyArray<T>,
  column: EngineColumn<T>
): Generator<void, Ranks> {
  const n = items.length
  const numbers = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    if (i % STEP === STEP - 1) yield
    const value = column.sortValue(items[i])
    numbers[i] = typeof value === "number" ? value : NaN
  }
  yield
  // Native sort puts NaN last; the distinct values before it, in order,
  // are the ranks, and a binary search finds each value's.
  const sorted = numbers.slice().sort()
  yield
  let none = 0
  for (let i = 0; i < n; i++) {
    const value = sorted[i]
    if (Number.isNaN(value)) break
    if (none === 0 || value !== sorted[none - 1]) sorted[none++] = value
  }
  const ranks = new Uint32Array(n)
  for (let i = 0; i < n; i++) {
    if (i % STEP === STEP - 1) yield
    const value = numbers[i]
    if (Number.isNaN(value)) {
      ranks[i] = none
      continue
    }
    let low = 0
    let high = none - 1
    while (low < high) {
      const middle = (low + high) >>> 1
      if (sorted[middle] < value) low = middle + 1
      else high = middle
    }
    ranks[i] = low
  }
  return { ranks, none }
}

/** The steps of ranking `column` over `items`. */
function rankingSteps<T>(items: ReadonlyArray<T>, column: EngineColumn<T>) {
  return column.type === "text"
    ? rankText(items, column)
    : rankNumbers(items, column)
}

// Per data (the engine's flat item list) and column: the column's ranks,
// and the ranking under way in idle time. Both are weak, so columns made
// anew are let go with the old ones.
const done = new WeakMap<object, WeakMap<object, Ranks>>()
const running = new WeakMap<object, WeakMap<object, Generator<void, Ranks>>>()

function entry<TValue>(
  cache: WeakMap<object, WeakMap<object, TValue>>,
  items: object
) {
  let columns = cache.get(items)
  if (!columns) cache.set(items, (columns = new WeakMap()))
  return columns
}

/** `column`'s ranks over `items` (by position), worked out once per data and column. */
function getRanks<T>(items: ReadonlyArray<T>, column: EngineColumn<T>): Ranks {
  const ranks = done.get(items)?.get(column)
  if (ranks) return ranks
  const steps = running.get(items)?.get(column) ?? rankingSteps(items, column)
  let step = steps.next()
  while (!step.done) step = steps.next()
  entry(done, items).set(column, step.value)
  running.get(items)?.delete(column)
  return step.value
}

/** Whether `column`'s ranks over `items` are worked out already. */
function hasRanks<T>(items: ReadonlyArray<T>, column: EngineColumn<T>) {
  return done.get(items)?.has(column) === true
}

/** Ranking `column` over `items` as an idle task, a step at a time. */
function rankingTask<T>(
  items: ReadonlyArray<T>,
  column: EngineColumn<T>
): IdleTask {
  return {
    done: () => hasRanks(items, column),
    step() {
      const steps = entry(running, items)
      let ranking = steps.get(column)
      if (!ranking) steps.set(column, (ranking = rankingSteps(items, column)))
      const step = ranking.next()
      if (step.done) {
        entry(done, items).set(column, step.value)
        steps.delete(column)
      }
    },
  }
}

/**
 * `rows` (positions in `items`) in the order of `passes`: one stable pass
 * per sort column, from the last to the first. Returns `rows` itself when
 * there is nothing to sort.
 */
function sortRows<T>(
  items: ReadonlyArray<T>,
  rows: Uint32Array,
  passes: ReadonlyArray<SortPass<T>>
): Uint32Array {
  const m = rows.length
  if (m < 2 || !passes.length) return rows
  let order = rows
  const packed = new Float64Array(m)
  for (let c = passes.length - 1; c >= 0; c--) {
    const { column, descending } = passes[c]
    const next = new Uint32Array(m)
    const { compare } = column
    if (compare) {
      const sign = descending ? -1 : 1
      const present: Array<number> = []
      const empty: Array<number> = []
      for (const row of order)
        (isEmptyValue(column.getValue(items[row])) ? empty : present).push(row)
      present.sort((a, b) => compare(items[a], items[b]) * sign)
      next.set(present)
      next.set(empty, present.length)
    } else {
      const { ranks, none } = getRanks(items, column)
      for (let p = 0; p < m; p++) {
        const rank = ranks[order[p]]
        const key = rank === none ? none : descending ? none - 1 - rank : rank
        packed[p] = key * m + p
      }
      packed.sort()
      for (let p = 0; p < m; p++) next[p] = order[packed[p] % m]
    }
    order = next
  }
  return order
}

export { getRanks, hasRanks, naturalKey, rankingTask, sortRows, sortTexts }
export type { Ranks, SortPass }
