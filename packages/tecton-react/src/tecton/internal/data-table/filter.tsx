"use client"

/**
 * `DataTableFilter column="…"`: an outline button named after the column
 * that opens a popover with the column's filter, by its type (§4.1), with
 * `filterable` on (`filter-popover.tsx`: text, number, date, Yes / No,
 * options with their counts).
 *
 * The button shows the filter's value while one is set ("Status ·
 * Producing, Drilling"). The button is the popover's own trigger, as on a
 * `Popover` (`part-popup.ts`), and the popover's content renders only
 * while it is open. A date column's calendar loads on demand: in idle time
 * once the button is shown, or as it is pointed at or focused. A column
 * that opts out (`filterable: false`), an unknown column, or a table
 * without `filterable` renders nothing, with a warning in development.
 */
import * as React from "react"
import { ListFilterIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import {
  getColumnModel,
  sameFilterValue,
  setFilter,
  type DataTableFilterValue,
} from "./engine/index"
import { DataTableFilterPopover, type SetColumnFilter } from "./filter-popover"
import { filterText } from "./filter-text"
import { loadFeature, usePrefetchFeatures } from "./lazy"
import { usePartPopup } from "./part-popup"
import { DataTableToolbarItem } from "./toolbar"
import { DataTableTriggerSummary } from "./trigger-summary"

type DataTableFilterProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The id of the column to filter. */
  column: string
  /** The button's content: the column's header (and the filter's value) by default. */
  children?: React.ReactNode
}

const NO_FEATURES = [] as const
const DATE_FILTERS = ["dateInput"] as const

/** Asks for a date filter's calendar before its popover opens. */
const loadCalendar = () => {
  loadFeature("dateInput").catch(() => undefined)
}

function DataTableFilter({
  column: columnId,
  children,
  variant = "outline",
  size = "sm",
  className,
  onPointerEnter,
  onFocus,
  ...props
}: DataTableFilterProps) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableFilter")
  const { actions } = context
  const filterable = useDataTableSelector(
    context,
    (state) => state.options.filterable
  )
  const columns = useDataTableSelector(context, (state) => state.columns)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  const value = useDataTableSelector(
    context,
    (state) => state.view.filters[columnId] as DataTableFilterValue | undefined
  )
  const column = getColumnModel(columns).byId.get(columnId)
  const off = !filterable || !column?.filterable
  useFeatureWarning(
    context,
    off,
    "DataTableFilter",
    filterable
      ? `a filter on "${columnId}" (no such column, or it has \`filterable: false\`)`
      : "`filterable`"
  )
  const date = column?.type === "date"
  usePrefetchFeatures(!off && date ? DATE_FILTERS : NO_FEATURES)
  const popup = usePartPopup()
  const summaryId = React.useId()
  if (off) return null

  const set: SetColumnFilter = (next) => {
    if (
      actions.updateView((view) => setFilter(view, column.id, next), "filter")
    )
      return true
    // No change is not a refusal: the view holds that filter already.
    const current = actions.currentView().filters[column.id] as
      DataTableFilterValue | undefined
    return current && next ? sameFilterValue(current, next) : !current && !next
  }
  const summary = value
    ? filterText(column, value, formatter, t, { short: true })
    : null
  const columnName = column.header
  const trigger: React.ComponentProps<typeof Button> = {
    variant,
    size,
    // Named and described by the default content only: children of the
    // caller's name the button themselves.
    "aria-label": children ? undefined : t("filterBy", { columnName }),
    "aria-describedby": !children && summary ? summaryId : undefined,
    className,
    // A date filter's calendar, asked for before the press.
    onPointerEnter: (event) => {
      onPointerEnter?.(event)
      if (date) loadCalendar()
    },
    onFocus: (event) => {
      onFocus?.(event)
      if (date) loadCalendar()
    },
    ...props,
  }
  const content = children ?? (
    <>
      <ListFilterIcon aria-hidden />
      {columnName}
      {summary && (
        <DataTableTriggerSummary id={summaryId}>
          {summary}
        </DataTableTriggerSummary>
      )}
    </>
  )
  return (
    <DataTableToolbarItem
      value={`data-table-filter:${column.id}`}
      label={t("filterBy", { columnName })}
      icon={<ListFilterIcon aria-hidden />}
      open={popup.openBy}
    >
      <Popover {...popup.root}>
        <PopoverTrigger
          ref={popup.trigger}
          data-slot="data-table-filter"
          data-active={value ? "" : undefined}
          render={<Button {...trigger} />}
        >
          {content}
        </PopoverTrigger>
        <DataTableFilterPopover
          context={context}
          column={column}
          value={value}
          set={set}
          popup={popup}
        />
      </Popover>
    </DataTableToolbarItem>
  )
}

export { DataTableFilter }
export type { DataTableFilterProps }
