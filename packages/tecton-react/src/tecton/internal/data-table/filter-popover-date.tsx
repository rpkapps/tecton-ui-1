"use client"

/**
 * A date filter (`DataTableFilter`'s popover), as `DateRangePicker`'s
 * popover is: its calendar, its code loaded on demand (`date-calendar.tsx`,
 * `DATE_INPUT`; the popover keeps its size meanwhile), for the filter's
 * first range (the others stay as they are, counted under it). The first
 * day picked starts a range, the second ends it, sets the filter and
 * closes the popover, as the picker does. Under the calendar, where the
 * picker has its presets: "No value" and Clear.
 *
 * A filter's ends are calendar days: the day picked starts at midnight in
 * the column's `format.timeZone` (the zone its days are shown in) or the
 * local zone; the calendar shows each end's day in that zone.
 */
import * as React from "react"

import { Button } from "@tecton/react/button"

import { CalendarLoading } from "../calendar-loading"
import { useTranslations } from "../i18n/translations"
import { DATE_INPUT } from "./date-input"
import { listFilter } from "./engine/filter-lists"
import type { DataTableFilterValue } from "./engine/index"
import type { DataTableDateRange } from "./engine/types"
import { dayOf, startOfDay } from "./engine/values"
import { useFeature } from "./lazy"
import {
  MoreRanges,
  NoValueChoice,
  type FilterProps,
} from "./filter-popover-parts"

/** Months a date filter's calendar shows, as `DateRangePicker`'s. */
const DATE_FILTER_MONTHS = 2

function DateCalendar({
  column,
  value,
  set,
  keyboard,
  close,
}: FilterProps<Extract<DataTableFilterValue, { type: "date" }>>) {
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
  return (
    <DayFocusContext value={keyboard}>
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
          set(
            listFilter(
              "date",
              [picked, ...ranges.slice(1)],
              value?.empty === true
            )
          )
          close()
        }}
        numberOfMonths={DATE_FILTER_MONTHS}
      />
    </DayFocusContext>
  )
}

function DateFilter(
  props: FilterProps<Extract<DataTableFilterValue, { type: "date" }>>
) {
  const { value, set, noValue, active, clear } = props
  const t = useTranslations("dataTable")
  const ranges = value?.ranges ?? []
  return (
    <>
      <DateCalendar {...props} />
      {(active || noValue) && (
        <div className="flex w-0 min-w-full flex-wrap items-center gap-3 border-t p-3">
          <MoreRanges count={ranges.length - 1} className="basis-full" />
          {noValue && (
            <NoValueChoice
              className="flex-1"
              checked={value?.empty === true}
              onCheckedChange={(empty) =>
                set(listFilter("date", ranges, empty))
              }
            />
          )}
          {active && (
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
    </>
  )
}

export { DateFilter }
