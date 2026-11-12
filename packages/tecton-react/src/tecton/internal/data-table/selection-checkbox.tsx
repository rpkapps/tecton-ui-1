"use client"

import * as React from "react"

import { Checkbox } from "@tecton/react/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@tecton/react/tooltip"

import { useTranslations } from "../i18n/translations"
import { useStore } from "../store"
import { useTableGridContext, useTableGridRow } from "../table-grid"

type DataTableSelectionCheckboxProps = Omit<
  React.ComponentProps<typeof Checkbox>,
  "checked" | "defaultChecked" | "indeterminate" | "onCheckedChange"
> & {
  /**
   * Why the row cannot be selected (`itemToDisabledReason`): while the
   * checkbox is disabled, its description and a tooltip on it.
   */
  reason?: React.ReactNode
  /** The id of the reason's hidden text, for the row to be described by it too. */
  reasonId?: string
}

/**
 * The selection checkbox of a grid table (`TableGridConfig`), for the
 * selection column of `DataTable`. In a `TableRow`, it shows and
 * toggles that row (Shift + click: the range to it), named "Select" and
 * the row's header; in the header, it shows whether every row, some or
 * none are selected and selects or clears them all ("Select All"), and
 * renders only when `selectionMode="multiple"` (disabled while no row can be
 * selected). It is out of the Tab order:
 * the arrow keys reach it, and Space on the row does what it does.
 *
 * A disabled row's checkbox with a `reason` is described by it (hidden
 * text) and shows it in a tooltip, from a span around the checkbox: the
 * pointer over the checkbox, or focus on it (the arrow keys reach it when
 * only selection is disabled), opens it. A checkbox without one renders no
 * tooltip.
 */
function DataTableSelectionCheckbox({
  ref,
  disabled,
  reason,
  reasonId: reasonIdProp,
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
  // A row's checkbox is named from its first render, by ids of the
  // grid's own (the checkbox's and its row header's), so the checkbox
  // never looks for a label of its own: as rows mount while the table
  // scrolls, that search reads through the whole document.
  const selfId = `${id}-select`
  const [header, setHeader] = React.useState<string | null>(`${id}-row`)

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

  // Named after the row too: "Select" and the row's header (or first
  // text), which takes the id named at first unless it has one.
  React.useLayoutEffect(() => {
    const self = element.current
    const tr = row ? self?.closest("tr") : null
    if (!self || !tr) return
    const cells = [...tr.cells].filter((cell) => !cell.contains(self))
    const cell =
      cells.find((candidate) => candidate.tagName === "TH") ??
      cells.find((candidate) => candidate.textContent.trim())
    if (!cell) {
      setHeader(null)
      return
    }
    if (!cell.id) cell.id = `${id}-row`
    setHeader(cell.id)
  })
  const labelledBy = row && header ? `${selfId} ${header}` : undefined

  const setRef = React.useCallback(
    (node: HTMLElement | null) => {
      element.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node
    },
    [ref]
  )

  // The press reads the row it is in now: a row updated in place for
  // another (the table virtualized) keeps its checkbox.
  const latest = React.useRef(value)
  React.useInsertionEffect(() => {
    latest.current = value
  })
  const onCheckedChange = React.useCallback(
    (_checked: boolean, eventDetails: { event: Event | undefined }): void => {
      const event = eventDetails.event as MouseEvent | undefined
      const current = latest.current
      if (current === undefined) {
        grid.toggleAll(event)
        return
      }
      grid.select(current, {
        toggle: true,
        range: !!event?.shiftKey,
        event,
        reason: "item-press",
      })
    },
    [grid]
  )

  // A row that cannot be selected (`disabledBehavior="selection"`) can
  // still be focused and activated: only its checkbox is disabled.
  const off =
    !!disabled ||
    !!row?.disabled ||
    (value !== undefined && !grid.isSelectable(value)) ||
    empty
  const label = row ? t("select") : t("selectAll")
  const explained = !!row && off && hasContent(reason)
  const reasonId = reasonIdProp ?? `${id}-reason`
  const own = useSameProps(props)
  const describedBy = explained
    ? [own["aria-describedby"], reasonId].filter(Boolean).join(" ")
    : own["aria-describedby"]
  // The same element while what it shows stays: a row scrolled into
  // another's place renders no checkbox again.
  const box = React.useMemo(
    () => (
      <Checkbox
        data-slot="table-selection-checkbox"
        {...own}
        ref={setRef}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        render={labelledBy ? <span id={selfId} /> : undefined}
        checked={checked}
        indeterminate={indeterminate}
        disabled={off}
        onCheckedChange={onCheckedChange}
      />
    ),
    [
      own,
      setRef,
      label,
      labelledBy,
      describedBy,
      selfId,
      checked,
      indeterminate,
      off,
      onCheckedChange,
    ]
  )

  if (grid.selectionMode === "none") return null
  if (!row && grid.selectionMode !== "multiple") return null
  if (!explained) return box
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <span data-slot="table-selection-reason" className="flex w-fit" />
          }
        >
          {box}
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} hidden>
        {reason}
      </span>
    </>
  )
}

/** A reason that shows something: not `undefined`, `null`, `false` or "". */
function hasContent(node: React.ReactNode) {
  return node !== undefined && node !== null && node !== false && node !== ""
}

/** `props` as given last time while each of its values is the same. */
function useSameProps<T extends object>(props: T): T {
  const last = React.useRef(props)
  const before = last.current as Record<string, unknown>
  const now = props as Record<string, unknown>
  const keys = Object.keys(now)
  const same =
    keys.length === Object.keys(before).length &&
    keys.every((key) => Object.is(before[key], now[key]))
  if (!same) last.current = props
  return same ? last.current : props
}

export { DataTableSelectionCheckbox, hasContent }
export type { DataTableSelectionCheckboxProps }
