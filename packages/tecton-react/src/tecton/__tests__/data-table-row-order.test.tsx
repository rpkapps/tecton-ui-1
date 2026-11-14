import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  type DataTableProps,
} from "@tecton/react/data-table"

import { moveRow } from "../internal/data-table/row-order"
import {
  columns,
  focused,
  focusRow,
  layout,
  press,
  row,
  scrollable,
  WELLS,
  type Well,
} from "./data-table-fixtures"

/** The row drag and drop's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock("../internal/data-table/row-reorder", async (importOriginal) => {
  chunk.requested()
  await chunk.gate
  return importOriginal()
})

/** Body rows 40 px tall, one under the other below a 40 px header. */
const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const body =
      this.tagName === "TR" && this.parentElement?.tagName === "TBODY"
    const at = body ? [...this.parentElement.children].indexOf(this) : 0
    const top = body ? 40 + at * 40 : 0
    const height = body || this.tagName !== "DIV" ? 40 : 400
    return {
      left: 0,
      right: 600,
      width: 600,
      top,
      bottom: top + height,
      height,
      x: 0,
      y: top,
      toJSON() {},
    }
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  vi.restoreAllMocks()
})

function Wells({ onRowOrderChange, ...props }: Partial<DataTableProps<Well>>) {
  const [items, setItems] = React.useState(WELLS.slice(0, 4))
  return (
    <DataTable
      items={items}
      columns={columns}
      reorderableRows
      onRowOrderChange={(ids, details) => {
        onRowOrderChange?.(ids, details)
        if (details.isCanceled) return
        setItems(ids.map((id) => WELLS.find((well) => well.id === id)!))
      }}
      {...props}
    >
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}

const handle = (name: string) =>
  screen.getByRole("button", { name: `Drag ${name}` })
const order = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('tbody th[scope="row"]'),
    (header) => header.textContent
  )

describe("DataTable row reordering", () => {
  it("moves a row in a list, before the row at the gap", () => {
    const ids = ["a", "b", "c", "d", "e"]
    expect(moveRow(ids, ids, "a", 3)).toEqual(["b", "c", "a", "d", "e"])
    expect(moveRow(ids, ids, "d", 0)).toEqual(["d", "a", "b", "c", "e"])
    expect(moveRow(ids, ids, "b", 5)).toEqual(["a", "c", "d", "e", "b"])
    // A page of the rows: the gap after its last row is before the next.
    expect(moveRow(ids, ["b", "c"], "b", 2)).toEqual(["a", "c", "b", "d", "e"])
  })

  it("draws a handle per row in a column of its own, named for screen readers, before the code loads", async () => {
    render(<Wells selectionMode="multiple" />)
    expect(handle("Well 01")).toBeInTheDocument()
    expect(handle("Well 01").closest("td")).toBe(row("Well 01").cells[0])
    const head = screen.getAllByRole("columnheader")[0]
    expect(head).toHaveTextContent("Reorder")
    // Not one of the page's tab stops.
    expect(handle("Well 01")).toHaveAttribute("tabindex", "-1")
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  })

  it("moves a row with the keyboard, the move asked for before the code came, and puts focus back on its handle", async () => {
    const onRowOrderChange = vi.fn()
    render(<Wells onRowOrderChange={onRowOrderChange} />)
    focusRow("Well 01")
    press("ArrowRight")
    expect(focused()).toBe(handle("Well 01"))
    press("Enter")
    await act(async () => chunk.open())
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-row-drop-indicator"]')
      ).not.toBeNull()
    )
    // At its own place, then one place a key.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Insert before Well 02" })
      ).toHaveFocus()
    )
    press("ArrowDown")
    expect(
      screen.getByRole("button", { name: "Insert between Well 02 and Well 03" })
    ).toHaveFocus()
    press("ArrowDown")
    expect(
      screen.getByRole("button", { name: "Insert between Well 03 and Well 04" })
    ).toHaveFocus()
    press("Enter")
    expect(onRowOrderChange).toHaveBeenCalledWith(
      ["w2", "w3", "w1", "w4"],
      expect.objectContaining({ reason: "keyboard" })
    )
    expect(order()).toEqual(["Well 02", "Well 03", "Well 01", "Well 04"])
    await waitFor(() => expect(focused()).toBe(handle("Well 01")))
  })

  it("drags a row by its handle", async () => {
    await act(async () => chunk.open())
    const onRowOrderChange = vi.fn()
    render(<Wells onRowOrderChange={onRowOrderChange} />)
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-row-drop-indicator"]')
      ).not.toBeNull()
    )
    fireEvent.pointerDown(handle("Well 04"), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 180,
    })
    // Above the middle of Well 02.
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 20, clientY: 90 })
    expect(handle("Well 04")).toHaveAttribute("data-dragging")
    // An opaque copy in the table's frame, level with the row, cut to the
    // frame: the pointer's sideways travel does not move it.
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 80, clientY: 90 })
    const preview = document.querySelector<HTMLElement>(
      '[data-slot="data-table-content"] > table[inert]'
    )!
    expect(preview.style.opacity).toBe("1")
    expect(preview.style.transform).toMatch(/^translate\(0px, /)
    expect(preview.style.clipPath).toMatch(/^inset\(/)
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 20, clientY: 90 })
    expect(onRowOrderChange).toHaveBeenCalledWith(
      ["w1", "w4", "w2", "w3"],
      expect.objectContaining({ reason: "pointer" })
    )
  })

  it("moves a row with the keyboard past the rows rendered in a virtualized table", async () => {
    await act(async () => chunk.open())
    layout()
    const many = Array.from({ length: 200 }, (_, i) => ({
      ...WELLS[0],
      id: `m${i}`,
      name: `Well ${String(i).padStart(3, "0")}`,
    }))
    const onRowOrderChange = vi.fn()
    render(
      <div style={{ height: 400 }}>
        <DataTable
          items={many}
          columns={columns}
          reorderableRows
          onRowOrderChange={onRowOrderChange}
        >
          <DataTableContent aria-label="Wells" virtualized />
        </DataTable>
      </div>
    )
    scrollable()
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-row-drop-indicator"]')
      ).not.toBeNull()
    )
    const rendered = document.querySelectorAll("tbody tr[data-index]").length
    expect(rendered).toBeLessThan(100)
    focusRow("Well 000")
    press("ArrowRight")
    press("Enter")
    // Past every row rendered: the view scrolls to each place.
    for (let step = 0; step < 151; step++) press("ArrowDown")
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    expect(container.scrollTop).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", {
        name: "Insert between Well 151 and Well 152",
      })
    ).toHaveFocus()
    press("Enter")
    const ids = onRowOrderChange.mock.calls[0][0] as Array<string>
    expect(ids.indexOf("m0")).toBe(151)
    expect(ids).toHaveLength(200)
  })

  /** Moves `name`'s row one place down with the keyboard. */
  async function moveDown(name: string) {
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-row-drop-indicator"]')
      ).not.toBeNull()
    )
    focusRow(name)
    press("ArrowRight")
    press("Enter")
    await waitFor(() =>
      expect(focused()).toHaveAccessibleName(/^Insert (before|between)/)
    )
    press("ArrowDown")
    press("Enter")
  }

  it("leaves the rows as they were when the move is cancelled", async () => {
    await act(async () => chunk.open())
    const onRowOrderChange = vi.fn((_ids, details) => details.cancel())
    render(<Wells onRowOrderChange={onRowOrderChange} />)
    await moveDown("Well 01")
    expect(onRowOrderChange).toHaveBeenCalledTimes(1)
    expect(onRowOrderChange.mock.calls[0][1].isCanceled).toBe(true)
    expect(order()).toEqual(["Well 01", "Well 02", "Well 03", "Well 04"])
    await waitFor(() => expect(focused()).toBe(handle("Well 01")))
  })

  it("reports the loaded rows' order in server mode", async () => {
    await act(async () => chunk.open())
    const onRowOrderChange = vi.fn()
    render(
      <Wells
        dataMode="server"
        rowCount={100}
        hasMore
        onLoadMore={() => {}}
        onRowOrderChange={onRowOrderChange}
      />
    )
    await moveDown("Well 02")
    expect(onRowOrderChange).toHaveBeenCalledWith(
      ["w1", "w3", "w2", "w4"],
      expect.objectContaining({ reason: "keyboard" })
    )
  })

  it("keeps the selection on the rows moved", async () => {
    await act(async () => chunk.open())
    const onValueChange = vi.fn()
    render(
      <Wells
        selectionMode="multiple"
        defaultValue={["w1", "w3"]}
        onValueChange={onValueChange}
      />
    )
    await moveDown("Well 01")
    expect(order()).toEqual(["Well 02", "Well 01", "Well 03", "Well 04"])
    expect(onValueChange).not.toHaveBeenCalled()
    expect(row("Well 01")).toHaveAttribute("aria-selected", "true")
    expect(row("Well 03")).toHaveAttribute("aria-selected", "true")
    expect(row("Well 02")).toHaveAttribute("aria-selected", "false")
  })

  it("hides the handles while the view sorts, searches or filters", () => {
    const { rerender } = render(<Wells />)
    expect(screen.getAllByRole("button", { name: /^Drag / })).toHaveLength(4)
    rerender(
      <Wells
        view={{ sorting: [{ column: "depth", direction: "ascending" }] }}
      />
    )
    expect(screen.queryAllByRole("button", { name: /^Drag / })).toHaveLength(0)
    // The column stays: the table does not shift.
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Reorder")
    rerender(<Wells filterable view={{ search: "Well" }} />)
    expect(screen.queryAllByRole("button", { name: /^Drag / })).toHaveLength(0)
    rerender(<Wells view={{ sorting: [] }} />)
    expect(screen.getAllByRole("button", { name: /^Drag / })).toHaveLength(4)
  })

  it("is off in a tree, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells itemToChildren={() => undefined} />)
    expect(screen.queryAllByRole("button", { name: /^Drag / })).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(
      "DataTable: `reorderableRows` is off in a tree (`itemToChildren`): rows are reordered in a flat list only."
    )
  })
})
