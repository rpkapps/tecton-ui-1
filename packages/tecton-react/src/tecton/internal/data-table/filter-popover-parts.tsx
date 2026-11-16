"use client"

/**
 * What `DataTableFilter`'s popover (`filter-popover.tsx`) and its filters
 * share: the props every filter takes, a choice's checkbox row (an
 * options or yes / no filter's choices, and every filter's "No value"),
 * the line under a filter of ranges that says how many more it has, and
 * how many rows a text or number filter keeps as it is typed.
 */
import * as React from "react"
import { cn } from "cn"

import { Checkbox } from "@tecton/react/checkbox"
import { Label } from "@tecton/react/label"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import { getMatchCounts, type MatchCounts } from "./engine/facets"
import type { DataTableFilterValue, EngineColumn } from "./engine/index"
import { sameFilterValue } from "./engine/view"

/** Sets the column's filter; `null` removes it. Whether the view took it. */
type SetColumnFilter = (value: DataTableFilterValue | null) => boolean

/** What every filter of the popover takes; `value` is the column's filter, of its type. */
type FilterProps<TValue extends DataTableFilterValue> = {
  context: DataTableContextValue<unknown>
  column: EngineColumn<unknown>
  value: TValue | undefined
  set: SetColumnFilter
  /** The table's `searchDelay`: how long typed text and numbers wait. */
  delay: number
  /** The table's count of clears (`DataTableState.clears`). */
  clears: number
  /** The filter offers "No value". */
  noValue: boolean
  /** Opened from the keyboard: a date filter's calendar focuses its day. */
  keyboard: boolean
  /** A filter is set, of whatever type (a date filter's Clear shows). */
  active: boolean
  /** Closes the popover: a date filter's, once its range is picked. */
  close: () => void
  /** Clears the filter: a date filter's own Clear, under its calendar. */
  clear: () => void
}

/** Whether two filters, either unset (`null`), are the same. */
const sameFilter = (
  a: DataTableFilterValue | null,
  b: DataTableFilterValue | null
) => (a && b ? sameFilterValue(a, b) : a === b)

/**
 * A choice of a filter: a checkbox, its label and its number of rows when
 * `count` is known. `slot` names it (`data-slot`).
 */
function ChoiceRow({
  label,
  checked,
  onCheckedChange,
  count,
  className,
  slot,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  count?: number
  className?: string
  slot?: string
}) {
  const format = useNumberFormat()
  const id = React.useId()
  return (
    <div
      data-slot={slot}
      className={cn("flex min-h-8 items-center gap-2", className)}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="flex-1 font-normal">
        {label}
      </Label>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format.format(count)}
        </span>
      )}
    </div>
  )
}

/** A filter's "No value" choice. */
function NoValueChoice(
  props: Omit<React.ComponentProps<typeof ChoiceRow>, "label" | "slot">
) {
  const t = useTranslations("dataTable")
  return (
    <ChoiceRow
      {...props}
      label={t("noValue")}
      slot="data-table-filter-no-value"
    />
  )
}

/**
 * The muted line under a number or date filter that edits the first of
 * its ranges: how many more it has, which Clear removes.
 */
function MoreRanges({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  if (count <= 0) return null
  return (
    <p
      data-slot="data-table-filter-more-ranges"
      className={cn("text-xs text-muted-foreground", className)}
    >
      {t("filterMoreRanges", { count, total: format.format(count) })}
    </p>
  )
}

/**
 * A text or number column's matches (`getMatchCounts`), counted once the
 * popover is open, for this view; `null` in server mode.
 */
function useMatchCounts(
  context: DataTableContextValue<unknown>,
  column: EngineColumn<unknown>
) {
  const model = useDataTableSelector(context, (state) => state.model)
  return React.useMemo(() => getMatchCounts(model, column.id), [model, column])
}

/**
 * Under a text or number filter: its "No value", and "12 of 120 match" (of
 * the rows the search and the other filters keep, those `filter` keeps
 * too, as it is typed; `matches` is `null` in server mode).
 */
function FilterFooter({
  noValue,
  empty,
  onEmptyChange,
  matches,
  filter,
}: {
  noValue: boolean
  empty: boolean
  onEmptyChange: (empty: boolean) => void
  matches: MatchCounts | null
  filter: DataTableFilterValue | null
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  if (!noValue && !matches) return null
  const count = matches?.count(filter)
  return (
    <div className="flex min-h-8 items-center gap-4">
      {noValue && (
        <NoValueChoice
          className="flex-1"
          checked={empty}
          onCheckedChange={onEmptyChange}
        />
      )}
      {matches && count !== undefined && (
        <p
          data-slot="data-table-filter-matches"
          className="ms-auto text-xs text-muted-foreground tabular-nums"
        >
          {t("filterMatches", {
            count,
            matches: format.format(count),
            total: format.format(matches.total),
          })}
        </p>
      )}
    </div>
  )
}

export {
  ChoiceRow,
  FilterFooter,
  MoreRanges,
  NoValueChoice,
  sameFilter,
  useMatchCounts,
}
export type { FilterProps, SetColumnFilter }
