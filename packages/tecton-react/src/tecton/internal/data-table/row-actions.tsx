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
 * The button is the menu's own trigger, as on a `DropdownMenu`; the menu's
 * items render only while it is open, so scrolling through many rows
 * renders no menus. The menu is not modal: a press outside closes it and
 * goes on to what it pressed (another row's button opens that row's menu).
 */
import * as React from "react"
import { cn } from "cn"
import { EllipsisIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

import { useTranslations } from "../i18n/translations"
import { useDataTableContext, useDataTableSelector } from "./context"
import { gridMenuKeys } from "./part-popup"

type DataTableRowActionsProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The menu's items: `DropdownMenuItem`s and the other DropdownMenu parts. */
  children: React.ReactNode
  /** Where the menu lines up with the button: its end by default. */
  align?: "start" | "center" | "end"
}

function DataTableRowActions({
  children,
  align = "end",
  variant = "ghost",
  size,
  className,
  "aria-label": ariaLabel,
  onKeyDown,
  ...props
}: DataTableRowActionsProps) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableRowActions")
  const small = useDataTableSelector(
    context,
    (state) => state.options.size === "sm"
  )
  return (
    // Not modal, as the table's other menus: no scroll lock (`part-popup.ts`).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-slot="data-table-row-actions"
        aria-label={ariaLabel ?? t("rowActions")}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          gridMenuKeys(event)
        }}
        render={
          <Button
            variant={variant}
            size={size ?? (small ? "icon-xs" : "icon-sm")}
            className={cn("text-muted-foreground", className)}
            {...props}
          />
        }
      >
        <EllipsisIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-auto min-w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DataTableRowActions }
export type { DataTableRowActionsProps }
