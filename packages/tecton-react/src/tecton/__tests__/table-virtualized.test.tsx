import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

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

  it("locks the columns at their first widths while rows scroll", () => {
    render(<Wells />)
    const cols = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="table-virtual-columns"] col'
        )
      ).map((col) => col.style.width)
    expect(cols()).toEqual(["75%", "25%"])
    expect(screen.getByRole("table")).toHaveClass("table-fixed")
    scrollTo(HEADER + 5_000 * ROW)
    expect(screen.getByText("Well 5000")).toBeInTheDocument()
    expect(cols()).toEqual(["75%", "25%"])
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
