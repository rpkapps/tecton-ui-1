import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridHandle,
  WidgetGridItem,
  WidgetGridRemove,
  WidgetGridResizeHandle,
  WidgetGridPlaceholder,
  WidgetGridSlot,
  WidgetGridSlots,
  WidgetGridSource,
  useWidgetGrid,
  useWidgetGridItem,
  useWidgetGridSource,
  type WidgetGridChangeDetails,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

import {
  collides,
  firstFit,
  freeAreas,
  resolveLayout,
  stepMove,
} from "../internal/primitives/drag-and-drop/grid-layout"

const V = { columns: 12, compaction: "vertical" } as const
const at = (layout: Array<WidgetGridLayoutItem>, id: string) => {
  const item = layout.find((entry) => entry.id === id)
  return item && [item.x, item.y, item.w, item.h]
}

describe("resolveLayout", () => {
  it("closes holes and resolves overlaps, in reading order", () => {
    const layout = resolveLayout(
      [
        { id: "b", x: 0, y: 5, w: 6, h: 2 },
        { id: "a", x: 0, y: 0, w: 6, h: 2 },
        { id: "c", x: 3, y: 1, w: 6, h: 2 },
      ],
      V
    )
    expect(layout.map((item) => item.id)).toEqual(["a", "c", "b"])
    expect(at(layout, "c")).toEqual([3, 2, 6, 2])
    expect(at(layout, "b")).toEqual([0, 4, 6, 2])
    for (const item of layout)
      for (const other of layout)
        if (item !== other) expect(collides(item, other)).toBe(false)
  })

  it("keeps items where they are without compaction", () => {
    const layout = resolveLayout([{ id: "a", x: 0, y: 3, w: 4, h: 2 }], {
      columns: 12,
      compaction: "none",
    })
    expect(at(layout, "a")).toEqual([0, 3, 4, 2])
  })

  it("clamps items to the columns and their limits", () => {
    const layout = resolveLayout(
      [{ id: "a", x: 10, y: -2, w: 5, h: 9, maxH: 4, minW: 3 }],
      V
    )
    expect(at(layout, "a")).toEqual([7, 0, 5, 4])
  })

  it("swaps two tiles of a row", () => {
    const tiles = [
      { id: "a", x: 0, y: 0, w: 6, h: 2 },
      { id: "b", x: 6, y: 0, w: 6, h: 2 },
    ]
    const layout = resolveLayout(tiles, V, {
      item: { ...tiles[0], x: 6 },
      kind: "move",
    })
    expect(at(layout, "a")).toEqual([6, 0, 6, 2])
    expect(at(layout, "b")).toEqual([0, 0, 6, 2])
  })

  it("moves an item below the one it is dragged past", () => {
    const tiles = [
      { id: "a", x: 0, y: 0, w: 12, h: 2 },
      { id: "b", x: 0, y: 2, w: 12, h: 2 },
    ]
    const down = (y: number) =>
      resolveLayout(tiles, V, { item: { ...tiles[0], y }, kind: "move" })
    // Less than halfway: it floats back.
    expect(at(down(1), "a")).toEqual([0, 0, 12, 2])
    expect(at(down(2), "a")).toEqual([0, 2, 12, 2])
    expect(at(down(2), "b")).toEqual([0, 0, 12, 2])
  })

  it("puts a widget where it is dropped, over the start of a row", () => {
    // A 5-wide widget dropped in the top right corner, beside an 8-wide
    // one: it takes the corner, and the other makes way below it.
    const tiles = [
      { id: "production", x: 0, y: 0, w: 8, h: 2 },
      { id: "alarms", x: 0, y: 2, w: 5, h: 6 },
    ]
    const layout = resolveLayout(tiles, V, {
      item: { ...tiles[1], x: 7, y: 0 },
      kind: "move",
    })
    expect(at(layout, "alarms")).toEqual([7, 0, 5, 6])
    expect(at(layout, "production")).toEqual([0, 6, 8, 2])
  })

  it("takes the place of a wider widget in the same row", () => {
    const tiles = [
      { id: "small", x: 0, y: 0, w: 3, h: 2 },
      { id: "wide", x: 3, y: 0, w: 9, h: 2 },
    ]
    const layout = resolveLayout(tiles, V, {
      item: { ...tiles[0], x: 4 },
      kind: "move",
    })
    expect(at(layout, "small")).toEqual([4, 0, 3, 2])
    expect(at(layout, "wide")).toEqual([3, 2, 9, 2])
  })

  it("pushes the items a resize grows over down", () => {
    const tiles = [
      { id: "a", x: 0, y: 0, w: 6, h: 2 },
      { id: "b", x: 6, y: 0, w: 6, h: 2 },
    ]
    const layout = resolveLayout(tiles, V, {
      item: { ...tiles[0], w: 8 },
      kind: "resize",
    })
    expect(at(layout, "a")).toEqual([0, 0, 8, 2])
    expect(at(layout, "b")).toEqual([6, 2, 6, 2])
  })

  it("never moves a locked item", () => {
    const tiles = [
      { id: "lock", x: 0, y: 0, w: 6, h: 2, locked: true },
      { id: "b", x: 6, y: 0, w: 6, h: 2 },
    ]
    const layout = resolveLayout(tiles, V, {
      item: { ...tiles[1], x: 0 },
      kind: "move",
    })
    expect(at(layout, "lock")).toEqual([0, 0, 6, 2])
    expect(at(layout, "b")).toEqual([0, 2, 6, 2])
  })
})

describe("firstFit and stepMove", () => {
  it("finds the first free place in reading order", () => {
    const layout = [
      { id: "a", x: 0, y: 0, w: 8, h: 2 },
      { id: "b", x: 0, y: 2, w: 12, h: 2 },
    ]
    expect(firstFit(layout, { w: 4, h: 2 }, 12)).toEqual({ x: 8, y: 0 })
    expect(firstFit(layout, { w: 6, h: 2 }, 12)).toEqual({ x: 0, y: 4 })
  })

  it("steps past the item below when one row changes nothing", () => {
    const layout = [
      { id: "a", x: 0, y: 0, w: 12, h: 2 },
      { id: "b", x: 0, y: 2, w: 12, h: 3 },
    ]
    const to = stepMove(layout, V, "a", layout[0], 0, 1)
    expect(to).not.toBeNull()
    const moved = resolveLayout(layout, V, {
      item: { ...layout[0], ...to! },
      kind: "move",
    })
    expect(at(moved, "a")).toEqual([0, 3, 12, 2])
    // Already at the bottom, and at the inline start.
    expect(stepMove(moved, V, "a", moved[1], 0, 1)).toBeNull()
    expect(stepMove(moved, V, "a", moved[1], -1, 0)).toBeNull()
  })
})

// --- The component -------------------------------------------------------

const NAMES: Record<string, string> = {
  production: "Production",
  pressure: "Pressure",
  alarms: "Alarms",
  uptime: "Uptime",
}

const START: Array<WidgetGridLayoutItem> = [
  { id: "production", x: 0, y: 0, w: 6, h: 2 },
  { id: "pressure", x: 6, y: 0, w: 6, h: 2 },
  { id: "alarms", x: 0, y: 2, w: 12, h: 2 },
]

/** A widget's menu: the moves and sizes without a drag. */
function Menu() {
  const widget = useWidgetGridItem()
  return (
    <>
      <button
        type="button"
        disabled={!widget.canMove("right")}
        onClick={() => widget.move("right")}
      >
        Move {widget.label} right
      </button>
      <button type="button" onClick={() => widget.resize({ w: 12, h: 3 })}>
        Make {widget.label} large
      </button>
    </>
  )
}

function Dashboard({
  onValueChange,
  editable = true,
  dir = "ltr",
  initial = START,
  stackBelow,
  animated = false,
  rows,
  compaction,
}: {
  onValueChange?: (
    value: Array<WidgetGridLayoutItem>,
    details: WidgetGridChangeDetails
  ) => void
  editable?: boolean
  dir?: "ltr" | "rtl"
  initial?: Array<WidgetGridLayoutItem>
  stackBelow?: number
  animated?: boolean
  rows?: number
  compaction?: "vertical" | "none"
}) {
  const [layout, setLayout] = React.useState(initial)
  return (
    <TectonProvider direction={dir}>
      <WidgetGrid
        value={layout}
        editable={editable}
        stackBelow={stackBelow}
        animated={animated}
        rows={rows}
        compaction={compaction}
        onValueChange={(next, details) => {
          onValueChange?.(next, details)
          if (!details.isCanceled) setLayout(next)
        }}
      >
        <WidgetGridSource value="uptime" label="Uptime" w={4} h={2}>
          Uptime
        </WidgetGridSource>
        <WidgetGridContent>
          {layout.map((item) => (
            <WidgetGridItem
              key={item.id}
              value={item.id}
              label={NAMES[item.id]}
            >
              <WidgetGridHandle />
              <span>{NAMES[item.id]}</span>
              <Menu />
              <WidgetGridRemove />
              <WidgetGridResizeHandle />
            </WidgetGridItem>
          ))}
        </WidgetGridContent>
      </WidgetGrid>
    </TectonProvider>
  )
}

const handle = (name: string) =>
  screen.getByRole("button", { name: `Drag ${name}` })
/** The widget itself (not the copy a pointer drags). */
const itemOf = (name: string) =>
  [
    ...document.querySelectorAll<HTMLElement>('[data-slot="widget-grid-item"]'),
  ].find((item) => item.querySelector("span")?.textContent === name)!
const placement = (name: string) => {
  const { gridColumn, gridRow } = itemOf(name).style
  return `${gridColumn} | ${gridRow}`
}
const announced = () =>
  [...document.querySelectorAll("[aria-live]")]
    .map((region) => region.textContent)
    .join(" ")

/**
 * jsdom has no layout: the grid is 1200 px wide (12 columns of 100 px, no
 * gap) with 64 px rows, and each widget's box comes from its grid area.
 */
const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const box = (left: number, top: number, width: number, height: number) =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON() {},
      }) as DOMRect
    const element = this as HTMLElement
    if (element.dataset.slot === "widget-grid-content")
      return box(0, 0, 1200, 600)
    const area = /(\d+) \/ span (\d+)/
    // Stacked, a widget spans the one column: the grid's width.
    const column =
      element.style.gridColumn === "1 / -1"
        ? ["", "1", "12"]
        : area.exec(element.style.gridColumn)
    const row = area.exec(element.style.gridRow)
    if (column && row)
      return box(
        (Number(column[1]) - 1) * 100,
        (Number(row[1]) - 1) * 64,
        Number(column[2]) * 100,
        Number(row[2]) * 64
      )
    return box(0, 0, 0, 0)
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  // A drop swallows the click its release causes, until the next tick.
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe("WidgetGrid", () => {
  it("places each widget by its entry of the layout", () => {
    render(<Dashboard />)
    expect(placement("Production")).toBe("1 / span 6 | 1 / span 2")
    expect(placement("Pressure")).toBe("7 / span 6 | 1 / span 2")
    expect(placement("Alarms")).toBe("1 / span 12 | 3 / span 2")
  })

  it("takes its columns, row height and gap from its props", () => {
    render(
      <WidgetGrid
        defaultValue={[{ id: "a", x: 0, y: 0, w: 4, h: 2 }]}
        columns={24}
        rowHeight={48}
        gap={2}
      >
        <WidgetGridContent>
          <WidgetGridItem value="a" label="A" />
        </WidgetGridContent>
      </WidgetGrid>
    )
    const grid = document.querySelector<HTMLElement>(
      '[data-slot="widget-grid-content"]'
    )!
    expect(grid.style.gridTemplateColumns).toBe("repeat(24, minmax(0, 1fr))")
    expect(grid.style.gridAutoRows).toBe("48px")
    // A step of the spacing scale, following the theme.
    expect(grid.style.gap).toBe("calc(var(--spacing) * 2)")
    // One strip of cells per column, a cell every row and gap.
    const cells = document.querySelectorAll<HTMLElement>(
      '[data-slot="widget-grid-cell"]'
    )
    expect(cells.length).toBe(24)
    expect(cells[0].style.gridRow).toBe("1 / span 3")
  })

  it("hides the handles and the cells outside the edit mode", () => {
    const { rerender } = render(<Dashboard editable={false} />)
    expect(screen.queryByRole("button", { name: /^Drag/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull()
    expect(document.querySelector('[data-slot="widget-grid-cell"]')).toBeNull()
    rerender(<Dashboard editable />)
    expect(handle("Production")).toBeTruthy()
    expect(
      document.querySelectorAll('[data-slot="widget-grid-cell"]').length
    ).toBe(12)
  })

  it("moves a widget with the keyboard and announces each place", async () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    act(() => handle("Production").focus())
    fireEvent.keyDown(handle("Production"), { key: "Enter" })
    await act(() => vi.advanceTimersByTimeAsync(150))
    expect(announced()).toContain("Picked up Production")
    expect(itemOf("Production").dataset.dragging).toBe("keyboard")
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Keep Production here, column 1, row 1, 6 by 2"
    )
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" })
    // The preview: Pressure makes way.
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Production, column 2, row 1, 6 by 2"
    )
    expect(placement("Production")).toBe("2 / span 6 | 1 / span 2")
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.keyDown(document.activeElement!, { key: "Enter" })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "move",
      item: "production",
    })
    expect(placement("Production")).toBe("2 / span 6 | 1 / span 2")
    expect(placement("Pressure")).toBe("7 / span 6 | 3 / span 2")
    await waitFor(() =>
      expect(document.activeElement).toBe(handle("Production"))
    )
  })

  it("resizes with Shift and the arrow keys, and Escape puts it back", () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    fireEvent.keyDown(handle("Production"), { key: " " })
    fireEvent.keyDown(document.activeElement!, {
      key: "ArrowDown",
      shiftKey: true,
    })
    expect(placement("Production")).toBe("1 / span 6 | 1 / span 3")
    expect(
      document.querySelector('[data-slot="widget-grid-size"]')?.textContent
    ).toBe("6 × 3")
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(placement("Production")).toBe("1 / span 6 | 1 / span 2")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("mirrors the arrow keys in a right-to-left page", () => {
    render(<Dashboard dir="rtl" />)
    fireEvent.keyDown(handle("Production"), { key: "Enter" })
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" })
    expect(placement("Production")).toBe("2 / span 6 | 1 / span 2")
  })

  it("drags a widget with the pointer to the cells under it", () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    // Pressed 10 px into the handle at Production's corner.
    fireEvent.pointerDown(handle("Production"), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    })
    // 6.2 columns along: its corner snaps to column 7, Pressure swaps.
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 630, clientY: 12 })
    expect(itemOf("Production").dataset.dragging).toBe("pointer")
    expect(placement("Production")).toBe("7 / span 6 | 1 / span 2")
    expect(placement("Pressure")).toBe("1 / span 6 | 1 / span 2")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 630, clientY: 12 })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(
      onValueChange.mock.calls[0][0].map((i: WidgetGridLayoutItem) => i.id)
    ).toEqual(["pressure", "production", "alarms"])
  })

  it("lands the pointer's copy on the widget after a drop, and never leaves it behind", async () => {
    const animate = vi.fn(function (this: Element) {
      return {
        finished: new Promise(() => {}),
        cancel() {},
      } as unknown as Animation
    })
    Element.prototype.animate = animate
    try {
      render(<Dashboard animated />)
      fireEvent.pointerDown(handle("Production"), {
        button: 0,
        pointerId: 4,
        pointerType: "mouse",
        clientX: 10,
        clientY: 10,
      })
      fireEvent.pointerMove(document, {
        pointerId: 4,
        clientX: 630,
        clientY: 12,
      })
      const ghost = [...document.body.children].find(
        (node) =>
          node.getAttribute("aria-hidden") === "true" &&
          node.hasAttribute("inert")
      )!
      expect(ghost).toBeTruthy()
      fireEvent.pointerUp(document, { pointerId: 4, clientX: 630, clientY: 12 })
      // The copy glides onto the dropped widget…
      expect(animate.mock.contexts).toContain(ghost)
      // …and goes, even if its animation never reports its end.
      await act(() => vi.advanceTimersByTimeAsync(1500))
      expect(ghost.isConnected).toBe(false)
    } finally {
      delete (Element.prototype as { animate?: unknown }).animate
    }
  })

  it("resizes with the pointer, snapping to whole cells", () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    const grip = itemOf("Production").querySelector(
      '[data-slot="widget-grid-resize-handle"]'
    )!
    fireEvent.pointerDown(grip, {
      button: 0,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 595,
      clientY: 125,
    })
    fireEvent.pointerMove(document, {
      pointerId: 2,
      clientX: 820,
      clientY: 190,
    })
    expect(placement("Production")).toBe("1 / span 8 | 1 / span 3")
    expect(placement("Pressure")).toBe("7 / span 6 | 4 / span 2")
    fireEvent.pointerUp(document, { pointerId: 2, clientX: 820, clientY: 190 })
    expect(onValueChange.mock.calls[0][1]).toMatchObject({ reason: "resize" })
    expect(placement("Production")).toBe("1 / span 8 | 1 / span 3")
  })

  it("resizes from the start side, the end side staying put", () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    const edge = itemOf("Pressure").querySelector('[data-edge="start"]')!
    // Pressure covers columns 7 to 12: its start edge is at 600 px.
    fireEvent.pointerDown(edge, {
      button: 0,
      pointerId: 7,
      pointerType: "mouse",
      clientX: 602,
      clientY: 60,
    })
    fireEvent.pointerMove(document, { pointerId: 7, clientX: 395, clientY: 60 })
    expect(placement("Pressure")).toBe("5 / span 8 | 1 / span 2")
    // Production, grown over, makes way below it.
    expect(placement("Production")).toBe("1 / span 6 | 3 / span 2")
    fireEvent.pointerUp(document, { pointerId: 7, clientX: 395, clientY: 60 })
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "resize",
      item: "pressure",
    })
  })

  it("resizes from the top, taking the place of what it grows over", () => {
    render(<Dashboard />)
    const edge = itemOf("Alarms").querySelector('[data-edge="top"]')!
    // Alarms starts on row 3 (128 px); its top edge dragged up a row.
    fireEvent.pointerDown(edge, {
      button: 0,
      pointerId: 8,
      pointerType: "mouse",
      clientX: 300,
      clientY: 129,
    })
    fireEvent.pointerMove(document, { pointerId: 8, clientX: 300, clientY: 62 })
    expect(placement("Alarms")).toBe("1 / span 12 | 1 / span 3")
    expect(placement("Production")).toBe("1 / span 6 | 4 / span 2")
    expect(placement("Pressure")).toBe("7 / span 6 | 4 / span 2")
    fireEvent.pointerUp(document, { pointerId: 8, clientX: 300, clientY: 62 })
    expect(placement("Alarms")).toBe("1 / span 12 | 1 / span 3")
  })

  it("resizes from the start side on the right in a right-to-left page", () => {
    render(<Dashboard dir="rtl" />)
    const edge = itemOf("Pressure").querySelector('[data-edge="start"]')!
    // Columns count from the right: Pressure's start edge is at 600 px.
    fireEvent.pointerDown(edge, {
      button: 0,
      pointerId: 9,
      pointerType: "mouse",
      clientX: 598,
      clientY: 60,
    })
    fireEvent.pointerMove(document, { pointerId: 9, clientX: 805, clientY: 60 })
    expect(placement("Pressure")).toBe("5 / span 8 | 1 / span 2")
    fireEvent.pointerUp(document, { pointerId: 9, clientX: 805, clientY: 60 })
  })

  it("resizes only from the edges it is given", () => {
    render(
      <WidgetGrid defaultValue={[{ id: "a", x: 0, y: 0, w: 4, h: 2 }]}>
        <WidgetGridContent>
          <WidgetGridItem value="a" label="A">
            <WidgetGridResizeHandle edges={["bottom", "end"]} />
          </WidgetGridItem>
        </WidgetGridContent>
      </WidgetGrid>
    )
    const edges = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="widget-grid-resize-edge"]'
      ),
    ].map((zone) => zone.dataset.edge)
    expect(edges).toEqual(["end", "bottom"])
    // The corner between the two is the visible grip.
    expect(
      document.querySelector('[data-slot="widget-grid-resize-handle"]')
    ).toBeTruthy()
  })

  it("removes a widget, announces it and focuses the next one", async () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Production" })
    )
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "remove",
      item: "production",
    })
    expect(screen.queryByText("Production", { selector: "span" })).toBeNull()
    // Pressure floats to the start of the row it had to itself.
    expect(placement("Pressure")).toBe("7 / span 6 | 1 / span 2")
    expect(document.activeElement).toBe(handle("Pressure"))
    await act(() => vi.advanceTimersByTimeAsync(150))
    expect(announced()).toContain("Production removed.")
  })

  it("adds a widget from a source at the first free place", async () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Uptime" }))
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "add",
      item: "uptime",
    })
    expect(placement("Uptime")).toBe("1 / span 4 | 5 / span 2")
    // On the grid now: the source is spent.
    expect(screen.getByRole("button", { name: "Uptime" })).toHaveProperty(
      "disabled",
      true
    )
    await waitFor(() => expect(document.activeElement).toBe(handle("Uptime")))
  })

  it("moves and resizes from a widget's own menu", async () => {
    render(<Dashboard />)
    expect(
      screen.getByRole("button", { name: "Move Pressure right" })
    ).toHaveProperty("disabled", true)
    await userEvent.click(
      screen.getByRole("button", { name: "Move Production right" })
    )
    expect(placement("Production")).toBe("2 / span 6 | 1 / span 2")
    await userEvent.click(
      screen.getByRole("button", { name: "Make Alarms large" })
    )
    expect(placement("Alarms")).toBe("1 / span 12 | 5 / span 3")
    await act(() => vi.advanceTimersByTimeAsync(150))
    expect(announced()).toContain("Alarms resized to 12 by 3.")
  })

  it("stacks a narrow grid in reading order, where widgets keep their order", () => {
    render(<Dashboard stackBelow={1600} />)
    expect(placement("Production")).toBe("1 / -1 | 1 / span 2")
    expect(placement("Pressure")).toBe("1 / -1 | 3 / span 2")
    expect(placement("Alarms")).toBe("1 / -1 | 5 / span 2")
    // No grips and no moves, but still resized, removed and added.
    expect(screen.queryByRole("button", { name: /^Drag/ })).toBeNull()
    expect(
      screen.getByRole("button", { name: "Move Production right" })
    ).toHaveProperty("disabled", true)
    expect(
      screen.getByRole("button", { name: "Remove Production" })
    ).toBeTruthy()
    expect(
      itemOf("Production").querySelector(
        '[data-slot="widget-grid-resize-handle"]'
      )
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "Uptime" })).toHaveProperty(
      "disabled",
      false
    )
  })

  it("resizes only the height of a stacked widget, and the stack makes way", () => {
    const onValueChange = vi.fn()
    render(<Dashboard stackBelow={1600} onValueChange={onValueChange} />)
    const grip = itemOf("Production").querySelector(
      '[data-slot="widget-grid-resize-handle"]'
    )!
    // From its bottom corner, down a row and far to the side.
    fireEvent.pointerDown(grip, {
      button: 0,
      pointerId: 5,
      pointerType: "touch",
      clientX: 1195,
      clientY: 125,
    })
    fireEvent.pointerMove(document, {
      pointerId: 5,
      clientX: 300,
      clientY: 190,
    })
    expect(placement("Production")).toBe("1 / -1 | 1 / span 3")
    // The widgets after it in the stack move down by the row.
    expect(placement("Pressure")).toBe("1 / -1 | 4 / span 2")
    expect(
      document.querySelector('[data-slot="widget-grid-size"]')?.textContent
    ).toBe("↕ 3")
    fireEvent.pointerUp(document, { pointerId: 5, clientX: 300, clientY: 190 })
    expect(onValueChange.mock.calls[0][1]).toMatchObject({ reason: "resize" })
    // Its width on a wide screen is kept.
    expect(
      onValueChange.mock.calls[0][0].find(
        (item: WidgetGridLayoutItem) => item.id === "production"
      )
    ).toMatchObject({ x: 0, y: 0, w: 6, h: 3 })
  })

  it("gives the grid empty rows to put widgets in, where they stay", () => {
    const onValueChange = vi.fn()
    render(
      <Dashboard rows={10} compaction="none" onValueChange={onValueChange} />
    )
    const grid = document.querySelector<HTMLElement>(
      '[data-slot="widget-grid-content"]'
    )!
    expect(grid.style.gridTemplateRows).toBe("repeat(10, 64px)")
    // Dragged eight rows down, past the widgets and into the empty rows.
    fireEvent.pointerDown(handle("Production"), {
      button: 0,
      pointerId: 6,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 6, clientX: 12, clientY: 522 })
    expect(placement("Production")).toBe("1 / span 6 | 9 / span 2")
    fireEvent.pointerUp(document, { pointerId: 6, clientX: 12, clientY: 522 })
    // Nothing floats up into the space it left.
    expect(placement("Production")).toBe("1 / span 6 | 9 / span 2")
    expect(placement("Pressure")).toBe("7 / span 6 | 1 / span 2")
    expect(placement("Alarms")).toBe("1 / span 12 | 3 / span 2")
    // From the keyboard, it steps a row at a time down to the last row.
    fireEvent.keyDown(handle("Production"), { key: "Enter" })
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" })
    expect(placement("Production")).toBe("1 / span 6 | 8 / span 2")
  })

  it("drags a new widget in from a source, with a placeholder", () => {
    const onValueChange = vi.fn()
    render(<Dashboard onValueChange={onValueChange} />)
    fireEvent.pointerDown(screen.getByRole("button", { name: "Uptime" }), {
      button: 0,
      pointerId: 3,
      pointerType: "mouse",
      clientX: 5,
      clientY: 5,
    })
    // The source sits at the page's corner and was pressed 5 px into it:
    // its copy's corner, at (815, 135), is nearest column 9, row 3.
    fireEvent.pointerMove(document, {
      pointerId: 3,
      clientX: 820,
      clientY: 140,
    })
    const placeholder = document.querySelector<HTMLElement>(
      '[data-slot="widget-grid-placeholder"]'
    )!
    expect(placeholder.style.gridColumn).toBe("9 / span 4")
    expect(placeholder.style.gridRow).toBe("3 / span 2")
    // Alarms makes way below it.
    expect(placement("Alarms")).toBe("1 / span 12 | 5 / span 2")
    fireEvent.pointerUp(document, { pointerId: 3, clientX: 820, clientY: 140 })
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "add",
      item: "uptime",
    })
    expect(placement("Uptime")).toBe("9 / span 4 | 3 / span 2")
    expect(
      document.querySelector('[data-slot="widget-grid-placeholder"]')
    ).toBeNull()
  })

  it("keeps the layout when onValueChange cancels the change", async () => {
    render(<Dashboard onValueChange={(_value, details) => details.cancel()} />)
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Production" })
    )
    expect(placement("Production")).toBe("1 / span 6 | 1 / span 2")
  })
})

describe("freeAreas", () => {
  it("finds the holes beside shorter widgets, then the rows below them", () => {
    const layout = [
      { x: 0, y: 0, w: 8, h: 2 },
      { x: 0, y: 2, w: 4, h: 2 },
      { x: 4, y: 2, w: 8, h: 2 },
    ]
    expect(freeAreas(layout, 12)).toEqual([
      { x: 8, y: 0, w: 4, h: 2, end: false },
      { x: 0, y: 4, w: 12, h: 1, end: true },
    ])
    // The grid's own rows below the widgets are one area.
    expect(freeAreas(layout, 12, 8).at(-1)).toEqual({
      x: 0,
      y: 4,
      w: 12,
      h: 4,
      end: true,
    })
  })
})

/** Building blocks of your own: a source, a placeholder, slots, a control. */
const HOLED: Array<WidgetGridLayoutItem> = [
  { id: "production", x: 0, y: 0, w: 8, h: 2 },
  { id: "alarms", x: 0, y: 2, w: 12, h: 2 },
]

function OwnSource() {
  const source = useWidgetGridSource({
    value: "uptime",
    label: "Uptime",
    w: 4,
    h: 2,
  })
  return (
    <div {...source.getSourceProps({ className: "tile" })}>
      Uptime {source.onGrid ? "(added)" : ""}
    </div>
  )
}

function OwnControl() {
  const grid = useWidgetGrid()
  return (
    <button
      type="button"
      onClick={() =>
        grid.add({ id: "pressure", w: 6, h: 2 }, { label: "Pressure" })
      }
    >
      Quick add pressure
    </button>
  )
}

function Builder({ editable = true }: { editable?: boolean }) {
  const [layout, setLayout] = React.useState(HOLED)
  return (
    <WidgetGrid
      value={layout}
      onValueChange={setLayout}
      editable={editable}
      animated={false}
    >
      <OwnSource />
      <OwnControl />
      <WidgetGridContent>
        {layout.map((item) => (
          <WidgetGridItem key={item.id} value={item.id} label={NAMES[item.id]}>
            <WidgetGridHandle />
            <span>{NAMES[item.id]}</span>
          </WidgetGridItem>
        ))}
        <WidgetGridPlaceholder className="own-placeholder">
          {({ label, w, h }) => `${label} ${w}×${h}`}
        </WidgetGridPlaceholder>
        <WidgetGridSlots>
          {(slot) => (
            <WidgetGridSlot
              onClick={() =>
                slot.add({ id: "uptime", w: 4, h: 2 }, { label: "Uptime" })
              }
            />
          )}
        </WidgetGridSlots>
      </WidgetGridContent>
    </WidgetGrid>
  )
}

describe("WidgetGrid building blocks", () => {
  it("shows the free spaces as slots, and adds a widget exactly in one", async () => {
    render(<Builder />)
    const hole = screen.getByRole("button", {
      name: "Add a widget at column 9, row 1, 4 by 2",
    })
    expect(hole.style.gridColumn).toBe("9 / span 4")
    expect(
      screen.getByRole("button", {
        name: "Add a widget at column 1, row 5, 12 by 1",
      }).dataset.end
    ).toBe("")
    await userEvent.click(hole)
    expect(placement("Uptime")).toBe("9 / span 4 | 1 / span 2")
    // The hole is filled: its slot is gone.
    expect(
      screen.queryByRole("button", {
        name: "Add a widget at column 9, row 1, 4 by 2",
      })
    ).toBeNull()
  })

  it("shows no slots out of the edit mode", () => {
    render(<Builder editable={false} />)
    expect(document.querySelector('[data-slot="widget-grid-slot"]')).toBeNull()
  })

  it("makes any element a source: pressed from the keyboard, it adds the widget", () => {
    render(<Builder />)
    const tile = screen.getByRole("button", { name: /^Uptime/ })
    expect(tile.className).toBe("tile")
    expect(tile.tabIndex).toBe(0)
    fireEvent.keyDown(tile, { key: "Enter" })
    // The first free place: the hole beside Production.
    expect(placement("Uptime")).toBe("9 / span 4 | 1 / span 2")
    expect(tile.getAttribute("aria-disabled")).toBe("true")
    expect(tile.textContent).toContain("(added)")
  })

  it("draws a placeholder of your own while a widget is dragged in", () => {
    render(<Builder />)
    fireEvent.pointerDown(screen.getByRole("button", { name: /^Uptime/ }), {
      button: 0,
      pointerId: 10,
      pointerType: "mouse",
      clientX: 5,
      clientY: 5,
    })
    fireEvent.pointerMove(document, {
      pointerId: 10,
      clientX: 1000,
      clientY: 20,
    })
    const placeholders = document.querySelectorAll<HTMLElement>(
      '[data-slot="widget-grid-placeholder"]'
    )
    expect(placeholders.length).toBe(1)
    expect(placeholders[0].className).toContain("own-placeholder")
    expect(placeholders[0].textContent).toBe("Uptime 4×2")
    expect(placeholders[0].style.gridColumn).toBe("9 / span 4")
    // While a widget is dragged, the slots step aside.
    expect(document.querySelector('[data-slot="widget-grid-slot"]')).toBeNull()
    fireEvent.pointerUp(document, { pointerId: 10, clientX: 1000, clientY: 20 })
    expect(placement("Uptime")).toBe("9 / span 4 | 1 / span 2")
  })

  it("adds a widget from a control of your own", async () => {
    render(<Builder />)
    await userEvent.click(
      screen.getByRole("button", { name: "Quick add pressure" })
    )
    // Too wide for the hole: it goes below the widgets.
    expect(placement("Pressure")).toBe("1 / span 6 | 5 / span 2")
    await act(() => vi.advanceTimersByTimeAsync(150))
    expect(announced()).toContain("Pressure added at column 1, row 5, 6 by 2.")
  })
})

/** Widgets added more than once: one entry per instance, of one `type`. */
function Multi({
  onValueChange,
}: {
  onValueChange?: (value: Array<WidgetGridLayoutItem>) => void
}) {
  const [layout, setLayout] = React.useState<Array<WidgetGridLayoutItem>>([
    { id: "production", x: 0, y: 0, w: 12, h: 2 },
  ])
  return (
    <WidgetGrid
      value={layout}
      onValueChange={(next) => {
        onValueChange?.(next)
        setLayout(next)
      }}
      animated={false}
    >
      <WidgetGridSource value="pressure" label="Pressure" w={4} h={2} multiple>
        Pressure
      </WidgetGridSource>
      <Counter />
      <WidgetGridContent>
        {layout.map((item) => (
          <WidgetGridItem key={item.id} value={item.id} label={item.id}>
            <span>{item.id}</span>
          </WidgetGridItem>
        ))}
      </WidgetGridContent>
    </WidgetGrid>
  )
}

function Counter() {
  const grid = useWidgetGrid()
  const [added, setAdded] = React.useState<string | null>(null)
  return (
    <button
      type="button"
      onClick={() => setAdded(grid.add({ type: "pressure", w: 4, h: 2 }))}
    >
      {`${grid.count("pressure")} pressure, added ${added ?? "none"}`}
    </button>
  )
}

describe("WidgetGrid instances", () => {
  it("adds a new instance on each press of a multiple source", async () => {
    const onValueChange = vi.fn()
    render(<Multi onValueChange={onValueChange} />)
    const source = screen.getByRole("button", { name: "Pressure" })
    await userEvent.click(source)
    await userEvent.click(source)
    const layout = onValueChange.mock.calls.at(
      -1
    )![0] as Array<WidgetGridLayoutItem>
    expect(
      layout.filter((item) => item.type === "pressure").map((item) => item.id)
    ).toEqual(["pressure", "pressure-2"])
    // Still on: one more can be added.
    expect(source).toHaveProperty("disabled", false)
    expect(screen.getByRole("button", { name: /^2 pressure/ })).toBeTruthy()
  })

  it("drags in a new instance rather than moving the one on the grid", () => {
    render(<Multi />)
    const source = screen.getByRole("button", { name: "Pressure" })
    fireEvent.click(source)
    expect(placement("pressure")).toBe("1 / span 4 | 3 / span 2")
    fireEvent.pointerDown(source, {
      button: 0,
      pointerId: 11,
      pointerType: "mouse",
      clientX: 5,
      clientY: 5,
    })
    fireEvent.pointerMove(document, {
      pointerId: 11,
      clientX: 1000,
      clientY: 150,
    })
    fireEvent.pointerUp(document, {
      pointerId: 11,
      clientX: 1000,
      clientY: 150,
    })
    // The first one stays; the second lands where it was let go.
    expect(placement("pressure")).toBe("1 / span 4 | 3 / span 2")
    expect(placement("pressure-2")).toBe("9 / span 4 | 3 / span 2")
  })

  it("adds by type from a control, making the id", async () => {
    render(<Multi />)
    await userEvent.click(screen.getByRole("button", { name: /^0 pressure/ }))
    expect(
      screen.getByRole("button", { name: "1 pressure, added pressure" })
    ).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: /^1 pressure/ }))
    expect(
      screen.getByRole("button", { name: "2 pressure, added pressure-2" })
    ).toBeTruthy()
  })
})

describe("WidgetGrid slots fill their space", () => {
  function Tall({ maxH }: { maxH?: number }) {
    const [layout, setLayout] = React.useState<Array<WidgetGridLayoutItem>>([
      { id: "production", x: 0, y: 0, w: 8, h: 6 },
    ])
    return (
      <WidgetGrid value={layout} onValueChange={setLayout} animated={false}>
        <WidgetGridContent>
          {layout.map((item) => (
            <WidgetGridItem key={item.id} value={item.id} label={item.id}>
              <span>{item.id}</span>
            </WidgetGridItem>
          ))}
          <WidgetGridSlots>
            {(slot) => (
              <WidgetGridSlot
                onClick={() => slot.add({ id: "uptime", w: 4, h: 2, maxH })}
              >
                {`${slot.w}×${slot.h} gives ${JSON.stringify(slot.sizeFor({ w: 4, h: 2, maxH }))}`}
              </WidgetGridSlot>
            )}
          </WidgetGridSlots>
        </WidgetGridContent>
      </WidgetGrid>
    )
  }

  it("sizes a widget added in a hole to the hole", async () => {
    render(<Tall />)
    const hole = screen.getByRole("button", {
      name: "Add a widget at column 9, row 1, 4 by 6",
    })
    expect(hole.textContent).toBe('4×6 gives {"w":4,"h":6}')
    await userEvent.click(hole)
    expect(placement("uptime")).toBe("9 / span 4 | 1 / span 6")
  })

  it("keeps within the widget's limits", async () => {
    render(<Tall maxH={3} />)
    await userEvent.click(
      screen.getByRole("button", {
        name: "Add a widget at column 9, row 1, 4 by 6",
      })
    )
    expect(placement("uptime")).toBe("9 / span 4 | 1 / span 3")
  })

  it("keeps the widget's own size below the widgets", async () => {
    render(<Tall />)
    const end = screen.getByRole("button", {
      name: "Add a widget at column 1, row 7, 12 by 1",
    })
    expect(end.textContent).toBe('12×1 gives {"w":4,"h":2}')
    await userEvent.click(end)
    expect(placement("uptime")).toBe("1 / span 4 | 7 / span 2")
  })
})

describe("WidgetGrid sources dragged in", () => {
  it("lines the placeholder up with the copy, wherever the source was grabbed", () => {
    const original = Element.prototype.getBoundingClientRect
    // The source: a 200 × 60 card at (40, 700), below the grid.
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if ((this as HTMLElement).dataset.slot === "widget-grid-source")
        return {
          left: 40,
          top: 700,
          width: 200,
          height: 60,
          right: 240,
          bottom: 760,
          x: 40,
          y: 700,
          toJSON() {},
        }
      return original.call(this)
    }
    try {
      render(<Builder />)
      const source = screen.getByRole("button", { name: /^Uptime/ })
      const columnOf = () =>
        document.querySelector<HTMLElement>(
          '[data-slot="widget-grid-placeholder"]'
        )?.style.gridColumn
      // Grabbed 20 px or 180 px into the card, moved so that the card's
      // corner is at x = 610 both times: the placeholder starts at column 7.
      for (const [id, grabX] of [
        [20, 60],
        [21, 220],
      ] as const) {
        fireEvent.pointerDown(source, {
          button: 0,
          pointerId: id,
          pointerType: "mouse",
          clientX: grabX,
          clientY: 710,
        })
        fireEvent.pointerMove(document, {
          pointerId: id,
          clientX: 610 + (grabX - 40),
          clientY: 300,
        })
        expect(columnOf()).toBe("7 / span 4")
        fireEvent.keyDown(document, { key: "Escape" })
        fireEvent.pointerUp(document, { pointerId: id })
      }
    } finally {
      Element.prototype.getBoundingClientRect = original
    }
  })
})
