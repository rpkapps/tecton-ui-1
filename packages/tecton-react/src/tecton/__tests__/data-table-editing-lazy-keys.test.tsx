/**
 * Keys after one that edits, before the editing code has loaded (§7): the
 * characters typed after Enter go after the cell's value (Backspace taking
 * one back); Escape drops an edit waiting, a
 * composition's too; once the code is there, a composition's key opens an
 * empty editor at once.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

/** The editing code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open() }
})
vi.mock("../internal/data-table/editing/index", async (importOriginal) => {
  await chunk.gate
  return importOriginal()
})

type Well = { id: string; name: string; remarks: string }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  { id: "remarks", header: "Remarks" },
])

const td = (well: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>('[data-column="remarks"]')!
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })

describe("DataTable editing: keys after one that edits, before the code", () => {
  it("puts characters typed after Enter after the value, and drops an edit waiting on Escape", async () => {
    render(
      <DataTable
        items={[
          { id: "w0", name: "Well 0", remarks: "ESP" },
          { id: "w1", name: "Well 1", remarks: "Gas lift" },
        ]}
        columns={columns}
        editable
        onCellsChange={() => {}}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    fireEvent.mouseDown(td("Well 1"), { button: 0 })
    press("Process", { keyCode: 229 })
    press("x")
    press("Escape")
    fireEvent.mouseDown(td("Well 0"), { button: 0 })
    press("Enter")
    for (const key of [" ", "o", "k", "!", "Backspace"]) press(key)
    await act(async () => chunk.open())
    await waitFor(() => expect(focused().tagName).toBe("INPUT"))
    // In an edit, Space types a space.
    expect(focused()).toHaveValue("ESP ok")
    expect(td("Well 0")).toContainElement(focused())
    press("Escape")
    fireEvent.mouseDown(td("Well 1"), { button: 0 })
    expect(press("Process", { keyCode: 229 })).toBe(true)
    expect(focused()).toHaveValue("")
  })
})
