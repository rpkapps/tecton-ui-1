"use client"

/**
 * Internal to `@tecton/react`: windowing for a list of fixed-size rows, so a
 * list of thousands renders only the rows in view. The scroll container is
 * the element `ref` is set on: it needs a bounded height. Rows are placed by
 * their owner with `offset(index)`; `size` is the height of the whole list.
 *
 * A few rows may have a height of their own (`sizes`, measured by the
 * owner: a table's detail rows): the rows' offsets then add up the
 * difference of each one above, found by binary search over those rows
 * only, so the rest stay one stride each and a list of 100,000 rows with a
 * handful of them costs no more to window.
 */
import * as React from "react"
import { flushSync } from "react-dom"

type VirtualListOptions = {
  count: number
  /** Row height plus the gap after it, in px. */
  stride: number
  /** Rows rendered beyond each edge of the view. */
  overscan?: number
  /**
   * Px rendered beyond each edge of the view, when more than `overscan`
   * rows: a fast flick then finds rows already in place.
   */
  overscanPx?: number
  /** Like `overscanPx`, in heights of the view (1: a screenful each way). */
  overscanViews?: number
  /**
   * Applies a scroll before the browser paints it (`flushSync`), so the
   * rows for a scroll position are in place in the same frame.
   */
  sync?: boolean
  /**
   * With `overscanPx`: a scroll that jumps past the rows already prepared
   * (the scrollbar dragged, End) renders only `overscan` rows beyond the
   * view, so each frame of the jump mounts about a screenful; `overscanPx`
   * comes back this many ms after the scrolling stops.
   */
  settleMs?: number
  /** Indices that stay rendered wherever the scroll is (the focused row). */
  keep?: ReadonlyArray<number>
  /** The rows whose height is not `stride`: index → px. */
  sizes?: ReadonlyMap<number, number>
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
  /** The scroll container's height, as last measured (0 before layout). */
  viewHeight: number
}

/** The view height before any layout (and on the server): ten rows. */
const FALLBACK_ROWS = 10

/** Where rows are: one stride each, but the rows of `sizes`. */
type RowLayout = {
  offset: (index: number) => number
  sizeOf: (index: number) => number
  /** The row at `px` from the top (the last one past the end). */
  indexAt: (px: number) => number
  /** The first row that starts at or below `px`. */
  endAt: (px: number) => number
  total: number
}

function rowLayout(
  count: number,
  stride: number,
  sizes: ReadonlyMap<number, number> | undefined
): RowLayout {
  const own = sizes
    ? [...sizes].filter(([index]) => index >= 0 && index < count)
    : []
  if (own.length === 0)
    return {
      offset: (index) => index * stride,
      sizeOf: () => stride,
      indexAt: (px) =>
        Math.min(Math.max(0, count - 1), Math.max(0, Math.floor(px / stride))),
      endAt: (px) => Math.ceil(px / stride),
      total: count * stride,
    }
  own.sort((a, b) => a[0] - b[0])
  const indices = own.map(([index]) => index)
  // The extra height of the rows of their own before each one.
  const before = [0]
  for (const [, size] of own)
    before.push(before[before.length - 1] + size - stride)
  /** How many rows of their own come before `index`. */
  const rank = (index: number) => {
    let low = 0
    let high = indices.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (indices[mid] < index) low = mid + 1
      else high = mid
    }
    return low
  }
  const offset = (index: number) => index * stride + before[rank(index)]
  const heights = new Map(own)
  const indexAt = (px: number) => {
    let low = 0
    let high = Math.max(0, count - 1)
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (offset(mid) <= px) low = mid
      else high = mid - 1
    }
    return low
  }
  return {
    offset,
    sizeOf: (index) => heights.get(index) ?? stride,
    indexAt,
    endAt: (px) => {
      const at = indexAt(px)
      return offset(at) >= px ? at : at + 1
    },
    total: count * stride + before[before.length - 1],
  }
}

function useVirtualList({
  count,
  stride,
  overscan = 4,
  overscanPx: overscanPxOption = 0,
  overscanViews = 0,
  sync = false,
  settleMs = 0,
  keep = [],
  sizes,
  start = 0,
  enabled = true,
}: VirtualListOptions): VirtualList {
  const element = React.useRef<HTMLElement | null>(null)
  // `jumping`: the last scroll went past the prepared rows.
  const [view, setView] = React.useState({
    top: 0,
    height: 0,
    jumping: false,
  })
  const cleanup = React.useRef<(() => void) | null>(null)
  const overscanPx = overscanPxOption + overscanViews * view.height
  const latest = React.useRef({ sync, settleMs, overscanPx })
  React.useInsertionEffect(() => {
    latest.current = { sync, settleMs, overscanPx }
  })
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  React.useEffect(() => () => clearTimeout(settle.current), [])

  const measure = React.useCallback(() => {
    const el = element.current
    if (!el) return
    const top = el.scrollTop
    const height = el.clientHeight
    setView((previous) => {
      if (previous.top === top && previous.height === height) return previous
      const { settleMs: wait, overscanPx: prepared } = latest.current
      // A jump: the new view does not touch the rows mounted for the last
      // one (the view plus `overscanPx` beyond each edge).
      const jumping =
        wait > 0 &&
        (previous.jumping ||
          Math.abs(top - previous.top) > prepared + previous.height)
      return { top, height, jumping }
    })
  }, [])

  const onScroll = React.useCallback(() => {
    const { sync: now, settleMs: wait } = latest.current
    if (now) flushSync(measure)
    else measure()
    if (wait <= 0) return
    clearTimeout(settle.current)
    // Interruptible: a scroll arriving while the extra rows render goes
    // first.
    settle.current = setTimeout(
      () =>
        React.startTransition(() =>
          setView((previous) =>
            previous.jumping ? { ...previous, jumping: false } : previous
          )
        ),
      wait
    )
  }, [measure])

  const ref = React.useCallback(
    (el: HTMLElement | null) => {
      cleanup.current?.()
      cleanup.current = null
      element.current = el
      if (!el || !enabled) return
      measure()
      el.addEventListener("scroll", onScroll, { passive: true })
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(measure)
      observer?.observe(el)
      cleanup.current = () => {
        el.removeEventListener("scroll", onScroll)
        observer?.disconnect()
      }
    },
    [enabled, measure, onScroll]
  )

  const layout = React.useMemo(
    () => rowLayout(count, stride, sizes),
    [count, stride, sizes]
  )
  const height = view.height || stride * FALLBACK_ROWS
  const top = Math.max(0, view.top - start)
  const extra = view.jumping
    ? overscan
    : Math.max(overscan, Math.ceil(overscanPx / stride))
  const first = Math.max(0, layout.indexAt(top) - extra)
  const last = Math.min(count - 1, layout.endAt(top + height) + extra)
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
      const top = start + layout.offset(index)
      const bottom = top + layout.sizeOf(index)
      if (top - start < el.scrollTop) el.scrollTop = top - start
      else if (bottom > el.scrollTop + el.clientHeight)
        el.scrollTop = bottom - el.clientHeight
      measure()
    },
    [layout, start, measure]
  )

  return {
    ref,
    indices,
    offset: layout.offset,
    size: layout.total,
    scrollToIndex,
    viewHeight: view.height,
  }
}

export { useVirtualList }
export type { VirtualList, VirtualListOptions }
