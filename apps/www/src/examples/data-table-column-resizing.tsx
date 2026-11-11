"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableToolbar,
  useDataTable,
  type DataTablePartialView,
} from "@tecton/react/tecton/data-table"

type Run = {
  id: string
  well: string
  tool: string
  interval: string
  top: number
  base: number
  remarks: string
}

const RUNS: Array<Run> = [
  {
    id: "r1",
    well: "34/10-A-12",
    tool: "Gamma ray, resistivity",
    interval: "Reservoir section",
    top: 2850,
    base: 3250,
    remarks: "Good hole conditions; repeat section matches the main pass.",
  },
  {
    id: "r2",
    well: "34/10-A-12",
    tool: "Density, neutron",
    interval: "Reservoir section",
    top: 2850,
    base: 3248,
    remarks: "Pad contact lost over a washout at 3,012 m.",
  },
  {
    id: "r3",
    well: "34/7-D-2",
    tool: "Formation tester",
    interval: "Upper Brent",
    top: 2410,
    base: 2585,
    remarks: "14 pressure points, 2 samples taken.",
  },
  {
    id: "r4",
    well: "2/8-C-3",
    tool: "Sonic",
    interval: "Chalk",
    top: 2290,
    base: 2620,
    remarks: "Cycle skipping below 2,600 m.",
  },
]

const columns = createColumns<Run>([
  { id: "well", header: "Well", width: 140, minWidth: 112 },
  { id: "tool", header: "Tool string", width: 200 },
  { id: "interval", header: "Interval" },
  { id: "top", header: "Top (m)", type: "number", width: 120, maxWidth: 160 },
  { id: "base", header: "Base (m)", type: "number", width: 120, maxWidth: 160 },
  { id: "remarks", header: "Remarks", sortable: false },
])

/** The widths the user set, as `onViewChange` reports them. */
function Widths() {
  const { view, resetColumns } = useDataTable<Run>()
  const widths = Object.entries(view.columns.widths)
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <span className="truncate">
        {widths.length
          ? widths.map(([id, width]) => `${id} ${width} px`).join(", ")
          : "Drag a column's edge, double-click it to fit, or use the column's menu."}
      </span>
      {widths.length > 0 && (
        <Button
          variant="link"
          size="sm"
          className="shrink-0"
          onClick={resetColumns}
        >
          Reset
        </Button>
      )}
    </span>
  )
}

export default function DataTableColumnResizing() {
  const [view, setView] = React.useState<DataTablePartialView>({})
  return (
    <DataTable
      items={RUNS}
      columns={columns}
      resizableColumns
      view={view}
      onViewChange={setView}
      className="w-full"
    >
      <DataTableToolbar>
        <span id="data-table-resizing-title" className="font-medium">
          Logging runs
        </span>
        <Widths />
      </DataTableToolbar>
      <DataTableContent aria-labelledby="data-table-resizing-title" />
    </DataTable>
  )
}
