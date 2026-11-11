"use client"

/**
 * `DataTableRowActions`' menu, loaded on demand (`lazy.ts`, the
 * `rowActions` feature) and rendered for a row only while it is open, by
 * the row's own plain button (`row-actions.tsx`, `lazy-popup.ts`): a table
 * of many rows holds one plain button per row and at most one menu.
 */
import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
} from "@tecton/react/components/dropdown-menu"

import type { LazyPopupProps } from "./lazy-popup"
import { useFirstItemFromKeyboard, usePopupTabbing } from "./popup-focus"

function DataTableRowActionsMenu({
  align,
  children,
  popup,
}: {
  align: "start" | "center" | "end"
  /** The menu's items. */
  children: React.ReactNode
  /** The menu's state, from the row's button. */
  popup: LazyPopupProps
}) {
  const content = React.useRef<HTMLDivElement | null>(null)
  useFirstItemFromKeyboard(content, popup.open, popup.openedBy)
  usePopupTabbing(popup, "menu")
  return (
    <DropdownMenu
      open={popup.open}
      onOpenChange={popup.onOpenChange}
      onOpenChangeComplete={popup.onOpenChangeComplete}
    >
      <DropdownMenuContent
        ref={content}
        id={popup.popupId}
        aria-labelledby={popup.buttonId}
        anchor={popup.anchor}
        finalFocus={popup.finalFocus}
        align={align}
        className="w-auto min-w-40"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DataTableRowActionsMenu }
