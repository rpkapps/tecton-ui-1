"use client"

/**
 * `DataTableCellSummary`: the sum, average and count of the numbers in the
 * selected cells (of number columns), and the count of every cell with a
 * value, as a spreadsheet's status bar shows them, formatted as their
 * column (one format shared by the columns the numbers come from, else
 * the locale's). It reads the items, not the DOM: a selection over rows out
 * of view, or on other pages, is counted whole. It renders nothing while
 * no cell is selected.
 *
 * The figures are worked out after the selection is drawn (a deferred
 * render), so extending a large range stays quick. While focus is in the
 * table, they are announced once the selection stops changing, not at
 * every step.
 */
import * as React from "react"
import { cn } from "cn"

import { useTranslations } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
  useNumberFormat,
} from "./context"
import { summarizeCells } from "./engine/cell-ranges"
import type { EngineColumn } from "./engine/index"

/** How long the selection stays the same before its summary is announced. */
const ANNOUNCE_DELAY = 750

/** The format the numbers' columns share, as a column to format them with; else `null`. */
function sharedFormat(columns: ReadonlyArray<EngineColumn<unknown>>) {
  if (columns.length === 0) return null
  const [first] = columns
  const key = JSON.stringify(first.format ?? null)
  return columns.every(
    (column) => JSON.stringify(column.format ?? null) === key
  )
    ? first
    : null
}

function DataTableCellSummary({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const context = useDataTableContext<unknown>("DataTableCellSummary")
  const t = useTranslations("dataTable")
  const numbers = useNumberFormat()
  const mode = useDataTableSelector(
    context,
    (state) => state.options.cellSelectionMode
  )
  const grid = useDataTableSelector(context, (state) => state.cellGrid)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  useFeatureWarning(
    context,
    mode === "none",
    "DataTableCellSummary",
    "cellSelectionMode"
  )
  const deferred = React.useDeferredValue(grid)
  const summary = React.useMemo(
    () => (deferred && deferred.rects.length ? summarizeCells(deferred) : null),
    [deferred]
  )
  const items = React.useMemo(() => {
    if (!summary) return []
    const column = sharedFormat(summary.numberColumns)
    const number = (value: number) =>
      column ? formatter.format(column, value) : numbers.format(value)
    const list: Array<{ key: string; text: string }> = []
    if (summary.sum !== null && summary.average !== null)
      list.push(
        { key: "sum", text: t("summarySum", { value: number(summary.sum) }) },
        {
          key: "average",
          text: t("summaryAverage", { value: number(summary.average) }),
        },
        {
          key: "numeric",
          text: t("summaryNumericCount", {
            value: numbers.format(summary.numericCount),
          }),
        }
      )
    list.push({
      key: "count",
      text: t("summaryCount", { value: numbers.format(summary.count) }),
    })
    return list
  }, [summary, formatter, numbers, t])

  const element = React.useRef<HTMLDivElement | null>(null)
  const spoken = items.map((item) => item.text).join("\u0000")
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!spoken) return
    const timer = setTimeout(() => {
      const root = element.current?.closest('[data-slot="data-table"]')
      if (!root?.contains(root.ownerDocument.activeElement)) return
      announce(
        new Intl.ListFormat(formatter.locale, { type: "unit" }).format(
          spoken.split("\u0000")
        )
      )
    }, ANNOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [spoken, formatter.locale])

  if (mode === "none" || items.length === 0) return null
  return (
    <div
      ref={element}
      role="group"
      aria-label={t("cellSummary")}
      data-slot="data-table-cell-summary"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <span key={item.key}>{item.text}</span>
      ))}
    </div>
  )
}

export { DataTableCellSummary }
