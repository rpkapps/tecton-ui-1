import * as React from "react"
import { act, fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DataTable, DataTableContent } from "@tecton/react/data-table"

import { checkbox, columns, row, WELLS } from "./data-table-fixtures"

/** Each `TableRow` and `TableBody` render, counted through the hooks they call. */
const renders = vi.hoisted(() => ({ rows: 0, bodies: 0 }))
vi.mock("../internal/table-grid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../internal/table-grid")>()
  return {
    ...actual,
    useTableRow: (props: React.ComponentProps<"tr">) => {
      renders.rows++
      return actual.useTableRow(props)
    },
  }
})
vi.mock("../internal/table-virtualizer", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../internal/table-virtualizer")>()
  return {
    ...actual,
    useVirtualRows: (props: Parameters<typeof actual.useVirtualRows>[0]) => {
      renders.bodies++
      return actual.useVirtualRows(props)
    },
  }
})

describe("DataTable renders on a selection change", () => {
  it.each([false, true])(
    "only the rows whose selection changed (virtualized: %s)",
    (virtualized) => {
      render(
        <div style={{ height: 400 }}>
          <DataTable items={WELLS} columns={columns} selectionMode="multiple">
            <DataTableContent aria-label="Wells" virtualized={virtualized} />
          </DataTable>
        </div>
      )
      act(() => row("Well 03").focus())
      renders.rows = 0
      renders.bodies = 0
      fireEvent.click(checkbox("Well 03"))
      expect(checkbox("Well 03")).toBeChecked()
      expect(renders.bodies).toBe(0)
      expect(renders.rows).toBe(1)
    }
  )
})
