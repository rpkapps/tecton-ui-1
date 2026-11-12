"use client"

/**
 * `DataTableColumnsMenu`: an outline "Columns" button with a menu of the
 * columns, for the column features that are on: a checkbox per column to
 * show or hide it (`hideableColumns`), a submenu per column to pin it to
 * the start or the end (`pinnableColumns`), and "Reset columns", back to
 * the default view's columns. The columns of a group are listed under the
 * group's name, in the order the table shows them.
 *
 * It renders nothing, and warns once in development, while neither feature
 * is on. The last column shown cannot be hidden, nor can a column with
 * `hideable: false`; "Reset columns" is off while there is nothing to
 * reset. Each change is announced, as from a column's own menu.
 */
import * as React from "react"
import { Columns3Icon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

import { useTranslations } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import {
  getColumnModel,
  resetColumns,
  sameColumns,
  setColumnHidden,
  setColumnPinned,
  siblingsInOrder,
  type ColumnModel,
  type DataTableView,
  type EngineColumn,
} from "./engine/index"
import { DataTableToolbarItem } from "./toolbar"

type DataTableColumnsMenuProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The button's content: "Columns" and an icon by default. */
  children?: React.ReactNode
}

/** A column in the menu, with the groups it is listed under. */
type Entry =
  | { kind: "column"; column: EngineColumn<unknown> }
  | { kind: "group"; id: string; header: string; entries: Array<Entry> }

/** The columns and groups in the order the view shows them. */
function entriesOf(
  model: ColumnModel<unknown>,
  order: ReadonlyArray<string>,
  parent: string | null = null
): Array<Entry> {
  return siblingsInOrder(model, order, parent).flatMap((id): Array<Entry> => {
    const column = model.byId.get(id)
    if (column) return [{ kind: "column", column }]
    const group = model.groups.get(id)
    return group
      ? [
          {
            kind: "group",
            id,
            header: group.header,
            entries: entriesOf(model, order, id),
          },
        ]
      : []
  })
}

function pinSide(columns: DataTableView["columns"], id: string) {
  const { start, end } = columns.pinned
  return start.includes(id) ? "start" : end.includes(id) ? "end" : "none"
}

/** Whether a column, or a column of a group, can be pinned. */
function hasPinnable(entry: Entry): boolean {
  return entry.kind === "column"
    ? entry.column.pinnable
    : entry.entries.some(hasPinnable)
}

function DataTableColumnsMenu({
  children,
  variant = "outline",
  ...props
}: DataTableColumnsMenuProps) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableColumnsMenu")
  const { actions } = context
  const columns = useDataTableSelector(context, (state) => state.columns)
  const changed = useDataTableSelector(
    context,
    (state) => !sameColumns(state.view.columns, state.defaults.columns)
  )
  const viewColumns = useDataTableSelector(
    context,
    (state) => state.view.columns
  )
  const hideable = useDataTableSelector(
    context,
    (state) => state.options.hideableColumns
  )
  const pinnable = useDataTableSelector(
    context,
    (state) => state.options.pinnableColumns
  )
  // Opened from the toolbar's menu (`DataTableToolbarItem`): placed by its
  // "More" button, focus going back to it.
  const [open, setOpen] = React.useState(false)
  const more = React.useRef<HTMLButtonElement | null>(null)
  const [byMore, setByMore] = React.useState(false)
  const off = !hideable && !pinnable
  useFeatureWarning(
    context,
    off,
    "DataTableColumnsMenu",
    "`hideableColumns` or `pinnableColumns`"
  )
  if (off) return null

  const model = getColumnModel(columns)
  const entries = entriesOf(model, viewColumns.order)
  const hidden = new Set(viewColumns.hidden)
  const shown = model.leaves.length - hidden.size

  const showItems = (list: Array<Entry>, depth: number): React.ReactNode =>
    list.map((entry) =>
      entry.kind === "column" ? (
        <DropdownMenuCheckboxItem
          key={entry.column.id}
          checked={!hidden.has(entry.column.id)}
          // The last column shown stays.
          disabled={
            !entry.column.hideable ||
            (!hidden.has(entry.column.id) && shown <= 1)
          }
          style={
            depth ? { paddingInlineStart: `${0.5 + depth}rem` } : undefined
          }
          onCheckedChange={(checked, details) => {
            const columnName = entry.column.header
            if (
              actions.updateView(
                (current) =>
                  setColumnHidden(current, entry.column.id, !checked),
                "hide",
                details.event
              )
            )
              announce(
                checked
                  ? t("columnShown", { columnName })
                  : t("columnHidden", { columnName })
              )
          }}
        >
          {entry.column.header}
        </DropdownMenuCheckboxItem>
      ) : (
        <DropdownMenuGroup key={entry.id}>
          <DropdownMenuLabel
            style={{ paddingInlineStart: `${0.5 + depth}rem` }}
          >
            {entry.header}
          </DropdownMenuLabel>
          {showItems(entry.entries, depth + 1)}
        </DropdownMenuGroup>
      )
    )

  const pinItems = (list: Array<Entry>, depth: number): React.ReactNode =>
    list.filter(hasPinnable).map((entry) => {
      if (entry.kind === "group")
        return (
          <DropdownMenuGroup key={entry.id}>
            <DropdownMenuLabel
              style={{ paddingInlineStart: `${0.5 + depth}rem` }}
            >
              {entry.header}
            </DropdownMenuLabel>
            {pinItems(entry.entries, depth + 1)}
          </DropdownMenuGroup>
        )
      const { column } = entry
      const side = pinSide(viewColumns, column.id)
      return (
        <DropdownMenuSub key={column.id}>
          <DropdownMenuSubTrigger
            style={
              depth ? { paddingInlineStart: `${0.5 + depth}rem` } : undefined
            }
          >
            {column.header}
            {side !== "none" && (
              <span className="ms-auto text-xs text-muted-foreground">
                {side === "start" ? t("pinnedStart") : t("pinnedEnd")}
              </span>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={side}
              onValueChange={(next: string, details) => {
                const columnName = column.header
                if (
                  actions.updateView(
                    (current) =>
                      setColumnPinned(
                        current,
                        column.id,
                        next === "start" || next === "end" ? next : null
                      ),
                    "pin",
                    details.event
                  )
                )
                  announce(
                    next === "start"
                      ? t("columnPinnedStart", { columnName })
                      : next === "end"
                        ? t("columnPinnedEnd", { columnName })
                        : t("columnUnpinned", { columnName })
                  )
              }}
            >
              <DropdownMenuRadioItem value="none">
                {t("notPinned")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="start">
                {t("pinnedStart")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="end">
                {t("pinnedEnd")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    })

  return (
    <DataTableToolbarItem
      value="data-table-columns-menu"
      label={t("columns")}
      icon={<Columns3Icon aria-hidden />}
      open={(button) => {
        more.current = button
        setByMore(true)
        setOpen(true)
      }}
    >
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={(next) => {
          if (!next) setByMore(false)
        }}
      >
        <DropdownMenuTrigger
          data-slot="data-table-columns-menu"
          render={<Button variant={variant} {...props} />}
        >
          {children ?? (
            <>
              <Columns3Icon aria-hidden />
              {t("columns")}
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-auto min-w-52"
          anchor={byMore ? more : undefined}
          finalFocus={byMore ? more : undefined}
        >
          {hideable && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("showColumns")}</DropdownMenuLabel>
              {showItems(entries, 0)}
            </DropdownMenuGroup>
          )}
          {hideable && pinnable && <DropdownMenuSeparator />}
          {pinnable && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("pinColumns")}</DropdownMenuLabel>
              {pinItems(entries, 0)}
            </DropdownMenuGroup>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            // Off while the columns are the default view's.
            disabled={!changed}
            onClick={(event) =>
              actions.updateView(
                (current) =>
                  resetColumns(current, context.store.get().defaults),
                "reset",
                event.nativeEvent
              )
            }
          >
            {t("resetColumns")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DataTableToolbarItem>
  )
}

export { DataTableColumnsMenu }
export type { DataTableColumnsMenuProps }
