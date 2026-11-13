"use client"

/**
 * `DataTableToolbar`: the row above the table, for its search, filters and
 * actions. It is Tecton's `Toolbar` (`overflow.tsx`): one tab stop, the
 * arrow keys between its controls, and when the row runs out of room its
 * items go into the toolbar's "More" menu, lowest priority first.
 *
 * The table's own parts placed directly in it are its items
 * (`DataTableToolbarItem`): the search shrinks first, and stays in the row
 * (the item of the highest priority, which `minimumVisible` keeps); a
 * filter, "Group by" and "Columns" go into the menu as an item that opens
 * their popup by the menu's button. Anything else in the row stays, unless
 * it is wrapped in an `OverflowItem` of its own.
 */
import * as React from "react"

import { DropdownMenuItem } from "@tecton/react/dropdown-menu"
import {
  OverflowItem,
  Toolbar,
  type ToolbarProps,
} from "@tecton/react/overflow"

import { useTranslations } from "../i18n/translations"
import { useDataTableContext } from "./context"

type DataTableToolbarProps = ToolbarProps

/** Set inside a `DataTableToolbar`: the parts in it are its items. */
const InToolbar = React.createContext(false)

function DataTableToolbar({
  "aria-label": ariaLabel,
  // The item of the highest priority, the search when there is one, stays.
  minimumVisible = 1,
  children,
  ...props
}: DataTableToolbarProps) {
  useDataTableContext("DataTableToolbar")
  const t = useTranslations("dataTable")
  return (
    <Toolbar
      data-table-toolbar=""
      aria-label={ariaLabel ?? t("toolbar")}
      minimumVisible={minimumVisible}
      {...props}
    >
      <InToolbar.Provider value>{children}</InToolbar.Provider>
    </Toolbar>
  )
}

/** The toolbar's "More" button, which opens a part's popup once it is in the menu. */
function moreButtonOf(element: HTMLElement | null) {
  return (
    element
      ?.closest("[data-table-toolbar]")
      ?.querySelector<HTMLButtonElement>(
        ":scope > [data-slot=overflow-menu] button"
      ) ?? null
  )
}

type ItemProps = {
  /** The item's identity in the toolbar. */
  value: string
  /** Its name in the menu. */
  label: string
  icon?: React.ReactNode
  /** Higher stays in the row longer. */
  priority?: number
  /**
   * Opens the part's popup from the menu, by the given button (the menu's
   * "More" button): `keyboard` when the menu item was chosen with a key.
   */
  open: (button: HTMLButtonElement, by: "keyboard" | "pointer") => void
  children: React.ReactNode
}

/**
 * A part of the table as one of its toolbar's items, when it is directly
 * in a `DataTableToolbar` (else just the part). In the menu, its item opens
 * the part's popup by the menu's button, once the menu has closed and given
 * focus back to that button.
 */
function DataTableToolbarItem({
  value,
  label,
  icon,
  priority,
  open,
  children,
}: ItemProps) {
  const inToolbar = React.useContext(InToolbar)
  if (!inToolbar) return children
  return (
    <ToolbarItem
      value={value}
      label={label}
      icon={icon}
      priority={priority}
      open={open}
    >
      {children}
    </ToolbarItem>
  )
}

function ToolbarItem({
  value,
  label,
  icon,
  priority,
  open,
  children,
}: ItemProps) {
  const item = React.useRef<HTMLDivElement | null>(null)
  return (
    <OverflowItem
      ref={item}
      value={value}
      priority={priority}
      label={label}
      labelBehavior="keep"
      overflow={
        <DropdownMenuItem
          onClick={(event) => {
            const by = event.detail === 0 ? "keyboard" : "pointer"
            // After the menu's close has put focus back on its button.
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const button = moreButtonOf(item.current)
                if (button) open(button, by)
              })
            )
          }}
        >
          {icon}
          {label}
        </DropdownMenuItem>
      }
    >
      {children}
    </OverflowItem>
  )
}

/**
 * The search: the first to shrink, before anything goes into the menu, and
 * the item of the highest priority, which the toolbar keeps in the row
 * (`minimumVisible`).
 */
function DataTableToolbarSearch({
  label,
  wide = false,
  children,
}: {
  label: string
  /** A query field: wider, for its terms. */
  wide?: boolean
  children: React.ReactNode
}) {
  const inToolbar = React.useContext(InToolbar)
  if (!inToolbar) return children
  return (
    <OverflowItem
      value="data-table-search"
      priority={SEARCH_PRIORITY}
      label={label}
      labelBehavior="keep"
      elastic={wide ? QUERY_WIDTH : TEXT_WIDTH}
    >
      {children}
    </OverflowItem>
  )
}

const SEARCH_PRIORITY = 10
const TEXT_WIDTH = { min: "8rem", max: "16rem" }
// A query field keeps one width, the toolbar's other items going into its
// menu first: it does not grow and shrink as filter buttons' values change.
const QUERY_WIDTH = { min: "min(28rem, 100%)", max: "28rem" }

export { DataTableToolbar, DataTableToolbarItem, DataTableToolbarSearch }
export type { DataTableToolbarProps }
