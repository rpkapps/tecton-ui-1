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
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
  useDataTable,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

import { columns, names, WELLS, type Well } from "./data-table-fixtures"

function Wells({
  items = WELLS,
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={items} columns={columns} pagination {...props}>
      <DataTableContent aria-label="Wells" />
      <DataTableFooter>
        <DataTablePagination />
      </DataTableFooter>
      {children}
    </DataTable>
  )
}

const button = (name: string) => screen.getByRole("button", { name })
/** "Page 2 of 5": the current page's button, and the last page's. */
const info = () => {
  const pages = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="pagination-item"] button[aria-label^="Page "]'
    ),
  ]
  const current = pages.find((page) => page.hasAttribute("aria-current"))
  return `Page ${current?.textContent} of ${pages.at(-1)?.textContent}`
}
const range = () =>
  document.querySelector('[data-slot="data-table-row-range"]')?.textContent
const ids = (from: number, to: number) =>
  WELLS.slice(from - 1, to).map((well) => well.name)

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable pages", () => {
  it("shows a page of rows, and moves between pages with the buttons", () => {
    const onPageChange = vi.fn()
    render(<Wells defaultPageSize={5} onPageChange={onPageChange} />)
    expect(names()).toEqual(ids(1, 5))
    expect(info()).toBe("Page 1 of 5")
    expect(range()).toBe("1–5 of 23")
    expect(
      screen.getByRole("navigation", { name: "Pagination" })
    ).toBeInTheDocument()
    // Buttons, not links; the current page's says so.
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(button("Page 1")).toHaveAttribute("aria-current", "page")
    // The way back is disabled on the first page, and keeps focus.
    expect(button("Previous page")).toHaveAttribute("aria-disabled", "true")

    fireEvent.click(button("Next page"))
    expect(names()).toEqual(ids(6, 10))
    expect(info()).toBe("Page 2 of 5")
    expect(range()).toBe("6–10 of 23")
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "next" })
    )
    fireEvent.click(button("Page 5"))
    expect(names()).toEqual(ids(21, 23))
    expect(range()).toBe("21–23 of 23")
    expect(onPageChange).toHaveBeenLastCalledWith(
      5,
      expect.objectContaining({ reason: "page" })
    )
    expect(button("Next page")).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(button("Previous page"))
    expect(info()).toBe("Page 4 of 5")
    fireEvent.click(button("Page 1"))
    expect(info()).toBe("Page 1 of 5")
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: "page" })
    )
  })

  it("shows the first, the last and the current page's neighbours, with ellipses", () => {
    const many = Array.from({ length: 240 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `M ${i}`,
    }))
    render(<Wells items={many} />)
    const shown = () =>
      // The wide row: the narrow row's own ellipses left out.
      [
        ...document.querySelectorAll(
          '[data-slot="pagination-item"]:not([data-narrow]) > *'
        ),
      ]
        .map((item) =>
          item.matches('[data-slot="pagination-ellipsis"]')
            ? "…"
            : item.getAttribute("aria-label")?.startsWith("Page ")
              ? item.textContent
              : null
        )
        .filter((item) => item !== null)
    expect(shown()).toEqual(["1", "2", "3", "4", "5", "…", "24"])
    expect(range()).toBe("1–10 of 240")
    fireEvent.click(button("Page 5"))
    expect(shown()).toEqual(["1", "…", "4", "5", "6", "…", "24"])
    fireEvent.click(button("Page 24"))
    expect(shown()).toEqual(["1", "…", "20", "21", "22", "23", "24"])
    expect(range()).toBe("231–240 of 240")
  })

  it("has the narrow widths' parts too: the neighbours' ellipses and \"Page 5 of 24\"", () => {
    const many = Array.from({ length: 240 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `M ${i}`,
    }))
    render(<Wells items={many} />)
    fireEvent.click(button("Page 5"))
    // One button per page: the narrow row shows some of the same ones.
    expect(screen.getAllByRole("button", { name: "Page 5" })).toHaveLength(1)
    expect(document.querySelectorAll("[data-narrow]")).toHaveLength(2)
    expect(
      document.querySelector('[data-slot="data-table-page-of"]')
    ).toHaveTextContent("Page 5 of 24")
    // Its label can go: the Select keeps its name.
    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toHaveAttribute("aria-label", "Rows per page")
  })

  it("announces the rows shown as they change", () => {
    render(<Wells />)
    expect(
      document.querySelector('[data-slot="data-table-row-range"]')
    ).toHaveAttribute("aria-live", "polite")
  })

  it("offers its own page sizes, or none", async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <DataTable items={WELLS} columns={columns} pagination>
        <DataTablePagination pageSizes={[10, 25, 50]} />
      </DataTable>
    )
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    const options = await screen.findAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual([
      "10",
      "25",
      "50",
    ])
    unmount()
    render(
      <DataTable items={WELLS} columns={columns} pagination>
        <DataTablePagination pageSizes={[]} />
      </DataTable>
    )
    expect(screen.queryByRole("combobox")).toBeNull()
  })

  it("shows ten rows a page by default", () => {
    render(<Wells />)
    expect(names()).toHaveLength(10)
    expect(info()).toBe("Page 1 of 3")
  })

  it("changes the page size from the Select, keeping the first row shown", async () => {
    const user = userEvent.setup()
    const onPageSizeChange = vi.fn()
    const onPageChange = vi.fn()
    render(
      <Wells
        defaultPageSize={5}
        defaultPage={3}
        pageSizes={[5, 10, 20]}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
      />
    )
    expect(names()).toEqual(ids(11, 15))
    const trigger = screen.getByRole("combobox", { name: "Rows per page" })
    expect(trigger).toHaveTextContent("5")
    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "10" }))
    expect(onPageSizeChange).toHaveBeenLastCalledWith(
      10,
      expect.objectContaining({ reason: "select" })
    )
    // Row 11 was first: page 2 of 10 rows holds it.
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "page-size" })
    )
    expect(names()).toEqual(ids(11, 20))
  })

  it("lists a page size the sizes leave out", async () => {
    const user = userEvent.setup()
    render(<Wells defaultPageSize={15} />)
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    const options = await screen.findAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual([
      "10",
      "15",
      "20",
      "50",
      "100",
    ])
  })

  it("goes back to page 1 when the sorting changes", () => {
    const onPageChange = vi.fn()
    render(<Wells defaultPage={3} onPageChange={onPageChange} />)
    expect(info()).toBe("Page 3 of 3")
    fireEvent.click(
      within(screen.getByRole("columnheader", { name: "Well" })).getByRole(
        "button"
      )
    )
    expect(info()).toBe("Page 1 of 3")
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: "reset" })
    )
  })

  it("keeps a page set along with the view", () => {
    function Restored() {
      const [state, setState] = React.useState({
        page: 1,
        sorting: [] as Array<{ column: string; direction: "descending" }>,
      })
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setState({
                page: 2,
                sorting: [{ column: "name", direction: "descending" }],
              })
            }
          >
            Restore
          </button>
          <Wells
            page={state.page}
            view={{
              sorting: state.sorting,
              search: "",
              filters: {},
              grouping: [],
              columns: {
                order: [],
                hidden: [],
                widths: {},
                pinned: { start: [], end: [] },
              },
            }}
          />
        </>
      )
    }
    render(<Restored />)
    fireEvent.click(screen.getByRole("button", { name: "Restore" }))
    expect(info()).toBe("Page 2 of 3")
    expect(names()[0]).toBe("Well 13")
  })

  it("shows a controlled page", () => {
    const onPageChange = vi.fn()
    render(<Wells page={2} onPageChange={onPageChange} />)
    expect(info()).toBe("Page 2 of 3")
    fireEvent.click(button("Next page"))
    expect(onPageChange).toHaveBeenCalledWith(3, expect.anything())
    expect(info()).toBe("Page 2 of 3")
  })

  it("clamps a page past the last one", () => {
    render(<Wells defaultPage={9} />)
    expect(info()).toBe("Page 3 of 3")
    expect(names()).toEqual(ids(21, 23))
  })

  it("formats the page numbers in the locale", () => {
    const many = Array.from({ length: 12_345 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `M ${i}`,
    }))
    render(
      <TectonProvider locale="de-DE">
        <Wells items={many} defaultPageSize={1} />
      </TectonProvider>
    )
    expect(info()).toBe("Page 1 of 12.345")
    expect(range()).toBe("1–1 of 12.345")
  })

  it("pages the server's rows from rowCount, reporting each page", () => {
    const onPageChange = vi.fn()
    function Server() {
      const [page, setPage] = React.useState(1)
      const items = WELLS.slice((page - 1) * 10, page * 10)
      return (
        <Wells
          dataMode="server"
          rowCount={95}
          items={items}
          page={page}
          onPageChange={(next, details) => {
            onPageChange(next, details)
            setPage(next)
          }}
        />
      )
    }
    render(<Server />)
    expect(info()).toBe("Page 1 of 10")
    expect(names()).toEqual(ids(1, 10))
    fireEvent.click(button("Next page"))
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "next" })
    )
    expect(names()).toEqual(ids(11, 20))
    expect(info()).toBe("Page 2 of 10")
  })

  it("loads a server page once when a sort on page 3 sends it back to page 1", () => {
    const fetches: Array<string> = []
    function Server() {
      const [view, setView] = React.useState<DataTableView | undefined>()
      const [page, setPage] = React.useState(3)
      const sorting = JSON.stringify(view?.sorting ?? [])
      // What a server table does: load whenever the query changes.
      React.useEffect(() => {
        fetches.push(`${sorting} page ${page}`)
      }, [sorting, page])
      return (
        <Wells
          dataMode="server"
          rowCount={95}
          items={WELLS.slice(0, 10)}
          view={view}
          onViewChange={setView}
          page={page}
          onPageChange={setPage}
        />
      )
    }
    render(<Server />)
    expect(fetches).toEqual(["[] page 3"])
    fireEvent.click(
      within(screen.getByRole("columnheader", { name: "Well" })).getByRole(
        "button"
      )
    )
    expect(fetches).toEqual([
      "[] page 3",
      '[{"column":"name","direction":"ascending"}] page 1',
    ])
  })

  it("reports a page past the last one as the last, controlled or not", () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Wells defaultPage={3} onPageChange={onPageChange} />
    )
    rerender(<Wells items={WELLS.slice(0, 12)} onPageChange={onPageChange} />)
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "clamp" })
    )
    // Uncontrolled: the page is 2 now, and stays when rows come back.
    rerender(<Wells items={WELLS} onPageChange={onPageChange} />)
    expect(info()).toBe("Page 2 of 3")

    const controlled = vi.fn()
    const { unmount } = render(
      <Wells items={WELLS.slice(0, 5)} page={3} onPageChange={controlled} />
    )
    expect(controlled).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ reason: "clamp" })
    )
    unmount()
  })

  it("moves from a clamped page by the page asked for", () => {
    const onPageChange = vi.fn()
    render(<Wells page={9} onPageChange={onPageChange} />)
    onPageChange.mockClear()
    // The table shows page 3, the last; "Previous page" goes to 2.
    fireEvent.click(button("Previous page"))
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "previous" })
    )
  })

  it("applies setters called one after the other", () => {
    let api: ReturnType<typeof useDataTable> | undefined
    const onViewChange = vi.fn()
    function Probe() {
      api = useDataTable()
      return null
    }
    render(
      <Wells
        filterable
        defaultView={{ sorting: [{ column: "name", direction: "descending" }] }}
        onViewChange={onViewChange}
      >
        <Probe />
      </Wells>
    )
    act(() => {
      api?.setSorting([])
      api?.setSearch("Gullfaks")
      api?.setPage(2)
      api?.setPageSize(5)
    })
    expect(api?.view.sorting).toEqual([])
    expect(api?.view.search).toBe("Gullfaks")
    expect(api?.pageSize).toBe(5)
    expect(onViewChange).toHaveBeenCalledTimes(2)
    expect(onViewChange.mock.calls[1][0].sorting).toEqual([])
  })

  describe("setters across an await", () => {
    function setup() {
      let api: ReturnType<typeof useDataTable> | undefined
      const onViewChange = vi.fn()
      function Probe() {
        api = useDataTable()
        return null
      }
      render(
        <Wells
          filterable
          defaultView={{
            sorting: [{ column: "name", direction: "descending" }],
          }}
          onViewChange={onViewChange}
        >
          <Probe />
        </Wells>
      )
      return { api: () => api!, onViewChange }
    }
    const expectBoth = (api: ReturnType<typeof useDataTable>) => {
      expect(api.view.sorting).toEqual([])
      expect(api.view.search).toBe("Gullfaks")
    }

    it("keeps both inside act", async () => {
      const { api } = setup()
      const first = api()
      await act(async () => {
        first.setSorting([])
        await Promise.resolve()
        first.setSearch("Gullfaks")
      })
      expectBoth(api())
    })

    it("keeps both outside act", async () => {
      const { api } = setup()
      const first = api()
      const flag = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      const before = flag.IS_REACT_ACT_ENVIRONMENT
      flag.IS_REACT_ACT_ENVIRONMENT = false
      try {
        first.setSorting([])
        await Promise.resolve()
        first.setSearch("Gullfaks")
        await waitFor(() => expectBoth(api()))
      } finally {
        flag.IS_REACT_ACT_ENVIRONMENT = before
      }
    })

    it("keeps both from timers", async () => {
      const { api } = setup()
      const first = api()
      await act(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              first.setSorting([])
              setTimeout(() => {
                first.setSearch("Gullfaks")
                resolve()
              })
            })
          })
      )
      expectBoth(api())
    })
  })

  it("keeps a page restored before the rows arrive", () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Wells items={[]} defaultPage={3} onPageChange={onPageChange} />
    )
    expect(onPageChange).not.toHaveBeenCalled()
    rerender(
      <Wells items={WELLS} defaultPage={3} onPageChange={onPageChange} />
    )
    expect(info()).toBe("Page 3 of 3")
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it("gives a tree's rows their place across pages, a repeated parent its own", () => {
    type Node = { id: string; name: string; children?: Array<Node> }
    const children = Array.from({ length: 12 }, (_, i) => ({
      id: `c${i}`,
      name: `Child ${i}`,
    }))
    render(
      <DataTable
        items={[{ id: "p", name: "Parent", children }] as Array<Node>}
        columns={createColumns<Node>([{ id: "name", header: "Name" }])}
        itemToChildren={(node) => node.children}
        defaultExpanded={["p"]}
        pagination
        defaultPage={2}
      >
        <DataTableContent aria-label="Assets" />
      </DataTable>
    )
    expect(screen.getByRole("treegrid")).toHaveAttribute("aria-rowcount", "14")
    const row = (name: string) => screen.getByText(name).closest("tr")
    expect(row("Parent")).toHaveAttribute("aria-rowindex", "2")
    expect(row("Child 9")).toHaveAttribute("aria-rowindex", "12")
    expect(row("Child 11")).toHaveAttribute("aria-rowindex", "14")
  })

  it("gives grouped rows their place across pages, a repeated group its own", () => {
    render(
      <Wells
        groupable
        defaultView={{ grouping: ["field"] }}
        defaultPageSize={5}
        defaultPage={2}
      />
    )
    const rows = [...document.querySelectorAll("tbody tr")]
    // Page 2 starts inside the first group: its row repeated, at its place.
    expect(rows[0]).toHaveAttribute("aria-rowindex", "2")
    expect(rows[1]).toHaveAttribute("aria-rowindex", "7")
  })

  it("sets the page and size through useDataTable", () => {
    let api: ReturnType<typeof useDataTable> | undefined
    function Probe() {
      api = useDataTable()
      return null
    }
    render(
      <Wells defaultPageSize={5}>
        <Probe />
      </Wells>
    )
    act(() => api?.setPage(4))
    expect(info()).toBe("Page 4 of 5")
    act(() => api?.setPageSize(20))
    expect(api?.pageSize).toBe(20)
    expect(info()).toBe("Page 1 of 2")
  })

  it("renders no page parts without pagination", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells pagination={false} />)
    expect(
      document.querySelector('[data-slot="data-table-footer"]')
    ).toBeEmptyDOMElement()
    expect(names()).toHaveLength(23)
  })
})
