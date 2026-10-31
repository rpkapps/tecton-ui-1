import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { targetSlot, useDragReorder } from "../internal/drag-reorder"

/** jsdom has no layout: items declare their box with `data-start` and `data-size`. */
const originalRect = Element.prototype.getBoundingClientRect

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const start = Number((this as HTMLElement).dataset.start ?? 0)
    const size = Number((this as HTMLElement).dataset.size ?? 0)
    return {
      left: start,
      right: start + size,
      top: start,
      bottom: start + size,
      width: size,
      height: size,
      x: start,
      y: start,
      toJSON() {},
    }
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

/** A column of items, the shape a list or a tree would use. */
function Column({
  sizes,
  onReorder,
  enabled,
}: {
  sizes: Array<number>
  onReorder: (from: number, to: number) => void
  enabled?: () => boolean
}) {
  const ref = React.useRef<HTMLUListElement>(null)
  const drag = useDragReorder({
    axis: "y",
    getItems: () =>
      Array.from(ref.current?.children ?? []) as Array<HTMLElement>,
    enabled,
    onReorder,
  })
  let start = 0
  return (
    <ul ref={ref}>
      {sizes.map((size, index) => {
        const item = (
          <li
            key={index}
            data-start={start}
            data-size={size}
            style={{ touchAction: drag.touchAction }}
            onPointerDown={drag.onPointerDown}
          >
            Item {index}
          </li>
        )
        start += size
        return item
      })}
    </ul>
  )
}

const press = (
  name: string,
  y: number,
  pointerType: "mouse" | "touch" = "mouse"
) =>
  fireEvent.pointerDown(screen.getByText(name), {
    button: 0,
    pointerId: 7,
    pointerType,
    clientY: y,
  })
const moveTo = (y: number) =>
  fireEvent.pointerMove(document, { pointerId: 7, clientY: y })

describe("useDragReorder", () => {
  it("reorders a column, and lets items pan across the axis", () => {
    const onReorder = vi.fn()
    render(<Column sizes={[40, 40, 40]} onReorder={onReorder} />)
    expect(screen.getByText("Item 0").style.touchAction).toBe("pan-x")
    press("Item 0", 20)
    moveTo(22)
    expect(screen.getByText("Item 0")).not.toHaveAttribute("data-dragging")
    moveTo(90)
    expect(screen.getByText("Item 0")).toHaveAttribute("data-dragging")
    expect(screen.getByText("Item 0").style.transform).toBe("translateY(70px)")
    // The two items it passed step up by its height.
    expect(screen.getByText("Item 1").style.transform).toBe("translateY(-40px)")
    expect(screen.getByText("Item 2").style.transform).toBe("translateY(-40px)")
    fireEvent.pointerUp(document, { pointerId: 7, clientY: 90 })
    expect(onReorder).toHaveBeenCalledWith(0, 2, expect.any(Array))
    expect(screen.getByText("Item 1").style.transform).toBe("")
  })

  it("drags with a finger, and puts everything back when the browser takes the gesture", () => {
    const onReorder = vi.fn()
    render(<Column sizes={[40, 40, 40]} onReorder={onReorder} />)
    press("Item 2", 100, "touch")
    moveTo(10)
    expect(screen.getByText("Item 2")).toHaveAttribute("data-dragging")
    fireEvent.pointerCancel(document, { pointerId: 7 })
    expect(onReorder).not.toHaveBeenCalled()
    expect(screen.getByText("Item 2")).not.toHaveAttribute("data-dragging")
    expect(screen.getByText("Item 0").style.transform).toBe("")

    press("Item 2", 100, "touch")
    moveTo(10)
    fireEvent.pointerUp(document, { pointerId: 7, clientY: 10 })
    expect(onReorder).toHaveBeenCalledWith(2, 0, expect.any(Array))
  })

  it("ignores other pointers, other buttons and a disabled hook", () => {
    const onReorder = vi.fn()
    const { unmount } = render(
      <Column sizes={[40, 40]} onReorder={onReorder} enabled={() => false} />
    )
    press("Item 0", 20)
    moveTo(80)
    expect(screen.getByText("Item 0")).not.toHaveAttribute("data-dragging")
    unmount()

    render(<Column sizes={[40, 40]} onReorder={onReorder} />)
    fireEvent.pointerDown(screen.getByText("Item 0"), {
      button: 2,
      pointerId: 7,
      clientY: 20,
    })
    moveTo(80)
    expect(screen.getByText("Item 0")).not.toHaveAttribute("data-dragging")

    press("Item 0", 20)
    fireEvent.pointerMove(document, { pointerId: 8, clientY: 80 })
    expect(screen.getByText("Item 0")).not.toHaveAttribute("data-dragging")
    fireEvent.pointerUp(document, { pointerId: 7, clientY: 20 })
    expect(onReorder).not.toHaveBeenCalled()
  })
})

describe("targetSlot", () => {
  // Boxes of 300, 100 and 100 along the axis.
  const boxes = [
    { start: 0, end: 300, mid: 150 },
    { start: 300, end: 400, mid: 350 },
    { start: 400, end: 500, mid: 450 },
  ]

  it("reaches the first slot from an item smaller than the first", () => {
    expect(targetSlot(boxes, 2, 0, 100, false)).toBe(0)
  })

  it("reaches the last slot from an item larger than the others", () => {
    expect(targetSlot(boxes, 0, 200, 500, false)).toBe(2)
    // Short of the last item's middle: one slot.
    expect(targetSlot(boxes, 0, 100, 400, false)).toBe(1)
  })

  it("counts from the other end when the axis is reversed", () => {
    // Right to left: the first item is the rightmost.
    const rtl = [
      { start: 200, end: 500, mid: 350 },
      { start: 100, end: 200, mid: 150 },
      { start: 0, end: 100, mid: 50 },
    ]
    expect(targetSlot(rtl, 2, 400, 500, true)).toBe(0)
    expect(targetSlot(rtl, 0, 0, 300, true)).toBe(2)
  })
})
