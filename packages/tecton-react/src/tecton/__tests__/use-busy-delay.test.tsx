import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useBusyDelay } from "@tecton/react/tecton/use-busy-delay"

function setup(initial: boolean, options?: Parameters<typeof useBusyDelay>[1]) {
  return renderHook(({ pending, opts }) => useBusyDelay(pending, opts), {
    initialProps: { pending: initial, opts: options },
  })
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe("useBusyDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stays false while pending for less than the delay", () => {
    const { result, rerender } = setup(true)
    advance(199)
    expect(result.current).toBe(false)
    rerender({ pending: false, opts: undefined })
    advance(1000)
    expect(result.current).toBe(false)
  })

  it("turns true after the default 200ms delay", () => {
    const { result } = setup(true)
    advance(199)
    expect(result.current).toBe(false)
    advance(1)
    expect(result.current).toBe(true)
  })

  it("stays true for at least minDuration once shown", () => {
    const { result, rerender } = setup(true)
    advance(200)
    expect(result.current).toBe(true)

    advance(50)
    rerender({ pending: false, opts: undefined })
    advance(149)
    expect(result.current).toBe(true)
    advance(1)
    expect(result.current).toBe(false)
  })

  it("turns false on the next tick when shown for longer than minDuration", () => {
    const { result, rerender } = setup(true)
    advance(1000)
    rerender({ pending: false, opts: undefined })
    expect(result.current).toBe(true)
    advance(0)
    expect(result.current).toBe(false)
  })

  it("restarts the delay when isPending toggles rapidly", () => {
    const { result, rerender } = setup(true)
    advance(150)
    rerender({ pending: false, opts: undefined })
    advance(10)
    rerender({ pending: true, opts: undefined })
    // The first delay timer would have fired here had it not been cancelled.
    advance(100)
    expect(result.current).toBe(false)
    advance(100)
    expect(result.current).toBe(true)
  })

  it("keeps the busy state when pending resumes during the minimum duration", () => {
    const { result, rerender } = setup(true)
    advance(200)
    rerender({ pending: false, opts: undefined })
    advance(100)
    rerender({ pending: true, opts: undefined })
    // The cancelled hide timer would have fired here.
    advance(500)
    expect(result.current).toBe(true)

    // The minimum is measured from when the busy state first showed.
    rerender({ pending: false, opts: undefined })
    advance(0)
    expect(result.current).toBe(false)
  })

  it("honours custom delay and minDuration", () => {
    const opts = { delay: 50, minDuration: 500 }
    const { result, rerender } = setup(true, opts)
    advance(50)
    expect(result.current).toBe(true)
    rerender({ pending: false, opts })
    advance(499)
    expect(result.current).toBe(true)
    advance(1)
    expect(result.current).toBe(false)
  })

  it("starts false when isPending starts false", () => {
    const { result } = setup(false)
    advance(1000)
    expect(result.current).toBe(false)
  })

  it("leaves no timers behind after unmounting", () => {
    const pending = setup(true)
    pending.unmount()
    expect(vi.getTimerCount()).toBe(0)

    const hiding = setup(true)
    advance(200)
    hiding.rerender({ pending: false, opts: undefined })
    hiding.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
