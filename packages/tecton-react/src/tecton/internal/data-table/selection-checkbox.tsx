"use client"

import * as React from "react"

import { Checkbox } from "@tecton/react/components/checkbox"

import { useTranslations } from "../i18n/translations"
import { useStore } from "../store"
import { useTableGridContext, useTableGridRow } from "../table-grid"

type DataTableSelectionCheckboxProps = Omit<
  React.ComponentProps<typeof Checkbox>,
  "checked" | "defaultChecked" | "indeterminate" | "onCheckedChange"
>

/**
 * The selection checkbox of a grid table (`TableGridConfig`), for the
 * selection column of `DataTable`. In a `TableRow`, it shows and
 * toggles that row (Shift + click: the range to it), named "Select" and
 * the row's header; in the header, it shows whether every row, some or
 * none are selected and selects or clears them all ("Select All"), and
 * renders only when `selectionMode="multiple"` (disabled while no row can be
 * selected). It is out of the Tab order:
 * the arrow keys reach it, and Space on the row does what it does.
 */
function DataTableSelectionCheckbox({
  ref,
  disabled,
  ...props
}: DataTableSelectionCheckboxProps) {
  const grid = useTableGridContext()
  if (!grid)
    throw new Error(
      "DataTableSelectionCheckbox must be used inside a Table in a TableGridConfig"
    )
  // The header row is a TableRow too, without a `value`.
  const context = useTableGridRow()
  const row = context?.value === undefined ? null : context
  const t = useTranslations("table")
  const id = React.useId()
  const element = React.useRef<HTMLElement | null>(null)
  const [labelledBy, setLabelledBy] = React.useState<string>()

  const value = row?.value
  const checked = useStore(grid.store, (state) =>
    row
      ? value !== undefined && state.selected.has(value)
      : grid.headerSelection() === "all"
  )
  const indeterminate = useStore(
    grid.store,
    () => !row && grid.headerSelection() === "some"
  )
  // The header's: nothing to select (no rows, or none selectable).
  const empty = useStore(grid.store, () => !row && !grid.canSelectAll())

  // Named after the row too: "Select" and the row's header (or first text).
  React.useLayoutEffect(() => {
    const self = element.current
    const tr = row ? self?.closest("tr") : null
    if (!self || !tr) return
    const cells = [...tr.cells].filter((cell) => !cell.contains(self))
    const header =
      cells.find((cell) => cell.tagName === "TH") ??
      cells.find((cell) => cell.textContent.trim())
    if (!header) {
      setLabelledBy(undefined)
      return
    }
    if (!header.id) header.id = `${id}-row`
    setLabelledBy(self.id ? `${self.id} ${header.id}` : header.id)
  })

  const setRef = React.useCallback(
    (node: HTMLElement | null) => {
      element.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node
    },
    [ref]
  )

  if (grid.selectionMode === "none") return null
  if (!row && grid.selectionMode !== "multiple") return null

  return (
    <Checkbox
      data-slot="table-selection-checkbox"
      {...props}
      ref={setRef}
      aria-label={row ? t("select") : t("selectAll")}
      aria-labelledby={row ? labelledBy : undefined}
      checked={checked}
      indeterminate={indeterminate}
      // A row that cannot be selected (`disabledBehavior="selection"`) can
      // still be focused and activated: only its checkbox is disabled.
      disabled={
        !!disabled ||
        !!row?.disabled ||
        (value !== undefined && !grid.isSelectable(value)) ||
        empty
      }
      onCheckedChange={(_checked, eventDetails) => {
        const event = eventDetails.event as MouseEvent | undefined
        if (value === undefined) {
          grid.toggleAll(event)
          return
        }
        grid.select(value, {
          toggle: true,
          range: !!event?.shiftKey,
          event,
          reason: "item-press",
        })
      }}
    />
  )
}

export { DataTableSelectionCheckbox }
export type { DataTableSelectionCheckboxProps }
