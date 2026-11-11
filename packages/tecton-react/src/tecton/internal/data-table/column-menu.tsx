"use client"

/**
 * A column header's menu: the column's actions for the features that are on
 * and that the column has not opted out of, in sections: sort (ascending,
 * descending, clear), grouping ("Group by column", which adds it as the
 * last level of the grouping, or "Ungroup column"), then the column itself
 * (resize, fit to content, reset width, hide, pin to the start or the end,
 * unpin). The menu button renders only with a column feature beyond
 * sorting: a header that only sorts has its sort button.
 *
 * "Resize column" puts focus on the column's resizer, which the arrow keys
 * do not reach: there the arrow keys resize, Enter or Tab keeps the width
 * and Escape puts it back, both returning focus here (`header.tsx`).
 *
 * The button is one of the header cell's controls: the grid's arrow keys
 * reach it like the sort button, and Enter, Space or Down open it. A press
 * on it never starts a column drag.
 */
import * as React from "react"
import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  ChevronsLeftRightEllipsisIcon,
  EyeOffIcon,
  GroupIcon,
  PinIcon,
  PinOffIcon,
  RotateCcwIcon,
  UngroupIcon,
  XIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"

import { useLocale } from "@tecton/react/tecton/provider"

import { useTranslations, type Translator } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import { loadFeature } from "./lazy"
import type { LazyPopupProps } from "./lazy-popup"
import { useFirstItemFromKeyboard, usePopupTabbing } from "./popup-focus"
import type { DataTableContextValue } from "./context"
import {
  getColumnModel,
  setColumnHidden,
  setColumnPinned,
  setGrouping,
  setSorting,
  type DataTableSort,
  type EngineColumn,
} from "./engine/index"
import { announceGrouping, toggleGrouping } from "./grouping"

type ColumnMenuOptions = {
  /** Sorting is on for the column. */
  sortable: boolean
  /** Resizing is on for the column. */
  resizable: boolean
  /** Hiding is on for the column, and it is not the last one shown. */
  hideable: boolean
  /** Pinning is on for the column. */
  pinnable: boolean
  /** Grouping is on for the column. */
  groupable: boolean
}

/** What a sort set from the menu says that the grid does not. */
type AnnounceSort = (
  t: Translator<"dataTable">,
  column: { id: string; header: string },
  before: ReadonlyArray<DataTableSort>,
  after: ReadonlyArray<DataTableSort>
) => void

function DataTableColumnMenu<T>({
  column,
  context,
  options,
  sorting,
  pinned,
  grouped,
  announceSort,
  triggerRef,
  resizerRef,
  onFit,
  onResetWidth,
  popup,
}: {
  column: EngineColumn<T>
  context: DataTableContextValue<T>
  options: ColumnMenuOptions
  sorting: ReadonlyArray<DataTableSort>
  pinned: "start" | "end" | null
  /** The rows are grouped by the column. */
  grouped: boolean
  announceSort: AnnounceSort
  /** The menu button, for focus to come back to. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
  /** The column's resizer, which "Resize column" focuses. */
  resizerRef: React.RefObject<HTMLDivElement | null>
  /** "Fit to content". */
  onFit: (event: Event) => void
  /** "Reset width"; off (`undefined`) while the user has set none. */
  onResetWidth: ((event: Event) => void) | undefined
  /** The menu's state, from its button in the header (`lazy-popup.ts`). */
  popup: LazyPopupProps
}) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const { actions, store } = context
  const content = React.useRef<HTMLDivElement | null>(null)
  useFirstItemFromKeyboard(content, popup.open, popup.openedBy)
  usePopupTabbing(popup, "menu")
  // Where focus goes as the menu closes: the resizer for "Resize column";
  // nowhere yet after "Hide column" (it is decided once the view shows
  // whether the column went); else back to the button.
  const closing = React.useRef<"resize" | "hide" | null>(null)
  React.useEffect(() => {
    if (popup.open) closing.current = null
  }, [popup.open])
  const columnName = column.header
  const at = sorting.findIndex((sorted) => sorted.column === column.id)
  const direction = at === -1 ? null : sorting[at].direction
  // Only a sort the menu would not change is off: the column sorted alone.
  const sole = sorting.length === 1 ? direction : null

  const sort = (next: DataTableSort["direction"] | null, event: Event) => {
    const before = store.get().view.sorting
    const after: ReadonlyArray<DataTableSort> = next
      ? [{ column: column.id, direction: next }]
      : before.filter((sorted) => sorted.column !== column.id)
    if (actions.updateView((view) => setSorting(view, after), "sort", event))
      announceSort(t, column, before, after)
  }
  const group = (event: Event) => {
    const { byId } = getColumnModel(store.get().columns)
    let after: ReadonlyArray<string> = []
    if (
      actions.updateView(
        (view) => {
          after = toggleGrouping(view.grouping, column.id, !grouped)
          return setGrouping(view, after)
        },
        "group",
        event
      )
    )
      announceGrouping(t, after, (id) => byId.get(id)?.header ?? id, locale)
  }
  const hide = (event: Event) => {
    closing.current = "hide"
    const applied = actions.updateView(
      (view) => setColumnHidden(view, column.id, true),
      "hide",
      event
    )
    // Once the view has rendered: the cell now in the hidden column's
    // place, or this button when the column stayed (a controlled view that
    // did not take the change).
    setTimeout(() => {
      const shown = store
        .get()
        .layout.columns.some((other) => other.id === column.id)
      if (shown) triggerRef.current?.focus()
      else {
        if (applied) announce(t("columnHidden", { columnName }))
        actions.focusTable()
      }
    })
  }
  const pin = (side: "start" | "end" | null, event: Event) => {
    if (
      actions.updateView(
        (view) => setColumnPinned(view, column.id, side),
        "pin",
        event
      )
    )
      announce(
        side === "start"
          ? t("columnPinnedStart", { columnName })
          : side === "end"
            ? t("columnPinnedEnd", { columnName })
            : t("columnUnpinned", { columnName })
      )
  }

  const sections: Array<React.ReactNode> = []
  if (options.sortable)
    sections.push(
      <DropdownMenuGroup key="sort">
        <DropdownMenuItem
          disabled={sole === "ascending"}
          onClick={(event) => sort("ascending", event.nativeEvent)}
        >
          <ArrowUpIcon />
          {t("sortAscending")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={sole === "descending"}
          onClick={(event) => sort("descending", event.nativeEvent)}
        >
          <ArrowDownIcon />
          {t("sortDescending")}
        </DropdownMenuItem>
        {direction && (
          <DropdownMenuItem onClick={(event) => sort(null, event.nativeEvent)}>
            <XIcon />
            {t("clearSort")}
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
    )
  if (options.groupable)
    sections.push(
      <DropdownMenuGroup key="group">
        <DropdownMenuItem onClick={(event) => group(event.nativeEvent)}>
          {grouped ? <UngroupIcon /> : <GroupIcon />}
          {grouped ? t("ungroupColumn") : t("groupByColumn")}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    )
  if (options.resizable || options.hideable || options.pinnable)
    sections.push(
      <DropdownMenuGroup key="column">
        {options.resizable && (
          <DropdownMenuItem
            // The resizer, focused as the menu closes, enters resize mode;
            // once it is there, if its code is still to come.
            onClick={() => {
              closing.current = "resize"
              if (resizerRef.current) return
              loadFeature("resizer")
                .then(() => setTimeout(() => resizerRef.current?.focus()))
                .catch(() => undefined)
            }}
          >
            <ArrowLeftRightIcon />
            {t("resizeColumn")}
          </DropdownMenuItem>
        )}
        {options.resizable && (
          <DropdownMenuItem onClick={(event) => onFit(event.nativeEvent)}>
            <ChevronsLeftRightEllipsisIcon />
            {t("fitColumn")}
          </DropdownMenuItem>
        )}
        {options.resizable && (
          <DropdownMenuItem
            disabled={!onResetWidth}
            onClick={(event) => onResetWidth?.(event.nativeEvent)}
          >
            <RotateCcwIcon />
            {t("resetColumnWidth")}
          </DropdownMenuItem>
        )}
        {options.hideable && (
          <DropdownMenuItem onClick={(event) => hide(event.nativeEvent)}>
            <EyeOffIcon />
            {t("hideColumn")}
          </DropdownMenuItem>
        )}
        {options.pinnable && pinned !== "start" && (
          <DropdownMenuItem
            onClick={(event) => pin("start", event.nativeEvent)}
          >
            <PinIcon />
            {t("pinToStart")}
          </DropdownMenuItem>
        )}
        {options.pinnable && pinned !== "end" && (
          <DropdownMenuItem onClick={(event) => pin("end", event.nativeEvent)}>
            <PinIcon />
            {t("pinToEnd")}
          </DropdownMenuItem>
        )}
        {options.pinnable && pinned !== null && (
          <DropdownMenuItem onClick={(event) => pin(null, event.nativeEvent)}>
            <PinOffIcon />
            {t("unpin")}
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
    )

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
        align="end"
        className="w-auto min-w-44"
        finalFocus={() =>
          closing.current === "resize"
            ? (resizerRef.current ?? false)
            : closing.current === "hide"
              ? false
              : popup.finalFocus()
        }
      >
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            {section}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DataTableColumnMenu }
export type { ColumnMenuOptions }
