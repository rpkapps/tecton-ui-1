import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

/** The column drag and drop's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open() }
})
vi.mock("../internal/data-table/column-reorder", async (importOriginal) => {
  await chunk.gate
  return importOriginal()
})

type Well = { id: string; name: string; field: string }

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
])

describe("DataTable column reordering on demand", () => {
  it("gives up a keyboard pick-up asked for before the code came once another key is pressed", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <DataTable
        items={[{ id: "a12", name: "34/10-A-12", field: "Gullfaks" }]}
        columns={columns}
        reorderableColumns
        onViewChange={onViewChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const header = screen.getByRole("columnheader", { name: "Field" })
    act(() => header.focus())
    await user.keyboard("{Enter}")
    await user.keyboard("{ArrowLeft}")
    await act(async () => chunk.open())
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-column-drop-indicator"]')
      ).not.toBeNull()
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    // No drag started: focus is not on a drop target.
    expect(
      document.activeElement?.getAttribute("aria-label") ?? ""
    ).not.toMatch(/^Insert/)
    expect(onViewChange).not.toHaveBeenCalled()
  })
})
