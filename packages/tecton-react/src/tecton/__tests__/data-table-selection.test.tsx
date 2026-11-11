import * as React from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTablePageButtons,
  DataTableSelectionCount,
  DataTableToolbar,
  useDataTable,
  type DataTableProps,
  type DataTableSelectionChangeDetails,
} from "@tecton/react/tecton/data-table"

import {
  cell,
  checkbox,
  columns,
  focused,
  focusRow,
  press,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

function Wells({
  items = WELLS,
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable
      items={items}
      columns={columns}
      selectionMode="multiple"
      {...props}
    >
      <DataTableContent aria-label="Wells" />
      <DataTableFooter>
        <DataTableSelectionCount />
        <DataTablePageButtons />
      </DataTableFooter>
      {children}
    </DataTable>
  )
}

const selectAll = () => screen.getByRole("checkbox", { name: "Select All" })
const lastValue = (spy: ReturnType<typeof vi.fn>) =>
  (spy.mock.lastCall as [Array<string>, DataTableSelectionChangeDetails])[0]
const lastDetails = (spy: ReturnType<typeof vi.fn>) =>
  (spy.mock.lastCall as [Array<string>, DataTableSelectionChangeDetails])[1]
const count = () =>
  document.querySelector('[data-slot="data-table-selection-count"] span')
    ?.textContent

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable selection", () => {
  it("selects a row with its checkbox, Space, or a click", () => {
    const onValueChange = vi.fn()
    render(<Wells items={WELLS.slice(0, 4)} onValueChange={onValueChange} />)
    expect(screen.getByRole("grid")).toHaveAttribute(
      "aria-multiselectable",
      "true"
    )
    fireEvent.click(checkbox("Well 02"))
    expect(lastValue(onValueChange)).toEqual(["w2"])
    expect(lastDetails(onValueChange).reason).toBe("item-press")
    expect(lastDetails(onValueChange).allMatching).toBeNull()
    expect(row("Well 02")).toHaveAttribute("aria-selected", "true")
    expect(checkbox("Well 02")).toHaveAttribute("aria-checked", "true")
    focusRow("Well 03")
    press(" ")
    expect(lastValue(onValueChange)).toEqual(["w2", "w3"])
    expect(lastDetails(onValueChange).reason).toBe("keyboard")
    fireEvent.click(cell("Well 01"))
    expect(lastValue(onValueChange)).toEqual(["w2", "w3", "w1"])
    expect(count()).toBe("3 of 4 selected")
  })

  it("extends from the last row selected with Shift + Space, not from the rows the arrows passed", () => {
    const onValueChange = vi.fn()
    render(<Wells items={WELLS.slice(0, 6)} onValueChange={onValueChange} />)
    fireEvent.click(checkbox("Well 02"))
    focusRow("Well 02")
    press("ArrowDown")
    press("ArrowDown")
    press("ArrowDown")
    expect(focused()).toBe(row("Well 05"))
    // The arrows moved focus only: nothing selected, the anchor kept.
    expect(lastValue(onValueChange)).toEqual(["w2"])
    press(" ", { shiftKey: true })
    expect(lastValue(onValueChange)).toEqual(["w2", "w3", "w4", "w5"])
    // A selection moves the anchor: Space on Well 01, then Shift + Space
    // two rows down.
    focusRow("Well 01")
    press(" ")
    press("ArrowDown")
    press("ArrowDown")
    press(" ", { shiftKey: true })
    expect(lastValue(onValueChange)).toEqual(
      expect.arrayContaining(["w1", "w2", "w3"])
    )
  })

  it("selects one row at a time with selectionMode single", () => {
    render(<Wells items={WELLS.slice(0, 4)} selectionMode="single" />)
    expect(screen.queryByRole("checkbox", { name: "Select All" })).toBeNull()
    fireEvent.click(checkbox("Well 01"))
    fireEvent.click(checkbox("Well 02"))
    expect(row("Well 01")).toHaveAttribute("aria-selected", "false")
    expect(row("Well 02")).toHaveAttribute("aria-selected", "true")
  })

  it("selects every matching row, on every page, from the header and with Ctrl + A", () => {
    const onValueChange = vi.fn()
    render(
      <Wells pagination defaultPageSize={5} onValueChange={onValueChange} />
    )
    fireEvent.click(checkbox("Well 01"))
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed")
    fireEvent.click(selectAll())
    expect(lastValue(onValueChange)).toHaveLength(23)
    expect(lastDetails(onValueChange).reason).toBe("select-all")
    expect(selectAll()).toHaveAttribute("aria-checked", "true")
    expect(count()).toBe("23 of 23 selected")
    fireEvent.click(selectAll())
    expect(lastValue(onValueChange)).toEqual([])
    expect(lastDetails(onValueChange).reason).toBe("clear")
    focusRow("Well 02")
    press("a", { ctrlKey: true })
    expect(lastValue(onValueChange)).toHaveLength(23)
    press("Escape")
    expect(lastValue(onValueChange)).toEqual([])
  })

  it("selects only the rows the view matches", () => {
    const onValueChange = vi.fn()
    let setSearch: ((search: string) => void) | undefined
    function Search() {
      setSearch = useDataTable().setSearch
      return null
    }
    render(
      <Wells filterable onValueChange={onValueChange}>
        <Search />
      </Wells>
    )
    act(() => setSearch?.("Gullfaks"))
    fireEvent.click(selectAll())
    const value = lastValue(onValueChange)
    expect(value).toHaveLength(6)
    expect(
      value.every(
        (id) => WELLS.find((well) => well.id === id)?.field === "Gullfaks"
      )
    ).toBe(true)
  })

  it("offers Select all N once the page is selected, then Clear selection", () => {
    const onValueChange = vi.fn()
    render(
      <Wells pagination defaultPageSize={5} onValueChange={onValueChange} />
    )
    const footer = within(
      document.querySelector('[data-slot="data-table-footer"]') as HTMLElement
    )
    expect(count()).toBe("0 of 23 selected")
    for (const name of ["Well 01", "Well 02", "Well 03", "Well 04"])
      fireEvent.click(checkbox(name))
    expect(footer.queryByRole("button", { name: "Select all 23" })).toBeNull()
    fireEvent.click(checkbox("Well 05"))
    fireEvent.click(footer.getByRole("button", { name: "Select all 23" }))
    expect(lastValue(onValueChange)).toHaveLength(23)
    expect(lastDetails(onValueChange).reason).toBe("select-all")
    expect(count()).toBe("23 of 23 selected")
    fireEvent.click(footer.getByRole("button", { name: "Clear selection" }))
    expect(lastValue(onValueChange)).toEqual([])
  })

  it("shows a controlled value, and starts from defaultValue", () => {
    const onValueChange = vi.fn()
    const { unmount } = render(
      <Wells
        items={WELLS.slice(0, 4)}
        value={["w3"]}
        onValueChange={onValueChange}
      />
    )
    expect(row("Well 03")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(checkbox("Well 01"))
    expect(lastValue(onValueChange)).toEqual(["w3", "w1"])
    // Controlled: nothing changes until the owner sets it.
    expect(row("Well 01")).toHaveAttribute("aria-selected", "false")
    unmount()
    render(<Wells items={WELLS.slice(0, 4)} defaultValue={["w4"]} />)
    expect(row("Well 04")).toHaveAttribute("aria-selected", "true")
    fireEvent.click(checkbox("Well 01"))
    expect(row("Well 01")).toHaveAttribute("aria-selected", "true")
  })

  it("keeps a row selected with disallowEmptySelection", () => {
    render(
      <Wells
        items={WELLS.slice(0, 3)}
        defaultValue={["w1"]}
        disallowEmptySelection
      />
    )
    fireEvent.click(checkbox("Well 01"))
    expect(row("Well 01")).toHaveAttribute("aria-selected", "true")
  })
})

describe("DataTable disabled rows", () => {
  const isItemDisabled = (well: Well) => well.id === "w2"

  it('keeps a disabled row from focus, selection and activation with disabledBehavior="all"', () => {
    const onActivate = vi.fn()
    const onValueChange = vi.fn()
    render(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        onActivate={onActivate}
        onValueChange={onValueChange}
      />
    )
    expect(row("Well 02")).toHaveAttribute("aria-disabled", "true")
    expect(checkbox("Well 02")).toHaveAttribute("aria-disabled", "true")
    focusRow("Well 01")
    press("ArrowDown")
    expect(focused()).toBe(row("Well 03"))
    fireEvent.click(selectAll())
    expect(lastValue(onValueChange)).toEqual(["w1", "w3", "w4"])
    fireEvent.doubleClick(cell("Well 02"))
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('focuses and activates a disabled row, but does not select it, with disabledBehavior="selection"', () => {
    const onActivate = vi.fn()
    const onValueChange = vi.fn()
    render(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        disabledBehavior="selection"
        onActivate={onActivate}
        onValueChange={onValueChange}
      />
    )
    expect(row("Well 02")).not.toHaveAttribute("aria-disabled")
    expect(checkbox("Well 02")).toHaveAttribute("aria-disabled", "true")
    focusRow("Well 01")
    press("ArrowDown")
    expect(focused()).toBe(row("Well 02"))
    press("Enter")
    expect(onActivate).toHaveBeenCalledWith("w2", WELLS[1])
    press(" ")
    expect(onValueChange).not.toHaveBeenCalled()
    press("a", { ctrlKey: true })
    expect(lastValue(onValueChange)).toEqual(["w1", "w3", "w4"])
    expect(selectAll()).toHaveAttribute("aria-checked", "true")
  })
})

describe("DataTable server selection", () => {
  const PAGE_ONE = WELLS.slice(0, 10)
  const PAGE_TWO = WELLS.slice(10, 20)

  function Server({
    onValueChange,
    items = PAGE_ONE,
    controlled = false,
  }: {
    onValueChange: (
      value: Array<string>,
      details: DataTableSelectionChangeDetails
    ) => void
    items?: Array<Well>
    controlled?: boolean
  }) {
    const [value, setValue] = React.useState<ReadonlyArray<string>>([])
    return (
      <Wells
        dataMode="server"
        filterable
        pagination
        rowCount={1240}
        items={items}
        value={controlled ? value : undefined}
        onValueChange={(next, details) => {
          onValueChange(next, details)
          setValue(next)
        }}
      >
        <Search />
      </Wells>
    )
  }

  let setSearch: ((search: string) => void) | undefined
  function Search() {
    setSearch = useDataTable().setSearch
    return null
  }

  it("selects the loaded rows from the header, then every matching row with Select all N", () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<Server onValueChange={onValueChange} />)
    fireEvent.click(selectAll())
    expect(lastValue(onValueChange)).toHaveLength(10)
    expect(lastDetails(onValueChange).allMatching).toBeNull()
    expect(count()).toBe("10 of 1,240 selected")

    fireEvent.click(screen.getByRole("button", { name: "Select all 1,240" }))
    expect(lastValue(onValueChange)).toHaveLength(10)
    expect(lastDetails(onValueChange).reason).toBe("select-all-matching")
    expect(lastDetails(onValueChange).allMatching).toEqual({ except: [] })
    expect(count()).toBe("1,240 of 1,240 selected")

    // A row deselected is an exception.
    fireEvent.click(checkbox("Well 03"))
    expect(lastDetails(onValueChange).allMatching).toEqual({ except: ["w3"] })
    expect(lastValue(onValueChange)).not.toContain("w3")
    expect(count()).toBe("1,239 of 1,240 selected")
    fireEvent.click(checkbox("Well 03"))
    expect(lastDetails(onValueChange).allMatching).toEqual({ except: [] })

    // Rows loaded later come selected.
    rerender(<Server onValueChange={onValueChange} items={PAGE_TWO} />)
    expect(row("Well 11")).toHaveAttribute("aria-selected", "true")
    expect(count()).toBe("1,240 of 1,240 selected")
  })

  it("leaves all-matching when the search changes", () => {
    const onValueChange = vi.fn()
    render(<Server onValueChange={onValueChange} controlled />)
    fireEvent.click(selectAll())
    fireEvent.click(screen.getByRole("button", { name: "Select all 1,240" }))
    expect(count()).toBe("1,240 of 1,240 selected")
    act(() => setSearch?.("Gullfaks"))
    expect(lastDetails(onValueChange).reason).toBe("view")
    expect(lastDetails(onValueChange).allMatching).toBeNull()
    expect(count()).toBe("10 of 1,240 selected")
  })

  it("leaves all-matching when a controlled value is set to another selection", () => {
    const onValueChange = vi.fn()
    function Owner() {
      const [value, setValue] = React.useState<ReadonlyArray<string>>([])
      return (
        <>
          <button type="button" onClick={() => setValue(["w1"])}>
            Reset
          </button>
          <Wells
            dataMode="server"
            rowCount={1240}
            items={PAGE_ONE}
            value={value}
            onValueChange={(next, details) => {
              onValueChange(next, details)
              setValue(next)
            }}
          />
        </>
      )
    }
    render(<Owner />)
    fireEvent.click(selectAll())
    fireEvent.click(screen.getByRole("button", { name: "Select all 1,240" }))
    expect(count()).toBe("1,240 of 1,240 selected")
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(count()).toBe("1 of 1,240 selected")
  })
})

describe("DataTable render counts", () => {
  function counted() {
    const renders = new Map<string, number>()
    const spied = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "field",
        header: "Field",
        cell: (well) => {
          renders.set(well.id, (renders.get(well.id) ?? 0) + 1)
          return well.field
        },
      },
    ])
    return { renders, spied }
  }

  it("renders no other row when one row's selection changes", () => {
    const { renders, spied } = counted()
    render(
      <DataTable items={WELLS} columns={spied} selectionMode="multiple">
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(renders.size).toBe(23)
    renders.clear()
    fireEvent.click(checkbox("Well 05"))
    expect(row("Well 05")).toHaveAttribute("aria-selected", "true")
    // The row's `tr` and checkbox show the change; no cell renders again.
    expect([...renders.keys()]).toEqual([])
    fireEvent.click(checkbox("Well 05"))
    expect(row("Well 05")).toHaveAttribute("aria-selected", "false")
    expect([...renders.keys()]).toEqual([])
  })

  it("renders no other row when a controlled selection changes", () => {
    const { renders, spied } = counted()
    function Owner() {
      const [value, setValue] = React.useState<ReadonlyArray<string>>([])
      return (
        <DataTable
          items={WELLS}
          columns={spied}
          selectionMode="multiple"
          value={value}
          onValueChange={setValue}
        >
          <DataTableContent aria-label="Wells" />
        </DataTable>
      )
    }
    render(<Owner />)
    renders.clear()
    fireEvent.click(checkbox("Well 07"))
    expect(row("Well 07")).toHaveAttribute("aria-selected", "true")
    expect([...renders.keys()]).toEqual([])
  })

  it("renders only the new page's rows on a page change, and nothing outside the table", () => {
    const { renders, spied } = counted()
    const outside = vi.fn()
    function Outside() {
      outside()
      return null
    }
    render(
      <DataTable
        items={WELLS}
        columns={spied}
        selectionMode="multiple"
        pagination
        defaultPageSize={5}
      >
        <DataTableToolbar>
          <Outside />
        </DataTableToolbar>
        <DataTableContent aria-label="Wells" />
        <DataTableFooter>
          <DataTablePageButtons />
        </DataTableFooter>
      </DataTable>
    )
    expect(outside).toHaveBeenCalledTimes(1)
    renders.clear()
    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect([...renders.keys()]).toEqual(["w6", "w7", "w8", "w9", "w10"])
    expect(outside).toHaveBeenCalledTimes(1)
  })

  it("renders only the row that opens in a tree", () => {
    type Node = { id: string; name: string; children?: Array<Node> }
    const renders: Array<string> = []
    const tree = createColumns<Node>([
      { id: "name", header: "Name" },
      {
        id: "count",
        header: "Wells",
        accessor: (node) => node.children?.length ?? 0,
        cell: (node) => {
          renders.push(node.id)
          return node.children?.length ?? 0
        },
      },
    ])
    const nodes: Array<Node> = [
      { id: "a", name: "Gullfaks", children: [{ id: "a1", name: "A-1" }] },
      { id: "b", name: "Snorre", children: [{ id: "b1", name: "B-1" }] },
      { id: "c", name: "Visund" },
    ]
    render(
      <DataTable
        items={nodes}
        columns={tree}
        itemToChildren={(node) => node.children}
      >
        <DataTableContent aria-label="Assets" />
      </DataTable>
    )
    renders.length = 0
    focusRow("Gullfaks")
    press("ArrowRight")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    // The row that opened, and the child it shows.
    expect(renders.sort()).toEqual(["a", "a1"])
  })
})
