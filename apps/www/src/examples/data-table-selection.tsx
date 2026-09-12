import * as React from "react"

import { createDataTableColumns, DataTable, type RowSelectionState } from "@tecton/react/tecton/data-table"

type Alternative = { id: string; name: string; wells: number; costPerBbl: number }

const alternatives: Alternative[] = [
  { id: "a", name: "Alternative A", wells: 3, costPerBbl: 18.4 },
  { id: "b", name: "Alternative B", wells: 4, costPerBbl: 16.9 },
  { id: "c", name: "Alternative C", wells: 2, costPerBbl: 21.2 },
]

const helper = createDataTableColumns<Alternative>()
const columns = helper.columns([
  helper.accessor("name", { header: "Alternative" }),
  helper.accessor("wells", { header: "Wells" }),
  helper.accessor("costPerBbl", { header: "USD / bbl", cell: (info) => info.getValue().toFixed(1) }),
])

export default function DataTableSelection() {
  const [selection, setSelection] = React.useState<RowSelectionState>({})
  const selected = Object.keys(selection).filter((id) => selection[id])

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <DataTable
        label="FDA alternatives"
        columns={columns}
        data={alternatives}
        enableSelection
        getRowId={(row) => row.id}
        onRowSelectionChange={setSelection}
      />
      <p className="text-xs text-muted-foreground">
        Selected: {selected.length ? selected.join(", ") : "none"}
      </p>
    </div>
  )
}
