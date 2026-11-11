"use client"

/**
 * `DataTableSelectionCount`: "3 of 1,240 selected". With several rows
 * selecting and every row shown selected (the page's, a tree's open ones)
 * while more match, it offers "Select all 1,240": every matching row, on
 * every page; in server mode, "all matching" (§5.3), the rows not loaded
 * too. Once every matching row is selected beyond the ones shown, it offers
 * "Clear selection".
 */
import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/components/button"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
  useNumberFormat,
  type DataTableState,
} from "./context"

/** The ids of the rows shown that can be selected, read once per row model. */
const shownIds = new WeakMap<object, ReadonlyArray<string>>()
/** The last answer for a selection, so the store's reads repeat no work. */
const answers = new WeakMap<
  ReadonlySet<string>,
  { ids: ReadonlyArray<string>; all: boolean }
>()

/** Every selectable row shown is selected, and there is one at least. */
function shownSelected(state: DataTableState<unknown>) {
  const { model, selected } = state
  let ids = shownIds.get(model)
  if (!ids) {
    // Disabled rows never select, and context rows are not results.
    ids = model.rows.flatMap((row) =>
      row.kind !== "item" || row.context || row.disabled ? [] : [row.id]
    )
    shownIds.set(model, ids)
  }
  // Fewer selected than shown: not all, without looking at a row.
  if (ids.length === 0 || selected.size < ids.length) return false
  const known = answers.get(selected)
  if (known?.ids === ids) return known.all
  const all = ids.every((id) => selected.has(id))
  answers.set(selected, { ids, all })
  return all
}

function DataTableSelectionCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const context = useDataTableContext<unknown>("DataTableSelectionCount")
  const { actions } = context
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const mode = useDataTableSelector(
    context,
    (state) => state.options.selectionMode
  )
  const count = useDataTableSelector(context, (state) =>
    state.allMatching
      ? Math.max(0, state.model.rowCount - state.allMatching.except.length)
      : state.value.length
  )
  const total = useDataTableSelector(context, (state) => state.model.rowCount)
  const allMatching = useDataTableSelector(
    context,
    (state) => state.allMatching !== null
  )
  const shown = useDataTableSelector(context, shownSelected)
  // More rows match than are shown: pages, closed tree rows, or the server's.
  const beyond = useDataTableSelector(
    context,
    (state) => state.model.rows.length < state.model.rowCount
  )
  useFeatureWarning(
    context,
    mode === "none",
    "DataTableSelectionCount",
    "selectionMode"
  )
  if (mode === "none") return null

  const offerAll = mode === "multiple" && !allMatching && shown && count < total
  const offerClear = count > 0 && (allMatching || (count >= total && beyond))
  return (
    <div
      data-slot="data-table-selection-count"
      className={cn("me-auto flex items-center gap-2 text-sm", className)}
      {...props}
    >
      <span role="status" className="text-muted-foreground tabular-nums">
        {t("selectedCount", {
          count,
          selected: format.format(count),
          total: format.format(total),
        })}
      </span>
      <SelectionAction
        offer={offerAll ? "all" : offerClear ? "clear" : null}
        total={format.format(total)}
        count={total}
        onSelectAll={(event) => actions.selectAllMatching(event)}
        onClear={(event) => actions.clearSelection(event)}
        onGone={() => actions.focusTable()}
      />
    </div>
  )
}

/**
 * "Select all N" and "Clear selection" are one button whose label
 * changes, so pressing one leaves focus on the other. When the button goes
 * while focused (the selection cleared), focus goes back to the table.
 */
function SelectionAction({
  offer,
  total,
  count,
  onSelectAll,
  onClear,
  onGone,
}: {
  offer: "all" | "clear" | null
  total: string
  count: number
  onSelectAll: (event: Event) => void
  onClear: (event: Event) => void
  onGone: () => void
}) {
  const t = useTranslations("dataTable")
  const focused = React.useRef(false)
  React.useLayoutEffect(() => {
    if (offer !== null || !focused.current) return
    focused.current = false
    // Only when the button took focus with it: not over focus elsewhere.
    const active = document.activeElement
    if (active === null || active === document.body) onGone()
  }, [offer, onGone])
  if (offer === null) return null
  return (
    <Button
      variant="link"
      size="xs"
      data-slot="data-table-selection-action"
      onFocus={() => {
        focused.current = true
      }}
      // A blur of the button still there (to the page, or anywhere) leaves
      // nothing to put back; a removal that blurs shows as disconnected.
      onBlur={(event) => {
        const button = event.currentTarget
        queueMicrotask(() => {
          if (button.isConnected) focused.current = false
        })
      }}
      onClick={(event: React.MouseEvent) =>
        offer === "all"
          ? onSelectAll(event.nativeEvent)
          : onClear(event.nativeEvent)
      }
    >
      {offer === "all"
        ? t("selectAllMatching", { count, total })
        : t("clearSelection")}
    </Button>
  )
}

export { DataTableSelectionCount }
