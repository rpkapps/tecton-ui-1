"use client"

/**
 * The header's popups, loaded on demand (`lazy.ts`, the `headerPopups`
 * feature): a column's menu (`column-menu.tsx`) and a column's or group's
 * description popover. Their buttons are the header's own plain buttons,
 * which open them (`lazy-popup.ts`).
 */
import * as React from "react"

import { Popover, PopoverContent } from "@tecton/react/components/popover"

import type { LazyPopupProps } from "./lazy-popup"
import { usePopupTabbing } from "./popup-focus"

export { DataTableColumnMenu } from "./column-menu"

/** A description's popover with the text, by its info button. */
function DataTableColumnDescription({
  description,
  popup,
}: {
  description: string
  /** The popover's state, from its button in the header. */
  popup: LazyPopupProps
}) {
  usePopupTabbing(popup, "dialog")
  return (
    <Popover
      open={popup.open}
      onOpenChange={popup.onOpenChange}
      onOpenChangeComplete={popup.onOpenChangeComplete}
    >
      <PopoverContent
        id={popup.popupId}
        anchor={popup.anchor}
        finalFocus={popup.finalFocus}
        data-slot="data-table-column-description-content"
        className="w-auto max-w-xs text-sm font-normal whitespace-normal"
      >
        {description}
      </PopoverContent>
    </Popover>
  )
}

export { DataTableColumnDescription }
