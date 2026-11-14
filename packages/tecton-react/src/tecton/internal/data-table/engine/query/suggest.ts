/**
 * `suggestQuery`: what to offer where the caret is in a query, and the
 * stretch of the query an offer replaces.
 *
 * - Between terms, or at a key: the columns, those whose key or header
 *   begins with what is typed first (a mistyped key's closest one first).
 * - In a free word: the columns it begins, and (from two letters) the
 *   values of options and text columns that contain it, each as a whole
 *   term (`operator:` → `operator:equinor`).
 * - In a value, for the item of its list the caret is in (after a comma,
 *   the next one), the column's values with their numbers of rows over the
 *   rest of the query (its filters and search, the column's own left out,
 *   as the filter popover counts), those the other items list left out: an
 *   options column's options, yes and no, a text column's values that
 *   contain what is typed (the most frequent ones while nothing is), and
 *   "No value" while rows have none and no other item is.
 *   A number column's comparisons (`=`, `>`, `>=`, `<`, `<=`, `..`), a date
 *   column's (`<` before, `>` after, `..`), with the data's smallest and
 *   largest value; a date column's presets (and `last<N>` as d / w / m / y as it is
 *   typed), the years of the data (newest first) and, from `2015` or
 *   `2015-`, that year's months, or a month's name the months of that name,
 *   each with the days it stands for and its rows.
 *
 * Nothing is offered for a term a minus or `NOT` leaves out.
 *
 * Counts come from a query source (`source.ts`); without one (server mode)
 * the options' own `count` is all there is. Every offer's `text` replaces
 * `start`–`end`, then the caret goes `caret` characters into it; an offer
 * that completes its term is followed by a space.
 */
import { foldText } from "../format"
import type { DataTableColumnType, DataTableFilterValue } from "../types"
import {
  dayOfDate,
  formatDay,
  monthsStartingWith,
  partsOf,
  PRESETS,
  RELATIVE,
  resolvePreset,
  startOf,
  toDay,
  todayIn,
} from "./dates"
import type { QueryColumn, QueryLanguage } from "./language"
import { valueItems } from "./parse"
import type { QuerySource } from "./source"
import { isEmptyWord, keyForm, unquote, valueToken, type Item } from "./syntax"
import type {
  ParsedQuery,
  QueryFilterTerm,
  QueryTextTerm,
  QueryView,
} from "./types"

type Offer = {
  /** Replaces the suggestions' `start`–`end`. */
  readonly text: string
  /** Where the caret goes in `text` once it is in. */
  readonly caret: number
}

/** A run of days, as a date filter holds it (`to` is its last day's start). */
type DayRange = { readonly from: Date; readonly to: Date }

type QuerySuggestion = Offer &
  (
    | {
        readonly kind: "column"
        readonly column: string
        readonly key: string
        readonly type: DataTableColumnType
      }
    | {
        readonly kind: "value"
        readonly column: string
        /** An option's value, `true` / `false`, or a text column's display text. */
        readonly value: string | boolean
        readonly count?: number
      }
    | {
        readonly kind: "empty"
        readonly column: string
        readonly count?: number
      }
    | {
        readonly kind: "comparison"
        readonly column: string
        readonly operator: "=" | ">" | ">=" | "<" | "<=" | ".."
        /** The rest's smallest and largest number (a date's time). */
        readonly min?: number
        readonly max?: number
      }
    | ({
        readonly kind: "preset"
        readonly column: string
        /** `last30d` */
        readonly preset: string
        readonly count?: number
      } & DayRange)
    | ({
        readonly kind: "year"
        readonly column: string
        readonly year: number
        readonly count?: number
      } & DayRange)
    | ({
        readonly kind: "month"
        readonly column: string
        readonly year: number
        /** From 0. */
        readonly month: number
        readonly count?: number
      } & DayRange)
  )

type QuerySuggestions = {
  /** What the caret is in: a key (or between terms), a free word, a column's value. */
  readonly context: "column" | "word" | "value" | "none"
  /** The column of a value. */
  readonly column?: string
  readonly start: number
  readonly end: number
  /** In the order to show them. */
  readonly items: ReadonlyArray<QuerySuggestion>
}

type SuggestOptions = {
  /** The rows to count (client mode); without it, no counts but the options' own. */
  source?: QuerySource
  /** The moment relative dates are from; now by default. */
  now?: Date
  /** The most values offered (12 by default). */
  limit?: number
}

const NONE: QuerySuggestions = { context: "none", start: 0, end: 0, items: [] }

/** Columns in a free word, values across columns, years. */
const WORD_COLUMNS = 4
const WORD_VALUES = 6
const YEARS = 6

/** Every folded word of `text` (a header, a label). */
const wordsOf = (text: string) => foldText(text).split(/[^\p{L}\p{N}]+/u)

/** How well `text` fits what is typed: 0 begins, 1 a word begins, 2 contains; -1 not. */
function fit(text: string, typed: string) {
  if (!typed) return 0
  const folded = foldText(text)
  if (folded.startsWith(typed)) return 0
  if (wordsOf(text).some((word) => word.startsWith(typed))) return 1
  return folded.includes(typed) ? 2 : -1
}

function omit(filters: QueryView["filters"], id: string): QueryView["filters"] {
  if (!(id in filters)) return filters
  const rest: Record<string, DataTableFilterValue> = { ...filters }
  delete rest[id]
  return rest
}

function suggestQuery(
  language: QueryLanguage,
  parsed: ParsedQuery,
  caret: number,
  { source, now = new Date(), limit = 12 }: SuggestOptions = {}
): QuerySuggestions {
  const { text } = parsed
  /** `value` as the end of its term: a space after it. */
  const completing = (value: string, end: number): Offer => {
    if (end < text.length && /\s/.test(text[end]))
      return { text: value, caret: value.length + 1 }
    return { text: `${value} `, caret: value.length + 1 }
  }
  const open = (value: string, caret = value.length): Offer => ({
    text: value,
    caret,
  })

  const columns = (
    typed: string,
    first?: QueryColumn
  ): Array<QuerySuggestion> => {
    const form = keyForm(typed)
    const folded = foldText(typed)
    return language.columns
      .flatMap((column) => {
        if (column.key === null) return []
        let score: number
        if (column === first) score = -1
        else if (!form || column.key.startsWith(form)) score = 0
        else if (wordsOf(column.header).some((word) => word.startsWith(folded)))
          score = 1
        else if (column.key.includes(form)) score = 2
        else return []
        return [{ column, score }]
      })
      .sort((a, b) => a.score - b.score)
      .map(({ column }) => ({
        kind: "column" as const,
        column: column.id,
        key: column.key ?? "",
        type: column.type,
        ...open(`${column.key}:`),
      }))
  }

  const term = parsed.terms.find((t) => caret >= t.start && caret <= t.end)
  // The term before the caret's (or before the caret).
  const before = parsed.terms
    .filter((t) => t.end < (term?.start ?? caret))
    .at(-1)
  // Nothing for a term a minus or NOT leaves out: it is not applied.
  if (
    term?.kind === "keyword" ||
    (term && text[term.start] === "-") ||
    (before?.kind === "keyword" && before.keyword === "NOT")
  )
    return NONE
  if (!term)
    return { context: "column", start: caret, end: caret, items: columns("") }

  if (term.kind === "text") return word(term)
  const filter = term
  if (caret <= filter.key.end || !filter.column) {
    const typed = text.slice(filter.key.start, Math.min(caret, filter.key.end))
    const first = filter.column
      ? undefined
      : language.closestKey(filter.key.text)
    return {
      context: "column",
      start: filter.key.start,
      end: filter.key.end + 1,
      items: columns(filter.column ? typed : "", first),
    }
  }
  const column = language.byId.get(filter.column)
  if (!column) return NONE
  const rest: QueryView = {
    filters: omit(parsed.filters, column.id),
    search: parsed.search,
  }
  switch (column.type) {
    case "options":
    case "boolean":
      return listValue(filter, column, rest)
    case "text":
      return textValue(filter, column, rest)
    case "number":
    case "date":
      return orderedValue(filter, column, rest)
  }

  function word(term: QueryTextTerm): QuerySuggestions {
    if (term.quoted) return NONE
    const typed = text.slice(term.start, caret)
    const items: Array<QuerySuggestion> = columns(typed).slice(
      0,
      typed ? WORD_COLUMNS : undefined
    )
    const folded = foldText(typed)
    if (folded.length >= 2) {
      // The search without this word.
      const search = parsed.terms
        .filter(
          (other): other is QueryTextTerm =>
            other.kind === "text" && other.applied && other !== term
        )
        .map((other) => other.text)
        .join(" ")
      const others: QueryView = { filters: parsed.filters, search }
      const found: Array<{
        item: QuerySuggestion
        prefix: boolean
        count: number
      }> = []
      for (const column of language.columns) {
        if (column.key === null) continue
        const whole = (
          value: string,
          token: string,
          count: number | undefined,
          prefix: boolean
        ) =>
          found.push({
            prefix,
            count: count ?? 0,
            item: {
              kind: "value",
              column: column.id,
              value,
              ...(count === undefined ? {} : { count }),
              ...completing(`${column.key}:${token}`, term.end),
            },
          })
        if (column.type === "options") {
          const matching = column.column.options.filter(
            (option) =>
              fit(option.label, folded) >= 0 || fit(option.value, folded) === 0
          )
          if (!matching.length) continue
          const facets = source?.facets(column.id, others)
          for (const option of matching)
            whole(
              option.value,
              language.valueToken(column, option.value),
              facets ? (facets.counts.get(option.value) ?? 0) : option.count,
              fit(option.label, folded) === 0
            )
        } else if (column.type === "text" && source)
          for (const match of source.textMatches(column.id, others, typed, 3))
            whole(match.text, valueToken(match.text), match.count, match.prefix)
      }
      found
        .filter((entry) => entry.count > 0 || !source)
        .sort(
          (a, b) => Number(b.prefix) - Number(a.prefix) || b.count - a.count
        )
        .slice(0, WORD_VALUES)
        .forEach((entry) => items.push(entry.item))
    }
    return { context: "word", start: term.start, end: term.end, items }
  }

  /** The "No value" offer, when rows lack one or it is being typed. */
  function emptyOffer(
    column: QueryColumn,
    typed: string,
    count: number | undefined,
    end: number,
    complete: boolean
  ): Array<QuerySuggestion> {
    const typing =
      typed !== "" && ("none".startsWith(typed) || "empty".startsWith(typed))
    if (typed !== "" && !typing) return []
    if (!typing && count === 0) return []
    return [
      {
        kind: "empty",
        column: column.id,
        ...(count === undefined ? {} : { count }),
        ...(complete ? completing("none", end) : open("none")),
      },
    ]
  }

  function currentItem(filter: QueryFilterTerm, column: QueryColumn) {
    const items = valueItems(
      language,
      column,
      text,
      filter.valueStart,
      filter.end,
      now
    )
    const item =
      items.find((one) => caret >= one.start && caret <= one.end) ??
      items[items.length - 1]
    return { items, item }
  }

  function listValue(
    filter: QueryFilterTerm,
    column: QueryColumn,
    rest: QueryView
  ): QuerySuggestions {
    const { items, item } = currentItem(filter, column)
    const typed = foldText(unquote(text.slice(item.start, caret)).trim())
    const complete = item.end === filter.end
    const listed = new Set(
      items
        .filter((other) => other !== item)
        .map((other) => unquote(text.slice(other.start, other.end)).trim())
        .flatMap((value) => {
          if (column.type === "boolean") {
            const wanted = language.boolean(value)
            return wanted === undefined ? [] : [String(wanted)]
          }
          return language.option(column, value)?.value ?? []
        })
    )
    const facets = source?.facets(column.id, rest)
    const candidates: Array<{
      value: string | boolean
      key: string
      names: Array<string>
      count: number | undefined
    }> =
      column.type === "boolean"
        ? [true, false].map((value) => ({
            value,
            key: String(value),
            names: [
              value ? language.labels.yes : language.labels.no,
              value ? "yes" : "no",
              String(value),
            ],
            count: facets?.counts.get(String(value)),
          }))
        : column.column.options.map((option) => ({
            value: option.value,
            key: option.value,
            names: [option.label, option.value],
            count: facets
              ? (facets.counts.get(option.value) ?? 0)
              : option.count,
          }))
    const values = candidates
      .flatMap((candidate, order) => {
        if (listed.has(candidate.key)) return []
        const scores = candidate.names
          .map((name) => fit(name, typed))
          .filter((score) => score >= 0)
        if (!scores.length) return []
        return [{ candidate, score: Math.min(...scores), order }]
      })
      .sort((a, b) => a.score - b.score || a.order - b.order)
      .slice(0, limit)
      .map(({ candidate }): QuerySuggestion => {
        const token = language.valueToken(column, candidate.value)
        return {
          kind: "value",
          column: column.id,
          value: candidate.value,
          ...(candidate.count === undefined ? {} : { count: candidate.count }),
          ...(complete ? completing(token, filter.end) : open(token)),
        }
      })
    return {
      context: "value",
      column: column.id,
      start: item.start,
      end: item.end,
      items: [
        ...values,
        ...(listsEmpty(items, item)
          ? []
          : emptyOffer(column, typed, facets?.empty, filter.end, complete)),
      ],
    }
  }

  /** Whether an item of the list but `item` is "No value". */
  function listsEmpty(items: ReadonlyArray<Item>, item: Item) {
    return items.some(
      (other) =>
        other !== item && isEmptyWord(text.slice(other.start, other.end))
    )
  }

  function textValue(
    filter: QueryFilterTerm,
    column: QueryColumn,
    rest: QueryView
  ): QuerySuggestions {
    const { items, item } = currentItem(filter, column)
    const typed = unquote(text.slice(item.start, Math.max(item.start, caret)))
    const folded = foldText(typed.trim())
    const complete = item.end === filter.end
    // The texts listed in the other items, not offered again.
    const listed = new Set(
      items
        .filter((other) => other !== item)
        .map((other) => foldText(unquote(text.slice(other.start, other.end))))
    )
    const facets = source?.facets(column.id, rest)
    let values: Array<{ text: string; count: number }> = []
    if (source && folded)
      values = source.textMatches(
        column.id,
        rest,
        typed.trim(),
        limit + listed.size
      )
    else if (facets)
      values = [...facets.counts]
        .sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], language.locale)
        )
        .map(([value, count]) => ({ text: value, count }))
    values = values
      .filter((value) => !listed.has(foldText(value.text)))
      .slice(0, limit)
    return {
      context: "value",
      column: column.id,
      start: item.start,
      end: item.end,
      items: [
        ...values.map((value): QuerySuggestion => {
          const token = valueToken(value.text)
          return {
            kind: "value",
            column: column.id,
            value: value.text,
            count: value.count,
            ...(complete ? completing(token, filter.end) : open(token)),
          }
        }),
        ...(listsEmpty(items, item)
          ? []
          : emptyOffer(column, folded, facets?.empty, filter.end, complete)),
      ],
    }
  }

  function orderedValue(
    filter: QueryFilterTerm,
    column: QueryColumn,
    rest: QueryView
  ): QuerySuggestions {
    const { items, item } = currentItem(filter, column)
    const segment = text.slice(item.start, item.end)
    const lead = /^\s*/.exec(segment)?.[0].length ?? 0
    const operator = /^(>=|<=|≥|≤|>|<|=)/.exec(segment.slice(lead))?.[1] ?? ""
    let start = item.start + lead + operator.length
    let end = item.end
    const dots = text.indexOf("..", start)
    const ranged = dots !== -1 && dots < item.end
    if (ranged) {
      if (caret > dots) start = dots + 2
      else end = dots
    }
    const typed = foldText(text.slice(start, Math.max(start, caret)).trim())
    const complete = end === filter.end
    const offer = (value: string) =>
      complete ? completing(value, filter.end) : open(value)
    // Each item is a value or a range of its own: an empty one is offered
    // the comparisons, after a comma too.
    const bare = !operator && !ranged
    const out: Array<QuerySuggestion> = []
    if (bare && typed === "") {
      const extent = source?.extent(column.id, rest) ?? undefined
      const operators =
        column.type === "number"
          ? (["=", ">", ">=", "<", "<=", ".."] as const)
          : (["<", ">", ".."] as const)
      for (const op of operators)
        out.push({
          kind: "comparison",
          column: column.id,
          operator: op,
          ...(extent ? { min: extent.min, max: extent.max } : {}),
          ...open(op, op === ".." ? 0 : op.length),
        })
    }
    if (column.type === "date")
      out.unshift(...dateValues(column, rest, typed, offer))
    if (bare && !listsEmpty(items, item))
      out.push(
        ...emptyOffer(
          column,
          typed,
          source?.missing(column.id, rest),
          filter.end,
          complete
        )
      )
    return {
      context: "value",
      column: column.id,
      start,
      end,
      items: out.slice(0, limit + 4),
    }
  }

  function dateValues(
    column: QueryColumn,
    rest: QueryView,
    typed: string,
    offer: (value: string) => Offer
  ): Array<QuerySuggestion> {
    const zone = column.timeZone
    const today = todayIn(now, zone)
    const range = (first: number, last: number) => ({
      from: startOf(first, zone),
      to: startOf(last, zone),
      end: startOf(last + 1, zone).getTime(),
    })
    // The rest's rows by month, over the years the data spans.
    let months: { first: number; counts: Uint32Array } | null | undefined
    const byMonth = () => {
      if (months !== undefined) return months
      const extent = source?.extent(column.id, rest)
      if (!source || !extent) return (months = null)
      const first = dayOfDate(new Date(extent.min), zone).day
      const last = dayOfDate(new Date(extent.max), zone).day
      const firstYear = partsOf(first).year
      const lastYear = partsOf(last).year
      const bounds: Array<number> = []
      for (let year = firstYear; year <= lastYear + 1; year++)
        for (let month = 0; month < (year > lastYear ? 1 : 12); month++)
          bounds.push(startOf(toDay(year, month, 1), zone).getTime())
      return (months = {
        first: firstYear,
        counts: source.histogram(column.id, rest, bounds),
      })
    }
    const monthCount = (year: number, month: number) => {
      const data = byMonth()
      if (!data) return undefined
      return data.counts[(year - data.first) * 12 + month] ?? 0
    }
    const yearCount = (year: number) => {
      const data = byMonth()
      if (!data) return undefined
      let count = 0
      for (let month = 0; month < 12; month++)
        count += data.counts[(year - data.first) * 12 + month] ?? 0
      return count
    }
    const years = () => {
      const data = byMonth()
      if (!data) return []
      const found: Array<number> = []
      for (
        let year = data.first + data.counts.length / 12 - 1;
        year >= data.first;
        year--
      )
        if (yearCount(year)) found.push(year)
      return found
    }
    const countIn = (r: { from: Date; end: number }) =>
      source
        ? source.histogram(column.id, rest, [r.from.getTime(), r.end])[0]
        : undefined
    const out: Array<QuerySuggestion> = []
    const preset = (name: string) => {
      const days = resolvePreset(name, today)
      if (!days) return
      const r = range(days.first, days.last)
      const count = countIn(r)
      out.push({
        kind: "preset",
        column: column.id,
        preset: name,
        from: r.from,
        to: r.to,
        ...(count === undefined ? {} : { count }),
        ...offer(name),
      })
    }
    const year = (y: number) => {
      const r = range(toDay(y, 0, 1), toDay(y, 11, 31))
      const count = yearCount(y)
      out.push({
        kind: "year",
        column: column.id,
        year: y,
        from: r.from,
        to: r.to,
        ...(count === undefined ? {} : { count }),
        ...offer(String(y)),
      })
    }
    const month = (y: number, m: number) => {
      const count = monthCount(y, m)
      if (count === 0) return
      const r = range(toDay(y, m, 1), toDay(y, m + 1, 0))
      out.push({
        kind: "month",
        column: column.id,
        year: y,
        month: m,
        from: r.from,
        to: r.to,
        ...(count === undefined ? {} : { count }),
        ...offer(formatDay(toDay(y, m, 1), "month")),
      })
    }

    const relative = /^last(\d{1,4})$/.exec(typed)
    const written = RELATIVE.test(typed)
    const yearMonth = /^(\d{4})(?:-(\d{0,2}))?$/.exec(typed)
    if (typed === "") {
      PRESETS.forEach(preset)
      years().slice(0, YEARS).forEach(year)
    } else if (relative) {
      for (const unit of ["d", "w", "m", "y"])
        preset(`last${relative[1]}${unit}`)
    } else if (written) {
      preset(typed)
    } else if (/^\d{1,3}$/.test(typed)) {
      years()
        .filter((y) => String(y).startsWith(typed))
        .slice(0, YEARS)
        .forEach(year)
    } else if (yearMonth) {
      const y = Number(yearMonth[1])
      const typedMonth = yearMonth.at(2)
      if (typedMonth === undefined) year(y)
      for (let m = 0; m < 12; m++)
        if (
          !typedMonth ||
          String(m + 1).startsWith(typedMonth) ||
          String(m + 1)
            .padStart(2, "0")
            .startsWith(typedMonth)
        )
          month(y, m)
    } else if (/^\p{L}/u.test(typed)) {
      for (const name of PRESETS) if (name.startsWith(typed)) preset(name)
      const named = monthsStartingWith(typed.replace(/\./g, ""), language.dates)
      if (named.length)
        for (const y of years().slice(0, YEARS))
          for (const m of named) month(y, m)
    }
    return out
  }
}

export { suggestQuery }
export type { DayRange, QuerySuggestion, QuerySuggestions, SuggestOptions }
