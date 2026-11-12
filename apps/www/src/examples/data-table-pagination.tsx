"use client"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
} from "@tecton/react/tecton/data-table"

type Run = {
  id: string
  well: string
  tool: string
  top: number
  date: Date
}

const TOOLS = ["Gamma ray", "Resistivity", "Density", "Neutron", "Sonic"]

/** 137 logging runs over five wells. */
const runs: Array<Run> = Array.from({ length: 137 }, (_, i) => ({
  id: `run-${i + 1}`,
  well: `34/10-A-${(i % 5) + 10}`,
  tool: TOOLS[(i * 3) % TOOLS.length],
  top: 800 + ((i * 173) % 2400),
  date: new Date(Date.UTC(2023, 0, 1 + i * 2)),
}))

const columns = createColumns<Run>([
  { id: "id", header: "Run", accessor: (run) => run.id.replace("run-", "#") },
  { id: "well", header: "Well" },
  { id: "tool", header: "Tool" },
  { id: "top", header: "Top (m)", type: "number" },
  {
    id: "date",
    header: "Logged",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
])

export default function DataTablePaginationDemo() {
  return (
    <DataTable
      items={runs}
      columns={columns}
      pagination
      defaultPageSize={5}
      size="sm"
      className="w-full"
    >
      <DataTableContent aria-label="Logging runs" />
      <DataTableFooter>
        <DataTablePagination pageSizes={[5, 10, 25]} />
      </DataTableFooter>
    </DataTable>
  )
}
