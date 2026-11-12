/**
 * Editing (§5.9): starting an edit (Enter, F2, a double click, a character,
 * a composition, Alt + Down), saving and moving (Enter, Tab), cancelling,
 * focus leaving, the editors by type, `renderEditor`, validation, saves
 * that are promises, the edit under new items and view changes,
 * `useDataTable`'s editing, and the cell selection with it. The editing
 * code is loaded first: its arrival is `data-table-editing-lazy`'s.
 */
import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  useDataTable,
  type DataTableCellChange,
  type DataTableCellsChangeDetails,
  type DataTableEditorProps,
  type DataTableProps,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

import { numberText } from "../internal/data-table/editing/index"
import { loadFeature } from "../internal/data-table/lazy"
import * as announcer from "../internal/primitives/live-announcer"

type Well = {
  id: string
  name: string
  status: "producing" | "drilling" | "shut-in"
  depth: number | null
  spud: Date | null
  active: boolean
  remarks: string
}

const WELLS: Array<Well> = Array.from({ length: 5 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  status: (["producing", "drilling", "shut-in"] as const)[i % 3],
  depth: 1000 + i * 250.5,
  spud: new Date(Date.UTC(2020, i, 10)),
  active: i % 2 === 0,
  remarks: i === 0 ? "ESP replaced" : "",
}))

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "drilling", label: "Drilling", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
    ],
  },
  {
    id: "depth",
    header: "Depth (m)",
    type: "number",
    validate: (value) =>
      typeof value === "number" && value > 5000 ? "At most 5,000 m" : null,
  },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  { id: "active", header: "Active", type: "boolean" },
  { id: "remarks", header: "Remarks", wrap: true },
])

type Props = Partial<DataTableProps<Well>> & { children?: React.ReactNode }

function Table({ children, ...props }: Props) {
  return (
    <DataTable items={WELLS} columns={columns} editable {...props}>
      <DataTableContent aria-label="Wells" />
      {children}
    </DataTable>
  )
}

/** A data cell, by its row's well and its column. */
const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const editor = () => document.activeElement as HTMLInputElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const down = (cell: HTMLElement) => fireEvent.mouseDown(cell, { button: 0 })
/** Focuses a cell and presses Enter on it: its editor. */
const edit = (well: string, column: string) => {
  down(td(well, column))
  press("Enter")
  return editor()
}
const typeIn = (text: string) =>
  fireEvent.change(editor(), { target: { value: text } })
/** The changes `onCellsChange` got, as [row, column, value, reason]. */
const writes = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.map(([changes, details]) => [
    ...(changes as Array<DataTableCellChange<Well>>).map((change) => [
      change.row,
      change.column,
      change.value,
    ]),
    (details as DataTableCellsChangeDetails).reason,
  ])

beforeAll(async () => {
  await loadFeature("editing")
  await loadFeature("cellSelection")
  await loadFeature("dateInput")
  await loadFeature("editingOptions")
  await loadFeature("editingDate")
  await loadFeature("cellError")
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable editing: starting an edit", () => {
  it("edits with Enter, F2 and a double click, the value kept and the caret at its end", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    for (const start of ["Enter", "F2", "double-click"]) {
      down(td("Well 1", "depth"))
      if (start === "double-click") fireEvent.doubleClick(td("Well 1", "depth"))
      else press(start)
      const field = editor()
      expect(field.tagName).toBe("INPUT")
      expect(field).toHaveAccessibleName("Depth (m), Well 1")
      // Every digit, in the locale, no grouping.
      expect(field).toHaveValue("1250.5")
      expect(field).toHaveAttribute("inputmode", "decimal")
      expect(field.selectionStart).toBe(6)
      expect(td("Well 1", "depth")).toContainElement(field)
      press("Escape")
      expect(focused()).toBe(td("Well 1", "depth"))
      expect(td("Well 1", "depth")).toHaveTextContent("1,250.5")
    }
    expect(onCellsChange).not.toHaveBeenCalled()
  })

  it("replaces the value with a character typed, AltGr's too, not with shortcuts", () => {
    render(<Table onCellsChange={() => {}} />)
    down(td("Well 2", "depth"))
    // Prevented: the character is the draft, not typed again.
    expect(press("7")).toBe(false)
    expect(editor()).toHaveValue("7")
    press("Escape")
    // AltGr (Ctrl + Alt) on every platform.
    expect(press("@", { ctrlKey: true, altKey: true })).toBe(false)
    expect(editor()).toHaveValue("@")
    press("Escape")
    // Alt alone is a shortcut but on a Mac (Option types characters).
    press("x", { altKey: true })
    press("c", { ctrlKey: true })
    press("x", { metaKey: true })
    expect(focused()).toBe(td("Well 2", "depth"))
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel")
    expect(press("å", { altKey: true })).toBe(false)
    expect(editor()).toHaveValue("å")
    press("Escape")
  })

  it("types a space with Space where rows do not select; where they do, Space selects the row", () => {
    const onValueChange = vi.fn()
    const { unmount } = render(<Table onCellsChange={() => {}} />)
    down(td("Well 1", "remarks"))
    expect(press(" ")).toBe(false)
    expect(editor()).toHaveValue(" ")
    unmount()
    render(
      <Table
        selectionMode="multiple"
        onValueChange={onValueChange}
        onCellsChange={() => {}}
      />
    )
    down(td("Well 1", "remarks"))
    press(" ")
    expect(focused()).toBe(td("Well 1", "remarks"))
    expect(onValueChange).toHaveBeenCalledWith(["w1"], expect.anything())
  })

  it("opens an empty editor at once for a composition, which goes on in it", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    down(td("Well 1", "remarks"))
    // Not prevented: the input method's key goes on in the editor, focused by now.
    expect(press("Process", { keyCode: 229 })).toBe(true)
    const field = editor()
    expect(field.tagName).toBe("TEXTAREA")
    expect(field).toHaveValue("")
    fireEvent.compositionStart(field)
    fireEvent.change(field, { target: { value: "漢" } })
    // Enter picks the input method's candidate: the edit goes on.
    press("Enter", { isComposing: true, keyCode: 229 })
    expect(editor()).toBe(field)
    fireEvent.change(field, { target: { value: "漢字" } })
    fireEvent.compositionEnd(field)
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["w1", "remarks", "漢字"], "edit"]])
    // A dead key too.
    down(td("Well 2", "remarks"))
    expect(press("Dead")).toBe(true)
    expect(editor().tagName).toBe("TEXTAREA")
  })

  it("does not edit cells that cannot be written: a column opted out, a function's no, a disabled row", () => {
    const opted = createColumns<Well>([
      { id: "name", header: "Well", editable: false },
      {
        id: "depth",
        header: "Depth (m)",
        type: "number",
        editable: (well) => well.id !== "w2",
      },
    ])
    render(
      <Table
        columns={opted}
        isItemDisabled={(well) => well.id === "w3"}
        disabledBehavior="selection"
        onCellsChange={() => {}}
      />
    )
    for (const [well, column] of [
      ["Well 1", "name"],
      ["Well 2", "depth"],
      ["Well 3", "depth"],
    ]) {
      down(td(well, column))
      press("Enter")
      press("5")
      expect(focused().tagName).not.toBe("INPUT")
      expect(td(well, column)).toHaveAttribute("aria-readonly", "true")
    }
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-readonly")
  })

  it("is on with `editable` alone: focus moves cell by cell, no cell selection", () => {
    render(<Table onCellsChange={() => {}} />)
    down(td("Well 0", "depth"))
    expect(focused()).toBe(td("Well 0", "depth"))
    press("ArrowRight")
    expect(focused()).toBe(td("Well 0", "spud"))
    expect(td("Well 0", "spud")).not.toHaveAttribute("aria-selected")
  })
})

describe("DataTable editing: saving and moving", () => {
  it("saves with Enter and moves down, Shift + Enter up; arrows stay in the field", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "depth")
    press("ArrowLeft")
    press("ArrowDown")
    expect(focused().tagName).toBe("INPUT")
    typeIn("1300")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1300], "edit"]])
    const [[[change]]] = onCellsChange.mock.calls as Array<
      [Array<DataTableCellChange<Well>>]
    >
    expect(change.previousValue).toBe(1250.5)
    expect(change.item).toBe(WELLS[1])
    // Moved, not editing.
    expect(focused()).toBe(td("Well 2", "depth"))
    press("Enter")
    typeIn("1600")
    press("Enter", { shiftKey: true })
    expect(focused()).toBe(td("Well 1", "depth"))
    // At the last row, focus stays.
    edit("Well 4", "depth")
    press("Enter")
    expect(focused()).toBe(td("Well 4", "depth"))
  })

  it("reads a number in the locale", () => {
    const onCellsChange = vi.fn()
    render(
      <TectonProvider locale="de-DE">
        <Table onCellsChange={onCellsChange} />
      </TectonProvider>
    )
    expect(edit("Well 1", "depth")).toHaveValue("1250,5")
    typeIn("1.234,5")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1234.5], "edit"]])
  })

  it("saves with Tab and moves to the next cell that can be written, on to the next row; Shift + Tab back", () => {
    const opted = createColumns<Well>([
      { id: "name", header: "Well", editable: false },
      { id: "depth", header: "Depth (m)", type: "number" },
      // Skipped: not written.
      { id: "spud", header: "Spud date", type: "date", editable: false },
      { id: "remarks", header: "Remarks" },
    ])
    const onCellsChange = vi.fn()
    render(
      <Table
        columns={opted}
        onCellsChange={onCellsChange}
        isItemDisabled={(well) => well.id === "w2"}
      />
    )
    edit("Well 1", "depth")
    typeIn("1400")
    press("Tab")
    expect(focused()).toBe(td("Well 1", "remarks"))
    press("Enter")
    typeIn("Logged")
    // A row's end: the next row's first cell that can be written, past the
    // disabled row.
    press("Tab")
    expect(focused()).toBe(td("Well 3", "depth"))
    press("F2")
    press("Tab", { shiftKey: true })
    expect(focused()).toBe(td("Well 1", "remarks"))
    expect(writes(onCellsChange)).toEqual([
      [["w1", "depth", 1400], "edit"],
      [["w1", "remarks", "Logged"], "edit"],
    ])
    // The table's last cell that can be written: focus stays.
    edit("Well 4", "remarks")
    press("Tab")
    expect(focused()).toBe(td("Well 4", "remarks"))
  })

  it("moves past group rows, and keeps to the page", () => {
    const { unmount } = render(
      <Table
        groupable
        defaultView={{ grouping: ["status"] }}
        onCellsChange={() => {}}
      />
    )
    // Producing: Well 0, Well 3; Drilling: Well 1, Well 4; Shut in: Well 2.
    edit("Well 3", "depth")
    press("Enter")
    expect(focused()).toBe(td("Well 1", "depth"))
    edit("Well 4", "depth")
    press("Enter", { shiftKey: true })
    expect(focused()).toBe(td("Well 1", "depth"))
    unmount()
    render(<Table pagination defaultPageSize={2} onCellsChange={() => {}} />)
    edit("Well 1", "depth")
    press("Enter")
    expect(focused()).toBe(td("Well 1", "depth"))
  })

  it("does not report a value the cell already has, and cancels with Escape", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "depth")
    press("Enter")
    edit("Well 1", "depth")
    typeIn("9")
    // Kept from a dialog around the table.
    expect(press("Escape")).toBe(false)
    expect(td("Well 1", "depth")).toHaveTextContent("1,250.5")
    expect(onCellsChange).not.toHaveBeenCalled()
  })

  it("saves as focus leaves: a click on another cell (which keeps focus), or elsewhere", async () => {
    const onCellsChange = vi.fn()
    render(
      <>
        <Table onCellsChange={onCellsChange} />
        <button type="button">Elsewhere</button>
      </>
    )
    edit("Well 1", "depth")
    typeIn("1500")
    down(td("Well 3", "spud"))
    expect(focused()).toBe(td("Well 3", "spud"))
    edit("Well 2", "depth")
    typeIn("1700")
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    expect(focused()).toHaveAccessibleName("Elsewhere")
    // Focus gone to no element: once it has settled.
    edit("Well 3", "depth")
    typeIn("1800")
    act(() => editor().blur())
    await act(async () => {})
    expect(writes(onCellsChange)).toEqual([
      [["w1", "depth", 1500], "edit"],
      [["w2", "depth", 1700], "edit"],
      [["w3", "depth", 1800], "edit"],
    ])
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
  })

  it("keeps a press in the cell being edited, off its field, in the editor", () => {
    render(<Table onCellsChange={() => {}} />)
    const field = edit("Well 1", "depth")
    expect(fireEvent.mouseDown(td("Well 1", "depth"), { button: 0 })).toBe(
      false
    )
    expect(focused()).toBe(field)
  })

  it("edits one cell at a time: starting another saves the first", () => {
    const onCellsChange = vi.fn()
    function Start() {
      const { startEditing } = useDataTable<Well>()
      return (
        <button
          type="button"
          onClick={() => startEditing({ row: "w2", column: "remarks" })}
        >
          Edit remarks
        </button>
      )
    }
    render(
      <Table onCellsChange={onCellsChange}>
        <Start />
      </Table>
    )
    edit("Well 1", "depth")
    typeIn("1900")
    fireEvent.click(screen.getByRole("button", { name: "Edit remarks" }))
    expect(editor()).toHaveAccessibleName("Remarks, Well 2")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1900], "edit"]])
    expect(
      document.querySelectorAll('[data-slot="data-table-editor"]')
    ).toHaveLength(1)
  })

  it("empties a cell with Delete and Backspace without a cell selection", () => {
    const say = vi.spyOn(announcer, "announce")
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    down(td("Well 1", "depth"))
    expect(press("Delete")).toBe(false)
    down(td("Well 0", "remarks"))
    press("Backspace")
    expect(writes(onCellsChange)).toEqual([
      [["w1", "depth", null], "clear"],
      [["w0", "remarks", null], "clear"],
    ])
    expect(say).toHaveBeenCalledWith("Cleared 1 cell")
  })
})

describe("DataTable editing: validation and saves", () => {
  it("keeps the editor with a draft that is not valid, its message described and announced", () => {
    const say = vi.spyOn(announcer, "announce")
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "depth")
    typeIn("abc")
    press("Enter")
    const field = editor()
    expect(field.tagName).toBe("INPUT")
    expect(field).toHaveAttribute("aria-invalid", "true")
    expect(field).toHaveAccessibleDescription("Enter a number")
    expect(say).toHaveBeenCalledWith("Depth (m): Enter a number")
    // The cell's dashed outline, its own ring.
    expect(td("Well 1", "depth").className).toContain("border-dashed")
    // The column's `validate`.
    typeIn("6000")
    press("Tab")
    expect(editor()).toHaveAccessibleDescription("At most 5,000 m")
    expect(onCellsChange).not.toHaveBeenCalled()
    // Escape: the draft and its message go.
    press("Escape")
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-invalid")
    expect(td("Well 1", "depth").className).not.toContain("border-dashed")
    // Fixed, it saves.
    edit("Well 1", "depth")
    typeIn("4000")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 4000], "edit"]])
  })

  it("ends the edit as focus leaves with a draft that is not valid: the cell shows it, and opens with it", () => {
    render(<Table onCellsChange={() => {}} />)
    edit("Well 1", "depth")
    typeIn("abc")
    down(td("Well 2", "depth"))
    const cell = td("Well 1", "depth")
    expect(cell).toHaveAttribute("aria-invalid", "true")
    expect(cell).toHaveAccessibleDescription("“abc”: Enter a number")
    expect(edit("Well 1", "depth")).toHaveValue("abc")
    // Escape removes the cell's message.
    press("Escape")
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-invalid")
  })

  it("shows a save that is a promise as pending, says it is saved, and shows a failure with the value attempted", async () => {
    const say = vi.spyOn(announcer, "announce")
    const saves: Array<{ resolve: () => void; reject: (e: Error) => void }> = []
    const onCellsChange = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          saves.push({ resolve, reject })
        })
    )
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "depth")
    typeIn("1300")
    press("Enter")
    // Closed at once, the cell dimmed and busy.
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    expect(td("Well 1", "depth")).toHaveAttribute("aria-busy", "true")
    expect(td("Well 1", "depth").className).toContain("text-muted-foreground")
    await act(async () => saves[0].resolve())
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-busy")
    expect(say).toHaveBeenCalledWith("Saved")

    edit("Well 2", "depth")
    typeIn("4100")
    press("Enter")
    await act(async () => saves[1].reject(new Error("Past the rig's rating")))
    const cell = td("Well 2", "depth")
    expect(cell).toHaveAttribute("aria-invalid", "true")
    // The text typed.
    expect(cell).toHaveAccessibleDescription("“4100”: Past the rig's rating")
    // Said politely: the user has moved on from the cell.
    expect(say).toHaveBeenCalledWith(
      "1 cell not saved: Past the rig's rating",
      { politeness: "polite" }
    )
    expect(say).not.toHaveBeenCalledWith("Saved", expect.anything())
    // Opened again, with the value attempted.
    expect(edit("Well 2", "depth")).toHaveValue("4100")
  })

  it("leaves a superseded save to the later one", async () => {
    const say = vi.spyOn(announcer, "announce")
    const saves: Array<{ resolve: () => void; reject: (e: Error) => void }> = []
    const signals: Array<AbortSignal> = []
    const onCellsChange = vi.fn(
      (_changes: unknown, details: DataTableCellsChangeDetails) => {
        signals.push(details.signal)
        return new Promise<void>((resolve, reject) => {
          saves.push({ resolve, reject })
        })
      }
    )
    render(<Table onCellsChange={onCellsChange} />)
    edit("Well 1", "depth")
    typeIn("1300")
    press("Enter")
    edit("Well 1", "depth")
    typeIn("1350")
    press("Enter")
    expect(signals[0].aborted).toBe(true)
    await act(async () => saves[0].reject(new Error("Cancelled")))
    // The cell is the later save's: still saving, no message.
    expect(td("Well 1", "depth")).toHaveAttribute("aria-busy", "true")
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-invalid")
    await act(async () => saves[1].resolve())
    expect(say.mock.calls.filter(([text]) => text === "Saved")).toHaveLength(1)
  })

  it("closes without writing when onCellsChange cancels, and treats a throw as a failed save", () => {
    let mode: "cancel" | "throw" = "cancel"
    render(
      <Table
        onCellsChange={(_changes, details) => {
          if (mode === "cancel") details.cancel()
          else throw new Error("Read only today")
        }}
      />
    )
    edit("Well 1", "depth")
    typeIn("1300")
    press("Enter")
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    expect(td("Well 1", "depth")).not.toHaveAttribute("aria-busy")
    mode = "throw"
    edit("Well 1", "depth")
    typeIn("1300")
    press("Enter")
    return waitFor(() =>
      expect(td("Well 1", "depth")).toHaveAccessibleDescription(
        "“1300”: Read only today"
      )
    )
  })
})

describe("DataTable editing: editors by type", () => {
  it("options: a combobox, its list of badges from the cell, filtered by what is typed", async () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    const field = edit("Well 1", "status")
    expect(field).toHaveAttribute("role", "combobox")
    expect(field).toHaveValue("Drilling")
    const list = await screen.findByRole("listbox")
    // Every option until the user types.
    expect(
      within(list)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["Producing", "Drilling", "Shut in"])
    typeIn("SHU")
    await waitFor(() =>
      expect(
        within(screen.getByRole("listbox"))
          .getAllByRole("option")
          .map((o) => o.textContent)
      ).toEqual(["Shut in"])
    )
    press("Enter")
    expect(writes(onCellsChange)).toEqual([
      [["w1", "status", "shut-in"], "edit"],
    ])
    expect(focused()).toBe(td("Well 2", "status"))
    // A click on an option saves it, focus staying on the cell.
    press("Enter")
    fireEvent.click(await screen.findByRole("option", { name: "Producing" }))
    expect(writes(onCellsChange).at(-1)).toEqual([
      ["w2", "status", "producing"],
      "edit",
    ])
    expect(focused()).toBe(td("Well 2", "status"))
    // Text that is no option is refused; started by typing, it filters.
    down(td("Well 3", "status"))
    press("x")
    expect(editor()).toHaveValue("x")
    press("Enter")
    expect(editor()).toHaveAccessibleDescription("Choose one of the options")
    // Escape cancels the edit, not only the list.
    press("Escape")
    expect(focused()).toBe(td("Well 3", "status"))
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("date: read in the locale, a calendar from the cell (Alt + Down) whose day picked is saved", async () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    const field = edit("Well 1", "spud")
    expect(field).toHaveValue("Feb 10, 2020")
    typeIn("Mar 5, 2021")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([
      [["w1", "spud", new Date(Date.UTC(2021, 2, 5))], "edit"],
    ])
    // Alt + Down: the calendar, its day focused.
    edit("Well 2", "spud")
    press("ArrowDown", { altKey: true })
    const dialog = await screen.findByRole("dialog", { name: "Choose a date" })
    await waitFor(() =>
      expect(focused()).toHaveAccessibleName(/March 10th, 2020/)
    )
    fireEvent.click(
      within(dialog).getByRole("button", { name: /March 12th, 2020/ })
    )
    expect(writes(onCellsChange).at(-1)).toEqual([
      ["w2", "spud", new Date(Date.UTC(2020, 2, 12))],
      "edit",
    ])
    expect(focused()).toBe(td("Well 2", "spud"))
    // Its button opens it too, focus kept in the field.
    edit("Well 3", "spud")
    fireEvent.click(screen.getByRole("button", { name: "Choose a date" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("text in a `wrap` column: a text area, Enter saves, Shift + Enter is its own", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    const field = edit("Well 0", "remarks")
    expect(field.tagName).toBe("TEXTAREA")
    // Not prevented: the text area's new line.
    expect(press("Enter", { shiftKey: true })).toBe(true)
    typeIn("ESP replaced\nin May")
    press("Enter")
    expect(writes(onCellsChange)).toEqual([
      [["w0", "remarks", "ESP replaced\nin May"], "edit"],
    ])
  })

  it("boolean: a checkbox in the cell, named and saved as it is toggled, no editor", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    const box = within(td("Well 1", "active")).getByRole("checkbox", {
      name: "Active, Well 1",
    })
    expect(box).not.toBeChecked()
    fireEvent.click(box)
    expect(writes(onCellsChange)).toEqual([[["w1", "active", true], "edit"]])
    // Enter, F2 and typing do not open an editor on it.
    down(td("Well 1", "active"))
    press("Enter")
    press("a")
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    // One that draws its own `cell`: no checkbox, toggled by Enter.
    const drawn = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "active",
        header: "Active",
        type: "boolean",
        cell: (_well, { text }) => text,
      },
    ])
    const toggled = vi.fn()
    const { unmount } = render(
      <DataTable items={WELLS} columns={drawn} editable onCellsChange={toggled}>
        <DataTableContent aria-label="Drawn" />
      </DataTable>
    )
    const grid = screen.getByRole("grid", { name: "Drawn" })
    const yes = within(grid).getAllByText("Yes")[0].closest("td")!
    expect(within(yes).queryByRole("checkbox")).toBeNull()
    down(yes)
    press("Enter")
    expect(writes(toggled)).toEqual([[["w0", "active", false], "edit"]])
    unmount()
    // Without `editable`, a check.
    render(
      <DataTable items={WELLS} columns={columns}>
        <DataTableContent aria-label="Read" />
      </DataTable>
    )
    expect(
      within(screen.getByRole("grid", { name: "Read" })).queryAllByRole(
        "checkbox"
      )
    ).toHaveLength(0)
  })

  it("renderEditor: its own editor, named and focused through `inputProps`, with the table's keys", () => {
    const seen: Array<DataTableEditorProps<Well>> = []
    function Metres(props: DataTableEditorProps<Well>) {
      seen.push(props)
      const { value, onValueChange, inputProps } = props
      return (
        <span>
          <input
            {...inputProps}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => onValueChange(Number(event.target.value))}
            onKeyDown={(event) => {
              // Its own Enter, with Alt.
              if (event.key === "Enter" && event.altKey) event.preventDefault()
            }}
          />
          m
        </span>
      )
    }
    const custom = createColumns<Well>([
      { id: "name", header: "Well", editable: false },
      {
        id: "depth",
        header: "Depth (m)",
        type: "number",
        renderEditor: (props) => <Metres {...props} />,
        validate: (value) =>
          typeof value === "number" && value > 5000 ? "At most 5,000 m" : null,
      },
      { id: "remarks", header: "Remarks" },
    ])
    const onCellsChange = vi.fn()
    render(<Table columns={custom} onCellsChange={onCellsChange} />)
    const field = edit("Well 1", "depth")
    expect(field).toHaveAccessibleName("Depth (m), Well 1")
    expect(field).toHaveValue("1250.5")
    expect(seen.at(-1)).toMatchObject({
      column: "depth",
      item: WELLS[1],
      error: null,
    })
    typeIn("6000")
    press("Enter")
    expect(seen.at(-1)?.error).toBe("At most 5,000 m")
    expect(editor()).toHaveAttribute("aria-invalid", "true")
    expect(editor()).toHaveAccessibleDescription("At most 5,000 m")
    // Its own key, prevented: the table leaves it.
    press("Enter", { altKey: true })
    expect(editor()).toBe(field)
    typeIn("1300")
    press("Tab")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1300], "edit"]])
    expect(focused()).toBe(td("Well 1", "remarks"))
    // Begun by typing: the character read as the column's value.
    down(td("Well 2", "depth"))
    press("7")
    expect(editor()).toHaveValue("7")
    // `commit` and `cancel` from its own controls.
    act(() => seen.at(-1)!.commit({ move: "down" }))
    expect(writes(onCellsChange).at(-1)).toEqual([["w2", "depth", 7], "edit"])
    expect(focused()).toBe(td("Well 3", "depth"))
    press("Enter")
    act(() => seen.at(-1)!.cancel())
    expect(focused()).toBe(td("Well 3", "depth"))
  })
})

describe("DataTable editing: an editor's text", () => {
  it("shows a number in full, in the locale, without grouping, with its currency, percent sign or unit", () => {
    expect(numberText(1234.5, undefined, "en-US")).toBe("1234.5")
    expect(numberText(0.1 + 0.2, undefined, "en-US")).toBe(
      "0.30000000000000004"
    )
    expect(numberText(1234.5, undefined, "de-DE")).toBe("1234,5")
    expect(numberText(0.255, { style: "percent" }, "en-US")).toBe("25.5%")
    expect(
      numberText(1234.5, { style: "currency", currency: "USD" }, "en-US")
    ).toBe("$1234.5")
    expect(numberText(12, { style: "unit", unit: "meter" }, "en-US")).toBe(
      "12 m"
    )
    // Compact and significant digits are the display's, not the value's.
    expect(
      numberText(
        1234567,
        { notation: "compact", maximumSignificantDigits: 2 },
        "en-US"
      )
    ).toBe("1234567")
    expect(numberText(1e21, undefined, "en-US")).toBe("1e+21")
  })

  it("Alt + Down edits a date or options cell with its calendar or list open", async () => {
    render(<Table onCellsChange={() => {}} />)
    down(td("Well 1", "spud"))
    expect(press("ArrowDown", { altKey: true })).toBe(false)
    const dialog = await screen.findByRole("dialog", { name: "Choose a date" })
    expect(within(dialog).getAllByRole("grid")).not.toHaveLength(0)
    // Escape closes the calendar, back to the field: the edit goes on.
    fireEvent.keyDown(focused(), { key: "Escape" })
    await waitFor(() => expect(focused().tagName).toBe("INPUT"))
    expect(focused()).toHaveAccessibleName("Spud date, Well 1")
    press("Escape")
    down(td("Well 2", "status"))
    press("ArrowDown", { altKey: true })
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(focused()).toHaveAttribute("role", "combobox")
    // Not on a text or number cell.
    press("Escape")
    down(td("Well 2", "depth"))
    press("ArrowDown", { altKey: true })
    expect(focused()).toBe(td("Well 2", "depth"))
  })
})

describe("DataTable editing: the edit under changes", () => {
  it("follows its row through new items, its draft kept", () => {
    const { rerender } = render(<Table onCellsChange={() => {}} />)
    edit("Well 2", "depth")
    typeIn("2222")
    // New items, in another order: the edit stays on its row.
    rerender(<Table items={[...WELLS].reverse()} onCellsChange={() => {}} />)
    expect(editor()).toHaveValue("2222")
    expect(td("Well 2", "depth")).toContainElement(editor())
  })

  it("saves and ends on a sort, a filter, or its row going", () => {
    const onCellsChange = vi.fn()
    function Sort() {
      const { setSorting, setSearch } = useDataTable<Well>()
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setSorting([{ column: "depth", direction: "descending" }])
            }
          >
            Sort
          </button>
          <button type="button" onClick={() => setSearch("Well 4")}>
            Search
          </button>
        </>
      )
    }
    const { rerender } = render(
      <Table filterable onCellsChange={onCellsChange}>
        <Sort />
      </Table>
    )
    edit("Well 1", "depth")
    typeIn("1300")
    // Clicked without moving focus (as a toolbar would keep it).
    act(() => screen.getByRole("button", { name: "Sort" }).click())
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1300], "edit"]])
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    // Filtered out of the rows shown: saved.
    edit("Well 2", "depth")
    typeIn("1400")
    act(() => screen.getByRole("button", { name: "Search" }).click())
    expect(writes(onCellsChange).at(-1)).toEqual([
      ["w2", "depth", 1400],
      "edit",
    ])
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
    // Its row gone from the items: nothing to write, the edit ends.
    rerender(
      <Table filterable onCellsChange={onCellsChange}>
        <Sort />
      </Table>
    )
    edit("Well 4", "depth")
    typeIn("1500")
    rerender(
      <Table
        filterable
        items={WELLS.filter((well) => well.id !== "w4")}
        onCellsChange={onCellsChange}
      >
        <Sort />
      </Table>
    )
    expect(onCellsChange).toHaveBeenCalledTimes(2)
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
  })
})

describe("DataTable editing: useDataTable", () => {
  it("says the cell edited, starts an edit (focusing the cell) and stops it", () => {
    const onCellsChange = vi.fn()
    let api: ReturnType<typeof useDataTable<Well>> | null = null
    function Probe() {
      api = useDataTable<Well>()
      const cell = api.editingCell
      return <output>{cell ? `${cell.row}:${cell.column}` : "none"}</output>
    }
    render(
      <Table onCellsChange={onCellsChange}>
        <Probe />
      </Table>
    )
    expect(screen.getByText("none")).toBeInTheDocument()
    act(() => api!.startEditing({ row: "w3", column: "depth" }))
    expect(editor()).toHaveAccessibleName("Depth (m), Well 3")
    expect(screen.getByText("w3:depth")).toBeInTheDocument()
    typeIn("2000")
    act(() => api!.stopEditing({ commit: false }))
    expect(focused()).toBe(td("Well 3", "depth"))
    expect(onCellsChange).not.toHaveBeenCalled()
    act(() => api!.startEditing({ row: "w3", column: "depth" }))
    typeIn("2000")
    act(() => api!.stopEditing())
    expect(writes(onCellsChange)).toEqual([[["w3", "depth", 2000], "edit"]])
    expect(screen.getByText("none")).toBeInTheDocument()
    // A cell that cannot be written: nothing.
    act(() => api!.startEditing({ row: "w3", column: "name" }))
    expect(document.querySelector('[data-slot="data-table-editor"]')).toBeNull()
  })
})

describe("DataTable editing with a cell selection", () => {
  it("edits the focused cell, and the selection follows a save that moves", () => {
    const onCellSelectionChange = vi.fn()
    const onCellsChange = vi.fn()
    render(
      <Table
        cellSelectionMode="range"
        onCellSelectionChange={onCellSelectionChange}
        onCellsChange={onCellsChange}
      />
    )
    edit("Well 1", "depth")
    // The field's own keys, not the selection's.
    press("ArrowDown", { shiftKey: true })
    press("a", { ctrlKey: true })
    press("Delete")
    typeIn("1300")
    onCellSelectionChange.mockClear()
    press("Enter")
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [
        {
          rows: { start: "w2", end: "w2" },
          columns: { start: "depth", end: "depth" },
        },
      ],
      expect.objectContaining({ reason: "keyboard" })
    )
    expect(td("Well 2", "depth")).toHaveAttribute("aria-selected", "true")
    // Escape in the editor cancels the edit only.
    press("Enter")
    press("Escape")
    expect(td("Well 2", "depth")).toHaveAttribute("aria-selected", "true")
    expect(writes(onCellsChange)).toEqual([[["w1", "depth", 1300], "edit"]])
  })
})

describe("DataTable editing: right to left and Strict Mode", () => {
  it("moves with Tab in the columns' order right to left, the arrows in the field", () => {
    render(
      <TectonProvider direction="rtl">
        <Table onCellsChange={() => {}} />
      </TectonProvider>
    )
    edit("Well 1", "depth")
    press("ArrowRight")
    expect(focused().tagName).toBe("INPUT")
    press("Tab")
    expect(focused()).toBe(td("Well 1", "spud"))
  })

  it("keeps the editor through Strict Mode's second mount", async () => {
    render(
      <React.StrictMode>
        <Table onCellsChange={() => {}} />
      </React.StrictMode>
    )
    const field = edit("Well 1", "depth")
    typeIn("1300")
    await act(async () => {})
    expect(editor()).toBe(field)
    expect(field).toHaveValue("1300")
  })
})
