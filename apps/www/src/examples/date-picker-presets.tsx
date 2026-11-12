"use client"

import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import { DateRangePicker } from "@tecton/react/tecton/date-picker"

export default function DatePickerPresets() {
  // Production is reported up to yesterday: "Today" is disabled.
  const [yesterday] = React.useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  })

  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-presets">Production period</FieldLabel>
      <DateRangePicker
        id="date-picker-presets"
        className="w-full"
        maxDate={yesterday}
        presets={["today", "yesterday", "last7Days", "last30Days"]}
      />
    </Field>
  )
}
