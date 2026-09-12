"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CopyIcon,
  MoreVerticalIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Chip } from "@tecton/react/tecton/chip"
import { createDataTableColumns } from "@tecton/react/tecton/data-table"
import { Meter } from "@tecton/react/tecton/meter"

import {
  formatFirstOil,
  riskLabel,
  statusMeta,
  type FieldDevelopmentAlternative,
} from "../data"

const columns = createDataTableColumns<FieldDevelopmentAlternative>()

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
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
      {unit && (
        <span className="ml-1 text-[0.85em] text-muted-foreground">{unit}</span>
      )}
    </span>
  )
}

type ColumnCallbacks = {
  onOpen?: (fda: FieldDevelopmentAlternative) => void
  onDuplicate?: (fda: FieldDevelopmentAlternative) => void
  onDelete?: (fda: FieldDevelopmentAlternative) => void
}

/** Column definitions for the FDA comparison `DataTable`. */
function createFdaColumns(callbacks: ColumnCallbacks = {}) {
  return [
    columns.display({
      id: "rank",
      header: "Rank",
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-6 w-1.5 shrink-0 rounded-sm"
            style={{ background: row.original.color }}
          />
          <span className="font-mono tabular-nums">{row.index + 1}</span>
        </span>
      ),
    }),
    columns.accessor("code", {
      header: "FDA",
      cell: ({ row, getValue }) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-muted-foreground">
            {getValue()}
          </span>
          <span className="truncate font-medium">{row.original.name}</span>
        </span>
      ),
    }),
    columns.accessor("npv", {
      header: "NPV",
      cell: ({ getValue }) => (
        <MonoValue value={getValue()} prefix="$" unit="MM" className="text-success" />
      ),
    }),
    columns.accessor("irr", {
      header: "IRR",
      cell: ({ getValue }) => <MonoValue value={getValue()} unit="%" />,
    }),
    columns.accessor("capex", {
      header: "CAPEX",
      cell: ({ getValue }) => <MonoValue value={getValue()} prefix="$" unit="MM" />,
    }),
    columns.accessor("peakProduction", {
      header: "Peak production",
      cell: ({ getValue }) => <MonoValue value={getValue()} unit="Mbbl/d" />,
    }),
    columns.accessor("firstOil", {
      header: "First oil",
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{formatFirstOil(getValue())}</span>
      ),
    }),
    columns.accessor("risk", {
      header: "Risk",
      cell: ({ getValue }) => (
        <Meter
          aria-label={`Risk ${riskLabel(getValue())}`}
          value={getValue()}
          color="auto"
          size="sm"
          segments={5}
          valueLabel={riskLabel(getValue())}
          className="w-28 gap-0.5 [&_[data-slot=meter-value]]:text-[0.625rem]"
        />
      ),
    }),
    columns.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const meta = statusMeta[getValue()]
        return (
          <Chip
            size="xs"
            color={meta.color}
            variant={getValue() === "archived" ? "outlined" : "filled"}
          >
            {meta.label}
          </Chip>
        )
      },
    }),
    columns.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex justify-end">
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${row.original.code}`}
            >
              <MoreVerticalIcon />
            </Button>
            <DropdownMenu placement="bottom end">
              <DropdownMenuItem onAction={() => callbacks.onOpen?.(row.original)}>
                <PencilIcon /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onAction={() => callbacks.onDuplicate?.(row.original)}>
                <CopyIcon /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon /> Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onAction={() => callbacks.onDelete?.(row.original)}
              >
                <TrashIcon /> Delete
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </span>
      ),
    }),
  ]
}

export { createFdaColumns, MonoValue }
export type { ColumnCallbacks }
