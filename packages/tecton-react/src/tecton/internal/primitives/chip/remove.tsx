"use client"

import * as React from "react"

import { usePrimitive, type PrimitiveProps } from "../render"
import { ChipContext, ChipRootContext } from "./context"

type ChipRemoveState = { disabled: boolean }

type ChipRemoveProps = PrimitiveProps<"button", ChipRemoveState>

/**
 * The remove button of a chip. In a chip of a removable group it removes
 * the chip, is skipped by Tab (the grid's Delete key does the same), and is
 * named "Remove" followed by the chip's name, in the group's locale. On its
 * own it is a plain button.
 */
function ChipRemove(props: ChipRemoveProps) {
  const root = React.useContext(ChipRootContext)
  const chip = React.useContext(ChipContext)
  const generatedId = React.useId()
  const id = props.id ?? generatedId
  const disabled = !!chip?.disabled
  const own: Record<string, unknown> = { type: "button" }
  if (root && chip) {
    Object.assign(own, {
      id,
      tabIndex: -1,
      "aria-label": root.format("removeButtonLabel"),
      "aria-labelledby": `${id} ${chip.rowId}`,
      disabled: disabled || undefined,
      onClick: (event: React.MouseEvent) => {
        if (!disabled) root.remove([chip.value], "remove-press", event)
      },
    })
  }
  return usePrimitive("button", props, { disabled }, { id, ...own })
}

export { ChipRemove }
export type { ChipRemoveProps, ChipRemoveState }
