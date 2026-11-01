import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  SwapGrid,
  SwapGridHandle,
  SwapGridItem,
  SwapGridSlot,
} from "@tecton/react/tecton/swap-grid"

/**
 * jsdom has no layout: the slots are laid out here as a 2 × 2 grid of
 * 100 px squares, 10 px apart, in document order; an item fills its slot.
 */
const slots = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="swap-grid-slot"]')
  )
const originalRect = Element.prototype.getBoundingClientRect

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const slot = this.closest<HTMLElement>('[data-slot="swap-grid-slot"]')
    const index = slot ? slots().indexOf(slot) : -1
    const left = index < 0 ? 0 : (index % 2) * 110
    const top = index < 0 ? 0 : Math.floor(index / 2) * 110
    const size = index < 0 ? 400 : 100
    return {
      left,
      top,
      right: left + size,
      bottom: top + size,
      width: size,
      height: size,
      x: left,
      y: top,
      toJSON() {},
    }
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

const START = { s1: "a", s2: "b", s3: "c", s4: null }
const NAMES: Record<string, string> = { a: "A", b: "B", c: "C" }

function Grid({
  onValueChange,
  dropAnimation,
}: {
  onValueChange?: (value: Record<string, string | null>) => void
  dropAnimation?: boolean
}) {
  const [value, setValue] = React.useState<Record<string, string | null>>(START)
  return (
    <SwapGrid
      value={value}
      dropAnimation={dropAnimation}
      onValueChange={(next) => {
        onValueChange?.(next)
        setValue(next)
      }}
    >
      {Object.keys(START).map((slot) => (
        <SwapGridSlot key={slot} value={slot} data-testid={slot}>
          {(item) =>
            item && (
              <SwapGridItem value={item} label={NAMES[item]}>
                {NAMES[item]}
                <SwapGridHandle />
              </SwapGridItem>
            )
          }
        </SwapGridSlot>
      ))}
    </SwapGrid>
  )
}

const handle = (name: string) =>
  screen.getByRole("button", { name: `Drag ${name}` })
const shown = () => slots().map((slot) => slot.textContent || null)

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

describe("SwapGrid", () => {
  it("renders each slot's item, and marks an empty slot", () => {
    render(<Grid />)
    expect(shown()).toEqual(["A", "B", "C", null])
    expect(screen.getByTestId("s4")).toHaveAttribute("data-empty", "")
    expect(screen.getByTestId("s1")).not.toHaveAttribute("data-empty")
  })

  it("shows the swap while dragging over a slot, and keeps it on the drop", () => {
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 50)
    // B has taken A's place; A shows, dimmed, where it will land.
    expect(shown()).toEqual(["B", "A", "C", null])
    expect(screen.getByTestId("s2")).toHaveAttribute("data-drop-target", "")
    expect(
      screen.getByTestId("s2").querySelector('[data-slot="swap-grid-item"]')
    ).toHaveAttribute("data-dragging", "")
    release(160, 50)
    expect(onValueChange).toHaveBeenCalledWith({
      s1: "b",
      s2: "a",
      s3: "c",
      s4: null,
    })
    expect(shown()).toEqual(["B", "A", "C", null])
    expect(screen.getByTestId("s2")).not.toHaveAttribute("data-drop-target")
  })

  it("moves an item into an empty slot, leaving its own empty", () => {
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 160)
    expect(shown()).toEqual([null, "B", "C", "A"])
    release(160, 160)
    expect(onValueChange).toHaveBeenCalledWith({
      s1: null,
      s2: "b",
      s3: "c",
      s4: "a",
    })
  })

  it("puts everything back when the drag returns to its own slot", () => {
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    press("A", 50, 50)
    moveTo(160, 50)
    moveTo(40, 40)
    expect(shown()).toEqual(["A", "B", "C", null])
    release(40, 40)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("moves between the slots by where they are with the arrow keys", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    act(() => handle("A").focus())
    await user.keyboard("{Enter}")
    // It starts where it is: nothing swaps until a key aims a slot.
    expect(document.activeElement).toHaveAttribute("aria-label", "Keep A here")
    expect(shown()).toEqual(["A", "B", "C", null])
    // Nothing is wholly left of the first column.
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Keep A here")
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Swap with B")
    expect(shown()).toEqual(["B", "A", "C", null])
    // Below B's slot: the empty one.
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Move to empty slot 4"
    )
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute("aria-label", "Swap with C")
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith({
      s1: "c",
      s2: "b",
      s3: "a",
      s4: null,
    })
    // Focus is back on the moved item's handle.
    await waitFor(() => expect(handle("A")).toHaveFocus())
  })

  it("cancels a keyboard drag with Escape", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Grid onValueChange={onValueChange} />)
    act(() => handle("A").focus())
    await user.keyboard("{Enter}{ArrowDown}{Escape}")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(shown()).toEqual(["A", "B", "C", null])
  })

  describe("animation", () => {
    const animate = vi.fn(function (this: Element) {
      return { finished: Promise.resolve() } as unknown as Animation
    })
    beforeEach(() => {
      animate.mockClear()
      Element.prototype.animate = animate
    })
    afterEach(() => {
      delete (Element.prototype as { animate?: unknown }).animate
    })

    it("slides the swapped item into the freed slot as the drag aims", () => {
      render(<Grid />)
      press("A", 50, 50)
      moveTo(160, 50)
      const slid = animate.mock.contexts.map((element) => element.textContent)
      // B came from s2 (110 px to the right) into s1.
      expect(slid).toContain("B")
      const at = slid.indexOf("B")
      const [keyframes] = animate.mock.calls[at] as unknown as [Array<Keyframe>]
      expect(keyframes[0].translate).toBe("110px 0px")
      release(160, 50)
    })

    it("does not animate with dropAnimation={false}", () => {
      render(<Grid dropAnimation={false} />)
      press("A", 50, 50)
      moveTo(160, 50)
      release(160, 50)
      expect(animate).not.toHaveBeenCalled()
    })
  })
})
