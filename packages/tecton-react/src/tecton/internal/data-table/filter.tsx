"use client"

/**
 * `DataTableFilter column="…"`: an outline button named after the column
 * that opens a popover with the column's filter, by its type (§4.1), with
 * `filterable` on (`filter-popover.tsx`: text, number, date, Yes / No,
 * options with their counts).
 *
 * The button shows the filter's value while one is set ("Status ·
 * Producing, Drilling"). The button is a plain one for its whole life; the
 * popover's code loads on demand, in idle time once the button is shown or
 * as it is pointed at or focused, and a press made before it is there opens
 * the popover once it is (`lazy-popup.ts`). A date column's
 * button asks for the calendar too. A column that opts out (`filterable:
 * false`), an unknown column, or a table without `filterable` renders
 * nothing, with a warning in development.
 */
import * as React from "react"
import { ListFilterIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

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
import type { SetColumnFilter } from "./filter-popover"
import { filterText } from "./filter-text"
import { loadFeature, usePrefetchFeatures } from "./lazy"
import { mergeButtonProps, useLazyPopup } from "./lazy-popup"
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
const FILTERS = ["filters"] as const
const DATE_FILTERS = ["filters", "dateInput"] as const

/** Asks for a date filter's calendar with its popover. */
const loadCalendar = () => {
  loadFeature("dateInput").catch(() => undefined)
}

function DataTableFilter({
  column: columnId,
  children,
  variant = "outline",
  size = "sm",
  className,
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
  usePrefetchFeatures(off ? NO_FEATURES : date ? DATE_FILTERS : FILTERS)
  const lazy = useLazyPopup("filters", {
    on: !off,
    popup: "dialog",
    also: date ? loadCalendar : undefined,
  })
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
  const Popover = lazy.module?.DataTableFilterPopover
  return (
    <>
      <DataTableToolbarItem
        value={`data-table-filter:${column.id}`}
        label={t("filterBy", { columnName })}
        icon={<ListFilterIcon aria-hidden />}
        open={lazy.openBy}
      >
        <Button
          data-slot="data-table-filter"
          data-active={value ? "" : undefined}
          {...mergeButtonProps(trigger, lazy.buttonProps)}
        >
          {content}
        </Button>
      </DataTableToolbarItem>
      {lazy.mounted && Popover && (
        <Popover
          context={context}
          column={column}
          value={value}
          set={set}
          popup={lazy.popupProps}
        />
      )}
    </>
  )
}

export { DataTableFilter }
export type { DataTableFilterProps }
