"use client"

/**
 * What a toolbar button shows while its choice is active (`DataTableFilter`'s
 * value, `DataTableGroupBy`'s columns), the faceted filter's pattern: a
 * full-height vertical `Separator` after the button's label, then the choice
 * in a secondary `Badge` (square corners, regular weight), cut short when
 * long. The badge's id describes the button.
 */
import * as React from "react"

import { Badge } from "@tecton/react/badge"
import { Separator } from "@tecton/react/separator"

function DataTableTriggerSummary({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <>
      <Separator orientation="vertical" className="mx-0.5" />
      <Badge
        id={id}
        variant="secondary"
        data-slot="data-table-trigger-summary"
        className="max-w-40 rounded-sm px-1 font-normal"
      >
        <span className="min-w-0 truncate">{children}</span>
      </Badge>
    </>
  )
}

export { DataTableTriggerSummary }
