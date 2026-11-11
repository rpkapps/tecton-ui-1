"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableToolbar,
  type DataTableView,
} from "@tecton/react/tecton/data-table"

type Field = {
  id: string
  name: string
  operator: string
  oil: number
  gas: number
  water: number
  wells: number
}

const FIELDS: Array<Field> = [
  {
    id: "gullfaks",
    name: "Gullfaks",
    operator: "Equinor",
    oil: 5.1,
    gas: 2.3,
    water: 41.2,
    wells: 104,
  },
  {
    id: "snorre",
    name: "Snorre",
    operator: "Equinor",
    oil: 6.4,
    gas: 0.9,
    water: 22.8,
    wells: 72,
  },
  {
    id: "valhall",
    name: "Valhall",
    operator: "Aker BP",
    oil: 3.8,
    gas: 0.7,
    water: 9.6,
    wells: 96,
  },
  {
    id: "ekofisk",
    name: "Ekofisk",
    operator: "ConocoPhillips",
    oil: 7.2,
    gas: 1.8,
    water: 18.4,
    wells: 128,
  },
]

const columns = createColumns<Field>([
  { id: "name", header: "Field", reorderable: false },
  { id: "operator", header: "Operator" },
  {
    id: "production",
    header: "Production (MSm³ o.e.)",
    columns: [
      { id: "oil", header: "Oil", type: "number" },
      { id: "gas", header: "Gas", type: "number" },
      { id: "water", header: "Water", type: "number" },
    ],
  },
  { id: "wells", header: "Wells", type: "number" },
])

export default function DataTableColumnReordering() {
  const [order, setOrder] = React.useState<ReadonlyArray<string>>([])
  const report = (view: DataTableView) => setOrder(view.columns.order)
  return (
    <DataTable
      items={FIELDS}
      columns={columns}
      reorderableColumns
      onViewChange={report}
      className="w-full"
    >
      <DataTableToolbar>
        <span id="data-table-reordering-title" className="font-medium">
          Fields
        </span>
        <span className="ms-auto truncate text-sm text-muted-foreground">
          {order.length
            ? order.join(", ")
            : "Drag a header, or press Enter on it."}
        </span>
      </DataTableToolbar>
      <DataTableContent aria-labelledby="data-table-reordering-title" />
    </DataTable>
  )
}
