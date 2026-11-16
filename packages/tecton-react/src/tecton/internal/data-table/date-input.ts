"use client"

/**
 * A date filter's calendar, loaded on demand (`lazy.ts`): `DateRangePicker`'s
 * (`date-calendar.tsx`), for `DataTableFilter`'s date columns and the query
 * language's dates.
 */
import type * as DateCalendar from "../date-calendar"
import { feature } from "./lazy"

/** The calendar's module, once loaded. */
type DateInputModule = typeof DateCalendar

const DATE_INPUT = feature<DateInputModule>(() => import("../date-calendar"))

export { DATE_INPUT }
export type { DateInputModule }
