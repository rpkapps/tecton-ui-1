"use client"

import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/field"
import { DatePicker } from "@tecton/react/date-picker"

export default function DatePickerDob() {
  const [today] = React.useState(() => new Date())

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date-picker-dob">Date of birth</FieldLabel>
      <DatePicker
        id="date-picker-dob"
        className="w-full"
        captionLayout="dropdown"
        maxDate={today}
        placeholder="Select date"
      />
    </Field>
  )
}
