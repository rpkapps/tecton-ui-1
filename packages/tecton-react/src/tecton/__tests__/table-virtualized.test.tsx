import * as React from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

/**
 * jsdom has no layout: the table's container is 400 px tall, the header
 * 40 px, and rows are laid out 40.5 px apart below it (a fractional height
 * a rounded measure would drift on).
 */
const ROW = 40.5
const HEADER = 40
const VIEW = 400

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(VIEW)
  const originalRect = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const index = (this as HTMLElement).dataset.index
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
      if (this.tagName === "THEAD") return box(0, HEADER)
      // The table is 400 px wide; its first column 300 px, the second 100.
      if (this.tagName === "TABLE") return box(0, HEADER)
      if (this.tagName === "TH") {
        const width = (this as HTMLTableCellElement).cellIndex === 0 ? 300 : 100
        return { ...box(0, HEADER), width, right: width }
      }
      if (this.tagName === "TR" && index !== undefined)
        return box(HEADER + Number(index) * ROW, ROW)
      return originalRect.call(this)
    }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

const WELLS = Array.from({ length: 10_000 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
}))

function Wells({
  virtualized = true,
  count = WELLS.length,
}: {
  virtualized?: boolean
  count?: number
}) {
  return (
    <div style={{ height: VIEW }}>
      <Table aria-label="Wells" virtualized={virtualized}>
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
            <TableHead>Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WELLS.slice(0, count).map((well) => (
            <TableRow key={well.id}>
              <TableCell>{well.name}</TableCell>
              <TableCell>
                <a href={`#${well.id}`}>Open {well.name}</a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const container = () =>
  document.querySelector<HTMLElement>('[data-slot="table-container"]')!
const bodyRows = () =>
  Array.from(
    document.querySelectorAll<HTMLTableRowElement>("tbody tr[data-index]")
  )
const spacers = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="table-virtual-spacer"] td'
    )
  ).map((cell) => parseFloat(cell.style.height))

function scrollTo(top: number) {
  Object.defineProperty(container(), "scrollTop", {
    configurable: true,
    value: top,
  })
  fireEvent.scroll(container())
}

describe("Table virtualized", () => {
  it("renders only the rows in view of 10,000", () => {
    render(<Wells />)
    const rows = bodyRows()
    expect(rows.length).toBeGreaterThan(5)
    expect(rows.length).toBeLessThan(40)
    expect(screen.getByText("Well 0")).toBeInTheDocument()
    expect(screen.queryByText("Well 9999")).toBeNull()
    // The spacers and the rendered rows add up to every row.
    const total =
      spacers().reduce((sum, height) => sum + height, 0) + rows.length * ROW
    expect(total).toBe(10_000 * ROW)
  })

  it("scrolls the container and the header sticks", () => {
    render(<Wells />)
    expect(container()).toHaveClass("overflow-auto", "h-full")
    expect(document.querySelector("thead")).toHaveClass("sticky", "top-0")
    scrollTo(HEADER + 5_000 * ROW)
    expect(screen.getByText("Well 5000")).toBeInTheDocument()
    expect(screen.queryByText("Well 0")).toBeNull()
    scrollTo(HEADER + 10_000 * ROW - VIEW)
    expect(screen.getByText("Well 9999")).toBeInTheDocument()
    // At the end there is no spacer below the last row.
    expect(document.querySelector("tbody")!.lastElementChild).toHaveAttribute(
      "data-index",
      "9999"
    )
    expect(spacers()).toHaveLength(1)
  })

  it("announces the table's true size and each row's place", () => {
    render(<Wells />)
    expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "10001")
    scrollTo(HEADER + 2_000 * ROW)
    expect(screen.getByText("Well 2000").closest("tr")).toHaveAttribute(
      "aria-rowindex",
      "2002"
    )
    for (const spacer of document.querySelectorAll(
      '[data-slot="table-virtual-spacer"]'
    ))
      expect(spacer).toHaveAttribute("aria-hidden", "true")
  })

  it("keeps the row holding focus when it scrolls out of view", () => {
    render(<Wells />)
    const link = screen.getByRole("link", { name: "Open Well 3" })
    act(() => link.focus())
    scrollTo(HEADER + 6_000 * ROW)
    expect(screen.getByText("Well 6000")).toBeInTheDocument()
    expect(link).toBeInTheDocument()
    expect(link).toHaveFocus()
    // A spacer stands between the kept row and the window.
    expect(spacers().length).toBe(3)
    act(() => link.blur())
    expect(screen.queryByText("Well 3")).toBeNull()
  })

  it("leaves a table without virtualized as it was", () => {
    render(<Wells virtualized={false} count={200} />)
    expect(document.querySelectorAll("tbody tr")).toHaveLength(200)
    expect(container()).not.toHaveClass("h-full")
    expect(container()).toHaveClass("overflow-x-auto")
    expect(document.querySelector("thead")).not.toHaveClass("sticky")
    expect(screen.getByRole("table")).not.toHaveAttribute("aria-rowcount")
    expect(document.querySelector("tbody tr")).not.toHaveAttribute("data-index")
    expect(
      document.querySelector('[data-slot="table-virtual-spacer"]')
    ).toBeNull()
  })

  const lockedWidths = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="table-virtual-columns"] col'
      )
    ).map((col) => col.style.width)

  it("locks the columns in px, spreading the space left, the last one taking the rest", () => {
    // A 600 px container: 200 px past the columns' content (300 and 100),
    // spread by their widths; the last column has no width of its own.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600)
    render(<Wells />)
    expect(lockedWidths()).toEqual(["450px", ""])
    expect(screen.getByRole("table")).toHaveClass("table-fixed")
    scrollTo(HEADER + 5_000 * ROW)
    expect(screen.getByText("Well 5000")).toBeInTheDocument()
    expect(lockedWidths()).toEqual(["450px", ""])
  })

  it("keeps every column at its content's width in a narrower container", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300)
    render(<Wells />)
    // 400 px of columns in 300: the table scrolls sideways.
    expect(lockedWidths()).toEqual(["300px", "100px"])
  })

  it("keeps a column of controls as narrow as its control", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600)
    render(
      <div style={{ height: VIEW }}>
        <Table virtualized>
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
              <TableHead>
                <input type="checkbox" aria-label="Select all" />
              </TableHead>
              <TableHead>Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WELLS.slice(0, 100).map((well) => (
              <TableRow key={well.id}>
                <TableCell>{well.name}</TableCell>
                <TableCell>
                  <input type="checkbox" aria-label={`Select ${well.name}`} />
                </TableCell>
                <TableCell>Open</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
    // Content 300, 100 (+6 for the focus ring) and 100: the 94 px left go
    // to the columns of text only.
    expect(lockedWidths()).toEqual(["370.5px", "106px", ""])
  })

  it("hands the columns to the caller's widths and back (resizing)", () => {
    function Resizable({ widths }: { widths: boolean }) {
      return (
        <div style={{ height: VIEW }}>
          <Table virtualized>
            <TableHeader>
              <TableRow>
                <TableHead style={widths ? { width: 200 } : undefined}>
                  Well
                </TableHead>
                <TableHead style={widths ? { width: 120 } : undefined}>
                  Open
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody items={WELLS}>
              {(well) => (
                <TableRow key={well.id}>
                  <TableCell>{well.name}</TableCell>
                  <TableCell>Open</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )
    }
    const columns = () =>
      document.querySelector('[data-slot="table-virtual-columns"]')
    const { rerender } = render(<Resizable widths={false} />)
    expect(columns()).not.toBeNull()
    rerender(<Resizable widths />)
    expect(columns()).toBeNull()
    expect(screen.getByRole("table")).not.toHaveClass("table-fixed")
    rerender(<Resizable widths={false} />)
    expect(columns()).not.toBeNull()
  })

  it("leaves a table the caller made fixed with its own widths", () => {
    render(
      <div style={{ height: VIEW }}>
        <Table virtualized style={{ tableLayout: "fixed" }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 120 }}>Well</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody items={WELLS}>
            {(well) => (
              <TableRow key={well.id}>
                <TableCell>{well.name}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
    expect(
      document.querySelector('[data-slot="table-virtual-columns"]')
    ).toBeNull()
  })
})

describe("Table virtualized with items", () => {
  const renderCount = new Map<string, number>()
  function Counted({ id, name }: { id: string; name: string }) {
    renderCount.set(id, (renderCount.get(id) ?? 0) + 1)
    return <>{name}</>
  }

  function Items({
    items,
    render: renderRow,
  }: {
    items: typeof WELLS
    render: (well: (typeof WELLS)[number]) => React.ReactNode
  }) {
    return (
      <div style={{ height: VIEW }}>
        <Table aria-label="Wells" virtualized>
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody items={items}>{renderRow}</TableBody>
        </Table>
      </div>
    )
  }

  it("renders only the rows in view, and again after a sort", () => {
    const renderRow = vi.fn((well: (typeof WELLS)[number]) => (
      <TableRow key={well.id}>
        <TableCell>{well.name}</TableCell>
      </TableRow>
    ))
    const { rerender } = render(<Items items={WELLS} render={renderRow} />)
    expect(screen.getByText("Well 0")).toBeInTheDocument()
    expect(renderRow.mock.calls.length).toBeLessThan(120)
    expect(bodyRows().length).toBeLessThan(60)

    renderRow.mockClear()
    const sorted = [...WELLS].reverse()
    rerender(<Items items={sorted} render={renderRow} />)
    expect(screen.getByText("Well 9999")).toBeInTheDocument()
    expect(screen.queryByText("Well 0")).toBeNull()
    expect(renderRow.mock.calls.length).toBeLessThan(120)
  })

  it("does not re-render the rows that stay in view on a scroll", () => {
    renderCount.clear()
    const renderRow = (well: (typeof WELLS)[number]) => (
      <TableRow key={well.id}>
        <TableCell>
          <Counted id={well.id} name={well.name} />
        </TableCell>
      </TableRow>
    )
    render(<Items items={WELLS} render={renderRow} />)
    const row = screen.getByText("Well 3").closest("tr")
    const before = renderCount.get("w3")
    scrollTo(HEADER + 2 * ROW)
    expect(screen.getByText("Well 3").closest("tr")).toBe(row)
    expect(renderCount.get("w3")).toBe(before)
  })

  it("applies a scroll before the browser paints it", () => {
    render(
      <Items
        items={WELLS}
        render={(well) => (
          <TableRow key={well.id}>
            <TableCell>{well.name}</TableCell>
          </TableRow>
        )}
      />
    )
    Object.defineProperty(container(), "scrollTop", {
      configurable: true,
      value: HEADER + 7_000 * ROW,
    })
    // A plain event, outside any test flush: the rows are there at once.
    container().dispatchEvent(new Event("scroll"))
    expect(screen.getByText("Well 7000")).toBeInTheDocument()
  })

  it("renders every item when the table is not virtualized", () => {
    render(
      <Table>
        <TableBody items={WELLS.slice(0, 50)}>
          {(well) => (
            <TableRow key={well.id}>
              <TableCell>{well.name}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
    expect(document.querySelectorAll("tbody tr")).toHaveLength(50)
    expect(screen.getByText("Well 49")).toBeInTheDocument()
  })
})

describe("Table virtualized scrollbar jumps", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const visible = Math.ceil(VIEW / ROW)

  it("mounts about a screenful on a jump, and the rest once it settles", () => {
    vi.useFakeTimers()
    render(<Wells />)
    // A jump far past the prepared rows: the scrollbar dragged.
    scrollTo(HEADER + 7_000 * ROW)
    expect(screen.getByText("Well 7000")).toBeInTheDocument()
    expect(bodyRows().length).toBeLessThanOrEqual(visible + 2 * 2 + 1)
    // Once the scrolling stops, a viewport of rows each way.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(bodyRows().length).toBeGreaterThanOrEqual(visible * 3 - 2)
    expect(screen.getByText("Well 6995")).toBeInTheDocument()
  })

  it("keeps a viewport of rows each way on a small scroll", () => {
    vi.useFakeTimers()
    render(<Wells />)
    scrollTo(HEADER + 30 * ROW)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    // Within the prepared rows: not a jump.
    scrollTo(HEADER + 33 * ROW)
    expect(bodyRows().length).toBeGreaterThanOrEqual(visible * 3 - 2)
  })

  it("does not measure the rows again on a scroll", () => {
    render(<Wells />)
    scrollTo(HEADER + 30 * ROW)
    const rect = vi.mocked(Element.prototype.getBoundingClientRect)
    rect.mockClear()
    scrollTo(HEADER + 32 * ROW)
    const rowReads = rect.mock.contexts.filter(
      (element) => (element as Element).tagName === "TR"
    )
    expect(rowReads).toHaveLength(0)
  })
})

/**
 * A scrollbar drag scrolls in the browser's compositor, before the rows for
 * its position are rendered: with nothing else there, it drew the spacers,
 * and the rows stayed blank until the drag stopped, however fast they
 * rendered. While the pointer is on the scrollbar, and while scrolls jump,
 * the rows in view are pinned where they are (`sticky`, top and bottom),
 * so the compositor keeps them in view until the next ones are there. The
 * pins are set in the render of the press or of the scroll itself, from
 * where the list puts the rows: no layout is read for them.
 */
describe("Table virtualized pins its rows during a scrollbar drag", () => {
  /** How far the container is scrolled. */
  let scrolled = 0

  beforeEach(() => {
    scrolled = 0
    // The container 400 px square, its scrollbar the last 10 px.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390)
    const rect = vi.mocked(Element.prototype.getBoundingClientRect)
    const laidOut = rect.getMockImplementation()!
    rect.mockImplementation(function (this: Element) {
      if ((this as HTMLElement).dataset.slot === "table-container")
        return {
          ...laidOut.call(this),
          top: 0,
          bottom: VIEW,
          height: VIEW,
          left: 0,
          right: 400,
          width: 400,
        }
      return laidOut.call(this)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const scrollBy = (top: number) => {
    scrolled = top
    scrollTo(top)
  }
  const pinned = () => bodyRows().filter((row) => row.style.position)
  /** Where a row is laid out in the view (the header's top at 0). */
  const placeOf = (row: HTMLElement) =>
    HEADER + Number(row.dataset.index) * ROW - scrolled
  /** The rows rendered that show in the view, the ones pinned. */
  const inView = () =>
    bodyRows().filter((row) => placeOf(row) + ROW > 0 && placeOf(row) < VIEW)

  /** Every row in view pinned where it is laid out, and no other. */
  function expectPinnedInPlace() {
    const rows = inView()
    expect(rows.length).toBeGreaterThanOrEqual(
      Math.floor((VIEW - HEADER) / ROW)
    )
    expect(pinned()).toEqual(rows)
    for (const row of rows) {
      expect(row.style.position).toBe("sticky")
      expect(parseFloat(row.style.top)).toBeCloseTo(placeOf(row), 5)
      expect(parseFloat(row.style.bottom)).toBeCloseTo(
        VIEW - placeOf(row) - ROW,
        5
      )
    }
  }

  it("pins the rows in view where they are while the scrollbar is pressed", () => {
    vi.useFakeTimers()
    render(<Wells />)
    scrollBy(HEADER + 30 * ROW)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(pinned()).toHaveLength(0)
    // On the scrollbar: past the container's client width. The browser
    // targets the element around the container (Chromium) or the container.
    fireEvent.pointerDown(container().parentElement!, {
      clientX: 395,
      clientY: 100,
    })
    // A viewport of rows beyond each edge is rendered, and not pinned.
    expect(bodyRows().length).toBeGreaterThan(inView().length)
    expectPinnedInPlace()
    // Each scroll of the drag pins the rows it renders, in that render.
    scrollBy(HEADER + 6_000 * ROW)
    expect(screen.getByText("Well 6000")).toBeInTheDocument()
    expectPinnedInPlace()
    scrollBy(HEADER + 6_003 * ROW + 7)
    expectPinnedInPlace()
    // Pressed, the pointer may leave the scrollbar.
    fireEvent.pointerMove(document.body, {
      clientX: 600,
      clientY: 100,
      buttons: 1,
    })
    expectPinnedInPlace()
    fireEvent.pointerUp(document.body, { clientX: 600, clientY: 100 })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(pinned()).toHaveLength(0)
  })

  it("pins the rows in view from when the pointer is on the scrollbar", () => {
    render(<Wells />)
    // The drag's first frame is the compositor's: pinned before the press.
    fireEvent.pointerMove(container().parentElement!, {
      clientX: 395,
      clientY: 100,
    })
    expectPinnedInPlace()
    fireEvent.pointerMove(container(), { clientX: 200, clientY: 100 })
    expect(pinned()).toHaveLength(0)
    fireEvent.pointerMove(container(), { clientX: 398, clientY: 300 })
    expectPinnedInPlace()
    // Out of the page.
    fireEvent.pointerOut(container(), { relatedTarget: null })
    expect(pinned()).toHaveLength(0)
  })

  it("does not pin for a press on the rows or outside the table", () => {
    render(<Wells />)
    fireEvent.pointerDown(container(), { clientX: 100, clientY: 100 })
    fireEvent.pointerDown(bodyRows()[2], { clientX: 395, clientY: 100 })
    fireEvent.pointerDown(container().parentElement!, {
      clientX: 405,
      clientY: 100,
    })
    expect(pinned()).toHaveLength(0)
    fireEvent.pointerDown(container(), { clientX: 395, clientY: 100 })
    expectPinnedInPlace()
  })

  it("pins the rows of a jump until the scrolling settles", () => {
    vi.useFakeTimers()
    render(<Wells />)
    // A jump the page saw no press for (the End key, a script).
    scrollBy(HEADER + 7_000 * ROW)
    expect(screen.getByText("Well 7000")).toBeInTheDocument()
    expectPinnedInPlace()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(pinned()).toHaveLength(0)
    for (const row of bodyRows()) {
      expect(row.style.top).toBe("")
      expect(row.style.bottom).toBe("")
    }
  })

  it("renders and pins a DataTable's rows in the render of each jump", () => {
    render(<Readings />)
    fireEvent.pointerDown(container(), { clientX: 395, clientY: 100 })
    // A thumb drag: a jump each frame, no timer or transition run between.
    for (const row of [70_000, 30_000, 99_990]) {
      scrollBy(HEADER + row * ROW)
      expect(screen.getByText(`Reading ${row}`)).toBeInTheDocument()
      expectPinnedInPlace()
    }
  })
})

type Reading = { id: string; name: string }

const READINGS: Array<Reading> = Array.from({ length: 100_000 }, (_, i) => ({
  id: `r${i}`,
  name: `Reading ${i}`,
}))

/** Each call is a row drawing its cell. */
const readingRenders = vi.fn((reading: Reading) => reading.name)

const READING_COLUMNS = createColumns<Reading>([
  { id: "name", header: "Reading", cell: readingRenders },
])

function Readings() {
  return (
    <div style={{ height: VIEW }}>
      <DataTable
        items={READINGS}
        columns={READING_COLUMNS}
        selectionMode="multiple"
      >
        <DataTableContent aria-label="Readings" virtualized />
      </DataTable>
    </div>
  )
}

/**
 * A scroll of a virtualized DataTable costs about what a plain Table's
 * does: the rows staying in view are not rendered again, and nothing reads
 * layout (the grid's tab stop is looked after from the rows that changed,
 * not by checking the table's layout), so the browser lays the table out
 * once, when it paints. While the scrollbar is dragged, the rows a jump
 * brings take the place of the rows that left, updated in place; they get
 * their own once the scrolling settles.
 */
describe("DataTable virtualized scrolls", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const layoutReads = () => {
    const rects = vi.spyOn(Element.prototype, "getClientRects")
    const boxes = vi.mocked(Element.prototype.getBoundingClientRect)
    const styles = vi.spyOn(window, "getComputedStyle")
    rects.mockClear()
    boxes.mockClear()
    styles.mockClear()
    return () =>
      rects.mock.calls.length +
      boxes.mock.calls.length +
      styles.mock.calls.length
  }

  it("reads no layout and renders only the rows a scroll brings", async () => {
    render(<Readings />)
    // The table's tab stop (its first row) stays in view.
    expect(bodyRows()[0]).toHaveAttribute("tabindex", "0")
    const reads = layoutReads()
    readingRenders.mockClear()
    // Two rows on: two rows come into the window, the rest stay as they are.
    scrollTo(2 * ROW)
    expect(reads()).toBe(0)
    expect(readingRenders.mock.calls.length).toBeGreaterThan(0)
    expect(readingRenders.mock.calls.length).toBeLessThanOrEqual(3)
    // The checkboxes of the rows mounted are out of the Tab order too, once
    // the grid has seen them come (before the browser paints): the table
    // stays one tab stop.
    await act(async () => {})
    const stops = [
      ...document.querySelectorAll('[data-slot="table-body"] [tabindex="0"]'),
    ]
    expect(stops).toHaveLength(1)
  })

  it("updates the rows in place through a jump, and gives each its own once it settles", () => {
    vi.useFakeTimers()
    render(<Readings />)
    const before = bodyRows()
    const reads = layoutReads()
    readingRenders.mockClear()
    scrollTo(HEADER + 50_000 * ROW)
    expect(reads()).toBe(0)
    expect(screen.getByText("Reading 50000")).toBeInTheDocument()
    const jumped = bodyRows()
    // Every row of the jump is a row that was there, drawn once with the
    // row it now is.
    expect(jumped.every((row) => before.includes(row))).toBe(true)
    expect(readingRenders.mock.calls.length).toBe(jumped.length)
    for (const row of jumped) {
      const index = Number(row.dataset.index)
      expect(row).toHaveAttribute("aria-rowindex", String(index + 2))
      expect(row).toHaveTextContent(`Reading ${index}`)
      // Its checkbox names it, and selects it.
      expect(within(row).getByRole("checkbox")).toHaveAccessibleName(
        `Select Reading ${index}`
      )
    }
    expect(document.querySelector("tbody")).toHaveAttribute("data-recycling")
    fireEvent.click(within(jumped[2]).getByRole("checkbox"))
    expect(jumped[2]).toHaveAttribute("aria-selected", "true")
    expect(
      bodyRows().filter((row) => row.getAttribute("aria-selected") === "true")
    ).toEqual([jumped[2]])
    // Settled: each row is its own again.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(document.querySelector("tbody")).not.toHaveAttribute(
      "data-recycling"
    )
    const settled = bodyRows()
    expect(settled.some((row) => before.includes(row))).toBe(false)
    const selected = settled.filter(
      (row) => row.getAttribute("aria-selected") === "true"
    )
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveAttribute("data-index", jumped[2].dataset.index)
  })

  it("keeps the focused row through a jump and back", () => {
    vi.useFakeTimers()
    render(<Readings />)
    const row = bodyRows()[3]
    act(() => row.focus())
    expect(row).toHaveFocus()
    scrollTo(HEADER + 70_000 * ROW)
    expect(screen.getByText("Reading 70000")).toBeInTheDocument()
    // Kept mounted, with its own content, and focus.
    expect(row).toHaveFocus()
    expect(row).toHaveAttribute("data-index", "3")
    expect(row).toHaveTextContent("Reading 3")
    expect(row).toHaveAttribute("tabindex", "0")
    scrollTo(HEADER + 70_500 * ROW)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(row).toHaveFocus()
    expect(row).toHaveTextContent("Reading 3")
    scrollTo(0)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(row).toHaveFocus()
    expect(screen.getByText("Reading 0")).toBeInTheDocument()
  })
})
