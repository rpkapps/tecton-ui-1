"use client"

import * as React from "react"

import { Button } from "@tecton/react/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@tecton/react/dialog"
import { DropdownMenuItem } from "@tecton/react/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/field"
import { Input } from "@tecton/react/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/select"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableRowActions,
} from "@tecton/react/data-table"
import { NumberInput } from "@tecton/react/number-input"

type Status = "producing" | "shut-in" | "drilling"

type Well = { id: string; name: string; status: Status; depth: number }

const STATUSES = [
  { value: "producing", label: "Producing", variant: "success" },
  { value: "shut-in", label: "Shut in", variant: "warning" },
  { value: "drilling", label: "Drilling", variant: "info" },
] as const

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", status: "producing", depth: 3250 },
  { id: "b3", name: "34/10-B-3", status: "shut-in", depth: 2980 },
  { id: "d2", name: "34/7-D-2", status: "drilling", depth: 2735 },
  { id: "c3", name: "2/8-C-3", status: "producing", depth: 2560 },
]

export default function DataTableEditDialog() {
  const [wells, setWells] = React.useState(WELLS)
  const [open, setOpen] = React.useState(false)
  // The well being edited: kept while the dialog closes, so its fields stay.
  const [well, setWell] = React.useState<Well | null>(null)

  const columns = React.useMemo(
    () =>
      createColumns<Well>([
        { id: "name", header: "Well" },
        { id: "status", header: "Status", type: "options", options: STATUSES },
        { id: "depth", header: "TD (m)", type: "number" },
        {
          id: "actions",
          header: "Actions",
          sortable: false,
          align: "end",
          cell: (item) => (
            <DataTableRowActions>
              <DropdownMenuItem
                onClick={() => {
                  setWell(item)
                  setOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
            </DataTableRowActions>
          ),
        },
      ]),
    []
  )

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!well) return
    const data = new FormData(event.currentTarget)
    const changed: Well = {
      ...well,
      name: String(data.get("name")),
      status: data.get("status") as Status,
      depth: Number(data.get("depth")),
    }
    setWells((current) =>
      current.map((item) => (item.id === changed.id ? changed : item))
    )
    setOpen(false)
  }

  return (
    <>
      <DataTable items={wells} columns={columns} className="w-full">
        <DataTableContent aria-label="Wells" />
      </DataTable>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          {well && (
            <form key={well.id} onSubmit={save} className="grid gap-6">
              <DialogHeader>
                <DialogTitle>Edit {well.name}</DialogTitle>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit-well-name">Well</FieldLabel>
                  <Input
                    id="edit-well-name"
                    name="name"
                    defaultValue={well.name}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-well-status">Status</FieldLabel>
                  <Select
                    name="status"
                    items={STATUSES}
                    defaultValue={well.status}
                  >
                    <SelectTrigger id="edit-well-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-well-depth">TD (m)</FieldLabel>
                  <NumberInput
                    id="edit-well-depth"
                    name="depth"
                    min={0}
                    defaultValue={well.depth}
                    required
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
