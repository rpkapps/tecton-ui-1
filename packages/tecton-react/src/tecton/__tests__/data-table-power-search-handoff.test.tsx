/**
 * The power search's hand-off from the plain field, with the view's filters
 * set: the plain field shows the search only, so what is typed in it before
 * the query layer arrives joins the filters, never replaces them.
 */
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

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
  return { gate, open: () => open() }
})
vi.mock("../internal/data-table/query-search", async (importOriginal) => {
  await chunk.gate
  return importOriginal()
})

describe("DataTableSearch syntax=query: the hand-off keeps the view's filters", () => {
  it("puts what was typed early after the filters, the caret moved past them", async () => {
    const onViewChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        filterable
        defaultView={{
          filters: { status: { type: "options", values: ["drilling"] } },
        }}
        onViewChange={onViewChange}
      >
        <DataTableSearch syntax="query" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const plain = screen.getByRole("textbox", { name: "Search" })
    await user.click(plain)
    await user.type(plain, "gulx")
    await user.keyboard("{ArrowLeft}")
    await act(async () => chunk.open())
    const field = await screen.findByRole("combobox", { name: "Search" })
    const text = "status:drilling gulx"
    expect(field).toHaveValue(text)
    expect(field).toHaveFocus()
    expect((field as HTMLInputElement).selectionStart).toBe(text.length - 1)
    await waitFor(() =>
      expect(onViewChange.mock.calls.at(-1)?.[0]).toMatchObject({
        filters: { status: { type: "options", values: ["drilling"] } },
        search: "gulx",
      })
    )
    expect(
      onViewChange.mock.calls.some(([view]) => !("status" in view.filters))
    ).toBe(false)
  })
})
