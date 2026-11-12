"use client"

/**
 * Internal to `@tecton/react`: the calendars of `DatePicker` and
 * `DateRangePicker` (`date-picker.tsx`), in the provider's locale and
 * direction, without their popover. A DataTable date filter shows the
 * range picker's calendar in its own popover, loaded on demand
 * (`data-table/lazy.ts`, the `dateInput` feature), so it looks and works as
 * the picker's does.
 */
import * as React from "react"
import type { Matcher } from "react-day-picker"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { useLocale } from "@tecton/react/tecton/provider"

import type {
  DatePickerProps,
  DateRange,
  DateRangePickerProps,
  DateRangePresetName,
} from "../date-picker"
import { useCalendarLocale } from "./calendar-locale"
import { CalendarLoading } from "./calendar-loading"
import { isWithin, startOfDay } from "./date-text"
import { useTranslations } from "./i18n/translations"

/**
 * Whether the calendar opened from the keyboard: it then focuses its day,
 * so the arrows work at once. Opened with a pointer, the popover takes
 * focus itself and no day shows a focus ring.
 */
const DayFocusContext = React.createContext(false)

/** The calendar's limits from `minDate` and `maxDate`. */
function calendarBounds(minDate?: Date, maxDate?: Date) {
  const disabled: Array<Matcher> = []
  if (minDate) disabled.push({ before: startOfDay(minDate) })
  if (maxDate) disabled.push({ after: startOfDay(maxDate) })
  return {
    disabled: disabled.length ? disabled : undefined,
    startMonth: minDate,
    endMonth: maxDate,
  }
}

/** The month to open on: the day's, else today's when it is in range, else the nearest bound's. */
function openingMonth(day: Date | undefined, minDate?: Date, maxDate?: Date) {
  if (day) return day
  const today = new Date()
  if (minDate && !isWithin(today, minDate)) return minDate
  if (maxDate && !isWithin(today, undefined, maxDate)) return maxDate
  return undefined
}

/** The calendar of a single date, in the provider's locale and direction. */
function SingleCalendar({
  value,
  onPick,
  minDate,
  maxDate,
  captionLayout,
}: {
  value: Date | undefined
  onPick: (day: Date) => void
  minDate?: Date
  maxDate?: Date
  captionLayout: DatePickerProps["captionLayout"]
}) {
  const { locale, direction } = useLocale()
  const calendarLocale = useCalendarLocale(locale)
  const focusDay = React.useContext(DayFocusContext)
  if (calendarLocale === null) return <CalendarLoading />
  return (
    <Calendar
      mode="single"
      selected={value}
      // The day picked again stays picked.
      onSelect={(_, day) => onPick(day)}
      defaultMonth={openingMonth(value, minDate, maxDate)}
      captionLayout={captionLayout}
      locale={calendarLocale}
      dir={direction}
      autoFocus={focusDay}
      {...calendarBounds(minDate, maxDate)}
    />
  )
}

/** Local midnight `days` days from today. */
function daysFromToday(days: number) {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
}

/** The range each named preset picks, as of now. */
const PRESET_RANGES: Record<DateRangePresetName, () => Required<DateRange>> = {
  today: () => ({ from: daysFromToday(0), to: daysFromToday(0) }),
  yesterday: () => ({ from: daysFromToday(-1), to: daysFromToday(-1) }),
  last7Days: () => ({ from: daysFromToday(-6), to: daysFromToday(0) }),
  last30Days: () => ({ from: daysFromToday(-29), to: daysFromToday(0) }),
  thisMonth: () => {
    const today = new Date()
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    }
  },
  lastMonth: () => {
    const today = new Date()
    return {
      from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      to: new Date(today.getFullYear(), today.getMonth(), 0),
    }
  },
}

/**
 * The calendar of a range: the first day picked starts a new range, the
 * second ends it (in either order), then `onPick`.
 */
function RangeCalendar({
  value,
  onPick,
  numberOfMonths,
  presets,
  minDate,
  maxDate,
}: {
  value: DateRange | undefined
  onPick: (range: Required<DateRange>) => void
  numberOfMonths: number
  presets?: DateRangePickerProps["presets"]
  minDate?: Date
  maxDate?: Date
}) {
  const t = useTranslations("datePicker")
  const { locale, direction } = useLocale()
  const calendarLocale = useCalendarLocale(locale)
  const [start, setStart] = React.useState<Date | null>(null)
  const focusDay = React.useContext(DayFocusContext)
  if (calendarLocale === null)
    return <CalendarLoading numberOfMonths={numberOfMonths} />
  const selected = start
    ? { from: start, to: undefined }
    : value?.from
      ? { from: value.from, to: value.to }
      : undefined
  return (
    <>
      <Calendar
        mode="range"
        selected={selected}
        onSelect={(_, day) => {
          if (!start) return setStart(day)
          setStart(null)
          onPick(
            day < start ? { from: day, to: start } : { from: start, to: day }
          )
        }}
        defaultMonth={openingMonth(value?.from ?? value?.to, minDate, maxDate)}
        numberOfMonths={numberOfMonths}
        locale={calendarLocale}
        dir={direction}
        autoFocus={focusDay}
        {...calendarBounds(minDate, maxDate)}
      />
      {presets?.length ? (
        <div
          role="group"
          aria-label={t("presets")}
          data-slot="date-range-picker-presets"
          className="flex w-0 min-w-full flex-wrap gap-2 border-t p-3"
        >
          {presets.map((preset) => {
            const named = typeof preset === "string"
            return (
              <Button
                key={named ? preset : preset.label}
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const range = named ? PRESET_RANGES[preset]() : preset.value
                  onPick({ from: range.from!, to: range.to! })
                }}
              >
                {named ? t(preset) : preset.label}
              </Button>
            )
          })}
        </div>
      ) : null}
    </>
  )
}

export { DayFocusContext, RangeCalendar, SingleCalendar }
