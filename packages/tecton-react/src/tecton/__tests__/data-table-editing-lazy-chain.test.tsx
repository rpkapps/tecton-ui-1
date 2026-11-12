/**
 * Every key while edits wait for the editing code (§7): "5 Enter 6 Enter
 * 7" saves two cells and edits the third with "7", once the code comes,
 * as it does once it is there; Tab saves and moves too, the arrows and
 * Home / End are kept (they would move the caret), and Escape drops the
 * edit waiting.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
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

type Well = { id: string; name: string; oil: number; water: number }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  { id: "oil", header: "Oil", type: "number" },
  { id: "water", header: "Water", type: "number" },
])

const WELLS: Array<Well> = Array.from({ length: 5 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  oil: 100 * i,
  water: 10 * i,
}))

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })

describe("DataTable editing: every key before the code", () => {
  it("replays edits, saves and moves in order: as once the code is there", async () => {
    const onCellsChange = vi.fn()
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        editable
        onCellsChange={onCellsChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    fireEvent.mouseDown(td("Well 0", "oil"), { button: 0 })
    // Each key prevented and kept: focus stays on the first cell meanwhile.
    for (const [key, init] of [
      ["5", {}],
      ["Enter", {}],
      ["6", {}],
      // A caret move in the edit: kept, not the grid's.
      ["ArrowLeft", {}],
      ["Home", {}],
      ["Tab", {}],
      ["Enter", {}],
      ["Backspace", {}],
      ["Backspace", {}],
      ["9", {}],
      ["Enter", { shiftKey: true }],
      ["8", {}],
      ["Escape", {}],
      ["7", {}],
    ] as const)
      expect(press(key, init)).toBe(false)
    expect(focused()).toBe(td("Well 0", "oil"))
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()

    await act(async () => chunk.open())
    await waitFor(() => expect(focused().tagName).toBe("INPUT"))
    // 5 saved to Well 0, then down; 6 saved to Well 1, then right;
    // Enter on Water 1 (its value, two characters taken back, 9), saved,
    // then up; 8 dropped by Escape; 7 typed on Water 0, open.
    expect(
      (
        onCellsChange.mock.calls as Array<[Array<DataTableCellChange<Well>>]>
      ).map(([[change]]) => [change.row, change.column, change.value])
    ).toEqual([
      ["w0", "oil", 5],
      ["w1", "oil", 6],
      ["w1", "water", 9],
    ])
    expect(td("Well 0", "water")).toContainElement(focused())
    expect(focused()).toHaveValue("7")
  })
})
