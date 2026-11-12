"use client"

import * as React from "react"

import { DatePicker } from "@tecton/react/tecton/date-picker"

export default function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return <DatePicker value={date} onValueChange={setDate} />
}
