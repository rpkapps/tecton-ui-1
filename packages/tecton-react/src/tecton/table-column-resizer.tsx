"use client"

import * as React from "react"
import { cn } from "cn"

import { useDirection } from "@tecton/react/tecton/provider"

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
 *
 * It holds no width of its own beyond `defaultValue`: give the header
 * `className="relative"`, set the column's width from `value`, and give the
 * `Table` `table-fixed` so the columns keep the widths they are given.
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
  const rtl = useDirection() === "rtl"
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
      className={cn(
        "group/resizer absolute inset-y-0 end-0 z-10 -me-1.5 w-3 cursor-col-resize touch-none outline-none select-none",
        "after:absolute after:inset-y-1.5 after:start-[calc(50%-1px)] after:w-0.5 after:rounded-full after:bg-border after:transition-colors",
        "hover:after:bg-primary focus-visible:after:inset-y-0 focus-visible:after:bg-ring data-dragging:after:inset-y-0 data-dragging:after:bg-primary",
        "data-disabled:pointer-events-none data-disabled:after:hidden",
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
            setDragging(true)
          },
          onMove: (_point, travel) =>
            change(
              from + (rtl ? -travel.x : travel.x),
              "drag",
              undefined,
              false
            ),
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
        const wider = rtl ? "ArrowLeft" : "ArrowRight"
        const narrower = rtl ? "ArrowRight" : "ArrowLeft"
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
    />
  )
}

export { TableColumnResizer }
export type {
  TableColumnResizerProps,
  TableColumnResizerChangeDetails,
  TableColumnResizerReason,
}
