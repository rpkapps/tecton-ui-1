/**
 * Controls drawn by a column's `cell` in the grid (the ARIA grid's
 * "actionable mode", `table-grid.tsx`): a cell holding a field or a select
 * is focused itself, entered with Enter or F2 and left with Escape or F2;
 * the grid takes no key from a field; Tab moves through the row's
 * controls; a press on a control works the first time.
 */
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
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
  type DataTableProps,
} from "@tecton/react/tecton/data-table"

type Well = { id: string; name: string; note: string; status: string }

const WELLS: Array<Well> = [
  { id: "a", name: "A-1", note: "Choke", status: "producing" },
  { id: "b", name: "B-2", note: "", status: "shut-in" },
  { id: "c", name: "C-3", note: "Scale", status: "drilling" },
]

const STATUSES = [
  { value: "producing", label: "Producing" },
  { value: "shut-in", label: "Shut in" },
  { value: "drilling", label: "Drilling" },
]

const pressed = vi.fn<(id: string) => void>()
const checked = vi.fn<(id: string, value: boolean) => void>()

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  {
    id: "note",
    header: "Note",
    cell: (well) => (
      <Input aria-label={`Note, ${well.name}`} defaultValue={well.note} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (well) => (
      <Select items={STATUSES} defaultValue={well.status}>
        <SelectTrigger aria-label={`Status, ${well.name}`}>
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
    ),
  },
  {
    id: "checked",
    header: "Checked",
    accessor: () => null,
    cell: (well) => (
      <Checkbox
        aria-label={`Checked, ${well.name}`}
        onCheckedChange={(value) => checked(well.id, value)}
      />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    accessor: () => null,
    cell: (well) => (
      <Button size="sm" onClick={() => pressed(well.id)}>
        Open {well.name}
      </Button>
    ),
  },
])

function Wells(props: Partial<DataTableProps<Well>>) {
  return (
    <>
      <button type="button">Before</button>
      <DataTable items={WELLS} columns={columns} {...props}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
      <button type="button">After</button>
    </>
  )
}

const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const row = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLTableRowElement
const cellOf = (control: HTMLElement) =>
  control.closest("td") as HTMLTableCellElement
const note = (name: string) =>
  screen.getByRole("textbox", { name: `Note, ${name}` })
const status = (name: string) =>
  screen.getByRole("combobox", { name: `Status, ${name}` })
const checkboxOf = (name: string) =>
  screen.getByRole("checkbox", { name: `Checked, ${name}` })
const button = (name: string) =>
  screen.getByRole("button", { name: `Open ${name}` })

/** Focus on `name`'s row, then on its cell in `column` (from 0) with the arrows. */
function focusCell(name: string, column: number) {
  act(() => row(name).focus())
  for (let i = 0; i <= column; i++) press("ArrowRight")
}

describe("DataTable cells with controls", () => {
  it("focuses a cell holding a field, not the field, and enters it with Enter", () => {
    const onActivate = vi.fn()
    render(<Wells selectionMode="multiple" onActivate={onActivate} />)
    focusCell("A-1", 2)
    expect(focused()).toBe(cellOf(note("A-1")))
    press("Enter")
    expect(focused()).toBe(note("A-1"))
    expect(onActivate).not.toHaveBeenCalled()
    press("Escape")
    expect(focused()).toBe(cellOf(note("A-1")))
    // In navigation mode again: the arrows move between cells.
    press("ArrowDown")
    expect(focused()).toBe(cellOf(note("B-2")))
  })

  it("enters and leaves a cell with F2", () => {
    render(<Wells />)
    focusCell("B-2", 1)
    press("F2")
    expect(focused()).toBe(note("B-2"))
    press("F2")
    expect(focused()).toBe(cellOf(note("B-2")))
  })

  it("leaves a field's keys to it", async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    const onValueChange = vi.fn()
    render(
      <Wells
        selectionMode="multiple"
        onActivate={onActivate}
        onValueChange={onValueChange}
      />
    )
    focusCell("A-1", 2)
    press("Enter")
    const field = note("A-1") as HTMLInputElement
    await user.keyboard(
      "{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}{Home}{End}{PageDown} x{Control>}a{/Control}{Enter}"
    )
    expect(focused()).toBe(field)
    expect(field.value).toBe("Choke x")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(onActivate).not.toHaveBeenCalled()
  })

  it("enters a select's cell, and leaves its keys to it", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    focusCell("A-1", 2)
    const trigger = status("A-1")
    expect(focused()).toBe(cellOf(trigger))
    press("Enter")
    expect(focused()).toBe(trigger)
    // The arrows open the list rather than move through the grid.
    await user.keyboard("{ArrowDown}")
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(focused().closest("table")).toBeNull()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(focused()).toBe(trigger)
    await user.keyboard("{Escape}")
    expect(focused()).toBe(cellOf(trigger))
  })

  it("stops on a checkbox and a button themselves, as before", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Wells selectionMode="multiple" onValueChange={onValueChange} />)
    // The selection checkbox's cell, the row header, the note, the status.
    focusCell("A-1", 4)
    expect(focused()).toBe(checkboxOf("A-1"))
    await user.keyboard(" ")
    expect(checked).toHaveBeenLastCalledWith("a", true)
    expect(onValueChange).not.toHaveBeenCalled()
    press("ArrowRight")
    expect(focused()).toBe(button("A-1"))
    pressed.mockClear()
    await user.keyboard("{Enter}")
    expect(pressed).toHaveBeenCalledWith("a")
  })

  it("moves through the row's controls with Tab, then leaves the table", async () => {
    const user = userEvent.setup()
    render(<Wells selectionMode="multiple" />)
    focusCell("C-3", 2)
    press("Enter")
    expect(focused()).toBe(note("C-3"))
    await user.tab()
    expect(focused()).toBe(status("C-3"))
    await user.tab()
    expect(focused()).toBe(checkboxOf("C-3"))
    await user.tab()
    expect(focused()).toBe(button("C-3"))
    await user.tab({ shift: true })
    await user.tab({ shift: true })
    await user.tab({ shift: true })
    expect(focused()).toBe(note("C-3"))
    await user.tab({ shift: true })
    expect(focused()).toBe(screen.getByRole("checkbox", { name: "Select C-3" }))
    // On to the last control, and past it: out of the table.
    for (let i = 0; i < 4; i++) await user.tab()
    expect(focused()).toBe(button("C-3"))
    await user.tab()
    expect(focused()).toHaveTextContent("After")
    // Back in: the cell left, the button's in navigation mode too.
    await user.tab({ shift: true })
    expect(focused()).toBe(button("C-3"))
  })

  it("comes back to the cell, not the field, after Tab leaves from it", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    focusCell("A-1", 1)
    press("Enter")
    await user.tab({ shift: true })
    expect(focused()).toHaveTextContent("Before")
    await user.tab()
    expect(focused()).toBe(cellOf(note("A-1")))
  })

  it("leaves Tab to the browser in navigation mode", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    focusCell("A-1", 1)
    expect(focused()).toBe(cellOf(note("A-1")))
    await user.tab()
    expect(focused()).toHaveTextContent("After")
  })

  it("works a control's first press, and Tab goes on from it", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Wells selectionMode="multiple" onValueChange={onValueChange} />)
    pressed.mockClear()
    await user.click(button("B-2"))
    expect(pressed).toHaveBeenCalledTimes(1)
    checked.mockClear()
    await user.click(checkboxOf("B-2"))
    expect(checked).toHaveBeenCalledWith("b", true)
    await user.click(note("B-2"))
    expect(focused()).toBe(note("B-2"))
    await user.keyboard("!")
    expect((note("B-2") as HTMLInputElement).value).toBe("!")
    await user.tab()
    expect(focused()).toBe(status("B-2"))
    await user.click(status("B-2"))
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
