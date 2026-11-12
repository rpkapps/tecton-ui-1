"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  status: "producing" | "drilling" | "shut-in" | "plugged"
  depth: number
  spud: Date
  monitored: boolean
  remarks: string
}

const INITIAL: Array<Well> = [
  ["34/10-A-12", "producing", 3120, "2009-03-14", true, "ESP replaced in May"],
  ["34/10-B-3", "producing", 2875, "2011-08-02", true, ""],
  ["34/10-C-7", "drilling", 1960, "2024-11-20", false, "Running 9⅝″ casing"],
  ["34/7-D-2", "shut-in", 2440, "2006-05-30", true, "Awaiting workover rig"],
  ["34/7-P-11", "plugged", 3305, "1998-01-12", false, ""],
  ["2/8-C-3", "producing", 2710, "2015-02-09", true, ""],
].map(([name, status, depth, spud, monitored, remarks]) => ({
  id: name as string,
  name: name as string,
  status: status as Well["status"],
  depth: depth as number,
  spud: new Date(`${spud as string}T00:00:00Z`),
  monitored: monitored as boolean,
  remarks: remarks as string,
}))

const columns = createColumns<Well>([
  // The well's name is its record's: not written.
  { id: "name", header: "Well", editable: false },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "drilling", label: "Drilling", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "plugged", label: "Plugged", variant: "secondary" },
    ],
  },
  {
    id: "depth",
    header: "Depth (m MD)",
    type: "number",
    validate: (value) =>
      typeof value === "number" && (value <= 0 || value > 12_000)
        ? "Enter a depth from 1 to 12,000 m"
        : null,
  },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
    validate: (value) =>
      value instanceof Date && value.getTime() > Date.now()
        ? "A well cannot be spudded in the future"
        : null,
  },
  { id: "monitored", header: "Monitored", type: "boolean" },
  {
    id: "remarks",
    header: "Remarks",
    wrap: true,
    // A plugged well's record is closed.
    editable: (well) => well.status !== "plugged",
  },
])

/** The well registry's save: it refuses depths past the rig's rating. */
function save(changes: ReadonlyArray<DataTableCellChange<Well>>) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const deep = changes.find(
        (change) =>
          change.column === "depth" &&
          typeof change.value === "number" &&
          change.value > 8000
      )
      if (deep)
        reject(new Error("Deeper than the rig's rating (8,000 m): not saved"))
      else resolve()
    }, 800)
  })
}

/** The changes applied to the wells: each cell's value. */
function apply(
  current: ReadonlyArray<Well>,
  changes: ReadonlyArray<DataTableCellChange<Well>>
) {
  return current.map((well) => {
    const own = changes.filter((change) => change.row === well.id)
    if (own.length === 0) return well
    const next: Record<string, unknown> = { ...well }
    for (const change of own) next[change.column] = change.value
    return next as Well
  })
}

/** The changes rolled back: a cell only while it still holds the value written. */
function rollBack(
  current: ReadonlyArray<Well>,
  changes: ReadonlyArray<DataTableCellChange<Well>>
) {
  return apply(
    current,
    changes
      .filter((change) => {
        const now = current.find((well) => well.id === change.row)
        return now?.[change.column as keyof Well] === change.value
      })
      .map((change) => ({ ...change, value: change.previousValue }))
  )
}

export default function DataTableEditing() {
  const [wells, setWells] = React.useState(INITIAL)
  return (
    <DataTable
      items={wells}
      columns={columns}
      editable
      onCellsChange={async (changes) => {
        setWells((current) => apply(current, changes))
        try {
          await save(changes)
        } catch (error) {
          setWells((current) => rollBack(current, changes))
          throw error
        }
      }}
      className="w-full"
    >
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
