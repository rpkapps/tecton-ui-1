import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableSearch,
} from "@tecton/react/tecton/data-table"

import { checkbox, focusRow, layout, press } from "./data-table-fixtures"

type Item = { id: string; name: string; depth: number }

const MANY: Array<Item> = Array.from({ length: 100_000 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: (i * 7919) % 100_000,
}))

/** Generous: jsdom is many times slower than a browser; this catches work per row, not speed. */
const LIMIT_MS = 3_000

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable at 100,000 rows", () => {
  // The row header's text, read for type-ahead and announcements only.
  const names = vi.fn((item: Item) => item.name)
  const columns = createColumns<Item>([
    { id: "name", header: "Well", accessor: names },
    { id: "depth", header: "Depth", type: "number" },
  ])
  const isItemDisabled = vi.fn((item: Item) => item.id === "w5")

  function Many() {
    const [value, setValue] = React.useState<ReadonlyArray<string>>([])
    return (
      <div style={{ height: 400 }}>
        <DataTable
          items={MANY}
          columns={columns}
          selectionMode="multiple"
          value={value}
          onValueChange={setValue}
          isItemDisabled={isItemDisabled}
        >
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
  }

  const timed = (fn: () => void) => {
    names.mockClear()
    isItemDisabled.mockClear()
    const start = performance.now()
    act(fn)
    return performance.now() - start
  }
  const header = () => screen.getByRole("checkbox", { name: "Select All" })
  const sort = () =>
    fireEvent.click(
      screen
        .getByRole("columnheader", { name: "Depth" })
        .querySelector("button")!
    )

  it("selects, selects all and sorts without reading every row", () => {
    layout()
    render(<Many />)

    // One checkbox: the rows are not asked again whether they are disabled.
    expect(timed(() => fireEvent.click(checkbox("Well 0")))).toBeLessThan(
      LIMIT_MS
    )
    expect(isItemDisabled).not.toHaveBeenCalled()

    // Select all from the header, and the header state after a sort: from
    // the engine's ids, no row described or formatted.
    expect(timed(() => fireEvent.click(header()))).toBeLessThan(LIMIT_MS)
    expect(header()).toHaveAttribute("aria-checked", "true")
    expect(isItemDisabled).not.toHaveBeenCalled()
    expect(names.mock.calls.length).toBeLessThan(500)

    expect(timed(sort)).toBeLessThan(LIMIT_MS)
    expect(header()).toHaveAttribute("aria-checked", "true")
    expect(names.mock.calls.length).toBeLessThan(500)

    // Everything selected: one checkbox, then Ctrl + A.
    const first = document.querySelector('tbody th[scope="row"]')!.textContent
    expect(timed(() => fireEvent.click(checkbox(first)))).toBeLessThan(LIMIT_MS)
    expect(header()).toHaveAttribute("aria-checked", "mixed")
    focusRow(first)
    expect(timed(() => press("a", { ctrlKey: true }))).toBeLessThan(LIMIT_MS)
    expect(header()).toHaveAttribute("aria-checked", "true")
    expect(names.mock.calls.length).toBeLessThan(500)
    expect(isItemDisabled).not.toHaveBeenCalled()

    // A sort with everything selected.
    expect(timed(sort)).toBeLessThan(LIMIT_MS)
    expect(names.mock.calls.length).toBeLessThan(500)
  }, 60_000)

  it("searches as the user types, rendering only the rows the result shows", () => {
    layout()
    // How many cells render: a keystroke renders the rows in view that
    // changed, never every row.
    const cell = vi.fn((item: Item) => item.depth)
    const searched = createColumns<Item>([
      { id: "name", header: "Well" },
      { id: "depth", header: "Depth", type: "number", cell },
    ])
    render(
      <div style={{ height: 400 }}>
        <DataTable items={MANY} columns={searched} filterable>
          <DataTableSearch />
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
    const box = screen.getByRole("searchbox", { name: "Search" })
    const type = (value: string) => {
      cell.mockClear()
      const start = performance.now()
      act(() => {
        fireEvent.change(box, { target: { value } })
      })
      return performance.now() - start
    }
    // The first search builds the index.
    expect(type("Well 9")).toBeLessThan(LIMIT_MS)
    expect(cell.mock.calls.length).toBeLessThan(100)
    expect(type("Well 99")).toBeLessThan(LIMIT_MS)
    expect(cell.mock.calls.length).toBeLessThan(100)
    expect(type("Well 999")).toBeLessThan(LIMIT_MS)
    expect(
      document.querySelectorAll("tbody tr[data-index]").length
    ).toBeLessThan(100)
    // A key the result does not change (a trailing space) renders no row.
    type("Well 999 ")
    expect(cell).not.toHaveBeenCalled()
  }, 60_000)
})
