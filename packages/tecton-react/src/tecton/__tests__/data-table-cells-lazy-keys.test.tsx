/**
 * Keys that act on the selection before cell selection's code has loaded
 * (§7): a move still waiting for the code counts as a selection, so
 * Escape clears it (and is kept from a surrounding dialog), and Delete off
 * the data cells says to select cells first; a click before the code does
 * not start a drag that follows the pointer.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

import * as announcer from "../internal/primitives/live-announcer"

/** The cell selection's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open() }
})
vi.mock(
  "../internal/data-table/cell-selection/index",
  async (importOriginal) => {
    await chunk.gate
    return importOriginal()
  }
)

type Well = { id: string; name: string; depth: number }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  { id: "depth", header: "Depth", type: "number" },
])

const WELLS: Array<Well> = Array.from({ length: 4 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: 1000 + i * 100,
}))

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DataTable keys before its cell selection code has loaded", () => {
  it("counts a move still waiting as a selection: Escape clears it, Delete off the cells says to select first", async () => {
    vi.stubGlobal("requestIdleCallback", () => 1)
    vi.stubGlobal("cancelIdleCallback", () => {})
    const say = vi.spyOn(announcer, "announce")
    const onCellSelectionChange = vi.fn()
    const onCellsChange = vi.fn()
    const { unmount } = render(
      <DataTable
        items={WELLS}
        columns={columns}
        cellSelectionMode="range"
        editable
        onCellsChange={onCellsChange}
        onCellSelectionChange={onCellSelectionChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    fireEvent.mouseDown(td("Well 1", "depth"), { button: 0 })
    fireEvent.mouseUp(window)
    fireEvent.keyDown(document.activeElement!, {
      key: "ArrowDown",
      shiftKey: true,
    })
    // Prevented (a dialog around the table stays open), and kept.
    expect(fireEvent.keyDown(document.activeElement!, { key: "Escape" })).toBe(
      false
    )
    // A click, then up to the column's header: Delete there.
    fireEvent.mouseDown(td("Well 0", "depth"), { button: 0 })
    fireEvent.mouseUp(window)
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" })
    expect(document.activeElement?.closest("thead")).not.toBeNull()
    expect(fireEvent.keyDown(document.activeElement!, { key: "Delete" })).toBe(
      false
    )
    expect(onCellSelectionChange).not.toHaveBeenCalled()

    await act(async () => chunk.open())
    await waitFor(() => expect(say).toHaveBeenCalledWith("Select cells first"))
    expect(
      onCellSelectionChange.mock.calls.map((call) => [call[0], call[1].reason])
    ).toEqual([
      [
        [
          {
            rows: { start: "w1", end: "w1" },
            columns: { start: "depth", end: "depth" },
          },
        ],
        "item-press",
      ],
      [
        [
          {
            rows: { start: "w1", end: "w2" },
            columns: { start: "depth", end: "depth" },
          },
        ],
        "keyboard",
      ],
      [[], "clear"],
      [
        [
          {
            rows: { start: "w0", end: "w0" },
            columns: { start: "depth", end: "depth" },
          },
        ],
        "item-press",
      ],
    ])
    expect(onCellsChange).not.toHaveBeenCalled()
    // The click before the code drags nothing: the pointer's first move,
    // with no button, ends it.
    onCellSelectionChange.mockClear()
    fireEvent.mouseMove(window, { buttons: 0, clientX: 5, clientY: 300 })
    fireEvent.mouseMove(window, { buttons: 0, clientX: 5, clientY: 320 })
    expect(onCellSelectionChange).not.toHaveBeenCalled()
    unmount()
  })
})
