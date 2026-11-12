"use client"

import {
  createColumns,
  DataTable,
  DataTableColumnsMenu,
  DataTableContent,
  DataTableToolbar,
} from "@tecton/react/tecton/data-table"
import { OverflowSpacer } from "@tecton/react/tecton/overflow"

type Allocation = {
  id: string
  well: string
  field: string
  hours: number
  oil: number
  gas: number
  water: number
  gor: number
}

const ALLOCATIONS: Array<Allocation> = [
  {
    id: "a12",
    well: "34/10-A-12",
    field: "Gullfaks",
    hours: 24,
    oil: 1840,
    gas: 212,
    water: 960,
    gor: 115,
  },
  {
    id: "b3",
    well: "34/10-B-3",
    field: "Gullfaks",
    hours: 18.5,
    oil: 920,
    gas: 104,
    water: 1210,
    gor: 113,
  },
  {
    id: "d2",
    well: "34/7-D-2",
    field: "Snorre",
    hours: 24,
    oil: 2310,
    gas: 158,
    water: 640,
    gor: 68,
  },
  {
    id: "c3",
    well: "2/8-C-3",
    field: "Valhall",
    hours: 22,
    oil: 1460,
    gas: 241,
    water: 180,
    gor: 165,
  },
]

const columns = createColumns<Allocation>([
  { id: "well", header: "Well", hideable: false },
  { id: "field", header: "Field" },
  {
    id: "hours",
    header: "On stream",
    type: "number",
    description: "Hours the well produced in the 24-hour production day.",
    format: { maximumFractionDigits: 1 },
  },
  {
    id: "allocated",
    header: "Allocated",
    description: "Volumes allocated back to the well from the fiscal meter.",
    columns: [
      {
        id: "oil",
        header: "Oil",
        type: "number",
        description: "Stabilized oil, Sm³ at 15 °C and 1.01325 bar.",
      },
      {
        id: "gas",
        header: "Gas",
        type: "number",
        description: "Gas, thousand Sm³.",
      },
      { id: "water", header: "Water", type: "number" },
    ],
  },
  {
    id: "gor",
    header: "GOR",
    type: "number",
    description: "Gas–oil ratio, Sm³/Sm³.",
    hideBelow: "sm",
  },
])

export default function DataTableColumnVisibility() {
  return (
    <DataTable
      items={ALLOCATIONS}
      columns={columns}
      hideableColumns
      pinnableColumns
      defaultView={{ columns: { hidden: ["field"] } }}
      className="w-full"
    >
      <DataTableToolbar>
        <span id="data-table-visibility-title" className="font-medium">
          Daily allocation
        </span>
        <OverflowSpacer />
        <DataTableColumnsMenu />
      </DataTableToolbar>
      <DataTableContent aria-labelledby="data-table-visibility-title" />
    </DataTable>
  )
}
