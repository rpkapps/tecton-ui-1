"use client"

import * as React from "react"
import { cn } from "cn"

import { useDirection } from "@tecton/react/tecton/provider"

import {
  columnResizerClassName,
  columnResizerStartClassName,
} from "./internal/column-resizer-style"
import { useTranslations } from "./internal/i18n/translations"
import { trackPointerDrag } from "./internal/primitives/drag-and-drop/pointer-drag"
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "./internal/primitives/event-details"
import {
  useControlled,
  useEventCallback,
} from "./internal/primitives/use-controlled"

/**
 * Tecton TableColumnResizer — the grip on a column header's end edge that
 * sets the column's width, in px. Drag it with a mouse, a pen or a finger;
 * focus it and press the arrow keys (Shift for bigger steps), Home or End
 * for the narrowest or widest, Enter (or a double click) for `resetValue`.
 * In a right-to-left table the edge, the drag and the arrow keys mirror.
 * With `edge="start"` the grip sits on the header's start edge instead (a
 * column pinned to the table's end grows toward its start): dragging or
 * pressing the arrow toward the start widens it.
 *
 * It holds no width of its own beyond `defaultValue`: give the header
 * `className="relative"`, set the column's width from `value`, and give the
 * `Table` `table-fixed` so the columns keep the widths they are given. To
 * fill the container, give the table `minWidth: "100%"` and leave the last
 * column's width unset: it takes the space left.
 *
 * The look: a short, quiet line at rest (none after the last column); the
 * header's full height while the pointer is over the header; a 2 px line
 * in the active outline colour on the grip (strong in both themes), with
 * a tint on hover and the focus ring, centred on it, on keyboard focus;
 * and while dragging, a guide line down the table in view and the width
 * beside it.
 */

type TableColumnResizerReason = "drag" | "keyboard" | "reset"

type TableColumnResizerChangeDetails =
  ChangeEventDetails<TableColumnResizerReason>

type TableColumnResizerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** The column's width in px (controlled). */
  value?: number
  /** The initial width in px, when not controlled. Default 150. */
  defaultValue?: number
  /** Called with each new width while it changes. */
  onValueChange?: (
    value: number,
    eventDetails: TableColumnResizerChangeDetails
  ) => void
  /** Called with the width once a drag ends, or after each key. */
  onValueCommitted?: (
    value: number,
    eventDetails: TableColumnResizerChangeDetails
  ) => void
  /** The narrowest width. Default 48. */
  min?: number
  /** The widest width. Default 1000. */
  max?: number
  /** The arrow keys' step, in px; Shift takes four. Default 8. */
  step?: number
  /** The width Enter and a double click go back to. */
  resetValue?: number
  /** The column's name: the resizer is named "Resize {label}". */
  label?: string
  /**
   * The header edge the grip sits on: `"end"` (default), or `"start"` for a
   * column that grows toward its start (one pinned to the table's end).
   */
  edge?: "start" | "end"
  disabled?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.round(Math.min(Math.max(value, min), max))
}

function TableColumnResizer({
  value: valueProp,
  defaultValue = 150,
  onValueChange,
  onValueCommitted,
  min = 48,
  max = 1000,
  step = 8,
  resetValue,
  label,
  edge = "end",
  disabled = false,
  className,
  onPointerDown,
  onKeyDown,
  onDoubleClick,
  onClick,
  ...props
}: TableColumnResizerProps) {
  const [value, setValue] = useControlled(valueProp, defaultValue)
  const [dragging, setDragging] = React.useState(false)
  // While dragging: how far the guide runs down the visible table.
  const [guide, setGuide] = React.useState(0)
  const rtl = useDirection() === "rtl"
  // +1 when moving toward the inline end widens the column.
  const sign = (rtl ? -1 : 1) * (edge === "start" ? -1 : 1)
  const t = useTranslations("tableColumnResizer")
  const stop = React.useRef<(() => void) | null>(null)
  const latest = React.useRef(value)
  React.useInsertionEffect(() => {
    latest.current = value
  })
  React.useEffect(() => () => stop.current?.(), [])

  const change = useEventCallback(
    (
      next: number,
      reason: TableColumnResizerReason,
      event: Event | undefined,
      commit: boolean
    ) => {
      const width = clamp(next, min, max)
      if (width !== latest.current) {
        const details = createChangeEventDetails(reason, event)
        onValueChange?.(width, details)
        if (details.isCanceled) return
        latest.current = width
        setValue(width)
      }
      if (commit)
        onValueCommitted?.(
          latest.current,
          createChangeEventDetails(reason, event)
        )
    }
  )

  return (
    <div
      data-slot="table-column-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={
        label === undefined ? undefined : t("resize", { columnName: label })
      }
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? undefined : 0}
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-edge={edge}
      className={cn(
        columnResizerClassName,
        edge === "start" && columnResizerStartClassName,
        className
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (disabled || event.defaultPrevented || event.button !== 0) return
        // The header's own press (sorting) stays out of it.
        event.stopPropagation()
        const element = event.currentTarget
        const { pointerId } = event
        const from = latest.current
        stop.current?.()
        stop.current = trackPointerDrag(event, {
          axis: "x",
          threshold: 1,
          onStart: () => {
            try {
              element.setPointerCapture(pointerId)
            } catch {
              // A pointer the browser no longer tracks.
            }
            // From the header's bottom to the bottom of the table in view.
            const scroller =
              element.closest<HTMLElement>('[data-slot="table-container"]') ??
              element.closest("table")
            const head = element.parentElement?.getBoundingClientRect()
            const box = scroller?.getBoundingClientRect()
            setGuide(head && box ? Math.max(0, box.bottom - head.bottom) : 0)
            setDragging(true)
          },
          onMove: (_point, travel) =>
            change(from + sign * travel.x, "drag", undefined, false),
          onEnd: (drop) => {
            if (drop) change(latest.current, "drag", undefined, true)
            else change(from, "drag", undefined, true)
          },
          onStop: () => {
            stop.current = null
            setDragging(false)
          },
        })
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (disabled || event.defaultPrevented) return
        const by = event.shiftKey ? step * 4 : step
        const wider = sign > 0 ? "ArrowRight" : "ArrowLeft"
        const narrower = sign > 0 ? "ArrowLeft" : "ArrowRight"
        let next: number | null = null
        let reason: TableColumnResizerReason = "keyboard"
        if (event.key === wider) next = latest.current + by
        else if (event.key === narrower) next = latest.current - by
        else if (event.key === "Home") next = min
        else if (event.key === "End") next = max
        else if (event.key === "Enter" && resetValue !== undefined) {
          next = resetValue
          reason = "reset"
        }
        if (next === null) return
        event.preventDefault()
        event.stopPropagation()
        change(next, reason, event.nativeEvent, true)
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (disabled || event.defaultPrevented || resetValue === undefined)
          return
        change(resetValue, "reset", event.nativeEvent, true)
      }}
      // A click on the grip does not reach the header (sorting).
      onClick={(event) => {
        onClick?.(event)
        event.stopPropagation()
      }}
      {...props}
    >
      {dragging ? (
        <>
          {/* A guide down the table at the new edge, and the width. */}
          <span
            aria-hidden="true"
            data-slot="table-column-resizer-guide"
            className="pointer-events-none absolute start-[calc(50%-0.5px)] top-full w-px bg-outline-active-border"
            style={{ height: guide }}
          />
          <span
            aria-hidden="true"
            data-slot="table-column-resizer-width"
            className="pointer-events-none absolute start-[calc(50%+0.5rem)] top-full mt-2 inline-flex h-[22px] items-center rounded-sm bg-foreground px-2 font-mono text-xs whitespace-nowrap text-background tabular-nums"
          >
            {value} px
          </span>
        </>
      ) : null}
    </div>
  )
}

export { TableColumnResizer }
export type {
  TableColumnResizerProps,
  TableColumnResizerChangeDetails,
  TableColumnResizerReason,
}
