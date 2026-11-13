"use client"

/**
 * `DataTableSearch syntax="query"` once its query layer has loaded (`lazy.ts`,
 * the `query` feature; `search.tsx` renders the plain field until then):
 * the field is the view's filters and search written as a query
 * (`engine/query`). Typed terms set the same column filters the filter
 * buttons set, free words the search; a change from elsewhere (a filter
 * button, a chip, a controlled view) writes the query again from the view,
 * free words kept. A term with a problem (`OR`, `NOT`, `-`, an unknown
 * column or value, a backwards range) is not applied; it is underlined
 * after a pause in typing, its message on a tooltip and atop the list.
 *
 * - The text is drawn in the syntax colours by a mirror over the real input,
 *   whose own text is transparent (its caret and selection stay native).
 *   The mirror copies the input's font metrics and inline padding on every
 *   render, window resize and font load, so its letters stay over the
 *   input's at any breakpoint.
 * - The suggestions at the caret (`suggestQuery`): columns with their type,
 *   values with their rows, "No value", comparisons with the data's range,
 *   a date's presets with their days, years and months, and the date
 *   filter's calendar, which writes the days as text. ↑ ↓ move, Enter picks,
 *   Tab completes, Escape closes. The list is as wide as the field on every
 *   frame (its width copied from a ResizeObserver on the field).
 * - The field never changes size as it is focused or pressed: its buttons
 *   stay under the pointer.
 * - The help ("?") lists the table's filterable columns with examples.
 *
 * The suggestions count the rows through the engine's own index (client
 * mode); in server mode an options column's `count` is all there is, and
 * the view goes to the application as the plain search's does.
 */
import * as React from "react"
import { cn } from "cn"
import { CalendarIcon, CircleAlertIcon, SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@tecton/react/badge"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@tecton/react/combobox"
import {
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/input-group"
import { Kbd } from "@tecton/react/kbd"

import { CalendarLoading } from "../calendar-loading"
import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useNumberFormat,
} from "./context"
import { useDelayedCommit } from "./delayed-commit"
import { getColumnModel } from "./engine/columns"
import { sameFilters } from "./engine/view"
import {
  applyQuery,
  createQuerySource,
  getQueryLanguage,
  parseQuery,
  serializeQuery,
  suggestQuery,
  type ParsedQuery,
  type QueryFilterTerm,
  type QueryLanguage,
  type QuerySource,
  type QuerySuggestion,
} from "./engine/query/index"
import {
  dayOfDate,
  parseDateLiteral,
  partsOf,
  todayIn,
  type Day,
} from "./engine/query/dates"
import type { SearchParts } from "./engine/engine"
import { useFeature } from "./lazy"
import { QueryHelp } from "./query-help"
import {
  dayText,
  groupSuggestions,
  helpExamples,
  problemMessage,
  summaryOf,
  termAt,
  typeLabel,
  understood,
  valueItemAt,
  type SuggestionGroup,
  type SuggestionRow,
} from "./query-model"
import { MirrorText, type QueryProblem } from "./query-text"
import { useQueryTranslations } from "./query-translations"

/** How long typing pauses before the problem being typed shows. */
const TYPING_PAUSE = 650

/** What the plain field held when the query layer took its place. */
type QueryHandoff = {
  /** What was typed in it; `null` when nothing was. */
  readonly text: string | null
  readonly selectionStart: number | null
  readonly selectionEnd: number | null
  readonly focused: boolean
  /** "?" was pressed before the layer loaded: the help opens. */
  readonly help: boolean
}

type QuerySearchProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  label: string
  handoff: QueryHandoff
}

/** The query sources of the table's search parts, kept with them. */
const sources = new WeakMap<object, QuerySource>()

function sourceOf(parts: SearchParts<unknown>) {
  let source = sources.get(parts)
  if (!source) sources.set(parts, (source = createQuerySource(parts)))
  return source
}

/** The input's metrics the mirror must share for its glyphs to line up. */
const METRICS = [
  "font",
  "letterSpacing",
  "wordSpacing",
  "fontFeatureSettings",
  "fontVariationSettings",
  "fontKerning",
  "textTransform",
  "direction",
] as const

function QuerySearch({
  label,
  handoff,
  className,
  placeholder,
  onKeyDown,
  ...props
}: QuerySearchProps) {
  const t = useQueryTranslations()
  const td = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableSearch")
  const { actions } = context
  const columns = useDataTableSelector(context, (state) => state.columns)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  const filters = useDataTableSelector(context, (state) => state.view.filters)
  const search = useDataTableSelector(context, (state) => state.view.search)
  const delay = useDataTableSelector(
    context,
    (state) => state.options.searchDelay
  )
  const clears = useDataTableSelector(context, (state) => state.clears)
  const server = useDataTableSelector(
    context,
    (state) => state.options.dataMode === "server"
  )
  const rowModel = useDataTableSelector(context, (state) => state.model)
  const numbers = useNumberFormat()
  const model = getColumnModel(columns)
  const yes = td("yes")
  const no = td("no")
  const language = React.useMemo(
    () => getQueryLanguage(model, formatter.locale, { yes, no }),
    [model, formatter.locale, yes, no]
  )

  // The query the view reads as; the presets the field holds are kept.
  const previous = React.useRef<ParsedQuery | undefined>(undefined)
  const written = React.useMemo(
    () =>
      serializeQuery(
        language,
        { filters, search },
        { previous: previous.current }
      ),
    [language, filters, search]
  )
  const latest = React.useRef(language)
  latest.current = language
  const sameMeaning = React.useCallback((a: string, b: string) => {
    if (a === b) return true
    const x = parseQuery(latest.current, a)
    const y = parseQuery(latest.current, b)
    return x.search === y.search && sameFilters(x.filters, y.filters)
  }, [])
  const { draft, change, flush } = useDelayedCommit({
    value: written,
    commit: (text) => {
      const parsed = parseQuery(latest.current, text)
      return (
        actions.updateView(
          (view) => applyQuery(latest.current, view, parsed),
          (before, after) =>
            sameFilters(before.filters, after.filters) ? "search" : "filter"
        ) ||
        applyQuery(latest.current, actions.currentView(), parsed) ===
          actions.currentView()
      )
    },
    delay,
    clears,
    same: sameMeaning,
  })
  const parsed = React.useMemo(
    () => parseQuery(language, draft),
    [language, draft]
  )
  previous.current = parsed

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const mirrorRef = React.useRef<HTMLDivElement | null>(null)
  const helpPopup = React.useRef<HTMLDivElement | null>(null)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const pendingCaret = React.useRef<number | null>(null)
  const pendingSelection = React.useRef<{
    text: string
    start: number
    end: number
  } | null>(null)
  const highlighted = React.useRef<SuggestionRow | undefined>(undefined)
  // A press that is focusing the field, until its click (`onPointerDown`).
  const pressed = React.useRef(false)
  const [group, setGroup] = React.useState<HTMLElement | null>(null)
  const [popup, setPopup] = React.useState<HTMLElement | null>(null)
  const [caret, setCaret] = React.useState(draft.length)
  const [focused, setFocused] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [settled, setSettled] = React.useState(true)
  const [helpOpen, setHelpOpen] = React.useState(handoff.help)
  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  React.useEffect(() => () => clearTimeout(settleTimer.current), [])

  // The plain field's state, taken over once: its text is parsed (and
  // applied), and focus and the selection stay where they were.
  React.useLayoutEffect(() => {
    const input = inputRef.current
    const text = handoff.text ?? written
    if (text !== written) change(text)
    if (input && handoff.focused) {
      input.focus()
      // Placed once the input holds the text (the render `change` makes).
      pendingSelection.current = {
        text,
        start: handoff.selectionStart ?? text.length,
        end: handoff.selectionEnd ?? text.length,
      }
      setCaret(handoff.selectionStart ?? text.length)
      setFocused(true)
      setOpen(true)
    }
    // Once, on mount.
  }, [])

  /** The input's caret, as the selection has it. */
  const readCaret = React.useCallback(() => {
    const input = inputRef.current
    if (input) setCaret(input.selectionStart ?? input.value.length)
  }, [])

  // The mirror follows the input's horizontal scroll and its metrics, read
  // again on every render, window resize and font load (never once only:
  // the input's size changes at a breakpoint and with zoom, and a mirror
  // left at the old size would draw its letters away from the caret).
  const syncMirror = React.useCallback(() => {
    const input = inputRef.current
    const layer = mirrorRef.current
    if (!input || !layer) return
    const style = getComputedStyle(input)
    for (const name of METRICS)
      if (layer.style[name] !== style[name]) layer.style[name] = style[name]
    const clip = layer.parentElement
    if (clip) {
      // Clipped where the input clips its text: at its content box.
      clip.style.insetInlineStart = style.paddingInlineStart
      clip.style.insetInlineEnd = style.paddingInlineEnd
    }
    layer.style.transform = `translateX(${-input.scrollLeft}px)`
  }, [])
  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (input && pendingCaret.current !== null) {
      const at = pendingCaret.current
      pendingCaret.current = null
      input.focus()
      input.setSelectionRange(at, at)
    }
    const selection = pendingSelection.current
    if (input && selection && input.value === selection.text) {
      pendingSelection.current = null
      input.setSelectionRange(selection.start, selection.end)
    }
    syncMirror()
  })
  React.useEffect(() => {
    const input = inputRef.current
    // Not every environment has font loading events (a test's DOM).
    const fonts = (document as { fonts?: FontFaceSet }).fonts
    const onSelection = () => {
      if (input && document.activeElement === input) {
        readCaret()
        syncMirror()
      }
    }
    window.addEventListener("resize", syncMirror)
    fonts?.addEventListener("loadingdone", syncMirror)
    input?.addEventListener("scroll", syncMirror)
    document.addEventListener("selectionchange", onSelection)
    return () => {
      window.removeEventListener("resize", syncMirror)
      fonts?.removeEventListener("loadingdone", syncMirror)
      input?.removeEventListener("scroll", syncMirror)
      document.removeEventListener("selectionchange", onSelection)
    }
  }, [readCaret, syncMirror])

  // The list is as wide as the field on every frame: the positioner reads
  // its anchor a frame late, so the field's width is copied into the
  // popup from a ResizeObserver, which runs after layout and before paint.
  React.useLayoutEffect(() => {
    if (!group || !popup) return
    const follow = () =>
      popup.style.setProperty(
        "--field-width",
        `${group.getBoundingClientRect().width}px`
      )
    follow()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(follow)
    observer.observe(group)
    return () => observer.disconnect()
  }, [group, popup])

  const placeCaret = (at: number) => {
    pendingCaret.current = at
    setCaret(at)
  }

  const markTyping = () => {
    setSettled(false)
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => setSettled(true), TYPING_PAUSE)
  }

  // Values of the table's data for examples: the help's, and the terms a
  // problem's message offers.
  const sampleOf = React.useMemo(() => {
    const source = server ? undefined : sourceOf(rowModel.searchParts())
    const none = { filters: {}, search: "" }
    return (queryColumn: QueryLanguage["columns"][number]) => {
      if (!source) return {}
      if (queryColumn.type === "number" || queryColumn.type === "date") {
        const extent = source.extent(queryColumn.id, none)
        if (!extent) return {}
        if (queryColumn.type === "date")
          return {
            year: partsOf(
              dayOfDate(new Date(extent.max), queryColumn.timeZone).day
            ).year,
          }
        const middle = (extent.min + extent.max) / 2
        const step =
          10 ** Math.max(0, Math.floor(Math.log10(Math.abs(middle) || 1)))
        return { number: Math.round(middle / step) * step }
      }
      if (queryColumn.type === "text") {
        const top = [...source.facets(queryColumn.id, none).counts]
          .sort((a, b) => b[1] - a[1])
          .at(0)
        return top ? { text: top[0] } : {}
      }
      return {}
    }
  }, [server, rowModel])

  // Problems in words, and those to show: not the one being typed until
  // typing pauses.
  const problems = React.useMemo(
    () =>
      parsed.diagnostics.map((diagnostic): QueryProblem => ({
        start: diagnostic.start,
        end: diagnostic.end,
        message: problemMessage(diagnostic, language, model, t, sampleOf),
      })),
    [parsed, language, model, t, sampleOf]
  )
  const shown = (problem: QueryProblem) =>
    !focused || settled || caret < problem.start || caret > problem.end
  const visible = problems.filter(shown)
  const term = termAt(parsed, caret)
  const termProblem = term
    ? visible.find(
        (problem) => problem.start < term.end && problem.end > term.start
      )
    : undefined
  const filterTerm = term?.kind === "filter" ? term : undefined
  const column = filterTerm?.column
    ? language.byId.get(filterTerm.column)
    : undefined

  // The date value at the caret: the calendar, in range or single-day mode.
  const dateItem =
    filterTerm && column?.type === "date" && caret > filterTerm.key.end
      ? valueItemAt(draft, filterTerm, caret)
      : undefined
  const dateOperator = dateItem
    ? (/^\s*(>=|<=|≥|≤|>|<|=)/.exec(
        draft.slice(dateItem.start, dateItem.end)
      )?.[1] ?? "")
    : ""
  const calendarMode: "range" | "single" | null = !dateItem
    ? null
    : dateOperator && dateOperator !== "="
      ? "single"
      : "range"
  // The day a comparison names (`>2015-06-30`: June 30), for its calendar.
  const comparedDay = (() => {
    if (calendarMode !== "single" || !dateItem) return undefined
    const literal = draft
      .slice(dateItem.start, dateItem.end)
      .replace(/^\s*(>=|<=|≥|≤|>|<|=)/, "")
    if (!literal.trim()) return undefined
    const read = parseDateLiteral(
      literal,
      language.dates,
      todayIn(new Date(), column?.timeZone)
    )
    return "kind" in read && read.kind === "days" ? read.first : undefined
  })()
  const dateFeature = useFeature("dateInput", calendarMode !== null)
  const loadDates = dateFeature.load
  React.useEffect(() => {
    if (calendarMode !== null) loadDates()
  }, [calendarMode, loadDates])

  const popupWanted = open && focused
  const suggestions = React.useMemo(() => {
    if (!popupWanted) return null
    const options = {
      source: server ? undefined : sourceOf(rowModel.searchParts()),
    }
    const here = suggestQuery(language, parsed, caret, options)
    // Right after a term that is complete (`td:>3000|`), there is nothing
    // to offer for it: offer the next term instead, as after a space, so a
    // field clicked at its end never shows an empty list (or none at all).
    const atTermEnd =
      caret > 0 &&
      !/\s/.test(draft[caret - 1]) &&
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
  }, [popupWanted, language, parsed, caret, server, rowModel, draft])
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
        : [],
    [suggestions, language, formatter, calendarMode, t, td]
  )
  const rowCount = groups.reduce((sum, g) => sum + g.items.length, 0)
  const hint =
    !termProblem && filterTerm
      ? understood(filterTerm, language, model, formatter, td)
      : null
  const popupOpen = popupWanted && (rowCount > 0 || termProblem !== undefined)
  const typed = suggestions
    ? draft.slice(suggestions.start, Math.max(suggestions.start, caret)).trim()
    : ""
  const autoHighlight =
    typed !== "" &&
    (suggestions?.context === "column" || suggestions?.context === "value")

  const replace = (from: number, to: number, text: string, at: number) => {
    const next = draft.slice(0, from) + text + draft.slice(to)
    change(next)
    placeCaret(from + at)
    setSettled(true)
    highlighted.current = undefined
  }

  const focusCalendar = () => {
    requestAnimationFrame(() => {
      const root = calendarRef.current
      const day =
        root?.querySelector<HTMLButtonElement>(
          "[data-selected-single=true], [data-range-start=true]"
        ) ??
        root?.querySelector<HTMLButtonElement>("td button[tabindex='0']") ??
        root?.querySelector<HTMLButtonElement>("td button")
      day?.focus()
    })
  }

  const apply = (row: SuggestionRow) => {
    if (row.kind === "calendar") return focusCalendar()
    if (!suggestions) return
    const { suggestion } = row
    replace(
      suggestions.start,
      suggestions.end,
      suggestion.text,
      suggestion.caret
    )
    // An offer that completes its term ends with a space: the list closes.
    setOpen(!suggestion.text.endsWith(" "))
  }

  /** Days picked on the calendar, written as the query writes them. */
  const pickDays = (value: string) => {
    if (!dateItem || !filterTerm) return
    const segment = draft.slice(dateItem.start, dateItem.end)
    const lead = /^\s*/.exec(segment)?.[0].length ?? 0
    const text = `${dateOperator}${value}`
    const atEnd = dateItem.end === filterTerm.end
    const space = atEnd && !/\s/.test(draft[filterTerm.end] ?? "") ? " " : ""
    replace(
      dateItem.start + lead,
      dateItem.end,
      text + space,
      text.length + (atEnd ? 1 : 0)
    )
    setOpen(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const insertExample = (example: string) => {
    const base = draft.trimEnd()
    const next = base ? `${base} ${example} ` : `${example} `
    change(next)
    placeCaret(next.length)
    setSettled(true)
    setOpen(false)
  }

  const clear = () => {
    change("")
    placeCaret(0)
    setOpen(true)
  }

  // Focus within the field, its help or its list is still the field's.
  const inPopup = (element: Element | null | undefined) =>
    Boolean(
      element &&
      (popup?.contains(element) || helpPopup.current?.contains(element))
    )
  const leave = () => {
    setFocused(false)
    setOpen(false)
    setSettled(true)
    flush()
  }

  const describedBy = React.useId()
  const summary = React.useMemo(
    () =>
      summaryOf(
        parsed,
        problems.map((problem) => problem.message),
        model,
        formatter,
        t,
        td
      ),
    [parsed, problems, model, formatter, t, td]
  )

  const examples = React.useMemo(
    () =>
      helpOpen
        ? helpExamples(language, sampleOf, t).map((example) => ({
            parsed: parseQuery(language, example.query),
            finds: example.finds,
          }))
        : [],
    [helpOpen, language, sampleOf, t]
  )

  return (
    <div
      data-slot="data-table-search"
      data-syntax="query"
      className={cn("w-full sm:w-[28rem]", className)}
    >
      <span id={describedBy} hidden>
        {summary}
      </span>
      <Combobox<SuggestionRow>
        items={groups}
        filteredItems={groups}
        filter={null}
        value={null}
        onValueChange={(row) => {
          if (row) apply(row)
        }}
        inputValue={draft}
        onInputValueChange={(value, details) => {
          if (details.reason !== "input-change") return
          change(value)
          markTyping()
          setOpen(true)
          readCaret()
          requestAnimationFrame(readCaret)
        }}
        open={popupOpen}
        onOpenChange={(next, details) => {
          if (!next && details.reason === "item-press") return
          if (!next && details.reason === "focus-out") {
            const target = (details.event as FocusEvent | undefined)
              ?.relatedTarget as Element | null
            if (inPopup(target) || inPopup(document.activeElement)) return
          }
          setOpen(next)
        }}
        autoHighlight={autoHighlight}
        onItemHighlighted={(row) => {
          highlighted.current = row
        }}
        itemToStringLabel={(row) => row.label}
      >
        <ComboboxInput
          showTrigger={false}
          className="w-full"
          ref={inputRef}
          aria-label={label}
          aria-describedby={describedBy}
          placeholder={placeholder ?? td("searchOrFilter")}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="search"
          {...props}
          render={(inputProps: React.ComponentProps<"input">) => (
            <div
              className="relative flex min-w-0 flex-1 self-stretch"
              ref={(element) =>
                setGroup(
                  element?.closest<HTMLElement>("[data-slot=input-group]") ??
                    null
                )
              }
            >
              <InputGroupInput
                {...inputProps}
                className={cn(
                  inputProps.className,
                  "h-full w-full ps-1.5 pe-1.5 text-transparent caret-foreground selection:bg-blue-160 selection:text-transparent"
                )}
              />
              <div
                aria-hidden
                data-slot="data-table-query-mirror-clip"
                className="pointer-events-none absolute inset-y-0 overflow-hidden"
              >
                <div
                  ref={mirrorRef}
                  data-slot="data-table-query-mirror"
                  className="absolute inset-y-0 start-0 flex items-center whitespace-pre"
                >
                  <MirrorText
                    parsed={parsed}
                    problems={visible}
                    openProblem={
                      focused && settled && !popupOpen && termProblem
                        ? termProblem
                        : null
                    }
                    onPlaceCaret={(at) => {
                      placeCaret(at)
                      setOpen(true)
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          onPointerDown={(event: React.PointerEvent<HTMLInputElement>) => {
            // Focus from a press comes before the press places the caret:
            // the list opens on the click, for where the caret ends up, so it
            // never opens for one place and closes for another.
            if (
              event.button === 0 &&
              document.activeElement !== event.currentTarget
            )
              pressed.current = true
          }}
          onFocus={() => {
            setFocused(true)
            if (!pressed.current) setOpen(true)
            readCaret()
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            if (inPopup(event.relatedTarget)) return
            leave()
          }}
          onClick={() => {
            pressed.current = false
            readCaret()
            setOpen(true)
          }}
          onKeyDown={(
            event: React.KeyboardEvent<HTMLInputElement> & {
              preventBaseUIHandler?: () => void
            }
          ) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) return
            const rows = groups.flatMap((g) => g.items)
            const first = rows.find((row) => row.kind !== "calendar")
            const current = highlighted.current
            if (event.key === "Tab" && !event.shiftKey && popupOpen) {
              const target =
                current?.kind === "calendar" ? first : (current ?? first)
              if (!target) return
              event.preventDefault()
              event.preventBaseUIHandler?.()
              apply(target)
            } else if (event.key === "Enter") {
              event.preventDefault()
              event.preventBaseUIHandler?.()
              if (popupOpen && current) apply(current)
              else {
                setOpen(false)
                setSettled(true)
                flush()
              }
            } else if (event.key === "Escape") {
              if (popupOpen) {
                event.preventDefault()
                event.stopPropagation()
                event.preventBaseUIHandler?.()
                setOpen(false)
              } else if (draft !== "") {
                event.preventDefault()
                event.stopPropagation()
                event.preventBaseUIHandler?.()
                clear()
                setOpen(false)
              }
            } else if (event.key === "ArrowDown" && !popupOpen) setOpen(true)
          }}
        >
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {draft !== "" && (
              <InputGroupButton
                size="icon-xs"
                aria-label={td("clearSearch")}
                data-slot="data-table-query-clear"
                // The press leaves focus, and the caret, in the field.
                onMouseDown={(event) => event.preventDefault()}
                onClick={clear}
              >
                <XIcon aria-hidden />
              </InputGroupButton>
            )}
            <QueryHelp
              open={helpOpen}
              onOpenChange={(next, details) => {
                setHelpOpen(next)
                if (!next && details.reason === "escape-key" && focused)
                  requestAnimationFrame(() => inputRef.current?.focus())
              }}
              examples={examples}
              keys={language.columns.flatMap((c) =>
                c.key ? [`${c.key}:`] : []
              )}
              onExample={(query) => {
                insertExample(query)
                setHelpOpen(false)
              }}
              // Back to the text when the help was opened from the field in
              // use; to the "?" button otherwise.
              finalFocus={() => (focused ? inputRef.current : true)}
              popupRef={helpPopup}
              t={t}
              title={td("searchSyntax")}
            />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent
          ref={setPopup}
          anchor={group}
          sideOffset={6}
          data-slot="data-table-query-suggestions"
          // `transition-none`: the list's width follows the field's on
          // every frame, never eased behind it.
          className="@container/popup flex w-(--field-width,var(--anchor-width)) min-w-[min(22rem,var(--available-width))] flex-col transition-none"
        >
          {termProblem && (
            <div
              data-slot="data-table-query-problem-banner"
              className="flex items-start gap-2 border-b bg-destructive/8 px-3 py-2 text-xs text-foreground"
            >
              <CircleAlertIcon
                aria-hidden
                className="mt-px size-3.5 shrink-0 text-destructive"
              />
              <span>{termProblem.message}</span>
            </div>
          )}
          {hint && (
            <div
              data-slot="data-table-query-understood"
              className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground"
            >
              <CalendarIcon aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{hint}</span>
            </div>
          )}
          <div
            className={cn(
              "flex min-h-0 flex-col",
              calendarMode && "overflow-y-auto",
              calendarMode &&
                rowCount > 1 &&
                "@[34rem]/popup:flex-row @[34rem]/popup:overflow-visible"
            )}
          >
            <ComboboxList
              className={cn(
                "max-h-[min(22rem,calc(var(--available-height)-5rem))]",
                calendarMode &&
                  "max-h-40 min-w-0 shrink-0 @[34rem]/popup:max-h-[min(22rem,calc(var(--available-height)-5rem))] @[34rem]/popup:flex-1"
              )}
            >
              {(g: SuggestionGroup) => (
                <ComboboxGroup
                  key={g.value}
                  items={g.items as Array<SuggestionRow>}
                  className="not-first:mt-1 not-first:border-t not-first:pt-1"
                >
                  {g.label && (
                    <ComboboxLabel className="flex items-baseline justify-between gap-3">
                      <span>{g.label}</span>
                      {g.hint && (
                        <span className="truncate text-muted-foreground/80">
                          {g.hint}
                        </span>
                      )}
                    </ComboboxLabel>
                  )}
                  <ComboboxCollection>
                    {(row: SuggestionRow) => (
                      <ComboboxItem
                        key={row.id}
                        value={row}
                        className="min-h-8 pe-2"
                      >
                        <SuggestionView
                          row={row}
                          language={language}
                          format={numbers}
                          t={t}
                        />
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
            {calendarMode && filterTerm && (
              <div
                className={cn(
                  "border-t",
                  rowCount > 1 &&
                    "@[34rem]/popup:border-s @[34rem]/popup:border-t-0"
                )}
              >
                <QueryCalendar
                  rootRef={calendarRef}
                  module={dateFeature.module}
                  mode={calendarMode}
                  operator={dateOperator}
                  day={comparedDay}
                  term={filterTerm}
                  timeZone={column?.timeZone}
                  t={t}
                  onPick={pickDays}
                  onEscape={() => placeCaret(caret)}
                  onLeave={(next) => {
                    if (next === inputRef.current || inPopup(next)) return
                    leave()
                  }}
                />
              </div>
            )}
          </div>
          <div
            data-slot="data-table-query-keys"
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1 border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground",
              calendarMode && "@max-[34rem]/popup:hidden"
            )}
          >
            <KeyHint keys={["↑", "↓"]}>{t("keyMove")}</KeyHint>
            <KeyHint keys={["↵"]}>{t("keySelect")}</KeyHint>
            <KeyHint keys={["Tab"]}>{t("keyComplete")}</KeyHint>
            <KeyHint keys={["Esc"]}>{t("keyClose")}</KeyHint>
          </div>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function KeyHint({
  keys,
  children,
}: {
  keys: ReadonlyArray<string>
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
      {children}
    </span>
  )
}

/** A suggestion's row: its key or value, what it is, and its rows. */
function SuggestionView({
  row,
  language,
  format,
  t,
}: {
  row: SuggestionRow
  language: QueryLanguage
  format: Intl.NumberFormat
  t: ReturnType<typeof useQueryTranslations>
}) {
  if (row.kind === "calendar")
    return (
      <>
        <CalendarIcon aria-hidden className="text-muted-foreground" />
        <span className="min-w-0 truncate">{row.label}</span>
      </>
    )
  const s: QuerySuggestion = row.suggestion
  const count =
    "count" in s && s.count !== undefined ? (
      <span className="ms-auto shrink-0 ps-3 text-xs text-muted-foreground tabular-nums">
        {format.format(s.count)}
      </span>
    ) : null
  const column = language.byId.get(s.column)
  const code = (text: string, tone = "text-blue-830") => (
    <code
      className={cn("w-22 shrink-0 truncate font-mono text-[0.8125rem]", tone)}
    >
      {text}
    </code>
  )
  switch (s.kind) {
    case "column":
      return (
        <>
          {code(`${s.key}:`)}
          <span className="min-w-0 truncate">{row.label}</span>
          <span className="ms-auto shrink-0 ps-3 text-xs text-muted-foreground">
            {typeLabel(s.type, t)}
          </span>
        </>
      )
    case "value": {
      const option =
        column?.type === "options"
          ? column.column.options.find((o) => o.value === s.value)
          : undefined
      return (
        <>
          {s.text.includes(":") && code(`${column?.key ?? ""}:`)}
          {option?.variant ? (
            <Badge variant={option.variant} appearance="outline">
              {row.label}
            </Badge>
          ) : (
            <span className="min-w-0 truncate">{row.label}</span>
          )}
          {count}
        </>
      )
    }
    case "empty":
      return (
        <>
          {code("none", "text-saffron-830")}
          <span className="min-w-0 truncate text-muted-foreground">
            {row.label}
          </span>
          {count}
        </>
      )
    case "comparison":
      return (
        <>
          {code(s.operator, "text-orchid-830")}
          <span className="min-w-0 truncate">{row.label}</span>
        </>
      )
    case "preset":
    case "year":
    case "month": {
      const days =
        s.kind === "year"
          ? null
          : new Intl.DateTimeFormat(format.resolvedOptions().locale, {
              dateStyle: "medium",
              timeZone: "UTC",
            }).formatRange(
              Date.UTC(...ymd(s.from, column?.timeZone)),
              Date.UTC(...ymd(s.to, column?.timeZone))
            )
      return (
        <>
          {code(
            s.kind === "preset" ? s.preset : s.text.trim(),
            // A narrow list keeps a preset's name and days; its code is
            // in the field once picked.
            s.kind === "preset"
              ? "text-green-830 @max-[26rem]/popup:hidden"
              : "text-foreground"
          )}
          {s.kind !== "year" && <span className="shrink-0">{row.label}</span>}
          {days && s.kind === "preset" && (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {days}
            </span>
          )}
          {count}
        </>
      )
    }
  }
}

/** A day's year, month and day in `timeZone`, for `Date.UTC`. */
function ymd(
  date: Date,
  timeZone: string | undefined
): [number, number, number] {
  const p = partsOf(dayOfDate(date, timeZone).day)
  return [p.year, p.month, p.day]
}

type DateModule = NonNullable<
  ReturnType<typeof useFeature<"dateInput">>["module"]
>

/**
 * The calendar of the suggestions, for a date value: the date filter's own
 * (`DateRangePicker`'s), in range mode for a bare or `..` value and single
 * day mode after `<` `>` `<=` `>=`, showing the term's days. A pick writes
 * them as the query writes days. Pointer presses keep focus in the field;
 * from the keyboard, the calendar's row in the list moves focus to a day,
 * and Escape gives it back.
 */
function QueryCalendar({
  module,
  mode,
  operator,
  day,
  term,
  timeZone,
  rootRef,
  onPick,
  onEscape,
  onLeave,
  t,
}: {
  module: DateModule | undefined
  mode: "range" | "single"
  operator: string
  /** The day a comparison names. */
  day: Day | undefined
  term: QueryFilterTerm
  timeZone: string | undefined
  rootRef: React.Ref<HTMLDivElement>
  onPick: (text: string) => void
  onEscape: () => void
  onLeave: (next: Element | null) => void
  t: ReturnType<typeof useQueryTranslations>
}) {
  const value = term.value?.type === "date" ? term.value : undefined
  const local = (date: Date | undefined) => {
    if (!date) return undefined
    const [year, month, day] = ymd(date, timeZone)
    return new Date(year, month, day)
  }
  const caption =
    mode === "range"
      ? t("calendarRange")
      : operator === "<"
        ? t("calendarBefore")
        : operator === ">"
          ? t("calendarAfter")
          : operator === "<=" || operator === "≤"
            ? t("calendarOnOrBefore")
            : t("calendarOnOrAfter")
  const single = (() => {
    if (day === undefined) return undefined
    const p = partsOf(day)
    return new Date(p.year, p.month, p.day)
  })()
  return (
    <div
      ref={rootRef}
      data-slot="data-table-query-calendar"
      className="flex shrink-0 flex-col items-center"
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("button"))
          event.preventDefault()
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          onEscape()
        }
      }}
      onBlur={(event) => {
        const next = event.relatedTarget
        if (!event.currentTarget.contains(next)) onLeave(next)
      }}
    >
      <p className="w-full px-3 pt-2 text-xs text-muted-foreground">
        {caption}
      </p>
      {!module ? (
        <CalendarLoading spinner />
      ) : mode === "single" ? (
        <module.SingleCalendar
          key={single?.getTime() ?? "none"}
          value={single}
          onPick={(day) => onPick(dayText(day))}
          captionLayout="label"
          className="bg-transparent p-2"
        />
      ) : (
        <module.RangeCalendar
          key={`${value?.from?.getTime()}-${value?.to?.getTime()}`}
          value={
            value ? { from: local(value.from), to: local(value.to) } : undefined
          }
          numberOfMonths={1}
          className="bg-transparent p-2"
          onPick={(range) => {
            const from = dayText(range.from)
            const to = dayText(range.to)
            onPick(from === to ? from : `${from}..${to}`)
          }}
        />
      )}
    </div>
  )
}

export { QuerySearch }
export type { QueryHandoff, QuerySearchProps }
