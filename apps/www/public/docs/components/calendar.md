# Calendar

A calendar component that allows users to select a date or a range of dates.

Source: /docs/components/calendar.md  
React Aria docs: https://react-aria.adobe.com/Calendar  
React Aria API: https://react-aria.adobe.com/Calendar#api

**Example — `calendar-demo`**

```tsx
"use client"

import * as React from "react"
import {
  getLocalTimeZone,
  today,
  type CalendarDate,
} from "@internationalized/date"

import { Calendar } from "@tecton/react/components/calendar"

export default function CalendarDemo() {
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    today(getLocalTimeZone())
  )

  return (
    <Calendar
      value={date}
      onChange={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  )
}
```

## Usage

```tsx showLineNumbers
import {
  getLocalTimeZone,
  today,
  type CalendarDate,
} from "@internationalized/date"

import { Calendar } from "@tecton/react/components/calendar"
```

```tsx showLineNumbers
const [date, setDate] = React.useState<CalendarDate | null>(
  today(getLocalTimeZone())
)

return (
  <Calendar value={date} onChange={setDate} className="rounded-lg border" />
)
```

See the [React Aria](https://react-aria.adobe.com/Calendar) documentation for more information.

## Date Picker

You can use the `<Calendar>` component to build a date picker. See the [Date Picker](/docs/components/date-picker.md) page for more information.

## Basic

A basic calendar component. We used `className="rounded-lg border"` to style the calendar.

**Example — `calendar-basic`**

```tsx
"use client"

import { Calendar } from "@tecton/react/components/calendar"

export default function CalendarBasic() {
  return <Calendar className="rounded-lg border" />
}
```

## Range Calendar

Use the `RangeCalendar` component to enable range selection.

**Example — `calendar-range`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate } from "@internationalized/date"
import { type DateRange } from "react-aria-components"

import { RangeCalendar } from "@tecton/react/components/calendar"

export function CalendarRange() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    start: new CalendarDate(new Date().getFullYear(), 1, 12),
    end: new CalendarDate(new Date().getFullYear(), 1, 12).add({ days: 30 }),
  })

  return (
    <RangeCalendar
      value={dateRange}
      onChange={setDateRange}
      numberOfMonths={2}
      className="rounded-lg border"
    />
  )
}
```

## Month and Year Selector

Use `captionLayout="dropdown"` to show month and year dropdowns.

**Example — `calendar-caption`**

```tsx
"use client"

import { Calendar } from "@tecton/react/components/calendar"

export function CalendarCaption() {
  return <Calendar captionLayout="dropdown" className="rounded-lg border" />
}
```

## Presets

**Example — `calendar-presets`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Card, CardContent, CardFooter } from "@tecton/react/components/card"

export function CalendarWithPresets() {
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    new CalendarDate(new Date().getFullYear(), 2, 12)
  )
  const [currentMonth, setCurrentMonth] = React.useState<CalendarDate>(
    new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  )

  return (
    <Card className="mx-auto w-fit max-w-[300px]" size="sm">
      <CardContent>
        <Calendar
          value={date}
          onChange={setDate}
          focusedValue={currentMonth}
          onFocusChange={setCurrentMonth}
          weeksInMonth={6}
          className="p-0 [--cell-size:--spacing(9.5)]"
        />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        {[
          { label: "Today", value: 0 },
          { label: "Tomorrow", value: 1 },
          { label: "In 3 days", value: 3 },
          { label: "In a week", value: 7 },
          { label: "In 2 weeks", value: 14 },
        ].map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            size="sm"
            className="flex-1"
            onPress={() => {
              const newDate = today(getLocalTimeZone()).add({
                days: preset.value,
              })
              setDate(newDate)
              setCurrentMonth(newDate)
            }}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}
```

## Date and Time Picker

**Example — `calendar-time`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate } from "@internationalized/date"
import { Clock2Icon } from "lucide-react"

import { Calendar } from "@tecton/react/components/calendar"
import { Card, CardContent, CardFooter } from "@tecton/react/components/card"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"

export function CalendarWithTime() {
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, 12)
  )

  return (
    <Card size="sm" className="mx-auto w-fit">
      <CardContent>
        <Calendar value={date} onChange={setDate} className="p-0" />
      </CardContent>
      <CardFooter className="border-t bg-card">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-from"
                type="time"
                step="1"
                defaultValue="10:30:00"
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="time-to">End Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-to"
                type="time"
                step="1"
                defaultValue="12:30:00"
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </CardFooter>
    </Card>
  )
}
```

## Booked dates

**Example — `calendar-booked-dates`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate, isSameDay } from "@internationalized/date"

import { Calendar } from "@tecton/react/components/calendar"
import { Card, CardContent } from "@tecton/react/components/card"

export function CalendarBookedDates() {
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    new CalendarDate(new Date().getFullYear(), 2, 3)
  )
  const bookedDates = Array.from(
    { length: 15 },
    (_, i) => new CalendarDate(new Date().getFullYear(), 2, 12 + i)
  )

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          value={date}
          onChange={setDate}
          isDateUnavailable={(date) =>
            bookedDates.some((d) => isSameDay(date, d))
          }
        />
      </CardContent>
    </Card>
  )
}
```

## Custom Cell Size

**Example — `calendar-custom-days`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate, isWeekend } from "@internationalized/date"
import { useLocale, type DateRange } from "react-aria-components"

import { RangeCalendar } from "@tecton/react/components/calendar"
import { Card, CardContent } from "@tecton/react/components/card"

export function CalendarCustomDays() {
  const { locale } = useLocale()
  const [range, setRange] = React.useState<DateRange | undefined>({
    start: new CalendarDate(new Date().getFullYear(), 12, 8),
    end: new CalendarDate(new Date().getFullYear(), 12, 8).add({ days: 10 }),
  })

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <RangeCalendar
          value={range}
          onChange={setRange}
          numberOfMonths={1}
          captionLayout="dropdown"
          className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
          headerFormat={{ month: "long" }}
          renderCell={({ isOutsideMonth, date, defaultChildren }) => (
            <>
              {defaultChildren}
              {!isOutsideMonth && (
                <span>{isWeekend(date, locale) ? "$120" : "$100"}</span>
              )}
            </>
          )}
        />
      </CardContent>
    </Card>
  )
}
```

You can customize the size of calendar cells using the `--cell-size` CSS variable. You can also make it responsive by using breakpoint-specific values:

```tsx showLineNumbers
<Calendar
  value={date}
  onChange={setDate}
  className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
/>
```

Or use fixed values:

```tsx showLineNumbers
<Calendar
  value={date}
  onChange={setDate}
  className="rounded-lg border [--cell-size:2.75rem] md:[--cell-size:3rem]"
/>
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

See also the [International Calendars Guide](#international-calendars) for enabling the international calendars such as Persian / Hijri / Jalali.

**Example — `calendar-rtl`**

```tsx
"use client"

import * as React from "react"
import {
  getLocalTimeZone,
  today,
  type CalendarDate,
} from "@internationalized/date"
import { I18nProvider } from "react-aria-components"

import { Calendar } from "@tecton/react/components/calendar"

export function CalendarRtl() {
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    today(getLocalTimeZone())
  )

  return (
    <I18nProvider locale="ar">
      <Calendar
        value={date}
        onChange={setDate}
        className="rounded-lg border [--cell-size:--spacing(9)]"
        captionLayout="dropdown"
      />
    </I18nProvider>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Calendar) documentation for more information on the `Calendar` component.
