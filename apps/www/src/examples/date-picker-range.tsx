"use client"

import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/field"
import { DateRangePicker, type DateRange } from "@tecton/react/date-picker"

export default function DatePickerRange() {
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const year = new Date().getFullYear()
    return { from: new Date(year, 0, 20), to: new Date(year, 1, 9) }
  })

  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-range">Reporting period</FieldLabel>
      <DateRangePicker
        id="date-picker-range"
        value={range}
        onValueChange={setRange}
        className="w-full"
      />
    </Field>
  )
}
