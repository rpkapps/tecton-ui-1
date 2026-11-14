import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableActionBar,
  DataTableFooter,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
  type DataTableProps,
  type DataTableSelectionChangeDetails,
} from "@tecton/react/data-table"

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
      <DataTableActionBar />
      <DataTableContent aria-label="Wells" />
      <DataTableFooter>
        <DataTablePagination />
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
/** The action bar's "3 of 4 selected", while it shows. */
const count = () =>
  document.querySelector(
    '[data-slot="action-bar-selection"] > [aria-hidden] > span'
  )?.textContent

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
    const bar = () =>
      within(
        document.querySelector(
          '[data-slot="data-table-action-bar"]'
        ) as HTMLElement
      )
    // No rows selected: no bar.
    expect(count()).toBeUndefined()
    for (const name of ["Well 01", "Well 02", "Well 03", "Well 04"])
      fireEvent.click(checkbox(name))
    expect(bar().queryByRole("button", { name: "Select all 23" })).toBeNull()
    fireEvent.click(checkbox("Well 05"))
    fireEvent.click(bar().getByRole("button", { name: "Select all 23" }))
    expect(lastValue(onValueChange)).toHaveLength(23)
    expect(lastDetails(onValueChange).reason).toBe("select-all")
    expect(count()).toBe("23 of 23 selected")
    fireEvent.click(bar().getByRole("button", { name: "Clear selection" }))
    expect(lastValue(onValueChange)).toEqual([])
    expect(count()).toBeUndefined()
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

describe("DataTable disabled reasons", () => {
  const isItemDisabled = (well: Well) => well.id === "w2"
  const REASON = "Plugged wells can't be added to a project"
  const itemToDisabledReason = (well: Well) =>
    well.id === "w2" || well.id === "w3" ? REASON : undefined
  const tooltip = () =>
    document.querySelector<HTMLElement>('[data-slot="tooltip-content"]')
  const triggers = () =>
    document.querySelectorAll('[data-slot="table-selection-reason"]')

  it.each(["all", "selection"] as const)(
    'shows why a row cannot be selected on hover, with disabledBehavior="%s"',
    async (disabledBehavior) => {
      render(
        <Wells
          items={WELLS.slice(0, 4)}
          isItemDisabled={isItemDisabled}
          itemToDisabledReason={itemToDisabledReason}
          disabledBehavior={disabledBehavior}
        />
      )
      // Only the disabled row's checkbox: Well 03 has a reason, but can be
      // selected.
      expect(triggers()).toHaveLength(1)
      expect(checkbox("Well 02")).toHaveAccessibleDescription(REASON)
      expect(checkbox("Well 03")).not.toHaveAttribute("aria-describedby")
      expect(tooltip()).toBeNull()
      await userEvent.hover(checkbox("Well 02"))
      await waitFor(() => expect(tooltip()).toHaveTextContent(REASON))
    }
  )

  it('shows the reason as the arrow keys reach the checkbox, with disabledBehavior="selection"', async () => {
    render(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        itemToDisabledReason={itemToDisabledReason}
        disabledBehavior="selection"
      />
    )
    focusRow("Well 01")
    press("ArrowDown")
    // The row says why Space does not select it.
    expect(focused()).toBe(row("Well 02"))
    expect(row("Well 02")).toHaveAccessibleDescription(REASON)
    expect(row("Well 03")).not.toHaveAttribute("aria-describedby")
    press("ArrowRight")
    expect(focused()).toBe(checkbox("Well 02"))
    await waitFor(() => expect(tooltip()).toHaveTextContent(REASON))
    // Focus moving on closes it.
    press("ArrowDown")
    expect(focused()).toBe(checkbox("Well 03"))
    await waitFor(() => expect(tooltip()).toBeNull())
  })

  it('describes a row that focus passes over, with disabledBehavior="all"', () => {
    render(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        itemToDisabledReason={itemToDisabledReason}
      />
    )
    expect(row("Well 02")).toHaveAccessibleDescription(REASON)
    expect(checkbox("Well 02")).toHaveAccessibleDescription(REASON)
    focusRow("Well 01")
    press("ArrowDown")
    expect(focused()).toBe(row("Well 03"))
  })

  it("renders no tooltip or description without a reason", async () => {
    const { rerender } = render(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        itemToDisabledReason={() => undefined}
        disabledBehavior="selection"
      />
    )
    const none = async () => {
      expect(triggers()).toHaveLength(0)
      expect(checkbox("Well 02")).toHaveAttribute("aria-disabled", "true")
      expect(checkbox("Well 02")).not.toHaveAttribute("aria-describedby")
      expect(row("Well 02")).not.toHaveAttribute("aria-describedby")
      await userEvent.hover(checkbox("Well 02"))
      await new Promise((resolve) => setTimeout(resolve, 700))
      expect(tooltip()).toBeNull()
      await userEvent.unhover(checkbox("Well 02"))
    }
    await none()
    rerender(
      <Wells
        items={WELLS.slice(0, 4)}
        isItemDisabled={isItemDisabled}
        disabledBehavior="selection"
      />
    )
    await none()
    // A reason, once the row can be selected, is not shown.
    rerender(
      <Wells
        items={WELLS.slice(0, 4)}
        itemToDisabledReason={itemToDisabledReason}
        disabledBehavior="selection"
      />
    )
    expect(checkbox("Well 02")).not.toHaveAttribute("aria-disabled")
    expect(triggers()).toHaveLength(0)
    expect(checkbox("Well 02")).not.toHaveAttribute("aria-describedby")
  })
})

describe("DataTable disabled rows that change", () => {
  it("selects a row once `isItemDisabled` no longer disables it", () => {
    const onValueChange = vi.fn()
    const items = WELLS.slice(0, 4)
    const { rerender } = render(
      <Wells
        items={items}
        isItemDisabled={(well) => well.id === "w2"}
        disabledBehavior="selection"
        onValueChange={onValueChange}
      />
    )
    expect(checkbox("Well 02")).toHaveAttribute("aria-disabled", "true")
    rerender(
      <Wells
        items={items}
        isItemDisabled={undefined}
        disabledBehavior="selection"
        onValueChange={onValueChange}
      />
    )
    expect(checkbox("Well 02")).not.toHaveAttribute("aria-disabled")
    focusRow("Well 02")
    press(" ")
    expect(lastValue(onValueChange)).toEqual(["w2"])
    // Disabled again, by a new function with other answers.
    rerender(
      <Wells
        items={items}
        isItemDisabled={(well) => well.id !== "w1"}
        disabledBehavior="selection"
        onValueChange={onValueChange}
      />
    )
    expect(checkbox("Well 03")).toHaveAttribute("aria-disabled", "true")
    expect(checkbox("Well 01")).not.toHaveAttribute("aria-disabled")
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
          <DataTablePagination />
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
