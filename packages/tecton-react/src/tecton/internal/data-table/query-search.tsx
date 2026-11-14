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
 *   input's at any breakpoint (`useMirror`).
 * - The suggestions at the caret (`suggestQuery`): columns with their type,
 *   values with their rows, "No value", comparisons with the data's range,
 *   a date's presets with their days, years and months, and the date
 *   filter's calendar, which writes the days as text. ↑ ↓ move, Enter picks,
 *   Tab completes what is typed. The list is as wide as the field on every
 *   frame (its width copied from a ResizeObserver on the field).
 * - The list is open the whole time the field has focus, whatever is typed,
 *   picked or pressed in the field (its buttons, its underlined problems);
 *   with no suggestion to offer, it shows one line about the term at the
 *   caret (`statusOf`, or its problem), announced politely. It closes, with
 *   no animation while focus stays, when focus leaves the field and its
 *   popups, when Escape dismisses it (until the user types, clicks in the
 *   field or presses ↓), and while the help takes its place.
 * - The field never changes size as it is focused or pressed: its buttons
 *   stay under the pointer.
 * - The help ("?") lists the table's filterable columns with examples.
 *
 * Its state is in hooks of their own, in the same chunk: the field's
 * (`query-field.ts`), the list's (`query-list.ts`), and the list's parts
 * (`query-suggestions.tsx`). The suggestions count the rows through the
 * engine's own index (client mode); in server mode an options column's
 * `count` is all there is, and the view goes to the application as the
 * plain search's does.
 */
import * as React from "react"
import { cn } from "cn"
import { CalendarIcon, CircleAlertIcon, SearchIcon, XIcon } from "lucide-react"

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
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

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useNumberFormat,
} from "./context"
import { getColumnModel } from "./engine/columns"
import {
  getQueryLanguage,
  parseQuery,
  type ParsedQuery,
} from "./engine/query/index"
import { QueryHelp } from "./query-help"
import {
  useCaret,
  useFieldWidth,
  useHandoff,
  useKeepFocus,
  useListOpen,
  useMirror,
  useQueryDraft,
  type QueryHandoff,
} from "./query-field"
import {
  useDateItem,
  useQueryKeys,
  useQuerySource,
  useSamples,
  useSuggestions,
} from "./query-list"
import {
  helpExamples,
  problemMessage,
  statusOf,
  summaryOf,
  termAt,
  understood,
  type SuggestionGroup,
  type SuggestionRow,
} from "./query-model"
import { KeyHint, QueryCalendar, SuggestionView } from "./query-suggestions"
import { MirrorText, type QueryProblem } from "./query-text"

type QuerySearchProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  label: string
  handoff: QueryHandoff
}

/**
 * Where a comma typed just after the space that follows a filter term's
 * value goes instead (a pick completes its term with that space): the
 * comma continues the term's list (`well:a-12 ,` is `well:a-12,`), so the
 * space goes. `undefined` for any other change.
 */
function continuedList(parsed: ParsedQuery, next: string) {
  const previous = parsed.text
  if (next.length !== previous.length + 1) return undefined
  let at = 0
  while (at < previous.length && previous[at] === next[at]) at++
  if (next[at] !== "," || next.slice(at + 1) !== previous.slice(at))
    return undefined
  if (at === 0 || !/\s/.test(previous[at - 1])) return undefined
  const term = parsed.terms.find((other) => other.end === at - 1)
  return term?.kind === "filter" && term.value !== undefined
    ? at - 1
    : undefined
}

function QuerySearch({
  label,
  handoff,
  className,
  placeholder,
  onKeyDown,
  ...props
}: QuerySearchProps) {
  const t = useTranslations("dataTableQuery")
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

  const view = { filters, search }
  const { written, draft, parsed, change, flush } = useQueryDraft(
    language,
    view,
    actions,
    delay,
    clears
  )

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const mirrorRef = React.useRef<HTMLDivElement | null>(null)
  const helpPopup = React.useRef<HTMLDivElement | null>(null)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  // An example of the help was chosen: focus goes back to the field.
  const exampleChosen = React.useRef(false)
  const [group, setGroup] = React.useState<HTMLElement | null>(null)
  const [popup, setPopup] = React.useState<HTMLElement | null>(null)
  const [helpOpen, setHelpOpen] = React.useState(handoff.help)
  // The field's input group, from the input's wrapper (a stable callback:
  // an inline one would set it again, and render again, on every commit).
  const groupRef = React.useCallback(
    (element: HTMLDivElement | null) =>
      setGroup(
        element?.closest<HTMLElement>("[data-slot=input-group]") ?? null
      ),
    []
  )

  const syncMirror = useMirror(inputRef, mirrorRef)
  const { caret, readCaret, placeCaret, select } = useCaret(
    inputRef,
    draft.length,
    syncMirror
  )
  useFieldWidth(group, popup)
  useKeepFocus(group, inputRef)
  // Focus within the field, its help or its list is still the field's.
  const inPopup = (element: Element | null | undefined) =>
    Boolean(
      element &&
      (popup?.contains(element) || helpPopup.current?.contains(element))
    )
  const {
    focused,
    open,
    setOpen,
    settled,
    setSettled,
    markTyping,
    focus,
    leave,
    onOpenChange,
  } = useListOpen(group, inPopup, flush)
  useHandoff(handoff, language, view, written, change, inputRef, select, focus)

  const source = useQuerySource(server, rowModel)
  const sampleOf = useSamples(source)

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
  const visible = problems.filter(
    (problem) =>
      !focused || settled || caret < problem.start || caret > problem.end
  )
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

  const {
    date,
    calendarMode,
    module: dates,
  } = useDateItem(language, parsed, caret)

  // Open while the field has focus, unless Escape dismissed it; the help,
  // drawn where the list is, takes its place while it is open.
  const popupOpen = open && focused && !helpOpen
  const list = useSuggestions(
    popupOpen,
    language,
    parsed,
    caret,
    term,
    source,
    calendarMode,
    formatter,
    t,
    td
  )
  const { suggestions, items, rowCount, highlighted, navigated } = list
  const hint =
    !termProblem && filterTerm
      ? understood(filterTerm, language, model, formatter, td)
      : null
  // In place of the suggestions when there are none, so the list never
  // shrinks to nothing: what the term at the caret does (a date term's
  // line above it says so already). A term's problem is its line, read out
  // (the banner atop the list is not a live region); the search's line
  // waits for a pause in typing, never read out on every key.
  const status =
    popupOpen && rowCount === 0
      ? (termProblem?.message ??
        (hint
          ? t("noSuggestions")
          : statusOf(term, settled, model, formatter, t, td)))
      : null

  const replace = (from: number, to: number, text: string, at: number) => {
    change(draft.slice(0, from) + text + draft.slice(to))
    placeCaret(from + at)
    setSettled(true)
    highlighted.current = undefined
    navigated.current = false
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

  // The list stays: after an offer that completes its term (it ends with a
  // space), it offers the next term.
  const apply = (row: SuggestionRow) => {
    if (row.kind === "calendar") return focusCalendar()
    if (suggestions)
      replace(
        suggestions.start,
        suggestions.end,
        row.suggestion.text,
        row.suggestion.caret
      )
  }

  /** Days picked on the calendar, written as the query writes them. */
  const pickDays = (value: string) => {
    if (!date || !filterTerm) return
    const text = `${date.operator}${value}`
    const atEnd = date.end === filterTerm.end
    const space = atEnd && !/\s/.test(draft[filterTerm.end] ?? "") ? " " : ""
    replace(date.start, date.end, text + space, text.length + (atEnd ? 1 : 0))
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const insertExample = (example: string) => {
    const base = draft.trimEnd()
    const next = base ? `${base} ${example} ` : `${example} `
    change(next)
    placeCaret(next.length)
    setSettled(true)
    setOpen(true)
  }

  const clear = () => {
    change("")
    placeCaret(0)
    setOpen(true)
  }

  const keys = useQueryKeys(
    popupOpen,
    draft === "",
    list,
    apply,
    () => {
      setSettled(true)
      flush()
    },
    setOpen,
    clear
  )

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
        items={items}
        filteredItems={items}
        filter={null}
        value={null}
        onValueChange={(row) => {
          if (row) apply(row)
        }}
        inputValue={draft}
        onInputValueChange={(value, details) => {
          if (details.reason !== "input-change") return
          const comma = continuedList(parsed, value)
          markTyping()
          navigated.current = false
          setOpen(true)
          if (comma !== undefined) {
            change(`${value.slice(0, comma)}${value.slice(comma + 1)}`)
            placeCaret(comma + 1)
            return
          }
          change(value)
          readCaret()
          requestAnimationFrame(readCaret)
        }}
        open={popupOpen}
        onOpenChange={onOpenChange}
        autoHighlight={list.autoHighlight}
        onItemHighlighted={(row, details) => {
          highlighted.current = row
          if (row === undefined) navigated.current = false
          else if (details.reason !== "none") navigated.current = true
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
              ref={groupRef}
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
                  {/* One inline run, as the input's text is: a flex item per
                      span would break kerning and ligatures between them. */}
                  <span>
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
                  </span>
                </div>
              </div>
            </div>
          )}
          onFocus={() => {
            focus()
            // A press places the caret after focusing the field: read
            // again then (and on `selectionchange`).
            readCaret()
            requestAnimationFrame(readCaret)
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            if (inPopup(event.relatedTarget)) return
            leave()
          }}
          onClick={() => {
            readCaret()
            setOpen(true)
          }}
          onKeyDown={(
            event: React.KeyboardEvent<HTMLInputElement> & {
              preventBaseUIHandler?: () => void
            }
          ) => {
            onKeyDown?.(event)
            if (!event.defaultPrevented) keys(event)
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
                exampleChosen.current = true
                insertExample(query)
                setHelpOpen(false)
              }}
              // Back to the text when the help was opened from the field in
              // use or an example was chosen (its caret after the example);
              // to the "?" button otherwise.
              finalFocus={() => {
                const back = focused || exampleChosen.current
                exampleChosen.current = false
                return back ? inputRef.current : true
              }}
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
          // every frame, never eased behind it. It closes with no animation
          // while focus stays (Escape, the help taking its place).
          className={cn(
            "@container/popup flex w-(--field-width,var(--anchor-width)) min-w-[min(22rem,var(--available-width))] flex-col transition-none",
            focused && "data-closed:animate-none"
          )}
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
            {/* Outside the listbox, never an option: a polite live region,
                kept mounted, whose line shows while the list is empty. */}
            <ComboboxEmpty className="flex justify-start p-0 text-start">
              <span
                data-slot="data-table-query-status"
                className={cn(
                  "block min-w-0 truncate px-3 py-2.5 text-sm text-muted-foreground",
                  // Shown in the banner already.
                  termProblem && "sr-only"
                )}
              >
                {status}
              </span>
            </ComboboxEmpty>
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
                  module={dates}
                  mode={calendarMode}
                  operator={date?.operator ?? ""}
                  day={date?.day}
                  value={date?.range}
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

export { QuerySearch }
export type { QueryHandoff, QuerySearchProps }
