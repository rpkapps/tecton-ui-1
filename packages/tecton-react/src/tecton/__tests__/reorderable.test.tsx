import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"

import { moveInList } from "../internal/primitives/drag-and-drop/list-strategy"

/**
 * jsdom has no layout: items are laid out here 32 px apart, in DOM order,
 * down the page (rows) or across it (columns, from the right in RTL).
 */
const SIZE = 32
const originalRect = Element.prototype.getBoundingClientRect
const items = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="reorderable-item"]')
  )
let layout: "y" | "x" | "x-rtl" = "y"

beforeEach(() => {
  layout = "y"
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const index = items().indexOf(this as HTMLElement)
    const rect = (top: number, left: number, w: number, h: number) => ({
      top,
      left,
      bottom: top + h,
      right: left + w,
      width: w,
      height: h,
      x: left,
      y: top,
      toJSON() {},
    })
    if (index < 0) return rect(0, 0, 400, 400)
    if (layout === "y") return rect(index * SIZE, 0, 400, SIZE)
    if (layout === "x") return rect(0, index * SIZE, SIZE, SIZE)
    return rect(0, 400 - (index + 1) * SIZE, SIZE, SIZE)
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

const WELLS = [
  { id: "a12", name: "A-12" },
  { id: "b3", name: "B-3" },
  { id: "c7", name: "C-7" },
  { id: "d2", name: "D-2" },
]

function Rows({
  onValueChange,
  disabled,
}: {
  onValueChange?: (value: Array<string>) => void
  disabled?: boolean
}) {
  const [order, setOrder] = React.useState(WELLS.map((w) => w.id))
  return (
    <Reorderable
      value={order}
      disabled={disabled}
      onValueChange={(next) => {
        onValueChange?.(next)
        setOrder(next)
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Well</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((id) => {
            const well = WELLS.find((w) => w.id === id)!
            return (
              <ReorderableItem
                key={id}
                value={id}
                label={well.name}
                render={<TableRow />}
              >
                <TableCell>
                  <ReorderableHandle />
                </TableCell>
                <TableCell>{well.name}</TableCell>
              </ReorderableItem>
            )
          })}
        </TableBody>
      </Table>
    </Reorderable>
  )
}

const handle = (name: string) =>
  screen.getByRole("button", { name: `Drag ${name}` })
const names = () => items().map((item) => item.textContent)
const yOf = (index: number, offset = 16) => index * SIZE + offset

function press(name: string, x: number, y: number) {
  fireEvent.pointerDown(handle(name), {
    button: 0,
    pointerId: 1,
    pointerType: "mouse",
    clientX: x,
    clientY: y,
  })
}
const moveTo = (x: number, y: number) =>
  fireEvent.pointerMove(document, { pointerId: 1, clientX: x, clientY: y })
const release = (x: number, y: number) =>
  fireEvent.pointerUp(document, { pointerId: 1, clientX: x, clientY: y })

describe("moveInList", () => {
  const order = ["a", "b", "c", "d"]
  it("moves an item into a gap of the items shown", () => {
    expect(moveInList(order, order, "a", 3)).toEqual(["b", "c", "a", "d"])
    expect(moveInList(order, order, "a", 4)).toEqual(["b", "c", "d", "a"])
    expect(moveInList(order, order, "d", 0)).toEqual(["d", "a", "b", "c"])
    expect(moveInList(order, order, "b", 1)).toEqual(order)
  })

  it("keeps the items not shown in their places", () => {
    // "b" is hidden: after "c" means after "c" in the whole order.
    expect(moveInList(order, ["a", "c", "d"], "a", 2)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ])
    expect(moveInList(order, ["a", "c", "d"], "d", 1)).toEqual([
      "a",
      "b",
      "d",
      "c",
    ])
  })
})

describe("Reorderable", () => {
  it("renders the line and drop targets outside the table", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<Rows />)
    const indicator = document.querySelector(
      '[data-slot="reorderable-drop-indicator"]'
    )!
    expect(indicator.closest("table")).toBeNull()
    expect(indicator.parentElement).toHaveAttribute("data-slot", "reorderable")
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it("moves a row dragged from its handle", () => {
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} />)
    press("A-12", 10, yOf(0))
    moveTo(10, yOf(2, 20))
    expect(items()[0]).toHaveAttribute("data-dragging", "")
    const line = document.querySelector<HTMLElement>(
      '[data-slot="reorderable-drop-indicator"]'
    )!
    expect(line).not.toHaveAttribute("hidden")
    expect(line.style.top).toBe(`${3 * SIZE}px`)
    // The copy under the pointer is a row inside a table of its own.
    const preview = document.body.querySelector("table[aria-hidden='true']")
    expect(preview?.querySelector("tr")).not.toBeNull()
    release(10, yOf(2, 20))
    expect(onValueChange).toHaveBeenCalledWith(["b3", "c7", "a12", "d2"])
    expect(names()).toEqual(["B-3", "C-7", "A-12", "D-2"])
    expect(document.body.querySelector("[inert]")).toBeNull()
  })

  it("shows no line over the dragged row's own place", () => {
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} />)
    press("B-3", 10, yOf(1))
    moveTo(10, yOf(1, 20))
    expect(
      document.querySelector('[data-slot="reorderable-drop-indicator"]')
    ).toHaveAttribute("hidden")
    release(10, yOf(1, 20))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("moves a row with the keyboard, and announces it", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} />)
    act(() => handle("A-12").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between B-3 and C-7"
    )
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between C-7 and D-2"
    )
    await user.keyboard("{Tab}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert after D-2"
    )
    await waitFor(() =>
      expect(
        document.querySelector('[aria-live="assertive"]')
      ).toHaveTextContent(/^Started dragging/)
    )
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["b3", "c7", "d2", "a12"])
    // Focus is back on the moved row's handle.
    await waitFor(() => expect(handle("A-12")).toHaveFocus())
  })

  it("cancels a keyboard drag with Escape", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} />)
    act(() => handle("C-7").focus())
    await user.keyboard("{Enter}{ArrowUp}{Escape}")
    expect(onValueChange).not.toHaveBeenCalled()
    await waitFor(() => expect(handle("C-7")).toHaveFocus())
  })

  it("offers every gap as a button to a screen reader on a touch screen", async () => {
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} />)
    fireEvent.click(handle("D-2"), { detail: 0 })
    const targets = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
      .filter((label) => /^Insert/.test(label ?? ""))
    expect(targets).toEqual([
      "Insert before A-12",
      "Insert between A-12 and B-3",
      "Insert between B-3 and C-7",
    ])
    await userEvent.click(
      screen.getByRole("button", { name: "Insert before A-12" })
    )
    expect(onValueChange).toHaveBeenCalledWith(["d2", "a12", "b3", "c7"])
  })

  it("turns every handle off when disabled", () => {
    const onValueChange = vi.fn()
    render(<Rows onValueChange={onValueChange} disabled />)
    expect(handle("A-12")).toBeDisabled()
    press("A-12", 10, yOf(0))
    moveTo(10, yOf(3, 20))
    release(10, yOf(3, 20))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("reorders column headers dragged by themselves, from the right in RTL", async () => {
    layout = "x-rtl"
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onSort = vi.fn()
    function Columns() {
      const [order, setOrder] = React.useState(["well", "field", "status"])
      return (
        <TectonProvider direction="rtl">
          <Reorderable
            orientation="horizontal"
            value={order}
            onValueChange={(next) => {
              onValueChange(next)
              setOrder(next)
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {order.map((id) => (
                    <ReorderableItem
                      key={id}
                      value={id}
                      label={id}
                      dragHandle={false}
                      render={<TableHead />}
                    >
                      <button type="button" onClick={() => onSort(id)}>
                        {id}
                      </button>
                    </ReorderableItem>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </Reorderable>
        </TectonProvider>
      )
    }
    render(<Columns />)
    const head = (name: string) =>
      screen.getByRole("columnheader", { name: new RegExp(name) })
    expect(screen.queryByRole("button", { name: /^Drag/ })).toBeNull()
    expect(head("well")).toHaveAttribute("tabindex", "0")

    // "well" is rightmost (x 368–400); drag it left past "field"'s middle.
    fireEvent.pointerDown(head("well"), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 384,
      clientY: 10,
    })
    moveTo(330, 10)
    const line = document.querySelector<HTMLElement>(
      '[data-slot="reorderable-drop-indicator"]'
    )!
    // The start (right) edge of "status".
    expect(line.style.left).toBe(`${400 - 2 * SIZE}px`)
    release(330, 10)
    expect(onValueChange).toHaveBeenLastCalledWith(["field", "well", "status"])

    // A press on the header's own button is the button's: no drag.
    fireEvent.pointerDown(screen.getByRole("button", { name: "status" }), {
      button: 0,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 320,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 2, clientX: 380, clientY: 10 })
    fireEvent.pointerUp(document, { pointerId: 2, clientX: 380, clientY: 10 })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    // Enter on the button sorts; it does not start a drag.
    act(() => screen.getByRole("button", { name: "status" }).focus())
    await user.keyboard("{Enter}")
    expect(onSort).toHaveBeenCalledWith("status")
    expect(onValueChange).toHaveBeenCalledTimes(1)

    // The header itself takes Enter; Left steps towards the end in RTL.
    act(() => head("status").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between field and well"
    )
    await user.keyboard("{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(["status", "field", "well"])
    await waitFor(() => expect(head("status")).toHaveFocus())
  })

  it("reorders the rows and the columns of one table, one Reorderable inside the other", async () => {
    const user = userEvent.setup()
    const onRows = vi.fn()
    const onColumns = vi.fn()
    function Both() {
      const [columns, setColumns] = React.useState(["well", "field"])
      const [rows, setRows] = React.useState(["a12", "b3", "c7"])
      return (
        <Reorderable
          orientation="horizontal"
          value={columns}
          onValueChange={(next) => {
            onColumns(next)
            setColumns(next)
          }}
        >
          <Reorderable
            value={rows}
            onValueChange={(next) => {
              onRows(next)
              setRows(next)
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((id) => (
                    <ReorderableItem
                      key={id}
                      value={id}
                      label={id}
                      dragHandle={false}
                      render={<TableHead />}
                    >
                      {id}
                    </ReorderableItem>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((id) => (
                  <ReorderableItem
                    key={id}
                    value={id}
                    label={id}
                    render={<TableRow />}
                  >
                    <TableCell>
                      <ReorderableHandle />
                    </TableCell>
                  </ReorderableItem>
                ))}
              </TableBody>
            </Table>
          </Reorderable>
        </Reorderable>
      )
    }
    render(<Both />)
    // The headers belong to the outer, horizontal list.
    const head = screen.getByRole("columnheader", { name: "field" })
    expect(head).toHaveAttribute("tabindex", "0")
    act(() => head.focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert before well"
    )
    await user.keyboard("{Enter}")
    expect(onColumns).toHaveBeenLastCalledWith(["field", "well"])
    // The rows to the inner, vertical one.
    act(() => handle("a12").focus())
    await user.keyboard("{Enter}{Enter}")
    expect(onRows).toHaveBeenLastCalledWith(["b3", "a12", "c7"])
  })
})
