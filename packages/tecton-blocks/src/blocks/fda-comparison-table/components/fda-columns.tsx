"use client"

import { cn } from "cn"
import { CopyIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"
import {
  createColumns,
  DataTableRowActions,
} from "@tecton/react/tecton/data-table"
import { Meter } from "@tecton/react/tecton/meter"
import { useLocale } from "@tecton/react/tecton/provider"

import { formatFirstOil, riskLabel, statusMeta } from "../data"
import type { FdaStatus, FieldDevelopmentAlternative } from "../data"

/** An alternative with its rank: its place in the list, ranked by NPV. */
type RankedAlternative = FieldDevelopmentAlternative & { rank: number }

function MonoValue({
  value,
  unit,
  className,
  digits = 1,
  prefix,
}: {
  value: number
  unit?: string
  className?: string
  digits?: number
  prefix?: string
}) {
  const { locale } = useLocale()
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {value.toLocaleString(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
      {unit && (
        <span className="ms-1 text-[0.85em] text-muted-foreground">{unit}</span>
      )}
    </span>
  )
}

type ColumnCallbacks = {
  onOpen?: ((fda: RankedAlternative) => void) | undefined
  onDuplicate?: (fda: RankedAlternative) => void
  onDelete?: (fda: RankedAlternative) => void
}

const statusOptions = (Object.keys(statusMeta) as FdaStatus[]).map(
  (status) => ({
    value: status,
    label: statusMeta[status].label,
    variant: statusMeta[status].color,
  })
)

/** Column definitions for the FDA comparison table. */
function createFdaColumns(callbacks: ColumnCallbacks = {}) {
  return createColumns<RankedAlternative>([
    {
      id: "rank",
      header: "Rank",
      type: "number",
      align: "start",
      rowHeader: false,
      cell: (fda) => (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-6 w-1.5 shrink-0 rounded-sm"
            style={{ background: fda.color }}
          />
          <span className="font-mono tabular-nums">{fda.rank}</span>
        </span>
      ),
    },
    {
      id: "code",
      header: "FDA",
      // The FDA names the row, so a screen reader reads it with every cell.
      rowHeader: true,
      cell: (fda) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-muted-foreground">
            {fda.code}
          </span>
          <span className="truncate font-medium">{fda.name}</span>
        </span>
      ),
    },
    {
      id: "npv",
      header: "NPV",
      type: "number",
      cell: (fda) => (
        <MonoValue
          value={fda.npv}
          prefix="$"
          unit="MM"
          className="text-success"
        />
      ),
    },
    {
      id: "irr",
      header: "IRR",
      type: "number",
      cell: (fda) => <MonoValue value={fda.irr} unit="%" />,
    },
    {
      id: "capex",
      header: "CAPEX",
      type: "number",
      cell: (fda) => <MonoValue value={fda.capex} prefix="$" unit="MM" />,
    },
    {
      id: "peakProduction",
      header: "Peak production",
      type: "number",
      cell: (fda) => <MonoValue value={fda.peakProduction} unit="Mbbl/d" />,
    },
    {
      id: "firstOil",
      header: "First oil",
      // "2029-03": sorts chronologically as text.
      cell: (fda) => (
        <span className="font-mono tabular-nums">
          {formatFirstOil(fda.firstOil)}
        </span>
      ),
    },
    {
      id: "risk",
      header: "Risk",
      type: "number",
      align: "start",
      cell: (fda) => (
        <Meter
          aria-label={`Risk ${riskLabel(fda.risk)}`}
          value={fda.risk}
          color="auto"
          size="sm"
          segments={5}
          valueLabel={
            <span className="text-[0.625rem]">{riskLabel(fda.risk)}</span>
          }
          className="w-28 gap-0.5"
        />
      ),
    },
    {
      id: "status",
      header: "Status",
      type: "options",
      options: statusOptions,
      cell: (fda) => {
        const meta = statusMeta[fda.status]
        return (
          <Badge
            variant={meta.color}
            appearance={fda.status === "archived" ? "outline" : "solid"}
          >
            {meta.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      renderHeader: () => <span className="sr-only">Actions</span>,
      align: "end",
      sortable: false,
      hideable: false,
      cell: (fda) => (
        <DataTableRowActions aria-label={`Actions for ${fda.code}`}>
          <DropdownMenuItem onClick={() => callbacks.onOpen?.(fda)}>
            <PencilIcon /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => callbacks.onDuplicate?.(fda)}>
            <CopyIcon /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon /> Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => callbacks.onDelete?.(fda)}
          >
            <TrashIcon /> Delete
          </DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ])
}

export { createFdaColumns, MonoValue }
export type { ColumnCallbacks, RankedAlternative }
