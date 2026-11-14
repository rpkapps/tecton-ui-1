"use client"

import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "@tecton/react/toggle-group"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
} from "@tecton/react/data-table"

type Reading = {
  id: string
  well: string
  date: Date
  oil: number
  water: number
  pressure: number
}

const WELLS = ["34/10-A-12", "34/10-B-3", "34/7-P-7", "2/8-G-2"]

/** 36 daily readings, the same on every render. */
const READINGS: Array<Reading> = Array.from({ length: 36 }, (_, i) => ({
  id: `r${i + 1}`,
  well: WELLS[i % WELLS.length],
  date: new Date(Date.UTC(2026, 9, 1 + Math.floor(i / WELLS.length))),
  oil: 820 + ((i * 137) % 640),
  water: 0.12 + ((i * 7) % 30) / 100,
  pressure: 2150 + ((i * 89) % 420),
}))

const columns = createColumns<Reading>([
  { id: "well", header: "Well" },
  {
    id: "date",
    header: "Date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  {
    id: "oil",
    header: "Oil (bbl/d)",
    type: "number",
  },
  {
    id: "water",
    header: "Water cut",
    type: "number",
    format: { style: "percent" },
  },
  {
    id: "pressure",
    header: "Pressure (psi)",
    type: "number",
  },
])

const SIZES = { default: "Default", sm: "Compact" } as const

type Size = keyof typeof SIZES

function isSize(value: unknown): value is Size {
  return typeof value === "string" && Object.hasOwn(SIZES, value)
}

export default function DataTableSize() {
  const [size, setSize] = React.useState<Size>("sm")
  return (
    <div className="flex w-full flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        aria-label="Size"
        value={[size]}
        onValueChange={(value) => {
          if (isSize(value[0])) setSize(value[0])
        }}
      >
        {Object.entries(SIZES).map(([value, label]) => (
          <ToggleGroupItem key={value} value={value}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DataTable
        items={READINGS}
        columns={columns}
        size={size}
        striped
        pagination
        defaultPageSize={10}
        className="w-full"
      >
        <DataTableContent aria-label="Daily readings" />
        <DataTableFooter>
          <DataTablePagination pageSizes={[10, 25, 50]} />
        </DataTableFooter>
      </DataTable>
    </div>
  )
}
