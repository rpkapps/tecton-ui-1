"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTableSelectionCount,
  DataTableToolbar,
  useDataTable,
  type DataTableSort,
} from "@tecton/react/tecton/data-table"
import { useLocale } from "@tecton/react/tecton/provider"

type Well = {
  id: string
  name: string
  field: string
  depth: number
  rate: number
}

const wells: Array<Well> = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", depth: 3250, rate: 1840 },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", depth: 2980, rate: 0 },
  { id: "c4", name: "34/10-C-4", field: "Gullfaks", depth: 3390, rate: 2210 },
  { id: "p7", name: "34/7-P-7", field: "Snorre", depth: 4410, rate: 3125 },
  { id: "p9", name: "34/7-P-9", field: "Snorre", depth: 3720, rate: 960 },
  { id: "g2", name: "2/8-G-2", field: "Valhall", depth: 2730, rate: 1475 },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "depth", header: "TD (m)", type: "number" },
  { id: "rate", header: "Oil (Sm³/d)", type: "number" },
])

const SORTS: Record<string, { label: string; sorting: Array<DataTableSort> }> =
  {
    none: { label: "Register order", sorting: [] },
    rate: {
      label: "Highest rate",
      sorting: [{ column: "rate", direction: "descending" }],
    },
    field: {
      label: "Field, then depth",
      sorting: [
        { column: "field", direction: "ascending" },
        { column: "depth", direction: "descending" },
      ],
    },
  }

/** A Select for the view's sorting: it follows the header buttons too. */
function SortSelect() {
  const { view, setSorting } = useDataTable<Well>()
  const current =
    Object.keys(SORTS).find(
      (key) =>
        JSON.stringify(SORTS[key].sorting) === JSON.stringify(view.sorting)
    ) ?? null
  return (
    <Field orientation="horizontal" className="w-auto">
      <FieldLabel htmlFor="data-table-sort">Sort by</FieldLabel>
      <Select
        items={Object.fromEntries(
          Object.entries(SORTS).map(([key, sort]) => [key, sort.label])
        )}
        value={current}
        onValueChange={(key) => {
          if (key !== null) setSorting(SORTS[key].sorting)
        }}
      >
        <SelectTrigger id="data-table-sort" size="sm" className="w-44">
          <SelectValue placeholder="Custom" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORTS).map(([key, sort]) => (
            <SelectItem key={key} value={key}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/** The selected wells' total rate, from the table's rows. */
function SelectedRate() {
  const { value, rows, clearSelection } = useDataTable<Well>()
  const { locale } = useLocale()
  const selected = new Set(value)
  const total = rows.all
    .filter((well) => selected.has(well.id))
    .reduce((sum, well) => sum + well.rate, 0)
  if (value.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums">
        {total.toLocaleString(locale)} Sm³/d selected
      </span>
      <Button variant="ghost" size="xs" onClick={clearSelection}>
        Clear
      </Button>
    </div>
  )
}

export default function DataTableCustomPart() {
  return (
    <DataTable
      items={wells}
      columns={columns}
      selectionMode="multiple"
      className="w-full max-w-2xl"
    >
      <DataTableToolbar>
        <SortSelect />
      </DataTableToolbar>
      <DataTableContent aria-label="Producing wells" />
      <DataTableFooter>
        <DataTableSelectionCount />
        <SelectedRate />
      </DataTableFooter>
    </DataTable>
  )
}
