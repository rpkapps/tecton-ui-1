"use client"

/**
 * `DataTableGroupBy`'s menu, loaded on demand (`lazy.ts`, the `groupBy`
 * feature; the part renders a plain button until then, `group-by.tsx`):
 *
 * - a checkbox per groupable column, in the columns' order (hidden ones
 *   too: a column grouped by is often hidden), with its level while it is
 *   grouped by; checking one adds it as the last level;
 * - with two levels or more, an item per level after the first that moves
 *   it a level up, before the one above it (the menu stays open, focus on
 *   the moved column's item, so pressing it again moves it on up; each
 *   move is announced with the grouping it makes);
 * - while grouped, "Expand all groups" (off while every group is open)
 *   and "Collapse all groups" (off while every group is closed);
 * - "Ungroup all".
 *
 * Each change of the grouping is announced.
 */
import * as React from "react"
import {
  ArrowUpIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  UngroupIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"
import { useLocale } from "@tecton/react/tecton/provider"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import { getColumnModel, sameIds, setGrouping } from "./engine/index"
import { announceGrouping, toggleGrouping } from "./grouping"
import type { LazyPopupProps } from "./lazy-popup"
import { useFirstItemFromKeyboard, usePopupTabbing } from "./popup-focus"

/** `list` with the item at `from` moved by `step` places. */
function move(list: ReadonlyArray<string>, from: number, step: number) {
  const to = from + step
  if (from < 0 || to < 0 || to >= list.length) return list
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

function DataTableGroupByMenu({
  context,
  popup,
}: {
  context: DataTableContextValue<unknown>
  /** The menu's state, from its button (`lazy-popup.ts`). */
  popup: LazyPopupProps
}) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const format = useNumberFormat()
  const { actions } = context
  const content = React.useRef<HTMLDivElement | null>(null)
  useFirstItemFromKeyboard(content, popup.open, popup.openedBy)
  usePopupTabbing(popup, "menu")
  const columns = useDataTableSelector(context, (state) => state.columns)
  const order = useDataTableSelector(
    context,
    (state) => state.view.columns.order
  )
  const grouping = useDataTableSelector(context, (state) => state.view.grouping)
  const canExpand = useDataTableSelector(
    context,
    (state) => state.groupCounts().closed > 0
  )
  const canCollapse = useDataTableSelector(context, (state) => {
    const counts = state.groupCounts()
    return counts.closed < counts.total
  })
  const { byId } = getColumnModel(columns)
  const headerOf = (id: string) => byId.get(id)?.header ?? id
  const groupable = order.flatMap((id) => {
    const column = byId.get(id)
    return column?.groupable ? [column] : []
  })

  // After a move, the item to move to: focusing it highlights it too, so
  // focus and highlight stay together. Taken by the next render, which
  // focuses it only when the grouping is the one the move made: an owner
  // that kept its own (a controlled `view`), or changed it otherwise,
  // leaves focus where it is.
  const following = React.useRef<{
    at: number
    moved: ReadonlyArray<string>
  } | null>(null)
  React.useLayoutEffect(() => {
    const next = following.current
    following.current = null
    if (!next || !sameIds(next.moved, grouping)) return
    content.current
      ?.querySelector<HTMLElement>(`[data-level="${next.at}"]`)
      ?.focus()
  })

  const set = (
    change: (grouping: ReadonlyArray<string>) => ReadonlyArray<string>,
    event: Event | undefined
  ) => {
    // Any change of the grouping: no move's focus left over.
    following.current = null
    let after: ReadonlyArray<string> = []
    const applied = actions.updateView(
      (view) => {
        after = change(view.grouping)
        return setGrouping(view, after)
      },
      "group",
      event
    )
    if (applied) announceGrouping(t, after, headerOf, locale)
    return applied
  }

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
        align="start"
        className="w-auto min-w-52"
        finalFocus={popup.finalFocus}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("groupBy")}</DropdownMenuLabel>
          {groupable.map((column) => {
            const level = grouping.indexOf(column.id)
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={level !== -1}
                onCheckedChange={(checked, details) =>
                  set(
                    (current) => toggleGrouping(current, column.id, checked),
                    details.event
                  )
                }
              >
                {column.header}
                {level !== -1 && (
                  <span
                    aria-hidden
                    className="ms-auto text-xs text-muted-foreground tabular-nums"
                  >
                    {format.format(level + 1)}
                  </span>
                )}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
        {grouping.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("groupOrder")}</DropdownMenuLabel>
              {grouping.slice(1).map((id, index) => (
                <DropdownMenuItem
                  // By level, not by column: a move leaves as many items,
                  // each in its place (see `following`).
                  key={index}
                  data-level={index}
                  // Open for a move of several steps.
                  closeOnClick={false}
                  onClick={(event) => {
                    // Then the moved column's own item, one place up (the
                    // first's again at the top), for another step up.
                    let moved: ReadonlyArray<string> = []
                    if (
                      set((current) => {
                        moved = move(current, index + 1, -1)
                        return moved
                      }, event.nativeEvent)
                    )
                      following.current = { at: Math.max(0, index - 1), moved }
                  }}
                >
                  <ArrowUpIcon />
                  {t("moveGroupUp", { columnName: headerOf(id) })}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        {grouping.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={!canExpand}
                onClick={() => actions.expandAllGroups()}
              >
                <ChevronsUpDownIcon />
                {t("expandAllGroups")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canCollapse}
                onClick={() => actions.collapseAllGroups()}
              >
                <ChevronsDownUpIcon />
                {t("collapseAllGroups")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={grouping.length === 0}
          onClick={(event) => set(() => [], event.nativeEvent)}
        >
          <UngroupIcon />
          {t("ungroupAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DataTableGroupByMenu }
