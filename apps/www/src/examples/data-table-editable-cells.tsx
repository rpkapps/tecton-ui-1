"use client"

import * as React from "react"

import { Input } from "@tecton/react/components/input"
import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

type Well = { id: string; name: string; field: string; remarks: string }

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", remarks: "Choke at 32" },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", remarks: "" },
  { id: "d2", name: "34/7-D-2", field: "Snorre", remarks: "Scale squeeze due" },
  { id: "c3", name: "2/8-C-3", field: "Valhall", remarks: "" },
]

export default function DataTableEditableCells() {
  const [wells, setWells] = React.useState(WELLS)

  const columns = React.useMemo(() => {
    const save = (id: string, remarks: string) =>
      setWells((current) =>
        current.map((well) =>
          well.id === id && well.remarks !== remarks
            ? { ...well, remarks }
            : well
        )
      )
    return createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field" },
      {
        id: "remarks",
        header: "Remarks",
        sortable: false,
        cell: (well) => (
          <Input
            aria-label={`Remarks, ${well.name}`}
            defaultValue={well.remarks}
            className="h-7"
            // Saved as focus leaves the field, and on Enter; Escape puts the
            // saved text back before the table takes focus to the cell.
            onBlur={(event) => save(well.id, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter")
                save(well.id, event.currentTarget.value)
              if (event.key === "Escape")
                event.currentTarget.value = well.remarks
            }}
          />
        ),
      },
    ])
  }, [])

  return (
    <DataTable items={wells} columns={columns} className="w-full">
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
