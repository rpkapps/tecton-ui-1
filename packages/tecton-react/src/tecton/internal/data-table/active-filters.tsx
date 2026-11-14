"use client"

/**
 * `DataTableActiveFilters`: the search and each filter in effect as a
 * removable chip ("Status: Producing, Drilling"), in a `ChipGroup` named
 * "Active filters", then "Clear all". It renders nothing while there is
 * neither (and, with a warning in development, without `filterable`).
 *
 * The chips are a grid of their own (arrow keys between them; Delete,
 * Backspace or a chip's remove button removes it). A removed chip leaves
 * focus on the chip now in its place, as the group does; when the last one
 * goes, and with "Clear all", the part itself goes, and focus moves to the
 * table.
 */
import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/button"
import { Chip, ChipGroup, ChipList } from "@tecton/react/chip"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import {
  getColumnModel,
  setFilter,
  setSearch,
  type DataTableView,
} from "./engine/index"
import { filterText } from "./filter-text"
import { viewChangeReason } from "./view-reason"

type DataTableActiveFiltersProps = Omit<React.ComponentProps<"div">, "children">

/** The chips' values: the search's, and a column filter's by its id. */
const SEARCH = "search"
const filterChip = (column: string) => `filter:${column}`

function DataTableActiveFilters({
  className,
  ...props
}: DataTableActiveFiltersProps) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableActiveFilters")
  const { actions } = context
  const filterable = useDataTableSelector(
    context,
    (state) => state.options.filterable
  )
  const search = useDataTableSelector(context, (state) =>
    state.view.search.trim()
  )
  const filters = useDataTableSelector(context, (state) => state.view.filters)
  const columns = useDataTableSelector(context, (state) => state.columns)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  useFeatureWarning(
    context,
    !filterable,
    "DataTableActiveFilters",
    "`filterable`"
  )
  if (!filterable) return null

  const { byId } = getColumnModel(columns)
  const chips: Array<{ value: string; label: string }> = []
  if (search !== "")
    chips.push({
      value: SEARCH,
      label: t("filterChip", { columnName: t("searchChip"), value: search }),
    })
  for (const [id, value] of Object.entries(filters)) {
    const column = byId.get(id)
    if (!column) continue
    const text = filterText(column, value, formatter, t)
    chips.push({
      value: filterChip(id),
      label: text
        ? t("filterChip", { columnName: column.header, value: text })
        : column.header,
    })
  }
  if (chips.length === 0) return null

  const remove = (values: ReadonlyArray<string>) => {
    const gone = new Set(values)
    // Every chip going: the part goes too, and focus goes to the table.
    const last = chips.every((chip) => gone.has(chip.value))
    const applied = actions.updateView(
      (view) =>
        values.reduce<DataTableView>(
          (next, value) =>
            value === SEARCH
              ? setSearch(next, "")
              : setFilter(next, value.slice("filter:".length), null),
          view
        ),
      viewChangeReason
    )
    if (applied && last) actions.focusTable(true)
  }
  return (
    <div
      data-slot="data-table-active-filters"
      // The chips wrap in their own column; "Clear all" stays beside them.
      className={cn("flex items-start gap-2", className)}
      {...props}
    >
      <ChipGroup
        aria-label={t("activeFilters")}
        onRemove={remove}
        className="min-w-0 py-1.5"
      >
        <ChipList>
          {chips.map((chip) => (
            <Chip key={chip.value} value={chip.value} label={chip.label}>
              <span className="max-w-60 truncate">{chip.label}</span>
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={(event) => {
          if (actions.clearFilters(event.nativeEvent)) actions.focusTable(true)
        }}
      >
        {t("clearAll")}
      </Button>
    </div>
  )
}

export { DataTableActiveFilters }
export type { DataTableActiveFiltersProps }
