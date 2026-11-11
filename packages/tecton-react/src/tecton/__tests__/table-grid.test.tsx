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
} from "@tecton/react/components/table"
import { TectonProvider } from "@tecton/react/tecton/provider"
import { TableSelectionCheckbox } from "@tecton/react/tecton/table-selection-checkbox"

import {
  describeRowElement,
  type TableGridOptions,
} from "../internal/table-grid"

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
              <TableSelectionCheckbox />
            </TableHead>
          )}
          <TableHead>Well</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {WELLS.map((well) => (
          <TableRow key={well.id} value={well.id} disabled={well.disabled}>
            {checkboxes && (
              <TableCell>
                <TableSelectionCheckbox />
              </TableCell>
            )}
            <TableHead scope="row">{well.name}</TableHead>
            <TableCell>
              {link ? <a href={`#${well.id}`}>{well.status}</a> : well.status}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  )
  return grid ? (
    <Table grid aria-label="Wells" {...options}>
      {rows}
    </Table>
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
  it("leaves a table without grid as it was", () => {
    render(<Wells grid={false} link />)
    const table = screen.getByRole("table")
    expect(table).not.toHaveAttribute("role")
    expect(row("34/10-A-12")).not.toHaveAttribute("tabindex")
    expect(row("34/10-A-12")).not.toHaveAttribute("value")
    expect(row("34/10-B-03")).not.toHaveAttribute("aria-disabled")
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

  it("selects one row on click and activates on double click with onActivate", () => {
    const onActivate = vi.fn()
    render(<Wells selectionMode="multiple" onActivate={onActivate} />)
    fireEvent.click(cell("Shut in"))
    fireEvent.click(cell("34/10-A-12"))
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "false")
    fireEvent.click(cell("Shut in"), { ctrlKey: true })
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    fireEvent.doubleClick(cell("Shut in"))
    expect(onActivate).toHaveBeenCalledWith("a14")
    // From the keyboard, the selection follows focus; Enter activates.
    act(() => row("34/10-A-12").focus())
    press("ArrowDown")
    expect(row("34/10-A-14")).toHaveAttribute("aria-selected", "true")
    expect(row("34/10-A-12")).toHaveAttribute("aria-selected", "false")
    press("Enter")
    expect(onActivate).toHaveBeenLastCalledWith("a14")
  })

  it("activates on click when rows do not select", () => {
    const onActivate = vi.fn()
    render(<Wells onActivate={onActivate} />)
    fireEvent.click(cell("Shut in"))
    expect(onActivate).toHaveBeenCalledWith("a14")
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

describe("TableSelectionCheckbox", () => {
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

  it("throws outside a grid table", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <table>
          <tbody>
            <tr>
              <td>
                <TableSelectionCheckbox />
              </td>
            </tr>
          </tbody>
        </table>
      )
    ).toThrow(/inside a Table with grid/)
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
      <Table grid aria-label="Assets">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            value="gullfaks"
            level={1}
            expanded={open}
            onExpandedChange={toggle("gullfaks")}
          >
            <TableCell>Gullfaks</TableCell>
          </TableRow>
          {open && (
            <TableRow value="gfa" level={2}>
              <TableCell>Gullfaks A</TableCell>
            </TableRow>
          )}
          <TableRow value="oseberg" level={1}>
            <TableCell>Oseberg</TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
        <Table grid aria-label="Wells">
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
            <TableRow value="a12">
              <TableCell>34/10-A-12</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
      <Table grid aria-label="Wells">
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody empty="No wells">{[]}</TableBody>
      </Table>
    )
    expect(cell("No wells")).toHaveAttribute("colspan", "2")
    // With no rows, Tab lands on the header.
    expect(tabStops()).toEqual([cell("Well")])
  })

  it("gives every element its own tabindex back when grid is turned off", () => {
    const { rerender } = render(<Wells link />)
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("tabindex", "-1")
    rerender(<Wells link grid={false} />)
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

  function Many({ onValueChange }: Pick<TableGridOptions, "onValueChange">) {
    return (
      <div style={{ height: VIEW }}>
        <Table
          grid
          virtualized
          aria-label="Wells"
          selectionMode="multiple"
          onValueChange={onValueChange}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody items={MANY}>
            {(well) => (
              <TableRow key={well.id} value={well.id} textValue={well.name}>
                <TableCell>{well.name}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

  it("selects every row, the ones out of view too", () => {
    layout()
    const onValueChange = vi.fn()
    render(<Many onValueChange={onValueChange} />)
    act(() => row("Well 0").focus())
    press("a", { ctrlKey: true })
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    expect(value).toHaveLength(10_000)
    expect(value[9_999]).toBe("w9999")
  })
})

describe("describeRowElement", () => {
  it("reads a row's props, through a render element too", () => {
    expect(
      describeRowElement(
        <TableRow value="a12" textValue="34/10-A-12" level={2} disabled />
      )
    ).toEqual({
      value: "a12",
      textValue: "34/10-A-12",
      level: 2,
      disabled: true,
    })
    const Wrapper = (_: { value: string; render: React.ReactElement }) => null
    expect(
      describeRowElement(
        <Wrapper value="a14" render={<TableRow textValue="34/10-A-14" />} />
      )
    ).toEqual({
      value: "a14",
      textValue: "34/10-A-14",
      level: undefined,
      disabled: false,
    })
  })
})
