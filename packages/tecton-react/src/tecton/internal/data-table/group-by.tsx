"use client"

/**
 * `DataTableGroupBy`: an outline "Group by" button with a menu to choose
 * the columns the rows are grouped by and their order (`groupable`;
 * `group-by-menu.tsx`). While the rows are grouped, the button shows the
 * grouping columns, the outermost first ("Group by · Field, Status").
 *
 * The button is the menu's own trigger, as on a `DropdownMenu`
 * (`part-popup.ts`), and the menu's items render only while it is open.
 * Without `groupable` it renders nothing, with a warning in development.
 */
import * as React from "react"
import { ListTreeIcon } from "lucide-react"

import { Button } from "@tecton/react/button"
import { DropdownMenu, DropdownMenuTrigger } from "@tecton/react/dropdown-menu"
import { useLocale } from "@tecton/react/provider"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import { getColumnModel, getListFormat, resolveLocale } from "./engine/index"
import { DataTableGroupByMenu } from "./group-by-menu"
import { usePartPopup } from "./part-popup"
import { DataTableToolbarItem } from "./toolbar"
import { DataTableTriggerSummary } from "./trigger-summary"

type DataTableGroupByProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The button's content: "Group by" (and the grouping columns) by default. */
  children?: React.ReactNode
}

function DataTableGroupBy({
  children,
  variant = "outline",
  size = "sm",
  ...props
}: DataTableGroupByProps) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const context = useDataTableContext<unknown>("DataTableGroupBy")
  const groupable = useDataTableSelector(
    context,
    (state) => state.options.groupable
  )
  const columns = useDataTableSelector(context, (state) => state.columns)
  const grouping = useDataTableSelector(context, (state) => state.view.grouping)
  const off = !groupable
  useFeatureWarning(context, off, "DataTableGroupBy", "`groupable`")
  const popup = usePartPopup()
  const summaryId = React.useId()
  if (off) return null

  const { byId } = getColumnModel(columns)
  const summary =
    grouping.length > 0
      ? getListFormat(resolveLocale(locale), "unit").format(
          grouping.map((id) => byId.get(id)?.header ?? id)
        )
      : null
  const trigger: React.ComponentProps<typeof Button> = {
    variant,
    size,
    // Named and described by the default content only: children of the
    // caller's name the button themselves.
    "aria-label": children ? undefined : t("groupBy"),
    "aria-describedby": !children && summary ? summaryId : undefined,
    ...props,
  }
  return (
    <DataTableToolbarItem
      value="data-table-group-by"
      label={t("groupBy")}
      icon={<ListTreeIcon aria-hidden />}
      open={popup.openBy}
    >
      <DropdownMenu {...popup.root}>
        <DropdownMenuTrigger
          ref={popup.trigger}
          data-slot="data-table-group-by"
          data-active={summary ? "" : undefined}
          render={<Button {...trigger} />}
        >
          {children ?? (
            <>
              <ListTreeIcon aria-hidden />
              {t("groupBy")}
              {summary && (
                <DataTableTriggerSummary id={summaryId}>
                  {summary}
                </DataTableTriggerSummary>
              )}
            </>
          )}
        </DropdownMenuTrigger>
        <DataTableGroupByMenu context={context} popup={popup} />
      </DropdownMenu>
    </DataTableToolbarItem>
  )
}

export { DataTableGroupBy }
export type { DataTableGroupByProps }
