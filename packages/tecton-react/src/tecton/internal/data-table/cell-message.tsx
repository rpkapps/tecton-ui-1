"use client"

/**
 * How the cells written show their marks (`CellWriter`): loaded with the
 * code that writes (`cell-write.ts`), which puts it in the cells' store
 * with the first mark it sets, so the rows have it whenever a cell has a
 * mark, and nothing of it loads up front.
 *
 * - A message (not valid, not saved) holds while the cell's value is one
 *   it was given for (`shownMark`): once the value changes from outside,
 *   it is gone. `clearMessages` removes them all (a write in progress
 *   stays).
 * - A cell's message is its description, read by screen readers with the
 *   cell, and a tooltip shows it (`cell-error.tsx`, loaded when one first
 *   shows).
 */
import * as React from "react"

import { useTranslations } from "../i18n/translations"
import type { Store } from "../store"
import type { CellMark, CellsState, CellWriter } from "./context"
import type { DataTableValue } from "./engine/types"
import { isEmptyValue } from "./engine/values"
import { useFeature } from "./lazy"

/** Whether two values are the same cell value (empty ones all alike, dates by time). */
function sameValue(a: DataTableValue, b: DataTableValue) {
  if (isEmptyValue(a) && isEmptyValue(b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return Object.is(a, b)
}

/** A cell's mark as it shows with the cell's value now (see the module comment). */
function shownMark(mark: CellMark | undefined, value: DataTableValue) {
  if (!mark?.error) return mark
  if (mark.values.some((held) => sameValue(held, value))) return mark
  return mark.pending === null ? undefined : { ...mark, error: null }
}

/** Removes every message; the writes still saving keep their marks. */
function clearMessages(cells: Store<CellsState>) {
  const marks = new Map<string, ReadonlyMap<string, CellMark>>()
  for (const [row, own] of cells.get().marks) {
    const kept = new Map([...own].filter(([, mark]) => mark.pending !== null))
    if (kept.size) marks.set(row, kept)
  }
  cells.set({ marks })
}

/** A cell's message as its description, and the tooltip that shows it. */
function CellMessage({
  message,
  attempted,
}: {
  message: string
  /** What was written, shown before the message. */
  attempted: string | null
}) {
  const t = useTranslations("dataTable")
  const text = attempted
    ? t("refusedValue", { value: attempted, message })
    : message
  const id = React.useId()
  const element = React.useRef<HTMLSpanElement | null>(null)
  const { module, load } = useFeature("cellError", true)
  React.useEffect(() => {
    load()
    // The cell is the row's plain element: described from here.
    const cell = element.current?.closest("td, th")
    if (!cell) return
    cell.setAttribute("aria-describedby", id)
    return () => cell.removeAttribute("aria-describedby")
  }, [id, load])
  const Tip = module?.DataTableCellErrorTip
  return (
    <>
      <span ref={element} id={id} hidden>
        {text}
      </span>
      {Tip && <Tip message={text} cell={element} />}
    </>
  )
}

const WRITER: CellWriter = {
  shownMark,
  Message: CellMessage,
  clearMessages,
}

export { sameValue, shownMark, WRITER }
