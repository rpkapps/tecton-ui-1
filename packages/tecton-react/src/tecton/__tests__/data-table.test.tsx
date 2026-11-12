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
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/data-table"
import { TectonProvider } from "@tecton/react/provider"

import { loadFeature } from "../internal/data-table/lazy"

import {
  cell,
  columns,
  focused,
  focusRow,
  names,
  press,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

const csv = vi.hoisted(() => ({ loads: 0 }))
vi.mock("../internal/data-table/engine/csv", async (importOriginal) => {
  csv.loads++
  return importOriginal()
})

const FEW = WELLS.slice(0, 4)

function Wells({
  items = FEW,
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={items} columns={columns} {...props}>
      <DataTableContent aria-label="Wells" />
      {children}
    </DataTable>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable", () => {
  it("is a grid named by its content's aria-label, in a rounded frame", () => {
    render(<Wells />)
    const grid = screen.getByRole("grid", { name: "Wells" })
    expect(grid.closest('[data-slot="data-table-content"]')).toHaveClass(
      "rounded-md",
      "border"
    )
    expect(
      grid.closest('[data-slot="data-table"]')?.getAttribute("data-slot")
    ).toBe("data-table")
    expect(within(grid).getAllByRole("row")).toHaveLength(1 + FEW.length)
  })

  it("passes size and striped to the table", () => {
    render(<Wells size="sm" striped />)
    const table = screen.getByRole("grid")
    expect(table).toHaveAttribute("data-size", "sm")
    expect(table).toHaveAttribute("data-striped")
  })

  it("renders each column type", () => {
    const items: Array<Well> = [
      {
        id: "a",
        name: "34/10-A-12",
        field: "Gullfaks",
        status: "producing",
        depth: 12345.5,
        spud: new Date(Date.UTC(2021, 2, 4)),
        active: true,
      },
      {
        id: "b",
        name: "34/10-B-03",
        field: "Snorre",
        status: "drilling",
        depth: null,
        spud: null,
        active: false,
      },
    ]
    render(<Wells items={items} />)
    // The first column names the row.
    const header = cell("34/10-A-12")
    expect(header.tagName).toBe("TH")
    expect(header).toHaveAttribute("scope", "row")
    // Numbers: at the end, in tabular digits, formatted in the locale.
    const depth = cell("12,345.5")
    expect(depth).toHaveClass("text-end", "tabular-nums")
    expect(screen.getByRole("columnheader", { name: "Depth (m)" })).toHaveClass(
      "text-end"
    )
    // Options: an outline Badge with the label.
    const status = screen.getByText("Producing")
    expect(status).toHaveAttribute("data-slot", "badge")
    expect(status).toHaveAttribute("data-appearance", "outline")
    expect(status).toHaveAttribute("data-variant", "success")
    // Dates in the column's format.
    expect(cell("Mar 4, 2021")).toBeInTheDocument()
    // Booleans: a check, and Yes / No for screen readers.
    const yes = screen.getByText("Yes")
    expect(yes).toHaveClass("sr-only")
    expect(yes.closest("td")?.querySelector("svg")).not.toBeNull()
    expect(yes.closest("td")).toHaveClass("text-center")
    const no = screen.getByText("No")
    expect(no).toHaveClass("sr-only")
    expect(no.closest("td")?.querySelector("svg")).toBeNull()
    // Empty values: a muted dash, read as "No value".
    const empty = row("34/10-B-03").querySelectorAll("td")
    expect(empty[2]).toHaveTextContent("—No value")
    expect(empty[3]).toHaveTextContent("—No value")
  })

  it("renders a column's cell with the cell's details", () => {
    const cellFn = vi.fn((well: Well, details: { text: string }) => (
      <span data-testid="depth">{`${well.id}:${details.text}`}</span>
    ))
    const custom = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "depth", header: "Depth", type: "number", cell: cellFn },
    ])
    render(
      <DataTable items={FEW.slice(0, 1)} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(screen.getByTestId("depth")).toHaveTextContent("w1:1,000")
    expect(cellFn).toHaveBeenCalledWith(FEW[0], {
      id: "w1",
      column: "depth",
      value: 1000,
      text: "1,000",
      depth: 0,
      emptyValue: expect.anything(),
    })
  })

  it("takes the row header from the column with rowHeader", () => {
    const custom = createColumns<Well>([
      { id: "field", header: "Field" },
      { id: "name", header: "Well", rowHeader: true },
    ])
    render(
      <DataTable items={FEW.slice(0, 1)} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(cell("Well 01").tagName).toBe("TH")
    expect(cell("Gullfaks").tagName).toBe("TD")
  })

  it("renders grouped headers, one row per level", () => {
    const grouped = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "location",
        header: "Location",
        columns: [
          { id: "field", header: "Field" },
          { id: "status", header: "Status" },
        ],
      },
      { id: "depth", header: "Depth", type: "number" },
    ])
    render(
      <DataTable items={FEW} columns={grouped} selectionMode="multiple">
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const [top, leaves] = within(
      screen.getByRole("grid").querySelector("thead")!
    ).getAllByRole("row")
    const upper = within(top).getAllByRole("columnheader")
    // The selection column, "Well", the group and "Depth": the columns in
    // no group span both rows, so no empty cell stands above their names.
    expect(upper).toHaveLength(4)
    expect(upper[2]).toHaveTextContent("Location")
    expect(upper[2]).toHaveAttribute("colspan", "2")
    expect(upper[2]).toHaveAttribute("scope", "colgroup")
    expect(upper[2]).not.toHaveAttribute("rowspan")
    for (const at of [0, 1, 3])
      expect(upper[at]).toHaveAttribute("rowspan", "2")
    expect(upper[1]).toHaveAttribute("scope", "col")
    expect(upper[1]).toHaveAccessibleName("Well")
    expect(upper[3]).toHaveAccessibleName("Depth")
    // The checkbox in the selection column's cell, across both rows.
    expect(within(upper[0]).getByRole("checkbox")).toBeInTheDocument()
    // The group's columns in the second row.
    expect(
      within(leaves)
        .getAllByRole("columnheader")
        .map((h) => h.getAttribute("aria-label"))
    ).toEqual(["Field", "Status"])
  })

  it("hides a column below its breakpoint, header and cells", () => {
    const responsive = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", hideBelow: "md" },
    ])
    render(
      <DataTable items={FEW.slice(0, 1)} columns={responsive}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(screen.getByRole("columnheader", { name: "Field" })).toHaveClass(
      "hidden",
      "md:table-cell"
    )
    expect(cell("Gullfaks")).toHaveClass("hidden", "md:table-cell")
  })

  it("wraps a column's text in a table that is not virtualized", () => {
    const wrapping = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", wrap: true },
    ])
    render(
      <DataTable items={FEW.slice(0, 1)} columns={wrapping}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(cell("Gullfaks")).toHaveClass("whitespace-normal")
  })
})

describe("DataTable sorting", () => {
  const header = (name: string) => screen.getByRole("columnheader", { name })
  const sortButton = (name: string) => within(header(name)).getByRole("button")

  it("cycles a column ascending, descending and off by click", () => {
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "none")
    const original = names()

    fireEvent.click(sortButton("Depth (m)"))
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "ascending")
    const depths = FEW.map((well) => well.depth!)
    const ascending = [...FEW]
      .sort((a, b) => a.depth! - b.depth!)
      .map((well) => well.name)
    expect(names()).toEqual(ascending)
    expect(depths).toHaveLength(4)
    const [view, details] = onViewChange.mock.lastCall as [
      DataTableView,
      { reason: string },
    ]
    expect(view.sorting).toEqual([{ column: "depth", direction: "ascending" }])
    expect(details.reason).toBe("sort")

    fireEvent.click(sortButton("Depth (m)"))
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "descending")
    expect(names()).toEqual([...ascending].reverse())

    fireEvent.click(sortButton("Depth (m)"))
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "none")
    expect(names()).toEqual(original)
  })

  it("adds a column to the sort with Shift + click", () => {
    const onViewChange = vi.fn()
    render(<Wells items={WELLS} onViewChange={onViewChange} />)
    fireEvent.click(sortButton("Field"))
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    const [view] = onViewChange.mock.lastCall as [DataTableView]
    expect(view.sorting).toEqual([
      { column: "field", direction: "ascending" },
      { column: "depth", direction: "ascending" },
    ])
    // The first sort is the header's aria-sort; each shows its place.
    expect(header("Field")).toHaveAttribute("aria-sort", "ascending")
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "none")
    expect(sortButton("Field")).toHaveTextContent("Field1")
    expect(sortButton("Depth (m)")).toHaveTextContent("Depth (m)2")
    const expected = [...WELLS]
      .sort((a, b) => a.field.localeCompare(b.field) || a.depth! - b.depth!)
      .map((well) => well.name)
    expect(names()).toEqual(expected)
    // Shift + click cycles the column where it is.
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    expect((onViewChange.mock.lastCall as [DataTableView])[0].sorting).toEqual([
      { column: "field", direction: "ascending" },
      { column: "depth", direction: "descending" },
    ])
  })

  it("sorts from the keyboard: the arrows reach the sort button, Enter presses it", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    focusRow("Well 01")
    press("ArrowRight")
    press("ArrowUp")
    expect(focused()).toBe(sortButton("Well"))
    press("ArrowRight")
    expect(focused()).toBe(sortButton("Field"))
    await user.keyboard("{Enter}")
    expect(header("Field")).toHaveAttribute("aria-sort", "ascending")
    await user.keyboard("{Enter}")
    expect(header("Field")).toHaveAttribute("aria-sort", "descending")
  })

  it("has no sort buttons without sortable, nor on a column that opts out", () => {
    const { unmount } = render(<Wells sortable={false} />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(header("Well")).not.toHaveAttribute("aria-sort")
    unmount()
    const custom = createColumns<Well>([
      { id: "name", header: "Well", sortable: false },
      { id: "field", header: "Field" },
    ])
    render(
      <DataTable items={FEW} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(within(header("Well")).queryByRole("button")).toBeNull()
    expect(sortButton("Field")).toBeInTheDocument()
  })

  it("draws renderHeader inside the sort button", () => {
    const custom = createColumns<Well>([
      {
        id: "name",
        header: "Well",
        renderHeader: ({ header: text, sorted }) => (
          <em>{`${text}:${sorted ?? "off"}`}</em>
        ),
      },
    ])
    render(
      <DataTable items={FEW} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(sortButton("Well")).toHaveTextContent("Well:off")
    fireEvent.click(sortButton("Well"))
    expect(sortButton("Well")).toHaveTextContent("Well:ascending")
  })

  it("starts from defaultView, and shows a controlled view", () => {
    const { unmount } = render(
      <Wells
        defaultView={{ sorting: [{ column: "name", direction: "descending" }] }}
      />
    )
    expect(names()).toEqual(FEW.map((well) => well.name).reverse())
    unmount()
    const view: DataTableView = {
      sorting: [{ column: "depth", direction: "descending" }],
      search: "",
      filters: {},
      grouping: [],
      columns: {
        order: [],
        hidden: [],
        widths: {},
        pinned: { start: [], end: [] },
      },
    }
    const onViewChange = vi.fn()
    render(<Wells view={view} onViewChange={onViewChange} />)
    const descending = [...FEW]
      .sort((a, b) => b.depth! - a.depth!)
      .map((well) => well.name)
    expect(names()).toEqual(descending)
    // Controlled: the click reports, the view stays until the owner sets it.
    fireEvent.click(sortButton("Well"))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(names()).toEqual(descending)
  })

  it("reconciles a view: unknown columns and sorts on columns that cannot are dropped", () => {
    const onViewChange = vi.fn()
    render(
      <Wells
        sortable={false}
        defaultView={{
          sorting: [
            { column: "nope", direction: "ascending" },
            { column: "depth", direction: "ascending" },
          ],
        }}
        onViewChange={onViewChange}
      />
    )
    expect(names()).toEqual(FEW.map((well) => well.name))
  })

  it("keeps a cancelled change from applying", () => {
    render(<Wells onViewChange={(_view, details) => details.cancel()} />)
    fireEvent.click(sortButton("Well"))
    expect(header("Well")).toHaveAttribute("aria-sort", "none")
  })

  it("reports sorting in server mode, leaving the rows as they come", () => {
    const onViewChange = vi.fn()
    render(<Wells dataMode="server" onViewChange={onViewChange} />)
    fireEvent.click(sortButton("Depth (m)"))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(header("Depth (m)")).toHaveAttribute("aria-sort", "ascending")
    expect(names()).toEqual(FEW.map((well) => well.name))
  })

  it("announces a sort while focus is in the table", async () => {
    render(<Wells />)
    focusRow("Well 01")
    press("ArrowRight")
    press("ArrowUp")
    fireEvent.click(focused())
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="announcer"][aria-live="polite"]')
      ).toHaveTextContent("sorted by column Well in ascending order")
    )
  })
})

describe("DataTable states", () => {
  it("shows the empty state under the header", () => {
    render(<Wells items={[]} />)
    expect(screen.getByRole("columnheader", { name: "Well" })).toBeVisible()
    expect(screen.getByText("No rows")).toBeInTheDocument()
    expect(
      screen.getByText("There is nothing to show here yet.")
    ).toBeInTheDocument()
  })

  it("shows the content's own empty state", () => {
    render(
      <DataTable items={[]} columns={columns}>
        <DataTableContent aria-label="Wells" empty="No wells drilled yet" />
      </DataTable>
    )
    expect(screen.getByText("No wells drilled yet")).toBeInTheDocument()
    expect(screen.queryByText("No rows")).toBeNull()
  })

  it("shows no results with Clear filters while the view matches nothing", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Wells
        filterable
        defaultView={{ search: "nothing like this" }}
        onViewChange={onViewChange}
      />
    )
    expect(
      within(screen.getByRole("grid")).getByText("No results")
    ).toBeInTheDocument()
    const clear = screen.getByRole("button", { name: "Clear filters" })
    // The state's controls keep their place in the Tab order.
    expect(clear).not.toHaveAttribute("tabindex", "-1")
    await user.click(clear)
    const [view, details] = onViewChange.mock.lastCall as [
      DataTableView,
      { reason: string },
    ]
    expect(view.search).toBe("")
    // Only the search changed.
    expect(details.reason).toBe("search")
    expect(names()).toHaveLength(FEW.length)
  })

  it("shows the error state in place of the rows, with Retry", () => {
    const onRetry = vi.fn()
    const { rerender } = render(<Wells error onRetry={onRetry} />)
    expect(screen.getByText("The rows could not be loaded")).toBeInTheDocument()
    // Its icon on a translucent destructive tint, as the outlined badges.
    expect(
      document.querySelector(
        '[data-slot="data-table-state"] [data-slot="empty-icon"]'
      )
    ).toHaveClass("bg-destructive/10", "text-destructive")
    expect(
      screen.getByText("Something went wrong while loading the data.")
    ).toBeInTheDocument()
    expect(names()).toEqual([])
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    rerender(<Wells error="The well register is offline." />)
    expect(
      screen.getByText("The well register is offline.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull()
  })

  it("shows skeleton rows on the first load, the table busy", () => {
    render(<Wells items={[]} loading pagination defaultPageSize={7} />)
    const table = screen.getByRole("grid")
    expect(table).toHaveAttribute("aria-busy", "true")
    const skeletons = table.querySelectorAll(
      '[data-slot="data-table-loading-row"]'
    )
    expect(skeletons).toHaveLength(7)
    expect(skeletons[0]).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByRole("status")).toHaveTextContent("Loading")
    expect(screen.queryByText("No rows")).toBeNull()
  })

  it("shows five skeleton rows without pages", () => {
    render(<Wells items={[]} loading />)
    expect(
      document.querySelectorAll('[data-slot="data-table-loading-row"]')
    ).toHaveLength(5)
  })

  it("keeps the rows while refreshing, with a bar under the header", () => {
    render(<Wells loading />)
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true")
    expect(names()).toHaveLength(FEW.length)
    const bar = screen.getByRole("progressbar", { name: "Loading" })
    expect(bar).not.toHaveAttribute("aria-valuenow")
    expect(bar).toHaveAttribute("data-indeterminate")
    expect(
      bar.querySelector('[data-slot="progress-indicator"]')
    ).toHaveAttribute("data-indeterminate")
  })
})

describe("DataTable links and activation", () => {
  const href = (well: Well) => `/wells/${well.id}`

  it("makes the row header a link through the provider's router", () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells itemToHref={href} />
      </TectonProvider>
    )
    const link = screen.getByRole("link", { name: "Well 01" })
    expect(link).toHaveAttribute("href", "/wells/w1")
    expect(link.closest("th")).toHaveAttribute("scope", "row")
    fireEvent.click(link)
    expect(navigate).toHaveBeenCalledWith("/wells/w1", undefined)
  })

  /**
   * The clicks that reach the page after the table's handlers: what the
   * browser would follow (jsdom cannot, so they stop here).
   */
  function browserClicks() {
    const clicks: Array<{
      href: string | null
      prevented: boolean
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }> = []
    const listener = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a")
      clicks.push({
        href: link?.getAttribute("href") ?? null,
        prevented: event.defaultPrevented,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      })
      event.preventDefault()
    }
    document.addEventListener("click", listener)
    return {
      clicks,
      stop: () => document.removeEventListener("click", listener),
    }
  }

  it("follows the row's link when the row activates: Enter, or a click elsewhere in it", () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells itemToHref={href} />
      </TectonProvider>
    )
    focusRow("Well 02")
    press("Enter")
    expect(navigate).toHaveBeenLastCalledWith("/wells/w2", undefined)
    fireEvent.click(cell("Snorre"))
    expect(navigate).toHaveBeenLastCalledWith("/wells/w3", undefined)
  })

  it("leaves a click with Ctrl, Meta or Shift, on the link or the row, to the browser", () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells itemToHref={href} />
      </TectonProvider>
    )
    const browser = browserClicks()
    fireEvent.click(screen.getByRole("link", { name: "Well 01" }), {
      ctrlKey: true,
    })
    fireEvent.click(cell("Snorre"), { metaKey: true })
    fireEvent.click(cell("Statfjord"), { shiftKey: true })
    focusRow("Well 04")
    press("Enter", { ctrlKey: true })
    browser.stop()
    expect(navigate).not.toHaveBeenCalled()
    // Each reached the row's own link, with its keys, not prevented: a new
    // tab or window, as for any link.
    const links = browser.clicks.filter((click) => click.href !== null)
    expect(links).toEqual([
      expect.objectContaining({
        href: "/wells/w1",
        prevented: false,
        ctrlKey: true,
      }),
      expect.objectContaining({
        href: "/wells/w3",
        prevented: false,
        metaKey: true,
      }),
      expect.objectContaining({
        href: "/wells/w2",
        prevented: false,
        shiftKey: true,
      }),
      expect.objectContaining({
        href: "/wells/w4",
        prevented: false,
        ctrlKey: true,
      }),
    ])
  })

  it("leaves a link to another site to the browser", () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells itemToHref={(well) => `https://example.org/wells/${well.id}`} />
      </TectonProvider>
    )
    const browser = browserClicks()
    focusRow("Well 01")
    press("Enter")
    browser.stop()
    expect(navigate).not.toHaveBeenCalled()
    expect(browser.clicks).toEqual([
      expect.objectContaining({
        href: "https://example.org/wells/w1",
        prevented: false,
      }),
    ])
  })

  it('does not follow the link of a disabled row with disabledBehavior="all"', () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells itemToHref={href} isItemDisabled={(well) => well.id === "w2"} />
      </TectonProvider>
    )
    const link = within(cell("Well 02")).getByRole("link")
    expect(link).not.toHaveAttribute("href")
    expect(link).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(link)
    fireEvent.click(cell("Statfjord"))
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole("link", { name: "Well 01" })).toHaveAttribute(
      "href",
      "/wells/w1"
    )
  })

  it("calls onActivate with the row's id and item", () => {
    const onActivate = vi.fn()
    render(<Wells onActivate={onActivate} />)
    focusRow("Well 03")
    press("Enter")
    expect(onActivate).toHaveBeenLastCalledWith("w3", FEW[2])
    fireEvent.click(cell("Well 04"))
    expect(onActivate).toHaveBeenLastCalledWith("w4", FEW[3])
  })

  it("keeps a checkbox selection: a click activates only while none is selected, then toggles", () => {
    const onActivate = vi.fn()
    const onValueChange = vi.fn()
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate}>
        <Wells
          selectionMode="multiple"
          itemToHref={href}
          onActivate={onActivate}
          onValueChange={onValueChange}
        />
      </TectonProvider>
    )
    // Nothing selected: a click opens the row.
    fireEvent.click(cell("Gullfaks"))
    expect(onActivate).toHaveBeenLastCalledWith("w1", FEW[0])
    expect(navigate).toHaveBeenLastCalledWith("/wells/w1", undefined)
    expect(onValueChange).not.toHaveBeenCalled()
    // Rows selected: a click toggles a row, keeping the others.
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Well 02" }))
    fireEvent.click(cell("Snorre"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["w2", "w3"],
      expect.anything()
    )
    expect(onActivate).toHaveBeenCalledTimes(1)
    // The arrows move focus only; Space toggles; Enter and a double click open.
    focusRow("Well 02")
    press("ArrowDown")
    press("ArrowDown")
    expect(focused()).toBe(row("Well 04"))
    expect(row("Well 02")).toHaveAttribute("aria-selected", "true")
    expect(row("Well 03")).toHaveAttribute("aria-selected", "true")
    press(" ")
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["w2", "w3", "w4"],
      expect.anything()
    )
    press("Enter")
    expect(onActivate).toHaveBeenLastCalledWith("w4", FEW[3])
    fireEvent.doubleClick(cell("Visund"))
    expect(onActivate).toHaveBeenCalledTimes(3)
  })
})

describe("DataTable right to left", () => {
  it("mirrors the arrows and the page buttons", () => {
    render(
      <TectonProvider direction="rtl">
        <Wells pagination>
          <DataTableFooter>
            <DataTablePagination />
          </DataTableFooter>
        </Wells>
      </TectonProvider>
    )
    focusRow("Well 01")
    press("ArrowLeft")
    expect(focused()).toBe(cell("Well 01"))
    press("ArrowLeft")
    expect(focused()).toBe(cell("Gullfaks"))
    press("ArrowRight")
    expect(focused()).toBe(cell("Well 01"))
    for (const name of ["Previous page", "Next page"])
      expect(
        screen.getByRole("button", { name }).querySelector("svg")
      ).toHaveClass("rtl:rotate-180")
  })

  it("mirrors the tree's chevron", () => {
    type Node = { id: string; name: string; children?: Array<Node> }
    const tree = createColumns<Node>([{ id: "name", header: "Name" }])
    render(
      <TectonProvider direction="rtl">
        <DataTable
          items={
            [
              { id: "a", name: "Gullfaks", children: [{ id: "b", name: "A" }] },
            ] as Array<Node>
          }
          columns={tree}
          itemToChildren={(node) => node.children}
        >
          <DataTableContent aria-label="Assets" />
        </DataTable>
      </TectonProvider>
    )
    const chevron = cell("Gullfaks").querySelector(
      '[data-slot="data-table-chevron"] svg'
    )
    expect(chevron).toHaveClass("rtl:-scale-x-100")
  })
})

describe("DataTable development warnings", () => {
  it("warns once of items without an id, and of ids used twice", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const items = [
      { ...FEW[0], id: undefined as unknown as string },
      FEW[1],
      FEW[1],
    ]
    const { rerender } = render(<Wells items={items} />)
    rerender(<Wells items={[...items]} />)
    const messages = warn.mock.calls.map(([message]) => String(message))
    expect(messages.filter((m) => m.includes("no id"))).toHaveLength(1)
    expect(messages.filter((m) => m.includes('"w2"'))).toHaveLength(1)
  })

  it("warns once of a part whose feature is off, which renders nothing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(
      <Wells>
        <DataTablePagination data-testid="info" />
      </Wells>
    )
    rerender(
      <Wells>
        <DataTablePagination data-testid="info" />
      </Wells>
    )
    expect(screen.queryByTestId("info")).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain(
      "DataTablePagination renders nothing: pagination is off"
    )
  })

  it("warns of features that cannot work together, keeping the earlier one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    type Node = { id: string; name: string; children?: Array<Node> }
    const tree = createColumns<Node>([
      { id: "name", header: "Name", wrap: true },
    ])
    render(
      <div style={{ height: 200 }}>
        <DataTable
          items={[{ id: "a", name: "Gullfaks" }] as Array<Node>}
          columns={tree}
          itemToChildren={(node) => node.children}
          groupable
          defaultView={{ grouping: ["name"] }}
        >
          <DataTableContent aria-label="Assets" virtualized />
        </DataTable>
      </div>
    )
    const messages = warn.mock.calls.map(([message]) => String(message))
    expect(
      messages.some((m) => m.includes("`groupable` is off in a tree"))
    ).toBe(true)
    expect(messages.some((m) => m.includes("`wrap` is off"))).toBe(true)
    // Not grouped: the tree's row is there, no group row.
    expect(names()).toEqual(["Gullfaks"])
  })

  it("warns of server pages without rowCount", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells dataMode="server" pagination />)
    expect(String(warn.mock.calls[0][0])).toContain("`rowCount`")
  })

  it("says nothing for a table that is right", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells selectionMode="multiple" pagination />)
    expect(warn).not.toHaveBeenCalled()
  })
})

describe("useDataTable", () => {
  it("throws outside a DataTable", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    function Outside() {
      useDataTable()
      return null
    }
    expect(() => render(<Outside />)).toThrow(
      "useDataTable must be called in a component inside a DataTable."
    )
    expect(() => render(<DataTableContent />)).toThrow(
      "DataTableContent must be used inside a DataTable."
    )
  })

  it("gives the table's state and actions", () => {
    let api: ReturnType<typeof useDataTable<Well>> | undefined
    function Probe() {
      api = useDataTable<Well>()
      return null
    }
    render(
      <Wells
        items={WELLS}
        pagination
        defaultPageSize={5}
        selectionMode="multiple"
      >
        <Probe />
      </Wells>
    )
    expect(api?.rowCount).toBe(23)
    expect(api?.pageCount).toBe(5)
    expect(api?.rows.page.map((well) => well.id)).toEqual([
      "w1",
      "w2",
      "w3",
      "w4",
      "w5",
    ])
    expect(api?.rows.all).toHaveLength(23)
    expect(api?.columns.map((column) => column.id)).toEqual([
      "name",
      "field",
      "status",
      "depth",
      "spud",
      "active",
    ])
    act(() => api?.setSorting([{ column: "depth", direction: "descending" }]))
    expect(api?.view.sorting).toEqual([
      { column: "depth", direction: "descending" },
    ])
    expect(api?.rows.filtered[0].depth).toBe(
      Math.max(...WELLS.map((well) => well.depth!))
    )
    act(() => api?.setPage(3))
    expect(api?.page).toBe(3)
    act(() => api?.selectAll())
    expect(api?.value).toHaveLength(23)
    act(() => api?.clearSelection())
    expect(api?.value).toEqual([])
    act(() => api?.resetView())
    expect(api?.view.sorting).toEqual([])
  })

  it("loads the CSV exporter on first export, and exports the view's rows", async () => {
    let api: ReturnType<typeof useDataTable<Well>> | undefined
    function Probe() {
      api = useDataTable<Well>()
      return null
    }
    render(
      <Wells
        items={FEW}
        defaultView={{ sorting: [{ column: "name", direction: "descending" }] }}
      >
        <Probe />
      </Wells>
    )
    expect(csv.loads).toBe(0)
    const text = await api!.exportCsv()
    expect(csv.loads).toBe(1)
    const lines = text.trimEnd().split("\r\n")
    expect(lines[0]).toBe("Well,Field,Status,Depth (m),Spud date,Active")
    expect(lines[1]).toBe('Well 04,Visund,Producing,"2,191","Apr 4, 2020",No')
    expect(lines).toHaveLength(5)
    const some = await api!.exportCsv({
      rows: "page",
      columns: "all",
      header: false,
    })
    expect(some.split("\r\n")[0]).toContain("Well 04")
    expect(csv.loads).toBe(1)
  })

  it("re-renders a custom part as the state changes", () => {
    function Count() {
      const { value } = useDataTable()
      return <output>{value.length}</output>
    }
    render(
      <Wells selectionMode="multiple">
        <DataTableToolbar>
          <Count />
        </DataTableToolbar>
      </Wells>
    )
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Well 01" }))
    expect(document.querySelector("output")).toHaveTextContent("1")
  })
})

describe("DataTable on the server and on demand", () => {
  it("renders its rows on the server, loading nothing", () => {
    const html = renderToString(
      <Wells selectionMode="multiple" pagination reorderableColumns />
    )
    expect(html).toContain('role="grid"')
    expect(html).toContain("Well 04")
    expect(html).toContain('aria-sort="none"')
  })

  it("prefetches the features a mounted table has on, in idle time", () => {
    // The engine prepares sorting in idle time too: only a prefetch is
    // cancelled when its table unmounts first.
    let handles = 0
    const idle = vi.fn(() => ++handles)
    const cancel = vi.fn()
    vi.stubGlobal("requestIdleCallback", idle)
    vi.stubGlobal("cancelIdleCallback", cancel)
    render(<Wells />).unmount()
    expect(cancel).not.toHaveBeenCalled()
    render(<Wells reorderableColumns />).unmount()
    expect(cancel).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it("loads a feature once, sharing the promise", () => {
    expect(loadFeature("dragAndDrop")).toBe(loadFeature("dragAndDrop"))
  })
})
