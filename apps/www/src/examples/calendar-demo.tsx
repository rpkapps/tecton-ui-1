// Synced from shadcn/ui (apps/v4/examples/aria/calendar-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
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
