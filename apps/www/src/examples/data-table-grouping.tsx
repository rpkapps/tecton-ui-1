"use client"

import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableContent,
  DataTableGroupBy,
  DataTableToolbar,
} from "@tecton/react/data-table"

type Allocation = {
  id: string
  well: string
  field: string
  installation: string
  status: "producing" | "injecting" | "shut-in"
  hours: number
  oil: number
  gas: number
  water: number
}

type Status = Allocation["status"]

/** Each installation's wells: the slot prefix and each well's status. */
const INSTALLATIONS: ReadonlyArray<
  [field: string, installation: string, prefix: string, wells: string]
> = [
  ["Gullfaks", "Gullfaks A", "34/10-A-", "ppipps"],
  ["Gullfaks", "Gullfaks B", "34/10-B-", "psppi"],
  ["Gullfaks", "Gullfaks C", "34/10-C-", "ppips"],
  ["Snorre", "Snorre A", "34/7-D-", "pipp"],
  ["Snorre", "Snorre B", "34/7-P-", "sppip"],
  ["Statfjord", "Statfjord A", "33/9-A-", "ppsi"],
  ["Statfjord", "Statfjord B", "33/9-B-", "pipsp"],
  ["Statfjord", "Statfjord C", "33/9-C-", "ppip"],
  ["Oseberg", "Oseberg A", "30/6-A-", "pippp"],
  ["Oseberg", "Oseberg C", "30/6-C-", "psip"],
  ["Oseberg", "Oseberg Sør", "30/9-J-", "ppi"],
  ["Valhall", "Valhall PH", "2/8-C-", "ppsp"],
  ["Valhall", "Valhall Flank", "2/8-F-", "pippi"],
]

const STATUS: Record<string, Status> = {
  p: "producing",
  i: "injecting",
  s: "shut-in",
}

const ALLOCATIONS: Array<Allocation> = INSTALLATIONS.flatMap(
  ([field, installation, prefix, wells], at) =>
    [...wells].map((code, n) => {
      const status = STATUS[code]
      const i = at * 7 + n
      const flowing = status === "producing"
      const well = `${prefix}${3 + n * 4 + (at % 3)}`
      return {
        id: well,
        well,
        field,
        installation,
        status,
        hours: status === "shut-in" ? 0 : [24, 22.5, 24, 18, 24, 21][i % 6],
        oil: flowing ? 600 + ((i * 787) % 1900) : 0,
        gas: flowing ? 60 + ((i * 53) % 190) : 0,
        water: status === "shut-in" ? 0 : 150 + ((i * 331) % 1100),
      }
    })
)

const columns = createColumns<Allocation>([
  { id: "well", header: "Well", width: 170 },
  { id: "field", header: "Field", width: 120 },
  { id: "installation", header: "Installation", width: 150 },
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
    id: "hours",
    header: "On stream (h)",
    type: "number",
    format: { maximumFractionDigits: 1 },
    // Hours do not add up across wells: the mean instead.
    aggregate: "avg",
    width: 140,
  },
  { id: "oil", header: "Oil (Sm³)", type: "number", width: 130 },
  { id: "gas", header: "Gas (kSm³)", type: "number", width: 140 },
  { id: "water", header: "Water (m³)", type: "number", width: 140 },
])

export default function DataTableGrouping() {
  return (
    <DataTable
      items={ALLOCATIONS}
      columns={columns}
      groupable
      selectionMode="multiple"
      pinnableColumns
      defaultView={{
        grouping: ["field", "installation"],
        columns: { pinned: { start: ["well"] } },
      }}
      // A bounded height: the rows scroll under the header, each group's
      // row stuck under it while its rows go past.
      className="h-96 w-full"
    >
      <DataTableToolbar>
        <DataTableGroupBy />
      </DataTableToolbar>
      <DataTableActionBar />
      <DataTableContent aria-label="Daily allocation" totals />
    </DataTable>
  )
}
