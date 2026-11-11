"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableCellSummary,
  DataTableContent,
  DataTableFooter,
  type DataTableCellChange,
} from "@tecton/react/tecton/data-table"

type Allocation = {
  id: string
  well: string
  field: string
  status: "flowing" | "shut-in" | "testing"
  hours: number
  oil: number
  gas: number
  water: number
}

const INITIAL: Array<Allocation> = [
  ["34/10-A-12", "Gullfaks", "flowing", 24, 1840, 212, 960],
  ["34/10-B-3", "Gullfaks", "flowing", 18.5, 920, 104, 1210],
  ["34/10-C-7", "Gullfaks", "testing", 24, 1210, 133, 430],
  ["34/7-D-2", "Snorre", "flowing", 22, 2310, 158, 640],
  ["34/7-P-11", "Snorre", "shut-in", 0, 0, 0, 0],
  ["2/8-C-3", "Valhall", "flowing", 24, 1460, 241, 180],
  ["2/8-F-14", "Valhall", "testing", 12, 640, 88, 520],
].map(([well, field, status, hours, oil, gas, water]) => ({
  id: well as string,
  well: well as string,
  field: field as string,
  status: status as Allocation["status"],
  hours: hours as number,
  oil: oil as number,
  gas: gas as number,
  water: water as number,
}))

const atLeastZero = (value: unknown) =>
  typeof value === "number" && value < 0 ? "Enter 0 or more" : null

const columns = createColumns<Allocation>([
  // The well and its field are the record's: not written.
  { id: "well", header: "Well", editable: false },
  { id: "field", header: "Field", editable: false },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "flowing", label: "Flowing", variant: "success" },
      { value: "testing", label: "Testing", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
    ],
  },
  {
    id: "hours",
    header: "On stream (h)",
    type: "number",
    format: { maximumFractionDigits: 1 },
    validate: (value) =>
      typeof value === "number" && (value < 0 || value > 24)
        ? "Enter 0 to 24 hours"
        : null,
  },
  { id: "oil", header: "Oil (Sm³)", type: "number", validate: atLeastZero },
  { id: "gas", header: "Gas (kSm³)", type: "number", validate: atLeastZero },
  {
    id: "water",
    header: "Water (m³)",
    type: "number",
    validate: atLeastZero,
  },
])

/** The allocation system's save: it refuses water over the separator's capacity. */
function save(changes: ReadonlyArray<DataTableCellChange<Allocation>>) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const over = changes.find(
        (change) =>
          change.column === "water" &&
          typeof change.value === "number" &&
          change.value > 5000
      )
      if (over) reject(new Error("Over the separator's capacity (5,000 m³)"))
      else resolve()
    }, 600)
  })
}

/** The changes applied to the allocations: each cell's value. */
function apply(
  current: ReadonlyArray<Allocation>,
  changes: ReadonlyArray<DataTableCellChange<Allocation>>
) {
  return current.map((allocation) => {
    const own = changes.filter((change) => change.row === allocation.id)
    if (own.length === 0) return allocation
    const next: Record<string, unknown> = { ...allocation }
    for (const change of own) next[change.column] = change.value ?? 0
    return next as Allocation
  })
}

/** The changes rolled back: a cell only while it still holds the value written. */
function rollBack(
  current: ReadonlyArray<Allocation>,
  changes: ReadonlyArray<DataTableCellChange<Allocation>>
) {
  return apply(
    current,
    changes
      .filter((change) => {
        const now = current.find((allocation) => allocation.id === change.row)
        return now?.[change.column as keyof Allocation] === (change.value ?? 0)
      })
      .map((change) => ({ ...change, value: change.previousValue }))
  )
}

export default function DataTableCellSelection() {
  const [allocations, setAllocations] = React.useState(INITIAL)
  return (
    <DataTable
      items={allocations}
      columns={columns}
      cellSelectionMode="range"
      editable
      onCellsChange={async (changes) => {
        setAllocations((current) => apply(current, changes))
        try {
          await save(changes)
        } catch (error) {
          // Back to the values before, but in the cells a later write
          // has changed again; the others show the error.
          setAllocations((current) => rollBack(current, changes))
          throw error
        }
      }}
      className="w-full"
    >
      <DataTableContent aria-label="Daily allocation" />
      <DataTableFooter>
        <DataTableCellSummary />
      </DataTableFooter>
    </DataTable>
  )
}
