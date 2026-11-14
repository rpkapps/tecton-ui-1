"use client"

/**
 * A number filter (`DataTableFilter`'s popover): Min and Max side by side,
 * each a `NumberField` with its minus and plus, and the column's unit on
 * the side the column writes it (`numberUnit`: its `unit`, percent sign or
 * currency), for the filter's first range; its other ranges stay as they
 * are, counted under the fields. Under them, "No value" (as every filter
 * has it) and how many rows the filter keeps, of those the search and the
 * other filters keep, counted as they are typed (not in server mode, where
 * the table holds only the rows loaded).
 */
import * as React from "react"
import { cn } from "cn"

import { Label } from "@tecton/react/label"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldUnit,
} from "@tecton/react/number-field"
import { useLocale } from "@tecton/react/provider"

import { useTranslations } from "../i18n/translations"
import { useDelayedCommit } from "./delayed-commit"
import { listFilter } from "./engine/filter-lists"
import { numberUnit, type DataTableFilterValue } from "./engine/index"
import type { DataTableNumberRange } from "./engine/types"
import {
  FilterFooter,
  MoreRanges,
  sameFilter,
  useMatchCounts,
  type FilterProps,
} from "./filter-popover-parts"

/**
 * A number filter's first range, as its fields hold it (`null`: the field
 * empty), and the filter's other ranges, kept as they are.
 */
type Bounds = {
  min: number | null
  max: number | null
  /** Kept from the view (the search's `>` and `<`) until the bound is edited. */
  minExclusive: boolean
  maxExclusive: boolean
  empty: boolean
  more: ReadonlyArray<DataTableNumberRange>
}

/** The filter of `bounds`, or `null` when they filter nothing. */
function toFilter({
  min,
  max,
  minExclusive,
  maxExclusive,
  empty,
  more,
}: Bounds): DataTableFilterValue | null {
  const edited: DataTableNumberRange = {
    ...(min === null ? {} : { min }),
    ...(max === null ? {} : { max }),
    ...(min !== null && minExclusive ? { minExclusive: true } : {}),
    ...(max !== null && maxExclusive ? { maxExclusive: true } : {}),
  }
  return listFilter(
    "number",
    min === null && max === null ? more : [edited, ...more],
    empty
  )
}

function NumberFilter({
  context,
  column,
  value,
  set,
  delay,
  clears,
  noValue,
}: FilterProps<Extract<DataTableFilterValue, { type: "number" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const matches = useMatchCounts(context, column)
  // The view's filter as a draft, made again only when the view changes.
  const viewBounds = React.useMemo((): Bounds => {
    const ranges = value?.ranges ?? []
    // None when the filter has no range.
    const first = ranges.at(0)
    return {
      min: first?.min ?? null,
      max: first?.max ?? null,
      minExclusive: first?.minExclusive === true,
      maxExclusive: first?.maxExclusive === true,
      empty: value?.empty === true,
      more: ranges.slice(1),
    }
  }, [value])
  const { draft, change, flush } = useDelayedCommit<Bounds>({
    value: viewBounds,
    commit: (bounds) => set(toFilter(bounds)),
    delay,
    clears,
    // The filter they make: the first range emptied leaves the others.
    same: (a, b) => sameFilter(toFilter(a), toFilter(b)),
  })
  const { locale } = useLocale()
  const unit = React.useMemo(
    () => numberUnit(locale, column.format as Intl.NumberFormatOptions),
    [locale, column.format]
  )
  // The fields hold the numbers as the column shows them (a percent's
  // 12.5 is the 0.125 the filter holds).
  const scaled = (number: number | null, by: number) =>
    number === null || unit.scale === 1
      ? number
      : Number((number * by).toPrecision(15))
  // Only the number reaches the draft: the field keeps what was typed
  // ("3000.0" is the 3000 the view holds) until it loses focus.
  const field = (bound: "min" | "max") => (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={`${id}-${bound}`}>
        {bound === "min" ? t("filterMin") : t("filterMax")}
      </Label>
      <NumberField
        id={`${id}-${bound}`}
        value={scaled(draft[bound], unit.scale)}
        // A bound typed here includes its value: an exclusive one (`>`
        // or `<` in the search) becomes inclusive as it is edited.
        onValueChange={(next) =>
          change({
            ...draft,
            [bound]: scaled(next, 1 / unit.scale),
            [bound === "min" ? "minExclusive" : "maxExclusive"]: false,
          })
        }
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          {unit.unit && unit.side === "start" && (
            <NumberFieldUnit className="ps-2 pe-0">{unit.unit}</NumberFieldUnit>
          )}
          <NumberFieldInput
            aria-describedby={`${id}-column`}
            className={cn(unit.unit && unit.side === "start" && "ps-1")}
            onKeyDown={(event) => {
              if (event.key === "Enter") flush()
            }}
          />
          {unit.unit && unit.side === "end" && (
            <NumberFieldUnit>{unit.unit}</NumberFieldUnit>
          )}
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <span id={`${id}-column`} hidden>
          {column.header}
        </span>
        {field("min")}
        {field("max")}
      </div>
      <MoreRanges count={draft.more.length} />
      <FilterFooter
        noValue={noValue}
        empty={draft.empty}
        onEmptyChange={(empty) => {
          change({ ...draft, empty })
          flush()
        }}
        matches={matches}
        filter={toFilter(draft)}
      />
    </div>
  )
}

export { NumberFilter }
