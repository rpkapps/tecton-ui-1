/**
 * Live data's content module (`live-rows.tsx`) loads on demand: a table
 * without `highlightChanges` never loads it, one with it loads it as it
 * mounts, and rows added before it arrives are highlighted once it has.
 */
import * as React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

const loads = vi.hoisted(() => ({ count: 0 }))

vi.mock("../internal/data-table/live-rows", async (importOriginal) => {
  loads.count++
  return importOriginal()
})

type Reading = { id: string; name: string }

const reading = (n: number): Reading => ({ id: `r${n}`, name: `Reading ${n}` })
const READINGS = [reading(1), reading(2), reading(3)]

const columns = createColumns<Reading>([{ id: "name", header: "Reading" }])

function Live({
  items = READINGS,
  live = true,
}: {
  items?: Array<Reading>
  live?: boolean
}) {
  return (
    <DataTable items={items} columns={columns} highlightChanges={live}>
      <DataTableContent aria-label="Readings" />
    </DataTable>
  )
}

describe("DataTable highlightChanges: the content's live module", () => {
  it("is never loaded for a table without highlightChanges", async () => {
    const { rerender } = render(<Live live={false} />)
    rerender(<Live live={false} items={[...READINGS, reading(4)]} />)
    // Past the idle prefetch's longest wait.
    await act(() => new Promise((resolve) => setTimeout(resolve, 2300)))
    expect(loads.count).toBe(0)
  })

  it("loads as a table with it mounts; rows added before it came are highlighted once it has", async () => {
    const { rerender } = render(<Live />)
    rerender(<Live items={[...READINGS, reading(4)]} />)
    await waitFor(() =>
      expect(screen.getByText("Reading 4").closest("tr")).toHaveAttribute(
        "data-live-added"
      )
    )
    expect(loads.count).toBe(1)
  })
})
