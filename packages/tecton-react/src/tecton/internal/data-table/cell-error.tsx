"use client"

/**
 * A cell's message (a value not valid, a save that failed) in a tooltip,
 * shown while the pointer is over the cell or focus is on it. Loaded on
 * demand when a cell first has one (`lazy.ts`, `cellError`); the cell's
 * own description (`cell.tsx`) reads the message to screen readers from
 * the first render, so the tooltip is for the eye only.
 */
import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"

function DataTableCellErrorTip({
  message,
  cell,
}: {
  message: string
  /** An element in the cell: the tooltip follows the cell's hover and focus. */
  cell: React.RefObject<HTMLElement | null>
}) {
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  React.useEffect(() => {
    const element = cell.current?.closest("td, th")
    if (!element) return
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    const focus = () => setFocused(true)
    const blur = () => setFocused(false)
    setFocused(element.contains(element.ownerDocument.activeElement))
    element.addEventListener("pointerenter", enter)
    element.addEventListener("pointerleave", leave)
    element.addEventListener("focusin", focus)
    element.addEventListener("focusout", blur)
    return () => {
      element.removeEventListener("pointerenter", enter)
      element.removeEventListener("pointerleave", leave)
      element.removeEventListener("focusin", focus)
      element.removeEventListener("focusout", blur)
    }
  }, [cell])
  return (
    <Tooltip open={hovered || focused}>
      {/* Over the cell, for the tooltip to be placed by it; the cell takes the pointer and focus. */}
      <TooltipTrigger
        render={
          <span aria-hidden className="pointer-events-none absolute inset-0" />
        }
      />
      <TooltipContent side="top">{message}</TooltipContent>
    </Tooltip>
  )
}

export { DataTableCellErrorTip }
