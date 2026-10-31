"use client"

/**
 * Internal to `@tecton/react`: windowing for a list of fixed-size rows, so a
 * list of thousands renders only the rows in view. The scroll container is
 * the element `ref` is set on: it needs a bounded height. Rows are placed by
 * their owner with `offset(index)`; `size` is the height of the whole list.
 */
import * as React from "react"

type VirtualListOptions = {
  count: number
  /** Row height plus the gap after it, in px. */
  stride: number
  /** Rows rendered beyond each edge of the view. */
  overscan?: number
  /** Indices that stay rendered wherever the scroll is (the focused row). */
  keep?: ReadonlyArray<number>
  /**
   * Px of content above the first row inside the scroll container (a
   * sticky table header). Default 0.
   */
  start?: number
  enabled?: boolean
}

type VirtualList = {
  ref: (element: HTMLElement | null) => void
  /** The indices to render, in order. */
  indices: Array<number>
  offset: (index: number) => number
  size: number
  /** Scrolls the least needed to bring row `index` into view. */
  scrollToIndex: (index: number) => void
}

/** The view height before any layout (and on the server): ten rows. */
const FALLBACK_ROWS = 10

function useVirtualList({
  count,
  stride,
  overscan = 4,
  keep = [],
  start = 0,
  enabled = true,
}: VirtualListOptions): VirtualList {
  const element = React.useRef<HTMLElement | null>(null)
  const [view, setView] = React.useState({ top: 0, height: 0 })
  const cleanup = React.useRef<(() => void) | null>(null)

  const measure = React.useCallback(() => {
    const el = element.current
    if (!el) return
    setView((previous) =>
      previous.top === el.scrollTop && previous.height === el.clientHeight
        ? previous
        : { top: el.scrollTop, height: el.clientHeight }
    )
  }, [])

  const ref = React.useCallback(
    (el: HTMLElement | null) => {
      cleanup.current?.()
      cleanup.current = null
      element.current = el
      if (!el || !enabled) return
      measure()
      el.addEventListener("scroll", measure, { passive: true })
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(measure)
      observer?.observe(el)
      cleanup.current = () => {
        el.removeEventListener("scroll", measure)
        observer?.disconnect()
      }
    },
    [enabled, measure]
  )

  const height = view.height || stride * FALLBACK_ROWS
  const top = Math.max(0, view.top - start)
  const first = Math.max(0, Math.floor(top / stride) - overscan)
  const last = Math.min(
    count - 1,
    Math.ceil((top + height) / stride) + overscan
  )
  const keepKey = keep.join(",")
  const indices = React.useMemo(() => {
    if (!enabled) return Array.from({ length: count }, (_, i) => i)
    const set = new Set<number>()
    for (let i = first; i <= last; i++) set.add(i)
    for (const i of keepKey ? keepKey.split(",").map(Number) : [])
      if (i >= 0 && i < count) set.add(i)
    return [...set].sort((a, b) => a - b)
  }, [enabled, count, first, last, keepKey])

  const scrollToIndex = React.useCallback(
    (index: number) => {
      const el = element.current
      if (!el || index < 0) return
      // A sticky header covers `start` px at the top of the view.
      const top = start + index * stride
      const bottom = top + stride
      if (top - start < el.scrollTop) el.scrollTop = top - start
      else if (bottom > el.scrollTop + el.clientHeight)
        el.scrollTop = bottom - el.clientHeight
      measure()
    },
    [stride, start, measure]
  )

  return {
    ref,
    indices,
    offset: (index) => index * stride,
    size: count * stride,
    scrollToIndex,
  }
}

export { useVirtualList }
export type { VirtualList, VirtualListOptions }
