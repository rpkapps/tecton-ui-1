"use client"

import * as React from "react"

import { DropdownMenuItem } from "@tecton/react/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableRowActions,
} from "@tecton/react/tecton/data-table"

type Interval = { top: number; base: number; zone: string }

type Well = {
  id: string
  name: string
  field: string
  depth: number
  intervals: Array<Interval>
}

const WELLS: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    depth: 3250,
    intervals: [
      { top: 1860, base: 1932, zone: "Brent Gp" },
      { top: 2104, base: 2181, zone: "Cook Fm" },
    ],
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    depth: 2980,
    intervals: [{ top: 1795, base: 1850, zone: "Tarbert Fm" }],
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    depth: 2735,
    intervals: [
      { top: 2410, base: 2466, zone: "Statfjord Gp" },
      { top: 2512, base: 2590, zone: "Lunde Fm" },
    ],
  },
  {
    id: "c3",
    name: "2/8-C-3",
    field: "Valhall",
    depth: 2560,
    intervals: [{ top: 2420, base: 2455, zone: "Tor Fm" }],
  },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "depth", header: "TD (m)", type: "number" },
  {
    id: "actions",
    header: "Actions",
    sortable: false,
    align: "end",
    cell: (well) => (
      <DataTableRowActions>
        <DropdownMenuItem>Open {well.name}</DropdownMenuItem>
        <DropdownMenuItem>Plan workover</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Shut in</DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
])

/** A well's perforated intervals: a table of its own. */
function renderDetail(well: Well) {
  return (
    <Table aria-label={`Perforations of ${well.name}`} size="sm">
      <TableHeader>
        <TableRow>
          <TableHead>Zone</TableHead>
          <TableHead className="text-end">Top (m MD)</TableHead>
          <TableHead className="text-end">Base (m MD)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {well.intervals.map((interval) => (
          <TableRow key={interval.top}>
            <TableCell>{interval.zone}</TableCell>
            <TableCell className="text-end tabular-nums">
              {interval.top}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {interval.base}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function DataTableDetailRows() {
  const [expanded, setExpanded] = React.useState<ReadonlyArray<string>>(["a12"])
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      expanded={expanded}
      onExpandedChange={setExpanded}
      className="w-full"
    >
      <DataTableContent aria-label="Wells" renderDetail={renderDetail} />
    </DataTable>
  )
}
