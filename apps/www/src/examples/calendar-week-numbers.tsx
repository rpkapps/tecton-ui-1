// Synced from shadcn/ui (apps/v4/examples/base/calendar-week-numbers.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"

import { Calendar } from "@tecton/react/components/calendar"
import { Card, CardContent } from "@tecton/react/components/card"

export function CalendarWeekNumbers() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 12)
  )

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          mode="single"
          defaultMonth={date}
          selected={date}
          onSelect={setDate}
          showWeekNumber
        />
      </CardContent>
    </Card>
  )
}
