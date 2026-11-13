"use client"

/**
 * `DataTableFilter`'s popover content (the part renders the popover and its
 * trigger, `filter.tsx`): the column's filter, by its type (§4.1), with
 * "Clear" while one is set. It renders only while the popover is open.
 *
 * - text: a field, and the texts added from it as removable chips; the rows
 *   whose display text contains any of them (like search). Enter or a comma
 *   adds what is typed, Backspace in the empty field removes the last chip,
 *   and what is typed applies too, as it is typed;
 * - number: a minimum and a maximum side by side, either left empty, with
 *   the column's unit (`NumberFilter`);
 * - date: a range of days picked on `DateRangePicker`'s calendar, in a
 *   popover like the picker's (its code and locale load on demand too,
 *   `date-calendar.tsx`; the popover keeps its size meanwhile);
 * - boolean: Yes and No, checkboxes laid out as an options filter's, with
 *   their numbers of rows (none in server mode); neither chosen is any
 *   value;
 * - options: a checkbox per option with its number of rows: those matching
 *   the search and the other filters, counted when the popover opens (in
 *   server mode, the options' own `count`).
 *
 * A text or number filter shows how many rows it keeps as it is typed, of
 * those the search and the other filters keep (not in server mode, where
 * the table holds only the rows loaded).
 *
 * A number or date filter holds a list of ranges (`td:<1000,>3000` in the
 * search), and its popover edits the first: the others stay as they are,
 * and a muted line under it says how many there are, which Clear removes
 * with the rest of the filter.
 *
 * Each offers "No value" while a row has none in the column (in server
 * mode always: the table sees only the loaded rows), and while it is
 * chosen: the filter's `empty`, the rows without a value besides those the
 * rest matches. It is the last option, apart, with its count; a checkbox
 * under a text or number filter's fields and beside a date filter's Clear;
 * and, as in an options filter, after a yes / no filter's Yes and No.
 *
 * Text and numbers reach the view `searchDelay` ms after the last key,
 * like search (a text added as a chip, or removed, at once); the other
 * types at once.
 */
import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/button"
import { Checkbox } from "@tecton/react/checkbox"
import { Chip, ChipGroup, ChipList } from "@tecton/react/chip"
import { Input } from "@tecton/react/input"
import { Label } from "@tecton/react/label"
import { PopoverContent, PopoverTitle } from "@tecton/react/popover"
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
  getFacets,
  getNumberFacets,
  hasEmptyValues,
  type NumberFacets,
} from "./engine/facets"
import {
  numberUnit,
  type DataTableFilterValue,
  type EngineColumn,
} from "./engine/index"
import type { DataTableDateRange, DataTableNumberRange } from "./engine/types"
import { dayOf, startOfDay } from "./engine/values"
import { sameFilterValue, sameIds } from "./engine/view"
import { DATE_INPUT } from "./date-input"
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

/** Whether two filters, either unset (`null`), are the same. */
const sameFilter = (
  a: DataTableFilterValue | null,
  b: DataTableFilterValue | null
) => (a && b ? sameFilterValue(a, b) : a === b)

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

/**
 * The muted line under a number or date filter that edits the first of
 * its ranges: how many more it has, which Clear removes.
 */
function MoreRanges({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  if (count <= 0) return null
  return (
    <p
      data-slot="data-table-filter-more-ranges"
      className={cn("text-xs text-muted-foreground", className)}
    >
      {t("filterMoreRanges", { count, total: format.format(count) })}
    </p>
  )
}

/** A text filter being edited: its chips, what is typed, its "No value". */
type TextDraft = {
  values: ReadonlyArray<string>
  text: string
  empty: boolean
}

/** The texts a draft looks for: its chips, then what is typed. */
function textsOf({ values, text }: TextDraft): ReadonlyArray<string> {
  const typed = text.trim()
  return typed && !values.includes(typed) ? [...values, typed] : values
}

/** The filter of a text draft, or `null` when it filters nothing. */
function textFilter(draft: TextDraft): DataTableFilterValue | null {
  const values = textsOf(draft)
  return values.length || draft.empty
    ? { type: "text", values, ...emptyFlag(draft.empty) }
    : null
}

/** `draft`'s chips with the texts of `typed` (split at commas) added. */
function withTexts(draft: TextDraft, typed: string) {
  const values = [...draft.values]
  for (const part of typed.split(",")) {
    const text = part.trim()
    if (text && !values.includes(text)) values.push(text)
  }
  return values
}

/**
 * A text filter: a field, and the texts added from it as chips (`Chip`s in
 * a group of their own, each with its remove button). Enter or a comma adds
 * what is typed; Backspace in the empty field removes the last chip. What
 * is typed applies too, as a text beside the chips, `delay` ms after the
 * last key.
 */
function TextFilter({
  value,
  set,
  delay,
  clears,
  noValue,
  matches,
}: FilterProps<Extract<DataTableFilterValue, { type: "text" }>> & {
  matches: NumberFacets | null
}) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const input = React.useRef<HTMLInputElement | null>(null)
  // The view's filter as a draft, made again only when the view changes:
  // the field keeps what is typed until then.
  const viewDraft = React.useMemo(
    (): TextDraft => ({
      values: value?.values ?? [],
      text: "",
      empty: value?.empty === true,
    }),
    [value]
  )
  const { draft, change, flush } = useDelayedCommit<TextDraft>({
    value: viewDraft,
    commit: (next) => set(textFilter(next)),
    delay,
    clears,
    // The texts it applies, whether a chip or typed.
    same: (a, b) => a.empty === b.empty && sameIds(textsOf(a), textsOf(b)),
  })
  /** Sets the draft and applies it now: a chip added or removed. */
  const commit = (next: TextDraft) => {
    change(next)
    flush()
  }
  const remove = (gone: ReadonlyArray<string>) => {
    const values = draft.values.filter((text) => !gone.includes(text))
    commit({ ...draft, values })
    // The last chip gone: back to the field.
    if (!values.length) input.current?.focus()
  }
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("filterContains")}</Label>
      <Input
        ref={input}
        id={id}
        placeholder={t("filterAddText")}
        value={draft.text}
        onChange={(event) => {
          const typed = event.currentTarget.value
          const comma = typed.lastIndexOf(",")
          if (comma === -1) return change({ ...draft, text: typed })
          // A comma (typed or pasted) adds what is before it.
          commit({
            ...draft,
            values: withTexts(draft, typed.slice(0, comma)),
            text: typed.slice(comma + 1).trimStart(),
          })
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (draft.text.trim())
              commit({
                ...draft,
                values: withTexts(draft, draft.text),
                text: "",
              })
            else flush()
          } else if (
            event.key === "Backspace" &&
            draft.text === "" &&
            draft.values.length > 0 &&
            event.currentTarget.selectionStart === 0
          ) {
            event.preventDefault()
            commit({ ...draft, values: draft.values.slice(0, -1) })
          }
        }}
      />
      {draft.values.length > 0 && (
        <ChipGroup
          aria-label={t("filterContainsAny")}
          onRemove={remove}
          className="py-0.5"
        >
          <ChipList>
            {draft.values.map((text) => (
              <Chip key={text} value={text} label={text}>
                <span className="max-w-52 truncate">{text}</span>
              </Chip>
            ))}
          </ChipList>
        </ChipGroup>
      )}
      {(noValue || matches) && (
        <div className="flex min-h-8 items-center gap-4">
          {noValue && (
            <NoValueChoice
              className="flex-1"
              checked={draft.empty}
              onCheckedChange={(empty) => commit({ ...draft, empty })}
            />
          )}
          {matches && (
            <FilterMatches matches={matches} filter={textFilter(draft)} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A number filter's first range, as its fields hold it (`null`: the field
 * empty), and the filter's other ranges, kept as they are.
 */
type Bounds = {
  min: number | null
  max: number | null
  /** Kept from the view (the search's `>` and `<`) until the bound is edited. */
  minExclusive: boolean
  maxExclusive: boolean
  empty: boolean
  more: ReadonlyArray<DataTableNumberRange>
}

/** The filter of `bounds`, or `null` when they filter nothing. */
function toFilter({
  min,
  max,
  minExclusive,
  maxExclusive,
  empty,
  more,
}: Bounds): DataTableFilterValue | null {
  const edited: DataTableNumberRange = {
    ...(min === null ? {} : { min }),
    ...(max === null ? {} : { max }),
    ...(min !== null && minExclusive ? { minExclusive: true } : {}),
    ...(max !== null && maxExclusive ? { maxExclusive: true } : {}),
  }
  const ranges = min === null && max === null ? more : [edited, ...more]
  return ranges.length || empty
    ? { type: "number", ranges, ...emptyFlag(empty) }
    : null
}

/**
 * A number filter: Min and Max side by side, each a `NumberField` with its
 * minus and plus, and the column's unit on the side the column writes it
 * (`numberUnit`: its `unit`, percent sign or currency), for the filter's
 * first range. Under them, "No value" (as every filter has it) and how
 * many rows the filter keeps, of those the search and the other filters
 * keep, counted as they are typed (`numbers`; not in server mode, where
 * the table holds only the rows loaded).
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
  // The view's filter as a draft, made again only when the view changes.
  const viewBounds = React.useMemo((): Bounds => {
    const ranges = value?.ranges ?? []
    // None when the filter has no range.
    const first = ranges.at(0)
    const more = ranges.slice(1)
    return {
      min: first?.min ?? null,
      max: first?.max ?? null,
      minExclusive: first?.minExclusive === true,
      maxExclusive: first?.maxExclusive === true,
      empty: value?.empty === true,
      more,
    }
  }, [value])
  const { draft, change, flush } = useDelayedCommit<Bounds>({
    value: viewBounds,
    commit: (bounds) => set(toFilter(bounds)),
    delay,
    clears,
    // The filter they make: the first range emptied leaves the others.
    same: (a, b) => sameFilter(toFilter(a), toFilter(b)),
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
        // A bound typed here includes its value: an exclusive one (`>`
        // or `<` in the search) becomes inclusive as it is edited.
        onValueChange={(next) =>
          change({
            ...draft,
            [bound]: scaled(next, 1 / unit.scale),
            [bound === "min" ? "minExclusive" : "maxExclusive"]: false,
          })
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
      <MoreRanges count={draft.more.length} />
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
            <FilterMatches matches={numbers} filter={toFilter(draft)} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * "12 of 120 match": of the rows the search and the other filters keep,
 * those the text or number filter being typed keeps too, as it is typed.
 */
function FilterMatches({
  matches: facets,
  filter,
}: {
  matches: NumberFacets
  filter: DataTableFilterValue | null
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const matches = facets.count(filter)
  return (
    <p
      data-slot="data-table-filter-matches"
      className="ms-auto text-xs text-muted-foreground tabular-nums"
    >
      {t("filterMatches", {
        count: matches,
        matches: format.format(matches),
        total: format.format(facets.total),
      })}
    </p>
  )
}

/**
 * The rows of a list filter's choices (an options filter's options, a yes
 * / no filter's Yes and No): a checkbox, its label and its number of rows.
 */
function ChoiceRow({
  id,
  label,
  checked,
  onCheckedChange,
  count,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  count: number | undefined
}) {
  const format = useNumberFormat()
  return (
    <div className="flex min-h-8 items-center gap-2 rounded-sm px-1">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="flex-1 font-normal">
        {label}
      </Label>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format.format(count)}
        </span>
      )}
    </div>
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
  const id = React.useId()
  const chosen = new Set(value?.values ?? [])
  const empty = value?.empty === true
  const update = (values: ReadonlyArray<boolean>, empty: boolean) =>
    set(
      values.length || empty
        ? { type: "boolean", values, ...emptyFlag(empty) }
        : null
    )
  const choices = [
    { value: true, label: t("yes") },
    { value: false, label: t("no") },
  ]
  // An options filter's rows: neither chosen is any value, as Clear
  // leaves it.
  return (
    <div role="group" aria-label={column.header} className="flex flex-col">
      {choices.map((choice) => (
        <ChoiceRow
          key={String(choice.value)}
          id={`${id}-${choice.value}`}
          label={choice.label}
          checked={chosen.has(choice.value)}
          onCheckedChange={(on) =>
            update(
              choices
                .map((other) => other.value)
                .filter((other) =>
                  other === choice.value ? on : chosen.has(other)
                ),
              empty
            )
          }
          count={counts(choice.value)}
        />
      ))}
      {noValue && (
        <>
          <Separator className="-mx-4 my-1 data-horizontal:w-auto" />
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
      {column.options.map((option, index) => (
        <ChoiceRow
          key={option.value}
          id={`${id}-${index}`}
          label={option.label}
          checked={chosen.has(option.value)}
          onCheckedChange={(checked) => toggle(option.value, checked)}
          count={counts(option.value)}
        />
      ))}
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
 * (`date-calendar.tsx`, `DATE_INPUT`), its place kept meanwhile, for the
 * filter's first range (the others stay as they are).
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
  const { module, load } = useFeature(DATE_INPUT, true)
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
  const ranges = value?.ranges ?? []
  const first = ranges.at(0)
  const more = ranges.slice(1)
  return (
    <DayFocusContext value={focusDay}>
      <RangeCalendar
        value={
          first
            ? { from: toCalendar(first.from), to: toCalendar(first.to) }
            : undefined
        }
        onPick={(range) => {
          const picked: DataTableDateRange = {
            from: fromCalendar(range.from),
            to: fromCalendar(range.to),
          }
          set({
            type: "date",
            ranges: [picked, ...more],
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
  return server || chosen === true || hasEmptyValues(model, column.id)
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
        ? getFacets(model, column.id)
        : null,
    [column, server, model]
  )
  // The rows a text or number filter keeps as it is typed, and a number
  // column's numbers (the model has none in server mode).
  const matches = React.useMemo(
    () =>
      column.type === "number" || column.type === "text"
        ? getNumberFacets(model, column.id)
        : null,
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
          matches={matches}
        />
      )
    case "number":
      return (
        <NumberFilter
          {...props}
          value={value?.type === "number" ? value : undefined}
          numbers={matches}
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
          'input:not([type="hidden"]), [role="checkbox"], button'
        )
      )?.focus()
    })
  }
  const keyboard = popup.openedBy === "keyboard"
  const noValue = useNoValue(context, column, value)
  const dateValue = value?.type === "date" ? value : undefined
  const moreRanges = Math.max(0, (dateValue?.ranges.length ?? 0) - 1)
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
        <div className="flex w-0 min-w-full flex-wrap items-center gap-3 border-t p-3">
          <MoreRanges count={moreRanges} className="basis-full" />
          {noValue && (
            <NoValueChoice
              className="flex-1"
              checked={dateValue?.empty === true}
              onCheckedChange={(empty) => {
                const ranges = dateValue?.ranges ?? []
                set(
                  ranges.length || empty
                    ? { type: "date", ranges, ...emptyFlag(empty) }
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
        column.type === "number" && "w-96",
        // The chips wrap rather than widen it.
        column.type === "text" && "w-72"
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
