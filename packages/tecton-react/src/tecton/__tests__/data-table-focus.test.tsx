import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableActionBar,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
  type DataTableProps,
} from "@tecton/react/tecton/data-table"

import {
  checkbox,
  columns,
  focused,
  focusRow,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

function Wells({
  items = WELLS.slice(0, 6),
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={items} columns={columns} {...props}>
      <DataTableContent aria-label="Wells" />
      {children}
    </DataTable>
  )
}

/** The grid puts focus back after the DOM settles (a microtask). */
const settle = () => act(() => Promise.resolve())

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable focus", () => {
  it("moves focus from the action bar's Select all N to its Clear, then gives it to the table as the bar goes", async () => {
    render(
      <Wells
        items={WELLS}
        selectionMode="multiple"
        pagination
        defaultPageSize={5}
      >
        <DataTableActionBar />
        <DataTableFooter>
          <DataTablePagination />
        </DataTableFooter>
      </Wells>
    )
    for (let i = 1; i <= 5; i++) fireEvent.click(checkbox(`Well 0${i}`))
    const action = screen.getByRole("button", { name: "Select all 23" })
    act(() => action.focus())
    fireEvent.click(action)
    // It goes once every row is selected: focus on the bar's Clear.
    expect(screen.queryByRole("button", { name: "Select all 23" })).toBeNull()
    const clear = focused()
    expect(clear.closest('[data-slot="action-bar-selection"]')).not.toBeNull()
    expect(clear).toHaveRole("button")
    // The count is a live region: its changes are read.
    expect(
      document.querySelector(
        '[data-slot="action-bar-selection"] [aria-live="polite"]'
      )
    ).not.toBeNull()
    fireEvent.click(clear)
    expect(
      document.querySelector('[data-slot="data-table-action-bar"]')
    ).toBeNull()
    expect(focused().closest("table")).toBe(screen.getByRole("grid"))
  })

  it("focuses the row now in the place of a focused row that goes", async () => {
    const { rerender } = render(<Wells />)
    focusRow("Well 03")
    rerender(<Wells items={WELLS.slice(0, 6).filter((w) => w.id !== "w3")} />)
    await settle()
    expect(focused()).toBe(row("Well 04"))
    // The last row going: the one before it.
    focusRow("Well 06")
    rerender(
      <Wells
        items={WELLS.slice(0, 6).filter((w) => !["w3", "w6"].includes(w.id))}
      />
    )
    await settle()
    expect(focused()).toBe(row("Well 05"))
  })

  it("focuses the cell in the same column when the focused cell's row goes", async () => {
    const { rerender } = render(<Wells />)
    focusRow("Well 02")
    fireEvent.keyDown(focused(), { key: "ArrowRight" })
    fireEvent.keyDown(focused(), { key: "ArrowRight" })
    expect(focused()).toHaveTextContent("Statfjord")
    rerender(<Wells items={WELLS.slice(0, 6).filter((w) => w.id !== "w2")} />)
    await settle()
    // Well 03's Field cell.
    expect(focused()).toHaveTextContent("Snorre")
  })

  it("moves focus to Retry when an error takes the rows' place", async () => {
    const { rerender } = render(<Wells onRetry={() => {}} />)
    focusRow("Well 02")
    rerender(<Wells onRetry={() => {}} error />)
    await settle()
    expect(focused()).toBe(screen.getByRole("button", { name: "Retry" }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The rows could not be loaded"
    )
    // Retried and loaded: the state goes, focus goes back to the row's place.
    rerender(<Wells onRetry={() => {}} />)
    await settle()
    expect(focused()).toBe(row("Well 02"))
  })

  it("moves focus to the rows when Clear filters brings them back", async () => {
    render(<Wells filterable defaultView={{ search: "nothing like this" }} />)
    const clear = screen.getByRole("button", { name: "Clear filters" })
    act(() => clear.focus())
    fireEvent.click(clear)
    await settle()
    await waitFor(() => expect(focused()).toBe(row("Well 01")))
  })

  it("leaves focus alone after it left the table for the page, when the row then goes", async () => {
    const { rerender } = render(<Wells />)
    focusRow("Well 03")
    act(() => row("Well 03").blur())
    await settle()
    expect(document.activeElement).toBe(document.body)
    rerender(<Wells items={WELLS.slice(0, 6).filter((w) => w.id !== "w3")} />)
    await settle()
    expect(document.activeElement).toBe(document.body)
  })

  it("leaves focus in an outside input when the app clears the selection", async () => {
    function Owner() {
      const [value, setValue] = React.useState<ReadonlyArray<string>>([])
      return (
        <>
          <input aria-label="Note" />
          <button type="button" onClick={() => setValue([])}>
            Reset
          </button>
          <Wells
            items={WELLS}
            selectionMode="multiple"
            pagination
            defaultPageSize={5}
            value={value}
            onValueChange={setValue}
          >
            <DataTableActionBar />
          </Wells>
        </>
      )
    }
    render(<Owner />)
    for (let i = 1; i <= 5; i++) fireEvent.click(checkbox(`Well 0${i}`))
    const action = screen.getByRole("button", { name: "Select all 23" })
    act(() => action.focus())
    fireEvent.click(action)
    // To the page, then into an input outside the table.
    act(() => focused().blur())
    await settle()
    const input = screen.getByRole("textbox", { name: "Note" })
    act(() => input.focus())
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    await settle()
    expect(focused()).toBe(input)
    // Blurred to the page and cleared from outside: focus stays on the page.
    for (let i = 1; i <= 5; i++) fireEvent.click(checkbox(`Well 0${i}`))
    const again = screen.getByRole("button", { name: "Select all 23" })
    act(() => again.focus())
    fireEvent.click(again)
    act(() => focused().blur())
    await settle()
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    await settle()
    expect(document.activeElement).toBe(document.body)
  })

  it("leaves focus that went elsewhere on the page alone", async () => {
    const { rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <Wells />
      </>
    )
    focusRow("Well 03")
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" })
    act(() => elsewhere.focus())
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Wells items={WELLS.slice(0, 2)} />
      </>
    )
    await settle()
    expect(focused()).toBe(elsewhere)
  })
})
