/**
 * Editing 100,000 virtualized rows (§8): an edit beginning or ending
 * renders only its row, typing renders no row (the editor alone), and the
 * row being edited stays rendered, its draft with it, while it is scrolled
 * out of view.
 */
import * as React from "react"
import { act, fireEvent, render } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

import type * as TableModule from "@tecton/react/components/table"

import { loadFeature } from "../internal/data-table/lazy"
import { layout, scrollable } from "./data-table-fixtures"

/** Every render of a row (`TableRow`), counted. */
const renders = vi.hoisted(() => ({ rows: 0 }))
vi.mock("@tecton/react/components/table", async (importOriginal) => {
  const actual = await importOriginal<typeof TableModule>()
  return {
    ...actual,
    TableRow: (props: React.ComponentProps<"tr">) => {
      renders.rows++
      return actual.TableRow(props)
    },
  }
})

type Item = { id: string; name: string; oil: number; water: number }

const MANY: Array<Item> = Array.from({ length: 100_000 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  oil: (i * 7919) % 10_000,
  water: i % 1000,
}))

/** Generous: jsdom is many times slower than a browser; this catches work per row, not speed. */
const LIMIT_MS = 3_000

beforeAll(async () => {
  await loadFeature("editing")
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable editing at 100,000 rows", () => {
  it("renders only the row edited, never a row as the user types, and keeps it while scrolled away", () => {
    layout()
    const oil = vi.fn((item: Item) => item.oil)
    const columns = createColumns<Item>([
      { id: "name", header: "Well", editable: false },
      { id: "oil", header: "Oil", type: "number", accessor: oil },
      { id: "water", header: "Water", type: "number" },
    ])
    const onCellsChange = vi.fn()
    render(
      <div style={{ height: 400 }}>
        <DataTable
          items={MANY}
          columns={columns}
          editable
          onCellsChange={onCellsChange}
        >
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
    scrollable()
    const cell = (row: number, column: string) =>
      document
        .querySelector(`tbody tr[data-index="${row}"]`)!
        .querySelector<HTMLElement>(`[data-column="${column}"]`)!
    const field = () => document.activeElement as HTMLInputElement
    const timed = (fn: () => void) => {
      renders.rows = 0
      const start = performance.now()
      act(fn)
      return performance.now() - start
    }
    fireEvent.mouseDown(cell(2, "oil"), { button: 0 })

    // Opening: its row only.
    expect(
      timed(() => fireEvent.keyDown(cell(2, "oil"), { key: "Enter" }))
    ).toBeLessThan(LIMIT_MS)
    expect(renders.rows).toBe(1)
    expect(field().tagName).toBe("INPUT")

    // Typing: no row, nothing formatted again.
    oil.mockClear()
    for (const text of ["1", "12", "123"])
      timed(() => fireEvent.change(field(), { target: { value: text } }))
    expect(renders.rows).toBe(0)
    expect(oil).not.toHaveBeenCalled()

    // Scrolled far away, and back: the row stays, its draft too.
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    act(() => {
      container.scrollTop = 40 * 50_000
      fireEvent.scroll(container)
    })
    expect(
      document.querySelector('tbody tr[data-index="50000"]')
    ).not.toBeNull()
    expect(field()).toHaveValue("123")
    expect(cell(2, "oil")).toContainElement(field())
    act(() => {
      container.scrollTop = 0
      fireEvent.scroll(container)
    })
    expect(field()).toHaveValue("123")

    // Closing with a save that moves: its row; the row below only takes focus.
    oil.mockClear()
    expect(
      timed(() => fireEvent.keyDown(field(), { key: "Enter" }))
    ).toBeLessThan(LIMIT_MS)
    expect(renders.rows).toBeLessThanOrEqual(1)
    expect(onCellsChange).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(cell(3, "oil"))
    // Read for the cell saved only (its value before).
    expect(oil.mock.calls.length).toBeLessThanOrEqual(2)
  }, 60_000)
})
