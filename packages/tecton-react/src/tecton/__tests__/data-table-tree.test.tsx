import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableProps,
} from "@tecton/react/data-table"

import {
  cell,
  checkbox,
  focused,
  focusRow,
  layout,
  names,
  press,
  row,
  scrollable,
} from "./data-table-fixtures"

type Asset = {
  id: string
  name: string
  depth?: number
  children?: Array<Asset>
}

const ASSETS: Array<Asset> = [
  {
    id: "gullfaks",
    name: "Gullfaks",
    children: [
      {
        id: "gfa",
        name: "Gullfaks A",
        children: [
          { id: "a12", name: "A-12", depth: 2400 },
          { id: "a14", name: "A-14", depth: 2100 },
        ],
      },
      { id: "gfb", name: "Gullfaks B" },
    ],
  },
  { id: "snorre", name: "Snorre", children: [{ id: "sa", name: "Snorre A" }] },
  { id: "visund", name: "Visund" },
]

const assetColumns = createColumns<Asset>([
  { id: "name", header: "Name" },
  { id: "depth", header: "Depth", type: "number" },
])

function Assets({ items = ASSETS, ...props }: Partial<DataTableProps<Asset>>) {
  return (
    <DataTable
      items={items}
      columns={assetColumns}
      itemToChildren={(asset) => asset.children}
      {...props}
    >
      <DataTableContent aria-label="Assets" />
    </DataTable>
  )
}

const chevron = (name: string) =>
  cell(name).querySelector<HTMLButtonElement>(
    '[data-slot="data-table-chevron"]'
  )!

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DataTable tree", () => {
  it("opens or closes a row on every click of its chevron, a quick series selecting no text", () => {
    render(<Assets />)
    const states = [1, 2, 3].map((detail) => {
      // Not focused by a press, nor a start of a text selection.
      expect(fireEvent.mouseDown(chevron("Gullfaks"), { detail })).toBe(false)
      fireEvent.click(chevron("Gullfaks"), { detail })
      return row("Gullfaks").getAttribute("aria-expanded")
    })
    expect(states).toEqual(["true", "false", "true"])
    // A ghost icon Button.
    expect(chevron("Gullfaks")).toHaveAttribute("data-variant", "ghost")
    expect(chevron("Gullfaks")).toHaveAttribute("data-size", "icon-xs")
  })

  it("is a treegrid whose rows have a level, a place and an expanded state", () => {
    render(<Assets defaultExpanded={["gullfaks"]} />)
    expect(screen.getByRole("treegrid", { name: "Assets" })).toBeInTheDocument()
    expect(names()).toEqual([
      "Gullfaks",
      "Gullfaks A",
      "Gullfaks B",
      "Snorre",
      "Visund",
    ])
    expect(row("Gullfaks")).toHaveAttribute("aria-level", "1")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    expect(row("Gullfaks")).toHaveAttribute("aria-posinset", "1")
    expect(row("Gullfaks")).toHaveAttribute("aria-setsize", "3")
    expect(row("Gullfaks B")).toHaveAttribute("aria-level", "2")
    expect(row("Gullfaks B")).toHaveAttribute("aria-posinset", "2")
    expect(row("Gullfaks B")).toHaveAttribute("aria-setsize", "2")
    expect(row("Gullfaks A")).toHaveAttribute("aria-expanded", "false")
    // A row without children has no expanded state.
    expect(row("Visund")).not.toHaveAttribute("aria-expanded")
  })

  it("indents each level in the row header, with the chevron or its space", () => {
    render(<Assets defaultExpanded={["gullfaks"]} />)
    const indent = (name: string) =>
      (cell(name).firstElementChild as HTMLElement).style.paddingInlineStart
    expect(indent("Gullfaks")).toBe("0rem")
    expect(indent("Gullfaks B")).toBe("1.25rem")
    const button = chevron("Gullfaks")
    expect(button).toHaveAttribute("aria-hidden", "true")
    expect(button).toHaveAttribute("tabindex", "-1")
    expect(button.querySelector("svg")).toHaveClass("rotate-90")
    // A leaf keeps the chevron's space.
    expect(
      cell("Gullfaks B").querySelector('[data-slot="data-table-chevron"]')
    ).toBeNull()
    expect(
      cell("Gullfaks B").querySelector('span[aria-hidden="true"].size-6')
    ).not.toBeNull()
  })

  it("opens and closes a row with its chevron", () => {
    const onExpandedChange = vi.fn()
    render(<Assets onExpandedChange={onExpandedChange} />)
    fireEvent.click(chevron("Snorre"))
    expect(screen.getByText("Snorre A")).toBeInTheDocument()
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      ["snorre"],
      expect.objectContaining({ reason: "item-press" })
    )
    fireEvent.click(chevron("Snorre"))
    expect(screen.queryByText("Snorre A")).toBeNull()
    expect(onExpandedChange).toHaveBeenLastCalledWith([], expect.anything())
  })

  it("opens and closes rows with Right and Left, and goes to the parent", () => {
    const onExpandedChange = vi.fn()
    render(<Assets onExpandedChange={onExpandedChange} />)
    focusRow("Gullfaks")
    press("ArrowRight")
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      ["gullfaks"],
      expect.objectContaining({ reason: "keyboard" })
    )
    press("ArrowDown")
    expect(focused()).toBe(row("Gullfaks A"))
    press("ArrowRight")
    expect(screen.getByText("A-12")).toBeInTheDocument()
    press("ArrowDown")
    expect(focused()).toBe(row("A-12"))
    press("ArrowLeft")
    expect(focused()).toBe(row("Gullfaks A"))
    press("ArrowLeft")
    expect(screen.queryByText("A-12")).toBeNull()
    press("Enter")
    expect(screen.getByText("A-12")).toBeInTheDocument()
  })

  it("shows controlled rows open", () => {
    const onExpandedChange = vi.fn()
    render(<Assets expanded={["snorre"]} onExpandedChange={onExpandedChange} />)
    expect(screen.getByText("Snorre A")).toBeInTheDocument()
    fireEvent.click(chevron("Snorre"))
    expect(onExpandedChange).toHaveBeenCalledWith([], expect.anything())
    expect(screen.getByText("Snorre A")).toBeInTheDocument()
  })

  it("sorts each level among its siblings", () => {
    render(<Assets defaultExpanded={["gullfaks", "gfa"]} />)
    fireEvent.click(
      screen
        .getByRole("columnheader", { name: "Depth" })
        .querySelector("button")!
    )
    expect(names().slice(0, 4)).toEqual([
      "Gullfaks",
      "Gullfaks A",
      "A-14",
      "A-12",
    ])
  })

  it("selects parents and children independently", () => {
    const onValueChange = vi.fn()
    render(
      <Assets
        selectionMode="multiple"
        defaultExpanded={["gullfaks"]}
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(checkbox("Gullfaks"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["gullfaks"],
      expect.anything()
    )
    expect(row("Gullfaks A")).toHaveAttribute("aria-selected", "false")
  })

  it("keeps every row on its stripe as rows open: the body's rows are the display rows", () => {
    render(<Assets striped />)
    const body = () =>
      [...document.querySelectorAll("tbody")[0].children].map(
        (element) => element.querySelector("th")?.textContent
      )
    expect(body()).toEqual(["Gullfaks", "Snorre", "Visund"])
    fireEvent.click(chevron("Gullfaks"))
    expect(body()).toEqual([
      "Gullfaks",
      "Gullfaks A",
      "Gullfaks B",
      "Snorre",
      "Visund",
    ])
  })

  it("shows a spinner in place of the chevron while a server row's children load", () => {
    const onExpandedChange = vi.fn()
    const { rerender } = render(
      <Assets
        dataMode="server"
        items={[{ id: "gullfaks", name: "Gullfaks" }]}
        itemToChildren={(asset) => asset.children}
        expanded={[]}
        onExpandedChange={onExpandedChange}
      />
    )
    // Not loaded yet: undefined children make the row expandable.
    const props = {
      dataMode: "server" as const,
      itemToChildren: (asset: Asset) => asset.children,
      expanded: ["gullfaks"],
    }
    rerender(
      <Assets {...props} items={[{ id: "gullfaks", name: "Gullfaks" }]} />
    )
    expect(row("Gullfaks")).toHaveAttribute("aria-expanded", "true")
    expect(
      cell("Gullfaks").querySelector('[data-slot="spinner"]')
    ).not.toBeNull()
    rerender(
      <Assets
        {...props}
        items={[
          {
            id: "gullfaks",
            name: "Gullfaks",
            children: [{ id: "gfa", name: "Gullfaks A" }],
          },
        ]}
      />
    )
    expect(cell("Gullfaks").querySelector('[data-slot="spinner"]')).toBeNull()
    expect(screen.getByText("Gullfaks A")).toBeInTheDocument()
  })
})

describe("DataTable virtualized", () => {
  type Item = { id: string; name: string; depth: number }
  const MANY: Array<Item> = Array.from({ length: 10_000 }, (_, i) => ({
    id: `w${i}`,
    name: `Well ${i}`,
    depth: i,
  }))
  const manyColumns = createColumns<Item>([
    { id: "name", header: "Well" },
    { id: "depth", header: "Depth", type: "number" },
  ])

  function Many(props: Partial<DataTableProps<Item>>) {
    return (
      <div style={{ height: 400 }}>
        <DataTable items={MANY} columns={manyColumns} {...props}>
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
  }

  it("renders a window of rows, and tells the table's size", () => {
    layout()
    render(<Many />)
    const rendered = document.querySelectorAll("tbody tr[data-index]")
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(100)
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "10001")
  })

  it("selects every row with Ctrl + A, the rows out of view too", () => {
    layout()
    const onValueChange = vi.fn()
    render(
      <Many
        selectionMode="multiple"
        isItemDisabled={(item) => item.id === "w5000"}
        onValueChange={onValueChange}
      />
    )
    focusRow("Well 0")
    press("a", { ctrlKey: true })
    const [value] = onValueChange.mock.lastCall as [Array<string>]
    expect(value).toHaveLength(9_999)
    expect(value).not.toContain("w5000")
    expect(value.at(-1)).toBe("w9999")
    expect(
      screen.getByRole("checkbox", { name: "Select All" })
    ).toHaveAttribute("aria-checked", "true")
  })

  it("goes to a row out of view by typing its name", () => {
    layout()
    render(<Many />)
    scrollable()
    focusRow("Well 0")
    act(() => {
      for (const key of "Well 9876") press(key)
    })
    expect(focused()).toHaveTextContent("Well 9876")
  })

  it("goes to the last row with End, scrolled into view", () => {
    layout()
    render(<Many />)
    scrollable()
    focusRow("Well 0")
    act(() => {
      press("End")
    })
    expect(focused()).toHaveTextContent("Well 9999")
    expect(focused()).toHaveAttribute("aria-rowindex", "10001")
  })

  it("keeps each row's stripe parity as rows mount and unmount", () => {
    layout()
    render(<Many striped />)
    scrollable()
    focusRow("Well 0")
    act(() => {
      press("End")
    })
    const body = document.querySelector("tbody")!
    const children = [...body.children]
    for (const element of body.querySelectorAll<HTMLElement>("tr[data-index]"))
      expect(children.indexOf(element) % 2).toBe(
        Number(element.dataset.index) % 2
      )
  })

  it("sorts 10,000 rows, rendering a window", () => {
    layout()
    render(<Many />)
    fireEvent.click(
      screen
        .getByRole("columnheader", { name: "Depth" })
        .querySelector("button")!
    )
    fireEvent.click(
      screen
        .getByRole("columnheader", { name: "Depth" })
        .querySelector("button")!
    )
    expect(names()[0]).toBe("Well 9999")
    expect(
      document.querySelectorAll("tbody tr[data-index]").length
    ).toBeLessThan(100)
  })
})

describe("DataTable tree virtualized", () => {
  it("reads a parent out of view from the rows' levels", async () => {
    layout()
    const children = Array.from({ length: 500 }, (_, i) => ({
      id: `c${i}`,
      name: `Child ${i}`,
    }))
    render(
      <div style={{ height: 400 }}>
        <DataTable
          items={[{ id: "p", name: "Parent", children }]}
          columns={assetColumns}
          itemToChildren={(asset: Asset) => asset.children}
          defaultExpanded={["p"]}
        >
          <DataTableContent aria-label="Assets" virtualized />
        </DataTable>
      </div>
    )
    scrollable()
    expect(await screen.findByRole("treegrid")).toBeInTheDocument()
    focusRow("Parent")
    act(() => {
      press("End")
    })
    expect(focused()).toHaveTextContent("Child 499")
    expect(screen.queryByText("Parent")).toBeNull()
    act(() => {
      press("ArrowLeft")
    })
    expect(focused()).toHaveTextContent("Parent")
  })
})
