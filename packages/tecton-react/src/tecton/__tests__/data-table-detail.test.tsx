import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { renderToString } from "react-dom/server"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"

import { DropdownMenuItem } from "@tecton/react/dropdown-menu"
import { Table, TableBody, TableCell, TableRow } from "@tecton/react/table"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableRowActions,
  type DataTableContentProps,
  type DataTableProps,
} from "@tecton/react/data-table"
import { TectonProvider } from "@tecton/react/provider"

import {
  columns,
  focused,
  focusRow,
  press,
  row,
  scrollable,
  WELLS,
  type Well,
} from "./data-table-fixtures"

/** A well's detail: a table of its own, and a button. */
function Detail({ well }: { well: Well }) {
  return (
    <div>
      <Table aria-label={`Logs of ${well.name}`}>
        <TableBody>
          <TableRow>
            <TableCell>Gamma ray</TableCell>
            <TableCell>{well.depth}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <button type="button">Open {well.name}</button>
    </div>
  )
}

const renderDetail = (well: Well) => <Detail well={well} />

function Wells({
  items = WELLS.slice(0, 4),
  contentProps,
  ...props
}: Partial<DataTableProps<Well>> & {
  contentProps?: Partial<DataTableContentProps<Well>>
}) {
  return (
    <DataTable items={items} columns={columns} {...props}>
      <DataTableContent
        aria-label="Wells"
        renderDetail={renderDetail}
        {...contentProps}
      />
    </DataTable>
  )
}

const detailRows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('tr[aria-level="2"]'))

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTableContent renderDetail", () => {
  it("makes the table a treegrid whose rows open to their detail row, across every column", async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    render(
      <Wells selectionMode="multiple" onExpandedChange={onExpandedChange} />
    )
    expect(screen.getByRole("treegrid", { name: "Wells" })).toBeInTheDocument()
    expect(row("Well 01")).toHaveAttribute("aria-level", "1")
    expect(row("Well 01")).toHaveAttribute("aria-expanded", "false")
    expect(detailRows()).toHaveLength(0)
    // The chevron, for the pointer: hidden from screen readers, never a stop.
    const chevron = row("Well 01").querySelector<HTMLElement>(
      '[data-slot="data-table-chevron"]'
    )!
    expect(chevron).toHaveAttribute("aria-hidden", "true")
    await user.click(chevron)
    expect(onExpandedChange).toHaveBeenCalledWith(
      ["w1"],
      expect.objectContaining({ reason: "item-press" })
    )
    expect(row("Well 01")).toHaveAttribute("aria-expanded", "true")
    const [detail] = detailRows()
    expect(detail).toHaveAttribute("aria-posinset", "1")
    expect(detail).toHaveAttribute("aria-setsize", "1")
    // Every column, the selection column included.
    expect(detail.querySelector("td")).toHaveAttribute("colspan", "7")
    expect(
      within(detail).getByRole("table", { name: "Logs of Well 01" })
    ).toBeInTheDocument()
    expect(chevron).not.toHaveFocus()
  })

  it("opens and closes with Right / Left and Enter, and moves through the detail row with the arrows", () => {
    render(<Wells />)
    focusRow("Well 02")
    press("ArrowRight")
    expect(row("Well 02")).toHaveAttribute("aria-expanded", "true")
    press("ArrowDown")
    const [detail] = detailRows()
    expect(focused()).toBe(detail)
    // Into the detail's cell: its first control of its own; a nested
    // table's are its own.
    press("ArrowRight")
    expect(focused()).toBe(screen.getByRole("button", { name: "Open Well 02" }))
    press("ArrowLeft")
    expect(focused()).toBe(detail)
    // Left on the detail row: its row.
    press("ArrowLeft")
    expect(focused()).toBe(row("Well 02"))
    press("ArrowLeft")
    expect(row("Well 02")).toHaveAttribute("aria-expanded", "false")
    press("Enter")
    expect(row("Well 02")).toHaveAttribute("aria-expanded", "true")
  })

  it("puts focus back on its row when the detail row closes with focus in it", () => {
    const { rerender } = render(<Wells expanded={["w2"]} />)
    act(() => screen.getByRole("button", { name: "Open Well 02" }).focus())
    rerender(<Wells expanded={[]} />)
    expect(focused()).toBe(row("Well 02"))
  })

  it("does not pass the table's grid to a table inside a detail row", () => {
    render(<Wells defaultExpanded={["w1"]} />)
    const nested = screen.getByRole("table", { name: "Logs of Well 01" })
    expect(nested).not.toHaveAttribute("role", "grid")
    const nestedRow = nested.querySelector("tr")!
    expect(nestedRow).not.toHaveAttribute("aria-selected")
    expect(nestedRow).not.toHaveAttribute("aria-level")
    expect(nestedRow).not.toHaveAttribute("tabindex")
  })

  it("keeps the stripes of the rows after an open detail row", () => {
    render(<Wells striped defaultExpanded={["w1"]} />)
    const body = document.querySelector("tbody")!
    const parity = (element: Element) => [...body.children].indexOf(element) % 2
    // Well 01, a hidden row, its detail, then Well 02 where it was.
    expect(parity(row("Well 02"))).toBe(1)
    expect(parity(row("Well 03"))).toBe(0)
    expect(body.querySelector("tr[hidden]")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("renders only the detail rows again for a new renderDetail", () => {
    const first = vi.fn((well: Well) => well.name)
    const second = vi.fn((well: Well) => `${well.name} again`)
    const { rerender } = render(
      <Wells defaultExpanded={["w1"]} contentProps={{ renderDetail: first }} />
    )
    expect(first).toHaveBeenCalledTimes(1)
    rerender(
      <Wells defaultExpanded={["w1"]} contentProps={{ renderDetail: second }} />
    )
    expect(second).toHaveBeenCalledTimes(1)
    expect(detailRows()[0]).toHaveTextContent("Well 01 again")
  })

  it("renders open detail rows and the chevrons on the server, in the first render", () => {
    const html = renderToString(<Wells defaultExpanded={["w2"]} />)
    expect(html).toContain('role="treegrid"')
    expect(html).toContain('data-slot="data-table-chevron"')
    expect(html).toContain('aria-level="2"')
    expect(html).toContain("Logs of Well 02")
  })

  it("puts focus back on its row when a table inside its detail row loses the focused element", () => {
    function Nested({ well }: { well: Well }) {
      return (
        <Table aria-label={`Logs of ${well.name}`}>
          <TableBody>
            <TableRow>
              <TableCell>
                <button type="button">Log of {well.name}</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }
    const nested = (well: Well) => <Nested well={well} />
    const { rerender } = render(
      <Wells expanded={["w2"]} contentProps={{ renderDetail: nested }} />
    )
    act(() => screen.getByRole("button", { name: "Log of Well 02" }).focus())
    rerender(<Wells expanded={[]} contentProps={{ renderDetail: nested }} />)
    expect(focused()).toBe(row("Well 02"))
  })

  it("focuses the row whose chevron is pressed, which becomes the tab stop", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    await user.click(
      row("Well 03").querySelector<HTMLElement>(
        '[data-slot="data-table-chevron"]'
      )!
    )
    expect(focused()).toBe(row("Well 03"))
    expect(row("Well 03")).toHaveAttribute("tabindex", "0")
    expect(row("Well 03")).toHaveAttribute("aria-expanded", "true")
  })

  it("keeps the controls of a plain table inside a detail row out of the Tab order until focus is in its row", async () => {
    const user = userEvent.setup()
    const logs = (well: Well) => (
      <Table aria-label={`Logs of ${well.name}`}>
        <TableBody>
          <TableRow>
            <TableCell>
              <button type="button">Log of {well.name}</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    render(
      <>
        <button type="button">Before</button>
        <Wells defaultExpanded={["w1"]} contentProps={{ renderDetail: logs }} />
        <button type="button">After</button>
      </>
    )
    const log = screen.getByRole("button", { name: "Log of Well 01" })
    await waitFor(() => expect(log).toHaveAttribute("tabindex", "-1"))
    // In and out of the table: one stop, the nested button passed over.
    act(() => screen.getByRole("button", { name: "Before" }).focus())
    await user.tab()
    expect(focused().closest('[role="treegrid"]')).not.toBeNull()
    await user.tab()
    expect(focused()).toBe(screen.getByRole("button", { name: "After" }))
    // Down to the detail row: Tab reaches the button, then leaves.
    focusRow("Well 01")
    press("ArrowDown")
    expect(focused()).toBe(detailRows()[0])
    await waitFor(() => expect(log).not.toHaveAttribute("tabindex", "-1"))
    await user.tab()
    expect(focused()).toBe(log)
    await user.tab()
    expect(focused()).toBe(screen.getByRole("button", { name: "After" }))
    await waitFor(() => expect(log).toHaveAttribute("tabindex", "-1"))
  })

  it("keeps a grid inside a detail row out of the Tab order until focus is in its row", async () => {
    const user = userEvent.setup()
    const inner = (well: Well) => (
      <DataTable items={WELLS.slice(4, 6)} columns={columns}>
        <DataTableContent aria-label={`Offsets of ${well.name}`} />
      </DataTable>
    )
    render(
      <>
        <button type="button">Before</button>
        <Wells
          defaultExpanded={["w1"]}
          contentProps={{ renderDetail: inner }}
        />
        <button type="button">After</button>
      </>
    )
    const nested = screen.getByRole("grid", { name: "Offsets of Well 01" })
    const stops = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[tabindex="0"]'))
    // One stop for the outer table, none inside it.
    await waitFor(() =>
      expect(stops().filter((stop) => nested.contains(stop))).toHaveLength(0)
    )
    act(() => screen.getByRole("button", { name: "Before" }).focus())
    await user.tab()
    expect(focused().closest('[role="treegrid"]')).not.toBeNull()
    expect(nested.contains(focused())).toBe(false)
    await user.tab()
    expect(focused()).toBe(screen.getByRole("button", { name: "After" }))
    // Down to the detail row: Tab then enters the grid inside it.
    focusRow("Well 01")
    press("ArrowDown")
    await waitFor(() =>
      expect(stops().filter((stop) => nested.contains(stop))).toHaveLength(1)
    )
    await user.tab()
    expect(nested.contains(focused())).toBe(true)
    // Tab leaves both.
    await user.tab()
    expect(focused()).toBe(screen.getByRole("button", { name: "After" }))
  })

  it("keeps the rows in view where they are when a detail row above is measured", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
    const original = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const box = (top: number, height: number) =>
          ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON() {},
          }) as DOMRect
        const index = (this as HTMLElement).dataset.index
        if (this.tagName === "THEAD" || this.tagName === "TABLE")
          return box(0, 40)
        if (this.tagName === "TH" && !this.closest("tbody")) return box(0, 40)
        if (this.tagName === "TR" && index !== undefined)
          return box(
            40 + Number(index) * 40,
            this.hasAttribute("data-variable-height") ? 200 : 40
          )
        return original.call(this)
      }
    )
    const items = Array.from({ length: 200 }, (_, i) => ({
      ...WELLS[0],
      id: `w${i}`,
      name: `Well ${i}`,
    }))
    const view = (expanded: Array<string>) => (
      <div style={{ height: 400 }}>
        <Wells
          items={items}
          expanded={expanded}
          contentProps={{ virtualized: true }}
        />
      </div>
    )
    const { rerender } = render(view([]))
    scrollable()
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    const scrollTo = (top: number) =>
      act(() => {
        container.scrollTop = top
        fireEvent.scroll(container)
      })
    // Far down, a row near the top opens: its detail row (index 6) is not
    // rendered. Then up until it renders above the view and is measured
    // at 200 px, 160 more than counted: the scroll moves as much, the rows
    // in view stay.
    scrollTo(4000)
    rerender(view(["w5"]))
    expect(detailRows()).toHaveLength(0)
    let top = 1600
    while (detailRows().length === 0 && top > 0) {
      top -= 40
      scrollTo(top)
    }
    expect(detailRows()).toHaveLength(1)
    expect(container.scrollTop).toBe(top + 160)
  })

  it("takes the item as the table's own type, written as `(well: Well) =>`", () => {
    type RenderDetail = NonNullable<DataTableContentProps<Well>["renderDetail"]>
    expectTypeOf<Parameters<RenderDetail>[0]>().toEqualTypeOf<Well>()
    expectTypeOf<ReturnType<RenderDetail>>().toEqualTypeOf<React.ReactNode>()
    // Without naming the type on the content: the item as the function has it.
    const plain = (
      <DataTableContent
        aria-label="Wells"
        renderDetail={(well: Well) => well.name}
      />
    )
    // Named: an item of another shape is refused.
    const named = (
      <DataTableContent<Well>
        aria-label="Wells"
        // @ts-expect-error -- not a well
        renderDetail={(other: { code: number }) => other.code}
      />
    )
    expect([plain, named]).toHaveLength(2)
  })

  it("is off in a tree, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells itemToChildren={() => undefined} />)
    expect(
      row("Well 01").querySelector('[data-slot="data-table-chevron"]')
    ).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      "DataTableContent: `renderDetail` is off in a tree (`itemToChildren`): a tree's rows open to show their children."
    )
  })

  it("keeps watching a virtualized table's detail rows after its effects run again", () => {
    // The elements each observer watches, until it is disconnected.
    const watched = new Set<Element>()
    const saved = globalThis.ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      class {
        targets = new Set<Element>()
        observe(target: Element) {
          this.targets.add(target)
          watched.add(target)
        }
        unobserve(target: Element) {
          this.targets.delete(target)
          watched.delete(target)
        }
        disconnect() {
          for (const target of this.targets) watched.delete(target)
          this.targets.clear()
        }
        takeRecords() {
          return []
        }
      }
    )
    try {
      // Strict mode runs every effect's cleanup and the effect again.
      render(
        <React.StrictMode>
          <div style={{ height: 400 }}>
            <Wells
              defaultExpanded={["w2"]}
              contentProps={{ virtualized: true }}
            />
          </div>
        </React.StrictMode>
      )
      expect(detailRows()).toHaveLength(1)
      expect(watched.has(detailRows()[0])).toBe(true)
    } finally {
      vi.stubGlobal("ResizeObserver", saved)
    }
  })

  it("measures a virtualized table's open detail rows on their own", () => {
    // Rows 40 px tall in a view of 400, but the detail row (index 1): 200.
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
    const original = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const box = (top: number, height: number) =>
          ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON() {},
          }) as DOMRect
        const index = (this as HTMLElement).dataset.index
        if (this.tagName === "THEAD" || this.tagName === "TABLE")
          return box(0, 40)
        if (this.tagName === "TH" && !this.closest("tbody")) return box(0, 40)
        if (this.tagName === "TR" && index !== undefined) {
          const at = Number(index)
          if (at === 1) return box(80, 200)
          return box(at === 0 ? 40 : 280 + (at - 2) * 40, 40)
        }
        return original.call(this)
      }
    )
    const items = Array.from({ length: 200 }, (_, i) => ({
      ...WELLS[0],
      id: `w${i}`,
      name: `Well ${i}`,
    }))
    render(
      <div style={{ height: 400 }}>
        <Wells
          items={items}
          defaultExpanded={["w0"]}
          contentProps={{ virtualized: true }}
        />
      </div>
    )
    expect(detailRows()[0]).toHaveAttribute("aria-rowindex", "3")
    // Scrolled past it: the spacer above the rows in view counts its 200 px.
    scrollable()
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    act(() => {
      container.scrollTop = 2000
      fireEvent.scroll(container)
    })
    const spacer = document.querySelector<HTMLElement>(
      '[data-slot="table-virtual-spacer"] > td'
    )!
    const first = Number(
      document.querySelector<HTMLElement>("tbody tr[data-index]")!.dataset.index
    )
    expect(first).toBeGreaterThan(2)
    expect(Number.parseFloat(spacer.style.height)).toBe(first * 40 + 160)
  })
})

describe("DataTableContent totals", () => {
  const summed = createColumns<Well>([
    { id: "name", header: "Well" },
    { id: "field", header: "Field" },
    { id: "depth", header: "Depth (m)", type: "number" },
    { id: "active", header: "Active", type: "boolean" },
    {
      id: "spud",
      header: "Spud date",
      type: "date",
      aggregate: "max",
      format: { dateStyle: "medium", timeZone: "UTC" },
      renderAggregate: (value) => (
        <span data-testid="latest">
          Latest {value instanceof Date ? value.getUTCFullYear() : ""}
        </span>
      ),
    },
  ])
  const items = WELLS.slice(0, 6)
  const sum = items.reduce((total, well) => total + (well.depth ?? 0), 0)

  it("sums every row the view matches in a footer row named Total", () => {
    render(
      <DataTable
        items={items}
        columns={summed}
        selectionMode="multiple"
        pagination
        defaultPageSize={10}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    const footer = document.querySelector("tfoot")!
    const totals = within(footer).getByRole("row")
    expect(
      within(totals).getByRole("rowheader", { name: "Total" })
    ).toBeInTheDocument()
    const cells = [...totals.querySelectorAll("td")]
    // The selection column, Field, Depth, Active and Spud date.
    expect(cells.map((cell) => cell.textContent)).toEqual([
      "",
      "",
      sum.toLocaleString("en-US"),
      "3",
      "Latest 2020",
    ])
    // Counted after the rows, on every page.
    expect(totals).toHaveAttribute("aria-rowindex", "8")
  })

  it("follows the search and filters, over every page", () => {
    render(
      <DataTable
        items={items}
        columns={summed}
        filterable
        pagination
        defaultPageSize={2}
        defaultView={{
          filters: { active: { type: "boolean", values: [true] } },
        }}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    const actives = items.filter((well) => well.active)
    const cells = [...document.querySelectorAll("tfoot td")]
    expect(cells[1]).toHaveTextContent(
      actives
        .reduce((total, well) => total + (well.depth ?? 0), 0)
        .toLocaleString("en-US")
    )
  })

  it("is reached with the arrow keys down a column", () => {
    render(
      <DataTable items={items.slice(0, 2)} columns={summed}>
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    focusRow("Well 02")
    press("ArrowRight")
    press("ArrowRight")
    press("ArrowRight")
    press("ArrowDown")
    expect(focused().closest("tfoot")).not.toBeNull()
    expect(focused()).toHaveTextContent(
      (items[0].depth! + items[1].depth!).toLocaleString("en-US")
    )
  })

  it("sticks its pinned cells with the others", () => {
    render(
      <DataTable
        items={items}
        columns={summed}
        pinnableColumns
        defaultView={{ columns: { pinned: { start: ["name"] } } }}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    const label = within(document.querySelector("tfoot")!).getByRole(
      "rowheader"
    )
    expect(label.className).toContain("sticky")
    expect(label.closest("tr")!.className).toContain("bg-muted")
  })

  it("leaves out hidden columns and hides a column's cell where the column hides", () => {
    const narrow = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", hideBelow: "md" },
      { id: "depth", header: "Depth (m)", type: "number", hideBelow: "lg" },
      { id: "active", header: "Active", type: "boolean" },
    ])
    render(
      <DataTable
        items={items}
        columns={narrow}
        defaultView={{ columns: { hidden: ["active"] } }}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    const totals = document.querySelector<HTMLElement>("tfoot tr")!
    // Well (the label), Field and Depth: Active is hidden.
    expect(totals.children).toHaveLength(3)
    const depth = totals.children[2] as HTMLElement
    expect(depth).toHaveTextContent(sum.toLocaleString("en-US"))
    // Hidden below a breakpoint as the column's own cells are.
    const body = row("Well 01").children
    expect(totals.children[1].className).toContain("hidden md:table-cell")
    expect(body[1].className).toContain("hidden md:table-cell")
    expect(depth.className).toContain("hidden lg:table-cell")
    expect(body[2].className).toContain("hidden lg:table-cell")
  })

  it("sums a tree's matching leaves, not their parents", () => {
    type Node = Well & { children?: Array<Node> }
    const tree: Array<Node> = [
      {
        ...items[0],
        id: "p1",
        name: "Pad A",
        depth: 99999,
        children: [items[1], items[2]],
      },
      items[3],
      items[4],
    ]
    render(
      <DataTable
        items={tree}
        columns={summed as never}
        itemToChildren={(node: Node) => node.children}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    const leaves = [items[1], items[2], items[3], items[4]]
    expect(document.querySelectorAll("tfoot td")[1]).toHaveTextContent(
      leaves
        .reduce((total, well) => total + (well.depth ?? 0), 0)
        .toLocaleString("en-US")
    )
  })

  it("is translated", async () => {
    render(
      <TectonProvider locale="fr-FR">
        <DataTable items={items} columns={summed}>
          <DataTableContent aria-label="Wells" totals />
        </DataTable>
      </TectonProvider>
    )
    expect(
      await screen.findByRole("rowheader", { name: "Total" })
    ).toBeInTheDocument()
  })
})

describe("DataTableRowActions", () => {
  const onOpen = vi.fn()
  const withActions = createColumns<Well>([
    { id: "name", header: "Well" },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      cell: (well) => (
        <DataTableRowActions>
          <DropdownMenuItem onClick={() => onOpen(well.id)}>
            Open
          </DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ])

  it("opens a menu of the row's actions, without selecting the row", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DataTable
        items={WELLS.slice(0, 2)}
        columns={withActions}
        selectionMode="multiple"
        onValueChange={onValueChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const [first] = screen.getAllByRole("button", { name: "Row actions" })
    await user.click(first)
    await user.click(await screen.findByRole("menuitem", { name: "Open" }))
    expect(onOpen).toHaveBeenCalledWith("w1")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("is a control of its cell: the arrow keys reach it, Enter opens it, focus comes back", async () => {
    render(
      <DataTable items={WELLS.slice(0, 2)} columns={withActions}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    focusRow("Well 01")
    press("ArrowRight")
    press("ArrowRight")
    const trigger = () =>
      within(row("Well 01")).getByRole("button", { name: "Row actions" })
    expect(focused()).toBe(trigger())
    const button = trigger()
    expect(button).toHaveAttribute("aria-haspopup", "menu")
    expect(button).toHaveAttribute("aria-expanded", "false")
    // Enter (a click from the keyboard) opens the menu, its first item
    // active; the button stays the same element, and says it is open.
    fireEvent.click(button, { detail: 0 })
    const menu = await screen.findByRole("menu")
    await vi.waitFor(() =>
      expect(focused()).toBe(
        within(menu).getByRole("menuitem", { name: "Open" })
      )
    )
    expect(trigger()).toBe(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(button).toHaveAttribute("aria-controls", menu.id)
    expect(menu).toHaveAttribute("aria-labelledby", button.id)
    fireEvent.keyDown(focused(), { key: "Escape" })
    await vi.waitFor(() => expect(focused()).toBe(button))
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(button).not.toHaveAttribute("aria-controls")
    // Still one tab stop.
    expect(trigger()).toHaveAttribute("tabindex", "0")
    expect(row("Well 01")).toHaveAttribute("tabindex", "-1")
  })

  it("renders a menu only for the row whose menu is open, by the same button", async () => {
    const user = userEvent.setup()
    render(
      <DataTable items={WELLS.slice(0, 3)} columns={withActions}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const buttons = () => screen.getAllByRole("button", { name: "Row actions" })
    const [, second] = buttons()
    // Long enough for the idle prefetch: the code may be there, no menu.
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(screen.queryByRole("menu")).toBeNull()
    // A pointer going down is no press (it may be let go elsewhere).
    fireEvent.pointerDown(second, { button: 0, pointerId: 1 })
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(screen.queryByRole("menu")).toBeNull()
    await user.click(second)
    expect(await screen.findAllByRole("menu")).toHaveLength(1)
    expect(buttons()[1]).toBe(second)
    expect(second).toHaveAttribute("aria-expanded", "true")
    expect(buttons()[0]).toHaveAttribute("aria-expanded", "false")
    // Opened by a pointer: no item active yet.
    expect(
      document.querySelector('[role="menuitem"][data-highlighted]')
    ).toBeNull()
  })

  it("throws outside a DataTable", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <DataTableRowActions>
          <DropdownMenuItem>Open</DropdownMenuItem>
        </DataTableRowActions>
      )
    ).toThrow("DataTableRowActions must be used inside a DataTable.")
  })
})
