"use client"

/**
 * The query field's list, as hooks of `QuerySearch` (`query-search.tsx`) in
 * the same chunk: the rows the suggestions count (`useQuerySource`) and the
 * data's values for examples (`useSamples`), the date item at the caret
 * and its calendar (`useDateItem`), the suggestions in their groups
 * (`useSuggestions`), and the keys the field takes (`useQueryKeys`).
 */
import * as React from "react"

import type { Translator } from "../i18n/translations"
import type { SearchParts } from "./engine/engine"
import type { Formatter } from "./engine/format"
import {
  createQuerySource,
  parseQuery,
  readDateItem,
  suggestQuery,
  type ParsedQuery,
  type QueryColumn,
  type QueryLanguage,
  type QuerySource,
  type QuerySuggestions,
  type QueryTerm,
} from "./engine/query/index"
import { dayOfDate, partsOf } from "./engine/query/dates"
import { DATE_INPUT } from "./date-input"
import { useFeature } from "./lazy"
import {
  groupSuggestions,
  type ColumnSample,
  type SuggestionGroup,
  type SuggestionRow,
} from "./query-model"

const NO_GROUPS: Array<SuggestionGroup> = []

/**
 * The query sources of the tables' search indexes, kept with them: a
 * source and its caches live as long as the rows and the formatter (the
 * index's) and the hidden columns (the engine keeps their list while it
 * holds the same ids) they were made for, not one engine run, whose
 * search parts are new on every keystroke.
 */
const sources = new WeakMap<
  object,
  { hidden: ReadonlyArray<string>; source: QuerySource }
>()

function sourceOf(parts: SearchParts<unknown>) {
  let kept = sources.get(parts.index)
  if (kept?.hidden !== parts.hidden)
    sources.set(
      parts.index,
      (kept = { hidden: parts.hidden, source: createQuerySource(parts) })
    )
  return kept.source
}

/**
 * The rows the suggestions count, through the engine's own index (client
 * mode); `undefined` in server mode, where an options column's `count` is
 * all there is.
 */
function useQuerySource(
  server: boolean,
  model: { searchParts: () => SearchParts<unknown> }
) {
  return server ? undefined : sourceOf(model.searchParts())
}

/**
 * Values of the table's data for examples, the help's and the terms a
 * problem's message offers: a number column's middle, a date column's
 * latest year, a text column's most frequent text.
 */
function useSamples(source: QuerySource | undefined): ColumnSample {
  return React.useMemo(() => {
    const none = { filters: {}, search: "" }
    return (column: QueryColumn) => {
      if (!source) return {}
      if (column.type === "number" || column.type === "date") {
        const extent = source.extent(column.id, none)
        if (!extent) return {}
        if (column.type === "date")
          return {
            year: partsOf(dayOfDate(new Date(extent.max), column.timeZone).day)
              .year,
          }
        const middle = (extent.min + extent.max) / 2
        const step =
          10 ** Math.max(0, Math.floor(Math.log10(Math.abs(middle) || 1)))
        return { number: Math.round(middle / step) * step }
      }
      if (column.type === "text") {
        const top = [...source.facets(column.id, none).counts]
          .sort((a, b) => b[1] - a[1])
          .at(0)
        return top ? { text: top[0] } : {}
      }
      return {}
    }
  }, [source])
}

/**
 * The date item at the caret (`readDateItem`) and the calendar it shows:
 * in range mode for a bare or `..` value, single day mode after a
 * comparison. The calendar's module loads once one shows.
 */
function useDateItem(
  language: QueryLanguage,
  parsed: ParsedQuery,
  caret: number
) {
  const date = React.useMemo(
    () => readDateItem(language, parsed, caret),
    [language, parsed, caret]
  )
  const calendarMode: "range" | "single" | null = !date
    ? null
    : date.operator && date.operator !== "="
      ? "single"
      : "range"
  const { module, load } = useFeature(DATE_INPUT, calendarMode !== null)
  React.useEffect(() => {
    if (calendarMode !== null) load()
  }, [calendarMode, load])
  return { date, calendarMode, module }
}

/**
 * The suggestions at the caret while the list is open (`suggestQuery`), in
 * their groups, with the calendar's row for a date value.
 *
 * - Right after a term that is complete (`td:>3000|`), there is nothing to
 *   offer for it: the next term's offers instead, as after a space, so a
 *   field clicked at its end never shows an empty list. Not after free
 *   text, still being typed, or a term that filters nothing (an unknown
 *   column or value): their line says what they search for, or that there
 *   is nothing to suggest. Nor in a list still being written
 *   (`well:a-12,`): its next item is the column's.
 * - `completing`: something to complete at the caret, typed text or a
 *   filter term's missing value (`status:`). Otherwise (after a space,
 *   after a complete term) Enter applies the query and Tab moves on,
 *   unless the user moved to a row (`navigated`).
 * - The list keeps its highlighted index as its rows change, so a row
 *   highlighted as the user typed would stay highlighted in the next list
 *   (the next term's, once a pick completes a term), and Enter would pick
 *   it. With nothing to complete and no row moved to, the highlight goes:
 *   one render with no rows (`items`, in the same frame, never painted)
 *   drops it. It lives here, with the rows, as it needs `completing`.
 */
function useSuggestions(
  open: boolean,
  language: QueryLanguage,
  parsed: ParsedQuery,
  caret: number,
  /** The term at the caret. */
  term: QueryTerm | undefined,
  source: QuerySource | undefined,
  calendarMode: "range" | "single" | null,
  formatter: Formatter<unknown>,
  t: Translator<"dataTableQuery">,
  td: Translator<"dataTable">
) {
  const draft = parsed.text
  const suggestions = React.useMemo((): QuerySuggestions | null => {
    if (!open) return null
    const options = { source }
    const here = suggestQuery(language, parsed, caret, options)
    const atTermEnd =
      term?.kind === "filter" &&
      term.value !== undefined &&
      caret > 0 &&
      !/[\s,]/.test(draft[caret - 1]) &&
      (caret === draft.length || /\s/.test(draft[caret]))
    if (here.items.length > 0 || !atTermEnd) return here
    const spaced = `${draft.slice(0, caret)} ${draft.slice(caret)}`
    const next = suggestQuery(
      language,
      parseQuery(language, spaced),
      caret + 1,
      options
    )
    if (next.items.length === 0) return here
    // Written at the caret, after the space this adds.
    return {
      ...next,
      start: caret,
      end: caret,
      items: next.items.map((item) => ({
        ...item,
        text: ` ${item.text}`,
        caret: item.caret + 1,
      })),
    }
  }, [open, language, parsed, caret, source, draft, term])
  const groups = React.useMemo(
    () =>
      suggestions
        ? groupSuggestions(
            suggestions,
            language,
            formatter,
            calendarMode,
            t,
            td
          )
        : NO_GROUPS,
    [suggestions, language, formatter, calendarMode, t, td]
  )
  const rowCount = groups.reduce((sum, g) => sum + g.items.length, 0)
  const typed = suggestions
    ? draft.slice(suggestions.start, Math.max(suggestions.start, caret)).trim()
    : ""
  const autoHighlight =
    typed !== "" &&
    (suggestions?.context === "column" || suggestions?.context === "value")
  const filterTerm = term?.kind === "filter" ? term : undefined
  const completing =
    typed !== "" ||
    (filterTerm?.incomplete === true && caret > filterTerm.key.end)

  const highlighted = React.useRef<SuggestionRow | undefined>(undefined)
  // The highlighted row is one the user moved to (with ↑ ↓ or the pointer).
  const navigated = React.useRef(false)
  const [unhighlight, setUnhighlight] = React.useState(false)
  React.useLayoutEffect(() => {
    if (unhighlight) setUnhighlight(false)
    else if (
      open &&
      !completing &&
      !navigated.current &&
      highlighted.current !== undefined
    )
      setUnhighlight(true)
  })
  return {
    suggestions,
    groups,
    /** The groups the list shows: none for the render that drops the highlight. */
    items: unhighlight ? NO_GROUPS : groups,
    rowCount,
    autoHighlight,
    completing,
    /** The row highlighted, and whether the user moved to it. */
    highlighted,
    navigated,
  }
}

/**
 * The keys the field takes, before the list's own: Tab completes what is
 * typed (a column's key, a value) or the row moved to, and with nothing to
 * complete moves focus on (the list, open the whole time, never keeps Tab
 * in the field); Enter picks a row moved to, else applies the query now,
 * the list staying; Escape closes the list, then clears the field; ↓ opens
 * the list again.
 */
function useQueryKeys(
  open: boolean,
  /** The field holds nothing. */
  empty: boolean,
  /** What `useSuggestions` gives. */
  {
    groups,
    completing,
    highlighted,
    navigated,
  }: Pick<
    ReturnType<typeof useSuggestions>,
    "groups" | "completing" | "highlighted" | "navigated"
  >,
  apply: (row: SuggestionRow) => void,
  /** Enter with no row moved to: the query applies now. */
  applyNow: () => void,
  setOpen: (open: boolean) => void,
  clear: () => void
) {
  return (
    event: React.KeyboardEvent<HTMLInputElement> & {
      preventBaseUIHandler?: () => void
    }
  ) => {
    const own = () => {
      event.preventDefault()
      event.preventBaseUIHandler?.()
    }
    const first = groups
      .flatMap((g) => g.items)
      .find((row) => row.kind !== "calendar")
    const current = highlighted.current
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      open &&
      (completing || (navigated.current && current?.kind !== "calendar"))
    ) {
      const target = current?.kind === "calendar" ? first : (current ?? first)
      if (!target) return
      own()
      apply(target)
    } else if (event.key === "Enter") {
      own()
      if (open && current) apply(current)
      else applyNow()
    } else if (event.key === "Escape") {
      if (!open && empty) return
      own()
      event.stopPropagation()
      if (!open) clear()
      setOpen(false)
    } else if (event.key === "ArrowDown" && !open) setOpen(true)
  }
}

export { useDateItem, useQueryKeys, useQuerySource, useSamples, useSuggestions }
