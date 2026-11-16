"use client"

import { Field, FieldGroup, FieldLabel } from "@tecton/react/field"
import { Input } from "@tecton/react/input"
import { DatePicker } from "@tecton/react/date-picker"

export default function DatePickerTime() {
  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-time-date">Date</FieldLabel>
        <DatePicker
          id="date-picker-time-date"
          className="w-32"
          captionLayout="dropdown"
          placeholder="Select date"
          format={{ dateStyle: "medium" }}
        />
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="date-picker-time-time">Time</FieldLabel>
        <Input
          type="time"
          id="date-picker-time-time"
          step="1"
          defaultValue="10:30:00"
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  )
}
