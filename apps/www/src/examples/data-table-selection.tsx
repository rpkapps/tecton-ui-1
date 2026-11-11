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
  DataTableFooter,
  DataTableSelectionCount,
  DataTableToolbar,
  type DataTableSelectionMode,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "plugged"
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
    id: "a3",
    name: "34/10-A-3",
    field: "Gullfaks",
    status: "plugged",
    depth: 2210,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "shut-in",
    depth: 2980,
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "producing",
    depth: 2735,
  },
  {
    id: "d9",
    name: "34/7-D-9",
    field: "Snorre",
    status: "plugged",
    depth: 3390,
  },
  {
    id: "e5",
    name: "30/9-E-5",
    field: "Oseberg",
    status: "producing",
    depth: 3105,
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
      { value: "plugged", label: "Plugged", variant: "secondary" },
    ],
  },
  { id: "depth", header: "TD (m)", type: "number" },
])

const MODES: Array<DataTableSelectionMode> = ["none", "single", "multiple"]

export default function DataTableSelection() {
  const [mode, setMode] = React.useState<DataTableSelectionMode>("multiple")
  const [focusDisabled, setFocusDisabled] = React.useState(false)
  const [value, setValue] = React.useState<ReadonlyArray<string>>(["a12"])
  const [opened, setOpened] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <DataTable
        items={wells}
        columns={columns}
        selectionMode={mode}
        value={value}
        onValueChange={setValue}
        isItemDisabled={(well) => well.status === "plugged"}
        disabledBehavior={focusDisabled ? "selection" : "all"}
        onActivate={(_, well) => setOpened(well.name)}
      >
        <DataTableToolbar className="gap-4">
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="Selection mode"
            value={[mode]}
            onValueChange={(next) => {
              const picked = MODES.find((candidate) => candidate === next[0])
              if (picked) setMode(picked)
            }}
          >
            <ToggleGroupItem value="none">None</ToggleGroupItem>
            <ToggleGroupItem value="single">Single</ToggleGroupItem>
            <ToggleGroupItem value="multiple">Multiple</ToggleGroupItem>
          </ToggleGroup>
          <Field orientation="horizontal" className="w-auto">
            <Switch
              id="data-table-disabled-behavior"
              checked={focusDisabled}
              onCheckedChange={setFocusDisabled}
            />
            <FieldLabel htmlFor="data-table-disabled-behavior">
              Plugged wells can be opened
            </FieldLabel>
          </Field>
        </DataTableToolbar>
        <DataTableContent aria-label="Wells" />
        {mode !== "none" && (
          <DataTableFooter>
            <DataTableSelectionCount />
          </DataTableFooter>
        )}
      </DataTable>
      <p className="text-sm text-muted-foreground">
        Selected: {value.length > 0 ? value.join(", ") : "none"}. Opened:{" "}
        {opened ?? "none"}.
      </p>
    </div>
  )
}
