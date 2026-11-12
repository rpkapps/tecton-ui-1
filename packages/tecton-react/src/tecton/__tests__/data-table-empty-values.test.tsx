/**
 * Empty values in `DataTable`: the cell's muted dash (read as "No value"),
 * a column's `emptyValue`, export, search, sorting, groups and totals, and
 * the filters' "No value" with its words in the chips.
 */
import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
  type DataTableColumn,
  type DataTableProps,
} from "@tecton/react/tecton/data-table"

import { createDefaultView, reconcileView } from "../internal/data-table/engine"
import { names, row } from "./data-table-fixtures"

type Well = {
  id: string
  name: string
  field: string | null
  status: string | null
  depth: number | null
  spud: Date | null
  active: boolean | null
}

const WELLS: Array<Well> = [
  {
    id: "a",
    name: "A-1",
    field: "Gullfaks",
    status: "producing",
    depth: 2000,
    spud: new Date(2020, 0, 10),
    active: true,
  },
  {
    id: "b",
    name: "B-2",
    field: null,
    status: null,
    depth: null,
    spud: null,
    active: null,
  },
  {
    id: "c",
    name: "C-3",
    field: "Snorre",
    status: "drilling",
    depth: 1500,
    spud: new Date(2021, 5, 1),
    active: false,
  },
  {
    id: "d",
    name: "D-4",
    field: "",
    status: "producing",
    depth: Number.NaN,
    spud: new Date(Number.NaN),
    active: true,
  },
]

const definitions: Array<DataTableColumn<Well>> = [
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "drilling", label: "Drilling", variant: "info" },
    ],
  },
  { id: "depth", header: "TD (m)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
  { id: "active", header: "Active", type: "boolean" },
]
const columns = createColumns<Well>(definitions)

function Wells({
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={WELLS} columns={columns} filterable {...props}>
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="name" />
        <DataTableFilter column="field" />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableFilter column="spud" />
        <DataTableFilter column="active" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableContent aria-label="Wells" totals />
      {children}
    </DataTable>
  )
}

const filterButton = (columnName: string) =>
  screen.getByRole("button", { name: `Filter by ${columnName}` })
const chips = () =>
  Array.from(
    document.querySelectorAll('[data-slot="chip"]'),
    (chip) => chip.getAttribute("aria-label") ?? chip.textContent
  )
const lastFilters = (onViewChange: ReturnType<typeof vi.fn>) =>
  onViewChange.mock.calls.at(-1)?.[0].filters
/** The body cells of a row, but its row header. */
const cells = (name: string) => Array.from(row(name).querySelectorAll("td"))

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable empty values", () => {
  it("draws a muted dash for every type, read as No value, in the column's alignment", () => {
    render(<Wells />)
    // B-2 has no value anywhere; D-4 an empty text, NaN and an invalid date.
    for (const td of cells("B-2")) {
      const dash = td.querySelector('[data-slot="data-table-empty-value"]')
      expect(dash).toHaveTextContent("—")
      expect(dash).toHaveAttribute("aria-hidden", "true")
      expect(dash).toHaveClass("text-muted-foreground")
      expect(within(td).getByText("No value")).toHaveClass("sr-only")
    }
    const [field, status, depth, spud, active] = cells("B-2")
    expect(field).not.toHaveClass("text-end")
    expect(status.querySelector('[data-slot="badge"]')).toBeNull()
    expect(depth).toHaveClass("text-end")
    expect(spud).toHaveTextContent("—No value")
    expect(active).toHaveClass("text-center")
    expect(active.querySelector("svg")).toBeNull()
    const d = cells("D-4")
    expect(d[0]).toHaveTextContent("—No value")
    expect(d[2]).toHaveTextContent("—No value")
    expect(d[3]).toHaveTextContent("—No value")
    // A value is not drawn as empty: false is No, for screen readers.
    expect(cells("C-3")[4]).toHaveTextContent(/^No$/)
  })

  it("takes a column's emptyValue, null for a blank cell, and gives it to a cell", () => {
    const cell = vi.fn(
      (_: Well, { text, emptyValue }: { text: string; emptyValue: unknown }) =>
        text === "" ? (emptyValue as React.ReactNode) : <b>{text}</b>
    )
    const custom = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", emptyValue: null },
      { id: "depth", header: "TD (m)", type: "number", emptyValue: "n/a" },
      { id: "status", header: "Status", cell },
      { id: "active", header: "Active", type: "boolean", cell },
    ])
    render(
      <DataTable items={WELLS.slice(0, 2)} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const [field, depth, status, active] = cells("B-2")
    expect(field).toBeEmptyDOMElement()
    expect(depth).toHaveTextContent(/^n\/a$/)
    // A cell of its own keeps the convention with `emptyValue`.
    expect(status).toHaveTextContent("—No value")
    expect(active).toHaveTextContent("—No value")
    expect(cells("A-1")[2]).toHaveTextContent("producing")
  })

  it("exports empty values as empty fields, and search never matches the dash", async () => {
    const user = userEvent.setup({ delay: null })
    let api: ReturnType<typeof useDataTable<Well>> | undefined
    function Probe() {
      api = useDataTable<Well>()
      return null
    }
    render(
      <Wells>
        <Probe />
      </Wells>
    )
    const csv = await api!.exportCsv({ header: false })
    expect(csv.split("\r\n")[1]).toBe("B-2,,,,,")
    expect(csv).not.toContain("—")
    expect(csv).not.toContain("No value")
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "—")
    expect(names()).toEqual([])
    await user.clear(screen.getByRole("searchbox", { name: "Search" }))
    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "no value"
    )
    expect(names()).toEqual([])
  })

  it("sorts empty values last in both directions", () => {
    const { rerender } = render(
      <Wells
        view={{ sorting: [{ column: "depth", direction: "ascending" }] }}
      />
    )
    expect(names()).toEqual(["C-3", "A-1", "B-2", "D-4"])
    rerender(
      <Wells
        view={{ sorting: [{ column: "depth", direction: "descending" }] }}
      />
    )
    expect(names()).toEqual(["A-1", "C-3", "B-2", "D-4"])
    rerender(
      <Wells
        view={{ sorting: [{ column: "spud", direction: "descending" }] }}
      />
    )
    expect(names().slice(2)).toEqual(["B-2", "D-4"])
  })

  it("puts the rows without a value in one group, No value, last either way", () => {
    const groups = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="data-table-group-row"] th[scope="row"]:not([class*="hidden"])'
        ),
        (header) => header.querySelector(".truncate")?.textContent
      )
    const { rerender } = render(
      <Wells groupable view={{ grouping: ["status"] }} />
    )
    expect(groups()).toEqual([
      "Status: Producing",
      "Status: Drilling",
      "Status: No value",
    ])
    rerender(
      <Wells
        groupable
        view={{
          grouping: ["field"],
          sorting: [{ column: "field", direction: "descending" }],
        }}
      />
    )
    expect(groups()).toEqual([
      "Field: Snorre",
      "Field: Gullfaks",
      "Field: No value",
    ])
  })

  it("leaves empty values out of the totals", () => {
    render(<Wells />)
    const totals = document.querySelector('[data-slot="data-table-totals"]')!
    // 2,000 + 1,500; the null and NaN skipped. Two trues counted.
    expect(totals).toHaveTextContent("3,500")
    expect(totals).toHaveTextContent("2")
    expect(totals).not.toHaveTextContent("NaN")
  })
})

describe("DataTableFilter No value", () => {
  it("adds No value to an options filter, apart and counted, for the rows without one", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Status"))
    const dialog = screen.getByRole("dialog", { name: "Status" })
    const boxes = within(dialog).getAllByRole("checkbox")
    const noValue = within(dialog).getByRole("checkbox", { name: "No value" })
    // Last, after a separator, with its count.
    expect(boxes.at(-1)).toBe(noValue)
    expect(within(dialog).getByRole("separator")).toBeInTheDocument()
    expect(noValue.closest("div")).toHaveTextContent("No value1")
    await user.click(noValue)
    expect(lastFilters(onViewChange)).toEqual({
      status: { type: "options", values: [], empty: true },
    })
    expect(names()).toEqual(["B-2"])
    expect(chips()).toEqual(["Status: No value"])
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Producing" })
    )
    expect(lastFilters(onViewChange)).toEqual({
      status: { type: "options", values: ["producing"], empty: true },
    })
    expect(names()).toEqual(["A-1", "B-2", "D-4"])
    expect(chips()).toEqual(["Status: Producing, No value"])
    expect(filterButton("Status")).toHaveTextContent("Producing, No value")
  })

  it("offers No value only for a column with an empty value", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(filterButton("Well"))
    expect(
      screen.queryByRole("checkbox", { name: "No value" })
    ).not.toBeInTheDocument()
  })

  it("adds No value to a number filter, alone or with the range", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("TD (m)"))
    await user.click(screen.getByRole("checkbox", { name: "No value" }))
    expect(lastFilters(onViewChange)).toEqual({
      depth: { type: "number", empty: true },
    })
    expect(names()).toEqual(["B-2", "D-4"])
    expect(chips()).toEqual(["TD (m): No value"])
    await user.type(screen.getByRole("spinbutton", { name: "Min" }), "1800")
    await user.type(screen.getByRole("spinbutton", { name: "Max" }), "2500")
    expect(lastFilters(onViewChange)).toEqual({
      depth: { type: "number", min: 1800, max: 2500, empty: true },
    })
    expect(names()).toEqual(["A-1", "B-2", "D-4"])
    expect(chips()).toEqual(["TD (m): 1,800–2,500 or no value"])
    await user.click(screen.getByRole("checkbox", { name: "No value" }))
    expect(names()).toEqual(["A-1"])
    expect(chips()).toEqual(["TD (m): 1,800–2,500"])
  })

  it("adds No value to a date filter, beside Clear", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(
      <Wells
        onViewChange={onViewChange}
        defaultView={{
          filters: {
            spud: {
              type: "date",
              from: new Date(2020, 0, 1),
              to: new Date(2020, 11, 31),
            },
          },
        }}
      />
    )
    expect(names()).toEqual(["A-1"])
    await user.click(filterButton("Spud date"))
    const dialog = await screen.findByRole("dialog", { name: "Spud date" })
    await user.click(within(dialog).getByRole("checkbox", { name: "No value" }))
    expect(lastFilters(onViewChange).spud).toEqual({
      type: "date",
      from: new Date(2020, 0, 1),
      to: new Date(2020, 11, 31),
      empty: true,
    })
    expect(names()).toEqual(["A-1", "B-2", "D-4"])
    expect(chips()).toEqual(["Spud date: Jan 1, 2020–Dec 31, 2020 or no value"])
    // Clear removes the whole filter; No value alone is a filter too.
    await user.click(within(dialog).getByRole("button", { name: "Clear" }))
    expect(lastFilters(onViewChange)).toEqual({})
    await user.click(within(dialog).getByRole("checkbox", { name: "No value" }))
    expect(lastFilters(onViewChange)).toEqual({
      spud: { type: "date", empty: true },
    })
    expect(names()).toEqual(["B-2", "D-4"])
  })

  it("adds No value to a text filter", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Field"))
    await user.click(screen.getByRole("checkbox", { name: "No value" }))
    expect(lastFilters(onViewChange)).toEqual({
      field: { type: "text", value: "", empty: true },
    })
    expect(names()).toEqual(["B-2", "D-4"])
    await user.type(screen.getByRole("textbox", { name: "Contains" }), "gull")
    expect(names()).toEqual(["A-1", "B-2", "D-4"])
    expect(chips()).toEqual(["Field: gull or no value"])
  })

  it("adds No value to a yes / no filter as a fourth choice", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Active"))
    expect(screen.getAllByRole("radio")).toHaveLength(4)
    await user.click(screen.getByRole("radio", { name: "No value" }))
    expect(lastFilters(onViewChange)).toEqual({
      active: { type: "boolean", empty: true },
    })
    expect(names()).toEqual(["B-2"])
    expect(chips()).toEqual(["Active: No value"])
    await user.click(screen.getByRole("radio", { name: "Yes" }))
    expect(names()).toEqual(["A-1", "D-4"])
    expect(chips()).toEqual(["Active: Yes"])
  })

  it("sends No value to the server as `empty`, offered whatever the loaded rows", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    const counted = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "status",
        header: "Status",
        type: "options",
        options: [
          { value: "producing", label: "Producing", count: 812 },
          { value: "drilling", label: "Drilling", count: 1204 },
        ],
      },
      { id: "depth", header: "TD (m)", type: "number" },
    ])
    // The page loaded has a value everywhere.
    const page = [WELLS[0], WELLS[2]]
    render(
      <DataTable
        items={page}
        columns={counted}
        dataMode="server"
        searchDelay={0}
        filterable
        onViewChange={onViewChange}
      >
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await user.click(filterButton("Status"))
    const noValue = screen.getByRole("checkbox", { name: "No value" })
    // No count: the server's options have none for it.
    expect(noValue.closest("div")).toHaveTextContent(/^No value$/)
    await user.click(noValue)
    expect(lastFilters(onViewChange)).toEqual({
      status: { type: "options", values: [], empty: true },
    })
    await user.keyboard("{Escape}")
    await user.click(filterButton("TD (m)"))
    await user.click(screen.getByRole("checkbox", { name: "No value" }))
    expect(lastFilters(onViewChange)).toEqual({
      status: { type: "options", values: [], empty: true },
      depth: { type: "number", empty: true },
    })
    // The server's rows, as given.
    expect(names()).toEqual(["A-1", "C-3"])
  })
})

describe("DataTableFilterValue empty", () => {
  const ALL = { sortable: true, filterable: true, groupable: true }
  const defaults = createDefaultView(columns, undefined, ALL)
  const reconcile = (filters: Record<string, unknown>) =>
    reconcileView(columns, { filters: filters as never }, defaults, ALL).filters

  it("keeps a filter of No value alone, drops a flag that is not true", () => {
    expect(
      reconcile({
        depth: { type: "number", empty: true },
        spud: { type: "date", empty: true },
        active: { type: "boolean", empty: true },
        status: { type: "options", values: [], empty: true },
        field: { type: "text", value: "", empty: true },
      })
    ).toEqual({
      depth: { type: "number", empty: true },
      spud: { type: "date", empty: true },
      active: { type: "boolean", empty: true },
      status: { type: "options", values: [], empty: true },
      field: { type: "text", value: "", empty: true },
    })
    expect(
      reconcile({
        depth: { type: "number", empty: "yes" },
        status: { type: "options", values: [], empty: false },
        field: { type: "text", value: "x", empty: 1 },
        active: { type: "boolean" },
      })
    ).toEqual({ field: { type: "text", value: "x" } })
    // From JSON, parts may be missing: No value alone is filled in.
    expect(
      reconcile({
        status: { type: "options", empty: true },
        field: { type: "text", empty: true },
      })
    ).toEqual({
      status: { type: "options", values: [], empty: true },
      field: { type: "text", value: "", empty: true },
    })
    // A view without the flag is as before.
    const before = { depth: { type: "number", min: 2 } }
    expect(reconcile(before).depth).toBe(before.depth)
  })
})
