import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

/** The column drag and drop's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock("../internal/data-table/column-reorder", async (importOriginal) => {
  chunk.requested()
  await chunk.gate
  return importOriginal()
})

type Well = { id: string; name: string; field: string; depth: number }

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", depth: 3250 },
  { id: "d2", name: "34/7-D-2", field: "Snorre", depth: 2735 },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "depth", header: "TD (m)", type: "number" },
])

const head = () => document.querySelector("thead")!.outerHTML
const header = (name: string) => screen.getByRole("columnheader", { name })
const indicator = () =>
  document.querySelector('[data-slot="data-table-column-drop-indicator"]')

describe("DataTable column reordering on demand", () => {
  it("loads nothing for a table that does not reorder its columns", async () => {
    render(
      <DataTable items={WELLS} columns={columns}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(chunk.requested).not.toHaveBeenCalled()
  })

  it("draws the headers as they will be, loads the code in idle time (not on mount), and starts a keyboard drag asked for before it came", async () => {
    // Idle time comes when the test says.
    let idle: (() => void) | null = null
    vi.stubGlobal("requestIdleCallback", (task: () => void) => {
      idle = task
      return 1
    })
    vi.stubGlobal("cancelIdleCallback", () => {})
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        reorderableColumns
        onViewChange={onViewChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(header("Field")).toHaveAttribute("tabindex")
    expect(header("Field")).toHaveClass("cursor-grab")
    expect(header("Field")).toHaveAccessibleDescription("Drag Field")
    // Not on mount: in idle time.
    // Not on mount…
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(chunk.requested).not.toHaveBeenCalled()
    // …but in idle time.
    act(() => idle?.())
    await waitFor(() => expect(chunk.requested).toHaveBeenCalled())
    // Enter before it has arrived waits for it.
    act(() => header("Field").focus())
    await user.keyboard("{Enter}")
    expect(onViewChange).not.toHaveBeenCalled()
    expect(indicator()).toBeNull()
    const before = head()

    await act(async () => chunk.open())
    await waitFor(() => expect(indicator()).not.toBeNull())
    // The header is the same: only its handlers have changed.
    expect(head()).toBe(before)
    // The drag asked for has started.
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute(
        "aria-label",
        "Insert between Well and TD (m)"
      )
    )
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert after TD (m)"
    )
    await user.keyboard("{Enter}")
    expect(onViewChange.mock.calls.at(-1)?.[0].columns.order).toEqual([
      "name",
      "depth",
      "field",
    ])
    expect(onViewChange.mock.calls.at(-1)?.[1].reason).toBe("reorder")
    fireEvent.keyDown(document, { key: "Escape" })
  })
})
