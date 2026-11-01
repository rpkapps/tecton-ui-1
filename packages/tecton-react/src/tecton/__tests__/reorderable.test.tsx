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
  ReorderableSlot,
} from "@tecton/react/tecton/reorderable"

import { moveInList } from "../internal/primitives/drag-and-drop/list-strategy"

/**
 * jsdom has no layout: items are laid out here 32 px apart, in DOM order,
 * down the page (rows) or across it (columns, from the right in RTL), with
 * `space` px between them (none by default, as table rows and columns).
 */
const SIZE = 32
let space = 0
const originalRect = Element.prototype.getBoundingClientRect
const items = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="reorderable-item"]')
  )
let layout: "y" | "x" | "x-rtl" | "grid" | "grid-rtl" | "bento" = "y"
/** Grids: three 100 × 32 px items a row, 10 px apart, in a 400 px box. */
const TILE = 100
const GRID_GAP = 10
const BENTO = [
  { left: 0, top: 0, width: 210, height: 74 },
  { left: 220, top: 0, width: 100, height: 32 },
  { left: 330, top: 0, width: 100, height: 74 },
  { left: 220, top: 42, width: 100, height: 32 },
  { left: 0, top: 84, width: 210, height: 32 },
  { left: 220, top: 84, width: 100, height: 32 },
  { left: 330, top: 84, width: 100, height: 32 },
]

beforeEach(() => {
  layout = "y"
  space = 0
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
    if (layout === "bento") {
      // Four 100 px columns, 32 px rows, 10 px apart: B1 2×2, B2 1×1,
      // B3 1×2, B4 1×1 (under B2), B5 2×1, B6 and B7 1×1.
      const at = BENTO[index]
      return rect(at.top, at.left, at.width, at.height)
    }
    if (layout === "grid" || layout === "grid-rtl") {
      const column = index % 3
      const top = Math.floor(index / 3) * (SIZE + GRID_GAP)
      const offset = column * (TILE + GRID_GAP)
      return rect(
        top,
        layout === "grid" ? offset : 400 - TILE - offset,
        TILE,
        SIZE
      )
    }
    const at = index * (SIZE + space)
    if (layout === "y") return rect(at, 0, 400, SIZE)
    if (layout === "x") return rect(0, at, SIZE, SIZE)
    return rect(0, 400 - at - SIZE, SIZE, SIZE)
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
  dropAnimation,
}: {
  onValueChange?: (value: Array<string>) => void
  disabled?: boolean
  dropAnimation?: boolean
}) {
  const [order, setOrder] = React.useState(WELLS.map((w) => w.id))
  return (
    <Reorderable
      value={order}
      disabled={disabled}
      dropAnimation={dropAnimation}
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

  it.each([
    // Item 2 spans 80–112 and item 3 120–152: the line is at 116.
    {
      orientation: "vertical",
      dir: "ltr",
      from: [10, 16],
      to: [10, 110],
      at: 116,
    },
    {
      orientation: "horizontal",
      dir: "ltr",
      from: [16, 10],
      to: [110, 10],
      at: 116,
    },
    // From the right: item 2 spans 288–320 and item 3 248–280.
    {
      orientation: "horizontal",
      dir: "rtl",
      from: [384, 10],
      to: [290, 10],
      at: 284,
    },
  ] as const)(
    "puts the line halfway between spaced items ($orientation, $dir)",
    ({ orientation, dir, from, to, at }) => {
      layout = orientation === "vertical" ? "y" : dir === "rtl" ? "x-rtl" : "x"
      space = 8
      render(
        <TectonProvider direction={dir}>
          <Reorderable
            orientation={orientation}
            defaultValue={WELLS.map((w) => w.id)}
          >
            {WELLS.map((well) => (
              <ReorderableItem key={well.id} value={well.id} label={well.name}>
                {well.name}
                <ReorderableHandle />
              </ReorderableItem>
            ))}
          </Reorderable>
        </TectonProvider>
      )
      press("A-12", from[0], from[1])
      moveTo(to[0], to[1])
      const line = document.querySelector<HTMLElement>(
        '[data-slot="reorderable-drop-indicator"]'
      )!
      expect(line).not.toHaveAttribute("hidden")
      expect(
        orientation === "vertical" ? line.style.top : line.style.left
      ).toBe(`${at}px`)
      release(to[0], to[1])
    }
  )

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

    // A press on the header's sort button that moves drags the column
    // (and the click the release would cause does not sort)…
    const sortButton = () => screen.getByRole("button", { name: "status" })
    fireEvent.pointerDown(sortButton(), {
      button: 0,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 320,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 2, clientX: 380, clientY: 10 })
    fireEvent.pointerUp(document, { pointerId: 2, clientX: 380, clientY: 10 })
    fireEvent.click(sortButton())
    expect(onValueChange).toHaveBeenLastCalledWith(["field", "status", "well"])
    expect(onSort).not.toHaveBeenCalled()
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

    // …one that does not move is the button's click, and so is Enter.
    fireEvent.pointerDown(sortButton(), {
      button: 0,
      pointerId: 3,
      pointerType: "mouse",
      clientX: 352,
      clientY: 10,
    })
    fireEvent.pointerUp(document, { pointerId: 3, clientX: 352, clientY: 10 })
    fireEvent.click(sortButton())
    expect(onSort).toHaveBeenCalledTimes(1)
    act(() => sortButton().focus())
    await user.keyboard("{Enter}")
    expect(onSort).toHaveBeenCalledTimes(2)
    expect(onValueChange).toHaveBeenCalledTimes(2)

    // The header itself takes Enter; Right steps towards the start in RTL.
    act(() => head("status").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert after well"
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

  it("scrolls the container inside it near an edge while dragging", () => {
    vi.useFakeTimers()
    try {
      const ids = Array.from({ length: 40 }, (_, i) => `w${i}`)
      render(
        <Reorderable value={ids}>
          {/* The scroll container inside the list's root, as a table's is. */}
          <div
            data-testid="scroller"
            style={{ overflowY: "auto", overflowX: "hidden", height: 400 }}
          >
            {ids.map((id) => (
              <ReorderableItem key={id} value={id} label={id}>
                {id}
                <ReorderableHandle />
              </ReorderableItem>
            ))}
          </div>
        </Reorderable>
      )
      const scroller = screen.getByTestId("scroller")
      let top = 0
      Object.defineProperty(scroller, "scrollHeight", { value: 40 * SIZE })
      Object.defineProperty(scroller, "clientHeight", { value: 400 })
      Object.defineProperty(scroller, "scrollTop", {
        get: () => top,
        set: (value: number) => {
          top = value
        },
      })
      press("w0", 10, yOf(0))
      moveTo(10, 120)
      vi.advanceTimersByTime(100)
      expect(top).toBe(0)
      // Within 40 px of the container's bottom edge.
      moveTo(10, 390)
      vi.advanceTimersByTime(200)
      expect(top).toBeGreaterThan(0)
      release(10, 390)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("Reorderable drop animation", () => {
  // jsdom has no Web Animations: record the calls instead.
  const animate = vi.fn(function (this: Element) {
    return {
      finished: new Promise(() => {}),
      cancel() {},
    } as unknown as Animation
  })
  const originalMatchMedia = window.matchMedia
  beforeEach(() => {
    animate.mockClear()
    Element.prototype.animate = animate
  })
  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate
    window.matchMedia = originalMatchMedia
  })

  /** The translate each row animated from, by its name. */
  const slides = () =>
    new Map(
      animate.mock.calls.flatMap((call, at) => {
        const [keyframes] = call as unknown as [Array<Keyframe>]
        const from = keyframes[0]?.translate
        const row = animate.mock.contexts[at]
        return from === undefined
          ? []
          : [[row.textContent, String(from)] as const]
      })
    )

  function dropFirstRowInThirdGap(props: { dropAnimation?: boolean } = {}) {
    render(<Rows {...props} />)
    press("A-12", 10, yOf(0))
    moveTo(10, yOf(2, 20))
    release(10, yOf(2, 20))
    expect(names()).toEqual(["B-3", "C-7", "A-12", "D-2"])
  }

  it("slides the rows that moved, and the dropped one from where it was let go", () => {
    dropFirstRowInThirdGap()
    // The preview was let go at the page's top (jsdom draws it there).
    expect(slides()).toEqual(
      new Map([
        ["B-3", "0px 32px"],
        ["C-7", "0px 32px"],
        ["A-12", "0px -64px"],
      ])
    )
    // The dropped row starts on the preview's surface.
    const surfaces = animate.mock.calls.filter((call) =>
      (call as unknown as [Array<Keyframe>])[0].some(
        (frame) => frame.backgroundColor !== undefined
      )
    )
    expect(surfaces).toHaveLength(1)
  })

  it("does not animate with dropAnimation={false}", () => {
    dropFirstRowInThirdGap({ dropAnimation: false })
    expect(animate).not.toHaveBeenCalled()
  })

  it("starts the dropped row inside its scroll container", () => {
    // The preview let go right of and below the rows' container, which
    // scrolls but has nothing to scroll (four 32 px rows across 400 px).
    const layout = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (!this.hasAttribute("inert")) return layout.call(this)
      return { ...layout.call(this), left: 120, top: 200, x: 120, y: 200 }
    }
    render(
      <div
        style={{ overflow: "auto" }}
        ref={(element) => {
          if (!element) return
          Object.defineProperty(element, "scrollWidth", { value: 400 })
          Object.defineProperty(element, "scrollHeight", { value: 4 * SIZE })
        }}
      >
        <Rows />
      </div>
    )
    press("A-12", 10, yOf(0))
    moveTo(10, yOf(2, 20))
    release(10, yOf(2, 20))
    // A-12 lands at 64–96 px: it starts at most 32 px lower, the bottom
    // of the scroll area, and not sideways at all.
    expect(slides().get("A-12")).toBe("0px 32px")
  })

  it("does not animate when the user prefers reduced motion", () => {
    window.matchMedia = (query: string) => ({
      ...originalMatchMedia(query),
      matches: query.includes("reduce"),
    })
    dropFirstRowInThirdGap()
    expect(animate).not.toHaveBeenCalled()
  })
})

describe("Reorderable grid", () => {
  const TILES = ["T1", "T2", "T3", "T4", "T5", "T6"]

  function Grid({
    dir = "ltr",
    onValueChange,
  }: {
    dir?: "ltr" | "rtl"
    onValueChange?: (value: Array<string>) => void
  }) {
    const [order, setOrder] = React.useState(TILES)
    return (
      <TectonProvider direction={dir}>
        <Reorderable
          orientation="grid"
          value={order}
          onValueChange={(next) => {
            onValueChange?.(next)
            setOrder(next)
          }}
        >
          {order.map((tile) => (
            <ReorderableItem key={tile} value={tile} label={tile}>
              {tile}
              <ReorderableHandle />
            </ReorderableItem>
          ))}
        </Reorderable>
      </TectonProvider>
    )
  }

  const line = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="reorderable-drop-indicator"]'
    )!
  /** The y of grid row `row`, `offset` px into it. */
  const rowY = (row: number, offset = 16) => row * (SIZE + GRID_GAP) + offset

  it("drops into the gap of the row under the pointer", () => {
    layout = "grid"
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    expect(document.querySelector('[data-slot="reorderable"]')).toHaveAttribute(
      "data-orientation",
      "grid"
    )
    press("T1", 50, rowY(0))
    // Row 2, short of T5's middle: between T4 and T5.
    moveTo(115, rowY(1))
    expect(line()).not.toHaveAttribute("hidden")
    // Halfway between T4 (0–100) and T5 (110–210), over row 2 only.
    expect(line().style.left).toBe("105px")
    expect(line().style.top).toBe(`${SIZE + GRID_GAP}px`)
    expect(line().style.height).toBe(`${SIZE}px`)
    release(115, rowY(1))
    expect(onValueChange).toHaveBeenCalledWith([
      "T2",
      "T3",
      "T4",
      "T1",
      "T5",
      "T6",
    ])
  })

  it("draws the gap after a row's last item at the end of that row", () => {
    layout = "grid"
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    press("T1", 50, rowY(0))
    // Row 1, past T3: the gap before T4, drawn after T3 (220–320).
    moveTo(390, rowY(0))
    expect(line().style.left).toBe(`${320 + GRID_GAP / 2}px`)
    expect(line().style.top).toBe("0px")
    release(390, rowY(0))
    expect(onValueChange).toHaveBeenCalledWith([
      "T2",
      "T3",
      "T1",
      "T4",
      "T5",
      "T6",
    ])
  })

  it("follows the reading direction in RTL", () => {
    layout = "grid-rtl"
    const onValueChange = vi.fn()
    render(<Grid dir="rtl" onValueChange={onValueChange} />)
    press("T1", 350, rowY(0))
    // Row 2 from the right: T4 at 300–400, T5 at 190–290. Past T4's
    // middle, short of T5's: between them.
    moveTo(280, rowY(1))
    expect(line().style.left).toBe("295px")
    release(280, rowY(1))
    expect(onValueChange).toHaveBeenCalledWith([
      "T2",
      "T3",
      "T4",
      "T1",
      "T5",
      "T6",
    ])
  })

  it("steps across the rows with Up and Down", async () => {
    layout = "grid"
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    act(() => handle("T1").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between T2 and T3"
    )
    // The gap below, in row 2.
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between T5 and T6"
    )
    // Left and Right go on in reading order.
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert after T6"
    )
    // Up from the end of row 2: the end of row 1.
    await user.keyboard("{ArrowUp}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between T3 and T4"
    )
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith([
      "T2",
      "T3",
      "T1",
      "T4",
      "T5",
      "T6",
    ])
  })
})

describe("Reorderable bento grid", () => {
  const TILES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]

  function Bento({
    onValueChange,
  }: {
    onValueChange?: (value: Array<string>) => void
  }) {
    const [order, setOrder] = React.useState(TILES)
    return (
      <Reorderable
        orientation="grid"
        value={order}
        onValueChange={(next) => {
          onValueChange?.(next)
          setOrder(next)
        }}
      >
        {order.map((tile) => (
          <ReorderableItem key={tile} value={tile} label={tile}>
            {tile}
            <ReorderableHandle />
          </ReorderableItem>
        ))}
      </Reorderable>
    )
  }

  const line = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="reorderable-drop-indicator"]'
    )!

  it("drops after the tile whose trailing half is under the pointer", () => {
    layout = "bento"
    const onValueChange = vi.fn()
    render(<Bento onValueChange={onValueChange} />)
    press("B7", 380, 100)
    // The end of B2 (220–320): halfway to B3 beside it, over B2's height.
    moveTo(300, 16)
    expect(line().style.left).toBe("325px")
    expect(line().style.top).toBe("0px")
    expect(line().style.height).toBe("32px")
    release(300, 16)
    expect(onValueChange).toHaveBeenCalledWith([
      "B1",
      "B2",
      "B7",
      "B3",
      "B4",
      "B5",
      "B6",
    ])
  })

  it("draws a gap whose tiles are apart beside the tile it is at", () => {
    layout = "bento"
    const onValueChange = vi.fn()
    render(<Bento onValueChange={onValueChange} />)
    press("B7", 380, 100)
    // The start of B4, under B2: the gap after B3 (which is not beside
    // it), drawn between B1 and B4 over B4's height.
    moveTo(230, 58)
    expect(line().style.left).toBe("215px")
    expect(line().style.top).toBe("42px")
    expect(line().style.height).toBe("32px")
    release(230, 58)
    expect(onValueChange).toHaveBeenCalledWith([
      "B1",
      "B2",
      "B3",
      "B7",
      "B4",
      "B5",
      "B6",
    ])
  })

  it("steps down to the nearest gap below with the keyboard", async () => {
    layout = "bento"
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Bento onValueChange={onValueChange} />)
    act(() => handle("B1").focus())
    await user.keyboard("{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between B2 and B3"
    )
    // Below the line between B2 and B3: the end of B4, under B2.
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between B4 and B5"
    )
    expect(line().style.left).toBe("325px")
    expect(line().style.top).toBe("42px")
    // Right and Left go on from that stop, in reading order.
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between B5 and B6"
    )
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between B4 and B5"
    )
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith([
      "B2",
      "B3",
      "B4",
      "B1",
      "B5",
      "B6",
      "B7",
    ])
  })
})

describe("Reorderable swap", () => {
  /**
   * Slots laid out as a 2 × 2 grid of 100 px squares, 10 px apart, in
   * document order; an item fills its slot (its inline translate moves it).
   */
  const slotList = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="reorderable-slot"]')
    )
  beforeEach(() => {
    const items = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const slot = this.closest<HTMLElement>('[data-slot="reorderable-slot"]')
      const index = slot ? slotList().indexOf(slot) : -1
      if (index < 0) return items.call(this)
      const [dx, dy] = ((this as HTMLElement).style.translate || "0px 0px")
        .split(" ")
        .map((n) => parseFloat(n) || 0)
      const left = (index % 2) * 110 + dx
      const top = Math.floor(index / 2) * 110 + dy
      return {
        left,
        top,
        right: left + 100,
        bottom: top + 100,
        width: 100,
        height: 100,
        x: left,
        y: top,
        toJSON() {},
      }
    }
  })

  const NAMES: Record<string, string> = { a: "A", b: "B", c: "C" }

  function Swap({
    onValueChange,
    dropAnimation,
  }: {
    onValueChange?: (value: Array<string | null>) => void
    dropAnimation?: boolean
  }) {
    const [value, setValue] = React.useState<Array<string | null>>([
      "a",
      "b",
      "c",
      null,
    ])
    return (
      <Reorderable
        mode="swap"
        value={value}
        dropAnimation={dropAnimation}
        onValueChange={(next) => {
          onValueChange?.(next)
          setValue(next)
        }}
      >
        {value.map((id, index) => (
          <ReorderableSlot key={index} data-testid={`slot-${index}`}>
            {id && (
              <ReorderableItem value={id} label={NAMES[id]}>
                {NAMES[id]}
                <ReorderableHandle />
              </ReorderableItem>
            )}
          </ReorderableSlot>
        ))}
      </Reorderable>
    )
  }

  const slot = (index: number) => screen.getByTestId(`slot-${index}`)
  const itemOf = (name: string) =>
    screen
      .getByRole("button", { name: `Drag ${name}` })
      .closest<HTMLElement>('[data-slot="reorderable-item"]')!
  const texts = () => slotList().map((s) => s.textContent || null)

  it("reaches each handle with Tab", async () => {
    const user = userEvent.setup()
    render(<Swap />)
    await user.tab()
    expect(handle("A")).toHaveFocus()
    await user.tab()
    expect(handle("B")).toHaveFocus()
  })

  it("marks an empty slot and the root's mode", () => {
    render(<Swap />)
    expect(slot(3)).toHaveAttribute("data-empty", "")
    expect(slot(0)).not.toHaveAttribute("data-empty")
    expect(document.querySelector('[data-slot="reorderable"]')).toHaveAttribute(
      "data-mode",
      "swap"
    )
  })

  it("shows the swap while dragging over a slot, and keeps it on the drop", () => {
    const onValueChange = vi.fn()
    render(<Swap onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 50)
    // B is drawn in A's slot, and A, dimmed, in B's.
    expect(itemOf("B").style.translate).toBe("-110px 0px")
    expect(itemOf("A").style.translate).toBe("110px 0px")
    expect(itemOf("A")).toHaveAttribute("data-dragging", "")
    expect(slot(1)).toHaveAttribute("data-drop-target", "")
    // No line: the swap shows itself.
    expect(
      document.querySelector('[data-slot="reorderable-drop-indicator"]')
    ).toHaveAttribute("hidden")
    release(160, 50)
    expect(onValueChange).toHaveBeenCalledWith(["b", "a", "c", null])
    expect(texts()).toEqual(["B", "A", "C", null])
    expect(itemOf("A").style.translate).toBe("")
    expect(slot(1)).not.toHaveAttribute("data-drop-target")
  })

  it("moves an item into an empty slot, leaving its own empty", () => {
    const onValueChange = vi.fn()
    render(<Swap onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 160)
    expect(itemOf("A").style.translate).toBe("110px 110px")
    release(160, 160)
    expect(onValueChange).toHaveBeenCalledWith([null, "b", "c", "a"])
    expect(slot(0)).toHaveAttribute("data-empty", "")
  })

  it("puts everything back when the drag returns to its own slot", () => {
    const onValueChange = vi.fn()
    render(<Swap onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 50)
    moveTo(40, 40)
    expect(itemOf("A").style.translate).toBe("")
    expect(itemOf("B").style.translate).toBe("")
    release(40, 40)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("moves between the slots by where they are with the arrow keys", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Swap onValueChange={onValueChange} />)
    act(() => handle("A").focus())
    await user.keyboard("{Enter}")
    // It starts where it is: nothing swaps until a key aims a slot.
    expect(document.activeElement).toHaveAttribute("aria-label", "Keep A here")
    expect(itemOf("B").style.translate).toBe("")
    // Nothing is wholly left of the first column.
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Keep A here")
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Swap with B")
    expect(itemOf("B").style.translate).toBe("-110px 0px")
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Move to empty slot 4"
    )
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Swap with C")
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["c", "b", "a", null])
    await waitFor(() => expect(handle("A")).toHaveFocus())
  })

  it("cancels a keyboard drag with Escape, putting the swap back", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Swap onValueChange={onValueChange} />)
    act(() => handle("A").focus())
    await user.keyboard("{Enter}{ArrowRight}")
    expect(itemOf("B").style.translate).toBe("-110px 0px")
    await user.keyboard("{Escape}")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(itemOf("B").style.translate).toBe("")
    expect(texts()).toEqual(["A", "B", "C", null])
  })

  describe("animation", () => {
    const animate = vi.fn(function (this: Element) {
      return {
        finished: new Promise(() => {}),
        cancel() {},
      } as unknown as Animation
    })
    beforeEach(() => {
      animate.mockClear()
      Element.prototype.animate = animate
    })
    afterEach(() => {
      delete (Element.prototype as { animate?: unknown }).animate
      // A landing preview waits for its (stubbed, endless) animation.
      for (const ghost of document.querySelectorAll("[inert]")) ghost.remove()
    })

    it("slides the swapped item into the freed slot as the drag aims", () => {
      render(<Swap />)
      press("A", 50, 50)
      moveTo(160, 50)
      const at = animate.mock.contexts.indexOf(itemOf("B"))
      expect(at).toBeGreaterThanOrEqual(0)
      const [keyframes] = animate.mock.calls[at] as unknown as [Array<Keyframe>]
      // From B's slot, 110 px to the right of A's.
      expect(keyframes[0].translate).toBe("110px 0px")
      release(160, 50)
    })

    /** The animations run on `element`, by their first keyframe. */
    const animationsOf = (element: Element) =>
      animate.mock.calls.flatMap((call, at) =>
        animate.mock.contexts[at] === element
          ? [(call as unknown as [Array<Keyframe>])[0]]
          : []
      )

    it("lands the preview on the placeholder as the drop settles", () => {
      render(<Swap />)
      press("A", 50, 50)
      moveTo(160, 50)
      animate.mockClear()
      release(160, 50)
      // The preview stays to land: it glides from where it was let go
      // (jsdom draws it 400 px square at the corner) into A's new slot.
      const ghost = document.body.querySelector<HTMLElement>(
        '[aria-hidden="true"][inert]'
      )!
      expect(ghost).not.toBeNull()
      const glide = animationsOf(ghost).find((k) => k[0].transform)!
      expect(glide[0]).toMatchObject({ width: "400px", height: "400px" })
      expect(glide[1]).toMatchObject({
        transform: "translate(110px, 0px)",
        width: "100px",
        height: "100px",
      })
      expect(animationsOf(ghost).some((k) => k.at(-1)?.opacity === 0)).toBe(
        true
      )
      // A stays where its placeholder was and comes up to full strength,
      // rather than flying in.
      const own = animationsOf(itemOf("A"))
      expect(own.some((k) => k[0].opacity === 0.5)).toBe(true)
      expect(own.some((k) => k[0].translate !== undefined)).toBe(false)
    })

    it("lands on an item dropped into an empty slot, whose element is new", () => {
      render(<Swap />)
      press("A", 50, 50)
      moveTo(160, 160)
      animate.mockClear()
      release(160, 160)
      // Mounted afresh in the empty slot, in the drop's own commit.
      expect(animationsOf(itemOf("A")).some((k) => k[0].opacity === 0.5)).toBe(
        true
      )
    })

    it("does not animate with dropAnimation={false}", () => {
      render(<Swap dropAnimation={false} />)
      press("A", 50, 50)
      moveTo(160, 50)
      release(160, 50)
      expect(animate).not.toHaveBeenCalled()
    })
  })
})
