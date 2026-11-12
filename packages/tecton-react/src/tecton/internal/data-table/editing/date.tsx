"use client"

/**
 * The date editor's calendar popover, loaded on demand (`lazy.ts`, the
 * `editingDate` feature) apart from the other editors, only for a table
 * with a date column that can be written; the calendar in it is the date
 * filter's (`dateInput`). It opens from the cell (Alt + Down, the
 * editor's button), its day focused. Keys out of it:
 *
 * - a day picked (Enter, Space, a click) is saved, keeping the value's
 *   time of day in the column's time zone, and focus is back on the cell;
 * - Tab and Shift + Tab save the field's text and move, as in the field;
 * - Escape closes it, back to the field;
 * - a press outside it saves, as focus leaving the editor does, and focus
 *   goes back to the cell when it was in the editor.
 */
import * as React from "react"

import { Popover, PopoverContent } from "@tecton/react/components/popover"
import { useDirection, useLocale } from "@tecton/react/tecton/provider"

import { useTranslations } from "../../i18n/translations"
import { CalendarPlaceholder } from "../calendar-placeholder"
import { dayOf, startOfDay, toDate } from "../engine/values"
import { useFeature } from "../lazy"
import { keyMove, runKey, type EditorParts } from "./parts"

function DatePopup({
  session,
  column,
  item,
  target,
  cell,
  draft,
  open,
  onOpenChange,
}: Pick<EditorParts, "session" | "column" | "item" | "target" | "cell"> & {
  /** The field's text: the day it shows is the calendar's. */
  draft: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const direction = useDirection()
  const { module, load } = useFeature("dateInput", true)
  React.useEffect(() => {
    if (open && !module) load()
  }, [open, module, load])
  const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
  const { controller } = session
  const parsed = controller.parse(column, item, draft)
  const date = "value" in parsed ? toDate(parsed.value) : undefined
  const shown = date && dayOf(date, timeZone)
  const pick = (day: Date) => {
    const start = startOfDay(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      timeZone
    )
    // The time of day of the value before (its draft's, else its own).
    const before = date ?? toDate(column.getValue(item))
    const own = before && dayOf(before, timeZone)
    const time = own
      ? before.getTime() -
        startOfDay(own.year, own.month, own.day, timeZone).getTime()
      : 0
    const value = new Date(start.getTime() + time)
    controller.finish(session, { commit: true, draft: { value } })
  }
  const DateCalendar = module?.DateCalendar
  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        // A press outside: the edit is saved, as focus leaving it is.
        if (!next && details.reason === "outside-press")
          controller.finish(session, {
            commit: true,
            markInvalid: true,
            event: details.event,
          })
        else onOpenChange(next)
      }}
    >
      <PopoverContent
        anchor={cell}
        align="start"
        aria-label={t("chooseDate")}
        // The calendar focuses its day itself; closing, back to the field.
        initialFocus={false}
        finalFocus={target}
        className="w-auto"
        onKeyDown={(event) => {
          // Tab saves and moves as in the field; Escape is the popover's.
          if (event.key !== "Tab") return
          const move = keyMove(event, false)
          if (move) runKey(session, event, move)
        }}
      >
        {DateCalendar ? (
          <DateCalendar
            value={shown && new Date(shown.year, shown.month, shown.day)}
            onValueChange={pick}
            locale={locale}
            dir={direction}
            fallback={<CalendarPlaceholder />}
          />
        ) : (
          <CalendarPlaceholder />
        )}
      </PopoverContent>
    </Popover>
  )
}

export { DatePopup }
