"use client"

/**
 * Internal to `@tecton/react`: a calendar's place while its locale (or, in
 * a DataTable date filter, its code) loads — a spinner in a box as big as
 * `numberOfMonths` months of five weeks, side by side from `md` up and
 * stacked below it, as the `Calendar` lays them out. Kept apart from the
 * calendars (`date-calendar.tsx`) so a part that loads them on demand can
 * show it first. Without `spinner`, the box only: the place of a calendar
 * that is about to render (a frame or two), not one that is loading.
 */
import * as React from "react"

import { Spinner } from "@tecton/react/spinner"

function CalendarLoading({
  numberOfMonths = 1,
  spinner = true,
}: {
  numberOfMonths?: number
  spinner?: boolean
}) {
  return (
    <div
      data-slot="date-picker-loading"
      // A month is 14rem by 16.5rem, 1rem from the next, in the calendar's
      // 0.75rem padding: one month is 15.5rem wide and, as it renders side
      // by side, 18rem and 2px high (the box takes its exact place: a
      // DataTable date filter shows it for the frames before the calendar).
      style={{ "--months": numberOfMonths } as React.CSSProperties}
      className="flex h-[calc(var(--months)*17.5rem+0.5rem)] w-62 items-center justify-center md:h-[calc(18rem+2px)] md:w-[calc(var(--months)*15rem+0.5rem)]"
    >
      {spinner && <Spinner className="text-muted-foreground" />}
    </div>
  )
}

export { CalendarLoading }
