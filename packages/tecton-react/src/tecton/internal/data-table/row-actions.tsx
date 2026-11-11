"use client"

/**
 * `DataTableRowActions`: a row's "⋯" button and its menu, for a column's
 * `cell`. Its children are the menu's `DropdownMenuItem`s (and groups,
 * separators: the DropdownMenu parts). The button is named "Row actions";
 * screen readers say whose by the row's header, as focus enters the row.
 *
 * It is one of its cell's controls: the grid's arrow keys reach it, Enter,
 * Space or Down open the menu, and focus comes back to it as the menu
 * closes. A press on it neither selects nor activates the row.
 *
 * A row holds a plain button for its whole life: the menu's code loads on
 * demand (in idle time, or as a button is pointed at or focused), and a
 * row's menu is rendered only while it is open (`row-actions-menu.tsx`),
 * so scrolling through many rows renders no menus. A press made before
 * the code is there opens the menu once it is (`lazy-popup.ts`).
 */
import * as React from "react"
import { cn } from "cn"
import { EllipsisIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

import { useTranslations } from "../i18n/translations"
import { useDataTableContext, useDataTableSelector } from "./context"
import { usePrefetchFeatures } from "./lazy"
import { mergeButtonProps, useLazyPopup } from "./lazy-popup"

type DataTableRowActionsProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The menu's items: `DropdownMenuItem`s and the other DropdownMenu parts. */
  children: React.ReactNode
  /** Where the menu lines up with the button: its end by default. */
  align?: "start" | "center" | "end"
}

const ROW_ACTIONS = ["rowActions"] as const

function DataTableRowActions({
  children,
  align = "end",
  variant = "ghost",
  size,
  className,
  "aria-label": ariaLabel,
  ...props
}: DataTableRowActionsProps) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableRowActions")
  const small = useDataTableSelector(
    context,
    (state) => state.options.size === "sm"
  )
  usePrefetchFeatures(ROW_ACTIONS)
  const lazy = useLazyPopup("rowActions", { popup: "menu" })
  const trigger: React.ComponentProps<typeof Button> = {
    variant,
    size: size ?? (small ? "icon-xs" : "icon-sm"),
    "aria-label": ariaLabel ?? t("rowActions"),
    className: cn("text-muted-foreground", className),
    ...props,
  }
  const Menu = lazy.module?.DataTableRowActionsMenu
  return (
    <>
      <Button
        data-slot="data-table-row-actions"
        {...mergeButtonProps(trigger, lazy.buttonProps)}
      >
        <EllipsisIcon aria-hidden />
      </Button>
      {lazy.mounted && Menu && (
        <Menu align={align} popup={lazy.popupProps}>
          {children}
        </Menu>
      )}
    </>
  )
}

export { DataTableRowActions }
export type { DataTableRowActionsProps }
