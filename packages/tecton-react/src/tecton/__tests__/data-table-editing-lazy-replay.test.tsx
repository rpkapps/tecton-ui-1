/**
 * Keys pressed before the editing code are pressed again once it comes,
 * through the same handlers (§7): the outcome is the loaded table's, key
 * for key. The same keys on two tables, one before the code (its keys
 * kept, then pressed again) and one after: the same cells written, the
 * same messages, the same edit open, focus on the same cell. Among them:
 * an arrow after a save, Delete after a save, a save refused then keys
 * after it, a press on another cell and one on the page ending a chain
 * (its edit saved as focus leaving it would save it, focus left where the
 * press put it).
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
  type DataTableCellsChangeDetails,
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

type Well = { id: string; name: string; depth: number; remarks: string }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  {
    id: "depth",
    header: "Depth",
    type: "number",
    validate: (value) =>
      typeof value === "number" && value > 5000 ? "At most 5,000" : null,
  },
  { id: "remarks", header: "Remarks" },
])

const WELLS: Array<Well> = Array.from({ length: 6 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: 1000 + i * 250,
  remarks: "",
}))

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const down = (cell: HTMLElement) => fireEvent.mouseDown(cell, { button: 0 })

/** The keys, and presses between them, both tables take (typed as a user types). */
async function keys() {
  const user = userEvent.setup({ delay: null })
  down(td("Well 0", "depth"))
  // A save, an arrow, a save: the arrow moves focus, as it would. Delete
  // after a save: the cell it moved to, emptied. Enter, a draft not valid
  // (17509 > 5000): refused, the keys after it in the edit still open,
  // Escape ending it. Then a character.
  await user.keyboard(
    "1{Enter}{ArrowDown}6{Enter}{Delete}{Enter}9{Enter}{Enter}{Escape}x"
  )
  // A press on another cell: the edit saved as focus leaving it saves it.
  down(td("Well 5", "remarks"))
  await user.keyboard("ok{ArrowLeft}{Backspace}{Tab}")
  // A press on the page itself: saved, and focus left on the page.
  await user.keyboard("{ArrowUp}8")
  await user.click(document.body)
}

/** What a table shows once the keys are done. */
function outcome(onCellsChange: ReturnType<typeof vi.fn>) {
  const field = document.querySelector<HTMLInputElement>(
    '[data-slot="data-table-editor"] input'
  )
  const cell = focused().closest("td, th")
  return {
    writes: onCellsChange.mock.calls.map(([changes, details]) => [
      ...(changes as Array<DataTableCellChange<Well>>).map((change) => [
        change.row,
        change.column,
        change.value,
      ]),
      (details as DataTableCellsChangeDetails).reason,
    ]),
    invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(
      (element) => element.getAttribute("data-column") ?? element.tagName
    ),
    editor: field && [field.getAttribute("aria-label"), field.value],
    focus: [
      focused().tagName,
      cell?.getAttribute("data-column"),
      cell?.closest("tr")?.querySelector("th")?.textContent,
    ],
  }
}

function Table({ onCellsChange }: { onCellsChange: () => void }) {
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      editable
      onCellsChange={onCellsChange}
    >
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}

let queued: ReturnType<typeof outcome> | null = null

describe("DataTable editing: keys before the code, pressed again", () => {
  it("keeps every key on a chain's cell, its default prevented, and presses them again once the code comes", async () => {
    const onCellsChange = vi.fn()
    const { unmount } = render(<Table onCellsChange={onCellsChange} />)
    await keys()
    expect(onCellsChange).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    await act(async () => chunk.open())
    await waitFor(() => expect(onCellsChange).toHaveBeenCalled())
    await act(() => new Promise((done) => setTimeout(done, 20)))
    queued = outcome(onCellsChange)
    unmount()
  })

  it("does what the loaded table does with the same keys", async () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    await keys()
    await act(async () => {})
    const loaded = outcome(onCellsChange)
    expect(queued).toEqual(loaded)
    expect(loaded.writes).toEqual([
      [["w0", "depth", 1], "edit"],
      [["w2", "depth", 6], "edit"],
      [["w3", "depth", null], "clear"],
      // "x" is no number: refused as focus left, the cell showing it.
      [["w5", "remarks", "k"], "edit"],
      [["w4", "remarks", "8"], "edit"],
    ])
    expect(loaded.invalid).toEqual(["depth"])
    expect(loaded.focus).toEqual(["BODY", undefined, undefined])
  })
})
