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
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableSearch,
  DataTableToolbar,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

import {
  columns,
  focused,
  focusRow,
  names,
  press,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

function Wells({
  items = WELLS.slice(0, 8),
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={items} columns={columns} filterable {...props}>
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableFilter column="active" />
        <DataTableFilter column="name" />
        <DataTableFilter column="spud" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableContent aria-label="Wells" />
      {children}
    </DataTable>
  )
}

const searchbox = () => screen.getByRole("searchbox", { name: "Search" })
const filterButton = (columnName: string) =>
  screen.getByRole("button", { name: `Filter by ${columnName}` })
const chips = () =>
  Array.from(
    document.querySelectorAll('[data-slot="chip"]'),
    (chip) => chip.getAttribute("aria-label") ?? chip.textContent
  )
const status = () =>
  document.querySelector('[data-slot="data-table-content"] > [role="status"]')

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("DataTableSearch", () => {
  it("matches the rows whose shown, filterable columns contain the text, ignoring case and accents", async () => {
    const user = userEvent.setup({ delay: null })
    const items: Array<Well> = [
      { ...WELLS[0], id: "a", name: "Ærøy", field: "Gullfaks" },
      { ...WELLS[1], id: "b", name: "Snøhvit", field: "Snorre" },
      { ...WELLS[2], id: "c", name: "Draugen", field: "Visund" },
    ]
    render(<Wells items={items} />)
    await user.type(searchbox(), "SNOH")
    expect(names()).toEqual(["Snøhvit"])
    await user.clear(searchbox())
    // Options by their label, not their value.
    await user.type(searchbox(), "shut in")
    expect(names()).toEqual(["Snøhvit"])
    await user.clear(searchbox())
    await user.type(searchbox(), "gullf")
    expect(names()).toEqual(["Ærøy"])
    // The file's first table also loads the calendar's module in idle time.
  }, 15_000)

  it("says how many rows match, and clears with its button or Escape", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.type(searchbox(), "Well 0")
    expect(names()).toHaveLength(8)
    await user.type(searchbox(), "3")
    expect(names()).toEqual(["Well 03"])
    // Said once the user pauses.
    expect(status()).not.toHaveTextContent("result")
    await waitFor(() => expect(status()).toHaveTextContent("1 result"))
    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(searchbox()).toHaveValue("")
    expect(searchbox()).toHaveFocus()
    expect(names()).toHaveLength(8)
    await waitFor(() => expect(status()).toHaveTextContent("8 results"))
    await user.type(searchbox(), "07")
    expect(names()).toEqual(["Well 07"])
    await user.keyboard("{Escape}")
    expect(searchbox()).toHaveValue("")
    expect(names()).toHaveLength(8)
  })

  it("leaves Escape on an empty field to what is around it", () => {
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <Wells />
      </div>
    )
    fireEvent.keyDown(searchbox(), { key: "Escape" })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it("shows each key at once and reaches the view after `searchDelay`, once", () => {
    vi.useFakeTimers()
    const onViewChange = vi.fn()
    render(<Wells searchDelay={300} onViewChange={onViewChange} />)
    fireEvent.change(searchbox(), { target: { value: "W" } })
    fireEvent.change(searchbox(), { target: { value: "We" } })
    fireEvent.change(searchbox(), { target: { value: "Well 05" } })
    expect(searchbox()).toHaveValue("Well 05")
    expect(onViewChange).not.toHaveBeenCalled()
    expect(names()).toHaveLength(8)
    act(() => vi.advanceTimersByTime(299))
    expect(onViewChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange.mock.calls[0][0].search).toBe("Well 05")
    expect(onViewChange.mock.calls[0][1].reason).toBe("search")
    expect(names()).toEqual(["Well 05"])
  })

  it("sends the search at once on Enter", () => {
    vi.useFakeTimers()
    const onViewChange = vi.fn()
    render(<Wells searchDelay={500} onViewChange={onViewChange} />)
    fireEvent.change(searchbox(), { target: { value: "Well 02" } })
    fireEvent.keyDown(searchbox(), { key: "Enter" })
    expect(onViewChange).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(onViewChange).toHaveBeenCalledTimes(1)
  })

  it("waits 300 ms by default in server mode and reports instead of searching", () => {
    vi.useFakeTimers()
    const onViewChange = vi.fn()
    render(<Wells dataMode="server" onViewChange={onViewChange} />)
    fireEvent.change(searchbox(), { target: { value: "Well 05" } })
    act(() => vi.advanceTimersByTime(299))
    expect(onViewChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    // The server's rows, as given.
    expect(names()).toHaveLength(8)
  })

  it("in server mode says how many rows match once the server's rows come, not the count before", () => {
    vi.useFakeTimers()
    const { rerender } = render(<Wells dataMode="server" rowCount={8} />)
    fireEvent.change(searchbox(), { target: { value: "Well 05" } })
    act(() => vi.advanceTimersByTime(2000))
    // The view went to the server; its rows are not back yet.
    expect(status()).not.toHaveTextContent("result")
    rerender(<Wells dataMode="server" rowCount={8} loading />)
    expect(status()).not.toHaveTextContent("result")
    rerender(<Wells dataMode="server" items={[WELLS[4]]} rowCount={1} />)
    expect(status()).toHaveTextContent("1 result")
  })

  it("follows a controlled view, and puts the view's search back when a change is cancelled", () => {
    const onViewChange = vi.fn(
      (_view: DataTableView, details: { cancel: () => void }) =>
        details.cancel()
    )
    const { rerender } = render(
      <Wells view={{ search: "Well 01" }} onViewChange={onViewChange} />
    )
    expect(searchbox()).toHaveValue("Well 01")
    expect(names()).toEqual(["Well 01"])
    fireEvent.change(searchbox(), { target: { value: "Well 02" } })
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(searchbox()).toHaveValue("Well 01")
    rerender(<Wells view={{ search: "Well 04" }} onViewChange={onViewChange} />)
    expect(searchbox()).toHaveValue("Well 04")
    expect(names()).toEqual(["Well 04"])
  })

  it("keeps a tree's matches with their ancestors, opened", async () => {
    type Node = { id: string; name: string; children?: Array<Node> }
    const tree: Array<Node> = [
      {
        id: "gullfaks",
        name: "Gullfaks",
        children: [
          { id: "a12", name: "A-12" },
          { id: "b3", name: "B-3" },
        ],
      },
      { id: "snorre", name: "Snorre", children: [{ id: "d2", name: "D-2" }] },
    ]
    const nodeColumns = createColumns<Node>([{ id: "name", header: "Name" }])
    const user = userEvent.setup({ delay: null })
    render(
      <DataTable
        items={tree}
        columns={nodeColumns}
        itemToChildren={(node) => node.children}
        filterable
      >
        <DataTableSearch />
        <DataTableContent aria-label="Assets" />
      </DataTable>
    )
    expect(names()).toEqual(["Gullfaks", "Snorre"])
    await user.type(searchbox(), "b-3")
    expect(names()).toEqual(["Gullfaks", "B-3"])
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
  })

  it("moves focus to the row now in place when the focused row no longer matches", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    focusRow("Well 03")
    await user.type(searchbox(), "Well 0")
    // Matches every row: the table's tab stop stays on the row.
    expect(row("Well 03")).toHaveAttribute("tabindex", "0")
    await user.type(searchbox(), "5")
    expect(row("Well 05")).toHaveAttribute("tabindex", "0")
  })

  it("renders nothing and warns once without `filterable`", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <DataTable items={WELLS} columns={columns}>
        <DataTableSearch />
        <DataTableActiveFilters />
        <DataTableFilter column="status" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(screen.queryByRole("searchbox")).toBeNull()
    expect(screen.queryByRole("button", { name: /Filter by/ })).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      "DataTableSearch renders nothing: `filterable` is off on its DataTable."
    )
    expect(warn).toHaveBeenCalledWith(
      "DataTableFilter renders nothing: `filterable` is off on its DataTable."
    )
    expect(warn).toHaveBeenCalledWith(
      "DataTableActiveFilters renders nothing: `filterable` is off on its DataTable."
    )
  })

  it("is translated", async () => {
    render(
      <TectonProvider locale="de-DE">
        <Wells />
      </TectonProvider>
    )
    expect(
      await screen.findByRole("searchbox", { name: "Suchen" })
    ).toHaveAttribute("placeholder", "Suchen")
    expect(
      screen.getByRole("button", { name: "Nach Status filtern" })
    ).toBeInTheDocument()
  })
})

describe("DataTableFilter", () => {
  it("filters an options column by the values checked, with each one's count", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Status"))
    const dialog = screen.getByRole("dialog", { name: "Status" })
    const producing = within(dialog).getByRole("checkbox", {
      name: "Producing",
    })
    // 8 wells: producing, shut in and drilling in turn.
    expect(producing.closest("div")).toHaveTextContent("3")
    await user.click(producing)
    expect(onViewChange.mock.calls.at(-1)?.[0].filters).toEqual({
      status: { type: "options", values: ["producing"] },
    })
    expect(onViewChange.mock.calls.at(-1)?.[1].reason).toBe("filter")
    expect(names()).toEqual(["Well 01", "Well 04", "Well 07"])
    await user.click(within(dialog).getByRole("checkbox", { name: "Drilling" }))
    expect(names()).toEqual([
      "Well 01",
      "Well 03",
      "Well 04",
      "Well 06",
      "Well 07",
    ])
    // The button shows the values chosen.
    expect(filterButton("Status")).toHaveTextContent("Producing, Drilling")
  })

  it("counts an option's rows by the search and the other filters", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells defaultView={{ search: "Well 0" }} />)
    fireEvent.change(searchbox(), { target: { value: "Well 01" } })
    await user.click(filterButton("Status"))
    const dialog = screen.getByRole("dialog", { name: "Status" })
    expect(
      within(dialog).getByRole("checkbox", { name: "Producing" }).closest("div")
    ).toHaveTextContent("1")
    expect(
      within(dialog).getByRole("checkbox", { name: "Drilling" }).closest("div")
    ).toHaveTextContent("0")
  })

  it("counts from the options in server mode", async () => {
    const user = userEvent.setup({ delay: null })
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
    ])
    render(
      <DataTable items={WELLS} columns={counted} dataMode="server" filterable>
        <DataTableFilter column="status" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await user.click(filterButton("Status"))
    expect(
      screen.getByRole("checkbox", { name: "Drilling" }).closest("div")
    ).toHaveTextContent("1,204")
  })

  it("filters a number column by a range, after the delay, and keeps what was typed", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(filterButton("Depth (m)"))
    const min = screen.getByRole("textbox", { name: "Min" })
    await user.type(min, "2000")
    const depths = WELLS.slice(0, 8)
      .filter((well) => (well.depth ?? 0) >= 2000)
      .map((well) => well.name)
    expect(names()).toEqual(depths)
    const max = screen.getByRole("textbox", { name: "Max" })
    await user.type(max, "3000.0")
    expect(max).toHaveValue("3000.0")
    expect(filterButton("Depth (m)")).toHaveTextContent("2,000–3,000")
    // Formatted once it loses focus.
    await user.click(min)
    expect(max).toHaveValue("3,000")
    await user.clear(min)
    expect(filterButton("Depth (m)")).toHaveTextContent("≤ 3,000")
  })

  it("steps a number filter's bounds with its buttons and arrow keys, not native spinners", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Depth (m)"))
    const min = screen.getByRole("textbox", { name: "Min" })
    expect(min).toHaveAttribute("data-slot", "number-input-input")
    expect(min).toHaveAccessibleDescription("Depth (m)")
    expect(
      document.querySelector('input[type="number"]:not([aria-hidden])')
    ).toBeNull()
    await user.type(min, "2000")
    const [, increase] = min
      .closest('[data-slot="number-input-group"]')!
      .querySelectorAll("button")
    expect(increase).toHaveAccessibleName("Increase")
    await user.click(increase)
    expect(min).toHaveValue("2,001")
    await user.keyboard("{ArrowDown}{Enter}")
    expect(min).toHaveValue("2,000")
    expect(onViewChange.mock.calls.at(-1)?.[0].filters).toEqual({
      depth: { type: "number", min: 2000 },
    })
  })

  it("filters a text column by what its text contains", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(filterButton("Well"))
    await user.type(screen.getByRole("textbox", { name: "Contains" }), "06")
    expect(names()).toEqual(["Well 06"])
  })

  it("filters a boolean column by Yes or No, Any removing the filter", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(filterButton("Active"))
    await user.click(screen.getByRole("radio", { name: "No" }))
    expect(names()).toEqual(["Well 02", "Well 04", "Well 06", "Well 08"])
    await user.click(screen.getByRole("radio", { name: "Any" }))
    expect(onViewChange.mock.calls.at(-1)?.[0].filters).toEqual({})
    expect(names()).toHaveLength(8)
  })

  it("removes the filter with Clear, and moves focus into the filter", async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <Wells
        defaultView={{
          filters: { status: { type: "options", values: ["drilling"] } },
        }}
      />
    )
    expect(names()).toEqual(["Well 03", "Well 06"])
    await user.click(filterButton("Status"))
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(names()).toHaveLength(8)
    await waitFor(() =>
      expect(focused()).toBe(
        screen.getByRole("checkbox", { name: "Producing" })
      )
    )
  })

  it("is named by its own content when it has children, and described by nothing else", () => {
    render(
      <DataTable
        items={WELLS.slice(0, 4)}
        columns={columns}
        filterable
        defaultView={{
          filters: { status: { type: "options", values: ["producing"] } },
        }}
      >
        <DataTableFilter column="status">Status only</DataTableFilter>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const button = screen.getByRole("button", { name: "Status only" })
    expect(button).not.toHaveAttribute("aria-label")
    expect(button).not.toHaveAttribute("aria-describedby")
    expect(button).toHaveAttribute("aria-haspopup", "dialog")
  })

  it("renders nothing and warns for a column that opts out or is not there", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const optedOut = createColumns<Well>([
      { id: "name", header: "Well", filterable: false },
    ])
    render(
      <DataTable items={WELLS} columns={optedOut} filterable>
        <DataTableFilter column="name" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(screen.queryByRole("button", { name: /Filter by/ })).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      'DataTableFilter renders nothing: a filter on "name" (no such column, or it has `filterable: false`) is off on its DataTable.'
    )
  })

  it("filters a date column by a range picked on the calendar, loaded when it opens", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(
      <Wells
        defaultView={{
          filters: {
            spud: {
              type: "date",
              from: new Date(2020, 2, 1),
              to: new Date(2020, 2, 31),
            },
          },
        }}
        onViewChange={onViewChange}
      />
    )
    expect(filterButton("Spud date")).toHaveTextContent(
      /Mar 1, 2020–Mar 31, 2020/
    )
    await user.click(filterButton("Spud date"))
    const dialog = await screen.findByRole("dialog", { name: "Spud date" })
    const grid = await screen.findByRole("grid", { name: /March 2020/ })
    // As in a DateRangePicker: the first day starts a range, the second
    // (before it here) ends it, sets the filter and closes the popover.
    await user.click(within(grid).getByRole("button", { name: /March 10th/ }))
    expect(onViewChange).not.toHaveBeenCalled()
    await user.click(within(grid).getByRole("button", { name: /March 4th/ }))
    const filters = onViewChange.mock.calls.at(-1)?.[0].filters
    expect(filters.spud).toEqual({
      type: "date",
      from: new Date(2020, 2, 4),
      to: new Date(2020, 2, 10),
    })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(filterButton("Spud date")).toHaveFocus()
  })

  it("shows the date filter's calendar in the provider's locale and direction", async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <TectonProvider locale="he-IL">
        <Wells
          defaultView={{
            filters: {
              spud: { type: "date", from: new Date(2020, 2, 1) },
            },
          }}
        />
      </TectonProvider>
    )
    await user.click(
      screen
        .getAllByRole("button")
        .find((button) => button.getAttribute("aria-label")?.includes("Spud"))!
    )
    const calendar = await waitFor(
      () => {
        const element = document.querySelector('[data-slot="calendar"]')
        expect(element).not.toBeNull()
        return element!
      },
      { timeout: 10_000 }
    )
    expect(calendar.closest("[dir]")?.getAttribute("dir")).toBe("rtl")
    // Two months, as a DateRangePicker's, named in Hebrew.
    const grids = within(screen.getByRole("dialog")).getAllByRole("grid")
    expect(grids).toHaveLength(2)
    expect(grids[0]).toHaveAccessibleName(/מרץ 2020/)
  }, 20_000)
})

describe("DataTableActiveFilters", () => {
  const view: DataTableView["filters"] = {
    status: { type: "options", values: ["producing", "drilling"] },
    depth: { type: "number", min: 1500 },
  }

  it("shows the search and each filter as a chip, and nothing without any", () => {
    const { rerender } = render(<Wells />)
    expect(
      document.querySelector('[data-slot="data-table-active-filters"]')
    ).toBeNull()
    rerender(<Wells view={{ search: "Well", filters: view }} />)
    expect(
      screen.getByRole("grid", { name: "Active filters" })
    ).toBeInTheDocument()
    expect(chips()).toEqual([
      "Search: Well",
      "Status: Producing, Drilling",
      "Depth (m): ≥ 1,500",
    ])
  })

  it("removes a filter with its chip, focus staying among the chips, and every one with Clear all, focus going to the table", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(
      <Wells
        defaultView={{ search: "Well", filters: view }}
        onViewChange={onViewChange}
      />
    )
    await user.click(
      screen.getByRole("button", { name: /Remove.*Status: Producing/ })
    )
    expect(onViewChange.mock.calls.at(-1)?.[0].filters).toEqual({
      depth: { type: "number", min: 1500 },
    })
    expect(onViewChange.mock.calls.at(-1)?.[1].reason).toBe("filter")
    expect(chips()).toEqual(["Search: Well", "Depth (m): ≥ 1,500"])
    await waitFor(() =>
      expect(focused()).toBe(
        screen.getByRole("row", { name: "Depth (m): ≥ 1,500" })
      )
    )
    await user.click(screen.getByRole("button", { name: "Clear all" }))
    expect(onViewChange.mock.calls.at(-1)?.[0].search).toBe("")
    expect(searchbox()).toHaveValue("")
    expect(
      document.querySelector('[data-slot="data-table-active-filters"]')
    ).toBeNull()
    await waitFor(() => expect(focused().closest("table")).not.toBeNull())
  })

  it("Clear all drops a search or filter still waiting to be sent", () => {
    vi.useFakeTimers()
    const onViewChange = vi.fn()
    render(
      <Wells
        dataMode="server"
        defaultView={{ search: "Well", filters: view }}
        onViewChange={onViewChange}
      />
    )
    fireEvent.change(searchbox(), { target: { value: "Well 0" } })
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange.mock.calls[0][0]).toMatchObject({
      search: "",
      filters: {},
    })
    expect(searchbox()).toHaveValue("")
    // The search typed before is not sent after all.
    act(() => vi.advanceTimersByTime(1000))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(searchbox()).toHaveValue("")
  })

  it("removes the focused chip with Delete; the last one sends focus to the table", async () => {
    render(<Wells defaultView={{ search: "Well 0" }} />)
    const chip = document.querySelector<HTMLElement>('[data-slot="chip"]')!
    act(() => chip.focus())
    press("Delete")
    expect(searchbox()).toHaveValue("")
    await waitFor(() => expect(focused().closest("table")).not.toBeNull())
  })
})
