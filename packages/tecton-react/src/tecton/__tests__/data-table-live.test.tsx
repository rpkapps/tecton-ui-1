/**
 * Live data (`highlightChanges`): which rows count as added, their
 * highlight, the "new rows" buttons, rows held back while the rows are in
 * use, the rows in view kept still, and the announcements.
 *
 * jsdom lays nothing out: `geometry()` places the frame, the header and
 * the rows (by `data-index` in a virtualized body, else by their place)
 * in a scroll area of 400 px under a 40 px header, rows 40 px tall, at
 * the container's `scrollTop`. Without it, nothing is laid out and every
 * row rendered counts as in view.
 */
import * as React from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { DropdownMenuItem } from "@tecton/react/dropdown-menu"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableRowActions,
  type DataTableHighlightChanges,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/data-table"

import { LIVE, loadFeature } from "../internal/data-table/lazy"

type Reading = {
  id: string
  name: string
  field: string
  value: number
  children?: Array<Reading>
}

const reading = (n: number, field = "North"): Reading => ({
  id: `r${n}`,
  name: `Reading ${String(n).padStart(3, "0")}`,
  field,
  value: n,
})

/** 20 readings, 0 to 190 by tens. */
const READINGS = Array.from({ length: 20 }, (_, i) => reading(i * 10))

const columns = createColumns<Reading>([
  { id: "name", header: "Reading" },
  { id: "field", header: "Field" },
  { id: "value", header: "Value", type: "number" },
])

const SORTED: DataTableView["sorting"] = [
  { column: "value", direction: "ascending" },
]

const HEADER = 40
const ROW = 40
const VIEW = 400

/** The scroll position of the table's container (`geometry`). */
const scroll = { top: 0 }
/** Each `scrollBy` of the container: its behavior. */
const scrolls: Array<ScrollBehavior | undefined> = []

/** Lays the table out (see the module comment). */
function geometry() {
  scroll.top = 0
  scrolls.length = 0
  const container = (element: Element) =>
    element.matches('[data-slot="table-container"]')
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return container(this) ? VIEW : 0
    }
  )
  vi.spyOn(HTMLElement.prototype, "scrollTop", "get").mockImplementation(
    function (this: HTMLElement) {
      return container(this) ? scroll.top : 0
    }
  )
  vi.spyOn(HTMLElement.prototype, "scrollTop", "set").mockImplementation(
    function (this: HTMLElement, value: number) {
      if (container(this)) scroll.top = Math.max(0, value)
    }
  )
  HTMLElement.prototype.scrollBy = function (
    this: HTMLElement,
    options?: ScrollToOptions | number
  ) {
    if (typeof options !== "object" || !container(this)) return
    scrolls.push(options.behavior)
    scroll.top = Math.max(0, scroll.top + (options.top ?? 0))
  }
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
      if (this.matches('[data-slot="data-table-content"]')) return box(0, VIEW)
      if (container(this)) return box(0, VIEW)
      if (this.tagName === "THEAD") return box(0, HEADER)
      if (this.tagName === "TABLE") return box(-scroll.top, 4000)
      if (this.tagName === "TH" && !this.closest("tbody")) return box(0, HEADER)
      if (this.tagName === "TBODY") return box(HEADER - scroll.top, 4000)
      if (this.tagName === "TR" && this.closest("tbody")) {
        const row = this as HTMLTableRowElement
        const given = row.dataset.index
        // A virtualized body's rows by their index; spacers and parity
        // rows take no room here.
        if (
          given === undefined &&
          row.closest("[data-recycling], tbody") &&
          row.getAttribute("aria-hidden") === "true"
        )
          return box(0, 0)
        const index =
          given === undefined
            ? [...(row.parentElement?.children ?? [])].indexOf(row)
            : Number(given)
        return box(HEADER + index * ROW - scroll.top, ROW)
      }
      return box(0, 0)
    }
  )
}

/** Scrolls the container to `top`, as the user would. */
function scrollTo(top: number) {
  const container = document.querySelector<HTMLElement>(
    '[data-slot="table-container"]'
  )!
  act(() => {
    scroll.top = top
    container.dispatchEvent(new Event("scroll"))
  })
  // The counts are worked out in the next frame.
  act(() => {
    vi.advanceTimersByTime(20)
  })
}

const frame = () =>
  document.querySelector<HTMLElement>('[data-slot="data-table-content"]')!
const rowOf = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLTableRowElement
const shown = (name: string) => screen.queryByText(name) !== null
/** The highlighted rows, by their row header's text. */
const highlighted = () =>
  [...document.querySelectorAll<HTMLElement>("tr[data-live-added]")].map(
    (row) => row.querySelector("th")?.textContent
  )
const pill = (kind: "above" | "below" | "pages" | "held") =>
  document.querySelector<HTMLButtonElement>(
    `[data-slot="data-table-new-rows"] button[data-kind="${kind}"]`
  )
/** The table's live region. */
const status = () =>
  document.querySelector('[data-slot="data-table-content"] > [role="status"]')
    ?.textContent ?? ""

type Props = Partial<DataTableProps<Reading>> & {
  virtualized?: boolean
  children?: React.ReactNode
}

function Live({ virtualized = true, children, ...props }: Props) {
  return (
    <DataTable
      items={READINGS}
      columns={columns}
      highlightChanges
      defaultView={{ sorting: SORTED }}
      {...props}
    >
      {children}
      <DataTableContent aria-label="Readings" virtualized={virtualized} />
    </DataTable>
  )
}

// The content's live module loads as a table with `highlightChanges`
// mounts; here once, before any.
beforeAll(async () => {
  await loadFeature(LIVE)
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollBy
})

describe("DataTable highlightChanges: which rows are added", () => {
  it("highlights a row added after the first render where it lands, never the first rows", () => {
    geometry()
    const { rerender } = render(<Live />)
    expect(highlighted()).toEqual([])
    rerender(<Live items={[...READINGS, reading(15)]} />)
    expect(highlighted()).toEqual(["Reading 015"])
    // Sorted into place: between 10 and 20.
    const names = [...document.querySelectorAll("tbody th")].map(
      (cell) => cell.textContent
    )
    expect(names.slice(0, 4)).toEqual([
      "Reading 000",
      "Reading 010",
      "Reading 015",
      "Reading 020",
    ])
  })

  it("compares the items, not the rows shown: a search showing rows adds none, a row it hides is not highlighted, counted or said", () => {
    const view = (search: string): DataTableProps<Reading>["view"] => ({
      sorting: SORTED,
      search,
    })
    const south = [
      ...READINGS.slice(0, 10),
      ...READINGS.slice(10).map((r) => ({ ...r, field: "South" })),
    ]
    const { rerender } = render(
      <Live items={south} filterable view={view("North")} virtualized={false} />
    )
    expect(shown("Reading 150")).toBe(false)
    rerender(
      <Live items={south} filterable view={view("")} virtualized={false} />
    )
    expect(shown("Reading 150")).toBe(true)
    expect(highlighted()).toEqual([])

    rerender(
      <Live items={south} filterable view={view("North")} virtualized={false} />
    )
    rerender(
      <Live
        items={[...south, reading(55, "South")]}
        filterable
        view={view("North")}
        virtualized={false}
      />
    )
    act(() => vi.advanceTimersByTime(2000))
    expect(highlighted()).toEqual([])
    expect(pill("below")).toBeNull()
    expect(pill("pages")).toBeNull()
    expect(status()).not.toContain("added")
  })

  it("starts from the first rows a table that starts empty gets", () => {
    const { rerender } = render(<Live items={[]} virtualized={false} />)
    rerender(<Live items={READINGS} virtualized={false} />)
    expect(highlighted()).toEqual([])
    rerender(<Live items={[...READINGS, reading(5)]} virtualized={false} />)
    expect(highlighted()).toEqual(["Reading 005"])
  })

  it("leaves out rows that come with a load: while loading, and as it ends", () => {
    const { rerender } = render(<Live virtualized={false} />)
    rerender(
      <Live loading items={[...READINGS, reading(5)]} virtualized={false} />
    )
    expect(highlighted()).toEqual([])
    rerender(
      <Live
        items={[...READINGS, reading(5), reading(15)]}
        virtualized={false}
      />
    )
    expect(highlighted()).toEqual([])
    rerender(
      <Live
        items={[...READINGS, reading(5), reading(15), reading(25)]}
        virtualized={false}
      />
    )
    expect(highlighted()).toEqual(["Reading 025"])
  })

  it("leaves out the rows onLoadMore brought", () => {
    const onLoadMore = vi.fn()
    const more = { hasMore: true, loadMore: "button" as const, onLoadMore }
    const { rerender } = render(<Live {...more} virtualized={false} />)
    fireEvent.click(screen.getByRole("button", { name: "Show more" }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    const next = [...READINGS, reading(5), reading(195)]
    rerender(<Live {...more} items={next} virtualized={false} />)
    expect(highlighted()).toEqual([])
    rerender(
      <Live {...more} items={[...next, reading(7)]} virtualized={false} />
    )
    expect(highlighted()).toEqual(["Reading 007"])
  })

  it("is off without highlightChanges, with added: false, and highlights nothing with a duration of 0", () => {
    for (const option of [false, { added: false }] as Array<
      DataTableHighlightChanges | undefined
    >) {
      const { rerender, unmount } = render(
        <Live highlightChanges={option} virtualized={false} />
      )
      rerender(
        <Live
          highlightChanges={option}
          items={[...READINGS, reading(5)]}
          virtualized={false}
        />
      )
      expect(document.querySelector("[data-live-key]")).toBeNull()
      expect(highlighted()).toEqual([])
      unmount()
    }
    const { rerender } = render(
      <Live highlightChanges={{ duration: 0 }} virtualized={false} />
    )
    rerender(
      <Live
        highlightChanges={{ duration: 0 }}
        items={[...READINGS, reading(5)]}
        virtualized={false}
      />
    )
    expect(highlighted()).toEqual([])
  })
})

describe("DataTable highlightChanges: server mode", () => {
  function Server({
    view,
    ...props
  }: Props & { view: DataTableProps<Reading>["view"] }) {
    return (
      <Live
        dataMode="server"
        rowCount={100}
        pagination
        virtualized={false}
        view={view}
        {...props}
      />
    )
  }
  const ascending = { sorting: SORTED }
  const descending: DataTableProps<Reading>["view"] = {
    sorting: [{ column: "value", direction: "descending" }],
  }
  const page = (from: number) =>
    Array.from({ length: 10 }, (_, i) => reading(from + i * 10))

  it("leaves out the rows of a new view or page, and compares the items while the view stays", () => {
    const { rerender } = render(<Server view={ascending} items={page(0)} />)
    // The sort changes, then the server's rows for it come.
    rerender(<Server view={descending} items={page(0)} />)
    rerender(<Server view={descending} items={page(500)} />)
    expect(highlighted()).toEqual([])
    // The same view: a new row is an addition.
    rerender(<Server view={descending} items={[reading(999), ...page(500)]} />)
    expect(highlighted()).toEqual(["Reading 999"])
    // The next page, its rows with it.
    rerender(<Server view={descending} page={2} items={page(800)} />)
    expect(highlighted()).not.toContain("Reading 800")
    expect(highlighted().filter((name) => name !== "Reading 999")).toEqual([])
  })

  it("leaves out the rows that come while loading", () => {
    const { rerender } = render(<Server view={ascending} items={page(0)} />)
    rerender(<Server view={descending} items={page(0)} loading />)
    rerender(<Server view={descending} items={page(300)} loading />)
    rerender(<Server view={descending} items={[...page(300), reading(1)]} />)
    expect(highlighted()).toEqual([])
    rerender(
      <Server
        view={descending}
        items={[...page(300), reading(1), reading(2)]}
      />
    )
    expect(highlighted()).toEqual(["Reading 002"])
  })
})

describe("DataTable highlightChanges: trees and groups", () => {
  const parent = (
    n: number,
    children: Array<Reading> | undefined
  ): Reading => ({
    ...reading(n),
    name: `Parent ${n}`,
    children,
  })

  it("highlights a child added to an open row, and the closed row a child is added to", () => {
    const tree = (one: Array<Reading>, two: Array<Reading>) => [
      parent(1000, one),
      parent(2000, two),
    ]
    const props = {
      itemToChildren: (item: Reading) => item.children,
      defaultExpanded: ["r1000"],
      virtualized: false,
    }
    const { rerender } = render(
      <Live {...props} items={tree([reading(1)], [reading(2)])} />
    )
    rerender(
      <Live {...props} items={tree([reading(1), reading(3)], [reading(2)])} />
    )
    expect(highlighted()).toEqual(["Reading 003"])
    act(() => vi.advanceTimersByTime(2000))
    rerender(
      <Live
        {...props}
        items={tree([reading(1), reading(3)], [reading(2), reading(4)])}
      />
    )
    // Parent 2000 is closed: its row stands for the child.
    expect(highlighted()).toEqual(["Parent 2000"])
  })

  it("leaves out the children a server tree loads as a row opens", () => {
    const props = {
      itemToChildren: (item: Reading) => item.children,
      dataMode: "server" as const,
      virtualized: false,
    }
    const { rerender } = render(
      <Live {...props} expanded={[]} items={[parent(1000, undefined)]} />
    )
    rerender(
      <Live {...props} expanded={["r1000"]} items={[parent(1000, undefined)]} />
    )
    rerender(
      <Live
        {...props}
        expanded={["r1000"]}
        items={[parent(1000, [reading(1), reading(2)])]}
      />
    )
    expect(shown("Reading 001")).toBe(true)
    expect(highlighted()).toEqual([])
    rerender(
      <Live
        {...props}
        expanded={["r1000"]}
        items={[parent(1000, [reading(1), reading(2), reading(3)])]}
      />
    )
    expect(highlighted()).toEqual(["Reading 003"])
  })

  it("highlights a row in an open group, a closed group's row for one in it, and a new group with its row", () => {
    const grouped = { groupable: true, virtualized: false }
    const items = [
      ...READINGS.slice(0, 4),
      ...READINGS.slice(4, 8).map((r) => ({ ...r, field: "South" })),
    ]
    const { rerender } = render(
      <Live
        {...grouped}
        defaultView={{ sorting: SORTED, grouping: ["field"] }}
        items={items}
      />
    )
    const groupRows = () =>
      [
        ...document.querySelectorAll<HTMLElement>(
          'tr[data-slot="data-table-group-row"][data-live-added]'
        ),
      ].map((row) => row.textContent)
    rerender(
      <Live
        {...grouped}
        defaultView={{ sorting: SORTED, grouping: ["field"] }}
        items={[...items, reading(5)]}
      />
    )
    expect(highlighted()).toContain("Reading 005")
    expect(groupRows()).toEqual([])
    act(() => vi.advanceTimersByTime(2000))

    // Close South, then add to it.
    fireEvent.click(
      screen.getByText("South", { selector: "span" }).closest("tr")!
    )
    rerender(
      <Live
        {...grouped}
        defaultView={{ sorting: SORTED, grouping: ["field"] }}
        items={[...items, reading(5), reading(45, "South")]}
      />
    )
    expect(shown("Reading 045")).toBe(false)
    expect(groupRows()).toHaveLength(1)
    expect(groupRows()[0]).toContain("South")
    act(() => vi.advanceTimersByTime(2000))

    rerender(
      <Live
        {...grouped}
        defaultView={{ sorting: SORTED, grouping: ["field"] }}
        items={[
          ...items,
          reading(5),
          reading(45, "South"),
          reading(99, "East"),
        ]}
      />
    )
    expect(highlighted()).toContain("Reading 099")
    expect(groupRows()).toHaveLength(1)
    expect(groupRows()[0]).toContain("East")
  })
})

describe("DataTable highlightChanges: the highlight", () => {
  it("ends after its duration (1,500 ms, or its own)", () => {
    geometry()
    const { rerender } = render(<Live />)
    rerender(<Live items={[...READINGS, reading(15)]} />)
    act(() => vi.advanceTimersByTime(1400))
    expect(highlighted()).toEqual(["Reading 015"])
    act(() => vi.advanceTimersByTime(200))
    expect(highlighted()).toEqual([])

    const custom: DataTableHighlightChanges = { duration: 3000 }
    rerender(
      <Live highlightChanges={custom} items={[...READINGS, reading(15)]} />
    )
    rerender(
      <Live
        highlightChanges={custom}
        items={[...READINGS, reading(15), reading(25)]}
      />
    )
    act(() => vi.advanceTimersByTime(2900))
    expect(highlighted()).toEqual(["Reading 025"])
    act(() => vi.advanceTimersByTime(200))
    expect(highlighted()).toEqual([])
  })

  it("covers every cell of the row, the selection's and pinned ones too, under the rules of a hoisted style", () => {
    const { rerender } = render(
      <Live
        selectionMode="multiple"
        pinnableColumns
        striped
        defaultView={{
          sorting: SORTED,
          columns: { pinned: { start: ["name"] } },
        }}
        virtualized={false}
      />
    )
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Reading 020" })
    )
    rerender(
      <Live
        selectionMode="multiple"
        pinnableColumns
        striped
        defaultView={{
          sorting: SORTED,
          columns: { pinned: { start: ["name"] } },
        }}
        items={[...READINGS, reading(15)]}
        virtualized={false}
      />
    )
    const added = rowOf("Reading 015")
    expect(added).toHaveAttribute("data-live-added")
    // The selected row keeps its selection; the stripes keep their parity.
    expect(rowOf("Reading 020")).toHaveAttribute("data-selected", "true")
    expect(rowOf("Reading 020")).not.toHaveAttribute("data-live-added")
    const style = document.querySelector(
      'style[data-href="tecton-data-table-live"]'
    )
    expect(style?.textContent).toContain(
      "[data-live-added]>td,[data-live-added]>th"
    )
    expect(style?.textContent).toContain("var(--info)")
    // Each cell paints the tint over its own fill: the checkbox's and the
    // pinned row header's too, children of the row.
    expect(added.cells[0].tagName).toBe("TD")
    expect(added.querySelector(":scope > th.sticky")).not.toBeNull()
  })

  it("highlights a virtualized row scrolled into view before its highlight ends, not after", () => {
    geometry()
    const many = Array.from({ length: 60 }, (_, i) => reading(i * 10))
    const { rerender } = render(<Live items={many} />)
    // Lands at index 51: not rendered at the top.
    rerender(<Live items={[...many, reading(505)]} />)
    expect(shown("Reading 505")).toBe(false)
    act(() => vi.advanceTimersByTime(700))
    scrollTo(46 * ROW)
    expect(rowOf("Reading 505")).toHaveAttribute("data-live-added")
    // Its rows recycled for others as the view moves on: by key, not element.
    scrollTo(0)
    act(() => vi.advanceTimersByTime(900))
    scrollTo(46 * ROW)
    expect(rowOf("Reading 505")).not.toHaveAttribute("data-live-added")
  })
})

describe("DataTable highlightChanges: new rows out of view", () => {
  it("keeps the rows in view still as rows land above them, and counts those in ↑", () => {
    geometry()
    const { rerender } = render(<Live />)
    scrollTo(10 * ROW)
    rerender(
      <Live items={[reading(-3), reading(-2), reading(-1), ...READINGS]} />
    )
    // Three rows above: scrolled by as much, so Reading 100 stays put.
    expect(scroll.top).toBe(13 * ROW)
    expect(rowOf("Reading 100").getBoundingClientRect().top).toBe(HEADER)
    const up = pill("above")!
    expect(up).toHaveTextContent("3 new rows")
    expect(up).toHaveAccessibleName("3 new rows above")
    expect(up.closest("[data-edge]")).toHaveAttribute("data-edge", "top")
  })

  it("moves nothing at the top of the rows: rows added there come into view", () => {
    geometry()
    const { rerender } = render(<Live />)
    rerender(<Live items={[reading(-1), ...READINGS]} />)
    expect(scroll.top).toBe(0)
    expect(highlighted()).toEqual(["Reading 0-1"])
    expect(pill("above")).toBeNull()
  })

  it("counts rows below in ↓ until they are seen", () => {
    geometry()
    const { rerender } = render(<Live />)
    rerender(<Live items={[...READINGS, reading(185), reading(175)]} />)
    const down = pill("below")!
    expect(down).toHaveTextContent("2 new rows")
    expect(down).toHaveAccessibleName("2 new rows below")
    expect(down.closest("[data-edge]")).toHaveAttribute("data-edge", "bottom")
    expect(scroll.top).toBe(0)
    // Reading 175 (index 18) in view, half of it at least; 185 not yet.
    scrollTo(10 * ROW)
    expect(pill("below")).toHaveTextContent("1 new row")
    scrollTo(12 * ROW)
    expect(pill("below")).toBeNull()
  })

  it("scrolls to the first of them when pressed, highlights them again and goes", () => {
    geometry()
    const { rerender } = render(<Live />)
    scrollTo(10 * ROW)
    rerender(<Live items={[reading(-2), reading(-1), ...READINGS]} />)
    act(() => vi.advanceTimersByTime(1400))
    fireEvent.click(pill("above")!, { detail: 1 })
    // To the first (the topmost), smoothly.
    expect(scroll.top).toBe(0)
    expect(scrolls).toEqual(["smooth"])
    expect(pill("above")).toBeNull()
    act(() => vi.advanceTimersByTime(1000))
    expect(highlighted()).toEqual(["Reading 0-2", "Reading 0-1"])
  })

  it("jumps instead of scrolling with reduced motion", () => {
    geometry()
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    )
    const { rerender } = render(<Live />)
    scrollTo(10 * ROW)
    rerender(<Live items={[reading(-1), ...READINGS]} />)
    fireEvent.click(pill("above")!, { detail: 1 })
    expect(scroll.top).toBe(0)
    expect(scrolls).toEqual([])
  })

  it("moves focus to the first of them when pressed from the keyboard", () => {
    geometry()
    const { rerender } = render(<Live />)
    rerender(<Live items={[...READINGS, reading(185)]} />)
    act(() => pill("below")!.focus())
    fireEvent.click(pill("below")!, { detail: 0 })
    act(() => vi.advanceTimersByTime(20))
    expect(document.activeElement).toBe(rowOf("Reading 185"))
  })

  it("counts rows on other pages, and turns to the first one's page when pressed", () => {
    const { rerender } = render(<Live pagination virtualized={false} />)
    rerender(
      <Live
        pagination
        virtualized={false}
        items={[...READINGS, reading(155), reading(165)]}
      />
    )
    const other = pill("pages")!
    expect(other).toHaveTextContent("2 new rows on other pages")
    expect(other).toHaveAccessibleName("2 new rows on other pages")
    expect(shown("Reading 155")).toBe(false)
    fireEvent.click(other, { detail: 1 })
    expect(shown("Reading 155")).toBe(true)
    expect(highlighted()).toEqual(["Reading 155", "Reading 165"])
    expect(pill("pages")).toBeNull()
  })
})

describe("DataTable highlightChanges: rows held while the table is in use", () => {
  it("holds rows that would land in view while the pointer is over the rows, and shows them once it leaves", () => {
    geometry()
    const { rerender } = render(<Live />)
    fireEvent.pointerOver(rowOf("Reading 040"))
    rerender(<Live items={[...READINGS, reading(15), reading(185)]} />)
    // 15 would move the rows in view: held. 185 lands below: shown, counted.
    expect(shown("Reading 015")).toBe(false)
    expect(rowOf("Reading 185")).toHaveAttribute("data-live-added")
    expect(pill("held")).toHaveAccessibleName("Show 1 new row")
    expect(pill("below")).toHaveTextContent("1 new row")
    // Still in use: a while later, still held.
    act(() => vi.advanceTimersByTime(2000))
    expect(shown("Reading 015")).toBe(false)

    fireEvent.pointerLeave(frame())
    act(() => vi.advanceTimersByTime(299))
    expect(shown("Reading 015")).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(rowOf("Reading 015")).toHaveAttribute("data-live-added")
    expect(pill("held")).toBeNull()
  })

  it("holds a row that would land cut by the view's edge, pushing the row there out", () => {
    geometry()
    const { rerender } = render(<Live />)
    // Reading 090 (index 9) shows its top 10 px at the bottom edge.
    scrollTo(10)
    fireEvent.pointerOver(rowOf("Reading 040"))
    rerender(<Live items={[...READINGS, reading(85)]} />)
    expect(shown("Reading 085")).toBe(false)
    expect(rowOf("Reading 090").getBoundingClientRect().top).toBe(390)
    expect(pill("held")).toHaveAccessibleName("Show 1 new row")
    // Not over the rows, it lands there: mostly below the view, counted.
    fireEvent.pointerLeave(frame())
    act(() => vi.advanceTimersByTime(300))
    expect(rowOf("Reading 085")).toHaveAttribute("data-live-added")
    expect(pill("below")).toHaveAccessibleName("1 new row below")
  })

  it("applies removals and changes at once while holding additions", () => {
    geometry()
    const { rerender } = render(<Live />)
    fireEvent.pointerOver(rowOf("Reading 040"))
    rerender(<Live items={[...READINGS, reading(15)]} />)
    expect(shown("Reading 015")).toBe(false)
    const without = READINGS.filter((item) => item.id !== "r20")
    rerender(
      <Live
        items={[
          ...without.map((item) =>
            item.id === "r30" ? { ...item, name: "Renamed" } : item
          ),
          reading(15),
        ]}
      />
    )
    expect(shown("Reading 020")).toBe(false)
    expect(shown("Renamed")).toBe(true)
    expect(shown("Reading 015")).toBe(false)
    // The application removes the held row: nothing held any more.
    rerender(<Live items={without} />)
    expect(pill("held")).toBeNull()
  })

  it("holds while focus is in the rows, and while a row's menu is open", async () => {
    const withMenu = createColumns<Reading>([
      { id: "name", header: "Reading" },
      { id: "field", header: "Field" },
      { id: "value", header: "Value", type: "number" },
      {
        id: "actions",
        header: "Actions",
        sortable: false,
        cell: () => (
          <DataTableRowActions>
            <DropdownMenuItem>Acknowledge</DropdownMenuItem>
          </DataTableRowActions>
        ),
      },
    ])
    const { rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <Live columns={withMenu} virtualized={false} />
      </>
    )
    const live = (items: Array<Reading>) => (
      <>
        <button type="button">Elsewhere</button>
        <Live columns={withMenu} virtualized={false} items={items} />
      </>
    )
    act(() => rowOf("Reading 040").focus())
    rerender(live([...READINGS, reading(15)]))
    expect(shown("Reading 015")).toBe(false)
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    act(() => vi.advanceTimersByTime(300))
    expect(shown("Reading 015")).toBe(true)

    // A row's menu: held while it is open, wherever focus and pointer are.
    const trigger = within(rowOf("Reading 040")).getByRole("button", {
      name: "Row actions",
    })
    act(() => {
      trigger.focus()
      fireEvent.click(trigger)
    })
    act(() => vi.advanceTimersByTime(50))
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    const menu = screen.getByRole("menu")
    // Focus in the menu, outside the table; the pointer nowhere.
    act(() => screen.getByRole("menuitem", { name: "Acknowledge" }).focus())
    rerender(live([...READINGS, reading(15), reading(25)]))
    act(() => vi.advanceTimersByTime(1000))
    expect(shown("Reading 025")).toBe(false)
    // Closed, focus back on its button, in the rows: still in use.
    act(() => {
      fireEvent.keyDown(menu, { key: "Escape" })
    })
    act(() => vi.advanceTimersByTime(100))
    act(() => trigger.focus())
    // The menu's button is watched (a mutation observer, told in a
    // microtask).
    await act(async () => {
      await Promise.resolve()
    })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    act(() => vi.advanceTimersByTime(400))
    expect(shown("Reading 025")).toBe(false)
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    act(() => vi.advanceTimersByTime(300))
    expect(shown("Reading 025")).toBe(true)
  })

  it("shows the held rows when its button is pressed", () => {
    geometry()
    const { rerender } = render(<Live />)
    fireEvent.pointerOver(rowOf("Reading 040"))
    rerender(<Live items={[...READINGS, reading(15), reading(35)]} />)
    expect(pill("held")).toHaveTextContent("Show 2 new rows")
    fireEvent.pointerOver(pill("held")!)
    fireEvent.click(pill("held")!, { detail: 1 })
    expect(highlighted()).toEqual(["Reading 015", "Reading 035"])
    expect(pill("held")).toBeNull()
  })

  it("holds a row landing on an earlier page, which would move the page's rows", () => {
    const { rerender } = render(
      <Live pagination defaultPage={2} virtualized={false} />
    )
    fireEvent.pointerOver(rowOf("Reading 120"))
    rerender(
      <Live
        pagination
        defaultPage={2}
        virtualized={false}
        items={[...READINGS, reading(5)]}
      />
    )
    expect(rowOf("Reading 100")).toBeInTheDocument()
    expect(pill("held")).toHaveAccessibleName("Show 1 new row")
    fireEvent.pointerLeave(frame())
    act(() => vi.advanceTimersByTime(300))
    // Shown: the page's rows moved on by one, the new row counted.
    expect(rowOf("Reading 090")).toBeInTheDocument()
    expect(pill("pages")).toHaveTextContent("1 new row on another page")
  })
})

describe("DataTable highlightChanges: announcements", () => {
  it("says how many rows came, at most once a second", () => {
    const { rerender } = render(<Live virtualized={false} />)
    rerender(<Live virtualized={false} items={[...READINGS, reading(1)]} />)
    act(() => vi.advanceTimersByTime(0))
    expect(status()).toBe("1 row added")
    rerender(
      <Live virtualized={false} items={[...READINGS, reading(1), reading(2)]} />
    )
    rerender(
      <Live
        virtualized={false}
        items={[...READINGS, reading(1), reading(2), reading(3)]}
      />
    )
    act(() => vi.advanceTimersByTime(900))
    expect(status()).toBe("1 row added")
    act(() => vi.advanceTimersByTime(100))
    expect(status()).toBe("2 rows added")
  })

  it("says held rows once, as they come, not again as they show", () => {
    geometry()
    const { rerender } = render(<Live />)
    fireEvent.pointerOver(rowOf("Reading 040"))
    rerender(<Live items={[...READINGS, reading(15)]} />)
    act(() => vi.advanceTimersByTime(0))
    expect(status()).toBe("1 row added")
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.pointerLeave(frame())
    act(() => vi.advanceTimersByTime(2000))
    expect(shown("Reading 015")).toBe(true)
    expect(status()).toBe("1 row added")
  })
})
