/**
 * Grouping (`view.grouping`, not with a tree), as typed arrays rather than
 * objects per group, so grouping 100,000 rows by a column with as many
 * values costs a few linear passes.
 *
 * `groupRows` gives every row a group at each level: rows with the same
 * value (strings as they are, numbers at the precision their column shows,
 * booleans, dates by the day shown in the column's time zone) share one,
 * nested by the grouping columns, numbered as they first appear. A
 * group's key is opaque and stable while the grouping and that value stay
 * (the locale does not change it).
 *
 * Grouping by a column with tens of thousands of distinct values (an id, a
 * name) makes as many group rows, and costs more than the grouping budget
 * of 150 ms for 100,000 rows (about 300 ms the first time on the machine
 * the perf tests note): group by columns of categories.
 *
 * `orderGroups` orders them: each level's groups by the grouping column's
 * sort order of their value (a text column's distinct texts directly, else
 * their first row's value) (the view's direction when it
 * sorts by that column, else ascending; no value last), within their parent
 * group; server mode keeps the order groups first appear in. The rows are
 * sorted by the sort passes once, then put into their groups in that order
 * with one counting sort, into one array where every group, at any level,
 * is a range (`start` to `end`).
 */
import type { EngineColumn } from "./columns"
import type { Core } from "./core"
import { dayFormat } from "./format"
import { hasRanks, sortRows, sortTexts, type SortPass } from "./sort"
import {
  isEmptyIn,
  toBoolean,
  toDay,
  toDayIn,
  toNumber,
  toTime,
} from "./values"

type Grouping<T> = {
  readonly columns: ReadonlyArray<EngineColumn<T>>
  /** The grouped rows (positions), in data order. */
  readonly rows: Uint32Array
  /** Per group: its level, parent group (-1 at the top), first row (position) and key. */
  readonly level: Uint8Array
  readonly parent: Int32Array
  readonly first: Uint32Array
  readonly keys: ReadonlyArray<string>
  /** Per group: the value it groups by (`groupValue`). */
  readonly values: ReadonlyArray<string>
  /** Each level's groups, as they first appear. */
  readonly levels: ReadonlyArray<Uint32Array>
  /** Each row's group at the last level, by position. */
  readonly leafOf: Int32Array
}

type OrderedGroups<T> = {
  readonly grouping: Grouping<T>
  /** Each level's groups in order, children after their siblings' order of parents. */
  readonly order: ReadonlyArray<Uint32Array>
  /** Per group: its index in its level's `order`. */
  readonly orderIndex: Uint32Array
  /** The rows, sorted and in their groups' order. */
  readonly rows: Uint32Array
  /** Per group: its range in `rows`. */
  readonly start: Uint32Array
  readonly end: Uint32Array
  /** Per group above the last level: its children's range in the next level's `order`. */
  readonly childStart: Uint32Array
  readonly childEnd: Uint32Array
}

const numberKeys = new WeakMap<object, Intl.NumberFormat>()

/**
 * A number as its column shows it, in a locale-free form (`en-US`, no
 * grouping): rows that show the same number ("1" for 1.2 and 1.4 at no
 * decimals) share a group, whatever the locale.
 */
function numberKey<T>(column: EngineColumn<T>, number: number) {
  let format = numberKeys.get(column)
  if (!format) {
    format = new Intl.NumberFormat("en-US", {
      ...column.format,
      useGrouping: false,
    })
    numberKeys.set(column, format)
  }
  return format.format(number)
}

/** `fn`, remembering its result for each time. */
function perTime(fn: (time: number) => string) {
  const known = new Map<number, string>()
  return (time: number) => {
    let key = known.get(time)
    if (key === undefined) {
      key = fn(time)
      known.set(time, key)
    }
    return key
  }
}

/** The parts of a day a date's group key is made of, in order. */
const KEY_PARTS = ["era", "year", "month", "day", "weekday"] as const

/** A weekday's number, Monday 1 to Sunday 7 (ISO 8601), from its `en-US` short name. */
const WEEKDAYS: Readonly<Record<string, string>> = {
  Mon: "1",
  Tue: "2",
  Wed: "3",
  Thu: "4",
  Fri: "5",
  Sat: "6",
  Sun: "7",
}

/**
 * A date column's group key of a time: the day its format shows (its
 * time left out, `dayFormat`) in its time zone (`format.timeZone`, else
 * the local one). `YYYY-MM-DD` for a format that shows the whole day (the
 * default); else the parts it shows, in order (`YYYY-MM` for a month and
 * year, a weekday by its number from Monday), so the rows of a group show
 * the same day, and keys sort as the calendar does.
 */
function dateKeyReader(
  options: EngineColumn<unknown>["format"]
): (time: number) => string {
  const day = dayFormat(options)
  const zone = day.timeZone
  if (isWholeDay(day))
    return perTime(zone ? (time) => toDayIn(time, zone) : toDay)
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    calendar: day.calendar,
    numberingSystem: "latn",
    era: day.era && "short",
    year: day.year && "numeric",
    month: day.month && "2-digit",
    day: day.day && "2-digit",
    weekday: day.weekday && "short",
  })
  return perTime((time) => {
    const parts = new Map(
      format.formatToParts(time).map((part) => [part.type, part.value])
    )
    const weekday = parts.get("weekday")
    if (weekday !== undefined)
      parts.set("weekday", WEEKDAYS[weekday] ?? weekday)
    return KEY_PARTS.flatMap((part) => parts.get(part) ?? []).join("-")
  })
}

/** Whether a date format shows the whole day: grouped by `YYYY-MM-DD`. */
function isWholeDay(day: Intl.DateTimeFormatOptions) {
  return (
    day.dateStyle !== undefined ||
    (day.year !== undefined && day.month !== undefined && day.day !== undefined)
  )
}

/**
 * The calendar order of a date column's groups (empty ones apart). Whole
 * days by time: a day's rows all fall within it, so any of them orders the
 * days, whatever their year (before 1000, or before the era). Days shown
 * in part by their keys' parts compared as numbers (an era's years
 * backwards before Christ), weekdays from the locale's first day of the
 * week (`firstDay`, 1 for Monday to 7 for Sunday).
 */
function dateGroupOrder<T>(
  column: EngineColumn<T>,
  grouping: Grouping<T>,
  items: ReadonlyArray<T>,
  firstDay: number
): (a: number, b: number) => number {
  const day = dayFormat(column.format)
  if (isWholeDay(day)) {
    const times = new Map<number, number>()
    const time = (group: number) => {
      let at = times.get(group)
      if (at === undefined) {
        at = toTime(column.getValue(items[grouping.first[group]])) ?? 0
        times.set(group, at)
      }
      return at
    }
    return (a, b) => time(a) - time(b)
  }
  const weekday = day.weekday !== undefined
  const era = day.era !== undefined
  const parts = new Map<number, Array<string>>()
  const partsOf = (group: number) => {
    let list = parts.get(group)
    if (!list) {
      list = grouping.values[group].split("-")
      parts.set(group, list)
    }
    return list
  }
  const place = (weekdayNumber: number) => (weekdayNumber - firstDay + 7) % 7
  return (a, b) => {
    const x = partsOf(a)
    const y = partsOf(b)
    const beforeChrist = era && x[0] === "BC" && y[0] === "BC"
    for (let i = 0; i < x.length; i++) {
      if (x[i] === y[i]) continue
      if (weekday && i === x.length - 1)
        return place(Number(x[i])) - place(Number(y[i]))
      const m = Number(x[i])
      const n = Number(y[i])
      if (Number.isFinite(m) && Number.isFinite(n))
        return beforeChrist && i === 1 ? n - m : m - n
      // Eras: before Christ first.
      return x[i] === "BC" ? -1 : y[i] === "BC" ? 1 : x[i] < y[i] ? -1 : 1
    }
    return 0
  }
}

/** An options column's option `""`, as a group's value (`""` is none). */
const BLANK_OPTION = "\u0000"

/**
 * How rows are grouped by `column`: each row's value as a string, numbers
 * at the precision shown, dates by the day shown (`dateKeyReader`), `""`
 * for none.
 */
function groupValueReader<T>(column: EngineColumn<T>): (item: T) => string {
  const dateKey =
    column.type === "date" ? dateKeyReader(column.format) : undefined
  return (item) => {
    const value = column.getValue(item)
    if (isEmptyIn(column, value)) return ""
    switch (column.type) {
      case "options":
        return value === "" ? BLANK_OPTION : String(value)
      case "date": {
        const time = toTime(value)
        return time === undefined || !dateKey ? "" : dateKey(time)
      }
      case "boolean":
        return String(toBoolean(value))
      case "number": {
        const number = toNumber(value)
        return number === undefined ? String(value) : numberKey(column, number)
      }
      default:
        return value instanceof Date ? value.toISOString() : String(value)
    }
  }
}

function groupRows<T>(
  core: Core<T>,
  rows: Uint32Array,
  columns: ReadonlyArray<EngineColumn<T>>
): Grouping<T> {
  const { items } = core
  const m = rows.length
  const level: Array<number> = []
  const parent: Array<number> = []
  const first: Array<number> = []
  const keys: Array<string> = []
  const groupValues: Array<string> = []
  const levels: Array<Uint32Array> = []
  // Each row's group at the level before, then at this one.
  let groupOf = new Int32Array(m).fill(-1)
  columns.forEach((column, depth) => {
    const groupValue = groupValueReader(column)
    const values = new Map<string, number>()
    const valueOf = new Uint32Array(m)
    const texts: Array<string> = []
    for (let j = 0; j < m; j++) {
      const text = groupValue(items[rows[j]])
      let slot = values.get(text)
      if (slot === undefined) {
        slot = texts.length
        values.set(text, slot)
        texts.push(text)
      }
      valueOf[j] = slot
    }
    const v = texts.length
    const groups = new Map<number, number>()
    // At the top a value is its group, numbered as the values are; below,
    // a group is a value within a parent.
    const top = depth === 0 ? new Int32Array(v).fill(-1) : undefined
    const next = new Int32Array(m)
    const created: Array<number> = []
    const prefix = `${encodeURIComponent(column.id)}=`
    for (let j = 0; j < m; j++) {
      const up = groupOf[j]
      const composite = (up + 1) * v + valueOf[j]
      let group = top ? top[valueOf[j]] : groups.get(composite)
      if (group === undefined || group === -1) {
        group = keys.length
        if (top) top[valueOf[j]] = group
        else groups.set(composite, group)
        created.push(group)
        level.push(depth)
        parent.push(up)
        first.push(rows[j])
        groupValues.push(texts[valueOf[j]])
        const value = encodeURIComponent(texts[valueOf[j]])
        keys.push(
          up === -1
            ? `group:${prefix}${value}`
            : `${keys[up]}/${prefix}${value}`
        )
      }
      next[j] = group
    }
    levels.push(Uint32Array.from(created))
    groupOf = next
  })
  const leafOf = new Int32Array(items.length).fill(-1)
  for (let j = 0; j < m; j++) leafOf[rows[j]] = groupOf[j]
  return {
    columns,
    rows,
    level: Uint8Array.from(level),
    parent: Int32Array.from(parent),
    first: Uint32Array.from(first),
    keys,
    values: groupValues,
    levels,
    leafOf,
  }
}

/** `list` stably ordered by `keyOf` (integers below `size`). */
function countingSort(
  list: Uint32Array,
  size: number,
  keyOf: (value: number) => number
) {
  const starts = new Uint32Array(size + 1)
  for (const value of list) starts[keyOf(value) + 1]++
  for (let k = 1; k <= size; k++) starts[k] += starts[k - 1]
  const out = new Uint32Array(list.length)
  for (const value of list) out[starts[keyOf(value)]++] = value
  return out
}

function orderGroups<T>(
  core: Core<T>,
  grouping: Grouping<T>,
  passes: ReadonlyArray<SortPass<T>>,
  server: boolean,
  /** The locale's first day of the week, 1 (Monday) to 7: weekday groups start there. */
  firstDay = 1
): OrderedGroups<T> {
  const { items } = core
  const count = grouping.keys.length
  const orderIndex = new Uint32Array(count)
  const order: Array<Uint32Array> = []
  const byFirst = new Int32Array(items.length)
  grouping.levels.forEach((groups, depth) => {
    let ordered = groups
    if (!server) {
      // The groups' first rows, sorted as the column sorts, order the
      // groups: by the column's ranks when they are prepared, else by
      // ranking those rows alone (a few, for most groupings), or for a text
      // column by sorting the groups' distinct texts.
      const column = grouping.columns[depth]
      const descending =
        passes.find((pass) => pass.column === column)?.descending ?? false
      const sort = [{ column, descending }]
      if (column.type === "date" && !column.compare) {
        // A date's groups in calendar order (`dateGroupOrder`): a format
        // without the year (months) by its place in the year, not by the
        // first row's date.
        const empty = groups.filter((group) => grouping.values[group] === "")
        const named = Array.from(groups)
          .filter((group) => grouping.values[group] !== "")
          .sort(dateGroupOrder(column, grouping, items, firstDay))
        if (descending) named.reverse()
        ordered = Uint32Array.from([...named, ...empty])
      } else if (
        column.type === "text" &&
        !column.compare &&
        !hasRanks(items, column)
      ) {
        // A text column's groups are its distinct texts: sort them alone.
        const empty = groups.filter((group) => grouping.values[group] === "")
        const named = groups.filter((group) => grouping.values[group] !== "")
        const order = sortTexts(
          Array.from(named, (group) => grouping.values[group])
        )
        if (descending) order.reverse()
        ordered = Uint32Array.from([
          ...Array.from(order, (i) => named[i]),
          ...empty,
        ])
      } else if (hasRanks(items, column)) {
        for (const group of groups) byFirst[grouping.first[group]] = group
        const firsts = groups.map((group) => grouping.first[group])
        ordered = sortRows(items, firsts, sort).map((row) => byFirst[row])
      } else {
        const firsts = Array.from(
          groups,
          (group) => items[grouping.first[group]]
        )
        const positions = new Uint32Array(groups.length)
        for (let i = 0; i < positions.length; i++) positions[i] = i
        ordered = sortRows(firsts, positions, sort).map((i) => groups[i])
      }
    }
    if (depth > 0) {
      const above = order[depth - 1].length
      ordered = countingSort(
        ordered,
        above,
        (group) => orderIndex[grouping.parent[group]]
      )
    }
    ordered.forEach((group, i) => {
      orderIndex[group] = i
    })
    order.push(ordered)
  })

  const leaves = order[order.length - 1]
  const sorted = server ? grouping.rows : sortRows(items, grouping.rows, passes)
  const rows = countingSort(
    sorted,
    leaves.length,
    (row) => orderIndex[grouping.leafOf[row]]
  )
  const start = new Uint32Array(count).fill(rows.length)
  const end = new Uint32Array(count)
  // Leaf groups' ranges from the rows; then each parent spans its children.
  for (let i = 0; i < rows.length; i++) {
    const group = grouping.leafOf[rows[i]]
    if (i < start[group]) start[group] = i
    end[group] = i + 1
  }
  const childStart = new Uint32Array(count)
  const childEnd = new Uint32Array(count)
  for (let depth = order.length - 1; depth > 0; depth--)
    order[depth].forEach((group, i) => {
      const up = grouping.parent[group]
      if (start[group] < start[up]) start[up] = start[group]
      if (end[group] > end[up]) end[up] = end[group]
      if (childEnd[up] === 0) childStart[up] = i
      childEnd[up] = i + 1
    })
  return {
    grouping,
    order,
    orderIndex,
    rows,
    start,
    end,
    childStart,
    childEnd,
  }
}

export { groupRows, orderGroups }
export type { Grouping, OrderedGroups }
