"use client"

/**
 * A column's or group's description in the header: an info button that
 * shows it in a popover when pressed (a pointer, a finger or the keyboard),
 * the popover's own trigger as on a `Popover`. Screen readers hear it with
 * the header itself (its accessible description). The column's menu is
 * `column-menu.tsx`.
 */
import * as React from "react"
import { InfoIcon } from "lucide-react"

import { Button } from "@tecton/react/button"
import { Popover, PopoverContent, PopoverTrigger } from "@tecton/react/popover"

import { useTranslations } from "../i18n/translations"

function DataTableColumnDescription({
  name,
  description,
}: {
  /** The column's or group's header. */
  name: string
  description: string
}) {
  const t = useTranslations("dataTable")
  return (
    <Popover>
      <PopoverTrigger
        data-slot="data-table-column-description"
        aria-label={t("columnDescription", { columnName: name })}
        // The cell's own press drags the column; this one shows the text.
        onPointerDown={(event) => event.stopPropagation()}
        render={<Button variant="ghost" size="icon-xs" />}
      >
        <InfoIcon aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        data-slot="data-table-column-description-content"
        className="w-auto max-w-xs text-sm font-normal whitespace-normal"
      >
        {description}
      </PopoverContent>
    </Popover>
  )
}

export { DataTableColumnDescription }
