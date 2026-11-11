"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  depth: number
}

const wells: Array<Well> = [
  {
    id: "34-10-a-12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "producing",
    depth: 3250,
  },
  {
    id: "34-10-b-3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "shut-in",
    depth: 2980,
  },
  {
    id: "34-7-p-7",
    name: "34/7-P-7",
    field: "Snorre",
    status: "drilling",
    depth: 1420,
  },
  {
    id: "2-8-g-2",
    name: "2/8-G-2",
    field: "Valhall",
    status: "producing",
    depth: 2730,
  },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
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
  { id: "depth", header: "TD (m)", type: "number" },
])

export default function DataTableLinks() {
  // Stands in for the application's router, which the root provider
  // usually carries: here a link only reports where it goes.
  const [opened, setOpened] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <TectonProvider navigate={setOpened}>
        <DataTable
          items={wells}
          columns={columns}
          itemToHref={(well) => `#wells/${well.id}`}
        >
          <DataTableContent aria-label="Wells" />
        </DataTable>
      </TectonProvider>
      <p className="text-sm text-muted-foreground">
        Navigated to:{" "}
        <code className="font-mono text-foreground">{opened ?? "nothing"}</code>
      </p>
    </div>
  )
}
