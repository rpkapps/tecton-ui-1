"use client"

import * as React from "react"

import { Input } from "@tecton/react/components/input"
import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableEditorProps,
} from "@tecton/react/tecton/data-table"

type Casing = {
  id: string
  well: string
  string: string
  shoe: number
}

const INITIAL: Array<Casing> = [
  ["34/10-A-12", "Conductor", 210],
  ["34/10-A-12", "Surface", 1105],
  ["34/10-A-12", "Production", 3080],
  ["34/7-D-2", "Conductor", 195],
  ["34/7-D-2", "Intermediate", 1780],
].map(([well, string, shoe], i) => ({
  id: `c${i}`,
  well: well as string,
  string: string as string,
  shoe: shoe as number,
}))

/**
 * A depth in metres, the unit beside the field: the table's keys (Enter,
 * Tab, Escape) save and cancel it, and `inputProps` names it, focuses it
 * and makes Tecton's `Input` flush with the cell. It starts from the
 * value, or from `initialText` when that is no number yet: a character
 * typed to begin the edit ("-") is kept.
 */
function MetresEditor({
  value,
  initialText,
  onValueChange,
  inputProps,
}: DataTableEditorProps<Casing>) {
  // The number without its unit; a text that is none yet ("-") as typed.
  const [text, setText] = React.useState(
    typeof value === "number" ? String(value) : (initialText ?? "")
  )
  return (
    <span className="flex size-full items-center gap-1">
      <Input
        {...inputProps}
        // A minus sign on phones too (iOS's decimal keypad has none).
        inputMode="text"
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          // Empty is an empty cell; text that is no number goes to
          // `validate`, which refuses it.
          const number = Number(next.replace(",", "."))
          onValueChange(
            next.trim() === "" ? null : Number.isFinite(number) ? number : next
          )
        }}
      />
      <span aria-hidden className="text-muted-foreground">
        m
      </span>
    </span>
  )
}

const columns = createColumns<Casing>([
  { id: "well", header: "Well", editable: false },
  { id: "string", header: "Casing string", editable: false },
  {
    id: "shoe",
    header: "Shoe depth",
    type: "number",
    format: { style: "unit", unit: "meter" },
    renderEditor: (props) => <MetresEditor {...props} />,
    validate: (value) =>
      typeof value !== "number" ? "Enter a depth in metres" : null,
  },
])

export default function DataTableCustomEditor() {
  const [casings, setCasings] = React.useState(INITIAL)
  return (
    <DataTable
      items={casings}
      columns={columns}
      editable
      onCellsChange={(changes) =>
        setCasings((current) =>
          current.map((casing) => {
            const change = changes.find((each) => each.row === casing.id)
            return change ? { ...casing, shoe: change.value as number } : casing
          })
        )
      }
      className="w-full"
    >
      <DataTableContent aria-label="Casing shoes" />
    </DataTable>
  )
}
