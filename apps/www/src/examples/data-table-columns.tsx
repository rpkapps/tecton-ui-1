"use client"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  operator: string
  status: "producing" | "shut-in" | "drilling"
  survey: { md: number }
  spud: Date
  subsea: boolean
}

const wells: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    operator: "Equinor",
    status: "producing",
    survey: { md: 3250 },
    spud: new Date(Date.UTC(1986, 3, 14)),
    subsea: false,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    operator: "Equinor",
    status: "shut-in",
    survey: { md: 2980 },
    spud: new Date(Date.UTC(1988, 8, 2)),
    subsea: false,
  },
  {
    id: "p7",
    name: "34/7-P-7",
    field: "Snorre",
    operator: "Equinor",
    status: "producing",
    survey: { md: 4410 },
    spud: new Date(Date.UTC(2001, 1, 20)),
    subsea: true,
  },
  {
    id: "g2",
    name: "2/8-G-2",
    field: "Valhall",
    operator: "Aker BP",
    status: "drilling",
    survey: { md: 1420 },
    spud: new Date(Date.UTC(2024, 9, 7)),
    subsea: false,
  },
  {
    id: "e5",
    name: "25/11-E-5",
    field: "Balder",
    operator: "Vår Energi",
    status: "producing",
    survey: { md: 3105 },
    spud: new Date(Date.UTC(1998, 5, 30)),
    subsea: true,
  },
]

const columns = createColumns<Well>([
  {
    id: "location",
    header: "Location",
    columns: [
      {
        id: "field",
        header: "Field",
        // Two lines: the field, and its operator under it.
        cell: (well, { text }) => (
          <span className="flex flex-col">
            {text}
            <span className="text-xs text-muted-foreground">
              {well.operator}
            </span>
          </span>
        ),
      },
      // Names the row, although it is not the first column.
      { id: "name", header: "Well", rowHeader: true },
    ],
  },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "info" },
    ],
  },
  {
    id: "drilling",
    header: "Drilling",
    columns: [
      {
        id: "md",
        header: "MD",
        type: "number",
        accessor: (well) => well.survey.md,
        format: { style: "unit", unit: "meter", maximumFractionDigits: 0 },
      },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: { year: "numeric", month: "short", timeZone: "UTC" },
        hideBelow: "md",
      },
    ],
  },
  { id: "subsea", header: "Subsea", type: "boolean", sortable: false },
])

export default function DataTableColumns() {
  return (
    <DataTable
      items={wells}
      columns={columns}
      // Drag a header to move its column (a grouped one among its group's);
      // with the keyboard, Enter on a header, the arrows, then Enter.
      reorderableColumns
      // Sorted by field, then by MD within each field: the numbers by the
      // arrows give the order. Shift + click a header to add it.
      defaultView={{
        sorting: [
          { column: "field", direction: "ascending" },
          { column: "md", direction: "descending" },
        ],
      }}
      className="w-full"
    >
      <DataTableContent aria-label="Wells by location and drilling data" />
    </DataTable>
  )
}
