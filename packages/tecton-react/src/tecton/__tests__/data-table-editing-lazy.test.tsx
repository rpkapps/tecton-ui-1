/**
 * Editing before its code has loaded (§7): nothing is asked for as an
 * editable table mounts (it is prefetched in idle time); the first focus
 * asks for it. Meanwhile an edit is the browser's own field, at once
 * (Escape dropping it); what it saved (a press on another cell) and a
 * boolean cell's checkbox toggled are written once the code comes, each
 * cell by its ids, and the editor takes over the field still open, with
 * its text and caret. The cell keeps its content under the field, so
 * nothing moves as it opens.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
} from "@tecton/react/tecton/data-table"

/** The editing code arrives when the test lets it; `asked`: imported. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), asked: 0 }
})
vi.mock("../internal/data-table/editing/index", async (importOriginal) => {
  chunk.asked++
  await chunk.gate
  return importOriginal()
})

type Well = { id: string; name: string; depth: number; active: boolean }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  { id: "depth", header: "Depth", type: "number" },
  { id: "active", header: "Active", type: "boolean" },
])

const WELLS: Array<Well> = Array.from({ length: 4 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: 1000 + i * 100,
  active: false,
}))

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DataTable editing before its code has loaded", () => {
  it("loads nothing on mount, keeps what the user did, and edits once the code comes", async () => {
    const idle = vi.fn((_task: () => void) => 1)
    vi.stubGlobal("requestIdleCallback", idle)
    vi.stubGlobal("cancelIdleCallback", () => {})
    const onCellsChange = vi.fn()
    const { unmount } = render(
      <DataTable
        items={WELLS}
        columns={columns}
        editable
        onCellsChange={onCellsChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    // Asked for in idle time, not on mount.
    await act(async () => {})
    expect(idle).toHaveBeenCalled()
    expect(chunk.asked).toBe(0)

    // A checkbox toggled: written once the code is there.
    fireEvent.click(screen.getByRole("checkbox", { name: "Active, Well 0" }))
    await waitFor(() => expect(chunk.asked).toBe(1))
    // An edit begun, at once, then dropped with Escape (kept from a dialog).
    fireEvent.mouseDown(td("Well 2", "depth"), { button: 0 })
    expect(press("9")).toBe(false)
    expect(focused()).toHaveValue("9")
    expect(press("Escape")).toBe(false)
    expect(focused()).toBe(td("Well 2", "depth"))
    // One begun, then left (a press on another cell): saved once the code
    // comes, as focus leaving it saves it.
    fireEvent.mouseDown(td("Well 3", "depth"), { button: 0 })
    press("5")
    // The one that stays: what is typed is the field's.
    fireEvent.mouseDown(td("Well 1", "depth"), { button: 0 })
    const user = userEvent.setup({ delay: null })
    await user.keyboard("12{Backspace}3{ArrowLeft}")
    const before = focused() as HTMLInputElement
    expect(before).toHaveValue("13")
    expect(onCellsChange).not.toHaveBeenCalled()

    await act(async () => chunk.open())
    await waitFor(() => expect(focused()).not.toBe(before))
    const field = focused() as HTMLInputElement
    expect(field.tagName).toBe("INPUT")
    expect(field).toHaveValue("13")
    expect(field.selectionStart).toBe(1)
    expect(td("Well 1", "depth")).toContainElement(field)
    expect(
      document.querySelectorAll('[data-slot="data-table-editor"]')
    ).toHaveLength(1)
    // The cell's content stays, unseen, under the editor: the cell keeps its size.
    const holder = td("Well 1", "depth").querySelector(
      '[data-slot="data-table-editor"] > [aria-hidden="true"]'
    )
    expect(holder).toHaveTextContent("1,100")
    expect(holder).toHaveClass("invisible")
    expect(
      (
        onCellsChange.mock.calls as Array<[Array<DataTableCellChange<Well>>]>
      ).map(([changes]) =>
        changes.map((change) => [change.row, change.column, change.value])
      )
    ).toEqual([[["w0", "active", true]], [["w3", "depth", 5]]])

    // From now on, at once.
    press("Enter")
    expect(focused()).toBe(td("Well 2", "depth"))
    press("F2")
    expect(focused().tagName).toBe("INPUT")
    unmount()
  })
})
