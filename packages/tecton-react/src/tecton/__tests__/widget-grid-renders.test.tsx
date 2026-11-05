import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridHandle,
  WidgetGridItem,
  WidgetGridResizeHandle,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

/**
 * Re-renders: a drag or a resize re-renders only the widgets it moves (their
 * own element, never their content), and a widget's live data re-renders
 * only that widget's content.
 */

const COUNT = 30
const LAYOUT: Array<WidgetGridLayoutItem> = Array.from(
  { length: COUNT },
  (_, index) => ({
    id: `w${index}`,
    x: (index % 4) * 3,
    y: Math.floor(index / 4) * 2,
    w: 3,
    h: 2,
  })
)

const renders = {
  items: new Map<string, number>(),
  bodies: new Map<string, number>(),
}
const bump = (map: Map<string, number>, id: string) =>
  map.set(id, (map.get(id) ?? 0) + 1)
const total = (map: Map<string, number>) =>
  [...map.values()].reduce((sum, n) => sum + n, 0)

/** Live data, outside React: one value per widget. */
const live = (() => {
  const values = new Map<string, number>()
  const listeners = new Map<string, Set<() => void>>()
  return {
    get: (id: string) => values.get(id) ?? 0,
    set(id: string, value: number) {
      values.set(id, value)
      for (const listener of listeners.get(id) ?? []) listener()
    },
    subscribe(id: string, listener: () => void) {
      const set = listeners.get(id) ?? new Set()
      set.add(listener)
      listeners.set(id, set)
      return () => set.delete(listener)
    },
  }
})()

const Body = React.memo(function Body({ id }: { id: string }) {
  bump(renders.bodies, id)
  const value = React.useSyncExternalStore(
    (listener) => live.subscribe(id, listener),
    () => live.get(id)
  )
  return <span>{value}</span>
})

function Dashboard() {
  const [layout, setLayout] = React.useState(LAYOUT)
  return (
    <WidgetGrid value={layout} onValueChange={setLayout} animated={false}>
      <WidgetGridContent>
        {layout.map(({ id }) => (
          <WidgetGridItem
            key={id}
            value={id}
            label={id}
            render={(props) => {
              bump(renders.items, id)
              return <div {...props} />
            }}
          >
            <WidgetGridHandle />
            <Body id={id} />
            <WidgetGridResizeHandle />
          </WidgetGridItem>
        ))}
      </WidgetGridContent>
    </WidgetGrid>
  )
}

const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  renders.items.clear()
  renders.bodies.clear()
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const element = this as HTMLElement
    const area = /(\d+) \/ span (\d+)/
    const column = area.exec(element.style.gridColumn)
    const row = area.exec(element.style.gridRow)
    const [left, top, width, height] =
      element.dataset.slot === "widget-grid-content"
        ? [0, 0, 1200, 2000]
        : column && row
          ? [
              (Number(column[1]) - 1) * 100,
              (Number(row[1]) - 1) * 64,
              Number(column[2]) * 100,
              Number(row[2]) * 64,
            ]
          : [0, 0, 0, 0]
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

describe("WidgetGrid re-renders", () => {
  it("re-renders only the widgets a keyboard drag moves, never their content", () => {
    render(<Dashboard />)
    const placeOf = () =>
      new Map(
        LAYOUT.map(({ id }) => {
          const handle = screen.getByRole("button", { name: `Drag ${id}` })
          const item = handle.closest<HTMLElement>(
            '[data-slot="widget-grid-item"]'
          )!
          return [id, `${item.style.gridColumn}|${item.style.gridRow}`]
        })
      )
    renders.items.clear()
    renders.bodies.clear()
    fireEvent.keyDown(screen.getByRole("button", { name: "Drag w0" }), {
      key: "Enter",
    })
    // Picked up where it is: only the widget itself changes its look.
    expect([...renders.items.keys()].filter((id) => id !== "w0")).toEqual([])
    for (const key of ["ArrowDown", "ArrowRight", "ArrowDown", "ArrowLeft"]) {
      const before = placeOf()
      renders.items.clear()
      fireEvent.keyDown(document.activeElement!, { key })
      const after = placeOf()
      const moved = LAYOUT.map(({ id }) => id).filter(
        (id) => before.get(id) !== after.get(id)
      )
      expect(moved.length).toBeGreaterThan(0)
      // Exactly the widgets that moved, out of thirty.
      expect([...renders.items.keys()].sort()).toEqual(moved.sort())
    }
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(total(renders.bodies)).toBe(0)
  })

  it("re-renders nothing but the dragged widgets' elements during a pointer drag", () => {
    render(<Dashboard />)
    renders.items.clear()
    renders.bodies.clear()
    fireEvent.pointerDown(screen.getByRole("button", { name: "Drag w5" }), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 310,
      clientY: 140,
    })
    // Thirty pointer moves within the same cell: no new place, no render.
    for (let step = 0; step < 30; step += 1)
      fireEvent.pointerMove(document, {
        pointerId: 1,
        clientX: 320 + (step % 3),
        clientY: 141,
      })
    const sameCell = total(renders.items)
    for (let step = 0; step < 30; step += 1)
      fireEvent.pointerMove(document, {
        pointerId: 1,
        clientX: 322 + (step % 3),
        clientY: 142,
      })
    expect(total(renders.items)).toBe(sameCell)
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 322, clientY: 142 })
    expect(total(renders.bodies)).toBe(0)
  })

  it("re-renders only the widget whose live data changed", () => {
    render(<Dashboard />)
    renders.items.clear()
    renders.bodies.clear()
    act(() => {
      for (let tick = 1; tick <= 100; tick += 1) live.set("w7", tick)
    })
    expect(total(renders.items)).toBe(0)
    expect([...renders.bodies.keys()]).toEqual(["w7"])
  })
})
