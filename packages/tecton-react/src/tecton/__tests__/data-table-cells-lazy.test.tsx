/**
 * Cell selection on demand (§7): the code that resolves the selection and
 * acts on it loads in idle time (not on mount, never for a table without
 * it), what the user does before it arrives is replayed once it is there,
 * and a selection given draws once it is, changing nothing else.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellRange,
} from "@tecton/react/tecton/data-table"

/** The cell selection's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock(
  "../internal/data-table/cell-selection/index",
  async (importOriginal) => {
    chunk.requested()
    await chunk.gate
    return importOriginal()
  }
)

type Well = { id: string; name: string; field: string; depth: number }

const WELLS: Array<Well> = Array.from({ length: 4 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  field: i < 2 ? "Gullfaks" : "Snorre",
  depth: 1000 + i * 100,
}))

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "depth", header: "Depth", type: "number" },
])

const range = (
  startRow: string,
  startColumn: string,
  endRow = startRow,
  endColumn = startColumn
): DataTableCellRange => ({
  rows: { start: startRow, end: endRow },
  columns: { start: startColumn, end: endColumn },
})

const td = (table: HTMLElement, well: string, column: string) =>
  [...table.querySelectorAll("tr")]
    .find((row) => row.querySelector("th")?.textContent === well)!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, "clipboard")
})

describe("DataTable cell selection on demand", () => {
  it("loads nothing for a table without a cell selection", async () => {
    render(
      <DataTable items={WELLS} columns={columns}>
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(chunk.requested).not.toHaveBeenCalled()
  })

  it("loads in idle time, replays what came before the code, and draws a selection given once it is there", async () => {
    let idle: (() => void) | null = null
    vi.stubGlobal("requestIdleCallback", (task: () => void) => {
      idle = task
      return 1
    })
    vi.stubGlobal("cancelIdleCallback", () => {})
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const onCellSelectionChange = vi.fn()
    const { unmount } = render(
      <>
        <DataTable
          items={WELLS}
          columns={columns}
          cellSelectionMode="range"
          defaultCellSelection={[range("w0", "field", "w1", "depth")]}
        >
          <DataTableContent aria-label="Untouched" />
        </DataTable>
        <DataTable
          items={WELLS}
          columns={columns}
          cellSelectionMode="range"
          onCellSelectionChange={onCellSelectionChange}
        >
          <DataTableContent aria-label="Used" />
        </DataTable>
        <DataTable items={WELLS} columns={columns} cellSelectionMode="range">
          <DataTableContent aria-label="Tabbed" />
        </DataTable>
      </>
    )
    const untouched = screen.getByRole("grid", { name: "Untouched" })
    const used = screen.getByRole("grid", { name: "Used" })
    const tabbed = screen.getByRole("grid", { name: "Tabbed" })
    // Not drawn before the code, nor said: whether a cell of the selection
    // given is selected is not known yet. A table without one says "false".
    expect(td(untouched, "Well 0", "field")).not.toHaveAttribute(
      "aria-selected"
    )
    expect(td(used, "Well 0", "field")).toHaveAttribute(
      "aria-selected",
      "false"
    )
    expect(td(untouched, "Well 0", "field")).not.toHaveClass("bg-table-active")
    const before = untouched.outerHTML
    // Not on mount.
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(chunk.requested).not.toHaveBeenCalled()

    // Tab into another table before the code: its cell is kept by id.
    const stop = tabbed.querySelector<HTMLElement>('[tabindex="0"]')!
    act(() => stop.focus())
    expect(tabbed.querySelector('[aria-selected="true"]')).toBeNull()

    // A press, Shift + Down and Ctrl + C before the code: focus moves at
    // once, the selection waits.
    fireEvent.mouseDown(td(used, "Well 1", "field"), { button: 0 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(chunk.requested).toHaveBeenCalled())
    expect(document.activeElement).toBe(td(used, "Well 1", "field"))
    fireEvent.keyDown(document.activeElement!, {
      key: "ArrowDown",
      shiftKey: true,
    })
    expect(document.activeElement).toBe(td(used, "Well 2", "field"))
    fireEvent.keyDown(document.activeElement!, { key: "c", ctrlKey: true })
    expect(onCellSelectionChange).not.toHaveBeenCalled()
    expect(used.querySelector('[aria-selected="true"]')).toBeNull()

    // The idle prefetch asks for the same chunk.
    act(() => idle?.())
    await act(async () => chunk.open())
    await waitFor(() =>
      expect(onCellSelectionChange).toHaveBeenLastCalledWith(
        [range("w1", "field", "w2", "field")],
        expect.objectContaining({ reason: "keyboard" })
      )
    )
    expect(
      onCellSelectionChange.mock.calls.map((call) => call[1].reason)
    ).toEqual(["item-press", "keyboard"])
    // The cell Tab entered, selected once the code came.
    await waitFor(() => expect(stop).toHaveAttribute("aria-selected", "true"))
    // The copy, after the moves, through the Clipboard API.
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Gullfaks\r\nSnorre")
    )
    // The selection given, drawn once the code arrived: the fill, the
    // outline, aria-selected, and nothing else changed.
    expect(td(untouched, "Well 0", "field")).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(td(untouched, "Well 0", "field")).toHaveClass(
      "bg-table-active",
      "before:border-t-2"
    )
    expect(untouched.querySelectorAll('[aria-selected="true"]')).toHaveLength(4)
    const unmarked = (html: string) =>
      html.replace(/ class="[^"]*"/g, "").replace(/ aria-selected="\w+"/g, "")
    expect(unmarked(untouched.outerHTML)).toBe(unmarked(before))
    // Before the idle callbacks are no longer stubbed.
    unmount()
  })
})
