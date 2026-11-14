import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/table"
import { TectonProvider } from "@tecton/react/provider"

import { DataTableSelectionCheckbox } from "../internal/data-table/selection-checkbox"
import {
  TableGridOptionsContext,
  TableGridValueContext,
  TableRowConfigContext,
  type RowDescription,
  type TableGridOptions,
  type TableRowGridProps,
} from "../internal/table-grid"

/** A `Table` in grid mode, as `DataTable` renders it. */
function GridTable({
  options = {},
  ...props
}: React.ComponentProps<typeof Table> & {
  options?: TableGridOptions & { value?: ReadonlyArray<string> }
}) {
  const { value, ...rest } = options
  return (
    <TableGridOptionsContext value={rest}>
      <TableGridValueContext value={value}>
        <Table {...props} />
      </TableGridValueContext>
    </TableGridOptionsContext>
  )
}

/**
 * A body row with its grid state. A component that passes its props on to
 * `TableRow`, as a virtualized body clones its rows with `aria-rowindex` and
 * `data-index`.
 */
function GridRow({
  config,
  ...props
}: React.ComponentProps<typeof TableRow> & { config: TableRowGridProps }) {
  return (
    <TableRowConfigContext value={config}>
      <TableRow {...props} />
    </TableRowConfigContext>
  )
}

type Well = { id: string; name: string; status: string; disabled?: boolean }

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", status: "Producing" },
  { id: "a14", name: "34/10-A-14", status: "Shut in" },
  { id: "b03", name: "34/10-B-03", status: "Drilling", disabled: true },
  { id: "c07", name: "Gullfaks C-07", status: "Producing" },
]

function Wells({
  checkboxes = false,
  link = false,
  grid = true,
  ...options
}: TableGridOptions & {
  value?: ReadonlyArray<string>
  checkboxes?: boolean
  link?: boolean
  grid?: boolean
}) {
  const rows = (
    <>
      <TableHeader>
        <TableRow>
          {checkboxes && (
            <TableHead>
              <DataTableSelectionCheckbox />
            </TableHead>
          )}
          <TableHead>Well</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {WELLS.map((well) => (
          <GridRow
            key={well.id}
            config={{ value: well.id, disabled: well.disabled }}
          >
            {checkboxes && (
              <TableCell>
                <DataTableSelectionCheckbox />
              </TableCell>
            )}
            <TableHead scope="row">{well.name}</TableHead>
            <TableCell>
              {link ? <a href={`#${well.id}`}>{well.status}</a> : well.status}
            </TableCell>
          </GridRow>
        ))}
      </TableBody>
    </>
  )
  return grid ? (
    <GridTable aria-label="Wells" options={options}>
      {rows}
    </GridTable>
  ) : (
    <Table aria-label="Wells">{rows}</Table>
  )
}

const row = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLTableRowElement
const cell = (text: string) =>
  screen.getByText(text).closest("td, th") as HTMLTableCellElement
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
const tabStops = () =>
  Array.from(document.querySelectorAll<HTMLElement>('table [tabindex="0"]'))

function focusFirstRow() {
  act(() => row("34/10-A-12").focus())
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Table grid", () => {
  it("leaves a table outside a TableGridConfig as it was", () => {
    render(<Wells grid={false} link />)
    const table = screen.getByRole("table")
    expect(table).not.toHaveAttribute("role")
    expect(row("34/10-A-12")).not.toHaveAttribute("tabindex")
    expect(row("34/10-A-12")).not.toHaveAttribute("aria-selected")
    expect(row("34/10-B-03")).not.toHaveAttribute("aria-disabled")
    expect(row("34/10-B-03")).not.toHaveAttribute("data-disabled")
    expect(screen.getAllByRole("link")[0]).not.toHaveAttribute("tabindex")
  })

  it("is a grid with one tab stop: the first enabled row", () => {
    render(<Wells checkboxes link selectionMode="multiple" />)
    expect(screen.getByRole("grid", { name: "Wells" })).toHaveAttribute(
      "aria-multiselectable",
      "true"
    )
    expect(tabStops()).toEqual([row("34/10-A-12")])
    for (const checkbox of screen.getAllByRole("checkbox"))
      expect(checkbox).toHaveAttribute("tabindex", "-1")
    for (const link of screen.getAllByRole("link"))
      expect(link).toHaveAttribute("tabindex", "-1")
    expect(row("34/10-B-03")).toHaveAttribute("aria-disabled", "true")
  })

  it("moves between rows, skipping disabled ones", () => {
    render(<Wells />)
    focusFirstRow()
    press("ArrowDown")
    expect(focused()).toBe(row("34/10-A-14"))
    press("ArrowDown")
    expect(focused()).toBe(row("Gullfaks C-07"))
    press("ArrowDown")
    expect(focused()).toBe(row("Gullfaks C-07"))
    press("Home")
    expect(focused()).toBe(row("34/10-A-12"))
    press("End")
    expect(focused()).toBe(row("Gullfaks C-07"))
    // The tab stop follows focus.
    expect(tabStops()).toEqual([row("Gullfaks C-07")])
  })

  it("moves into a row's cells and controls, and back to the row", () => {
    render(<Wells checkboxes link selectionMode="multiple" />)
    focusFirstRow()
    const checkboxes = screen.getAllByRole("checkbox")
    press("ArrowRight")
    expect(focused()).toBe(checkboxes[1])
    press("ArrowRight")
    expect(focused()).toBe(cell("34/10-A-12"))
    press("ArrowRight")
    expect(focused()).toBe(screen.getAllByRole("link")[0])
    press("ArrowRight")
    expect(focused()).toBe(screen.getAllByRole("link")[0])
    press("ArrowLeft")
    expect(focused()).toBe(cell("34/10-A-12"))
    press("ArrowLeft")
    expect(focused()).toBe(checkboxes[1])
    press("ArrowLeft")
    expect(focused()).toBe(row("34/10-A-12"))
  })

  it("moves through a column, the header's cell included", () => {
    render(<Wells />)
    focusFirstRow()
    press("ArrowRight")
    press("ArrowRight")
    expect(focused()).toBe(
      within(row("34/10-A-12")).getByText("Producing").closest("td")
    )
    press("ArrowUp")
    expect(focused()).toBe(cell("Status"))
    press("ArrowDown")
    press("ArrowDown")
    expect(focused()).toBe(cell("Shut in"))
    // Ctrl + Home: the first cell of the first row.
    press("Home", { ctrlKey: true })
    expect(focused()).toBe(cell("Well"))
    press("End", { ctrlKey: true })
    const last = row("Gullfaks C-07").cells
    expect(focused()).toBe(last[last.length - 1])
  })

  it("mirrors Left and Right in a right-to-left table", () => {
    render(
      <TectonProvider direction="rtl">
        <Wells />
      </TectonProvider>
    )
    focusFirstRow()
    press("ArrowLeft")
    expect(focused()).toBe(cell("34/10-A-12"))
    press("ArrowRight")
    expect(focused()).toBe(row("34/10-A-12"))
  })

  it("goes to a row by typing its first letters", () => {
    render(<Wells />)
    focusFirstRow()
    press("g")
    expect(focused()).toBe(row("Gullfaks C-07"))
  })

  it("selects with Space, Shift + arrows, Ctrl + A, and clears with Escape", () => {
    const onValueChange = vi.fn()
    render(<Wells selectionMode="multiple" onValueChange={onValueChange} />)
    focusFirstRow()
    press(" ")
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-12")).toHaveAttribute("data-selected")
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12"],
      expect.objectContaining({ reason: "keyboard" })
    )
    press("ArrowDown", { shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12", "a14"],
      expect.anything()
    )
    press("Escape")
    expect(onValueChange).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ reason: "clear" })
    )
    press("a", { ctrlKey: true })
    // The disabled row is left out.
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12", "a14", "c07"],
      expect.objectContaining({ reason: "select-all" })
    )
    expect(row("34/10-B-03")).toHaveAttribute("aria-selected", "false")
  })

  it("shows a controlled value, and a default one when not controlled", () => {
    const { rerender } = render(
      <Wells selectionMode="multiple" value={["a14"]} />
    )
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    // Controlled: a click asks for a change, the value stays.
    fireEvent.click(cell("34/10-A-12"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "false")
    rerender(<Wells selectionMode="multiple" value={["a12"]} />)
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "false")
  })

  it("starts from defaultValue when not controlled", () => {
    render(<Wells selectionMode="multiple" defaultValue={["c07"]} />)
    expect(row("Gullfaks C-07")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(cell("34/10-A-12"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
  })

  it("keeps a row selected with disallowEmptySelection", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        selectionMode="single"
        defaultValue={["a12"]}
        disallowEmptySelection
        onValueChange={onValueChange}
      />
    )
    focusFirstRow()
    press("Escape")
    press(" ")
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("toggles a row on click; a disabled row does nothing", () => {
    const onValueChange = vi.fn()
    render(<Wells selectionMode="multiple" onValueChange={onValueChange} />)
    fireEvent.click(cell("Shut in"))
    fireEvent.click(cell("34/10-A-12"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a14", "a12"],
      expect.objectContaining({ reason: "item-press" })
    )
    expect(focused()).toBe(row("34/10-A-12"))
    fireEvent.click(cell("Drilling"))
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  it('selects one row on click and activates on double click with selectionBehavior="replace"', () => {
    const onActivate = vi.fn()
    render(
      <Wells
        selectionMode="multiple"
        selectionBehavior="replace"
        onActivate={onActivate}
      />
    )
    fireEvent.click(cell("Shut in"))
    fireEvent.click(cell("34/10-A-12"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "false")
    fireEvent.click(cell("Shut in"), { ctrlKey: true })
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    fireEvent.doubleClick(cell("Shut in"))
    expect(onActivate).toHaveBeenCalledWith("a14", expect.any(Event))
    // From the keyboard, the selection follows focus; Enter activates.
    act(() => row("34/10-A-12").focus())
    press("ArrowDown")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "false")
    press("Enter")
    expect(onActivate).toHaveBeenLastCalledWith("a14", expect.any(Event))
  })

  it('toggles rows with "toggle" and activates a click only while none is selected', () => {
    const onActivate = vi.fn()
    render(
      <Wells checkboxes selectionMode="multiple" onActivate={onActivate} />
    )
    // Nothing selected: a click activates.
    fireEvent.click(cell("Shut in"))
    expect(onActivate).toHaveBeenLastCalledWith("a14", expect.any(Event))
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "false")
    // Its double click does not activate again.
    fireEvent.click(cell("Shut in"), { detail: 2 })
    fireEvent.doubleClick(cell("Shut in"))
    expect(onActivate).toHaveBeenCalledTimes(1)
    // Once a row is selected, a click toggles a row, keeping the others.
    fireEvent.click(screen.getByRole("checkbox", { name: "Select 34/10-A-12" }))
    fireEvent.click(cell("Shut in"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    expect(onActivate).toHaveBeenCalledTimes(1)
    // The arrows move focus only; Space toggles; Enter activates.
    act(() => row("34/10-A-12").focus())
    press("ArrowDown")
    expect(focused()).toBe(row("34/10-A-14"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    press(" ")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "false")
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    press("Enter")
    expect(onActivate).toHaveBeenLastCalledWith("a14", expect.any(Event))
    // A double click activates while rows are selected.
    fireEvent.doubleClick(cell("Gullfaks C-07"))
    expect(onActivate).toHaveBeenLastCalledWith("c07", expect.any(Event))
    // Shift + the arrows still extend.
    press("ArrowUp", { shiftKey: true })
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
  })

  it("activates on click when rows do not select", () => {
    const onActivate = vi.fn()
    render(<Wells onActivate={onActivate} />)
    fireEvent.click(cell("Shut in"))
    expect(onActivate).toHaveBeenCalledWith("a14", expect.any(Event))
    expect(row("34/10-A-14")).not.toHaveAttribute("aria-selected")
    fireEvent.click(cell("Drilling"))
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it("leaves a click on a control in a row to the control", () => {
    const onValueChange = vi.fn()
    render(
      <Wells link selectionMode="multiple" onValueChange={onValueChange} />
    )
    fireEvent.click(screen.getAllByRole("link")[0])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("announces selection changes while focus is in the table", async () => {
    render(<Wells selectionMode="multiple" />)
    focusFirstRow()
    press(" ")
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="announcer"][aria-live="polite"]')
      ).toHaveTextContent("34/10-A-12 selected.")
    )
  })
})

describe("Table grid with items", () => {
  it("gives rows from items the state their TableRowConfig says", () => {
    const onValueChange = vi.fn()
    render(
      <GridTable
        aria-label="Wells"
        options={{ selectionMode: "multiple", onValueChange }}
      >
        <TableBody items={WELLS}>
          {(well) => (
            <GridRow
              key={well.id}
              config={{ value: well.id, disabled: well.disabled }}
            >
              <TableCell>{well.name}</TableCell>
            </GridRow>
          )}
        </TableBody>
      </GridTable>
    )
    fireEvent.click(cell("34/10-A-14"))
    expect(onValueChange).toHaveBeenLastCalledWith(["a14"], expect.anything())
    expect(row("34/10-B-03")).toHaveAttribute("aria-disabled", "true")
    expect(row("34/10-B-03")).toHaveAttribute("data-disabled")
  })
})

describe("DataTableSelectionCheckbox", () => {
  it("is named after its row and toggles it", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        checkboxes
        selectionMode="multiple"
        onValueChange={onValueChange}
      />
    )
    const checkbox = screen.getByRole("checkbox", {
      name: "Select 34/10-A-12",
    })
    fireEvent.click(checkbox)
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12"],
      expect.objectContaining({ reason: "item-press" })
    )
    expect(checkbox).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("checkbox", { name: "Select 34/10-B-03" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  it("selects the range to its row with Shift + click", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        checkboxes
        selectionMode="multiple"
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(screen.getByRole("checkbox", { name: "Select 34/10-A-12" }))
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Gullfaks C-07" }),
      { shiftKey: true }
    )
    // The disabled row in the range is left out.
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12", "a14", "c07"],
      expect.anything()
    )
  })

  it("selects or clears every row from the header", () => {
    render(<Wells checkboxes selectionMode="multiple" />)
    const all = screen.getByRole("checkbox", { name: "Select All" })
    expect(all).toHaveAttribute("aria-checked", "false")
    fireEvent.click(screen.getByRole("checkbox", { name: "Select 34/10-A-12" }))
    expect(all).toHaveAttribute("aria-checked", "mixed")
    fireEvent.click(all)
    expect(all).toHaveAttribute("aria-checked", "true")
    expect(row("Gullfaks C-07")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(all)
    expect(all).toHaveAttribute("aria-checked", "false")
    expect(row("Gullfaks C-07")).toHaveAttribute("aria-selected", "false")
  })

  it("has no header checkbox when one row selects", () => {
    render(<Wells checkboxes selectionMode="single" />)
    expect(screen.queryByRole("checkbox", { name: "Select All" })).toBeNull()
    expect(screen.getAllByRole("checkbox")).toHaveLength(WELLS.length)
  })

  it("renders nothing when rows do not select", () => {
    render(<Wells checkboxes />)
    expect(screen.queryByRole("checkbox")).toBeNull()
  })

  it("throws outside a grid table", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <table>
          <tbody>
            <tr>
              <td>
                <DataTableSelectionCheckbox />
              </td>
            </tr>
          </tbody>
        </table>
      )
    ).toThrow(/inside a Table in grid mode/)
  })
})

describe("Table grid as a tree", () => {
  function Assets({ onToggle }: { onToggle?: (id: string) => void }) {
    const [expanded, setExpanded] = React.useState<Array<string>>([])
    const toggle = (id: string) => (open: boolean) => {
      onToggle?.(id)
      setExpanded((list) =>
        open ? [...list, id] : list.filter((item) => item !== id)
      )
    }
    const open = expanded.includes("gullfaks")
    return (
      <GridTable aria-label="Assets">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <GridRow
            config={{
              value: "gullfaks",
              level: 1,
              expanded: open,
              onExpandedChange: toggle("gullfaks"),
            }}
          >
            <TableCell>Gullfaks</TableCell>
          </GridRow>
          {open && (
            <GridRow config={{ value: "gfa", level: 2 }}>
              <TableCell>Gullfaks A</TableCell>
            </GridRow>
          )}
          <GridRow config={{ value: "oseberg", level: 1 }}>
            <TableCell>Oseberg</TableCell>
          </GridRow>
        </TableBody>
      </GridTable>
    )
  }

  it("is a treegrid whose rows open and close with Right and Left", async () => {
    render(<Assets />)
    expect(await screen.findByRole("treegrid")).toBeInTheDocument()
    act(() => row("Gullfaks").focus())
    expect(row("Gullfaks")).toHaveAttribute("aria-level", "1")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "false")
    press("ArrowRight")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    expect(row("Gullfaks A")).toHaveAttribute("aria-level", "2")
    // Open: Right goes into the row.
    press("ArrowRight")
    expect(focused()).toBe(cell("Gullfaks"))
    press("ArrowLeft")
    press("ArrowDown")
    expect(focused()).toBe(row("Gullfaks A"))
    // A child row: Left goes to its parent, then closes it.
    press("ArrowLeft")
    expect(focused()).toBe(row("Gullfaks"))
    press("ArrowLeft")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Gullfaks A")).toBeNull()
    // Enter opens and closes too.
    press("Enter")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    // A row without children has no aria-expanded.
    expect(row("Oseberg")).not.toHaveAttribute("aria-expanded")
  })
})

describe("Table grid details", () => {
  it("announces a sort while focus is in the table", async () => {
    function Sorted() {
      const [sort, setSort] = React.useState<"ascending" | undefined>()
      return (
        <GridTable aria-label="Wells">
          <TableHeader>
            <TableRow>
              <TableHead aria-sort={sort}>
                <button type="button" onClick={() => setSort("ascending")}>
                  Well
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <GridRow config={{ value: "a12" }}>
              <TableCell>34/10-A-12</TableCell>
            </GridRow>
          </TableBody>
        </GridTable>
      )
    }
    render(<Sorted />)
    act(() => row("34/10-A-12").focus())
    press("ArrowRight")
    press("ArrowUp")
    const button = screen.getByRole("button", { name: "Well" })
    expect(focused()).toBe(button)
    fireEvent.click(button)
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="announcer"][aria-live="polite"]')
      ).toHaveTextContent("sorted by column Well in ascending order")
    )
  })

  it("shows `empty` across the columns when there are no rows", () => {
    render(
      <GridTable aria-label="Wells">
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody empty="No wells">{[]}</TableBody>
      </GridTable>
    )
    expect(cell("No wells")).toHaveAttribute("colspan", "2")
    // With no rows, Tab lands on the header.
    expect(tabStops()).toEqual([cell("Well")])
  })

  it("leaves the controls of `empty` in the Tab order and to their own keys", () => {
    render(
      <GridTable aria-label="Wells">
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          empty={
            <button
              type="button"
              onKeyDown={(event) => event.stopPropagation()}
            >
              Clear filters
            </button>
          }
        >
          {[]}
        </TableBody>
      </GridTable>
    )
    const button = screen.getByRole("button", { name: "Clear filters" })
    expect(button).not.toHaveAttribute("tabindex")
    act(() => button.focus())
    const down = fireEvent.keyDown(button, { key: "ArrowDown" })
    // Not the grid's row: the key is not taken, focus stays.
    expect(down).toBe(true)
    expect(focused()).toBe(button)
  })

  it("is a treegrid from the first render with `tree`", () => {
    render(<Wells tree />)
    expect(screen.getByRole("treegrid")).toBeInTheDocument()
  })

  it("selects every row getAllValues gives, and only those isSelectable allows", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        checkboxes
        selectionMode="multiple"
        onValueChange={onValueChange}
        getAllValues={() => ["a12", "a14", "c07", "x99"]}
        isSelectable={(value) => value !== "a14"}
      />
    )
    focusFirstRow()
    press("a", { ctrlKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a12", "c07", "x99"],
      expect.objectContaining({ reason: "select-all" })
    )
    // The header counts the rows given that can be selected, not the
    // rows rendered.
    const all = screen.getByRole("checkbox", { name: "Select All" })
    expect(all).toHaveAttribute("aria-checked", "true")
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Gullfaks C-07" })
    )
    expect(all).toHaveAttribute("aria-checked", "mixed")
    // Not selectable: focused and its checkbox disabled, never selected.
    act(() => row("34/10-A-14").focus())
    expect(focused()).toBe(row("34/10-A-14"))
    expect(row("34/10-A-14")).not.toHaveAttribute("aria-disabled")
    const calls = onValueChange.mock.calls.length
    press(" ")
    expect(onValueChange).toHaveBeenCalledTimes(calls)
  })

  it("leaves a plain table in a cell a plain table", () => {
    render(
      <GridTable aria-label="Wells" options={{ selectionMode: "multiple" }}>
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <GridRow config={{ value: "a12", level: 1, expanded: false }}>
            <TableCell>
              <Table aria-label="Logs">
                <TableBody>
                  <TableRow>
                    <TableCell>Gamma ray</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableCell>
          </GridRow>
        </TableBody>
      </GridTable>
    )
    const inner = screen.getByRole("table", { name: "Logs" })
    expect(inner).not.toHaveAttribute("role")
    const innerRow = screen.getByText("Gamma ray").closest("tr")!
    // Neither the grid's options nor the outer row's state reach it.
    expect(innerRow).not.toHaveAttribute("aria-selected")
    expect(innerRow).not.toHaveAttribute("aria-level")
    expect(innerRow).not.toHaveAttribute("aria-expanded")
    expect(innerRow).not.toHaveAttribute("tabindex")
  })

  it("gives every element its own tabindex back when the grid goes", () => {
    const { rerender } = render(<Wells link />)
    const link = screen.getAllByRole("link")[0]
    expect(link).toHaveAttribute("tabindex", "-1")
    // Without its TableGridConfig the table mounts anew, and the grid's
    // cleanup restores the tabindexes of the elements it leaves.
    rerender(<Wells link grid={false} />)
    expect(link).not.toHaveAttribute("tabindex")
    expect(screen.getAllByRole("link")[0]).not.toHaveAttribute("tabindex")
    expect(row("34/10-A-12")).not.toHaveAttribute("tabindex")
  })
})

describe("Table grid virtualized", () => {
  const ROW = 40
  const HEADER = 40
  const VIEW = 400
  const MANY = Array.from({ length: 10_000 }, (_, i) => ({
    id: `w${i}`,
    name: `Well ${i}`,
  }))

  type Item = (typeof MANY)[number]

  const DISABLED = "w5000"

  /** What a virtualized `DataTable` says of its items. */
  const describeWell = (well: Item): RowDescription => ({
    value: well.id,
    textValue: well.name,
    disabled: well.id === DISABLED,
    level: undefined,
  })

  function Many({
    describeItem = describeWell,
    onRender,
    ...options
  }: Omit<TableGridOptions, "describeItem"> & {
    describeItem?: ((well: Item, index: number) => RowDescription) | null
    onRender?: (item: Item) => void
  }) {
    return (
      <div style={{ height: VIEW }}>
        <GridTable
          virtualized
          aria-label="Wells"
          options={{
            selectionMode: "multiple",
            describeItem: describeItem ?? undefined,
            ...options,
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody items={MANY}>
            {(well, index) => {
              onRender?.(well)
              const { value, textValue, disabled, level } = describeItem
                ? describeItem(well, index)
                : describeWell(well)
              return (
                <GridRow
                  key={well.id}
                  config={{ value, textValue, disabled, level }}
                >
                  <TableCell>{well.name}</TableCell>
                </GridRow>
              )
            }}
          </TableBody>
        </GridTable>
      </div>
    )
  }

  function layout() {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(VIEW)
    const originalRect = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const box = (top: number, height: number) =>
          ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON() {},
          }) as DOMRect
        const index = (this as HTMLElement).dataset.index
        if (this.tagName === "THEAD" || this.tagName === "TABLE")
          return box(0, HEADER)
        if (this.tagName === "TH") return box(0, HEADER)
        if (this.tagName === "TR" && index !== undefined)
          return box(HEADER + Number(index) * ROW, ROW)
        return originalRect.call(this)
      }
    )
  }

  function scrollable() {
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    let top = 0
    Object.defineProperty(container, "scrollTop", {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    })
  }

  it("scrolls to a row out of view and focuses it", () => {
    layout()
    render(<Many />)
    scrollable()
    act(() => row("Well 0").focus())
    act(() => {
      press("End")
    })
    expect(focused()).toHaveTextContent("Well 9999")
    expect(focused()).toHaveAttribute("aria-rowindex", String(10_000 + 1))
    act(() => {
      press("Home")
    })
    expect(focused()).toHaveTextContent("Well 0")
  })

  it("selects every row through describeItem, without rendering the rows out of view", () => {
    layout()
    const onValueChange = vi.fn()
    const onRender = vi.fn()
    render(<Many onValueChange={onValueChange} onRender={onRender} />)
    act(() => row("Well 0").focus())
    onRender.mockClear()
    press("a", { ctrlKey: true })
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    // The row describeItem disables is left out, out of view too.
    expect(value).toHaveLength(9_999)
    expect(value).not.toContain(DISABLED)
    expect(value[9_998]).toBe("w9999")
    // Only the rows in view render again (they show as selected).
    expect(onRender.mock.calls.length).toBeLessThan(100)
    expect(row("Well 0")).toHaveAttribute("aria-selected", "true")
  })

  it("takes the rows' values from describeItem", () => {
    layout()
    const onValueChange = vi.fn()
    render(
      <Many
        describeItem={(well) => ({ ...describeWell(well), value: well.name })}
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(cell("Well 1"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["Well 1"],
      expect.anything()
    )
    act(() => row("Well 0").focus())
    press("a", { ctrlKey: true })
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    expect(value.at(-1)).toBe("Well 9999")
  })

  it("passes describeItem each item with its index", () => {
    layout()
    const describeItem =
      vi.fn<(well: Item, index: number) => RowDescription>(describeWell)
    const onValueChange = vi.fn()
    render(<Many describeItem={describeItem} onValueChange={onValueChange} />)
    act(() => row("Well 0").focus())
    describeItem.mockClear()
    press("a", { ctrlKey: true })
    // Compared by hand: a failing toHaveBeenCalledWith would print every call.
    const last = describeItem.mock.calls.find(([, index]) => index === 9_999)
    expect(last?.[0]).toBe(MANY[9_999])
  })

  it("selects all from getAllValues and isDisabled, describing no row", () => {
    layout()
    const describeItem =
      vi.fn<(well: Item, index: number) => RowDescription>(describeWell)
    const onValueChange = vi.fn()
    const values = MANY.map((well) => well.id)
    render(
      <Many
        describeItem={describeItem}
        onValueChange={onValueChange}
        getAllValues={() => values}
        isDisabled={(value) => value === DISABLED}
      />
    )
    act(() => row("Well 0").focus())
    describeItem.mockClear()
    press("a", { ctrlKey: true })
    expect(describeItem).not.toHaveBeenCalled()
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    expect(value).toHaveLength(9_999)
    expect(value).not.toContain(DISABLED)
  })

  it("knows only the rows rendered without describeItem", () => {
    layout()
    const onValueChange = vi.fn()
    render(<Many describeItem={null} onValueChange={onValueChange} />)
    act(() => row("Well 0").focus())
    press("a", { ctrlKey: true })
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    expect(value.length).toBeGreaterThan(0)
    expect(value.length).toBeLessThan(100)
  })

  it("goes to a row out of view by the text describeItem gives", () => {
    layout()
    render(<Many />)
    scrollable()
    act(() => row("Well 0").focus())
    act(() => {
      for (const key of "Well 9876") press(key)
    })
    expect(focused()).toHaveTextContent("Well 9876")
  })

  it("goes from a row to its parent out of view by the level describeItem gives", async () => {
    layout()
    const describeLevel = (well: Item, index: number): RowDescription => ({
      ...describeWell(well),
      level: index === 0 ? 1 : 2,
    })
    render(<Many describeItem={describeLevel} selectionMode="none" />)
    scrollable()
    expect(await screen.findByRole("treegrid")).toBeInTheDocument()
    act(() => row("Well 0").focus())
    act(() => {
      press("End")
    })
    expect(focused()).toHaveTextContent("Well 9999")
    expect(screen.queryByText("Well 0")).toBeNull()
    act(() => {
      press("ArrowLeft")
    })
    expect(focused()).toHaveTextContent("Well 0")
  })
})
