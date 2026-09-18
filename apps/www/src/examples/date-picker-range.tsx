// Synced from shadcn/ui (apps/v4/examples/aria/date-picker-range.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { CalendarDate, getLocalTimeZone } from "@internationalized/date"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "@tecton/react/primitives"

import { Button } from "@tecton/react/components/button"
import { RangeCalendar } from "@tecton/react/components/calendar"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerWithRange() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    start: new CalendarDate(new Date().getFullYear(), 1, 20),
    end: new CalendarDate(new Date().getFullYear(), 1, 20).add({ days: 20 }),
  })

  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-range">Date Picker Range</FieldLabel>
      <PopoverTrigger>
        <Button
          variant="outline"
          id="date-picker-range"
          className="justify-start px-2.5 font-normal"
        >
          <CalendarIcon data-icon="inline-start" />
          {date?.start && date.end ? (
            new Intl.DateTimeFormat(undefined, {
              dateStyle: "long",
            }).formatRange(
              date.start.toDate(getLocalTimeZone()),
              date.end.toDate(getLocalTimeZone())
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
        <Popover className="w-auto p-0" placement="bottom start">
          <RangeCalendar value={date} onChange={setDate} numberOfMonths={2} />
        </Popover>
      </PopoverTrigger>
    </Field>
  )
}
