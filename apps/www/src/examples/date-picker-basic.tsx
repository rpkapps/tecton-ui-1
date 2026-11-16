"use client"

import { Field, FieldLabel } from "@tecton/react/field"
import { DatePicker } from "@tecton/react/date-picker"

export default function DatePickerBasic() {
  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date-picker-basic">Date</FieldLabel>
      <DatePicker id="date-picker-basic" className="w-full" />
    </Field>
  )
}
