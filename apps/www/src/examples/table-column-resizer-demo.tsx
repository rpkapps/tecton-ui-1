"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import { TableColumnResizer } from "@tecton/react/tecton/table-column-resizer"

const COLUMNS = [
  { id: "name", label: "Well", width: 140 },
  { id: "field", label: "Field", width: 120 },
  { id: "formation", label: "Target formation", width: 180 },
] as const

const ROWS = [
  { name: "34/10-A-12", field: "Gullfaks", formation: "Brent Group" },
  { name: "33/9-C-7", field: "Statfjord", formation: "Statfjord Formation" },
  { name: "34/7-D-2", field: "Snorre", formation: "Lunde Formation" },
]

export default function TableColumnResizerDemo() {
  const [widths, setWidths] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(COLUMNS.map((column) => [column.id, column.width]))
  )

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-md border">
      <Table aria-label="Wells" className="w-auto table-fixed">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.id}
                className="relative"
                style={{ width: widths[column.id] }}
              >
                <div className="truncate">{column.label}</div>
                <TableColumnResizer
                  label={column.label}
                  value={widths[column.id]}
                  min={80}
                  max={320}
                  resetValue={column.width}
                  onValueChange={(width) =>
                    setWidths((all) => ({ ...all, [column.id]: width }))
                  }
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.name}>
              {COLUMNS.map((column) => (
                <TableCell key={column.id} className="truncate">
                  {row[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
