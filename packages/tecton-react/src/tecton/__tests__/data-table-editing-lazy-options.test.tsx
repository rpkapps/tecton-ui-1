/**
 * The options editor's combobox and the date editor's calendar load apart
 * from the other editors (§7), and are prefetched only for a table with
 * such columns that can be written. Until the combobox is there, the
 * editor is a field with the same text: typing goes on, Enter saves the
 * first option the text matches, and the combobox takes the field's
 * place, text and focus once it comes.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
} from "@tecton/react/tecton/data-table"

import { loadFeature } from "../internal/data-table/lazy"

/** The combobox's code arrives when the test lets it; the calendar's is counted. */
const pieces = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), options: 0, date: 0 }
})
vi.mock("../internal/data-table/editing/options", async (importOriginal) => {
  pieces.options++
  await pieces.gate
  return importOriginal()
})
vi.mock("../internal/data-table/editing/date", async (importOriginal) => {
  pieces.date++
  return importOriginal()
})

type Well = { id: string; name: string; status: string }

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing" },
      { value: "drilling", label: "Drilling" },
      { value: "shut-in", label: "Shut in" },
    ],
  },
])

const WELLS: Array<Well> = [
  { id: "w0", name: "Well 0", status: "producing" },
  { id: "w1", name: "Well 1", status: "drilling" },
]

const td = (well: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>('[data-column="status"]')!
const focused = () => document.activeElement as HTMLInputElement
const press = (key: string) => fireEvent.keyDown(focused(), { key })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DataTable editing: the options and date editors' own code", () => {
  it("prefetches only the editors of the types there are, and edits options before their combobox comes", async () => {
    await loadFeature("editing")
    const idle: Array<(deadline: IdleDeadline) => void> = []
    vi.stubGlobal(
      "requestIdleCallback",
      (task: (deadline: IdleDeadline) => void) => {
        idle.push(task)
        return idle.length
      }
    )
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
    act(() =>
      idle
        .splice(0)
        .forEach((task) => task({ didTimeout: false, timeRemaining: () => 50 }))
    )
    await waitFor(() => expect(pieces.options).toBe(1))
    // No date column: no calendar.
    expect(pieces.date).toBe(0)

    // A field until the combobox comes: Enter saves the first match.
    fireEvent.mouseDown(td("Well 0"), { button: 0 })
    press("Enter")
    expect(focused().tagName).toBe("INPUT")
    expect(focused()).not.toHaveAttribute("role", "combobox")
    expect(focused()).toHaveValue("Producing")
    fireEvent.change(focused(), { target: { value: "dri" } })
    press("Enter")
    // Typed, then the combobox in its place, with its text and focus.
    press("s")
    fireEvent.change(focused(), { target: { value: "sh" } })
    await act(async () => pieces.open())
    await waitFor(() => expect(focused()).toHaveAttribute("role", "combobox"))
    expect(focused()).toHaveValue("sh")
    expect(td("Well 1")).toContainElement(focused())
    press("Enter")
    expect(
      (
        onCellsChange.mock.calls as Array<[Array<DataTableCellChange<Well>>]>
      ).map(([[change]]) => [change.row, change.value])
    ).toEqual([
      ["w0", "drilling"],
      ["w1", "shut-in"],
    ])
    unmount()
  })
})
