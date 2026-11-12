"use client"

import { Field, FieldLabel } from "@tecton/react/components/field"
import { DatePicker } from "@tecton/react/tecton/date-picker"

export default function DatePickerInput() {
  return (
    <Field className="mx-auto w-48">
      <FieldLabel htmlFor="date-picker-input">Subscription date</FieldLabel>
      <DatePicker
        id="date-picker-input"
        variant="input"
        defaultValue={new Date(2025, 5, 1)}
        className="w-full"
      />
    </Field>
  )
}
