"use client"

/**
 * `DataTableGroupBy`: an outline "Group by" button with a menu to choose
 * the columns the rows are grouped by and their order (`groupable`;
 * `group-by-menu.tsx`). While the rows are grouped, the button shows the
 * grouping columns, the outermost first ("Group by · Field, Status").
 *
 * The button is a plain one for its whole life; the menu's code loads on
 * demand, in idle time once the button is shown or as it is pointed at or
 * focused, and a press made before it is there opens the menu once it is
 * (`lazy-popup.ts`). Without `groupable` it renders nothing, with a
 * warning in development.
 */
import * as React from "react"
import { ListTreeIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"
import { useLocale } from "@tecton/react/tecton/provider"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import { getColumnModel, resolveLocale } from "./engine/index"
import { usePrefetchFeatures } from "./lazy"
import { mergeButtonProps, useLazyPopup } from "./lazy-popup"

type DataTableGroupByProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** The button's content: "Group by" (and the grouping columns) by default. */
  children?: React.ReactNode
}

const NO_FEATURES = [] as const
const GROUP_BY = ["groupBy"] as const

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
  usePrefetchFeatures(off ? NO_FEATURES : GROUP_BY)
  const lazy = useLazyPopup("groupBy", { on: !off, popup: "menu" })
  const summaryId = React.useId()
  if (off) return null

  const { byId } = getColumnModel(columns)
  const summary =
    grouping.length > 0
      ? new Intl.ListFormat(resolveLocale(locale), {
          type: "unit",
          style: "short",
        }).format(grouping.map((id) => byId.get(id)?.header ?? id))
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
  const Menu = lazy.module?.DataTableGroupByMenu
  return (
    <>
      <Button
        data-slot="data-table-group-by"
        data-active={summary ? "" : undefined}
        {...mergeButtonProps(trigger, lazy.buttonProps)}
      >
        {children ?? (
          <>
            <ListTreeIcon aria-hidden />
            {t("groupBy")}
            {summary && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Badge id={summaryId} variant="secondary" className="max-w-48">
                  <span className="min-w-0 truncate">{summary}</span>
                </Badge>
              </>
            )}
          </>
        )}
      </Button>
      {lazy.mounted && Menu && (
        <Menu context={context} popup={lazy.popupProps} />
      )}
    </>
  )
}

export { DataTableGroupBy }
export type { DataTableGroupByProps }
