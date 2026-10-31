"use client"

import * as React from "react"

import { usePrimitive, type PrimitiveProps } from "../render"
import { useTabIndex } from "../roving-focus"
import {
  ChipContext,
  ChipListContext,
  ChipRootContext,
  useRequired,
} from "./context"

type ChipState = {
  selected: boolean
  disabled: boolean
  /** Whether the group removes chips (`onRemove`): show a remove button. */
  removable: boolean
}

type ChipProps = Omit<PrimitiveProps<"div", ChipState>, "children"> & {
  /** The chip's identity in the group's `value` and `onRemove`. */
  value: string
  /** The chip's plain text: its accessible name and type-ahead text. */
  textValue: string
  disabled?: boolean
  /** The content, or a function of the chip's state. */
  children?: React.ReactNode | ((state: ChipState) => React.ReactNode)
}

/**
 * A chip: a row of the grid, named by its `textValue`, holding one cell with
 * the content. Pressing it selects it (toggle), unless the press is on a
 * button inside it (the remove button).
 */
function Chip({ value, textValue, disabled: disabledProp, children, ...props }: ChipProps) {
  const root = useRequired(ChipRootContext, "Chip", "ChipGroup")
  const list = useRequired(ChipListContext, "Chip", "ChipList")
  const rowId = React.useId()
  const disabled = root.disabled || !!disabledProp
  const selected = root.selection.isSelected(value)
  const tabIndex = useTabIndex(list.focus.store, value)

  const element = React.useRef<HTMLDivElement | null>(null)
  const { register } = list
  React.useLayoutEffect(() => {
    if (!element.current) return
    return register(value, {
      element: element.current,
      disabled: !!disabledProp,
      textValue,
    })
  }, [register, value, disabledProp, textValue])

  const state: ChipState = { selected, disabled, removable: root.removable }
  const context = React.useMemo(
    () => ({ value, rowId, disabled }),
    [value, rowId, disabled]
  )
  const rendered = usePrimitive("div", props, state, {
    ref: element,
    id: rowId,
    role: "row",
    "aria-label": textValue,
    "aria-selected": root.selection.mode === "none" ? undefined : selected,
    "aria-disabled": disabled || undefined,
    "aria-describedby":
      root.removable && !disabled ? root.removeDescriptionId : undefined,
    tabIndex,
    onFocus: (event: React.FocusEvent) => {
      if (event.target === element.current) list.focus.setFocused(value)
    },
    onClick: (event: React.MouseEvent) => {
      if ((event.target as Element).closest("button")) return
      list.focus.focus(value)
      root.selection.select(value, { event })
    },
    children: (
      <div role="gridcell" style={{ display: "contents" }}>
        {typeof children === "function" ? children(state) : children}
      </div>
    ),
  })
  return <ChipContext value={context}>{rendered}</ChipContext>
}

export { Chip }
export type { ChipProps, ChipState }
