/**
 * Edits before the editing code has come (§7): a key or a press that edits
 * puts the browser's own field in the cell at once, and what is typed
 * there is the browser's. The same keys on a table before the code (it
 * held back until the keys are done) and on one after it: the field's text,
 * caret and focus the same after every key, the same cells written once
 * the code is there, and the field still open taken over by the editor with
 * its text and selection. The one difference: a text refused, typed before
 * the code, marks its cell (as focus leaving an editor does) where a
 * loaded table keeps the editor open with it.
 */
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
  type DataTableCellsChangeDetails,
  type DataTableEditorProps,
} from "@tecton/react/tecton/data-table"

import type * as Lazy from "../internal/data-table/lazy"
import { loadFeature } from "../internal/data-table/lazy"
import * as announcer from "../internal/primitives/live-announcer"

/** The editing code, held back for a table while `ready` is false. */
const gate = vi.hoisted(() => {
  let ready = true
  const listeners = new Set<() => void>()
  return {
    get: () => ready,
    set: (next: boolean) => {
      ready = next
      for (const listener of [...listeners]) listener()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
})
vi.mock("../internal/data-table/lazy", async (importOriginal) => {
  const original = await importOriginal<typeof Lazy>()
  const { useSyncExternalStore } = await import("react")
  return {
    ...original,
    useFeature: ((name, on) => {
      const feature = original.useFeature(name, on)
      const ready = useSyncExternalStore(gate.subscribe, gate.get, gate.get)
      return name === "editing" && !ready
        ? { module: undefined, load: feature.load }
        : feature
    }) as typeof original.useFeature,
  }
})

type Well = {
  id: string
  name: string
  depth: number
  remarks: string
  status: string
  owner: string
}

const STATUSES = ["Producing", "Drilling", "Shut in", "Plugged"]

/** A custom editor: what it was given to begin with shows. */
function OwnerEditor({
  value,
  onValueChange,
  inputProps,
  initialText,
}: DataTableEditorProps<Well>) {
  return (
    <input
      {...inputProps}
      data-initial={initialText}
      value={String(value ?? "")}
      onChange={(event) => onValueChange(event.target.value)}
    />
  )
}

const columns = createColumns<Well>([
  { id: "name", header: "Well", editable: false },
  {
    id: "depth",
    header: "Depth",
    type: "number",
    validate: (value) =>
      typeof value === "number" && value > 5000 ? "At most 5,000" : null,
  },
  { id: "remarks", header: "Remarks", wrap: true },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: STATUSES.map((label) => ({ value: label, label })),
  },
  {
    id: "owner",
    header: "Owner",
    renderEditor: (props) => <OwnerEditor {...props} />,
  },
])

const WELLS: Array<Well> = Array.from({ length: 5 }, (_, i) => ({
  id: `w${i}`,
  name: `Well ${i}`,
  depth: 1000 + i * 250,
  remarks: i === 1 ? "Gas lift" : "",
  status: STATUSES[i % 4],
  owner: "Equinor",
}))

const td = (well: string, column: string) =>
  screen
    .getByText(well)
    .closest("tr")!
    .querySelector<HTMLElement>(`[data-column="${column}"]`)!
const focused = () => document.activeElement as HTMLElement
const down = (cell: HTMLElement) => fireEvent.mouseDown(cell, { button: 0 })

type User = ReturnType<typeof userEvent.setup>
type Step = string | ((user: User) => unknown)

/** Where focus is, and a field's text and selection. */
function state() {
  const active = focused()
  const cell = active.closest("td, th")
  const field =
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      ? active
      : null
  return {
    at: [
      active.tagName,
      cell?.getAttribute("data-column"),
      cell?.closest("tr")?.querySelector("th")?.textContent,
    ],
    field: field && [
      field.getAttribute("aria-label"),
      field.value,
      field.selectionStart,
      field.selectionEnd,
    ],
  }
}

function writesOf(onCellsChange: ReturnType<typeof vi.fn>) {
  return onCellsChange.mock.calls.map(([changes, details]) => [
    ...(changes as Array<DataTableCellChange<Well>>).map((change) => [
      change.row,
      change.column,
      change.value,
    ]),
    (details as DataTableCellsChangeDetails).reason,
  ])
}

/** The keys (and presses) on a fresh table, the code there or held back. */
async function run(steps: Array<Step>, loaded: boolean) {
  gate.set(loaded)
  const onCellsChange = vi.fn()
  const { unmount } = render(
    <>
      <DataTable
        items={WELLS}
        columns={columns}
        editable
        onCellsChange={onCellsChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
      <button type="button">Outside</button>
    </>
  )
  const said = vi.spyOn(announcer, "announce")
  const user = userEvent.setup({ delay: null })
  const after: Array<ReturnType<typeof state>> = []
  for (const step of steps) {
    if (typeof step === "string") await user.keyboard(step)
    else await step(user)
    after.push(state())
  }
  const before = writesOf(onCellsChange)
  await act(async () => gate.set(true))
  await act(() => new Promise((done) => setTimeout(done, 0)))
  const outcome = {
    after,
    writes: writesOf(onCellsChange),
    invalid: [...document.querySelectorAll('td[aria-invalid="true"]')].map(
      (cell) => cell.getAttribute("data-column")
    ),
    end: state(),
    editors: document.querySelectorAll('[data-slot="data-table-editor"]')
      .length,
    error: document
      .querySelector('[data-slot="data-table-editor"] [aria-invalid="true"]')
      ?.getAttribute("aria-label"),
    depths: WELLS.map((well) => td(well.name, "depth").textContent),
    said: said.mock.calls.map(([message]) => message),
  }
  unmount()
  said.mockRestore()
  return { ...outcome, before }
}

const at = (well: string, column: string) => () => down(td(well, column))

/** Each a cell pressed, then keys: the outcome is the same, loaded or not. */
const SEQUENCES: Record<string, Array<Step>> = {
  "5 Enter 6 Enter 7": [at("Well 0", "depth"), "5{Enter}6{Enter}7"],
  "Tab saves and moves": [at("Well 0", "depth"), "1{Tab}x{Tab}2"],
  "Shift + Enter up, Shift + Tab back": [
    at("Well 2", "depth"),
    "1{Shift>}{Enter}{/Shift}2{Shift>}{Tab}{/Shift}",
  ],
  "Escape drops, then a character edits again": [
    at("Well 1", "depth"),
    "1{Enter}2{Escape}3",
  ],
  "the caret: arrows, Home, End, a selection": [
    at("Well 0", "depth"),
    "{Enter}{ArrowLeft}{ArrowLeft}9{Home}8{End}{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}",
  ],
  "Backspace and Delete in the field": [
    at("Well 1", "remarks"),
    "{F2}{Backspace}{Backspace}{Home}{Delete}X",
  ],
  "a text area: Shift + Enter is a line": [
    at("Well 1", "remarks"),
    "{Enter} one{Shift>}{Enter}{/Shift}two{Enter}",
  ],
  "Delete after a save clears the cell moved to": [
    at("Well 0", "depth"),
    "5{Enter}{Delete}{ArrowDown}7",
  ],
  "an arrow after a save moves focus": [
    at("Well 0", "depth"),
    "1{Enter}{ArrowDown}6{Enter}",
  ],
  "a double click keeps the value, the caret at its end": [
    async (user) => {
      await user.dblClick(td("Well 3", "depth"))
    },
    "{Backspace}4",
  ],
  "a press on another cell saves": [
    at("Well 0", "remarks"),
    "ab",
    async (user) => {
      await user.click(td("Well 3", "remarks"))
    },
    "z",
  ],
  "a press on the page saves": [
    at("Well 0", "remarks"),
    "ab",
    async (user) => {
      await user.click(document.body)
    },
  ],
  "a paste goes into the field": [
    at("Well 1", "remarks"),
    "{Enter}",
    async (user) => {
      await user.paste(" on")
    },
    "{Enter}",
  ],
  "options: a text picks its option": [at("Well 2", "status"), "pl{Tab}"],
  "a custom editor: the text typed": [at("Well 0", "owner"), "Ak"],
  "a value's own text is no change": [at("Well 0", "depth"), "{F2}{Enter}"],
}

beforeAll(async () => {
  await loadFeature("editing")
  await loadFeature("editingOptions")
})

describe("DataTable editing: the field before the code", () => {
  for (const [name, steps] of Object.entries(SEQUENCES))
    it(`is the loaded editor's, key for key: ${name}`, async () => {
      const queued = await run(steps, false)
      // Before the code, nothing is written.
      expect(queued.before).toEqual([])
      const loaded = await run(steps, true)
      expect(queued.after).toEqual(loaded.after)
      expect(queued.writes).toEqual(loaded.writes)
      expect(queued.invalid).toEqual(loaded.invalid)
      expect(queued.end).toEqual(loaded.end)
      expect(queued.editors).toBe(loaded.editors)
    })

  it("gives what it should, the code there or not", async () => {
    const outcome = await run(SEQUENCES["5 Enter 6 Enter 7"], false)
    expect(outcome.writes).toEqual([
      [["w0", "depth", 5], "edit"],
      [["w1", "depth", 6], "edit"],
    ])
    expect(outcome.end.field).toEqual(["Depth, Well 2", "7", 1, 1])
    const options = await run(
      SEQUENCES["options: a text picks its option"],
      false
    )
    expect(options.writes).toEqual([[["w2", "status", "Plugged"], "edit"]])
    const paste = await run(SEQUENCES["a paste goes into the field"], false)
    expect(paste.writes).toEqual([[["w1", "remarks", "Gas lift on"], "edit"]])
  })

  it("is the browser's field, flush in the cell, with the editor's name", async () => {
    gate.set(false)
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        editable
        onCellsChange={vi.fn()}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const user = userEvent.setup({ delay: null })
    down(td("Well 1", "depth"))
    await user.keyboard("{Enter}")
    const field = focused() as HTMLInputElement
    expect(field.tagName).toBe("INPUT")
    expect(field).toHaveAccessibleName("Depth, Well 1")
    expect(field).toHaveValue("1250")
    expect(field).toHaveAttribute("inputmode", "decimal")
    expect(td("Well 1", "depth")).toContainElement(field)
    // The cell's content stays, unseen, under it: the cell keeps its size.
    const holder = td("Well 1", "depth").querySelector(
      '[data-slot="data-table-editor"] > [aria-hidden="true"]'
    )
    expect(holder).toHaveTextContent("1,250")
    expect(holder).toHaveClass("invisible")
    // A wrapped column's field is a text area.
    await user.keyboard("{Escape}")
    down(td("Well 1", "remarks"))
    await user.keyboard("{Enter}")
    expect(focused().tagName).toBe("TEXTAREA")
    expect(focused()).toHaveValue("Gas lift")
    await act(async () => gate.set(true))
  })

  it("stops at a text refused before the code: nothing after it is applied, and its editor opens again", async () => {
    // "ab" refused once the code comes: the Backspaces and "5" typed after
    // it went to Well 1 (focus had moved on), and are not applied.
    const queued = await run(
      [at("Well 0", "depth"), "ab{Enter}{Backspace}{Backspace}5{Enter}"],
      false
    )
    expect(queued.writes).toEqual([])
    expect(queued.depths.slice(1)).toEqual(["1,250", "1,500", "1,750", "2,000"])
    expect(queued.invalid).toEqual([])
    expect(queued.end.field).toEqual(["Depth, Well 0", "ab", 2, 2])
    expect(queued.error).toBe("Depth, Well 0")
    expect(queued.editors).toBe(1)
    expect(queued.said).toEqual([
      "“ab” was not saved: Enter a number. Later changes were not applied.",
    ])
  })

  it("closes a field opened after a text refused, unwritten", async () => {
    // "15009" refused (at most 5,000); the field opened on Well 3 after it
    // is closed, and the refused cell's editor opens again.
    const queued = await run(
      [at("Well 2", "depth"), "{Enter}9{Enter}{Enter}"],
      false
    )
    expect(queued.writes).toEqual([])
    expect(queued.end.field).toEqual(["Depth, Well 2", "15009", 5, 5])
    expect(queued.error).toBe("Depth, Well 2")
    expect(queued.editors).toBe(1)
    expect(queued.said).toEqual([
      "“15009” was not saved: At most 5,000. Later changes were not applied.",
    ])
    // Escape after it: nothing came after the text refused.
    const escaped = await run(
      [at("Well 2", "depth"), "{Enter}9{Enter}{Enter}{Escape}"],
      false
    )
    expect(escaped.end.field).toEqual(["Depth, Well 2", "15009", 5, 5])
    expect(escaped.said).toEqual(["“15009” was not saved: At most 5,000"])
  })

  it("only marks a text refused when focus has left the table", async () => {
    const queued = await run(
      [
        at("Well 0", "depth"),
        "x{Enter}7",
        async (user) => {
          await user.click(screen.getByRole("button", { name: "Outside" }))
        },
      ],
      false
    )
    // Focus is not taken back; the "7" saved after it is not applied.
    expect(queued.end.at).toEqual(["BUTTON", undefined, undefined])
    expect(queued.writes).toEqual([])
    expect(queued.invalid).toEqual(["depth"])
    expect(queued.editors).toBe(0)
    expect(queued.said).toEqual([
      "“x” was not saved: Enter a number. Later changes were not applied.",
    ])
  })

  it("applies what came before a text refused", async () => {
    const queued = await run(
      [at("Well 0", "depth"), "2{Enter}{Delete}{ArrowDown}x{Enter}9{Enter}"],
      false
    )
    expect(queued.writes).toEqual([
      [["w0", "depth", 2], "edit"],
      [["w1", "depth", null], "clear"],
    ])
    expect(queued.end.field).toEqual(["Depth, Well 2", "x", 1, 1])
    expect(queued.depths[3]).toBe("1,750")
  })

  it("gives a custom editor the text as its initial text", async () => {
    gate.set(false)
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        editable
        onCellsChange={vi.fn()}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const user = userEvent.setup({ delay: null })
    down(td("Well 0", "owner"))
    await user.keyboard("Ak")
    await act(async () => gate.set(true))
    const field = focused() as HTMLInputElement
    expect(field).toHaveValue("Ak")
    expect(field).toHaveAttribute("data-initial", "Ak")
  })

  it("lets a composition finish before the editor takes over", async () => {
    gate.set(false)
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
    down(td("Well 2", "remarks"))
    fireEvent.keyDown(focused(), { key: "Process", keyCode: 229 })
    const field = focused() as HTMLTextAreaElement
    expect(field.tagName).toBe("TEXTAREA")
    expect(field).toHaveValue("")
    fireEvent.compositionStart(field)
    fireEvent.input(field, { target: { value: "かん" } })
    // The code comes while composing: the field stays.
    await act(async () => gate.set(true))
    expect(focused()).toBe(field)
    fireEvent.input(field, { target: { value: "漢" } })
    fireEvent.compositionEnd(field)
    await act(() => new Promise((done) => setTimeout(done, 0)))
    const editor = focused() as HTMLTextAreaElement
    expect(editor).not.toBe(field)
    expect(editor).toHaveValue("漢")
    fireEvent.keyDown(editor, { key: "Enter" })
    expect(writesOf(onCellsChange)).toEqual([[["w2", "remarks", "漢"], "edit"]])
  })
})
