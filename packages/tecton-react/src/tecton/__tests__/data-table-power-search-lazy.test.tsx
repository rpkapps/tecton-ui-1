/**
 * The power search's query layer on demand: a table with the plain search
 * never loads it; with `syntax="query"` the plain field renders at once,
 * the layer loads in idle time or on focus, and what was typed before it
 * arrived is kept, read and applied, focus and caret where they were.
 */
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  DataTableSearch,
} from "@tecton/react/data-table"

import { columns, WELLS } from "./data-table-fixtures"

/** The query layer arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock("../internal/data-table/query-search", async (importOriginal) => {
  chunk.requested()
  await chunk.gate
  return importOriginal()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DataTableSearch syntax=query on demand", () => {
  it("never loads the query layer for the plain search, even in idle time", async () => {
    const idle: Array<() => void> = []
    vi.stubGlobal("requestIdleCallback", (task: () => void) => {
      idle.push(task)
      return idle.length
    })
    vi.stubGlobal("cancelIdleCallback", () => {})
    const user = userEvent.setup({ delay: null })
    render(
      <DataTable items={WELLS} columns={columns} filterable>
        <DataTableSearch />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    act(() =>
      idle.forEach((task) =>
        (task as (deadline: IdleDeadline) => void)({
          didTimeout: false,
          timeRemaining: () => 50,
        })
      )
    )
    await user.click(screen.getByRole("searchbox", { name: "Search" }))
    await user.type(screen.getByRole("searchbox"), "status:drilling")
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(chunk.requested).not.toHaveBeenCalled()
  })

  it("renders the plain field at once, loads on focus, and keeps what was typed meanwhile", async () => {
    const onViewChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        filterable
        onViewChange={onViewChange}
      >
        <DataTableSearch syntax="query" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const plain = screen.getByRole("textbox", { name: "Search" })
    expect(plain).toHaveAttribute("placeholder", "Search or filter")
    // The help's button is there already, the field the same size.
    expect(
      screen.getByRole("button", { name: "Search syntax" })
    ).toBeInTheDocument()
    await user.click(plain)
    await waitFor(() => expect(chunk.requested).toHaveBeenCalled())
    await user.type(plain, "status:drilling well")
    // Not applied as text: the query layer reads it once it is here.
    expect(onViewChange).not.toHaveBeenCalled()
    // The caret moved back into the text.
    await user.keyboard("{Home}{ArrowRight>6/}")
    await act(async () => chunk.open())
    const field = await screen.findByRole("combobox", { name: "Search" })
    expect(field).toHaveValue("status:drilling well")
    expect(field).toHaveFocus()
    expect((field as HTMLInputElement).selectionStart).toBe(6)
    await waitFor(() =>
      expect(onViewChange.mock.calls.at(-1)?.[0]).toMatchObject({
        filters: { status: { type: "options", values: ["drilling"] } },
        search: "well",
      })
    )
  })
})
