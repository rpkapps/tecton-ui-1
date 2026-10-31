import { fireEvent } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  startKeyboardDrag,
  trackPointerDrag,
  type KeyboardDragOptions,
  type PointerDragOptions,
} from "../internal/drag-session"

let container: HTMLElement
let item: HTMLElement

beforeEach(() => {
  container = document.createElement("div")
  item = document.createElement("div")
  item.id = "item"
  item.dataset.slot = "list-item"
  item.innerHTML = '<span id="label">Wells</span>'
  container.append(item)
  document.body.append(container)
})

afterEach(() => {
  container.remove()
  vi.useRealTimers()
})

describe("trackPointerDrag", () => {
  /** Presses `item` at (10, 10) and tracks the press with `options`. */
  function press(
    options: Partial<PointerDragOptions> = {},
    pointerType = "mouse"
  ) {
    const handlers = {
      onStart: vi.fn(() => true),
      onMove: vi.fn(),
      onEnd: vi.fn(),
      ...options,
    }
    let stop = () => {}
    item.addEventListener(
      "pointerdown",
      (event) => {
        stop = trackPointerDrag(event, { item, container, ...handlers })
      },
      { once: true }
    )
    fireEvent.pointerDown(item, {
      pointerId: 1,
      pointerType,
      clientX: 10,
      clientY: 10,
    })
    return { ...handlers, stop: () => stop() }
  }
  const move = (x: number, y: number) =>
    fireEvent.pointerMove(document, { pointerId: 1, clientX: x, clientY: y })
  const preview = () => document.querySelector<HTMLElement>("[inert]")

  it("starts past 4 px, follows the pointer and drops on release", () => {
    const { onStart, onMove, onEnd } = press()
    move(12, 12)
    expect(onStart).not.toHaveBeenCalled()
    move(10, 20)
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenLastCalledWith(10, 20)
    expect(container.style.cursor).toBe("grabbing")
    fireEvent.pointerUp(document, { pointerId: 1 })
    expect(onEnd).toHaveBeenCalledWith(true)
    expect(container.style.cursor).toBe("")
  })

  it("shows a copy of the item that is no item: no ids, hidden, inert", () => {
    press()
    move(10, 30)
    const copy = preview()!
    expect(copy).not.toBe(item)
    expect(copy).toHaveTextContent("Wells")
    expect(copy).toHaveAttribute("aria-hidden", "true")
    expect(copy.querySelector("[id]")).toBeNull()
    expect(copy).not.toHaveAttribute("id")
    expect(copy).not.toHaveAttribute("data-slot")
    // Grabbed where it was pressed: (10, 10) on an item at (0, 0).
    expect(copy.style.transform).toBe("translate(0px, 20px)")
    fireEvent.pointerUp(document, { pointerId: 1 })
    expect(preview()).toBeNull()
  })

  it("cancels the press it takes over, without ending itself", () => {
    const cancelled = vi.fn()
    item.addEventListener("pointercancel", cancelled)
    const { onEnd } = press()
    move(10, 30)
    expect(cancelled).toHaveBeenCalledTimes(1)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it("cancels with Escape or a cancelled pointer", () => {
    const first = press()
    move(10, 30)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(first.onEnd).toHaveBeenCalledWith(false)

    const second = press()
    move(10, 30)
    fireEvent.pointerCancel(document, { pointerId: 1 })
    expect(second.onEnd).toHaveBeenCalledWith(false)
  })

  it("leaves a press that never moves, or that onStart refuses, alone", () => {
    const still = press()
    fireEvent.pointerUp(document, { pointerId: 1 })
    expect(still.onEnd).not.toHaveBeenCalled()

    const refused = press({ onStart: vi.fn(() => false) })
    move(10, 30)
    fireEvent.pointerUp(document, { pointerId: 1 })
    expect(refused.onMove).not.toHaveBeenCalled()
    expect(refused.onEnd).not.toHaveBeenCalled()
    expect(preview()).toBeNull()
  })

  it("waits for a long press, and lets a finger that moves first scroll", () => {
    vi.useFakeTimers()
    const swipe = press({ longPress: true }, "touch")
    move(10, 30)
    vi.advanceTimersByTime(600)
    expect(swipe.onStart).not.toHaveBeenCalled()

    const hold = press({ longPress: true }, "touch")
    vi.advanceTimersByTime(499)
    expect(hold.onStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(hold.onStart).toHaveBeenCalledTimes(1)
    const touchMove = new Event("touchmove", { cancelable: true })
    document.dispatchEvent(touchMove)
    expect(touchMove.defaultPrevented).toBe(true)
    hold.stop()
  })

  it("ends without onEnd when stopped", () => {
    const { onEnd, stop } = press()
    move(10, 30)
    stop()
    fireEvent.pointerUp(document, { pointerId: 1 })
    expect(onEnd).not.toHaveBeenCalled()
    expect(preview()).toBeNull()
  })
})

describe("startKeyboardDrag", () => {
  const places = ["before A", "inside B", "after C"]

  function start(options: Partial<KeyboardDragOptions<string>> = {}) {
    const announce = vi.fn()
    const handlers = {
      onAim: vi.fn(),
      onEnd: vi.fn(),
      ...options,
    }
    const stop = startKeyboardDrag<string>({
      container,
      places: () => ({ places, start: 1 }),
      isSame: (a, b) => a === b,
      describe: (place) => place,
      name: "Wells",
      announce,
      ...handlers,
    })
    const said = () => announce.mock.lastCall?.[0] as string
    return { ...handlers, stop, said }
  }
  const press = (key: string) => fireEvent.keyDown(document, { key })

  it("aims at the start place and steps through the places, clamped", () => {
    const { onAim, said } = start()
    expect(onAim).toHaveBeenLastCalledWith("inside B")
    expect(said()).toBe(
      "Moving Wells. Drop inside B. Arrow keys choose where, Enter drops, Escape cancels."
    )
    press("ArrowDown")
    expect(said()).toBe("Drop after C")
    press("ArrowDown")
    expect(onAim).toHaveBeenLastCalledWith("after C")
    press("ArrowUp")
    press("ArrowUp")
    press("ArrowUp")
    expect(said()).toBe("Drop before A")
  })

  it("drops on Enter and announces it", () => {
    const { onEnd, said } = start()
    press("ArrowUp")
    press("Enter")
    expect(onEnd).toHaveBeenCalledWith("before A")
    expect(said()).toBe("Moved Wells before A")
    press("ArrowDown")
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it("cancels with Escape, Tab or a press elsewhere", () => {
    for (const cancel of [
      () => press("Escape"),
      () => press("Tab"),
      () => fireEvent.pointerDown(document.body),
    ]) {
      const { onEnd, said } = start()
      cancel()
      expect(onEnd).toHaveBeenCalledWith(null)
      expect(said()).toBe("Move cancelled")
    }
  })

  it("keeps the keys it uses from the collection, and lets others through", () => {
    const reached = vi.fn()
    document.addEventListener("keydown", reached)
    const onKey = vi.fn((event: KeyboardEvent) => event.key === "ArrowRight")
    const { stop } = start({ onKey })
    press("ArrowDown")
    press("ArrowRight")
    expect(onKey).toHaveBeenCalledWith(expect.anything(), "after C")
    expect(reached).not.toHaveBeenCalled()
    press("a")
    expect(reached).toHaveBeenCalledTimes(1)
    stop()
    document.removeEventListener("keydown", reached)
  })

  it("reads the places on every key, and has nowhere to drop without any", () => {
    let current = places
    const { onEnd, said } = start({
      places: () => ({ places: current, start: 1 }),
    })
    current = ["inside B", "inside D"]
    press("ArrowDown")
    expect(said()).toBe("Drop inside D")
    current = []
    press("ArrowDown")
    expect(said()).toBe("Nowhere to drop")
    press("Enter")
    expect(onEnd).toHaveBeenCalledWith(null)
  })
})
