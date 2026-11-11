"use client"

import * as React from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTablePartialView,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  depth: number
  spud: Date
}

const wells: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    depth: 3250,
    spud: new Date(Date.UTC(1986, 3, 14)),
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    depth: 2980,
    spud: new Date(Date.UTC(1988, 8, 2)),
  },
  {
    id: "p7",
    name: "34/7-P-7",
    field: "Snorre",
    depth: 4410,
    spud: new Date(Date.UTC(2001, 1, 20)),
  },
  {
    id: "p9",
    name: "34/7-P-9",
    field: "Snorre",
    depth: 3720,
    spud: new Date(Date.UTC(2015, 6, 3)),
  },
  {
    id: "g2",
    name: "2/8-G-2",
    field: "Valhall",
    depth: 2730,
    spud: new Date(Date.UTC(2024, 9, 7)),
  },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "depth", header: "TD (m)", type: "number" },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
])

/** Views as an application stores them: JSON, and only the parts it sets. */
const SAVED: Record<string, { label: string; view: DataTablePartialView }> = {
  default: { label: "Default", view: {} },
  deepest: {
    label: "Deepest first",
    view: { sorting: [{ column: "depth", direction: "descending" }] },
  },
  newest: {
    label: "By field, newest first",
    view: {
      sorting: [
        { column: "field", direction: "ascending" },
        { column: "spud", direction: "descending" },
      ],
      // A column this table does not have: ignored.
      columns: { hidden: ["operator"] },
    },
  },
}

export default function DataTableViews() {
  const [saved, setSaved] = React.useState("deepest")
  // Controlled: a saved view is only the parts it sets; the table reports
  // the whole view, which goes back in as it is.
  const [view, setView] = React.useState<DataTablePartialView>(
    SAVED.deepest.view
  )

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        aria-label="Saved views"
        value={[saved]}
        onValueChange={(value) => {
          const key = value[0]
          // Empty when the pressed view is pressed again: keep it.
          if (!Object.hasOwn(SAVED, key)) return
          setSaved(key)
          setView(SAVED[key].view)
        }}
      >
        {Object.entries(SAVED).map(([key, { label }]) => (
          <ToggleGroupItem key={key} value={key}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DataTable
        items={wells}
        columns={columns}
        view={view}
        onViewChange={setView}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
      <p className="text-sm text-muted-foreground">
        <code className="font-mono break-all text-foreground">
          sorting: {JSON.stringify(view.sorting ?? [])}
        </code>
      </p>
    </div>
  )
}
