"use client"

import {
  createColumns,
  DataTable,
  DataTableColumnsMenu,
  DataTableContent,
  DataTableToolbar,
} from "@tecton/react/tecton/data-table"
import { OverflowSpacer } from "@tecton/react/tecton/overflow"

type Well = {
  id: string
  name: string
  field: string
  operator: string
  status: "producing" | "injecting" | "shut-in"
  spud: Date
  md: number
  tvd: number
  oil: number
  gas: number
  waterCut: number
  pressure: number
}

const FIELDS = [
  { field: "Gullfaks", block: "34/10", operator: "Equinor" },
  { field: "Snorre", block: "34/7", operator: "Equinor" },
  { field: "Valhall", block: "2/8", operator: "Aker BP" },
  { field: "Ekofisk", block: "2/4", operator: "ConocoPhillips" },
] as const
const STATUSES: Array<Well["status"]> = [
  "producing",
  "producing",
  "injecting",
  "shut-in",
]

const WELLS: Array<Well> = Array.from({ length: 12 }, (_, i) => {
  const { field, block, operator } = FIELDS[i % FIELDS.length]
  const md = 2100 + ((i * 587) % 2900)
  return {
    id: `w${i + 1}`,
    name: `${block}-${String.fromCharCode(65 + (i % 3))}-${i + 1}`,
    field,
    operator,
    status: STATUSES[(i * 3) % STATUSES.length],
    spud: new Date(Date.UTC(2006 + (i % 14), (i * 5) % 12, 1 + i)),
    md,
    tvd: Math.round(md * 0.82),
    oil: 180 + ((i * 1373) % 2400),
    gas: 12 + ((i * 97) % 340),
    waterCut: 0.08 + ((i * 7) % 60) / 100,
    pressure: 140 + ((i * 29) % 160),
  }
})

const columns = createColumns<Well>([
  { id: "name", header: "Well", width: 140 },
  { id: "field", header: "Field", width: 120 },
  { id: "operator", header: "Operator", width: 150 },
  {
    id: "status",
    header: "Status",
    type: "options",
    width: 130,
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "injecting", label: "Injecting", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
    ],
  },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    width: 150,
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  {
    id: "depth",
    header: "Depth",
    columns: [
      { id: "md", header: "MD (m)", type: "number", width: 130 },
      { id: "tvd", header: "TVD (m)", type: "number", width: 130 },
    ],
  },
  {
    id: "production",
    header: "Production",
    columns: [
      {
        id: "oil",
        header: "Oil (Sm³/d)",
        type: "number",
        width: 150,
      },
      {
        id: "gas",
        header: "Gas (kSm³/d)",
        type: "number",
        width: 150,
      },
      {
        id: "waterCut",
        header: "Water cut",
        type: "number",
        width: 140,
        format: { style: "percent", maximumFractionDigits: 0 },
      },
    ],
  },
  {
    id: "pressure",
    header: "WHP (bar)",
    type: "number",
    width: 140,
    pinnable: false,
  },
])

export default function DataTableColumnPinning() {
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      selectionMode="multiple"
      striped
      resizableColumns
      pinnableColumns
      hideableColumns
      defaultView={{
        columns: { pinned: { start: ["name"], end: ["status"] } },
      }}
      className="w-full"
    >
      <DataTableToolbar>
        <span id="data-table-pinning-title" className="font-medium">
          Well performance
        </span>
        <OverflowSpacer />
        <DataTableColumnsMenu size="sm" />
      </DataTableToolbar>
      <DataTableContent aria-labelledby="data-table-pinning-title" />
    </DataTable>
  )
}
