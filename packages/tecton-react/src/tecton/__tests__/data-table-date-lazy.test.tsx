import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  DataTableFilter,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

import { columns, WELLS } from "./data-table-fixtures"

/** The date filter's calendar arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock("../internal/date-calendar", async (importOriginal) => {
  chunk.requested()
  await chunk.gate
  return importOriginal()
})

describe("DataTable date filter on demand", () => {
  it("loads the calendar in idle time, not on mount; the popover keeps its size meanwhile; the calendar is in the provider's locale", async () => {
    let idle: (() => void) | null = null
    vi.stubGlobal("requestIdleCallback", (task: () => void) => {
      idle = task
      return 1
    })
    vi.stubGlobal("cancelIdleCallback", () => {})
    const user = userEvent.setup()
    const { unmount } = render(
      <TectonProvider locale="de-DE">
        <DataTable items={WELLS} columns={columns} filterable>
          <DataTableFilter column="spud" />
          <DataTableContent aria-label="Wells" />
        </DataTable>
      </TectonProvider>
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(chunk.requested).not.toHaveBeenCalled()
    act(() => idle?.())
    await waitFor(() => expect(chunk.requested).toHaveBeenCalled())
    await user.click(
      await screen.findByRole("button", { name: "Nach Spud date filtern" })
    )
    const dialog = await screen.findByRole("dialog", { name: "Spud date" })
    // The calendar's place, as big as its two months.
    expect(
      dialog.querySelector('[data-slot="date-picker-loading"]')
    ).not.toBeNull()
    await act(async () => chunk.open())
    // In German, from the calendar's own locale chunk.
    expect(
      await within(dialog).findAllByRole("grid", {}, { timeout: 10_000 })
    ).toHaveLength(2)
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Zum nächsten Monat" })
      ).toBeInTheDocument()
    )
    unmount()
    vi.unstubAllGlobals()
  }, 20_000)
})
