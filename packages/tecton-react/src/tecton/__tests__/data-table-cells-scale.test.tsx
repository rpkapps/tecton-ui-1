/**
 * Cell selection at 100,000 rows (§8): a change of the selection renders
 * only the rows whose cells change, and never a cell's content again; select
 * all, copy and the summary read the engine, not the rows.
 */
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableCellSummary,
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

type Item = { id: string; name: string; depth: number; oil: number }

const MANY: Array<Item> = Array.from({ length: 100_000 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: (i * 7919) % 100_000,
  oil: i % 1000,
}))

/** Generous: jsdom is many times slower than a browser; this catches work per row, not speed. */
const LIMIT_MS = 3_000

beforeAll(async () => {
  await loadFeature("cellSelection")
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable cell selection at 100,000 rows", () => {
  it("renders only the rows whose cells change, and no cell's content", () => {
    layout()
    const depth = vi.fn((item: Item) => item.depth)
    const columns = createColumns<Item>([
      { id: "name", header: "Well" },
      { id: "depth", header: "Depth", type: "number", cell: depth },
      { id: "oil", header: "Oil", type: "number" },
    ])
    render(
      <div style={{ height: 400 }}>
        <DataTable items={MANY} columns={columns} cellSelectionMode="range">
          <DataTableContent aria-label="Wells" virtualized />
          <DataTableCellSummary />
        </DataTable>
      </div>
    )
    scrollable()
    const cell = (row: number, column: string) =>
      document
        .querySelector(`tbody tr[data-index="${row}"]`)!
        .querySelector<HTMLElement>(`[data-column="${column}"]`)!
    const timed = (fn: () => void) => {
      renders.rows = 0
      depth.mockClear()
      const start = performance.now()
      act(fn)
      return performance.now() - start
    }
    const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
      fireEvent.keyDown(document.activeElement!, { key, ...init })

    timed(() => fireEvent.mouseDown(cell(1, "depth"), { button: 0 }))
    // One row's cells change.
    expect(renders.rows).toBe(1)
    expect(depth).not.toHaveBeenCalled()

    // Its row, and the row the range grows to.
    expect(timed(() => press("ArrowDown", { shiftKey: true }))).toBeLessThan(
      LIMIT_MS
    )
    expect(renders.rows).toBe(2)
    expect(depth).not.toHaveBeenCalled()

    // Every row: the rows in view only, nothing formatted again.
    expect(timed(() => press("a", { ctrlKey: true }))).toBeLessThan(LIMIT_MS)
    const shown = document.querySelectorAll("tbody tr[data-index]").length
    expect(shown).toBeLessThan(100)
    expect(renders.rows).toBeLessThanOrEqual(shown)
    expect(depth).not.toHaveBeenCalled()
    expect(document.querySelectorAll('[aria-selected="true"]').length).toBe(
      shown * 3
    )

    // The summary of 300,000 cells, from the items.
    const summary = screen.getByRole("group", { name: "Selected cells" })
    expect(summary).toHaveTextContent("Count: 300,000")
    expect(summary).toHaveTextContent(
      `Numerical count: ${(200_000).toLocaleString("en-US")}`
    )

    // Escape: back to nothing selected.
    expect(timed(() => press("Escape"))).toBeLessThan(LIMIT_MS)
    expect(renders.rows).toBeLessThanOrEqual(shown)
    expect(document.querySelector('[aria-selected="true"]')).toBeNull()
  }, 60_000)
})
