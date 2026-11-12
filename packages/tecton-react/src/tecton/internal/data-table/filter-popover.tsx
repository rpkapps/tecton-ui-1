"use client"

/**
 * `DataTableFilter`'s popover, loaded on demand (`lazy.ts`, the `filters`
 * feature; the part renders a plain button until then, `filter.tsx`): the
 * column's filter, by its type (§4.1), with "Clear" while one is set.
 *
 * - text: a field; the rows whose display text contains it (like search);
 * - number: a minimum and a maximum, either left empty;
 * - date: a range of days picked on `DateRangePicker`'s calendar, in a
 *   popover like the picker's (its code and locale load on demand too,
 *   `date-calendar.tsx`; the popover keeps its size meanwhile);
 * - boolean: Any, Yes or No;
 * - options: a checkbox per option with its number of rows: those matching
 *   the search and the other filters, counted when the popover opens (in
 *   server mode, the options' own `count`).
 *
 * Text and numbers reach the view `searchDelay` ms after the last key,
 * like search; the other types at once.
 */
import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
} from "@tecton/react/components/popover"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"

import { CalendarLoading } from "../calendar-loading"
import { useTranslations } from "../i18n/translations"
import {
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import { useDelayedCommit } from "./delayed-commit"
import type { DataTableFilterValue, EngineColumn } from "./engine/index"
import { dayOf, startOfDay } from "./engine/values"
import { useFeature } from "./lazy"
import type { LazyPopupProps } from "./lazy-popup"
import { usePopupTabbing } from "./popup-focus"

/** Sets the column's filter; `null` removes it. Whether the view took it. */
type SetColumnFilter = (value: DataTableFilterValue | null) => boolean

type FilterProps<TValue> = {
  column: EngineColumn<unknown>
  value: TValue | undefined
  set: SetColumnFilter
  delay: number
  /** The table's count of clears (`DataTableState.clears`). */
  clears: number
}

function TextFilter({
  value,
  set,
  delay,
  clears,
}: FilterProps<Extract<DataTableFilterValue, { type: "text" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const { draft, change, flush } = useDelayedCommit({
    value: value?.value ?? "",
    commit: (next) =>
      set(next.trim() === "" ? null : { type: "text", value: next }),
    delay,
    clears,
  })
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("filterContains")}</Label>
      <Input
        id={id}
        value={draft}
        onChange={(event) => change(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") flush()
        }}
      />
    </div>
  )
}

/** A number field's text as a bound: empty is none. */
function parseBound(text: string) {
  if (text.trim() === "") return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}

type Bounds = { min: string; max: string }

function NumberFilter({
  column,
  value,
  set,
  delay,
  clears,
}: FilterProps<Extract<DataTableFilterValue, { type: "number" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const { draft, change, flush } = useDelayedCommit<Bounds>({
    value: { min: String(value?.min ?? ""), max: String(value?.max ?? "") },
    commit: ({ min: low, max: high }) => {
      const min = parseBound(low)
      const max = parseBound(high)
      return set(
        min === undefined && max === undefined
          ? null
          : {
              type: "number",
              ...(min === undefined ? {} : { min }),
              ...(max === undefined ? {} : { max }),
            }
      )
    },
    delay,
    clears,
    // "1.0" typed is the 1 the view holds: the field keeps what was typed.
    same: (a, b) =>
      parseBound(a.min) === parseBound(b.min) &&
      parseBound(a.max) === parseBound(b.max),
  })
  const field = (bound: keyof Bounds) => (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={`${id}-${bound}`}>
        {bound === "min" ? t("filterMin") : t("filterMax")}
      </Label>
      <Input
        id={`${id}-${bound}`}
        type="number"
        step="any"
        inputMode="decimal"
        value={draft[bound]}
        aria-describedby={`${id}-column`}
        onChange={(event) =>
          change({ ...draft, [bound]: event.currentTarget.value })
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") flush()
        }}
      />
    </div>
  )
  return (
    <div className="flex gap-2">
      <span id={`${id}-column`} hidden>
        {column.header}
      </span>
      {field("min")}
      {field("max")}
    </div>
  )
}

function BooleanFilter({
  value,
  set,
}: FilterProps<Extract<DataTableFilterValue, { type: "boolean" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const current = value === undefined ? "any" : value.value ? "yes" : "no"
  const choices = [
    { value: "any", label: t("filterAny") },
    { value: "yes", label: t("yes") },
    { value: "no", label: t("no") },
  ]
  return (
    <RadioGroup
      value={current}
      onValueChange={(next) =>
        set(next === "any" ? null : { type: "boolean", value: next === "yes" })
      }
      className="gap-2"
    >
      {choices.map((choice) => (
        <div key={choice.value} className="flex items-center gap-2">
          <RadioGroupItem id={`${id}-${choice.value}`} value={choice.value} />
          <Label htmlFor={`${id}-${choice.value}`} className="font-normal">
            {choice.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

function OptionsFilter({
  column,
  value,
  set,
  counts,
}: FilterProps<Extract<DataTableFilterValue, { type: "options" }>> & {
  /** The number of rows per option value. */
  counts: (value: string) => number | undefined
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  const chosen = new Set(value?.values ?? [])
  if (column.options.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
  const toggle = (option: string, on: boolean) => {
    // In the options' order.
    const values = column.options
      .map((other) => other.value)
      .filter((other) => (other === option ? on : chosen.has(other)))
    set(values.length ? { type: "options", values } : null)
  }
  return (
    <div role="group" aria-label={column.header} className="flex flex-col">
      {column.options.map((option, index) => {
        const count = counts(option.value)
        return (
          <div
            key={option.value}
            className="flex min-h-8 items-center gap-2 rounded-sm px-1"
          >
            <Checkbox
              id={`${id}-${index}`}
              checked={chosen.has(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
            />
            <Label htmlFor={`${id}-${index}`} className="flex-1 font-normal">
              {option.label}
            </Label>
            {count !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {format.format(count)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Months a date filter's calendar shows, as `DateRangePicker`'s. */
const DATE_FILTER_MONTHS = 2

/**
 * A date filter: `DateRangePicker`'s calendar, its code loaded on demand
 * (`date-calendar.tsx`, the `dateInput` feature), its place kept meanwhile.
 * The first day picked starts a range, the second ends it, sets the filter
 * and closes the popover (`onPicked`), as the picker does.
 *
 * A filter's ends are calendar days: the day picked starts at midnight in
 * the column's `format.timeZone` (the zone its days are shown in) or the
 * local zone; the calendar shows each end's day in that zone.
 */
function DateFilter({
  column,
  value,
  set,
  focusDay,
  onPicked,
}: Pick<
  FilterProps<Extract<DataTableFilterValue, { type: "date" }>>,
  "column" | "value" | "set"
> & {
  /** Opened from the keyboard: the calendar focuses its day. */
  focusDay: boolean
  onPicked: () => void
}) {
  const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
  const toCalendar = (date: Date | undefined) => {
    if (!date) return undefined
    const day = dayOf(date, timeZone)
    return new Date(day.year, day.month, day.day)
  }
  const fromCalendar = (date: Date) =>
    startOfDay(date.getFullYear(), date.getMonth(), date.getDate(), timeZone)
  const { module, load } = useFeature("dateInput", true)
  // Asked for as the popover opens, if the idle prefetch has not brought it.
  React.useEffect(() => {
    if (!module) load()
  }, [module, load])
  if (!module) return <CalendarLoading numberOfMonths={DATE_FILTER_MONTHS} />
  const { DayFocusContext, RangeCalendar } = module
  return (
    <DayFocusContext value={focusDay}>
      <RangeCalendar
        value={
          value
            ? { from: toCalendar(value.from), to: toCalendar(value.to) }
            : undefined
        }
        onPick={(range) => {
          set({
            type: "date",
            from: fromCalendar(range.from),
            to: fromCalendar(range.to),
          })
          onPicked()
        }}
        numberOfMonths={DATE_FILTER_MONTHS}
      />
    </DayFocusContext>
  )
}

/** The filter of `column`, by its type. */
function FilterContent({
  context,
  column,
  set,
}: {
  context: DataTableContextValue<unknown>
  column: EngineColumn<unknown>
  set: SetColumnFilter
}) {
  const value = useDataTableSelector(
    context,
    (state) => state.view.filters[column.id] as DataTableFilterValue | undefined
  )
  const delay = useDataTableSelector(
    context,
    (state) => state.options.searchDelay
  )
  const clears = useDataTableSelector(context, (state) => state.clears)
  const server = useDataTableSelector(
    context,
    (state) => state.options.dataMode === "server"
  )
  const model = useDataTableSelector(context, (state) => state.model)
  // Counted now that the popover is open, for this view.
  const facets = React.useMemo(
    () =>
      column.type === "options" && !server ? model.facets(column.id) : null,
    [column, server, model]
  )
  const props = { column, set, delay, clears }
  switch (column.type) {
    case "text":
      return (
        <TextFilter
          {...props}
          value={value?.type === "text" ? value : undefined}
        />
      )
    case "number":
      return (
        <NumberFilter
          {...props}
          value={value?.type === "number" ? value : undefined}
        />
      )
    case "date":
      // In a popover of its own (`DataTableFilterPopover`).
      return null
    case "boolean":
      return (
        <BooleanFilter
          {...props}
          value={value?.type === "boolean" ? value : undefined}
        />
      )
    case "options":
      return (
        <OptionsFilter
          {...props}
          value={value?.type === "options" ? value : undefined}
          counts={(option) =>
            facets
              ? (facets.get(option) ?? 0)
              : column.options.find((other) => other.value === option)?.count
          }
        />
      )
  }
}

/** The filter's popover, by its button (`filter.tsx`, `lazy-popup.ts`). */
function DataTableFilterPopover({
  context,
  column,
  value,
  set,
  popup,
}: {
  context: DataTableContextValue<unknown>
  column: EngineColumn<unknown>
  value: DataTableFilterValue | undefined
  set: SetColumnFilter
  /** The popover's state, from its button. */
  popup: LazyPopupProps
}) {
  const t = useTranslations("dataTable")
  const content = React.useRef<HTMLDivElement | null>(null)
  usePopupTabbing(popup, "dialog")
  const date = column.type === "date"
  const clear = () => {
    set(null)
    // "Clear" goes with the filter: focus moves to the filter's first
    // field, or to the calendar's day.
    setTimeout(() => {
      const element = content.current
      ;(
        element?.querySelector<HTMLElement>(
          '[role="grid"] button[tabindex="0"]'
        ) ??
        element?.querySelector<HTMLElement>(
          'input:not([type="hidden"]), [role="checkbox"], [role="radio"], button'
        )
      )?.focus()
    })
  }
  const keyboard = popup.openedBy === "keyboard"
  const contentProps = {
    ref: content,
    id: popup.popupId,
    anchor: popup.anchor,
    finalFocus: popup.finalFocus,
    align: "start" as const,
    "data-slot": "data-table-filter-content",
  }
  return (
    <Popover
      open={popup.open}
      onOpenChange={popup.onOpenChange}
      onOpenChangeComplete={popup.onOpenChangeComplete}
    >
      {date ? (
        // `DateRangePicker`'s popover: its calendar, then Clear while a
        // filter is set (where the picker has its presets).
        <PopoverContent
          {...contentProps}
          aria-label={column.header}
          // From the keyboard, the calendar focuses its day itself.
          initialFocus={keyboard ? false : undefined}
          className="w-auto gap-0 overflow-hidden p-0"
        >
          <DateFilter
            column={column}
            value={value?.type === "date" ? value : undefined}
            set={set}
            focusDay={keyboard}
            onPicked={() => popup.onOpenChange(false, {})}
          />
          {value && (
            <div className="flex w-0 min-w-full border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={clear}
              >
                {t("clearFilter")}
              </Button>
            </div>
          )}
        </PopoverContent>
      ) : (
        <PopoverContent
          {...contentProps}
          className="flex w-auto min-w-56 flex-col gap-3"
        >
          <div className="flex min-h-6 items-center justify-between gap-4">
            <PopoverTitle className="text-sm">{column.header}</PopoverTitle>
            {value && (
              <Button
                variant="ghost"
                size="xs"
                className="-me-1.5"
                onClick={clear}
              >
                {t("clearFilter")}
              </Button>
            )}
          </div>
          <FilterContent context={context} column={column} set={set} />
        </PopoverContent>
      )}
    </Popover>
  )
}

export { DataTableFilterPopover }
export type { SetColumnFilter }
