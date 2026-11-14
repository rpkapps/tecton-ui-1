"use client"

/**
 * The parts of the query field's list (`query-search.tsx`), in its chunk:
 * a suggestion's row (`SuggestionView`), the keys under the list
 * (`KeyHint`) and the calendar of a date value (`QueryCalendar`).
 */
import * as React from "react"
import { cn } from "cn"
import { CalendarIcon } from "lucide-react"

import { Badge } from "@tecton/react/badge"
import { Kbd } from "@tecton/react/kbd"

import { CalendarLoading } from "../calendar-loading"
import type { Translator } from "../i18n/translations"
import type { QueryLanguage, QuerySuggestion } from "./engine/query/index"
import { dayOfDate, partsOf, type Day } from "./engine/query/dates"
import { EMPTY_WORDS } from "./engine/query/syntax"
import type { DataTableDateRange } from "./engine/types"
import type { DateInputModule } from "./date-input"
import { dayText, typeLabel, type SuggestionRow } from "./query-model"

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
  t: Translator<"dataTableQuery">
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
          {code(EMPTY_WORDS[0], "text-saffron-830")}
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

type DateModule = NonNullable<DateInputModule | undefined>

/**
 * The calendar of the suggestions, for a date value: the date filter's own
 * (`DateRangePicker`'s), in range mode for a bare or `..` value and single
 * day mode after `<` `>` `<=` `>=`, showing the item's days. A pick writes
 * them as the query writes days. Pointer presses keep focus in the field;
 * from the keyboard, the calendar's row in the list moves focus to a day,
 * and Escape gives it back.
 */
function QueryCalendar({
  module,
  mode,
  operator,
  day,
  value,
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
  /** The days of the date item at the caret. */
  value: DataTableDateRange | undefined
  timeZone: string | undefined
  rootRef: React.Ref<HTMLDivElement>
  onPick: (text: string) => void
  onEscape: () => void
  onLeave: (next: Element | null) => void
  t: Translator<"dataTableQuery">
}) {
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

export { KeyHint, QueryCalendar, SuggestionView }
