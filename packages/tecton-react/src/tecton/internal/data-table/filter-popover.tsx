"use client"

/**
 * `DataTableFilter`'s popover content (the part renders the popover and its
 * trigger, `filter.tsx`): the column's filter, by its type (§4.1), with
 * "Clear" while one is set. It renders only while the popover is open.
 *
 * - text: a field, and the texts added from it as removable chips
 *   (`filter-popover-text.tsx`);
 * - number: a minimum and a maximum side by side, with the column's unit
 *   (`filter-popover-number.tsx`);
 * - date: a range of days picked on `DateRangePicker`'s calendar, in a
 *   popover like the picker's, Clear under it (`filter-popover-date.tsx`);
 * - boolean and options: a checkbox per choice, Yes and No or the options,
 *   with their numbers of rows (`filter-popover-choices.tsx`).
 *
 * A text or number filter shows how many rows it keeps as it is typed, of
 * those the search and the other filters keep (not in server mode, where
 * the table holds only the rows loaded).
 *
 * A number or date filter holds a list of ranges (`td:<1000,>3000` in the
 * search), and its popover edits the first: the others stay as they are,
 * and a muted line under it says how many there are, which Clear removes
 * with the rest of the filter.
 *
 * Each offers "No value" while a row has none in the column (in server
 * mode always: the table sees only the loaded rows), and while it is
 * chosen: the filter's `empty`, the rows without a value besides those the
 * rest matches. It is the last option, apart, with its count; a checkbox
 * under a text or number filter's fields and beside a date filter's Clear;
 * and, as in an options filter, after a yes / no filter's Yes and No.
 *
 * Text and numbers reach the view `searchDelay` ms after the last key,
 * like search (a text added as a chip, or removed, at once); the other
 * types at once.
 */
import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/button"
import { PopoverContent, PopoverTitle } from "@tecton/react/popover"

import { useTranslations } from "../i18n/translations"
import { useDataTableSelector, type DataTableContextValue } from "./context"
import { hasEmptyValues } from "./engine/facets"
import type { DataTableFilterValue, EngineColumn } from "./engine/index"
import { ChoiceFilter } from "./filter-popover-choices"
import { DateFilter } from "./filter-popover-date"
import { NumberFilter } from "./filter-popover-number"
import type { FilterProps, SetColumnFilter } from "./filter-popover-parts"
import { TextFilter } from "./filter-popover-text"
import type { PartPopup } from "./part-popup"

/**
 * Each type's filter, and its popover's classes: a date filter's is
 * `DateRangePicker`'s popover (its calendar edge to edge, Clear under
 * it), the others have the column's name and Clear above the filter.
 */
const FILTERS: Record<
  EngineColumn<unknown>["type"],
  {
    Filter: React.ComponentType<FilterProps<never>>
    className: string
    titled: boolean
  }
> = {
  // The chips wrap rather than widen it.
  text: { Filter: TextFilter, className: "w-72", titled: true },
  // Min and Max share it, each with its minus and plus and the unit: their
  // text inputs alone would make it as wide as two default-width inputs,
  // and 18rem would leave each number under 3rem.
  number: { Filter: NumberFilter, className: "w-96", titled: true },
  date: {
    Filter: DateFilter,
    className: "w-auto gap-0 overflow-hidden p-0",
    titled: false,
  },
  boolean: { Filter: ChoiceFilter, className: "", titled: true },
  options: { Filter: ChoiceFilter, className: "", titled: true },
}

/**
 * The filter's popover content, in the part's `Popover` by its trigger
 * (`filter.tsx`, `part-popup.ts`).
 */
function DataTableFilterPopover({
  context,
  column,
  value,
  set,
  popup,
}: {
  context: DataTableContextValue<unknown>
  column: EngineColumn<unknown>
  value: DataTableFilterValue | undefined
  set: SetColumnFilter
  /** The popover's state, from the part. */
  popup: PartPopup
}) {
  const t = useTranslations("dataTable")
  const content = React.useRef<HTMLDivElement | null>(null)
  const delay = useDataTableSelector(
    context,
    (state) => state.options.searchDelay
  )
  const clears = useDataTableSelector(context, (state) => state.clears)
  const server = useDataTableSelector(
    context,
    (state) => state.options.dataMode === "server"
  )
  const model = useDataTableSelector(context, (state) => state.model)
  const clear = () => {
    set(null)
    // "Clear" goes with the filter: focus moves to the filter's first
    // field, or to the calendar's day.
    setTimeout(() => {
      const element = content.current
      ;(
        element?.querySelector<HTMLElement>(
          '[role="grid"] button[tabindex="0"]'
        ) ??
        element?.querySelector<HTMLElement>(
          'input:not([type="hidden"]), [role="checkbox"], button'
        )
      )?.focus()
    })
  }
  const keyboard = popup.openedBy === "keyboard"
  // "No value" while a row has none (any row, matching or not; in server
  // mode always), or while the filter has it.
  const noValue =
    server ||
    (value !== undefined && value.type !== "custom" && value.empty === true) ||
    hasEmptyValues(model, column.id)
  const { Filter, className, titled } = FILTERS[column.type]
  const filter = (
    <Filter
      context={context}
      column={column}
      value={(value?.type === column.type ? value : undefined) as never}
      set={set}
      delay={delay}
      clears={clears}
      noValue={noValue}
      keyboard={keyboard}
      active={value !== undefined}
      close={popup.close}
      clear={clear}
    />
  )
  return (
    <PopoverContent
      ref={content}
      anchor={popup.content.anchor}
      finalFocus={popup.content.finalFocus}
      align="start"
      data-slot="data-table-filter-content"
      // Without a title, named by the column; from the keyboard, the
      // calendar focuses its day itself.
      aria-label={titled ? undefined : column.header}
      initialFocus={!titled && keyboard ? false : undefined}
      className={cn(titled && "flex w-auto min-w-56 flex-col gap-3", className)}
    >
      {titled ? (
        <>
          <div className="flex min-h-6 items-center justify-between gap-4">
            <PopoverTitle className="text-sm">{column.header}</PopoverTitle>
            {value && (
              <Button
                variant="ghost"
                size="xs"
                className="-me-1.5"
                onClick={clear}
              >
                {t("clearFilter")}
              </Button>
            )}
          </div>
          {filter}
        </>
      ) : (
        filter
      )}
    </PopoverContent>
  )
}

export { DataTableFilterPopover }
export type { SetColumnFilter }
