import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { compile } from "tailwindcss"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTableSelectionCount,
  useDataTable,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/tecton/data-table"

import {
  cell,
  columns,
  focusRow,
  layout,
  press,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

function Wells({
  items = WELLS.slice(0, 4),
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

const announcer = () =>
  document.querySelector('[data-slot="announcer"][aria-live="polite"]')
const status = () =>
  screen
    .getByRole("grid")
    .closest('[data-slot="data-table-content"]')
    ?.querySelector(':scope > [role="status"]')
const sortButton = (name: string) =>
  within(screen.getByRole("columnheader", { name })).getByRole("button")

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable selection column", () => {
  it("names the selection column's header with single selection", () => {
    render(<Wells selectionMode="single" />)
    const first = screen.getAllByRole("columnheader")[0]
    expect(first).toHaveTextContent("Select")
    expect(within(first).queryByRole("checkbox")).toBeNull()
  })

  it("disables select all while no row can be selected", () => {
    const { rerender } = render(
      <Wells selectionMode="multiple" isItemDisabled={() => true} />
    )
    expect(
      screen.getByRole("checkbox", { name: "Select All" })
    ).toHaveAttribute("aria-disabled", "true")
    rerender(<Wells selectionMode="multiple" items={[]} />)
    expect(
      screen.getByRole("checkbox", { name: "Select All" })
    ).toHaveAttribute("aria-disabled", "true")
    rerender(<Wells selectionMode="multiple" />)
    expect(
      screen.getByRole("checkbox", { name: "Select All" })
    ).not.toHaveAttribute("aria-disabled")
  })

  it("announces the server's count while all rows match", async () => {
    render(
      <Wells
        dataMode="server"
        selectionMode="multiple"
        rowCount={1240}
        items={WELLS.slice(0, 10)}
      >
        <DataTableFooter>
          <DataTableSelectionCount />
        </DataTableFooter>
      </Wells>
    )
    fireEvent.click(screen.getByRole("checkbox", { name: "Select All" }))
    fireEvent.click(screen.getByRole("button", { name: "Select all 1,240" }))
    focusRow("Well 01")
    press(" ")
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("1239 items selected.")
    )
  })
})

describe("DataTable multi-sort for screen readers", () => {
  it("tells each sorted column's place and direction, and announces additions and clearing", async () => {
    render(<Wells />)
    focusRow("Well 01")
    fireEvent.click(sortButton("Field"))
    expect(sortButton("Field")).not.toHaveTextContent("in sort order")
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    expect(sortButton("Field")).toHaveTextContent(
      "sorted in ascending order, 1 of 2 in sort order"
    )
    expect(sortButton("Depth (m)")).toHaveTextContent(
      "sorted in ascending order, 2 of 2 in sort order"
    )
    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        "Depth (m) sorted ascending, 2 of 2"
      )
    )
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        "Depth (m) sorted descending, 2 of 2"
      )
    )
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Depth (m) no longer sorted")
    )
    // The place number sits on the arrow and is hidden: the button keeps
    // its width.
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    const place = sortButton("Depth (m)").querySelector(
      '[data-slot="data-table-sort-position"]'
    )
    expect(place).toHaveAttribute("aria-hidden", "true")
    expect(place).toHaveClass("absolute")
  })
})

describe("DataTable status", () => {
  it("reads loading, then the rows loaded, then no results, in one region", () => {
    const { rerender } = render(<Wells filterable />)
    const region = status()
    expect(region).toHaveTextContent("")
    rerender(<Wells filterable loading />)
    expect(status()).toBe(region)
    expect(region).toHaveTextContent("Loading")
    rerender(<Wells filterable />)
    expect(region).toHaveTextContent("Showing 4 rows")
    rerender(<Wells filterable view={noMatch} />)
    expect(status()).toBe(region)
    expect(region).toHaveTextContent("No results")
  })
})

describe("DataTable status with an error", () => {
  it("says nothing beside the error's alert", () => {
    const { rerender } = render(<Wells />)
    rerender(<Wells loading />)
    rerender(<Wells error />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(status()).toHaveTextContent("")
  })
})

describe("DataTable cancelled sort", () => {
  it("announces nothing for a sort onViewChange cancels", async () => {
    // Announcements of earlier tests land 100 ms after they are made.
    await new Promise((resolve) => setTimeout(resolve, 150))
    announcer()?.replaceChildren()
    render(
      <Wells
        defaultView={{ sorting: [{ column: "field", direction: "ascending" }] }}
        onViewChange={(_view, details) => details.cancel()}
      />
    )
    focusRow("Well 01")
    // Would join the sort second, and be announced, if it applied.
    fireEvent.click(sortButton("Depth (m)"), { shiftKey: true })
    expect(sortButton("Depth (m)")).not.toHaveTextContent("in sort order")
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(announcer()?.textContent ?? "").not.toMatch(/sorted|no longer/)
  })
})

const noMatch: DataTableView = {
  sorting: [],
  search: "nothing like this",
  filters: {},
  grouping: [],
  columns: {
    order: [],
    hidden: [],
    widths: {},
    pinned: { start: [], end: [] },
  },
}

describe("DataTable row counts", () => {
  it("gives a paged table every page's row count, and each row its place", () => {
    render(
      <Wells items={WELLS} pagination defaultPageSize={5} defaultPage={2} />
    )
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "24")
    expect(row("Well 06")).toHaveAttribute("aria-rowindex", "7")
    expect(row("Well 10")).toHaveAttribute("aria-rowindex", "11")
  })

  it("counts the server's rows in a virtualized table", () => {
    layout()
    render(
      <div style={{ height: 400 }}>
        <DataTable
          items={WELLS}
          columns={columns}
          dataMode="server"
          rowCount={5000}
        >
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "5001")
    expect(row("Well 01")).toHaveAttribute("aria-rowindex", "2")
  })
})

describe("DataTable change details", () => {
  it("gives a keyboard expand its event", () => {
    type Node = { id: string; name: string; children?: Array<Node> }
    const tree = createColumns<Node>([{ id: "name", header: "Name" }])
    const onExpandedChange = vi.fn()
    render(
      <DataTable
        items={
          [
            { id: "a", name: "Gullfaks", children: [{ id: "b", name: "A" }] },
          ] as Array<Node>
        }
        columns={tree}
        itemToChildren={(node) => node.children}
        onExpandedChange={onExpandedChange}
      >
        <DataTableContent aria-label="Assets" />
      </DataTable>
    )
    focusRow("Gullfaks")
    press("ArrowRight")
    const [, details] = onExpandedChange.mock.lastCall as [
      Array<string>,
      { reason: string; event: Event | undefined },
    ]
    expect(details.reason).toBe("keyboard")
    expect(details.event).toBeInstanceOf(KeyboardEvent)
  })

  it("does not report a view that is the same after reconciling", () => {
    const onViewChange = vi.fn()
    let api: ReturnType<typeof useDataTable> | undefined
    function Probe() {
      api = useDataTable()
      return null
    }
    render(
      <Wells onViewChange={onViewChange}>
        <Probe />
      </Wells>
    )
    act(() => api?.setView(JSON.parse(JSON.stringify(api.view))))
    act(() => api?.setSorting([{ column: "unknown", direction: "ascending" }]))
    expect(onViewChange).not.toHaveBeenCalled()
  })

  it('reports clearing filters as "filter", and the search alone as "search"', () => {
    const onViewChange = vi.fn()
    let api: ReturnType<typeof useDataTable> | undefined
    function Probe() {
      api = useDataTable()
      return null
    }
    render(
      <Wells filterable onViewChange={onViewChange}>
        <Probe />
      </Wells>
    )
    act(() => {
      api?.setSearch("Well")
      api?.setFilter("field", { type: "text", value: "Gull" })
    })
    act(() => api?.clearFilters())
    expect(onViewChange.mock.lastCall?.[1].reason).toBe("filter")
    act(() => api?.setSearch("Well"))
    act(() => api?.clearFilters())
    expect(onViewChange.mock.lastCall?.[1].reason).toBe("search")
  })
})

describe("DataTable inline columns", () => {
  it("warns once when the columns are new on every render but the same", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    function Inline({ tick }: { tick: number }) {
      const inline = createColumns<Well>([
        { id: "name", header: "Well" },
        { id: "field", header: "Field" },
      ])
      return (
        <DataTable items={WELLS.slice(0, 2)} columns={inline} data-tick={tick}>
          <DataTableContent aria-label="Wells" />
        </DataTable>
      )
    }
    const { rerender } = render(<Inline tick={0} />)
    rerender(<Inline tick={1} />)
    rerender(<Inline tick={2} />)
    const messages = warn.mock.calls.filter(([message]) =>
      String(message).includes("`columns` is a new object")
    )
    expect(messages).toHaveLength(1)
    expect(cell("Well 01")).toBeInTheDocument()
  })
})

describe("DataTable layout", () => {
  /** The table's own utilities, compiled, so jsdom's cascade applies them. */
  async function applyStyles() {
    const classes = new Set<string>()
    for (const element of document.body.querySelectorAll("*"))
      for (const name of element.classList) classes.add(name)
    const compiler = await compile(
      `@theme inline { --spacing: 4px; }\n@tailwind utilities;`
    )
    const style = document.createElement("style")
    style.dataset.testid = "tailwind"
    style.textContent = compiler.build([...classes])
    document.head.append(style)
    return () => style.remove()
  }
  const frame = () =>
    document.querySelector<HTMLElement>('[data-slot="data-table-content"]')!

  it("keeps a virtualized content's own height in a root of any height", async () => {
    layout()
    render(
      <DataTable items={WELLS} columns={columns}>
        <DataTableContent aria-label="Wells" virtualized className="h-96" />
      </DataTable>
    )
    const remove = await applyStyles()
    const style = getComputedStyle(frame())
    expect(style.height.replace(/^calc\((.*)\)$/, "$1")).toMatch(
      /^(384px|4px \* 96)$/
    )
    expect(frame()).toHaveClass("h-96", "flex-auto", "min-h-0")
    expect(frame()).not.toHaveClass("flex-1")
    // `flex: 1 1 auto`: the height is the basis, not overridden by a 0%.
    expect(style.flexBasis).toBe("auto")
    expect(style.minHeight).toBe("0px")
    remove()
  })

  it("fills a root of bounded height with a virtualized content", async () => {
    layout()
    render(
      <DataTable items={WELLS} columns={columns} className="h-96">
        <DataTableContent aria-label="Wells" virtualized />
      </DataTable>
    )
    const remove = await applyStyles()
    const root = document.querySelector<HTMLElement>(
      '[data-slot="data-table"]'
    )!
    expect(getComputedStyle(root).display).toBe("flex")
    expect(getComputedStyle(root).flexDirection).toBe("column")
    const style = getComputedStyle(frame())
    // Grows into the root and shrinks below its rows' height.
    expect(style.flexGrow).toBe("1")
    expect(style.flexShrink).toBe("1")
    expect(style.minHeight).toBe("0px")
    remove()
  })

  it("draws every header label at the header's own size", () => {
    const custom = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", sortable: false },
    ])
    const { rerender } = render(
      <DataTable items={WELLS.slice(0, 2)} columns={custom}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    // `default` is `text-sm`, as a plain header; `xs` is `text-xs`, as a
    // small table's header.
    expect(sortButton("Well")).toHaveAttribute("data-size", "default")
    expect(sortButton("Well")).not.toHaveClass("text-xs")
    rerender(
      <DataTable items={WELLS.slice(0, 2)} columns={custom} size="sm">
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(sortButton("Well")).toHaveAttribute("data-size", "xs")
    expect(sortButton("Well")).toHaveClass("text-xs")
  })

  it("shows the row header's link as a link without a hover", () => {
    render(<Wells itemToHref={(well) => `/wells/${well.id}`} />)
    expect(screen.getByRole("link", { name: "Well 01" })).toHaveClass(
      "text-link-foreground",
      "underline"
    )
  })
})

describe("DataTable controlled partial view", () => {
  it("takes part of a view, keeps one reconciled view for it, and reports the whole view", () => {
    const onViewChange = vi.fn()
    const views: Array<DataTableView> = []
    let renders = 0
    function Probe() {
      renders++
      views.push(useDataTable().view)
      return null
    }
    function Owner({ tick }: { tick: number }) {
      return (
        <Wells
          data-tick={tick}
          view={{ sorting: [{ column: "depth", direction: "descending" }] }}
          onViewChange={onViewChange}
        >
          <Probe />
        </Wells>
      )
    }
    const { rerender } = render(<Owner tick={0} />)
    const depths = WELLS.slice(0, 4)
      .map((well) => well.depth!)
      .sort((a, b) => b - a)
    expect(
      [...document.querySelectorAll("tbody tr")].map((tr) =>
        Number(tr.querySelectorAll("td")[2].textContent.replace(/,/g, ""))
      )
    ).toEqual(depths)
    const first = views[0]
    const before = renders
    rerender(<Owner tick={1} />)
    rerender(<Owner tick={2} />)
    // The same reconciled view for the same partial one; no loop.
    expect(views.every((view) => view === first)).toBe(true)
    expect(renders - before).toBeLessThan(10)
    expect(onViewChange).not.toHaveBeenCalled()
    fireEvent.click(sortButton("Well"))
    const [reported] = onViewChange.mock.lastCall as [DataTableView]
    expect(reported.sorting).toEqual([
      { column: "name", direction: "ascending" },
    ])
    expect(reported.columns.order).toHaveLength(6)
  })
})
