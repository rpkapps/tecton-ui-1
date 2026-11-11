"use client"

import * as React from "react"
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableGroupBy,
  DataTableToolbar,
  useDataTable,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "injecting" | "shut-in" | "drilling"
  oil: number
  spud: Date
}

const FIELDS = [
  "Gullfaks",
  "Statfjord",
  "Snorre",
  "Oseberg",
  "Troll",
  "Heidrun",
]
const STATUSES: Array<Well["status"]> = [
  "producing",
  "injecting",
  "shut-in",
  "drilling",
]

/** 100,000 wells from a seeded generator: the same table on every render. */
function generate(): Array<Well> {
  return Array.from({ length: 100_000 }, (_, i) => {
    const seed = (i * 2654435761) % 2 ** 32
    return {
      id: `w${i}`,
      name: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
      field: FIELDS[seed % FIELDS.length],
      status: STATUSES[(seed >>> 3) % STATUSES.length],
      oil: (seed >>> 7) % 4000,
      spud: new Date(Date.UTC(1980 + (seed % 45), (seed >>> 5) % 12, 1)),
    }
  })
}

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "injecting", label: "Injecting", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "secondary" },
    ],
  },
  { id: "oil", header: "Oil (Sm³/d)", type: "number" },
  {
    id: "spud",
    header: "Spud",
    type: "date",
    format: { year: "numeric", month: "short", timeZone: "UTC" },
    // The group's first well: the earliest spud.
    aggregate: "min",
  },
])

/**
 * Expand and collapse every group: a part of your own, from `useDataTable`.
 * A button with nothing to do is off, and keeps focus once pressed.
 */
function GroupToggles() {
  const {
    view,
    expandAllGroups,
    collapseAllGroups,
    canExpandAllGroups,
    canCollapseAllGroups,
  } = useDataTable<Well>()
  if (view.grouping.length === 0) return null
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canExpandAllGroups}
        focusableWhenDisabled
        onClick={expandAllGroups}
      >
        <ChevronsUpDownIcon aria-hidden />
        Expand all
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canCollapseAllGroups}
        focusableWhenDisabled
        onClick={collapseAllGroups}
      >
        <ChevronsDownUpIcon aria-hidden />
        Collapse all
      </Button>
    </>
  )
}

export default function DataTableGroupingVirtual() {
  // Generated once the example renders, not when the page loads.
  const [wells] = React.useState(generate)
  return (
    <DataTable
      items={wells}
      columns={columns}
      groupable
      selectionMode="multiple"
      size="sm"
      striped
      defaultView={{ grouping: ["field", "status"] }}
      className="h-96 w-full"
    >
      <DataTableToolbar>
        <DataTableGroupBy />
        <GroupToggles />
      </DataTableToolbar>
      <DataTableContent aria-label="Wells" virtualized />
    </DataTable>
  )
}
