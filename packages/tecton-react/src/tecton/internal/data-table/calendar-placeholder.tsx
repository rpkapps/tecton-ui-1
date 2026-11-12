/**
 * A calendar's place while its code loads (the `dateInput` feature): as big
 * as the calendar, a month of six weeks (`fixedWeeks`), so its popover does
 * not change size. A date filter's and a date editor's.
 */
import { Skeleton } from "@tecton/react/components/skeleton"

function CalendarPlaceholder() {
  return (
    <div aria-hidden className="flex h-[19.125rem] w-56 flex-col gap-4">
      <Skeleton className="mx-auto h-8 w-32" />
      <Skeleton className="flex-1" />
    </div>
  )
}

export { CalendarPlaceholder }
