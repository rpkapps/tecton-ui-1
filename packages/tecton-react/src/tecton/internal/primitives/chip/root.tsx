"use client"

import * as React from "react"

import {
  type ChangeEventDetails,
  createChangeEventDetails,
} from "../event-details"
import { useTranslations } from "../../i18n/translations"
import { usePrimitive, type PrimitiveProps } from "../render"
import {
  type SelectionMode,
  type SelectionReason,
  useSelection,
} from "../selection"
import {
  ChipRootContext,
  type ChipRemoveReason,
  type ChipRootContextValue,
} from "./context"

type ChipRootState = { disabled: boolean }

type ChipRootProps = Omit<
  PrimitiveProps<"div", ChipRootState>,
  "defaultValue" | "onChange"
> & {
  selectionMode?: SelectionMode
  value?: Array<string>
  defaultValue?: Array<string>
  onValueChange?: (
    value: Array<string>,
    eventDetails: ChangeEventDetails<SelectionReason>
  ) => void
  disallowEmptySelection?: boolean
  disabled?: boolean
  onRemove?: (
    values: Array<string>,
    eventDetails: ChangeEventDetails<ChipRemoveReason>
  ) => void
}

/**
 * Groups selectable / removable chips. Holds the selection and removal; the
 * `aria-*` labelling props name the grid (`ChipPrimitive.List`), not the
 * group element.
 */
function ChipRoot({
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  disallowEmptySelection,
  disabled = false,
  onRemove,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  children,
  ...props
}: ChipRootProps) {
  const t = useTranslations("chip")
  const removeDescriptionId = React.useId()
  const collection = React.useRef({
    order: (): Array<string> => [],
    isDisabled: (_value: string) => false,
  })
  const selection = useSelection({
    mode: selectionMode,
    behavior: "toggle",
    value,
    defaultValue,
    onValueChange,
    disallowEmptySelection,
    getOrder: () => collection.current.order(),
    isSelectable: (value) => !disabled && !collection.current.isDisabled(value),
  })

  const latestRemove = React.useRef(onRemove)
  React.useInsertionEffect(() => {
    latestRemove.current = onRemove
  })
  const context = React.useMemo<ChipRootContextValue>(
    () => ({
      selection,
      disabled,
      removable: !!onRemove,
      remove(values, reason, event) {
        if (disabled || !values.length) return
        latestRemove.current?.(values, createChangeEventDetails(reason, event))
      },
      t,
      removeDescriptionId,
      labelling: {
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": ariaDescribedBy,
      },
      collection,
    }),
    [
      selection,
      disabled,
      onRemove,
      t,
      removeDescriptionId,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
    ]
  )

  const element = usePrimitive(
    "div",
    props,
    { disabled },
    {
      children: (
        <>
          {children}
          {onRemove && (
            <span id={removeDescriptionId} hidden>
              {t("removeDescription")}
            </span>
          )}
        </>
      ),
    }
  )
  return <ChipRootContext value={context}>{element}</ChipRootContext>
}

export { ChipRoot }
export type { ChipRootProps, ChipRootState }
