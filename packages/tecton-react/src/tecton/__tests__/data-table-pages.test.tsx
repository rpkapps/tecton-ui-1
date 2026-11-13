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
} from "@tecton/react/data-table"
import { TectonProvider } from "@tecton/react/provider"

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
/** The page field. */
const field = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Page" })
/** "Page 2 of 5": the page field's value and the number of pages. */
const info = () => {
  const count = document.querySelector('[data-step="count"]')?.textContent
  return `Page ${field().value} of ${count?.replace(/^\/\s*/, "")}`
}
const range = () =>
  document.querySelector('[data-slot="data-table-row-range"]')?.textContent
const ids = (from: number, to: number) =>
  WELLS.slice(from - 1, to).map((well) => well.name)
/** The parts `DataTablePagination` lets go of as it narrows, by `data-step`. */
const step = (name: string) =>
  document.querySelectorAll<HTMLElement>(`[data-step="${name}"]`)
const many = Array.from({ length: 240 }, (_, i) => ({
  ...WELLS[0],
  id: `m${i}`,
  name: `M ${i}`,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable pages", () => {
  it("shows a page of rows, and moves between pages with First, Previous, Next and Last", () => {
    const onPageChange = vi.fn()
    render(<Wells defaultPageSize={5} onPageChange={onPageChange} />)
    expect(names()).toEqual(ids(1, 5))
    expect(info()).toBe("Page 1 of 5")
    expect(range()).toBe("1–5 of 23")
    const nav = screen.getByRole("navigation", { name: "Pagination" })
    // Buttons, not links: the arrows and the page field.
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(
      within(nav)
        .getAllByRole("button")
        .map((item) => item.getAttribute("aria-label"))
    ).toEqual(["First page", "Previous page", "Next page", "Last page"])
    // The ways back are disabled on the first page, and keep focus.
    for (const name of ["First page", "Previous page"])
      expect(button(name)).toHaveAttribute("aria-disabled", "true")

    fireEvent.click(button("Next page"))
    expect(names()).toEqual(ids(6, 10))
    expect(info()).toBe("Page 2 of 5")
    expect(range()).toBe("6–10 of 23")
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: "next" })
    )
    fireEvent.click(button("Last page"))
    expect(names()).toEqual(ids(21, 23))
    expect(info()).toBe("Page 5 of 5")
    expect(range()).toBe("21–23 of 23")
    expect(onPageChange).toHaveBeenLastCalledWith(
      5,
      expect.objectContaining({ reason: "last" })
    )
    for (const name of ["Next page", "Last page"])
      expect(button(name)).toHaveAttribute("aria-disabled", "true")
    expect(button("First page")).not.toHaveAttribute("aria-disabled", "true")
    fireEvent.click(button("Previous page"))
    expect(info()).toBe("Page 4 of 5")
    expect(onPageChange).toHaveBeenLastCalledWith(
      4,
      expect.objectContaining({ reason: "previous" })
    )
    fireEvent.click(button("First page"))
    expect(info()).toBe("Page 1 of 5")
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: "first" })
    )
  })

  it("draws the arrows' icons mirrored in a right-to-left table", () => {
    render(
      <TectonProvider direction="rtl">
        <Wells defaultPageSize={5} />
      </TectonProvider>
    )
    for (const name of [
      "First page",
      "Previous page",
      "Next page",
      "Last page",
    ])
      expect(button(name).querySelector("svg")).toHaveClass("rtl:rotate-180")
    // In reading order: First and Previous first, at the start of the row.
    const order = [
      ...document.querySelectorAll<HTMLElement>("[data-page-button]"),
    ].map((item) => item.dataset.pageButton)
    expect(order).toEqual(["first", "previous", "next", "last"])
  })

  describe("the page field", () => {
    it("is a NumberField between the words, named Page, without minus and plus", () => {
      render(<Wells items={many} defaultPage={3} />)
      const input = field()
      expect(input).toHaveAttribute("data-slot", "number-field-input")
      expect(input).toHaveValue("3")
      expect(input).toHaveAttribute("inputmode", "numeric")
      expect(input).toHaveAccessibleDescription("of 24")
      const box = input.closest('[data-slot="data-table-page-field"]')!
      expect(
        box.querySelector(
          '[data-slot="number-field-decrement"], [data-slot="number-field-increment"]'
        )
      ).toBeNull()
      // "Page [3] of 24", and the narrow "[3] / 24".
      expect(
        [...box.querySelectorAll('[data-step="words"]')].map(
          (item) => item.textContent
        )
      ).toEqual(["Page", "of 24"])
      expect(box.querySelector('[data-step="count"]')).toHaveTextContent("/ 24")
      expect(box.querySelector('[data-step="count"]')).toHaveAttribute(
        "aria-hidden"
      )
    })

    it("opens the page typed on Enter, keeping focus in the field", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} onPageChange={onPageChange} />)
      await user.click(field())
      await user.keyboard("{Control>}a{/Control}17{Enter}")
      expect(info()).toBe("Page 17 of 24")
      expect(range()).toBe("161–170 of 240")
      expect(onPageChange).toHaveBeenCalledTimes(1)
      expect(onPageChange).toHaveBeenLastCalledWith(
        17,
        expect.objectContaining({ reason: "page" })
      )
      expect(field()).toHaveFocus()
    })

    it("opens the page typed as it loses focus", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} onPageChange={onPageChange} />)
      await user.click(field())
      await user.keyboard("{Control>}a{/Control}9")
      expect(onPageChange).not.toHaveBeenCalled()
      await user.tab()
      expect(info()).toBe("Page 9 of 24")
      expect(onPageChange).toHaveBeenLastCalledWith(
        9,
        expect.objectContaining({ reason: "page" })
      )
    })

    it("clamps a page past the ends on Enter, and goes back to the page on an empty field", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} defaultPage={5} onPageChange={onPageChange} />)
      await user.click(field())
      await user.keyboard("{Control>}a{/Control}240{Enter}")
      expect(info()).toBe("Page 24 of 24")
      expect(onPageChange).toHaveBeenLastCalledWith(24, expect.anything())
      await user.keyboard("{Control>}a{/Control}0{Enter}")
      expect(info()).toBe("Page 1 of 24")
      await user.keyboard("{Control>}a{/Control}2.6{Enter}")
      expect(info()).toBe("Page 3 of 24")
      onPageChange.mockClear()
      await user.clear(field())
      await user.keyboard("{Enter}")
      expect(info()).toBe("Page 3 of 24")
      expect(onPageChange).not.toHaveBeenCalled()
    })

    it("goes back to the page as it loses focus with a page outside them, a fraction or nothing", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} defaultPage={5} onPageChange={onPageChange} />)
      for (const text of ["0", "25", "240", "-3", "2.5", ""]) {
        await user.click(field())
        await user.keyboard(`{Control>}a{/Control}{Backspace}${text}`)
        await user.tab()
        expect([text, info()]).toEqual([text, "Page 5 of 24"])
      }
      expect(onPageChange).not.toHaveBeenCalled()
      // Letters are not taken at all.
      await user.click(field())
      await user.keyboard("{Control>}a{/Control}x")
      expect(field()).toHaveValue("5")
    })

    it("steps through the pages with the arrow keys, Home and End, at once", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(
        <Wells items={many} defaultPage={10} onPageChange={onPageChange} />
      )
      await user.click(field())
      await user.keyboard("{ArrowUp}")
      expect(info()).toBe("Page 11 of 24")
      expect(onPageChange).toHaveBeenLastCalledWith(
        11,
        expect.objectContaining({ reason: "page" })
      )
      await user.keyboard("{ArrowDown}{ArrowDown}")
      expect(info()).toBe("Page 9 of 24")
      expect(range()).toBe("81–90 of 240")
      await user.keyboard("{End}")
      expect(info()).toBe("Page 24 of 24")
      await user.keyboard("{ArrowUp}")
      expect(info()).toBe("Page 24 of 24")
      await user.keyboard("{Home}")
      expect(info()).toBe("Page 1 of 24")
      await user.keyboard("{ArrowDown}")
      expect(info()).toBe("Page 1 of 24")
      expect(field()).toHaveFocus()
    })

    it("follows the page changed elsewhere", () => {
      render(<Wells items={many} />)
      fireEvent.click(button("Next page"))
      fireEvent.click(button("Next page"))
      expect(field()).toHaveValue("3")
    })

    it("goes back to the page a controlled table keeps", async () => {
      const user = userEvent.setup()
      render(<Wells items={many} page={4} onPageChange={() => {}} />)
      await user.click(field())
      await user.keyboard("{Control>}a{/Control}12{Enter}")
      await waitFor(() => expect(field()).toHaveValue("4"))
    })

    it("is as wide as the last page's number, so nothing moves as the page changes", () => {
      render(<Wells items={many} />)
      const box = field().closest('[data-slot="number-field"]')!
        .parentElement as HTMLElement
      const width = box.style.width
      // Two digits ("24") and the field's padding.
      expect(width).toContain("2ch + 0.625rem")
      fireEvent.click(button("Last page"))
      expect(box.style.width).toBe(width)
    })
  })

  it("keeps the rows shown as wide as their widest text", () => {
    render(<Wells defaultPageSize={5} />)
    expect(
      document.querySelector('[data-slot="data-table-row-range"]')
    ).toHaveAttribute("data-widest", "23–23 of 23")
  })

  describe("as it narrows", () => {
    it("names the parts it lets go of, in turn", () => {
      render(<Wells items={many} />)
      // The "Rows" label, the Select, First and Last, the words around
      // the field ("/ 24" instead), and the rows shown.
      expect(step("label")[0]).toHaveTextContent("Rows")
      expect(step("label")[0]).toHaveAttribute("aria-hidden")
      expect(step("page-size")[0]).toContainElement(
        screen.getByRole("combobox", { name: "Rows per page" })
      )
      expect([...step("ends")].map((item) => item.textContent)).toEqual([
        "",
        "",
      ])
      expect(
        [...step("ends")].map((item) =>
          item.querySelector("button")?.getAttribute("aria-label")
        )
      ).toEqual(["First page", "Last page"])
      expect(step("words")).toHaveLength(2)
      expect(step("count")).toHaveLength(1)
      expect(step("range")).toHaveLength(1)
      // Previous, the field and Next have no step: they always stay.
      for (const name of ["Previous page", "Next page"])
        expect(button(name).closest("[data-step]")).toBeNull()
      expect(field().closest("[data-step]")).toBeNull()
    })

    it("lets them go at container widths by size and the last page's digits, in order", () => {
      const widths = (part: string) =>
        [...step(part)[0].className.matchAll(/@max-\[([\d.]+)rem\]/g)].map(
          ([, rem]) => Number(rem)
        )
      render(<Wells items={many} />)
      const pagination = document.querySelector(
        '[data-slot="data-table-pagination"]'
      )!
      expect(pagination).toHaveAttribute("data-size", "default")
      expect(pagination).toHaveAttribute("data-fit", "default-short")
      expect(pagination).toHaveClass("@container/data-table-pagination")
      // One width per size and digits, each step narrower than the last.
      const order = ["label", "page-size", "ends", "words", "range"].map(widths)
      for (const list of order) expect(list).toHaveLength(6)
      for (let i = 1; i < order.length; i++)
        order[i].forEach((rem, fit) =>
          expect(rem).toBeLessThan(order[i - 1][fit])
        )
      // "/ 24" shows where the words go.
      expect(widths("count")).toEqual(widths("words"))
      expect(step("count")[0]).toHaveClass("hidden")
    })

    it("fits a long last page, and the compact size", () => {
      const thousands = Array.from({ length: 12_400 }, (_, i) => ({
        ...WELLS[0],
        id: `t${i}`,
        name: `T ${i}`,
      }))
      render(<Wells items={thousands} size="sm" />)
      expect(
        document.querySelector('[data-slot="data-table-pagination"]')
      ).toHaveAttribute("data-fit", "sm-long")
      expect(info()).toBe("Page 1 of 1,240")
    })
  })

  it("follows the table's size: the band's height and its controls", () => {
    const { unmount } = render(<Wells items={many} />)
    const band = () =>
      document.querySelector('[data-slot="data-table-footer"]')!
    expect(band()).toHaveAttribute("data-size", "default")
    expect(band()).toHaveClass(
      "text-sm",
      "[[data-slot=data-table-content]+&]:min-h-[calc(var(--spacing)*6+1lh+1px)]",
      // A little room above and below its controls.
      "[[data-slot=data-table-content]+&]:py-2"
    )
    expect(button("Next page")).toHaveAttribute("data-size", "icon-sm")
    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toHaveAttribute("data-size", "default")
    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toHaveAttribute("data-variant", "outline")
    expect(field().closest('[data-slot="number-field-group"]')).toHaveAttribute(
      "data-size",
      "default"
    )
    unmount()
    render(<Wells items={many} size="sm" />)
    expect(band()).toHaveAttribute("data-size", "sm")
    expect(band()).toHaveClass(
      "text-xs",
      "[[data-slot=data-table-content]+&]:min-h-[calc(var(--spacing)*2+1lh+1px)]"
    )
    // No room around its controls, which are borderless instead.
    expect(band().className).not.toMatch(/py-/)
    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toHaveAttribute("data-variant", "filled")
    expect(field().closest('[data-slot="number-field-group"]')).toHaveAttribute(
      "data-variant",
      "filled"
    )
    for (const name of [
      "First page",
      "Previous page",
      "Next page",
      "Last page",
    ])
      expect(button(name)).toHaveAttribute("data-size", "icon-xs")
    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toHaveAttribute("data-size", "sm")
    expect(field().closest('[data-slot="number-field-group"]')).toHaveAttribute(
      "data-size",
      "sm"
    )
  })

  it("keeps a full page's height on the last page, short of rows", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.querySelectorAll("tbody tr").length * 40
      }
    )
    render(<Wells defaultPageSize={10} />)
    const frame = document.querySelector<HTMLElement>(
      '[data-slot="data-table-content"]'
    )!
    expect(frame.style.minHeight).toBe("")
    fireEvent.click(button("Last page"))
    expect(names()).toEqual(ids(21, 23))
    expect(frame.style.minHeight).toBe("400px")
    fireEvent.click(button("First page"))
    expect(frame.style.minHeight).toBe("")
    // Another page size: measured again on a full page.
    render(<Wells defaultPageSize={20} defaultPage={2} />)
    const other = document.querySelectorAll<HTMLElement>(
      '[data-slot="data-table-content"]'
    )[1]
    expect(other.style.minHeight).toBe("")
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
