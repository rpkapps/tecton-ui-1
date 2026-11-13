"use client"

import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@tecton/react/avatar"
import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"
import { Link } from "@tecton/react/link"
import { Meter } from "@tecton/react/meter"

type Well = {
  id: string
  name: string
  field: string
  engineer: string | null
  waterCut: number | null
  rate: number
  /** The rate's change since last month, a fraction. */
  trend: number
}

const wells: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    engineer: "Ingrid Solberg",
    waterCut: 0.12,
    rate: 1820,
    trend: 0.06,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    engineer: "Ole Haugen",
    waterCut: 0.47,
    rate: 940,
    trend: -0.11,
  },
  {
    id: "p7",
    name: "34/7-P-7",
    field: "Snorre",
    engineer: null,
    waterCut: 0.81,
    rate: 310,
    trend: -0.24,
  },
  {
    id: "g2",
    name: "2/8-G-2",
    field: "Valhall",
    engineer: "Marte Lie",
    waterCut: null,
    rate: 2460,
    trend: 0.15,
  },
  {
    id: "e5",
    name: "25/11-E-5",
    field: "Balder",
    engineer: "Ole Haugen",
    waterCut: 0.29,
    rate: 1275,
    trend: 0,
  },
]

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  signDisplay: "exceptZero",
})

// `cell` only changes how a value is drawn: sorting, filters, search and
// export still use the `accessor` value and the column's `type`.
const columns = createColumns<Well>([
  {
    id: "name",
    header: "Well",
    rowHeader: true,
    // A link to the well, with its field under it.
    cell: (well, { text }) => (
      <span className="flex flex-col">
        <Link href={`#well-${well.id}`} variant="primary">
          {text}
        </Link>
        <span className="text-xs text-muted-foreground">{well.field}</span>
      </span>
    ),
  },
  {
    id: "engineer",
    header: "Engineer",
    // An empty value keeps the table's dash, read as "No value".
    cell: (well, { text, emptyValue }) =>
      well.engineer === null ? (
        emptyValue
      ) : (
        <span className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials(well.engineer)}</AvatarFallback>
          </Avatar>
          {text}
        </span>
      ),
  },
  {
    id: "waterCut",
    header: "Water cut",
    type: "number",
    format: { style: "percent" },
    // The formatted value, with a meter that reads at a glance.
    cell: (well, { text, emptyValue }) =>
      well.waterCut === null ? (
        emptyValue
      ) : (
        <span className="flex items-center justify-end gap-2">
          <Meter
            aria-label="Water cut"
            value={well.waterCut * 100}
            segments={1}
            size="sm"
            color="auto"
            className="w-16"
          />
          <span className="w-9 tabular-nums">{text}</span>
        </span>
      ),
  },
  {
    id: "rate",
    header: "Oil rate (bbl/d)",
    type: "number",
    // The rate, and how it moved since last month.
    cell: (well, { text }) => (
      <span className="flex items-center justify-end gap-2">
        <span className="tabular-nums">{text}</span>
        <span
          className={
            well.trend > 0
              ? "flex w-14 items-center justify-end gap-0.5 text-xs text-success"
              : well.trend < 0
                ? "flex w-14 items-center justify-end gap-0.5 text-xs text-destructive"
                : "flex w-14 items-center justify-end gap-0.5 text-xs text-muted-foreground"
          }
        >
          {well.trend > 0 ? (
            <ArrowUpRightIcon aria-hidden className="size-3.5" />
          ) : well.trend < 0 ? (
            <ArrowDownRightIcon aria-hidden className="size-3.5" />
          ) : null}
          {percent.format(well.trend)}
          <span className="sr-only"> since last month</span>
        </span>
      </span>
    ),
  },
])

export default function DataTableCustomCells() {
  return (
    <DataTable
      items={wells}
      columns={columns}
      defaultView={{ sorting: [{ column: "rate", direction: "descending" }] }}
      className="w-full"
    >
      <DataTableContent aria-label="Wells with their engineers and production" />
    </DataTable>
  )
}
