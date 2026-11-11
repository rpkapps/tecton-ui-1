"use client"

import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableToolbar,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  depth: number
}

const wells: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "producing",
    depth: 3250,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "shut-in",
    depth: 2980,
  },
  {
    id: "c7",
    name: "33/9-C-7",
    field: "Statfjord",
    status: "drilling",
    depth: 1420,
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "producing",
    depth: 2735,
  },
  {
    id: "e5",
    name: "30/9-E-5",
    field: "Oseberg",
    status: "producing",
    depth: 3105,
  },
  {
    id: "f1",
    name: "30/6-F-1",
    field: "Oseberg",
    status: "shut-in",
    depth: 2890,
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

export default function DataTableSizes() {
  const [size, setSize] = React.useState<"default" | "sm">("sm")
  const [striped, setStriped] = React.useState(true)

  return (
    <DataTable
      items={wells}
      columns={columns}
      size={size}
      striped={striped}
      className="w-full max-w-2xl"
    >
      <DataTableToolbar className="gap-4">
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Size"
          value={[size]}
          onValueChange={(value) => {
            if (value[0] === "default" || value[0] === "sm") setSize(value[0])
          }}
        >
          <ToggleGroupItem value="default">Default</ToggleGroupItem>
          <ToggleGroupItem value="sm">Small</ToggleGroupItem>
        </ToggleGroup>
        <Field orientation="horizontal" className="w-auto">
          <Switch
            id="data-table-striped"
            checked={striped}
            onCheckedChange={setStriped}
          />
          <FieldLabel htmlFor="data-table-striped">Striped</FieldLabel>
        </Field>
      </DataTableToolbar>
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
