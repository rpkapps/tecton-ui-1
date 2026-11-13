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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableColumnsMenu,
  DataTableContent,
  useDataTable,
  type DataTableColumn,
  type DataTablePartialView,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/data-table"
import { Card } from "@tecton/react/card"
import { Table, TableBody, TableCell, TableRow } from "@tecton/react/table"
import {
  AppShell,
  AppShellAside,
  AppShellHeader,
  AppShellSidebar,
} from "@tecton/react/app-shell"
import { Panel } from "@tecton/react/panel"
import { TectonProvider } from "@tecton/react/provider"

import { DRAG_AND_DROP, loadFeature } from "../internal/data-table/lazy"

type Field = {
  id: string
  name: string
  operator: string
  oil: number
  gas: number
  water: number
  wells: number
}

const FIELDS: Array<Field> = [
  {
    id: "gullfaks",
    name: "Gullfaks",
    operator: "Equinor",
    oil: 5.1,
    gas: 2.3,
    water: 41.2,
    wells: 104,
  },
  {
    id: "valhall",
    name: "Valhall",
    operator: "Aker BP",
    oil: 3.8,
    gas: 0.7,
    water: 9.6,
    wells: 96,
  },
  {
    id: "ekofisk",
    name: "Ekofisk",
    operator: "ConocoPhillips",
    oil: 7.2,
    gas: 1.8,
    water: 18.4,
    wells: 128,
  },
]

/** Counts the rows rendered: each call is a row drawing its Field cell. */
const cellRenders = vi.fn((field: Field) => field.name)

const DEFINITIONS: ReadonlyArray<DataTableColumn<Field>> = [
  {
    id: "name",
    header: "Field",
    description: "The field's name on its licence.",
    cell: cellRenders,
  },
  { id: "operator", header: "Operator" },
  {
    id: "production",
    header: "Production",
    columns: [
      { id: "oil", header: "Oil", type: "number" },
      { id: "gas", header: "Gas", type: "number" },
      { id: "water", header: "Water", type: "number" },
    ],
  },
  { id: "wells", header: "Wells", type: "number" },
]
const columns = createColumns(DEFINITIONS)
/** The same columns, with widths. */
const sized = createColumns<Field>([
  { ...DEFINITIONS[0], width: 140, minWidth: 100 } as DataTableColumn<Field>,
  { id: "operator", header: "Operator", width: 160, resizable: false },
  {
    id: "production",
    header: "Production",
    columns: [
      { id: "oil", header: "Oil", type: "number", width: 90, maxWidth: 200 },
      { id: "gas", header: "Gas", type: "number", width: 90 },
      { id: "water", header: "Water", type: "number", width: 90 },
    ],
  },
  { id: "wells", header: "Wells", type: "number", width: 100 },
])

function Fields({
  children,
  ...props
}: Partial<DataTableProps<Field>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={FIELDS} columns={columns} {...props}>
      {children}
      <DataTableContent aria-label="Fields" />
    </DataTable>
  )
}

const LEAF = 100
const SELECTION = 40

/**
 * jsdom has no layout: header cells are laid out side by side, each leaf
 * column 100 px wide (the selection column 40 px), from the right in RTL.
 * `measured` is the width a column's content measures at.
 */
let rtl = false
let measured = 0
/** Header cells laid out at another width, by name. */
let rendered: Record<string, number> = {}
const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  rtl = false
  measured = 0
  rendered = {}
  cellRenders.mockClear()
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const rect = (left: number, width: number, top = 0, height = 48) =>
      ({
        left,
        right: left + width,
        width,
        top,
        bottom: top + height,
        height,
        x: left,
        y: top,
        toJSON() {},
      }) as DOMRect
    if (this.tagName === "TH" && this.closest("thead")) {
      const name = this.getAttribute("aria-label")
      if (name !== null && name in rendered) return rect(0, rendered[name])
      const table = this.closest("table")!
      // Laid out at its content's width (measuring, fitting).
      if (measured && table.style.width === "max-content")
        return rect(0, measured)
      // Its columns: those it is over in the header (cells spanning rows
      // over their columns in each row).
      const head = this.closest("thead")!
      const first = head.rows[0].cells[0]
      const selection =
        !!first.querySelector('[role="checkbox"]') ||
        first.textContent === "Select"
      const columns = headColumns(head)
      const cell = this as HTMLTableCellElement
      const at = columns.find((row) => row.includes(cell))!.indexOf(cell)
      const widthOf = (column: number) =>
        column === 0 && selection ? SELECTION : LEAF
      let left = 0
      for (let column = 0; column < at; column++) left += widthOf(column)
      let width = 0
      for (let column = at; column < at + cell.colSpan; column++)
        width += widthOf(column)
      return rect(rtl ? 1000 - left - width : left, width)
    }
    if (this.matches('[data-slot="data-table-content"], table'))
      return rect(0, 1000, 0, 400)
    return originalRect.call(this)
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  vi.restoreAllMocks()
})

/**
 * Each header row's cells by column: a cell spanning rows (a column in
 * fewer groups) over its columns in each row it spans.
 */
function headColumns(head: HTMLTableSectionElement) {
  const rows = [...head.rows]
  const grid = rows.map((): Array<HTMLTableCellElement> => [])
  rows.forEach((row, y) => {
    let x = 0
    for (const cell of row.cells) {
      while (grid[y][x]) x++
      for (let dy = 0; dy < Math.max(1, cell.rowSpan); dy++)
        for (let dx = 0; dx < cell.colSpan; dx++)
          if (grid[y + dy]) grid[y + dy][x + dx] = cell
      x += cell.colSpan
    }
  })
  return grid
}
/** A column's own header (`scope=col`), in whichever header row it starts. */
const header = (name: string) =>
  within(document.querySelector<HTMLElement>("thead")!)
    .getAllByRole("columnheader", { name })
    .find((cell) => cell.getAttribute("scope") === "col")!
/** The leaf headers' names, in order. */
const headers = () =>
  headColumns(document.querySelector("thead")!)
    .at(-1)!
    .filter((cell) => cell.getAttribute("scope") === "col")
    .map((cell) => cell.getAttribute("aria-label"))
const cols = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      'colgroup[data-slot="data-table-columns"] > col'
    ),
    (col) => col.style.width
  )
const frame = () =>
  document.querySelector<HTMLElement>('[data-slot="data-table-content"]')!
const container = () =>
  document.querySelector<HTMLElement>('[data-slot="table-container"]')!
const announcer = () =>
  document.querySelector('[data-slot="announcer"][aria-live="polite"]')
const lastView = (onViewChange: ReturnType<typeof vi.fn>) =>
  onViewChange.mock.calls.at(-1) as [
    DataTableView,
    { reason: string; cancel: () => void },
  ]

describe("DataTable column groups", () => {
  it("spans the header rows with the columns in no group, and the arrows walk them in every row", async () => {
    const user = userEvent.setup()
    render(<Fields selectionMode="multiple" sortable={false} />)
    const head = document.querySelector("thead")!
    const [top, leaves] = head.rows
    // No empty cell above a column in no group: it spans both rows, as the
    // selection column does.
    expect(
      [...top.cells].map((cell) => [
        cell.getAttribute("aria-label") ?? cell.textContent,
        cell.rowSpan,
        cell.colSpan,
      ])
    ).toEqual([
      ["", 2, 1],
      ["Field", 2, 1],
      ["Operator", 2, 1],
      ["Production", 1, 3],
      ["Wells", 2, 1],
    ])
    expect(
      [...leaves.cells].map((cell) => cell.getAttribute("aria-label"))
    ).toEqual(["Oil", "Gas", "Water"])
    const active = () => (document.activeElement as HTMLElement).closest("th")!
    const name = () =>
      active().getAttribute("aria-label") ?? active().textContent
    act(() => within(top.cells[0]).getByRole("checkbox").focus())
    // Along the columns' row, through the cells spanning into it.
    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(name()).toBe("Operator")
    await user.keyboard("{ArrowRight}")
    expect(name()).toBe("Oil")
    await user.keyboard("{ArrowRight}")
    expect(name()).toBe("Gas")
    await user.keyboard("{ArrowRight}")
    expect(name()).toBe("Water")
    await user.keyboard("{ArrowRight}")
    expect(name()).toBe("Wells")
    await user.keyboard("{ArrowLeft}")
    expect(name()).toBe("Water")
    // Up to the group, and along its row.
    await user.keyboard("{ArrowUp}")
    expect(name()).toBe("Production")
    await user.keyboard("{ArrowLeft}")
    expect(name()).toBe("Operator")
    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(name()).toBe("Wells")
    // Down from a cell spanning both rows: to the body, past the header.
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement!.closest("tbody")).not.toBeNull()
    await user.keyboard("{ArrowUp}")
    expect(name()).toBe("Wells")
    await user.keyboard("{ArrowUp}")
    expect(name()).toBe("Wells")
    await user.keyboard("{Home}")
    expect(within(active()).queryByRole("checkbox")).not.toBeNull()
    await user.keyboard("{End}")
    expect(name()).toBe("Wells")
  })

  it("rules off every header column once a group is shown, and draws a line under the group's name", () => {
    render(<Fields selectionMode="multiple" />)
    const group = screen.getByRole("columnheader", { name: "Production" })
    // Under the group's name, and at its start; then between every column
    // of the header, in and out of the group.
    expect(group).toHaveClass(
      "border-b",
      "border-b-border",
      "border-s",
      "border-s-border"
    )
    for (const name of ["Operator", "Oil", "Gas", "Water", "Wells"])
      expect(header(name)).toHaveClass("border-s")
    // "Wells", in no group, spans both rows: the end edge goes on through
    // it, and no empty cell stands above it.
    expect(header("Wells")).toHaveAttribute("rowspan", "2")
    expect(header("Wells")).not.toHaveClass("border-b")
    // The group row is as tall as its text.
    expect(group).toHaveClass("h-8")
  })
})

describe("DataTable column widths", () => {
  it("keeps the browser's layout while no column has a width", () => {
    render(<Fields />)
    expect(screen.getByRole("grid")).not.toHaveClass("table-fixed")
    expect(cols()).toEqual([])
  })

  it("fixes the layout with widths: a colgroup, the table as wide as their sum, the last column taking the rest", () => {
    render(<Fields columns={sized} />)
    const table = screen.getByRole("grid")
    expect(table).toHaveClass("table-fixed")
    expect(table).toHaveStyle({ minWidth: "100%" })
    expect(table.style.width).toBe("670px")
    expect(cols()).toEqual(["140px", "160px", "90px", "90px", "90px", ""])
    // Cells cut what does not fit.
    expect(screen.getByText("ConocoPhillips")).toHaveClass("overflow-hidden")
  })

  it("takes the view's widths within the columns' bounds, and a selection column's", () => {
    render(
      <Fields
        columns={sized}
        selectionMode="multiple"
        defaultView={{ columns: { widths: { name: 20, oil: 500, gas: 75 } } }}
      />
    )
    // The selection column is measured.
    expect(cols()).toEqual([
      "40px",
      "100px",
      "160px",
      "200px",
      "75px",
      "90px",
      "",
    ])
  })

  it("starts a column without a width at its content's width", () => {
    measured = 123
    render(<Fields resizableColumns />)
    expect(cols()).toEqual(["123px", "123px", "123px", "123px", "123px", ""])
  })

  it("measures a column with a floating menu button to its label and the button's room, whichever side the button is on", () => {
    // A header laid out as a browser lays it out: 16 px of padding on each
    // side, a 60 px label, a 24 px menu button placed absolutely, whose
    // computed insets are resolved to px on both sides (never "auto").
    measured = 92
    const style = window.getComputedStyle
    const withValues = (computed: CSSStyleDeclaration, values: object) =>
      new Proxy(computed, {
        get: (target, name) =>
          name in values
            ? values[name as keyof typeof values]
            : Reflect.get(target, name, target),
      })
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const computed = style(element)
      if (element.matches('[data-slot="data-table-column-menu"]'))
        return withValues(computed, {
          position: "absolute",
          insetInlineStart: "4px",
          insetInlineEnd: "64px",
        })
      if (element.matches("thead th"))
        return withValues(computed, {
          paddingInlineStart: "16px",
          paddingInlineEnd: "16px",
        })
      return computed
    })
    const rect = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const width = this.matches('[data-slot="data-table-column-menu"]')
        ? 24
        : this.matches('[data-slot="data-table-header-label"], thead th > div')
          ? 60
          : null
      return width === null ? rect.call(this) : { ...rect.call(this), width }
    }
    render(<Fields resizableColumns />)
    // The padding, the label, and past the padding on the button's side the
    // button (24, right against the label) and its distance from the edge
    // (2): 102 px, the same for a number column (the button before its
    // label) as for a text one, not nearly twice the column's width.
    expect(cols()).toEqual(["102px", "102px", "102px", "102px", "102px", ""])
  })

  it("measures again once rows come, after a table that had none or was loading", () => {
    measured = 60
    const { rerender } = render(<Fields resizableColumns items={[]} />)
    expect(cols()).toEqual(["60px", "60px", "60px", "60px", "60px", ""])
    measured = 130
    rerender(<Fields resizableColumns items={FIELDS} loading />)
    expect(cols()[0]).toBe("60px")
    rerender(<Fields resizableColumns items={FIELDS} />)
    expect(cols()).toEqual(["130px", "130px", "130px", "130px", "130px", ""])
    // Not again for other rows.
    measured = 90
    rerender(<Fields resizableColumns items={FIELDS.slice(0, 1)} />)
    expect(cols()[0]).toBe("130px")
  })

  it("leaves a column hidden below the breakpoint out of the widths and the pins", () => {
    const wide = vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: !query.includes("48rem"),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    )
    const responsive = createColumns<Field>([
      { id: "name", header: "Field", width: 140 },
      { id: "oil", header: "Oil", type: "number", width: 90 },
      { id: "gas", header: "Gas", type: "number", width: 90, hideBelow: "md" },
      { id: "water", header: "Water", type: "number", width: 90 },
      { id: "wells", header: "Wells", type: "number", width: 100 },
    ])
    render(
      <Fields
        columns={responsive}
        pinnableColumns
        defaultView={{
          columns: { pinned: { start: ["name", "gas", "oil"], end: [] } },
        }}
      />
    )
    expect(wide).toHaveBeenCalledWith("(min-width: 48rem)")
    // Below md: Gas takes no width; the pinned columns are Field, Oil and
    // Gas, and the scrolled ones start right after Oil.
    expect(screen.getByRole("grid").style.width).toBe("420px")
    expect(frame().style.getPropertyValue("--data-table-pin-1")).toBe("140px")
    expect(frame().style.getPropertyValue("--data-table-pinned-start")).toBe(
      "230px"
    )
  })

  it("keeps the rows of a table on a card in the card's fill", () => {
    render(
      <Card>
        <Fields
          columns={sized}
          pinnableColumns
          defaultView={{ columns: { pinned: { start: ["name"], end: [] } } }}
        />
      </Card>
    )
    const card = document.querySelector<HTMLElement>('[data-slot="card"]')!
    // The card says what its surface is; pinned rows are filled with it.
    expect(card).toHaveClass("[--surface:var(--color-card)]")
    expect(screen.getByText("Valhall").closest("tr")).toHaveClass(
      "bg-[var(--surface,var(--color-background))]"
    )
  })
})

describe("DataTable column resizing", () => {
  const separator = (name: string) =>
    screen.getByRole("separator", { name: `Resize ${name}` })
  /** "Resize column" in the column's menu: focus on its resizer. */
  async function resize(
    user: ReturnType<typeof userEvent.setup>,
    name: string
  ) {
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: `${name} options` }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Resize column" })
    )
    await waitFor(() => expect(separator(name)).toHaveFocus())
  }

  it("puts the grip of a column pinned to the end on its start edge, the inner one", async () => {
    render(
      <Fields
        columns={sized}
        resizableColumns
        pinnableColumns
        defaultView={{ columns: { pinned: { start: [], end: ["name"] } } }}
      />
    )
    await waitFor(() =>
      expect(screen.getAllByRole("separator")).toHaveLength(5)
    )
    expect(separator("Field")).toHaveAttribute("data-edge", "start")
    expect(separator("Field")).toHaveClass("start-0")
    expect(separator("Oil")).toHaveAttribute("data-edge", "end")
  })

  it("puts a named resizer on each resizable column's header, none without the feature", async () => {
    const { unmount } = render(<Fields columns={sized} />)
    expect(screen.queryAllByRole("separator")).toHaveLength(0)
    unmount()
    render(<Fields columns={sized} resizableColumns />)
    // The grips are drawn at once; the resizers' code comes in idle time.
    const placeholders = document.querySelectorAll(
      '[data-slot="data-table-resizer-placeholder"]'
    )
    if (placeholders.length > 0) {
      expect(placeholders).toHaveLength(5)
      for (const grip of placeholders)
        expect(grip).toHaveAttribute("aria-hidden", "true")
    }
    await waitFor(() =>
      expect(screen.getAllByRole("separator")).toHaveLength(5)
    )
    // In the columns' order (the columns in no group start in the top row).
    expect(
      headColumns(document.querySelector("thead")!)
        .at(-1)!
        .flatMap((cell) =>
          within(cell)
            .queryAllByRole("separator")
            .map((element) => element.getAttribute("aria-label"))
        )
    ).toEqual([
      "Resize Field",
      "Resize Oil",
      "Resize Gas",
      "Resize Water",
      "Resize Wells",
    ])
    expect(separator("Field")).toHaveAttribute("aria-valuenow", "140")
    expect(separator("Field")).toHaveAttribute("aria-valuemin", "100")
    expect(separator("Oil")).toHaveAttribute("aria-valuemax", "200")
  })

  it("is no arrow stop: the arrows walk the whole header row past it", async () => {
    const user = userEvent.setup()
    render(<Fields columns={sized} resizableColumns />)
    await waitFor(() =>
      expect(separator("Field")).toHaveAttribute("tabindex", "-1")
    )
    const sort = within(header("Field")).getByRole("button", { name: "Field" })
    act(() => sort.focus())
    const name = () =>
      document.activeElement!.getAttribute("aria-label") ??
      document.activeElement!.textContent
    const visited: Array<string | null> = []
    for (let step = 0; step < 13; step++) {
      await user.keyboard("{ArrowRight}")
      visited.push(name())
    }
    // Each header's sort button and menu button, Field's description: never
    // a resizer, and on to the last header.
    expect(visited).toEqual([
      "About Field",
      "Field options",
      // Not resizable, nothing else on: no menu.
      "Operator",
      "Oil",
      "Oil options",
      "Gas",
      "Gas options",
      "Water",
      "Water options",
      "Wells",
      "Wells options",
      "Wells options",
      "Wells options",
    ])
    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(sort)
  })

  it("resizes from its column's menu: the arrows resize, Enter keeps the width, Escape puts it back", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields columns={sized} resizableColumns onViewChange={onViewChange} />
    )
    // The menu button is a plain one until the menu loads.
    const trigger = () => screen.getByRole("button", { name: "Oil options" })
    await user.click(trigger())
    await user.click(
      await screen.findByRole("menuitem", { name: "Resize column" })
    )
    await waitFor(() => expect(separator("Oil")).toHaveFocus())
    await user.keyboard("{ArrowRight}{ArrowRight}")
    // Drawn, not reported until Enter.
    expect(cols()[2]).toBe("106px")
    expect(separator("Oil")).toHaveAttribute("aria-valuenow", "106")
    expect(onViewChange).not.toHaveBeenCalled()
    await user.keyboard("{Enter}")
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ oil: 106 })
    expect(lastView(onViewChange)[1].reason).toBe("resize")
    expect(trigger()).toHaveFocus()

    // Escape: the width drawn goes back, nothing is reported.
    await resize(user, "Oil")
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}")
    expect(cols()[2]).toBe("74px")
    await user.keyboard("{Escape}")
    expect(cols()[2]).toBe("106px")
    expect(separator("Oil")).toHaveAttribute("aria-valuenow", "106")
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(trigger()).toHaveFocus()

    // Tab keeps the width too; Home and End reach the bounds.
    await resize(user, "Oil")
    await user.keyboard("{End}{Tab}")
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ oil: 200 })
    expect(trigger()).toHaveFocus()
  })

  it("mirrors the arrows in resize mode right to left", async () => {
    const user = userEvent.setup()
    render(
      <TectonProvider direction="rtl">
        <Fields columns={sized} resizableColumns />
      </TectonProvider>
    )
    await resize(user, "Gas")
    await user.keyboard("{ArrowLeft}")
    expect(cols()[3]).toBe("98px")
  })

  it("reports nothing for a key at a bound or a drag put back with Escape", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields columns={sized} resizableColumns onViewChange={onViewChange} />
    )
    // Field's minimum is 100: Home there is no change.
    await resize(user, "Field")
    await user.keyboard("{Home}{Home}{Enter}")
    fireEvent.pointerDown(separator("Wells"), {
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 160, clientY: 10 })
    // The last column takes the width it is dragged to…
    expect(cols()[5]).toBe("160px")
    fireEvent.keyDown(document, { key: "Escape" })
    // …and stretches again when the drag is put back.
    expect(cols()[5]).toBe("")
    expect(
      onViewChange.mock.calls.map(([view]) => view.columns.widths)
    ).toEqual([{ name: 100 }])
  })

  it("draws a drag without rendering a row, and reports the width once it ends", () => {
    const onViewChange = vi.fn()
    render(
      <Fields columns={sized} resizableColumns onViewChange={onViewChange} />
    )
    const renders = cellRenders.mock.calls.length
    fireEvent.pointerDown(separator("Field"), {
      button: 0,
      pointerId: 1,
      clientX: 140,
      clientY: 10,
    })
    for (let x = 141; x <= 200; x++)
      fireEvent.pointerMove(document, { pointerId: 1, clientX: x, clientY: 10 })
    expect(cols()[0]).toBe("200px")
    expect(screen.getByRole("grid").style.width).toBe("730px")
    expect(separator("Field")).toHaveAttribute("aria-valuenow", "200")
    expect(onViewChange).not.toHaveBeenCalled()
    expect(cellRenders.mock.calls.length).toBe(renders)
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 200, clientY: 10 })
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ name: 200 })
    // The widths are not something the rows draw: they render no more.
    expect(cellRenders.mock.calls.length).toBe(renders)
  })

  it("puts the width back when the view does not take it", () => {
    function Controlled() {
      const [view] = React.useState<DataTablePartialView>({})
      return <Fields columns={sized} resizableColumns view={view} />
    }
    render(<Controlled />)
    fireEvent.pointerDown(separator("Field"), {
      button: 0,
      pointerId: 1,
      clientX: 140,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 190, clientY: 10 })
    expect(cols()[0]).toBe("190px")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 190, clientY: 10 })
    expect(cols()[0]).toBe("140px")
    expect(screen.getByRole("grid").style.width).toBe("670px")
    expect(separator("Field")).toHaveAttribute("aria-valuenow", "140")
  })

  it("keeps a cancelled resize from applying", async () => {
    const user = userEvent.setup()
    render(
      <Fields
        columns={sized}
        resizableColumns
        onViewChange={(_, details) => details.cancel()}
      />
    )
    await resize(user, "Gas")
    await user.keyboard("{ArrowRight}{Enter}")
    expect(cols()[3]).toBe("90px")
  })

  it("resizes a stretching last column from the width it shows, as the preview changes it", async () => {
    const observers = new Set<() => void>()
    vi.stubGlobal(
      "ResizeObserver",
      class {
        callback: () => void
        constructor(callback: () => void) {
          this.callback = callback
        }
        observe() {
          observers.add(this.callback)
        }
        unobserve() {}
        disconnect() {
          observers.delete(this.callback)
        }
      }
    )
    /** The last column laid out at `width`, as a preview draws it. */
    const lay = (width: number) => {
      rendered = { Wells: width }
      act(() => {
        for (const observer of observers) observer()
      })
    }
    try {
      const user = userEvent.setup()
      const two = createColumns<Field>([
        { id: "name", header: "Field", width: 100 },
        { id: "wells", header: "Wells", type: "number", width: 100 },
      ])
      const onViewChange = vi.fn()
      render(
        <Fields columns={two} resizableColumns onViewChange={onViewChange} />
      )
      lay(500)
      expect(separator("Wells")).toHaveAttribute("aria-valuenow", "500")
      // Narrower from the keyboard: from 500, not from its own 100.
      await resize(user, "Wells")
      await user.keyboard("{ArrowLeft}")
      lay(492)
      expect(separator("Wells")).toHaveAttribute("aria-valuenow", "492")
      await user.keyboard("{Enter}")
      expect(lastView(onViewChange)[0].columns.widths).toEqual({ wells: 492 })
      // Wider by dragging.
      fireEvent.pointerDown(separator("Wells"), {
        button: 0,
        pointerId: 1,
        clientX: 500,
        clientY: 10,
      })
      fireEvent.pointerMove(document, {
        pointerId: 1,
        clientX: 530,
        clientY: 10,
      })
      lay(522)
      fireEvent.pointerUp(document, { pointerId: 1, clientX: 530, clientY: 10 })
      expect(lastView(onViewChange)[0].columns.widths).toEqual({ wells: 522 })

      // Stretched past the 1000 px ceiling: the ceiling is its width, and
      // a resize starts from it, with no jump.
      act(() => {
        rendered = {}
      })
      await user.click(screen.getByRole("button", { name: "Wells options" }))
      await user.click(
        await screen.findByRole("menuitem", { name: "Reset width" })
      )
      lay(1500)
      expect(separator("Wells")).toHaveAttribute("aria-valuenow", "1500")
      expect(separator("Wells")).toHaveAttribute("aria-valuemax", "1500")
      await resize(user, "Wells")
      await user.keyboard("{ArrowLeft}")
      lay(1492)
      await user.keyboard("{Enter}")
      expect(lastView(onViewChange)[0].columns.widths).toEqual({ wells: 1492 })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("is never focused by a press, nor left as the table's tab stop", async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <Fields columns={sized} resizableColumns />
      </>
    )
    await user.pointer([
      { keys: "[MouseLeft>]", target: separator("Gas") },
      { coords: { x: 40 } },
      { keys: "[/MouseLeft]" },
    ])
    expect(separator("Gas")).not.toHaveFocus()
    await user.click(screen.getByRole("button", { name: "Before" }))
    await user.tab()
    expect(screen.getByRole("grid")).toContainElement(
      document.activeElement as HTMLElement
    )
    expect(document.activeElement).not.toHaveAttribute("role", "separator")
  })

  it("fits and resets a column from its menu, and describes resize mode", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields columns={sized} resizableColumns onViewChange={onViewChange} />
    )
    await user.click(screen.getByRole("button", { name: "Gas options" }))
    // Nothing to reset yet.
    expect(
      await screen.findByRole("menuitem", { name: "Reset width" })
    ).toHaveAttribute("aria-disabled", "true")
    measured = 133
    await user.click(screen.getByRole("menuitem", { name: "Fit to content" }))
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ gas: 133 })
    measured = 0
    await resize(user, "Gas")
    expect(separator("Gas")).toHaveAccessibleDescription(
      "Use the left and right arrow keys to resize the column. Press Enter to keep the width or Escape to cancel."
    )
    await user.keyboard("{Escape}")
    expect(separator("Gas")).not.toHaveAccessibleDescription()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Gas options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Reset width" })
    )
    expect(lastView(onViewChange)[0].columns.widths).toEqual({})
    expect(cols()[3]).toBe("90px")
  })

  it("lets the last column stretch until the user sets its width, and keeps every width at least 48 px", async () => {
    const user = userEvent.setup()
    const tiny = createColumns<Field>([
      { id: "name", header: "Field", width: 20 },
      { id: "wells", header: "Wells", type: "number", width: 100 },
    ])
    const onViewChange = vi.fn()
    render(
      <Fields columns={tiny} resizableColumns onViewChange={onViewChange} />
    )
    expect(cols()).toEqual(["48px", ""])
    expect(separator("Field")).toHaveAttribute("aria-valuenow", "48")
    expect(screen.getByRole("grid").style.minWidth).toBe("100%")
    await resize(user, "Wells")
    await user.keyboard("{ArrowRight}{Enter}")
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ wells: 108 })
    // Its own width now: the table may end short of its frame.
    expect(cols()).toEqual(["48px", "108px"])
    expect(screen.getByRole("grid").style.minWidth).toBe("")
  })

  it("fits a column to its content on a double click", () => {
    const onViewChange = vi.fn()
    render(
      <Fields columns={sized} resizableColumns onViewChange={onViewChange} />
    )
    measured = 177
    fireEvent.doubleClick(separator("Wells"))
    expect(lastView(onViewChange)[0].columns.widths).toEqual({ wells: 177 })
    expect(lastView(onViewChange)[1].reason).toBe("resize")
    // The table's layout is its own again, with the new width.
    expect(screen.getByRole("grid").style.tableLayout).toBe("")
    expect(screen.getByRole("grid").style.width).toBe("747px")
  })

  it("mirrors the drag right to left", () => {
    render(
      <TectonProvider direction="rtl">
        <Fields columns={sized} resizableColumns />
      </TectonProvider>
    )
    fireEvent.pointerDown(separator("Field"), {
      button: 0,
      pointerId: 1,
      clientX: 500,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 470, clientY: 10 })
    expect(cols()[0]).toBe("170px")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 470, clientY: 10 })
    expect(separator("Field")).toHaveAttribute("aria-valuenow", "170")
  })
})

describe("DataTable column reordering", () => {
  // The drag and drop code, loaded once for the tests that drag.
  beforeEach(async () => {
    await loadFeature(DRAG_AND_DROP)
  })

  /** A press on a header cell, moved to `x`, and released there. */
  function drag(cell: HTMLElement, from: number, to: number) {
    fireEvent.pointerDown(cell, {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: from,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: to, clientY: 10 })
    fireEvent.pointerUp(document, { pointerId: 1, clientX: to, clientY: 10 })
  }
  const line = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="data-table-column-drop-indicator"]'
    )

  it("makes each movable header a tab stop of the grid, described as dragged", async () => {
    render(<Fields reorderableColumns />)
    await waitFor(() => expect(line()).not.toBeNull())
    expect(header("Operator")).toHaveAttribute("tabindex")
    expect(header("Operator")).toHaveAccessibleDescription("Drag Operator")
    const group = screen.getByRole("columnheader", { name: "Production" })
    expect(group).toHaveAccessibleDescription("Drag Production")
  })

  it("moves a column with the pointer, reported as reorder", async () => {
    const onViewChange = vi.fn()
    render(<Fields reorderableColumns onViewChange={onViewChange} />)
    await waitFor(() => expect(line()).not.toBeNull())
    // Operator (100–200) past Wells' middle (550).
    act(() => header("Operator").focus())
    drag(header("Operator"), 150, 580)
    expect(lastView(onViewChange)[1].reason).toBe("reorder")
    // The moved header keeps its cell, and its focus.
    expect(header("Operator")).toHaveFocus()
    expect(lastView(onViewChange)[0].columns.order).toEqual([
      "name",
      "oil",
      "gas",
      "water",
      "wells",
      "operator",
    ])
    expect(headers()).toEqual([
      "Field",
      "Oil",
      "Gas",
      "Water",
      "Wells",
      "Operator",
    ])
  })

  it("moves a column only among its group's, and a group with its columns", async () => {
    const onViewChange = vi.fn()
    render(<Fields reorderableColumns onViewChange={onViewChange} />)
    await waitFor(() => expect(line()).not.toBeNull())
    // Oil past Wells: the end of its group.
    drag(header("Oil"), 250, 580)
    expect(headers()).toEqual([
      "Field",
      "Operator",
      "Gas",
      "Water",
      "Oil",
      "Wells",
    ])
    // The group, before Field.
    drag(screen.getByRole("columnheader", { name: "Production" }), 300, 20)
    expect(headers()).toEqual([
      "Gas",
      "Water",
      "Oil",
      "Field",
      "Operator",
      "Wells",
    ])
    expect(onViewChange).toHaveBeenCalledTimes(2)
  })

  it("moves a column from the keyboard, names each place and focuses it again", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Fields reorderableColumns onViewChange={onViewChange} />)
    await waitFor(() => expect(line()).not.toBeNull())
    act(() => header("Field").focus())
    // From its own place, one place a key.
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert before Operator"
    )
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between Operator and Production"
    )
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between Production and Wells"
    )
    await user.keyboard("{Enter}")
    expect(headers()).toEqual([
      "Operator",
      "Oil",
      "Gas",
      "Water",
      "Field",
      "Wells",
    ])
    await waitFor(() => expect(header("Field")).toHaveFocus())
    // The grid's arrows still move between the header cell's stops.
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(
      within(header("Field")).getByRole("button", { name: /^Field/ })
    )
  })

  it("mirrors the keyboard right to left", async () => {
    rtl = true
    const user = userEvent.setup()
    render(
      <TectonProvider direction="rtl">
        <Fields reorderableColumns />
      </TectonProvider>
    )
    await waitFor(() => expect(line()).not.toBeNull())
    act(() => header("Wells").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert after Production"
    )
    // From the right: Right goes back towards the start.
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between Operator and Production"
    )
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between Field and Operator"
    )
    await user.keyboard("{Enter}")
    expect(headers()).toEqual([
      "Field",
      "Wells",
      "Operator",
      "Oil",
      "Gas",
      "Water",
    ])
  })

  it("keeps the selection column first, and pinned and opted-out columns where they are", async () => {
    const fixed = createColumns<Field>([
      { id: "name", header: "Field", reorderable: false },
      ...DEFINITIONS.slice(1),
    ])
    render(
      <Fields
        columns={fixed}
        reorderableColumns
        pinnableColumns
        selectionMode="multiple"
        defaultView={{ columns: { pinned: { start: [], end: ["wells"] } } }}
      />
    )
    await waitFor(() => expect(line()).not.toBeNull())
    expect(header("Field")).not.toHaveAttribute("tabindex", "0")
    expect(header("Field")).not.toHaveAccessibleDescription()
    expect(header("Wells")).not.toHaveAccessibleDescription()
    expect(header("Operator")).toHaveAccessibleDescription("Drag Operator")
    // Operator before Field: nothing before Field is a place.
    drag(header("Operator"), 190, 50)
    expect(headers()).toEqual([
      "Field",
      "Operator",
      "Oil",
      "Gas",
      "Water",
      "Wells",
    ])
    expect(
      headColumns(document.querySelector("thead")!)
        .at(-1)![0]
        .querySelector('[role="checkbox"]')
    ).not.toBeNull()
  })
})

describe("DataTable column hiding", () => {
  it("hides a column from its header's menu, announces it and keeps focus in the table", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Fields hideableColumns onViewChange={onViewChange} />)
    await user.click(screen.getByRole("button", { name: "Operator options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Hide column" })
    )
    expect(lastView(onViewChange)[0].columns.hidden).toEqual(["operator"])
    expect(lastView(onViewChange)[1].reason).toBe("hide")
    expect(headers()).toEqual(["Field", "Oil", "Gas", "Water", "Wells"])
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Operator hidden")
    )
    await waitFor(() =>
      expect(screen.getByRole("grid")).toContainElement(
        document.activeElement as HTMLElement
      )
    )
  })

  it("names rows by the next column shown while the row header column is hidden", () => {
    render(
      <Fields hideableColumns defaultView={{ columns: { hidden: ["name"] } }} />
    )
    expect(
      Array.from(
        document.querySelectorAll('tbody th[scope="row"]'),
        (cell) => cell.textContent
      )
    ).toEqual(["Equinor", "Aker BP", "ConocoPhillips"])
  })

  it("keeps the last column shown", async () => {
    const user = userEvent.setup()
    const one = createColumns<Field>([
      { id: "name", header: "Field" },
      { id: "operator", header: "Operator" },
    ])
    render(
      <Fields
        columns={one}
        hideableColumns
        defaultView={{ columns: { hidden: ["operator"] } }}
      >
        <DataTableColumnsMenu />
      </Fields>
    )
    expect(screen.queryByRole("button", { name: "Field options" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Columns" }))
    expect(
      await screen.findByRole("menuitemcheckbox", { name: "Field" })
    ).toHaveAttribute("aria-disabled", "true")
  })
})

describe("DataTable column hiding rules", () => {
  it("never hides a column that opts out, nor every column, and warns of a view that tries", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const kept = createColumns<Field>([
      { id: "name", header: "Field", hideable: false },
      { id: "operator", header: "Operator" },
    ])
    const { unmount } = render(
      <Fields
        columns={kept}
        hideableColumns
        view={{ columns: { hidden: ["name", "operator"] } }}
      />
    )
    expect(headers()).toEqual(["Field"])
    expect(
      warn.mock.calls.some(([message]) =>
        String(message).includes("hides every column")
      )
    ).toBe(true)
    unmount()
    render(
      <Fields
        hideableColumns
        view={{
          columns: {
            hidden: ["name", "operator", "oil", "gas", "water", "wells"],
          },
        }}
      />
    )
    expect(headers()).toEqual(["Field"])
  })

  it("keeps focus on the menu button when a controlled view does not hide the column", async () => {
    const user = userEvent.setup()
    function Ignoring() {
      const [view] = React.useState<DataTablePartialView>({})
      return <Fields hideableColumns view={view} />
    }
    render(<Ignoring />)
    const trigger = screen.getByRole("button", { name: "Gas options" })
    await user.click(trigger)
    await user.click(
      await screen.findByRole("menuitem", { name: "Hide column" })
    )
    expect(headers()).toContain("Gas")
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(announcer()?.textContent ?? "").not.toContain("Gas hidden")
  })
})

/** The shadow a pinned column casts past its inner edge (`cell.tsx`). */
const START_FADE = "after:[animation-name:scroll-fade-reveal-s]"
const END_FADE = "after:[animation-name:scroll-fade-reveal-e]"
const FADE_START = `[class*="${START_FADE}"]`

describe("DataTable column pinning", () => {
  it("pins a column from its header's menu, with its cells stuck to the start in their row's fill", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        columns={sized}
        pinnableColumns
        selectionMode="multiple"
        striped
        onViewChange={onViewChange}
      />
    )
    expect(document.querySelector(FADE_START)).toBeNull()
    await user.click(screen.getByRole("button", { name: "Wells options" }))
    expect(
      within(await screen.findByRole("menu"))
        .getAllByRole("menuitem")
        .map((item) => item.textContent)
    ).toEqual([
      "Sort ascending",
      "Sort descending",
      "Pin to start",
      "Pin to end",
    ])
    await user.click(screen.getByRole("menuitem", { name: "Pin to start" }))
    expect(lastView(onViewChange)[0].columns.pinned).toEqual({
      start: ["wells"],
      end: [],
    })
    expect(lastView(onViewChange)[1].reason).toBe("pin")
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Wells pinned to the start")
    )
    expect(headers()).toEqual([
      "Wells",
      "Field",
      "Operator",
      "Oil",
      "Gas",
      "Water",
    ])

    const wells = header("Wells")
    expect(wells).toHaveAttribute("data-pinned", "start")
    expect(wells).toHaveClass("sticky")
    expect(wells.style.insetInlineStart).toBe("var(--data-table-pin-0)")
    // The selection column sticks first, the pinned column after it.
    expect(frame().style.getPropertyValue("--data-table-pin-0")).toBe("40px")
    expect(frame().style.getPropertyValue("--data-table-pinned-start")).toBe(
      "140px"
    )
    const body = screen.getByText("104").closest("td")!
    expect(body).toHaveClass("sticky", "bg-inherit")
    expect(body.style.insetInlineStart).toBe("var(--data-table-pin-0)")
    const checkbox = screen
      .getByRole("checkbox", { name: "Select Gullfaks" })
      .closest("td")!
    expect(checkbox).toHaveClass("sticky")
    expect(checkbox.style.insetInlineStart).toBe("0px")
    // The row is opaque, for its cells to take its fill.
    expect(body.closest("tr")).toHaveClass(
      "bg-[var(--surface,var(--color-background))]"
    )
    // Its inner edge draws a divider, and a shadow over the columns
    // scrolled under it: the scroll fade's keyframes on the pinned cells,
    // not a mask over the table.
    expect(wells).toHaveClass("border-e", "border-e-border", START_FADE)
    expect(body).toHaveClass("border-e", "border-e-border", START_FADE)
    expect(body).not.toHaveClass("after:bg-inherit")
    expect(checkbox).not.toHaveClass("border-e")
    expect(checkbox).not.toHaveClass(START_FADE)
    expect(container().className).not.toContain("scroll-fade")
  })

  it("pins to the end, the selection column scrolling, and mirrors right to left", () => {
    render(
      <TectonProvider direction="rtl">
        <Fields
          columns={sized}
          pinnableColumns
          selectionMode="multiple"
          defaultView={{
            columns: { pinned: { start: [], end: ["name", "operator"] } },
          }}
        />
      </TectonProvider>
    )
    expect(headers()).toEqual([
      "Oil",
      "Gas",
      "Water",
      "Wells",
      "Field",
      "Operator",
    ])
    expect(header("Operator").style.insetInlineEnd).toBe(
      "var(--data-table-pin-5)"
    )
    expect(frame().style.getPropertyValue("--data-table-pin-5")).toBe("0px")
    expect(frame().style.getPropertyValue("--data-table-pin-4")).toBe("160px")
    expect(frame().style.getPropertyValue("--data-table-pinned-end")).toBe(
      "300px"
    )
    expect(
      screen.getByRole("checkbox", { name: "Select Gullfaks" }).closest("td")
    ).not.toHaveClass("sticky")
    // The last column not pinned takes the space left.
    expect(cols()).toEqual([
      "40px",
      "90px",
      "90px",
      "90px",
      "",
      "140px",
      "160px",
    ])
    // The first pinned at the end draws the divider and shadow, the next
    // only the header's rule (a group is shown).
    expect(header("Field")).toHaveClass("border-s", "border-s-border", END_FADE)
    expect(header("Operator")).not.toHaveClass(END_FADE)
    // The group over the pinned columns' place is split from theirs.
    expect(
      screen.getByRole("columnheader", { name: "Production" })
    ).not.toHaveClass("sticky")
  })

  it("unpins from the menu, and offers only the moves that apply", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        pinnableColumns
        defaultView={{ columns: { pinned: { start: [], end: ["name"] } } }}
        onViewChange={onViewChange}
      />
    )
    await user.click(screen.getByRole("button", { name: "Field options" }))
    await screen.findByRole("menu")
    expect(screen.queryByRole("menuitem", { name: "Pin to end" })).toBeNull()
    await user.click(screen.getByRole("menuitem", { name: "Unpin" }))
    expect(lastView(onViewChange)[0].columns.pinned).toEqual({
      start: [],
      end: [],
    })
    // The column moved; focus is back on its menu button.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Field options" })
      ).toHaveFocus()
    )
    await waitFor(() => expect(announcer()).toHaveTextContent("Field unpinned"))
  })
})

describe("DataTableColumnsMenu", () => {
  it("lists the columns under their groups, shows and hides them, and resets the columns", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        hideableColumns
        pinnableColumns
        defaultView={{ columns: { hidden: ["gas"] } }}
        onViewChange={onViewChange}
      >
        <DataTableColumnsMenu />
      </Fields>
    )
    const trigger = screen.getByRole("button", { name: "Columns" })
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    await user.click(trigger)
    const menu = await screen.findByRole("menu")
    // Nothing to reset yet.
    expect(
      within(menu).getByRole("menuitem", { name: "Reset columns" })
    ).toHaveAttribute("aria-disabled", "true")
    const show = within(menu).getByRole("group", { name: "Show columns" })
    const checkboxes = within(show).getAllByRole("menuitemcheckbox")
    expect(
      checkboxes.map(
        (item) => `${item.textContent}:${item.getAttribute("aria-checked")}`
      )
    ).toEqual([
      "Field:true",
      "Operator:true",
      "Oil:true",
      "Gas:false",
      "Water:true",
      "Wells:true",
    ])
    expect(
      within(show).getByRole("group", { name: "Production" })
    ).toContainElement(checkboxes[2])
    await user.click(
      within(show).getByRole("menuitemcheckbox", { name: "Gas" })
    )
    expect(lastView(onViewChange)[0].columns.hidden).toEqual([])
    expect(lastView(onViewChange)[1].reason).toBe("hide")
    await waitFor(() => expect(announcer()).toHaveTextContent("Gas shown"))
    await user.click(
      within(show).getByRole("menuitemcheckbox", { name: "Field" })
    )
    expect(lastView(onViewChange)[0].columns.hidden).toEqual(["name"])
    expect(
      within(menu).getByRole("group", { name: "Pin columns" })
    ).toBeInTheDocument()
    await user.click(
      within(menu).getByRole("menuitem", { name: "Reset columns" })
    )
    expect(lastView(onViewChange)[1].reason).toBe("reset")
    expect(lastView(onViewChange)[0].columns.hidden).toEqual(["gas"])
  })

  it("pins a column from its submenu of radio items", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields pinnableColumns onViewChange={onViewChange}>
        <DataTableColumnsMenu />
      </Fields>
    )
    await user.click(screen.getByRole("button", { name: "Columns" }))
    await screen.findByRole("menu")
    expect(screen.queryByRole("group", { name: "Show columns" })).toBeNull()
    await user.click(screen.getByRole("menuitem", { name: "Operator" }))
    const radios = await screen.findAllByRole("menuitemradio")
    expect(
      radios.map(
        (item) => `${item.textContent}:${item.getAttribute("aria-checked")}`
      )
    ).toEqual(["Not pinned:true", "Start:false", "End:false"])
    // The submenu takes the pointer once it has opened.
    fireEvent.click(screen.getByRole("menuitemradio", { name: "End" }))
    expect(lastView(onViewChange)[0].columns.pinned.end).toEqual(["operator"])
    expect(lastView(onViewChange)[1].reason).toBe("pin")
  })

  it("renders nothing while neither feature is on, and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <Fields>
        <DataTableColumnsMenu />
        <DataTableColumnsMenu />
      </Fields>
    )
    expect(screen.queryByRole("button", { name: "Columns" })).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain("DataTableColumnsMenu")
  })
})

describe("DataTable column header menu", () => {
  it("has no menu while the table only sorts", () => {
    render(<Fields />)
    expect(screen.queryByRole("button", { name: /options$/ })).toBeNull()
  })

  it("is a control of the header cell: the arrows reach it after the sort button", async () => {
    const user = userEvent.setup()
    render(<Fields hideableColumns />)
    const sort = within(header("Operator")).getByRole("button", {
      name: "Operator",
    })
    act(() => sort.focus())
    await user.keyboard("{ArrowRight}")
    const button = screen.getByRole("button", { name: "Operator options" })
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute("aria-haspopup", "menu")
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(button).toHaveFocus())
  })

  it("keeps its button shown from an item chosen until the menu has closed and focus is back on it", async () => {
    const user = userEvent.setup()
    render(<Fields hideableColumns />)
    const button = screen.getByRole("button", { name: "Oil options" })
    // Hidden at rest, shown while the menu is open or closing.
    expect(button).toHaveClass("opacity-0", "data-menu-active:opacity-100")
    expect(button).not.toHaveAttribute("data-menu-active")
    await user.click(button)
    const menu = await screen.findByRole("menu")
    expect(button).toHaveAttribute("data-menu-active")
    // Each frame of the close: the menu still there, focus not yet back
    // on the button, which stays shown.
    const frames: Array<{ menu: boolean; focused: boolean; shown: boolean }> =
      []
    const observer = new MutationObserver(() =>
      frames.push({
        menu: menu.isConnected,
        focused: document.activeElement === button,
        shown: button.hasAttribute("data-menu-active"),
      })
    )
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    })
    await user.click(screen.getByRole("menuitem", { name: "Sort descending" }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await waitFor(() => expect(button).toHaveFocus())
    observer.disconnect()
    const closing = frames.filter((frame) => frame.menu)
    expect(closing.length).toBeGreaterThan(0)
    expect(closing.filter((frame) => !frame.shown)).toEqual([])
    // Closed: shown by focus within its cell from here, as before the menu.
    expect(button).not.toHaveAttribute("data-menu-active")
    expect(header("Oil")).toHaveAttribute("aria-sort", "descending")
  })

  it("sorts by the column alone, and clears its sort", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        hideableColumns
        defaultView={{
          sorting: [
            { column: "operator", direction: "ascending" },
            { column: "wells", direction: "descending" },
          ],
        }}
        onViewChange={onViewChange}
      />
    )
    await user.click(screen.getByRole("button", { name: "Wells options" }))
    // Not the only sort: "Sort descending" sorts by it alone.
    expect(
      await screen.findByRole("menuitem", { name: "Sort descending" })
    ).not.toHaveAttribute("aria-disabled")
    await user.click(screen.getByRole("menuitem", { name: "Remove from sort" }))
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "operator", direction: "ascending" },
    ])
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Wells no longer sorted")
    )
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Oil options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Sort descending" })
    )
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "oil", direction: "descending" },
    ])
    expect(lastView(onViewChange)[1].reason).toBe("sort")
    expect(header("Oil")).toHaveAttribute("aria-sort", "descending")
    // The only sort, in that direction: nothing to do there.
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Oil options" }))
    expect(
      await screen.findByRole("menuitem", { name: "Sort descending" })
    ).toHaveAttribute("aria-disabled", "true")
  })
})

describe("DataTable multi-column sort from the column menu", () => {
  const items = () =>
    [...screen.getByRole("menu").querySelectorAll('[role^="menuitem"]')].map(
      (item) => item.textContent
    )
  const openMenu = async (
    user: ReturnType<typeof userEvent.setup>,
    name: string
  ) => {
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: `${name} options` }))
    await screen.findByRole("menu")
  }
  const positions = () =>
    [...document.querySelectorAll('[data-slot="data-table-sort-position"]')]
      .map((badge) => [
        badge.closest("th")?.getAttribute("aria-label"),
        badge.textContent,
      ])
      // In the sort's order.
      .sort((a, b) => Number(a[1]) - Number(b[1]))
  const sortButton = (name: string) =>
    within(header(name)).getByRole("button", { name: new RegExp(`^${name}`) })

  it("offers only the plain sort while no other column is sorted", async () => {
    const user = userEvent.setup()
    render(<Fields hideableColumns />)
    await openMenu(user, "Oil")
    expect(items()).toEqual([
      "Sort ascending",
      "Sort descending",
      "Hide column",
    ])
    await user.click(screen.getByRole("menuitem", { name: "Sort ascending" }))
    // Sorted alone: "Clear sort", and nothing to add it to.
    await openMenu(user, "Oil")
    expect(items()).toEqual([
      "Sort ascending",
      "Sort descending",
      "Clear sort",
      "Hide column",
    ])
    expect(screen.queryByText("Add to sort")).toBeNull()
  })

  it("adds a column to the sort, changes its direction in place, removes it and clears every sort", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Fields hideableColumns onViewChange={onViewChange} />)
    await openMenu(user, "Operator")
    await user.click(screen.getByRole("menuitem", { name: "Sort ascending" }))

    // Another column is sorted: the column's direction, under "Add to sort".
    await openMenu(user, "Oil")
    expect(items()).toEqual([
      "Sort ascending",
      "Sort descending",
      "Clear sort",
      "Ascending",
      "Descending",
      "Hide column",
    ])
    const group = screen.getByRole("group", { name: "Add to sort" })
    expect(
      within(group).getByRole("menuitemradio", { name: "Ascending" })
    ).toHaveAttribute("aria-checked", "false")
    await user.click(
      within(group).getByRole("menuitemradio", { name: "Descending" })
    )
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "operator", direction: "ascending" },
      { column: "oil", direction: "descending" },
    ])
    expect(lastView(onViewChange)[1].reason).toBe("sort")
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Oil sorted descending, 2 of 2")
    )

    await openMenu(user, "Wells")
    await user.click(screen.getByRole("menuitemradio", { name: "Ascending" }))
    expect(positions()).toEqual([
      ["Operator", "1"],
      ["Oil", "2"],
      ["Wells", "3"],
    ])

    // In the sort: its place, its direction checked, "Remove from sort".
    await openMenu(user, "Oil")
    expect(items()).toEqual([
      "Sort ascending",
      "Sort descending",
      "Clear sort",
      "Ascending",
      "Descending",
      "Remove from sort",
      "Hide column",
    ])
    const placed = screen.getByRole("group", { name: "Sort order: 2 of 3" })
    expect(
      within(placed).getByRole("menuitemradio", { name: "Descending" })
    ).toHaveAttribute("aria-checked", "true")
    // Another direction keeps the column's place.
    await user.click(
      within(placed).getByRole("menuitemradio", { name: "Ascending" })
    )
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "operator", direction: "ascending" },
      { column: "oil", direction: "ascending" },
      { column: "wells", direction: "ascending" },
    ])

    await openMenu(user, "Oil")
    await user.click(screen.getByRole("menuitem", { name: "Remove from sort" }))
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "operator", direction: "ascending" },
      { column: "wells", direction: "ascending" },
    ])
    expect(positions()).toEqual([
      ["Operator", "1"],
      ["Wells", "2"],
    ])
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Oil no longer sorted")
    )

    // "Clear sort", from a column not in the sort, removes every sort.
    await openMenu(user, "Gas")
    await user.click(screen.getByRole("menuitem", { name: "Clear sort" }))
    expect(lastView(onViewChange)[0].sorting).toEqual([])
    expect(positions()).toEqual([])
    await waitFor(() =>
      expect(announcer()).toHaveTextContent("Sorting cleared")
    )
  })

  it('sorts by the column alone from "Sort ascending" in a multi-sort', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        hideableColumns
        defaultView={{
          sorting: [
            { column: "operator", direction: "ascending" },
            { column: "wells", direction: "descending" },
          ],
        }}
        onViewChange={onViewChange}
      />
    )
    await openMenu(user, "Wells")
    await user.click(screen.getByRole("menuitem", { name: "Sort ascending" }))
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "wells", direction: "ascending" },
    ])
  })

  it("shows each sorted column's place, read with its direction", () => {
    render(
      <Fields
        size="sm"
        defaultView={{
          sorting: [
            { column: "wells", direction: "descending" },
            { column: "name", direction: "ascending" },
            { column: "oil", direction: "descending" },
          ],
        }}
      />
    )
    expect(positions()).toEqual([
      ["Wells", "1"],
      ["Field", "2"],
      ["Oil", "3"],
    ])
    expect(sortButton("Wells")).toHaveAccessibleName(
      "Wells sorted in descending order, 1 of 3 in sort order"
    )
    expect(sortButton("Field")).toHaveAccessibleName(
      "Field sorted in ascending order, 2 of 3 in sort order"
    )
    // The count is drawn only: the button's name has it.
    for (const badge of document.querySelectorAll(
      '[data-slot="data-table-sort-position"]'
    ))
      expect(badge).toHaveAttribute("aria-hidden")
  })

  it('keeps to one sort with multiSort={false}: no "Add to sort", and Shift + click sorts alone', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <Fields
        hideableColumns
        multiSort={false}
        defaultView={{
          sorting: [
            { column: "operator", direction: "ascending" },
            { column: "wells", direction: "descending" },
          ],
        }}
        onViewChange={onViewChange}
      />
    )
    // A view keeps its first sort.
    expect(header("Operator")).toHaveAttribute("aria-sort", "ascending")
    expect(header("Wells")).toHaveAttribute("aria-sort", "none")
    expect(positions()).toEqual([])
    await openMenu(user, "Oil")
    expect(items()).toEqual([
      "Sort ascending",
      "Sort descending",
      "Hide column",
    ])
    await user.keyboard("{Escape}")
    fireEvent.click(
      within(header("Oil")).getByRole("button", { name: "Oil" }),
      { shiftKey: true }
    )
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "oil", direction: "ascending" },
    ])
  })

  it("adds to the sort with Shift + Enter on a header, as with Shift + click", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Fields onViewChange={onViewChange} />)
    fireEvent.click(sortButton("Operator"))
    act(() => sortButton("Gas").focus())
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    expect(lastView(onViewChange)[0].sorting).toEqual([
      { column: "operator", direction: "ascending" },
      { column: "gas", direction: "ascending" },
    ])
    fireEvent.click(sortButton("Wells"), { shiftKey: true })
    expect(positions()).toEqual([
      ["Operator", "1"],
      ["Gas", "2"],
      ["Wells", "3"],
    ])
  })
})

describe("DataTable column descriptions", () => {
  it("shows a column's description in a popover on a press, and describes its header with it", async () => {
    const user = userEvent.setup()
    render(<Fields />)
    expect(header("Field")).toHaveAccessibleDescription(
      "The field's name on its licence."
    )
    const info = screen.getByRole("button", { name: "About Field" })
    await user.click(info)
    const popover = await screen.findByText(
      "The field's name on its licence.",
      {
        selector: '[data-slot="data-table-column-description-content"]',
      }
    )
    expect(popover).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(popover).not.toBeInTheDocument())
    // From the keyboard too.
    act(() => info.focus())
    await user.keyboard("{Enter}")
    expect(
      await screen.findByText("The field's name on its licence.", {
        selector: '[data-slot="data-table-column-description-content"]',
      })
    ).toBeInTheDocument()
  })
})

describe("useDataTable column setters", () => {
  it("applies setters called one after the other, each with its reason", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    function Layout() {
      const table = useDataTable<Field>()
      return (
        <button
          type="button"
          onClick={() => {
            table.setColumnHidden("gas", true)
            table.setColumnPinned("wells", "start")
            table.setColumnWidth("name", 220)
            table.setColumnOrder(["operator", "name"])
          }}
        >
          Layout
        </button>
      )
    }
    function Reset() {
      const { resetColumns } = useDataTable<Field>()
      return (
        <button type="button" onClick={resetColumns}>
          Reset
        </button>
      )
    }
    render(
      <Fields onViewChange={onViewChange}>
        <Layout />
        <Reset />
      </Fields>
    )
    await user.click(screen.getByRole("button", { name: "Layout" }))
    expect(
      onViewChange.mock.calls.map(([, details]) => details.reason)
    ).toEqual(["hide", "pin", "resize", "reorder"])
    const [view] = lastView(onViewChange)
    // The columns the order leaves out follow, in their order.
    expect(view.columns).toEqual({
      order: ["operator", "name", "oil", "gas", "water", "wells"],
      hidden: ["gas"],
      widths: { name: 220 },
      pinned: { start: ["wells"], end: [] },
    })
    expect(headers()).toEqual(["Wells", "Operator", "Field", "Oil", "Water"])
    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(lastView(onViewChange)[1].reason).toBe("reset")
    expect(headers()).toEqual([
      "Field",
      "Operator",
      "Oil",
      "Gas",
      "Water",
      "Wells",
    ])
  })
})

describe("DataTable columns in a virtualized table", () => {
  it("keeps its own widths and pins over the virtualizer's", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
    render(
      <DataTable
        items={FIELDS}
        columns={sized}
        pinnableColumns
        defaultView={{ columns: { pinned: { start: ["name"], end: [] } } }}
      >
        <DataTableContent aria-label="Fields" virtualized className="h-96" />
      </DataTable>
    )
    expect(screen.getByRole("grid")).toHaveClass("table-fixed")
    expect(
      document.querySelector('[data-slot="table-virtual-columns"]')
    ).toBeNull()
    expect(cols()).toEqual(["140px", "160px", "90px", "90px", "90px", ""])
    expect(header("Field")).toHaveClass("sticky")
  })
})

describe("DataTable columns in a virtualized table, pinned later", () => {
  it("takes the columns over from the virtualizer's lock once it fixes its widths", async () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
    const onViewChange = vi.fn()
    render(
      <DataTable
        items={FIELDS}
        columns={columns}
        pinnableColumns
        onViewChange={onViewChange}
      >
        <DataTableContent aria-label="Fields" virtualized className="h-96" />
      </DataTable>
    )
    // No widths: the virtualizer locks the columns at their content's.
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="table-virtual-columns"]')
      ).not.toBeNull()
    )
    expect(cols()).toEqual([])
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Wells options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Pin to end" })
    )
    expect(lastView(onViewChange)[1].reason).toBe("pin")
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="table-virtual-columns"]')
      ).toBeNull()
    )
    expect(cols()).toHaveLength(6)
    expect(header("Wells")).toHaveClass("sticky")
  })
})

describe("DataTable hideBelow and wrap", () => {
  const responsive = createColumns<Field>([
    { id: "name", header: "Field", width: 140 },
    { id: "operator", header: "Operator", wrap: true },
    { id: "wells", header: "Wells", type: "number", hideBelow: "md" },
  ])

  it("hides a column's header, cells and col below the breakpoint, and wraps a column's text", () => {
    render(<Fields columns={responsive} />)
    expect(header("Wells")).toHaveClass("hidden", "md:table-cell")
    expect(screen.getByText("104").closest("td")).toHaveClass(
      "hidden",
      "md:table-cell"
    )
    const [, , wells] = document.querySelectorAll(
      'colgroup[data-slot="data-table-columns"] > col'
    )
    expect(wells).toHaveClass("hidden", "md:table-column")
    expect(screen.getByText("ConocoPhillips")).toHaveClass("whitespace-normal")
  })
})

describe("DataTable header rows of groups over hidden columns", () => {
  const grouped = createColumns<Field>([
    { id: "name", header: "Field" },
    {
      id: "production",
      header: "Production",
      columns: [
        { id: "oil", header: "Oil", type: "number", hideBelow: "md" },
        { id: "gas", header: "Gas", type: "number", hideBelow: "md" },
      ],
    },
  ])
  const headRows = () => document.querySelectorAll("thead > tr")
  const wide = () =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    )

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("draws no row of groups while every grouped column is hidden below its breakpoint", () => {
    // The test window is below every breakpoint.
    render(<Fields columns={grouped} selectionMode="multiple" />)
    expect(headRows()).toHaveLength(1)
    for (const cell of headRows()[0].children)
      expect(cell).not.toHaveAttribute("rowspan")
    expect(
      screen.queryByRole("columnheader", { name: "Production" })
    ).toBeNull()
  })

  it("draws the row of groups once a grouped column is laid out", () => {
    wide()
    render(<Fields columns={grouped} selectionMode="multiple" />)
    expect(headRows()).toHaveLength(2)
    expect(header("Field")).toHaveAttribute("rowspan", "2")
    expect(
      screen.getByRole("columnheader", { name: "Production" })
    ).toBeInTheDocument()
  })

  it("keeps a row of groups over a column that is not hidden", () => {
    const some = createColumns<Field>([
      { id: "name", header: "Field" },
      {
        id: "production",
        header: "Production",
        columns: [
          { id: "oil", header: "Oil", type: "number" },
          { id: "gas", header: "Gas", type: "number", hideBelow: "md" },
        ],
      },
    ])
    render(<Fields columns={some} />)
    expect(headRows()).toHaveLength(2)
  })
})

describe("DataTable grid keys and cells not laid out", () => {
  it("passes over cells hidden below a breakpoint", async () => {
    const user = userEvent.setup()
    const three = createColumns<Field>([
      { id: "name", header: "Field" },
      { id: "operator", header: "Operator", hideBelow: "md" },
      { id: "wells", header: "Wells", type: "number" },
    ])
    render(<Fields columns={three} sortable={false} />)
    const style = document.createElement("style")
    style.textContent = "table tr > :nth-child(2) { display: none }"
    document.head.append(style)
    // jsdom lays nothing out: a box for everything but what is hidden.
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (
      this: Element
    ) {
      return (getComputedStyle(this).display === "none"
        ? []
        : [new DOMRect()]) as unknown as DOMRectList
    })
    try {
      const gullfaks = screen.getByText("Gullfaks").closest("th")!
      act(() => gullfaks.closest("tr")!.focus())
      await user.keyboard("{ArrowRight}")
      expect(document.activeElement).toBe(gullfaks)
      await user.keyboard("{ArrowRight}")
      expect(document.activeElement).toHaveTextContent("104")
      await user.keyboard("{ArrowLeft}")
      expect(document.activeElement).toBe(gullfaks)
      await user.keyboard("{End}")
      expect(document.activeElement).toHaveTextContent("104")
      // From the row, Left goes to its last cell laid out.
      style.textContent = "table tr > :nth-child(3) { display: none }"
      act(() => screen.getByText("Valhall").closest("tr")!.focus())
      await user.keyboard("{ArrowLeft}")
      expect(document.activeElement).toHaveTextContent("Aker BP")
    } finally {
      style.remove()
    }
  })
})

describe("DataTable around other tables and surfaces", () => {
  it("keeps the pinned columns' edge from a plain table in one of its cells", () => {
    const nested = createColumns<Field>([
      { id: "name", header: "Field", width: 140 },
      {
        id: "wells",
        header: "Wells",
        cell: (field) => (
          <Table aria-label={`${field.name} wells`}>
            <TableBody>
              <TableRow>
                <TableCell>{field.wells}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ),
      },
    ])
    render(
      <Fields
        columns={nested}
        pinnableColumns
        defaultView={{ columns: { pinned: { start: ["name"], end: [] } } }}
      />
    )
    const containers = document.querySelectorAll(
      '[data-slot="table-container"]'
    )
    expect(containers[0].querySelector(FADE_START)).not.toBeNull()
    for (const inner of [...containers].slice(1))
      expect(inner.querySelector(FADE_START)).toBeNull()
  })

  it("sets --surface on Panel and the AppShell's surfaces", () => {
    render(
      <>
        <Panel data-testid="panel" />
        <AppShell data-testid="shell">
          <AppShellHeader data-testid="header" />
          <AppShellSidebar data-testid="sidebar" />
          <AppShellAside data-testid="aside" />
        </AppShell>
      </>
    )
    expect(screen.getByTestId("panel")).toHaveClass(
      "[--surface:var(--color-card)]"
    )
    expect(screen.getByTestId("shell")).toHaveClass(
      "[--surface:var(--color-background)]"
    )
    expect(screen.getByTestId("header")).toHaveClass(
      "[--surface:var(--color-card)]"
    )
    expect(screen.getByTestId("sidebar")).toHaveClass(
      "[--surface:var(--color-sidebar)]"
    )
    expect(screen.getByTestId("aside")).toHaveClass(
      "[--surface:var(--color-card)]"
    )
  })

  it("puts a column's menu button beside its label, after it or before it in a column aligned to the end, taking no room but on touch screens", () => {
    render(
      <Fields
        hideableColumns
        columns={createColumns<Field>([
          ...DEFINITIONS,
          { id: "id", header: "Code", align: "center" },
        ])}
      />
    )
    const label = (button: HTMLElement) =>
      button.closest<HTMLElement>('[data-slot="data-table-header-label"]')!
    // After the label's end, a small gap away, in the header's fill, in
    // the label's row on a touch screen.
    const text = screen.getByRole("button", { name: "Operator options" })
    expect(text).toHaveClass("absolute", "start-full", "bg-table-header")
    expect(text).not.toHaveClass("end-2", "end-full")
    // Right against the label: no gap between them.
    expect(text).not.toHaveClass("ms-0.5")
    expect(text).toHaveClass("pointer-coarse:static")
    // Shown for the header cell under the pointer only, not the whole row.
    expect(text).toHaveClass("group-hover/head:opacity-100")
    expect(text.className).not.toContain("tr:hover")
    expect(text.closest("th")).toHaveClass("group/head")
    expect(label(text)).toHaveAttribute("data-align", "start")
    expect(label(text)).toHaveClass("relative")
    // The label is as wide as its text, at the cell's start, and leaves the
    // button its room while it shows.
    expect(label(text).parentElement).toHaveClass("justify-start")
    expect(label(text)).toHaveClass(
      "pointer-fine:group-hover/head:max-w-[calc(100%-0.625rem)]"
    )
    // In a column aligned to the end, before the label's start, wherever
    // the label is: never at the cell's start edge.
    const numbers = screen.getByRole("button", { name: "Oil options" })
    expect(numbers).toHaveClass("absolute", "end-full", "bg-table-header")
    expect(numbers).not.toHaveClass("start-1", "start-full")
    expect(numbers).toHaveClass(
      "pointer-coarse:static",
      "pointer-coarse:order-first"
    )
    expect(label(numbers)).toHaveAttribute("data-align", "end")
    expect(label(numbers).parentElement).toHaveClass("justify-end")
    expect(label(numbers)).toHaveClass(
      "pointer-fine:group-hover/head:max-w-[calc(100%-0.625rem)]"
    )
    // Centred: after the label, with as much room on its other side.
    const centred = screen.getByRole("button", { name: "Code options" })
    expect(centred).toHaveClass("absolute", "start-full")
    expect(label(centred)).toHaveClass(
      "pointer-fine:group-hover/head:max-w-[calc(100%-1.25rem)]"
    )
    // After a description's info button, never over it.
    const beside = screen.getByRole("button", { name: "Field options" })
    expect(beside).toHaveClass("absolute", "start-full")
    expect(
      within(label(beside)).getByRole("button", { name: "About Field" })
    ).toBeInTheDocument()
  })
})
