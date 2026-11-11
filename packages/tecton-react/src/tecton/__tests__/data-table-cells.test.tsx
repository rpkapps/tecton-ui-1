/**
 * DataTable's cell selection (§5.8) and spreadsheet focus (§5.1): ranges
 * from the keyboard and the pointer, copy, paste, clear and fill down
 * through `onCellsChange`, writes that save and fail, the summary, and the
 * interplay with grouping, pages, virtualization, pinned and hidden
 * columns, row selection and right to left.
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
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  createColumns,
  DataTable,
  DataTableCellSummary,
  DataTableContent,
  useDataTable,
  type DataTableCellChange,
  type DataTableCellRange,
  type DataTableContentProps,
  type DataTableProps,
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"
import { renderToString } from "react-dom/server"

import { loadFeature } from "../internal/data-table/lazy"
import * as announcer from "../internal/primitives/live-announcer"
import { layout, scrollable } from "./data-table-fixtures"

type Allocation = {
  id: string
  well: string
  field: string
  status: "flowing" | "testing" | "shut-in"
  hours: number
  oil: number | null
  active: boolean
}

const FIELDS = ["Gullfaks", "Snorre"]

const ITEMS: Array<Allocation> = Array.from({ length: 6 }, (_, i) => ({
  id: `w${i}`,
  well: `Well ${i}`,
  field: FIELDS[Math.floor(i / 3)],
  status: (["flowing", "testing", "shut-in"] as const)[i % 3],
  hours: 20 + i,
  oil: (i + 1) * 100,
  active: i % 2 === 0,
}))

const columns = createColumns<Allocation>([
  { id: "well", header: "Well", editable: false },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "flowing", label: "Flowing" },
      { value: "testing", label: "Testing" },
      { value: "shut-in", label: "Shut in" },
    ],
  },
  {
    id: "hours",
    header: "Hours",
    type: "number",
    validate: (value) =>
      typeof value === "number" && value > 24 ? "At most 24 hours" : null,
  },
  { id: "oil", header: "Oil", type: "number", format: { useGrouping: true } },
  { id: "active", header: "Active", type: "boolean" },
])

type TableProps = Partial<DataTableProps<Allocation>> & {
  contentProps?: Partial<DataTableContentProps<Allocation>>
  summary?: boolean
  children?: React.ReactNode
}

function Table({ contentProps, summary, children, ...props }: TableProps) {
  return (
    <DataTable
      items={ITEMS}
      columns={columns}
      cellSelectionMode="range"
      {...props}
    >
      <DataTableContent aria-label="Allocation" {...contentProps} />
      {summary && <DataTableCellSummary />}
      {children}
    </DataTable>
  )
}

/** A data cell, by its row's well and its column. */
const td = (well: string, column: string) => {
  const row = screen.getByText(well).closest("tr")!
  return row.querySelector<HTMLElement>(`[data-column="${column}"]`)!
}
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const down = (cell: HTMLElement, init: Partial<MouseEventInit> = {}) =>
  fireEvent.mouseDown(cell, { button: 0, ...init })
/** The selected cells, "row:column", in the document's order. */
const selected = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[aria-selected="true"][data-column]'
    ),
    (cell) =>
      `${cell.closest("tr")!.querySelector("th")!.textContent}:${cell.dataset.column}`
  )
const range = (
  startRow: string,
  startColumn: string,
  endRow = startRow,
  endColumn = startColumn
): DataTableCellRange => ({
  start: { row: startRow, column: startColumn },
  end: { row: endRow, column: endColumn },
})

/** Focuses the table's tab stop (a data cell), as Tab does. */
const tabIn = () =>
  act(() =>
    document
      .querySelector<HTMLElement>('td[tabindex="0"], th[tabindex="0"]')!
      .focus()
  )

/** The browser's Clipboard API, for the copies and pastes it carries. */
function clipboardApi(api: Partial<Clipboard>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: api,
  })
}

/** A clipboard event's data, as the browser gives it. */
function clipboardData(text = "") {
  const data = new Map<string, string>([["text/plain", text]])
  return {
    setData: vi.fn((type: string, value: string) => void data.set(type, value)),
    getData: (type: string) => data.get(type) ?? "",
    data,
  }
}

beforeAll(async () => {
  // Loaded first, as the idle-time prefetch usually has by the time a
  // user acts (the on-demand path has its own tests).
  await loadFeature("cellSelection")
  await loadFeature("cellError")
})

let say: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  say = vi.spyOn(announcer, "announce")
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, "clipboard")
  Reflect.deleteProperty(document, "elementFromPoint")
})

describe("DataTable spreadsheet focus", () => {
  it("is a grid of cells: the first tab stop is the first data cell, ranges make it multiselectable", () => {
    const { unmount } = render(<Table selectionMode="multiple" />)
    const grid = screen.getByRole("grid", { name: "Allocation" })
    expect(grid).toHaveAttribute("aria-multiselectable", "true")
    // Not the row, not the checkbox: the row header cell.
    expect(td("Well 0", "well")).toHaveAttribute("tabindex", "0")
    expect(screen.getByText("Well 0").closest("tr")).toHaveAttribute(
      "tabindex",
      "-1"
    )
    unmount()
    render(<Table cellSelectionMode="cell" />)
    expect(screen.getByRole("grid")).not.toHaveAttribute("aria-multiselectable")
  })

  it("moves cell by cell: Up / Down in the column, Left stops at the first cell, Home / End, Ctrl + Home / End, Page Down", () => {
    render(<Table />)
    down(td("Well 1", "hours"))
    expect(focused()).toBe(td("Well 1", "hours"))
    press("ArrowDown")
    expect(focused()).toBe(td("Well 2", "hours"))
    press("ArrowUp")
    press("ArrowUp")
    expect(focused()).toBe(td("Well 0", "hours"))
    press("Home")
    expect(focused()).toBe(td("Well 0", "well"))
    press("ArrowLeft")
    expect(focused()).toBe(td("Well 0", "well"))
    press("End")
    expect(focused()).toBe(td("Well 0", "active"))
    press("End", { ctrlKey: true })
    expect(focused()).toBe(td("Well 5", "active"))
    press("Home", { ctrlKey: true })
    // The table's first cell: the header's (its sort button).
    expect(focused().closest("thead")).not.toBeNull()
    press("ArrowDown")
    press("PageDown")
    expect(focused().closest("tr")).toBe(
      screen.getByText("Well 5").closest("tr")
    )
  })

  it("focuses a cell rather than its row when the row itself is focused", () => {
    render(<Table />)
    const row = screen.getByText("Well 2").closest("tr")!
    act(() => row.focus())
    expect(focused()).toBe(td("Well 2", "well"))
  })

  it("keeps the rows' selection to their checkbox: a click on a cell selects the cell", () => {
    const onValueChange = vi.fn()
    const onActivate = vi.fn()
    render(
      <Table
        selectionMode="multiple"
        onValueChange={onValueChange}
        onActivate={onActivate}
      />
    )
    down(td("Well 1", "oil"))
    fireEvent.click(td("Well 1", "oil"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(onActivate).not.toHaveBeenCalled()
    expect(selected()).toEqual(["Well 1:oil"])
    fireEvent.doubleClick(td("Well 1", "oil"))
    expect(onActivate).toHaveBeenCalledWith("w1", ITEMS[1])
    // Space still selects the row.
    press(" ")
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual(["w1"])
  })
})

describe("DataTable cell selection", () => {
  it("selects the cell focus moves to, and extends the range with Shift + arrows", () => {
    const onCellSelectionChange = vi.fn()
    render(<Table onCellSelectionChange={onCellSelectionChange} />)
    down(td("Well 1", "hours"))
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [range("w1", "hours")],
      expect.objectContaining({ reason: "item-press" })
    )
    press("ArrowRight")
    expect(selected()).toEqual(["Well 1:oil"])
    press("ArrowDown", { shiftKey: true })
    press("ArrowLeft", { shiftKey: true })
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [range("w1", "oil", "w2", "hours")],
      expect.objectContaining({ reason: "keyboard" })
    )
    expect(selected()).toEqual([
      "Well 1:hours",
      "Well 1:oil",
      "Well 2:hours",
      "Well 2:oil",
    ])
    // Focus is on the moving corner.
    expect(focused()).toBe(td("Well 2", "hours"))
    expect(focused()).toHaveAttribute("aria-selected", "true")
  })

  it("outlines each range on its edge cells and fills its cells", () => {
    render(
      <Table defaultCellSelection={[range("w1", "field", "w2", "hours")]} />
    )
    const corner = td("Well 1", "field")
    expect(corner).toHaveClass(
      "bg-table-active",
      "before:border-t-2",
      "before:border-s-2"
    )
    expect(corner).not.toHaveClass("before:border-b-2", "before:border-e-2")
    expect(td("Well 2", "status")).toHaveClass("before:border-b-2")
    expect(td("Well 2", "status")).not.toHaveClass("before:border-s-2")
    expect(td("Well 2", "hours")).toHaveClass(
      "before:border-b-2",
      "before:border-e-2"
    )
    expect(td("Well 0", "field")).not.toHaveAttribute("aria-selected")
    expect(td("Well 0", "field")).not.toHaveClass("bg-table-active")
  })

  it("extends with Shift + click, adds a range with Ctrl + click, and drags a range", () => {
    vi.stubGlobal("requestAnimationFrame", (task: () => void) =>
      setTimeout(task)
    )
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id))
    const onCellSelectionChange = vi.fn()
    render(<Table onCellSelectionChange={onCellSelectionChange} />)
    down(td("Well 0", "field"))
    down(td("Well 1", "status"), { shiftKey: true })
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [range("w0", "field", "w1", "status")],
      expect.anything()
    )
    fireEvent.mouseUp(window)
    down(td("Well 4", "oil"), { ctrlKey: true })
    expect(onCellSelectionChange.mock.calls.at(-1)?.[0]).toEqual([
      range("w0", "field", "w1", "status"),
      range("w4", "oil"),
    ])
    fireEvent.mouseUp(window)
    // A drag: the cell under the pointer, frame by frame.
    // The scroll area's box, for the rows' edges.
    const box = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return this.matches('[data-slot="table-container"]')
          ? DOMRect.fromRect({ x: 0, y: 0, width: 600, height: 400 })
          : box.call(this)
      }
    )
    let under: Element = td("Well 3", "hours")
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => under,
    })
    down(td("Well 3", "hours"))
    under = td("Well 5", "oil")
    act(() => {
      fireEvent.mouseMove(window, { clientX: 300, clientY: 200, buttons: 1 })
    })
    return waitFor(() => {
      expect(onCellSelectionChange.mock.calls.at(-1)?.[0]).toEqual([
        range("w3", "hours", "w5", "oil"),
      ])
      expect(focused()).toBe(td("Well 5", "oil"))
    })
  })

  it("selects the range's rows with Shift + Space, its columns with Ctrl + Space, everything with Ctrl + A", () => {
    const onCellSelectionChange = vi.fn()
    render(<Table onCellSelectionChange={onCellSelectionChange} />)
    down(td("Well 1", "hours"))
    press("ArrowDown", { shiftKey: true })
    press(" ", { shiftKey: true })
    expect(onCellSelectionChange.mock.calls.at(-1)?.[0]).toEqual([
      range("w1", "well", "w2", "active"),
    ])
    expect(say).toHaveBeenLastCalledWith("12 cells selected")
    down(td("Well 1", "hours"))
    press(" ", { ctrlKey: true })
    expect(onCellSelectionChange.mock.calls.at(-1)?.[0]).toEqual([
      range("w0", "hours", "w5", "hours"),
    ])
    press("a", { ctrlKey: true })
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [range("w0", "well", "w5", "active")],
      expect.objectContaining({ reason: "select-all" })
    )
    expect(selected()).toHaveLength(36)
    expect(say).toHaveBeenLastCalledWith("36 cells selected")
  })

  it("shares Ctrl + A and Escape with row selection: cells from a data cell, rows from the checkbox column; Escape clears cells first", () => {
    const onValueChange = vi.fn()
    const onCellSelectionChange = vi.fn()
    render(
      <Table
        selectionMode="multiple"
        onValueChange={onValueChange}
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    down(td("Well 1", "hours"))
    press("a", { ctrlKey: true })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(selected()).toHaveLength(36)
    // To the checkbox column: the rows.
    press("Home")
    press("ArrowLeft")
    expect(focused()).toHaveAttribute("role", "checkbox")
    press("a", { ctrlKey: true })
    expect(onValueChange.mock.calls.at(-1)?.[0]).toHaveLength(6)
    press("Escape")
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ reason: "clear" })
    )
    expect(onValueChange.mock.calls.at(-1)?.[0]).toHaveLength(6)
    press("Escape")
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual([])
  })

  it("selects the focused cell alone when it is pressed again, and keeps ⌘ + Space to the system", () => {
    const onCellSelectionChange = vi.fn()
    render(<Table onCellSelectionChange={onCellSelectionChange} />)
    down(td("Well 1", "oil"))
    press(" ", { shiftKey: true })
    expect(selected()).toHaveLength(6)
    down(td("Well 1", "oil"))
    expect(selected()).toEqual(["Well 1:oil"])
    // Control + Space selects the column, on a Mac too; ⌘ + Space does not.
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel")
    press(" ", { metaKey: true })
    expect(selected()).toEqual(["Well 1:oil"])
    press(" ", { ctrlKey: true })
    expect(selected()).toHaveLength(6)
  })

  it('selects one cell at a time in "cell" mode', () => {
    const onCellSelectionChange = vi.fn()
    render(
      <Table
        cellSelectionMode="cell"
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    down(td("Well 0", "field"))
    press("ArrowDown", { shiftKey: true })
    down(td("Well 3", "oil"), { ctrlKey: true })
    expect(onCellSelectionChange.mock.calls.map((call) => call[0])).toEqual([
      [range("w0", "field")],
      [range("w1", "field")],
      [range("w3", "oil")],
    ])
    press("a", { ctrlKey: true })
    expect(selected()).toEqual(["Well 3:oil"])
  })

  it("is controlled by cellSelection, which a change only reports", () => {
    const onCellSelectionChange = vi.fn()
    const { rerender } = render(
      <Table
        cellSelection={[range("w0", "oil")]}
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    down(td("Well 2", "oil"))
    expect(onCellSelectionChange).toHaveBeenCalledTimes(1)
    expect(selected()).toEqual(["Well 0:oil"])
    rerender(
      <Table
        cellSelection={[range("w2", "oil")]}
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    expect(selected()).toEqual(["Well 2:oil"])
  })

  it("keeps a range by its rows' ids: over a sort, and set aside while a corner is filtered out or its column hidden", () => {
    const view = {
      sorting: [],
      search: "",
      columns: { hidden: [] as Array<string> },
    }
    const { rerender } = render(
      <Table
        filterable
        hideableColumns
        view={view}
        defaultCellSelection={[range("w0", "hours", "w1", "oil")]}
      />
    )
    expect(selected()).toHaveLength(4)
    rerender(
      <Table
        filterable
        hideableColumns
        view={{
          ...view,
          sorting: [{ column: "hours", direction: "descending" }],
        }}
        defaultCellSelection={[range("w0", "hours", "w1", "oil")]}
      />
    )
    // w1 then w0 are last now: the same cells.
    expect(selected()).toEqual([
      "Well 1:hours",
      "Well 1:oil",
      "Well 0:hours",
      "Well 0:oil",
    ])
    rerender(
      <Table
        filterable
        hideableColumns
        view={{ ...view, search: "Well 1" }}
        defaultCellSelection={[range("w0", "hours", "w1", "oil")]}
      />
    )
    expect(selected()).toEqual([])
    rerender(
      <Table
        filterable
        hideableColumns
        view={{ ...view, columns: { hidden: ["oil"] } }}
        defaultCellSelection={[range("w0", "hours", "w1", "oil")]}
      />
    )
    expect(selected()).toEqual([])
    rerender(
      <Table
        filterable
        hideableColumns
        view={view}
        defaultCellSelection={[range("w0", "hours", "w1", "oil")]}
      />
    )
    expect(selected()).toHaveLength(4)
  })
})

describe("DataTable cells to the clipboard", () => {
  it("copies the selection's display text as tab-separated text and an HTML table", () => {
    render(
      <Table defaultCellSelection={[range("w0", "well", "w1", "active")]} />
    )
    down(td("Well 1", "active"), { shiftKey: true })
    const data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    expect(data.data.get("text/plain")).toBe(
      "Well 0\tGullfaks\tFlowing\t20\t100\tYes\r\nWell 1\tGullfaks\tTesting\t21\t200\tNo"
    )
    expect(data.data.get("text/html")).toContain(
      "<tr><td>Well 0</td><td>Gullfaks</td>"
    )
    expect(say).toHaveBeenLastCalledWith("Copied 12 cells")
  })

  it("copies through the Clipboard API when the browser sends no copy event", async () => {
    const writeText = vi.fn(() => Promise.resolve())
    clipboardApi({ writeText })
    render(<Table />)
    down(td("Well 2", "oil"))
    press("c", { ctrlKey: true })
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("300"))
  })

  it("copies several ranges by Excel's rules: the same rows side by side, the same columns one under the other, else nothing", () => {
    const { unmount } = render(
      <Table defaultCellSelection={[range("w0", "well"), range("w0", "oil")]} />
    )
    down(td("Well 0", "oil"), { ctrlKey: true })
    let data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    // Ctrl + click added the same cell again: one column each.
    expect(data.data.get("text/plain")).toBe("Well 0\t100")
    unmount()
    render(
      <Table
        defaultCellSelection={[
          range("w0", "oil"),
          range("w3", "oil", "w4", "oil"),
        ]}
      />
    )
    tabIn()
    data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    expect(data.data.get("text/plain")).toBe("100\r\n400\r\n500")
    down(td("Well 5", "field"), { ctrlKey: true })
    data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    expect(data.setData).not.toHaveBeenCalled()
    expect(say).toHaveBeenLastCalledWith(
      "These ranges cannot be copied together: select ranges in the same rows or in the same columns"
    )
  })

  it("leaves a copy in a field to the field", () => {
    render(
      <Table>
        <input aria-label="Note" />
      </Table>
    )
    const input = screen.getByRole("textbox", { name: "Note" })
    act(() => input.focus())
    const data = clipboardData()
    fireEvent.copy(input, { clipboardData: data })
    expect(data.setData).not.toHaveBeenCalled()
  })
})

describe("DataTable cells written", () => {
  function Editable(props: TableProps) {
    return <Table editable {...props} />
  }

  it("pastes a block from the range's first cell, read per type; the range becomes the cells pasted", () => {
    const onCellsChange = vi.fn()
    const onCellSelectionChange = vi.fn()
    render(
      <Editable
        onCellsChange={onCellsChange}
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    down(td("Well 1", "status"))
    fireEvent.paste(focused(), {
      clipboardData: clipboardData("Shut in\t24\t1,250.5\r\nflowing\t\t7\r\n"),
    })
    const [changes, details] = onCellsChange.mock.calls[0] as [
      Array<DataTableCellChange<Allocation>>,
      { reason: string },
    ]
    expect(details.reason).toBe("paste")
    expect(
      changes.map((change) => [change.id, change.column, change.value])
    ).toEqual([
      ["w1", "status", "shut-in"],
      ["w1", "hours", 24],
      ["w1", "oil", 1250.5],
      // "Flowing" was "testing": changed; the empty hours is null.
      ["w2", "status", "flowing"],
      ["w2", "hours", null],
      ["w2", "oil", 7],
    ])
    expect(changes[0]).toMatchObject({
      item: ITEMS[1],
      previousValue: "testing",
    })
    expect(onCellSelectionChange).toHaveBeenLastCalledWith(
      [range("w1", "status", "w2", "oil")],
      expect.objectContaining({ reason: "paste" })
    )
    expect(say).toHaveBeenLastCalledWith("Pasted 6 cells")
  })

  it("skips cells that cannot be written, refuses values that are not valid, and says so", () => {
    const onCellsChange = vi.fn()
    render(
      <Editable
        onCellsChange={onCellsChange}
        isItemDisabled={(item) => item.id === "w2"}
        disabledBehavior="selection"
      />
    )
    down(td("Well 0", "well"))
    // Well (not editable), Field; then a row of Well 1; Well 2 is disabled.
    fireEvent.paste(focused(), {
      clipboardData: clipboardData(
        "A\tB\tC\t30\r\nD\tE\tdrilling\tx\r\nF\tG\tH\t1"
      ),
    })
    const [changes] = onCellsChange.mock.calls[0] as [
      Array<DataTableCellChange<Allocation>>,
    ]
    expect(changes.map((change) => `${change.id}:${change.column}`)).toEqual([
      "w0:field",
      "w1:field",
    ])
    expect(say).toHaveBeenLastCalledWith(
      "Pasted 2 cells, 6 not editable, 4 not valid, Status: Choose one of the options"
    )
    const invalid = td("Well 0", "hours")
    expect(invalid).toHaveAttribute("aria-invalid", "true")
    expect(invalid).toHaveAccessibleDescription("At most 24 hours")
    expect(invalid).toHaveClass("before:border-destructive")
    expect(td("Well 1", "hours")).toHaveAccessibleDescription("Enter a number")
  })

  it("fills one pasted value into every selected cell, and repeats a block over a range that is a multiple of it", () => {
    const onCellsChange = vi.fn()
    render(
      <Editable
        onCellsChange={onCellsChange}
        defaultCellSelection={[range("w0", "hours", "w3", "oil")]}
      />
    )
    tabIn()
    fireEvent.paste(focused(), { clipboardData: clipboardData("5") })
    expect(onCellsChange.mock.calls[0][0]).toHaveLength(8)
    fireEvent.paste(focused(), { clipboardData: clipboardData("1\t2\n3\t4") })
    expect(
      (
        onCellsChange.mock.calls[1][0] as Array<DataTableCellChange<Allocation>>
      ).map((change) => change.value)
    ).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
  })

  it("pastes a block past the range, cut at the table's edge, and into the rows out of view of other pages", () => {
    const onCellsChange = vi.fn()
    render(
      <Editable
        onCellsChange={onCellsChange}
        pagination
        defaultPageSize={2}
        defaultCellSelection={[range("w1", "oil")]}
      />
    )
    tabIn()
    fireEvent.paste(focused(), {
      clipboardData: clipboardData("1\tYes\tx\n2\tNo\tx\n3\tYes\tx"),
    })
    const [changes] = onCellsChange.mock.calls[0] as [
      Array<DataTableCellChange<Allocation>>,
    ]
    expect(
      changes.map(
        (change) => `${change.id}:${change.column}:${String(change.value)}`
      )
    ).toEqual([
      "w1:oil:1",
      "w1:active:true",
      "w2:oil:2",
      "w2:active:false",
      "w3:oil:3",
      "w3:active:true",
    ])
  })

  it("clears the selected cells with Delete, fills down with Ctrl + D (a one-row range from the row above)", () => {
    const onCellsChange = vi.fn()
    render(<Editable onCellsChange={onCellsChange} />)
    down(td("Well 0", "field"))
    press("ArrowDown", { shiftKey: true })
    press("ArrowRight", { shiftKey: true })
    press("Delete")
    expect(onCellsChange).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({ id: "w0", column: "field", value: null }),
        expect.objectContaining({ id: "w0", column: "status", value: null }),
        expect.objectContaining({ id: "w1", column: "field", value: null }),
        expect.objectContaining({ id: "w1", column: "status", value: null }),
      ],
      expect.objectContaining({ reason: "clear" })
    )
    expect(say).toHaveBeenLastCalledWith("Cleared 4 cells")
    press("d", { ctrlKey: true })
    expect(onCellsChange).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({
          id: "w1",
          column: "status",
          value: "flowing",
        }),
      ],
      expect.objectContaining({ reason: "fill" })
    )
    // w1's field is w0's already: written, not reported.
    expect(say).toHaveBeenLastCalledWith("Filled 2 cells")
    down(td("Well 4", "oil"))
    press("d", { ctrlKey: true })
    expect(onCellsChange).toHaveBeenLastCalledWith(
      [expect.objectContaining({ id: "w4", column: "oil", value: 400 })],
      expect.anything()
    )
  })

  it("writes nothing without editable: Delete, Ctrl + D and a paste are left alone", () => {
    const onCellsChange = vi.fn()
    render(<Table onCellsChange={onCellsChange} />)
    down(td("Well 0", "field"))
    press("Delete")
    press("d", { ctrlKey: true })
    fireEvent.paste(focused(), { clipboardData: clipboardData("x") })
    expect(onCellsChange).not.toHaveBeenCalled()
  })

  it("pastes through the Clipboard API when the browser sends no paste event", async () => {
    const readText = vi.fn(() => Promise.resolve("Snorre"))
    clipboardApi({ readText })
    const onCellsChange = vi.fn()
    render(<Editable onCellsChange={onCellsChange} />)
    down(td("Well 0", "field"))
    press("v", { ctrlKey: true })
    await waitFor(() =>
      expect(onCellsChange).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            id: "w0",
            column: "field",
            value: "Snorre",
          }),
        ],
        expect.anything()
      )
    )
  })

  it("dims the cells while a save is pending, and shows its error when it fails", async () => {
    let fail: (error: Error) => void = () => {}
    let succeed: () => void = () => {}
    const onCellsChange = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            succeed = resolve
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((_, reject) => {
            fail = reject
          })
      )
    render(<Editable onCellsChange={onCellsChange} />)
    down(td("Well 0", "oil"))
    fireEvent.paste(focused(), { clipboardData: clipboardData("9") })
    expect(td("Well 0", "oil")).toHaveAttribute("aria-busy", "true")
    expect(td("Well 0", "oil")).toHaveClass("text-muted-foreground")
    await act(async () => succeed())
    expect(td("Well 0", "oil")).not.toHaveAttribute("aria-busy")
    fireEvent.paste(focused(), { clipboardData: clipboardData("8") })
    await act(async () => fail(new Error("The well is locked")))
    const cell = td("Well 0", "oil")
    expect(cell).not.toHaveAttribute("aria-busy")
    expect(cell).toHaveAttribute("aria-invalid", "true")
    expect(cell).toHaveAccessibleDescription("The well is locked")
    expect(say).toHaveBeenLastCalledWith(
      "1 cell not saved: The well is locked",
      {
        politeness: "assertive",
      }
    )
    // Written again: the message goes.
    onCellsChange.mockReturnValue(undefined)
    fireEvent.paste(focused(), { clipboardData: clipboardData("7") })
    expect(td("Well 0", "oil")).not.toHaveAttribute("aria-invalid")
  })

  it("shows a cell's message in a tooltip while the pointer is over it", async () => {
    render(<Editable />)
    down(td("Well 0", "hours"))
    fireEvent.paste(focused(), { clipboardData: clipboardData("99") })
    fireEvent.pointerEnter(td("Well 0", "hours"))
    await waitFor(() =>
      expect(
        screen.getByText("At most 24 hours", {
          selector: "[data-slot=tooltip-content]",
        })
      ).toBeInTheDocument()
    )
  })

  it("lets onCellsChange cancel a write: nothing is said, the selection stays", () => {
    const onCellSelectionChange = vi.fn()
    render(
      <Editable
        onCellsChange={(_, details) => details.cancel()}
        onCellSelectionChange={onCellSelectionChange}
      />
    )
    down(td("Well 0", "oil"))
    say.mockClear()
    fireEvent.paste(focused(), { clipboardData: clipboardData("1\n2") })
    expect(say).not.toHaveBeenCalled()
    expect(onCellSelectionChange).toHaveBeenCalledTimes(1)
  })
})

describe("DataTable cell selection with the table's features", () => {
  it("passes over group rows: a range runs across them, copy and Shift + arrows skip them", () => {
    render(<Table groupable defaultView={{ grouping: ["field"] }} />)
    down(td("Well 2", "oil"))
    // Down to Well 3, over Snorre's group row.
    press("ArrowDown", { shiftKey: true })
    expect(selected()).toEqual(["Well 2:oil", "Well 3:oil"])
    const data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    expect(data.data.get("text/plain")).toBe("300\r\n400")
    // The group row's cells are not data cells.
    const groupRows = document.querySelectorAll(
      '[data-slot="data-table-group-row"]'
    )
    expect(groupRows).toHaveLength(2)
    for (const groupRow of groupRows)
      expect(groupRow.querySelector("[data-column]")).toBeNull()
  })

  it("passes over detail rows, whose cell is not a data cell", () => {
    render(
      <Table
        defaultExpanded={["w0"]}
        contentProps={{ renderDetail: (item) => <p>Notes on {item.well}</p> }}
      />
    )
    down(td("Well 0", "oil"))
    press("ArrowDown", { shiftKey: true })
    expect(selected()).toEqual(["Well 0:oil", "Well 1:oil"])
    expect(
      screen.getByText("Notes on Well 0").closest("td")
    ).not.toHaveAttribute("data-column")
  })

  it("copies every page's cells after Ctrl + A on pages", () => {
    render(<Table pagination defaultPageSize={2} />)
    down(td("Well 0", "well"))
    press("a", { ctrlKey: true })
    const data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    expect(data.data.get("text/plain")!.split("\r\n")).toHaveLength(6)
  })

  it("copies the rows out of view of a virtualized table, and sums them", () => {
    layout()
    const many = Array.from({ length: 1000 }, (_, i) => ({
      ...ITEMS[0],
      id: `m${i}`,
      well: `Well ${i}`,
      oil: i,
    }))
    render(
      <div style={{ height: 400 }}>
        <Table items={many} summary contentProps={{ virtualized: true }} />
      </div>
    )
    scrollable()
    down(td("Well 0", "oil"))
    press(" ", { ctrlKey: true })
    const data = clipboardData()
    fireEvent.copy(focused(), { clipboardData: data })
    const lines = data.data.get("text/plain")!.split("\r\n")
    expect(lines).toHaveLength(1000)
    expect(lines.at(-1)).toBe("999")
    expect(
      document.querySelectorAll("tbody tr[data-index]").length
    ).toBeLessThan(100)
    const summary = screen.getByRole("group", { name: "Selected cells" })
    expect(summary).toHaveTextContent("Sum: 499,500")
    expect(summary).toHaveTextContent("Average: 499.5")
    expect(summary).toHaveTextContent("Count: 1,000")
  })

  it("selects across pinned columns, which keep their stickiness under the outline", () => {
    render(
      <Table
        pinnableColumns
        defaultView={{ columns: { pinned: { start: ["well"] } } }}
        defaultCellSelection={[range("w0", "well", "w0", "field")]}
      />
    )
    const pinned = td("Well 0", "well")
    expect(pinned).toHaveClass("sticky", "bg-table-active", "before:border-s-2")
    expect(pinned).not.toHaveClass("relative")
    expect(td("Well 0", "field")).toHaveClass("relative", "before:border-e-2")
  })

  it("mirrors the arrows right to left", () => {
    const onCellSelectionChange = vi.fn()
    render(
      <TectonProvider direction="rtl">
        <Table onCellSelectionChange={onCellSelectionChange} />
      </TectonProvider>
    )
    down(td("Well 0", "field"))
    press("ArrowLeft", { shiftKey: true })
    expect(onCellSelectionChange.mock.calls.at(-1)?.[0]).toEqual([
      range("w0", "field", "w0", "status"),
    ])
  })
})

describe("DataTable cell selection on the server", () => {
  it("renders the selection in the server's HTML", () => {
    const html = renderToString(
      <Table
        selectionMode="multiple"
        editable
        defaultCellSelection={[range("w0", "field", "w1", "status")]}
        summary
      />
    )
    expect(html).toContain('aria-multiselectable="true"')
    // Four cells: no row is selected.
    expect(html.match(/aria-selected="true"/g)).toHaveLength(4)
    expect(html.match(/bg-table-active/g)?.length).toBeGreaterThanOrEqual(4)
    expect(html).toContain("Count: 4")
  })
})

describe("DataTableCellSummary", () => {
  it("sums, averages and counts the selected numbers in their column's format, and renders nothing without a selection", async () => {
    render(<Table summary />)
    expect(screen.queryByRole("group", { name: "Selected cells" })).toBeNull()
    down(td("Well 0", "hours"))
    press("ArrowDown", { shiftKey: true })
    press("ArrowRight", { shiftKey: true })
    press("ArrowRight", { shiftKey: true })
    const summary = await screen.findByRole("group", { name: "Selected cells" })
    // Hours and oil (two formats): 20 + 21 + 100 + 200; both actives count.
    expect(
      within(summary)
        .getAllByText(/./)
        .map((item) => item.textContent)
    ).toEqual(["Sum: 341", "Average: 85.25", "Numerical count: 4", "Count: 6"])
    press("Escape")
    expect(screen.queryByRole("group", { name: "Selected cells" })).toBeNull()
  })

  it("renders nothing, and warns, without a cell selection mode", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Table cellSelectionMode="none" summary />)
    expect(
      document.querySelector('[data-slot="data-table-cell-summary"]')
    ).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      "DataTableCellSummary renders nothing: cellSelectionMode is off on its DataTable."
    )
  })
})

describe("useDataTable's cell selection", () => {
  it("reads and sets the cell selection, counts and sums it, and copies, pastes, clears and fills it", async () => {
    const writeText = vi.fn(() => Promise.resolve())
    clipboardApi({ writeText })
    let table: ReturnType<typeof useDataTable<Allocation>> | undefined
    function Probe() {
      table = useDataTable<Allocation>()
      return null
    }
    const onCellsChange = vi.fn()
    render(
      <Table editable onCellsChange={onCellsChange}>
        <Probe />
      </Table>
    )
    expect(table!.cellSelection).toEqual([])
    expect(table!.cellSummary).toBeNull()
    act(() => table!.setCellSelection([range("w0", "hours", "w1", "oil")]))
    expect(table!.cellSelection).toEqual([range("w0", "hours", "w1", "oil")])
    expect(table!.selectedCellCount).toBe(4)
    expect(table!.cellSummary).toEqual({
      count: 4,
      numericCount: 4,
      sum: 341,
      average: 85.25,
    })
    await expect(act(() => table!.copyCells())).resolves.toBe(
      "20\t100\r\n21\t200"
    )
    expect(writeText).toHaveBeenCalledWith("20\t100\r\n21\t200")
    await act(() => table!.pasteCells("1"))
    expect(onCellsChange.mock.calls.at(-1)?.[1].reason).toBe("paste")
    await act(() => table!.clearCellValues())
    expect(onCellsChange.mock.calls.at(-1)?.[1].reason).toBe("clear")
    await act(() => table!.fillDown())
    expect(onCellsChange.mock.calls.at(-1)?.[1].reason).toBe("fill")
    act(() => table!.selectAllCells())
    expect(table!.selectedCellCount).toBe(36)
    act(() => table!.clearCellSelection())
    expect(table!.cellSelection).toEqual([])
  })
})
