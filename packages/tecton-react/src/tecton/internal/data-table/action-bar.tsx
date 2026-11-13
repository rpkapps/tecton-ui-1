"use client"

/**
 * `DataTableActionBar`: Tecton's `ActionBar` for the table's selected rows,
 * shown only while rows are selected. It holds `ActionBarSelection` (how
 * many rows are selected of how many match, every matching row in server
 * mode's "all matching" selection, and Clear) and the caller's actions in
 * `ActionBarActions`, an overflow toolbar (wrap them in `OverflowItem`s to
 * let them go into its menu). With several rows selecting and every row
 * shown selected while more match, it offers "Select all 1,240": every
 * matching row, on every page, and in server mode the rows not loaded too
 * (§5.3). Escape in the bar clears the selection; as the bar goes with
 * focus in it, focus goes back to the table. Its other props are the
 * `ActionBar`'s.
 */
import * as React from "react"

import { Button } from "@tecton/react/button"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
  type ActionBarProps,
} from "@tecton/react/action-bar"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
  useNumberFormat,
  type DataTableState,
} from "./context"
import { clearSelection, selectAllMatching } from "./more-actions"

type DataTableActionBarProps = Omit<ActionBarProps, "open">

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

function DataTableActionBar({
  children,
  onOpenChange,
  onFocus,
  onBlur,
  ref,
  "aria-label": ariaLabel,
  ...props
}: DataTableActionBarProps) {
  const context = useDataTableContext<unknown>("DataTableActionBar")
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
  useFeatureWarning(
    context,
    mode === "none",
    "DataTableActionBar",
    "selectionMode"
  )
  // Focus in the bar as it goes (Clear, Escape): back to the table.
  const focused = React.useRef(false)
  const gone = count === 0 || mode === "none"
  React.useLayoutEffect(() => {
    if (!gone || !focused.current) return
    focused.current = false
    const active = document.activeElement
    if (active === null || active === document.body) actions.focusTable()
  }, [gone, actions])
  const offerAll =
    !gone && mode === "multiple" && !allMatching && shown && count < total
  // "Select all N" goes once pressed: focus on it moves to Clear.
  const bar = React.useRef<HTMLDivElement | null>(null)
  const onSelectAll = React.useRef(false)
  React.useLayoutEffect(() => {
    if (offerAll || !onSelectAll.current) return
    onSelectAll.current = false
    const active = document.activeElement
    if (active !== null && active !== document.body) return
    const clear = [
      ...(bar.current?.querySelectorAll<HTMLElement>(
        '[data-slot="action-bar-selection"] button'
      ) ?? []),
    ].find(
      (button) =>
        // jsdom has no `checkVisibility`.
        typeof button.checkVisibility !== "function" || button.checkVisibility()
    )
    clear?.focus()
  }, [offerAll])
  if (gone) return null

  return (
    <ActionBar
      ref={(element: HTMLDivElement | null) => {
        bar.current = element
        if (typeof ref === "function") ref(element)
        else if (ref) ref.current = element
      }}
      data-slot="data-table-action-bar"
      aria-label={ariaLabel ?? t("selectionBar")}
      onOpenChange={(open) => {
        onOpenChange?.(open)
        if (!open) clearSelection(actions)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        focused.current = true
      }}
      onBlur={(event) => {
        onBlur?.(event)
        // Focus leaving for good, not into another of the bar's controls.
        const bar = event.currentTarget
        if (!bar.contains(event.relatedTarget))
          queueMicrotask(() => {
            if (bar.isConnected) focused.current = false
          })
      }}
      {...props}
    >
      <ActionBarSelection
        count={count}
        total={total}
        clearLabel={t("clearSelection")}
        onClear={() => clearSelection(actions)}
      />
      {offerAll && (
        <Button
          variant="link"
          size="xs"
          data-slot="data-table-select-all-matching"
          onFocus={() => {
            onSelectAll.current = true
          }}
          // A blur of the button still there; one that goes with it
          // shows as disconnected.
          onBlur={(event) => {
            const button = event.currentTarget
            queueMicrotask(() => {
              if (button.isConnected) onSelectAll.current = false
            })
          }}
          onClick={(event: React.MouseEvent) =>
            selectAllMatching(actions, event.nativeEvent)
          }
        >
          {t("selectAllMatching", {
            count: total,
            total: format.format(total),
          })}
        </Button>
      )}
      <ActionBarActions aria-label={t("selectionActions")}>
        {children}
      </ActionBarActions>
    </ActionBar>
  )
}

export { DataTableActionBar }
export type { DataTableActionBarProps }
