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
          item.matches("[data-ellipsis]")
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

  describe("ellipses", () => {
    const many = Array.from({ length: 240 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `M ${i}`,
    }))
    /** The pages and ellipses of a row ("wide" or "narrow"), in order. */
    const row = (which: "wide" | "narrow") =>
      [
        ...document.querySelectorAll<HTMLElement>(
          `[data-slot="pagination-item"]:not([data-${which === "wide" ? "narrow" : "wide"}]) > :is([aria-label^="Page "], [data-ellipsis])`
        ),
      ].map((item) =>
        item.dataset.ellipsis === "previous"
          ? "«"
          : item.dataset.ellipsis === "next"
            ? "»"
            : item.textContent
      )
    /** An ellipsis of the wide row, or of the narrow one. */
    const ellipsis = (
      direction: "previous" | "next",
      which: "wide" | "narrow" = "wide"
    ) =>
      document.querySelector<HTMLElement>(
        `[data-slot="pagination-item"]${which === "wide" ? ":not([data-narrow])" : "[data-narrow]"} [data-ellipsis="${direction}"]`
      )!
    /** The page picker's field, once it is open. */
    const field = () => screen.findByRole("textbox", { name: "Go to page" })
    const picker = () =>
      document.querySelector('[data-slot="data-table-page-picker"]')

    it("keep the same number of slots in each row on every page", () => {
      render(<Wells items={many} />)
      expect(row("wide")).toEqual(["1", "2", "3", "4", "5", "»", "24"])
      expect(row("narrow")).toEqual(["1", "2", "3", "4", "»"])
      for (let page = 1; page <= 24; page++) {
        fireEvent.click(screen.getByRole("button", { name: `Page ${page}` }))
        expect(row("wide")).toHaveLength(7)
        expect(row("narrow")).toHaveLength(5)
        expect(row("narrow")).toContain(String(page))
      }
      expect(row("narrow")).toEqual(["«", "21", "22", "23", "24"])
      fireEvent.click(button("Page 21"))
      fireEvent.click(button("Page 20"))
      expect(row("wide")).toEqual(["1", "«", "19", "20", "21", "»", "24"])
      expect(row("narrow")).toEqual(["«", "19", "20", "21", "»"])
    })

    it("show every page when they fit in the slots", () => {
      render(<Wells items={many.slice(0, 40)} />)
      expect(row("wide")).toEqual(["1", "2", "3", "4"])
      expect(row("narrow")).toEqual(["1", "2", "3", "4"])
      expect(document.querySelector("[data-ellipsis]")).toBeNull()
    })

    it("show their dots, named Go to page, also in a tooltip", async () => {
      const user = userEvent.setup()
      render(<Wells items={many} defaultPage={10} />)
      for (const direction of ["previous", "next"] as const) {
        expect(ellipsis(direction)).toHaveAccessibleName("Go to page")
        // The dots alone: no double arrow.
        expect(ellipsis(direction).querySelectorAll("svg")).toHaveLength(1)
      }
      await user.hover(ellipsis("next"))
      expect(
        await screen.findByText("Go to page", {}, { timeout: 3000 })
      ).toBeInTheDocument()
    })

    it("open the page picker, empty and focused, from each ellipsis", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(
        <Wells items={many} defaultPage={10} onPageChange={onPageChange} />
      )
      for (const [direction, which] of [
        ["previous", "wide"],
        ["next", "wide"],
        ["previous", "narrow"],
        ["next", "narrow"],
      ] as const) {
        const trigger = ellipsis(direction, which)
        await user.click(trigger)
        const input = await field()
        await waitFor(() => expect(input).toHaveFocus())
        expect(input).toHaveValue("")
        expect(input).toHaveAttribute("placeholder", "1–24")
        expect(input).toHaveAttribute("inputmode", "numeric")
        expect(trigger).toHaveAttribute("aria-expanded", "true")
        expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument()
        await user.keyboard("{Escape}")
        await waitFor(() => expect(picker()).toBeNull())
        expect(trigger).toHaveAttribute("aria-expanded", "false")
      }
      // Opening it changes nothing.
      expect(info()).toBe("Page 10 of 24")
      expect(onPageChange).not.toHaveBeenCalled()
    })

    it("go to the page typed on Enter, focusing it", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} onPageChange={onPageChange} />)
      await user.click(ellipsis("next"))
      await user.type(await field(), "17{Enter}")
      expect(info()).toBe("Page 17 of 24")
      expect(onPageChange).toHaveBeenCalledTimes(1)
      expect(onPageChange).toHaveBeenLastCalledWith(
        17,
        expect.objectContaining({ reason: "page" })
      )
      await waitFor(() => expect(picker()).toBeNull())
      await waitFor(() => expect(button("Page 17")).toHaveFocus())
    })

    it("go to the page typed with Go, focusing it where its ellipsis went", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} onPageChange={onPageChange} />)
      await user.click(ellipsis("next"))
      await user.type(await field(), "24")
      await user.click(screen.getByRole("button", { name: "Go" }))
      expect(info()).toBe("Page 24 of 24")
      expect(onPageChange).toHaveBeenLastCalledWith(
        24,
        expect.objectContaining({ reason: "page" })
      )
      // The last pages are in view: the ellipsis it opened from is gone.
      expect(row("wide")).toEqual(["1", "«", "20", "21", "22", "23", "24"])
      await waitFor(() => expect(picker()).toBeNull())
      await waitFor(() => expect(button("Page 24")).toHaveFocus())
    })

    it("refuse an empty field, 0 and a page past the last, with the field's error", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} onPageChange={onPageChange} />)
      await user.click(ellipsis("next"))
      const input = await field()
      // Not invalid before a page is asked for.
      expect(input).not.toHaveAttribute("aria-invalid")
      expect(screen.queryByRole("alert")).toBeNull()
      for (const text of ["", "0", "25", "240"]) {
        await user.clear(input)
        await user.type(input, `${text}{Enter}`)
        expect(input).toHaveAttribute("aria-invalid", "true")
        const error = screen.getByRole("alert")
        expect(error).toHaveTextContent("Enter a page from 1 to 24")
        expect(input).toHaveAccessibleDescription("Enter a page from 1 to 24")
        expect(input.closest('[data-slot="field"]')).toHaveAttribute(
          "data-invalid",
          "true"
        )
      }
      // Still open, on the same page, focus in the field.
      expect(picker()).not.toBeNull()
      expect(input).toHaveFocus()
      expect(info()).toBe("Page 1 of 24")
      expect(onPageChange).not.toHaveBeenCalled()
      // A page there is clears the error as it is typed.
      await user.clear(input)
      await user.type(input, "8")
      expect(input).not.toHaveAttribute("aria-invalid")
      expect(screen.queryByRole("alert")).toBeNull()
      await user.keyboard("{Enter}")
      expect(info()).toBe("Page 8 of 24")
    })

    it("take whole numbers only, the arrows kept within the pages", async () => {
      const user = userEvent.setup()
      render(<Wells items={many} defaultPage={10} />)
      await user.click(ellipsis("next"))
      const input = await field()
      // Digits only: no sign, no decimals, no letters.
      await user.type(input, "-1.5e")
      expect(input).toHaveValue("15")
      // Other digits are digits too (fullwidth, Arabic-Indic).
      await user.clear(input)
      await user.type(input, "１٢")
      expect(input).toHaveValue("12")
      // The arrows step from the current page when empty, within 1 to 24.
      await user.clear(input)
      await user.keyboard("{ArrowUp}")
      expect(input).toHaveValue("11")
      await user.keyboard("{ArrowDown}{ArrowDown}")
      expect(input).toHaveValue("9")
      await user.clear(input)
      await user.type(input, "300")
      await user.keyboard("{ArrowDown}")
      expect(input).toHaveValue("24")
      await user.keyboard("{ArrowUp}")
      expect(input).toHaveValue("24")
      await user.clear(input)
      await user.type(input, "1")
      await user.keyboard("{ArrowDown}")
      expect(input).toHaveValue("1")
    })

    it("give focus back to the ellipsis on Escape, changing nothing", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(
        <Wells items={many} defaultPage={10} onPageChange={onPageChange} />
      )
      await user.click(ellipsis("previous"))
      await user.type(await field(), "3")
      await user.keyboard("{Escape}")
      await waitFor(() => expect(picker()).toBeNull())
      await waitFor(() => expect(ellipsis("previous")).toHaveFocus())
      expect(info()).toBe("Page 10 of 24")
      expect(onPageChange).not.toHaveBeenCalled()
      // It opens empty again.
      await user.click(ellipsis("previous"))
      expect(await field()).toHaveValue("")
    })
  })

  describe('"Page 3 of 5"', () => {
    const many = Array.from({ length: 240 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `M ${i}`,
    }))
    const pageOf = () =>
      document
        .querySelector('[data-slot="data-table-page-of"]')!
        .closest("button")!

    it("is a ghost button that opens the page picker, and goes to the page typed", async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Wells items={many} defaultPage={5} onPageChange={onPageChange} />)
      expect(pageOf()).toHaveAccessibleName("Page 5 of 24")
      expect(pageOf()).toHaveAttribute("data-variant", "ghost")
      // Its text keeps the width of its widest.
      expect(
        document.querySelector('[data-slot="data-table-page-of"]')
      ).toHaveAttribute("data-widest", "Page 24 of 24")
      await user.click(pageOf())
      const input = await screen.findByRole("textbox", { name: "Go to page" })
      await waitFor(() => expect(input).toHaveFocus())
      expect(pageOf()).toHaveAttribute("aria-expanded", "true")
      await user.type(input, "20{Enter}")
      expect(onPageChange).toHaveBeenLastCalledWith(
        20,
        expect.objectContaining({ reason: "page" })
      )
      expect(pageOf()).toHaveAccessibleName("Page 20 of 24")
      // Back to it: the page buttons are not there at its width.
      await waitFor(() => expect(pageOf()).toHaveFocus())
    })

    it("gives focus back on Escape", async () => {
      const user = userEvent.setup()
      render(<Wells items={many} defaultPage={5} />)
      await user.click(pageOf())
      await screen.findByRole("textbox", { name: "Go to page" })
      await user.keyboard("{Escape}")
      await waitFor(() => expect(pageOf()).toHaveFocus())
      expect(pageOf()).toHaveAccessibleName("Page 5 of 24")
    })
  })

  it("keeps the rows shown, and Page 3 of 5, as wide as their widest text", () => {
    render(<Wells defaultPageSize={5} />)
    expect(
      document.querySelector('[data-slot="data-table-row-range"]')
    ).toHaveAttribute("data-widest", "23–23 of 23")
    expect(
      document.querySelector('[data-slot="data-table-page-of"]')
    ).toHaveAttribute("data-widest", "Page 5 of 5")
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
    fireEvent.click(button("Page 3"))
    expect(names()).toEqual(ids(21, 23))
    expect(frame.style.minHeight).toBe("400px")
    fireEvent.click(button("Page 1"))
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
