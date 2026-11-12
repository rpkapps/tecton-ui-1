/**
 * Editing's finer cases (§5.9): a draft left as it began is no change;
 * dates keep the parts their format does not show; percentages typed;
 * custom editors' text and popups; the calendar's keys; boolean cells;
 * the options list's name; an edit whose row goes away; `startEditing` on
 * a cell that cannot be written.
 */
import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/components/combobox"
import { Popover, PopoverContent } from "@tecton/react/components/popover"
import {
  createColumns,
  DataTable,
  DataTableContent,
  useDataTable,
  type DataTableCellChange,
  type DataTableCellsChangeDetails,
  type DataTableEditorProps,
  type DataTableProps,
} from "@tecton/react/tecton/data-table"

import { parseCellText } from "../internal/data-table/cell-parse"
import { getColumnModel } from "../internal/data-table/engine/columns"
import { loadFeature } from "../internal/data-table/lazy"
import * as announcer from "../internal/primitives/live-announcer"

type Reading = {
  id: string
  name: string
  logged: Date | null
  month: Date | null
  cut: number
  operator: string
  tested: boolean
}

const READINGS: Array<Reading> = [
  {
    id: "r0",
    name: "Well 0",
    logged: new Date(Date.UTC(2024, 2, 14, 14, 30)),
    month: new Date(Date.UTC(2024, 2, 1, 6)),
    cut: 0.123,
    operator: "Equinor",
    tested: true,
  },
  {
    id: "r1",
    name: "Well 1",
    logged: null,
    month: null,
    cut: 0.5,
    operator: "Aker BP",
    tested: false,
  },
]

const columns = createColumns<Reading>([
  { id: "name", header: "Well", editable: false },
  {
    id: "logged",
    header: "Logged",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  {
    id: "month",
    header: "Month",
    type: "date",
    format: { year: "numeric", month: "long", timeZone: "UTC" },
  },
  {
    id: "cut",
    header: "Water cut",
    type: "number",
    format: { style: "percent", maximumFractionDigits: 1 },
  },
  { id: "operator", header: "Operator" },
  { id: "tested", header: "Tested", type: "boolean" },
])

function Table(props: Partial<DataTableProps<Reading>>) {
  return (
    <DataTable items={READINGS} columns={columns} editable {...props}>
      <DataTableContent aria-label="Readings" />
      {props.children}
    </DataTable>
  )
}

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const field = () => document.activeElement as HTMLInputElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const down = (cell: HTMLElement) => fireEvent.mouseDown(cell, { button: 0 })
const edit = (well: string, column: string) => {
  down(td(well, column))
  press("Enter")
  return field()
}
const typeIn = (text: string) =>
  fireEvent.change(field(), { target: { value: text } })
const writes = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.map(([changes, details]) => [
    ...(changes as Array<DataTableCellChange<Reading>>).map((change) => [
      change.row,
      change.column,
      change.value instanceof Date ? change.value.toISOString() : change.value,
    ]),
    (details as DataTableCellsChangeDetails).reason,
  ])
const editing = () => document.querySelector('[data-slot="data-table-editor"]')

beforeAll(async () => {
  await loadFeature("editing")
  await loadFeature("editingOptions")
  await loadFeature("editingDate")
  await loadFeature("dateInput")
  await loadFeature("cellError")
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable editing: a draft as it began", () => {
  it("writes nothing for a draft left as the value showed: a date with a time of day, a month, a percentage", async () => {
    const onCellsChange = vi.fn()
    render(
      <>
        <Table onCellsChange={onCellsChange} />
        <button type="button">Outside</button>
      </>
    )
    for (const column of ["logged", "month", "cut"]) {
      edit("Well 0", column)
      press("Enter")
      expect(editing()).toBeNull()
    }
    // Focus leaving, likewise: no message either.
    edit("Well 0", "month")
    act(() => screen.getByRole("button", { name: "Outside" }).focus())
    await act(async () => {})
    expect(td("Well 0", "month")).not.toHaveAttribute("aria-invalid")
    expect(onCellsChange).not.toHaveBeenCalled()
    // Typed, the same text is a change of the editor's: written.
    down(td("Well 1", "operator"))
    press("x")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["r1", "operator", "x"], "edit"]])
  })
})

describe("DataTable editing: dates", () => {
  it("keeps the parts the column's format does not show: the time of day, the day", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 0", "logged")
    typeIn("Mar 20, 2024")
    press("Enter")
    // A "March 2024" column takes "April 2024": the day and time kept.
    edit("Well 0", "month")
    typeIn("April 2024")
    press("Enter")
    // Without a value: the first, midnight.
    edit("Well 1", "month")
    typeIn("April 2024")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([
      [["r0", "logged", "2024-03-20T14:30:00.000Z"], "edit"],
      [["r0", "month", "2024-04-01T06:00:00.000Z"], "edit"],
      [["r1", "month", "2024-04-01T00:00:00.000Z"], "edit"],
    ])
    // A part the format shows is not taken: a year left out is refused.
    edit("Well 0", "logged")
    typeIn("Mar 21")
    press("Enter")
    expect(field()).toHaveAccessibleDescription("Enter a date")
  })

  it("takes this year for a format without one, when there is no value", () => {
    const dayOnly = createColumns<Reading>([
      { id: "name", header: "Well" },
      {
        id: "logged",
        header: "Logged",
        type: "date",
        format: { month: "short", day: "numeric", timeZone: "UTC" },
      },
    ])
    const [column] = getColumnModel(dayOnly).leaves.slice(1)
    const read = (text: string, item: Reading) =>
      parseCellText(column, text, item, {
        locale: "en-US",
        labels: { yes: "Yes", no: "No" },
        messages: {
          invalid: "x",
          number: "n",
          date: "d",
          boolean: "b",
          option: "o",
        },
      })
    const year = new Date().getFullYear()
    expect(read("Mar 21", READINGS[1])).toEqual({
      value: new Date(Date.UTC(year, 2, 21)),
    })
    expect(read("Mar 21", READINGS[0])).toEqual({
      value: new Date(Date.UTC(2024, 2, 21, 14, 30)),
    })
  })

  it("Tab and Shift + Tab in the calendar save and move as in the field; a press outside saves", async () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 0", "logged")
    typeIn("Mar 22, 2024")
    press("ArrowDown", { altKey: true })
    await screen.findByRole("dialog", { name: "Choose a date" })
    await waitFor(() => expect(focused()).toHaveAccessibleName(/March 22nd/))
    expect(press("Tab")).toBe(false)
    expect(focused()).toBe(td("Well 0", "month"))
    expect(screen.queryByRole("dialog")).toBeNull()
    edit("Well 0", "logged")
    typeIn("Mar 23, 2024")
    press("ArrowDown", { altKey: true })
    await waitFor(() => expect(focused()).toHaveAccessibleName(/March 23rd/))
    press("Tab", { shiftKey: true })
    // Before the first column that can be written: on the row before.
    expect(focused()).toBe(td("Well 0", "logged"))
    expect(writes(onCellsChange)).toEqual([
      [["r0", "logged", "2024-03-22T14:30:00.000Z"], "edit"],
      [["r0", "logged", "2024-03-23T14:30:00.000Z"], "edit"],
    ])
    // A press outside: saved, focus back on the cell.
    edit("Well 1", "logged")
    typeIn("Mar 24, 2024")
    press("ArrowDown", { altKey: true })
    await screen.findByRole("dialog")
    await userEvent.click(document.body)
    await waitFor(() => expect(editing()).toBeNull())
    expect(writes(onCellsChange).at(-1)).toEqual([
      ["r1", "logged", "2024-03-24T00:00:00.000Z"],
      "edit",
    ])
  })
})

describe("DataTable editing: percentages", () => {
  it("reads a bare number typed as a percentage, and moves the decimal point exactly", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    expect(edit("Well 1", "cut")).toHaveValue("50%")
    typeIn("15")
    press("Enter")
    edit("Well 1", "cut")
    typeIn("12.3%")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([
      [["r1", "cut", 0.15], "edit"],
      [["r1", "cut", 0.123], "edit"],
    ])
    // Pasted, a bare number is the value itself.
    const [, , , cut] = getColumnModel(columns).leaves
    const context = {
      locale: "en-US",
      labels: { yes: "Yes", no: "No" },
      messages: {
        invalid: "x",
        number: "n",
        date: "d",
        boolean: "b",
        option: "o",
      },
    }
    expect(parseCellText(cut, "15", READINGS[0], context)).toEqual({
      value: 15,
    })
    expect(parseCellText(cut, "15%", READINGS[0], context)).toEqual({
      value: 0.15,
    })
  })
})

describe("DataTable editing: custom editors", () => {
  it("start from `initialText`: a character typed is not lost", () => {
    function Metres({
      initialText,
      onValueChange,
      inputProps,
    }: DataTableEditorProps<Reading>) {
      const [text, setText] = React.useState(initialText ?? "")
      return (
        <input
          {...inputProps}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            onValueChange(Number(event.target.value))
          }}
        />
      )
    }
    const seen: Array<DataTableEditorProps<Reading>> = []
    const custom = createColumns<Reading>([
      { id: "name", header: "Well" },
      {
        id: "cut",
        header: "Depth",
        type: "number",
        renderEditor: (props) => {
          seen.push(props)
          return <Metres {...props} />
        },
      },
    ])
    const onCellsChange = vi.fn()
    render(<Table columns={custom} onCellsChange={onCellsChange} />)
    down(td("Well 0", "cut"))
    press("-")
    expect(seen.at(-1)).toMatchObject({ initialText: "-", value: null })
    expect(field()).toHaveValue("-")
    typeIn("-5")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["r0", "cut", -5], "edit"]])
    // Enter: the value as the built-in editor shows it.
    edit("Well 0", "cut")
    expect(seen.at(-1)).toMatchObject({ initialText: "0.123", value: 0.123 })
  })

  it("keeps the edit while focus is in its own popup: a Popover, a Combobox", async () => {
    function Picker({
      onValueChange,
      commit,
      inputProps,
    }: DataTableEditorProps<Reading>) {
      return (
        <>
          <input {...inputProps} readOnly value="" />
          <Popover open>
            <PopoverContent initialFocus={false}>
              <Button
                onClick={() => {
                  onValueChange("Vår Energi")
                  commit()
                }}
              >
                Vår Energi
              </Button>
            </PopoverContent>
          </Popover>
        </>
      )
    }
    function Operators({
      onValueChange,
      commit,
      inputProps,
    }: DataTableEditorProps<Reading>) {
      return (
        <Combobox<string>
          items={["Equinor", "Aker BP", "OKEA"]}
          open
          onValueChange={(value) => {
            onValueChange(value)
            commit()
          }}
        >
          <input {...inputProps} />
          <ComboboxContent>
            <ComboboxList>
              {(name: string) => (
                <ComboboxItem key={name} value={name}>
                  {name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )
    }
    const custom = createColumns<Reading>([
      { id: "name", header: "Well" },
      {
        id: "operator",
        header: "Operator",
        renderEditor: (p) => <Picker {...p} />,
      },
      { id: "cut", header: "Owner", renderEditor: (p) => <Operators {...p} /> },
    ])
    const onCellsChange = vi.fn()
    render(<Table columns={custom} onCellsChange={onCellsChange} />)
    edit("Well 0", "operator")
    const pick = await screen.findByRole("button", { name: "Vår Energi" })
    act(() => pick.focus())
    await act(async () => {})
    expect(editing()).not.toBeNull()
    fireEvent.click(pick)
    expect(writes(onCellsChange)).toEqual([
      [["r0", "operator", "Vår Energi"], "edit"],
    ])
    expect(focused()).toBe(td("Well 0", "operator"))
    edit("Well 0", "cut")
    const option = await screen.findByRole("option", { name: "OKEA" })
    act(() => option.focus())
    await act(async () => {})
    expect(editing()).not.toBeNull()
    fireEvent.click(option)
    expect(writes(onCellsChange).at(-1)).toEqual([
      ["r0", "cut", "OKEA"],
      "edit",
    ])
  })

  it("gives a field `inputProps.className` that makes it flush", () => {
    const seen: Array<string> = []
    const custom = createColumns<Reading>([
      { id: "name", header: "Well" },
      {
        id: "operator",
        header: "Operator",
        renderEditor: ({ inputProps }) => {
          seen.push(inputProps.className)
          return <input {...inputProps} />
        },
      },
    ])
    render(<Table columns={custom} onCellsChange={() => {}} />)
    edit("Well 0", "operator")
    const classes = seen.at(-1)!.split(" ")
    for (const flush of [
      "border-0",
      "rounded-none",
      "shadow-none",
      "bg-transparent",
      "p-0",
      "focus-visible:ring-0",
      "aria-invalid:ring-0",
      "text-[length:inherit]",
      "md:text-[length:inherit]",
    ])
      expect(classes).toContain(flush)
  })
})

describe("DataTable editing: boolean cells", () => {
  it("centre their checkbox in the cell's padding, and leave Enter, F2 and a double click to it", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    const cell = td("Well 0", "tested")
    expect(cell.className).toContain("[&:has([role=checkbox])]:pe-4")
    expect(cell.className).not.toContain("[&:has([role=checkbox])]:pe-0")
    const box = within(cell).getByRole("checkbox")
    expect(box).toHaveClass("mx-auto")
    // The cell's padding: a double click there is not a toggle.
    fireEvent.doubleClick(cell)
    down(cell)
    press("Enter")
    press("F2")
    expect(onCellsChange).not.toHaveBeenCalled()
  })
})

describe("DataTable editing: the options list", () => {
  it("is named by its column", async () => {
    const statuses = createColumns<Reading>([
      { id: "name", header: "Well" },
      {
        id: "operator",
        header: "Operator",
        type: "options",
        options: [
          { value: "Equinor", label: "Equinor" },
          { value: "Aker BP", label: "Aker BP" },
        ],
      },
    ])
    render(<Table columns={statuses} onCellsChange={() => {}} />)
    edit("Well 0", "operator")
    expect(
      await screen.findByRole("listbox", { name: "Operator" })
    ).toBeInTheDocument()
  })
})

describe("DataTable editing: the edit's row", () => {
  it("drops the draft of a row removed or disabled, and says so", () => {
    const say = vi.spyOn(announcer, "announce")
    const onCellsChange = vi.fn()
    const { rerender } = render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "operator")
    typeIn("OKEA")
    rerender(
      <Table
        onCellsChange={onCellsChange}
        isItemDisabled={(reading) => reading.id === "r1"}
      />
    )
    expect(editing()).toBeNull()
    edit("Well 0", "operator")
    typeIn("OKEA")
    rerender(<Table items={READINGS.slice(1)} onCellsChange={onCellsChange} />)
    expect(editing()).toBeNull()
    expect(onCellsChange).not.toHaveBeenCalled()
    expect(
      say.mock.calls.filter(
        ([text]) => text === "Edit discarded: the row is no longer available"
      )
    ).toHaveLength(2)
  })

  it("keeps the edit when `startEditing` names a cell that cannot be written", () => {
    let api: ReturnType<typeof useDataTable<Reading>> | null = null
    function Probe() {
      api = useDataTable<Reading>()
      return null
    }
    render(
      <Table onCellsChange={() => {}}>
        <Probe />
      </Table>
    )
    edit("Well 0", "operator")
    typeIn("OKEA")
    act(() => api!.startEditing({ row: "r0", column: "name" }))
    expect(field()).toHaveValue("OKEA")
  })
})
