"use client"

import { Field, FieldLabel } from "@tecton/react/components/field"
import { DateRangePicker } from "@tecton/react/tecton/date-picker"

export default function DatePickerPresets() {
  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-presets">Production period</FieldLabel>
      <DateRangePicker
        id="date-picker-presets"
        className="w-full"
        presets={["today", "yesterday", "last7Days", "last30Days"]}
      />
    </Field>
  )
}
