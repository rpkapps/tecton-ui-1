"use client"

/**
 * `DataTableFilter`'s popover content (the part renders the popover and its
 * trigger, `filter.tsx`): the column's filter, by its type (§4.1), with
 * "Clear" while one is set. It renders only while the popover is open.
 *
 * - text: a field; the rows whose display text contains it (like search);
 * - number: a minimum and a maximum side by side, either left empty, with
 *   the column's unit and how many rows the bounds keep as they are typed
 *   (`NumberFilter`);
 * - date: a range of days picked on `DateRangePicker`'s calendar, in a
 *   popover like the picker's (its code and locale load on demand too,
 *   `date-calendar.tsx`; the popover keeps its size meanwhile);
 * - boolean: Yes or No, radio buttons laid out as an options filter's
 *   checkboxes, with their numbers of rows (none in server mode); neither
 *   chosen is any value;
 * - options: a checkbox per option with its number of rows: those matching
 *   the search and the other filters, counted when the popover opens (in
 *   server mode, the options' own `count`).
 *
 * Each offers "No value" while a row has none in the column (in server
 * mode always: the table sees only the loaded rows), and while it is
 * chosen: the filter's `empty`, the rows without a value besides those the
 * rest matches. It is the last option, apart, with its count; a checkbox
 * under a text or number filter's fields and beside a date filter's Clear;
 * and, as in an options filter, after a yes / no filter's Yes and No.
 *
 * Text and numbers reach the view `searchDelay` ms after the last key,
 * like search; the other types at once.
 */
import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/button"
import { Checkbox } from "@tecton/react/checkbox"
import { Input } from "@tecton/react/input"
import { Label } from "@tecton/react/label"
import { PopoverContent, PopoverTitle } from "@tecton/react/popover"
import { RadioGroup, RadioGroupItem } from "@tecton/react/radio-group"
import { Separator } from "@tecton/react/separator"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldUnit,
} from "@tecton/react/number-field"
import { useLocale } from "@tecton/react/provider"

import { CalendarLoading } from "../calendar-loading"
import { useTranslations } from "../i18n/translations"
import {
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import { useDelayedCommit } from "./delayed-commit"
import {
  numberUnit,
  type DataTableFilterValue,
  type EngineColumn,
  type NumberFacets,
} from "./engine/index"
import { dayOf, startOfDay } from "./engine/values"
import { useFeature } from "./lazy"
import type { PartPopup } from "./part-popup"

/** Sets the column's filter; `null` removes it. Whether the view took it. */
type SetColumnFilter = (value: DataTableFilterValue | null) => boolean

type FilterProps<TValue> = {
  column: EngineColumn<unknown>
  value: TValue | undefined
  set: SetColumnFilter
  delay: number
  /** The table's count of clears (`DataTableState.clears`). */
  clears: number
  /** The filter offers "No value". */
  noValue: boolean
}

/** `{ empty: true }` for a filter's "No value", nothing without it. */
const emptyFlag = (empty: boolean) => (empty ? { empty } : {})

/**
 * A filter's "No value" checkbox, with its number of rows when `count`
 * is known.
 */
function NoValueChoice({
  checked,
  onCheckedChange,
  count,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  count?: number
  className?: string
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  return (
    <div
      data-slot="data-table-filter-no-value"
      className={cn("flex min-h-8 items-center gap-2", className)}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="flex-1 font-normal">
        {t("noValue")}
      </Label>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format.format(count)}
        </span>
      )}
    </div>
  )
}

type TextDraft = { text: string; empty: boolean }

function TextFilter({
  value,
  set,
  delay,
  clears,
  noValue,
}: FilterProps<Extract<DataTableFilterValue, { type: "text" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const { draft, change, flush } = useDelayedCommit<TextDraft>({
    value: { text: value?.value ?? "", empty: value?.empty === true },
    commit: ({ text, empty }) =>
      set(
        text.trim() === "" && !empty
          ? null
          : { type: "text", value: text, ...emptyFlag(empty) }
      ),
    delay,
    clears,
    same: (a, b) => a.text === b.text && a.empty === b.empty,
  })
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("filterContains")}</Label>
      <Input
        id={id}
        value={draft.text}
        onChange={(event) =>
          change({ ...draft, text: event.currentTarget.value })
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") flush()
        }}
      />
      {noValue && (
        <NoValueChoice
          checked={draft.empty}
          onCheckedChange={(empty) => {
            change({ ...draft, empty })
            flush()
          }}
        />
      )}
    </div>
  )
}

/** A number filter's bounds: `null` (its field empty) is none. */
type Bounds = { min: number | null; max: number | null; empty: boolean }

/** The filter of `bounds`, or `null` when they filter nothing. */
function toFilter({ min, max, empty }: Bounds): DataTableFilterValue | null {
  return min === null && max === null && !empty
    ? null
    : {
        type: "number",
        ...(min === null ? {} : { min }),
        ...(max === null ? {} : { max }),
        ...emptyFlag(empty),
      }
}

/**
 * A number filter: Min and Max side by side, each a `NumberField` with its
 * minus and plus, and the column's unit on the side the column writes it
 * (`numberUnit`: its `unit`, percent sign or currency). Under them, "No
 * value" (as every filter has it) and how many rows the bounds keep, of
 * those the search and the other filters keep, counted as they are typed
 * (`numbers`; not in server mode, where the table holds only the rows
 * loaded).
 */
function NumberFilter({
  column,
  value,
  set,
  delay,
  clears,
  noValue,
  numbers,
}: FilterProps<Extract<DataTableFilterValue, { type: "number" }>> & {
  numbers: NumberFacets | null
}) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const { draft, change, flush } = useDelayedCommit<Bounds>({
    value: {
      min: value?.min ?? null,
      max: value?.max ?? null,
      empty: value?.empty === true,
    },
    commit: (bounds) => set(toFilter(bounds)),
    delay,
    clears,
    same: (a, b) => a.min === b.min && a.max === b.max && a.empty === b.empty,
  })
  const { locale } = useLocale()
  const unit = React.useMemo(
    () => numberUnit(locale, column.format as Intl.NumberFormatOptions),
    [locale, column.format]
  )
  // The fields hold the numbers as the column shows them (a percent's
  // 12.5 is the 0.125 the filter holds).
  const scaled = (number: number | null, by: number) =>
    number === null || unit.scale === 1
      ? number
      : Number((number * by).toPrecision(15))
  // Only the number reaches the draft: the field keeps what was typed
  // ("3000.0" is the 3000 the view holds) until it loses focus.
  const field = (bound: "min" | "max") => (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={`${id}-${bound}`}>
        {bound === "min" ? t("filterMin") : t("filterMax")}
      </Label>
      <NumberField
        id={`${id}-${bound}`}
        value={scaled(draft[bound], unit.scale)}
        onValueChange={(next) =>
          change({ ...draft, [bound]: scaled(next, 1 / unit.scale) })
        }
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          {unit.unit && unit.side === "start" && (
            <NumberFieldUnit className="ps-2 pe-0">{unit.unit}</NumberFieldUnit>
          )}
          <NumberFieldInput
            aria-describedby={`${id}-column`}
            className={cn(unit.unit && unit.side === "start" && "ps-1")}
            onKeyDown={(event) => {
              if (event.key === "Enter") flush()
            }}
          />
          {unit.unit && unit.side === "end" && (
            <NumberFieldUnit>{unit.unit}</NumberFieldUnit>
          )}
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <span id={`${id}-column`} hidden>
          {column.header}
        </span>
        {field("min")}
        {field("max")}
      </div>
      {(noValue || numbers) && (
        <div className="flex min-h-8 items-center gap-4">
          {noValue && (
            <NoValueChoice
              className="flex-1"
              checked={draft.empty}
              onCheckedChange={(empty) => {
                change({ ...draft, empty })
                flush()
              }}
            />
          )}
          {numbers && (
            <NumberMatches numbers={numbers} filter={toFilter(draft)} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * "12 of 120 match": of the rows the search and the other filters keep,
 * those the number filter being typed keeps too, as it is typed.
 */
function NumberMatches({
  numbers,
  filter,
}: {
  numbers: NumberFacets
  filter: DataTableFilterValue | null
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const matches = numbers.count(filter)
  return (
    <p
      data-slot="data-table-filter-matches"
      className="ms-auto text-xs text-muted-foreground tabular-nums"
    >
      {t("filterMatches", {
        count: matches,
        matches: format.format(matches),
        total: format.format(numbers.total),
      })}
    </p>
  )
}

function BooleanFilter({
  column,
  value,
  set,
  noValue,
  counts,
  emptyCount,
}: FilterProps<Extract<DataTableFilterValue, { type: "boolean" }>> & {
  /** The number of rows whose value is `choice`. */
  counts: (choice: boolean) => number | undefined
  /** The number of rows without a value, when known. */
  emptyCount: number | undefined
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  const empty = value?.empty === true
  const update = (choice: boolean | undefined, empty: boolean) =>
    set(
      choice === undefined && !empty
        ? null
        : {
            type: "boolean",
            ...(choice === undefined ? {} : { value: choice }),
            ...emptyFlag(empty),
          }
    )
  const choices = [
    { value: true, label: t("yes") },
    { value: false, label: t("no") },
  ]
  // An options filter's rows, as radio buttons: neither chosen is any
  // value, as Clear leaves it.
  return (
    <div className="flex flex-col">
      <RadioGroup
        aria-label={column.header}
        value={value?.value ?? null}
        onValueChange={(choice: boolean) => update(choice, empty)}
        className="flex flex-col gap-0"
      >
        {choices.map((choice) => {
          const count = counts(choice.value)
          return (
            <div
              key={String(choice.value)}
              className="flex min-h-8 items-center gap-2 rounded-sm px-1"
            >
              <RadioGroupItem
                id={`${id}-${choice.value}`}
                value={choice.value}
              />
              <Label
                htmlFor={`${id}-${choice.value}`}
                className="flex-1 font-normal"
              >
                {choice.label}
              </Label>
              {count !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {format.format(count)}
                </span>
              )}
            </div>
          )
        })}
      </RadioGroup>
      {noValue && (
        <>
          <Separator className="-mx-4 my-1 data-horizontal:w-auto" />
          <NoValueChoice
            checked={empty}
            onCheckedChange={(on) => update(value?.value, on)}
            count={emptyCount}
            className="rounded-sm px-1"
          />
        </>
      )}
    </div>
  )
}

function OptionsFilter({
  column,
  value,
  set,
  noValue,
  counts,
  emptyCount,
}: FilterProps<Extract<DataTableFilterValue, { type: "options" }>> & {
  /** The number of rows per option value. */
  counts: (value: string) => number | undefined
  /** The number of rows without a value, when known. */
  emptyCount: number | undefined
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  const chosen = new Set(value?.values ?? [])
  const empty = value?.empty === true
  if (column.options.length === 0 && !noValue)
    return <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
  const update = (values: ReadonlyArray<string>, empty: boolean) =>
    set(
      values.length || empty
        ? { type: "options", values, ...emptyFlag(empty) }
        : null
    )
  const toggle = (option: string, on: boolean) => {
    // In the options' order.
    const values = column.options
      .map((other) => other.value)
      .filter((other) => (other === option ? on : chosen.has(other)))
    update(values, empty)
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
      {noValue && (
        <>
          {column.options.length > 0 && (
            // Edge to edge, through the popover's padding, as a menu's
            // separators are.
            <Separator className="-mx-4 my-1 data-horizontal:w-auto" />
          )}
          <NoValueChoice
            checked={empty}
            onCheckedChange={(on) => update(value?.values ?? [], on)}
            count={emptyCount}
            className="rounded-sm px-1"
          />
        </>
      )}
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
  // The calendar's days (two months of buttons) render just after the
  // popover's first frame, in a render React pauses for the browser's
  // frames: the popover opens and animates at once, as a `Popover` does,
  // and the calendar fills its place, the same size, a frame or two later.
  const shown = React.useDeferredValue(true, false)
  if (!module || !shown)
    return (
      <CalendarLoading numberOfMonths={DATE_FILTER_MONTHS} spinner={!module} />
    )
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
            ...emptyFlag(value?.empty === true),
          })
          onPicked()
        }}
        numberOfMonths={DATE_FILTER_MONTHS}
      />
    </DayFocusContext>
  )
}

/**
 * Whether `column`'s filter offers "No value": a row has none (any row,
 * matching or not; in server mode always), or the filter has it.
 */
function useNoValue(
  context: DataTableContextValue<unknown>,
  column: EngineColumn<unknown>,
  value: DataTableFilterValue | undefined
) {
  const server = useDataTableSelector(
    context,
    (state) => state.options.dataMode === "server"
  )
  const model = useDataTableSelector(context, (state) => state.model)
  const chosen = value !== undefined && value.type !== "custom" && value.empty
  return server || chosen === true || model.hasEmptyValues(column.id)
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
      (column.type === "options" || column.type === "boolean") && !server
        ? model.facets(column.id)
        : null,
    [column, server, model]
  )
  // A number column's numbers, for the range hints and the count of
  // matches (the model has none in server mode).
  const numbers = React.useMemo(
    () => (column.type === "number" ? model.numberFacets(column.id) : null),
    [column, model]
  )
  const noValue = useNoValue(context, column, value)
  const props = { column, set, delay, clears, noValue }
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
          numbers={numbers}
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
          counts={(choice) =>
            facets ? (facets.counts.get(String(choice)) ?? 0) : undefined
          }
          emptyCount={facets?.empty}
        />
      )
    case "options":
      return (
        <OptionsFilter
          {...props}
          value={value?.type === "options" ? value : undefined}
          counts={(option) =>
            facets
              ? (facets.counts.get(option) ?? 0)
              : column.options.find((other) => other.value === option)?.count
          }
          emptyCount={facets?.empty}
        />
      )
  }
}

/**
 * The filter's popover content, in the part's `Popover` by its trigger
 * (`filter.tsx`, `part-popup.ts`).
 */
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
  /** The popover's state, from the part. */
  popup: PartPopup
}) {
  const t = useTranslations("dataTable")
  const content = React.useRef<HTMLDivElement | null>(null)
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
  const noValue = useNoValue(context, column, value)
  const dateValue = value?.type === "date" ? value : undefined
  const contentProps = {
    ref: content,
    anchor: popup.content.anchor,
    finalFocus: popup.content.finalFocus,
    align: "start" as const,
    "data-slot": "data-table-filter-content",
  }
  return date ? (
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
        value={dateValue}
        set={set}
        focusDay={keyboard}
        onPicked={popup.close}
      />
      {(value || noValue) && (
        <div className="flex w-0 min-w-full items-center gap-3 border-t p-3">
          {noValue && (
            <NoValueChoice
              className="flex-1"
              checked={dateValue?.empty === true}
              onCheckedChange={(empty) => {
                const { from, to } = dateValue ?? {}
                set(
                  from || to || empty
                    ? {
                        type: "date",
                        ...(from ? { from } : {}),
                        ...(to ? { to } : {}),
                        ...emptyFlag(empty),
                      }
                    : null
                )
              }}
            />
          )}
          {value && (
            <Button
              variant="outline"
              size="sm"
              className={noValue ? undefined : "flex-1"}
              onClick={clear}
            >
              {t("clearFilter")}
            </Button>
          )}
        </div>
      )}
    </PopoverContent>
  ) : (
    <PopoverContent
      {...contentProps}
      className={cn(
        "flex w-auto min-w-56 flex-col gap-3",
        // Min and Max share it, each with its minus and plus and the unit:
        // their text inputs alone would make it as wide as two default-width
        // inputs, and 18rem would leave each number under 3rem.
        column.type === "number" && "w-96"
      )}
    >
      <div className="flex min-h-6 items-center justify-between gap-4">
        <PopoverTitle className="text-sm">{column.header}</PopoverTitle>
        {value && (
          <Button variant="ghost" size="xs" className="-me-1.5" onClick={clear}>
            {t("clearFilter")}
          </Button>
        )}
      </div>
      <FilterContent context={context} column={column} set={set} />
    </PopoverContent>
  )
}

export { DataTableFilterPopover }
export type { SetColumnFilter }
