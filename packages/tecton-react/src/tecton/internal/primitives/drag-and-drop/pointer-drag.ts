/**
 * Internal to `@tecton/react`: turns a press into a drag, for any component
 * that moves things with a mouse, a pen or a finger (reordered tabs, tree
 * rows). The caller decides what moves and where it lands; this follows the
 * pointer.
 *
 * - A press becomes a drag once the pointer has moved `threshold` px (along
 *   `axis`, when given); with `longPress`, only after the pointer has rested
 *   500 ms (a finger on an item rather than its grip: moving first scrolls).
 * - `onMove` hears the pointer on every move, and on every frame while
 *   `autoScroll` scrolls the nearest scroll containers of that element at
 *   their edges (the one that scrolls vertically, and the one that scrolls
 *   sideways: a wide table), so a drop target stays right under a resting
 *   pointer while content scrolls.
 * - With `preview`, a copy of the item follows the pointer (the item itself
 *   keeps its look); with `capture`, that element takes the pointer, so
 *   nothing else hovers while dragging. Escape cancels; a click the release
 *   would cause is swallowed; a finger does not pan or open a menu.
 *
 * Listeners sit on the window in the capture phase, ahead of the
 * component's own key and press handling.
 */

type Point = { x: number; y: number }

type PointerDragOptions = {
  /** Pointer travel, in px, before a press becomes a drag. Default 4. */
  threshold?: number
  /** Measures the travel along one axis only. */
  axis?: "x" | "y"
  /** Waits for a 500 ms press first (and a move before it cancels). */
  longPress?: boolean
  /** Takes the pointer on this element while dragging. */
  capture?: HTMLElement | null
  /** Scrolls the nearest scroll containers of this element at their edges. */
  autoScroll?: HTMLElement | null
  /** A copy of `item` follows the pointer, appended to `container`. */
  preview?: { item: HTMLElement; container?: HTMLElement | null } | null
  /** Called as the press becomes a drag; `false` refuses it. */
  onStart: () => boolean | void
  /** The pointer in the viewport, and its travel since the press. */
  onMove: (point: Point, travel: Point) => void
  /**
   * Called once when a started drag ends: `drop` on release, with where the
   * preview was then (for the item to land from there), if there was one.
   * On a drop, `takePreview` hands the preview element itself over (to
   * animate it into place and remove it); otherwise it is removed.
   */
  onEnd: (
    drop: boolean,
    preview: DOMRect | null,
    takePreview: (() => HTMLElement) | null
  ) => void
  /** Called once when the press is over, dragged or not. */
  onStop?: () => void
}

const LONG_PRESS = 500

/**
 * The nearest element that scrolls along `axis` ("y": vertically), the
 * page at the latest.
 */
function scrollerOf(element: HTMLElement, axis: "x" | "y" = "y") {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node)
    const overflow = axis === "y" ? style.overflowY : style.overflowX
    const scrolls =
      axis === "y"
        ? node.scrollHeight > node.clientHeight
        : node.scrollWidth > node.clientWidth
    if (/auto|scroll/.test(overflow) && scrolls) return node
  }
  return element.ownerDocument.scrollingElement as HTMLElement | null
}

/**
 * The px a sticky table header covers at the top of `scroller`: an edge
 * under it would be out of reach, and a row scrolled there out of sight.
 */
function stickyTopOf(scroller: HTMLElement) {
  if (scroller === scroller.ownerDocument.scrollingElement) return 0
  const head = scroller.querySelector("thead")
  return head && getComputedStyle(head).position === "sticky"
    ? head.getBoundingClientRect().height
    : 0
}

/**
 * Scrolls `scroller` along `axis` while `at` (the pointer's x or y) is near
 * one of its edges; true when it scrolled.
 */
function autoScroll(scroller: HTMLElement, at: number, axis: "x" | "y") {
  const page = scroller === scroller.ownerDocument.scrollingElement
  const view = scroller.ownerDocument.defaultView ?? window
  const box = page
    ? { top: 0, bottom: view.innerHeight, left: 0, right: view.innerWidth }
    : scroller.getBoundingClientRect()
  const start = axis === "y" ? box.top + stickyTopOf(scroller) : box.left
  const end = axis === "y" ? box.bottom : box.right
  const edge = Math.min(40, (end - start) / 4)
  if (edge <= 0) return false
  const depth =
    at < start + edge
      ? at - start - edge
      : at > end - edge
        ? at - end + edge
        : 0
  if (!depth) return false
  const step = Math.max(-1, Math.min(1, depth / edge)) * 16
  const before = axis === "y" ? scroller.scrollTop : scroller.scrollLeft
  if (axis === "y") scroller.scrollTop += step
  else scroller.scrollLeft += step
  return (axis === "y" ? scroller.scrollTop : scroller.scrollLeft) !== before
}

/**
 * A copy of a table row or cell, inside a table of its own: out of its
 * table, a row would lose its columns' widths. Each cell keeps its width.
 */
function tablePreview(item: HTMLElement, copy: HTMLElement) {
  const doc = item.ownerDocument
  const cells = item.tagName === "TR" ? [...item.children] : [item]
  const copies = item.tagName === "TR" ? [...copy.children] : [copy]
  cells.forEach((cell, at) => {
    const target = copies[at] as HTMLElement | undefined
    if (!target) return
    const width = `${cell.getBoundingClientRect().width}px`
    Object.assign(target.style, { width, minWidth: width, maxWidth: width })
  })
  const table = doc.createElement("table")
  table.style.borderCollapse = "collapse"
  table.style.tableLayout = "fixed"
  const body = doc.createElement("tbody")
  let row = copy
  if (item.tagName !== "TR") {
    row = doc.createElement("tr")
    row.append(copy)
  }
  body.append(row)
  table.append(body)
  return table
}

/** A copy of `item` under the pointer, as the browser's own drag shows one. */
function createPreview(item: HTMLElement, container: HTMLElement) {
  const copy = item.cloneNode(true) as HTMLElement
  for (const element of [copy, ...copy.querySelectorAll("[id]")]) {
    element.removeAttribute("id")
  }
  // Not an item of the collection, for its code or assistive technology.
  copy.removeAttribute("data-slot")
  copy.removeAttribute("role")
  const tabular = /^(TR|TH|TD)$/.test(item.tagName)
  const preview = tabular ? tablePreview(item, copy) : copy
  preview.setAttribute("aria-hidden", "true")
  preview.setAttribute("inert", "")
  const style = getComputedStyle(item)
  const box = item.getBoundingClientRect()
  preview.dir = style.direction
  Object.assign(preview.style, {
    position: "fixed",
    top: "0",
    left: "0",
    // The item's own box: an item sized by its parent (`h-full` in a grid
    // cell) would otherwise fill the viewport.
    width: `${box.width}px`,
    height: `${box.height}px`,
    boxSizing: "border-box",
    margin: "0",
    font: style.font,
    color: style.color,
    opacity: "0.8",
    pointerEvents: "none",
    zIndex: "50",
  })
  preview.classList.add("bg-background", "shadow-md")
  container.append(preview)
  return preview
}

/** Adds capture listeners to the window; returns their removal. */
function listen(
  view: Window,
  listeners: Record<string, (event: never) => void>
) {
  const entries = Object.entries(listeners) as Array<[string, EventListener]>
  for (const [type, listener] of entries) {
    view.addEventListener(type, listener, { capture: true, passive: false })
  }
  return () => {
    for (const [type, listener] of entries) {
      view.removeEventListener(type, listener, true)
    }
  }
}

/** Swallows the click a drag's release would cause. */
function swallowNextClick(view: Window) {
  const swallow = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  view.addEventListener("click", swallow, { capture: true, once: true })
  setTimeout(() => view.removeEventListener("click", swallow, true), 0)
}

/**
 * Follows the press `down`. Returns a function that ends it without
 * `onEnd`; calling it again does nothing.
 */
function trackPointerDrag(
  down: PointerEvent | { nativeEvent: PointerEvent },
  {
    threshold = 4,
    axis,
    longPress = false,
    capture = null,
    autoScroll: scrollFrom = null,
    preview: previewOf = null,
    onStart,
    onMove,
    onEnd,
    onStop,
  }: PointerDragOptions
) {
  const press = "nativeEvent" in down ? down.nativeEvent : down
  const target = press.target as Element
  const doc = target.ownerDocument
  const view = doc.defaultView ?? window
  const { pointerId } = press
  const origin = { x: press.clientX, y: press.clientY }
  let pointer = origin
  let dragging = false
  let ended = false
  let preview: HTMLElement | null = null
  let grab = { x: 0, y: 0 }
  // The containers that scroll vertically and sideways, if any.
  let scrollers: { y: HTMLElement | null; x: HTMLElement | null } = {
    y: null,
    x: null,
  }
  let frame = 0

  const travel = () => ({ x: pointer.x - origin.x, y: pointer.y - origin.y })
  const place = () => {
    if (preview)
      preview.style.transform = `translate(${pointer.x - grab.x}px, ${pointer.y - grab.y}px)`
  }
  const tick = () => {
    frame = view.requestAnimationFrame(tick)
    const vertical = scrollers.y
      ? autoScroll(scrollers.y, pointer.y, "y")
      : false
    const sideways = scrollers.x
      ? autoScroll(scrollers.x, pointer.x, "x")
      : false
    if (vertical || sideways) onMove(pointer, travel())
  }

  const start = () => {
    if (onStart() === false) return stop()
    dragging = true
    if (capture) {
      try {
        capture.setPointerCapture(pointerId)
      } catch {
        // A pointer the browser no longer tracks.
      }
      capture.style.cursor = "grabbing"
    }
    if (previewOf) {
      const box = previewOf.item.getBoundingClientRect()
      grab = { x: origin.x - box.left, y: origin.y - box.top }
      preview = createPreview(previewOf.item, previewOf.container ?? doc.body)
      place()
    }
    if (scrollFrom) {
      const sideways = scrollerOf(scrollFrom, "x")
      scrollers = {
        y: scrollerOf(scrollFrom, "y"),
        // Only a container that really scrolls sideways: the page rarely
        // does, and a drag along the page's edge should not move it.
        x: sideways === doc.scrollingElement ? null : sideways,
      }
      frame = view.requestAnimationFrame(tick)
    }
    onMove(pointer, travel())
  }
  const timer = longPress ? setTimeout(start, LONG_PRESS) : undefined

  const end = (drop: boolean) => {
    if (ended) return
    const started = dragging
    const ghost = preview
    const at = ghost?.getBoundingClientRect() ?? null
    // Kept out of `stop()`: the drop may take it over.
    preview = null
    stop()
    const handoff = { taken: false }
    try {
      if (!started) return
      if (drop) swallowNextClick(view)
      onEnd(
        drop,
        at,
        drop && ghost
          ? () => {
              handoff.taken = true
              return ghost
            }
          : null
      )
    } finally {
      if (!handoff.taken) ghost?.remove()
    }
  }

  const unlisten = listen(view, {
    pointermove: (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      pointer = { x: event.clientX, y: event.clientY }
      if (dragging) {
        place()
        onMove(pointer, travel())
        return
      }
      const moved = travel()
      const distance =
        axis === "x"
          ? Math.abs(moved.x)
          : axis === "y"
            ? Math.abs(moved.y)
            : Math.hypot(moved.x, moved.y)
      if (distance < threshold) return
      // A finger that moves before the long press is scrolling.
      if (longPress) stop()
      else start()
    },
    pointerup: (event: PointerEvent) => {
      if (event.pointerId === pointerId) end(true)
    },
    pointercancel: (event: PointerEvent) => {
      if (event.pointerId === pointerId) end(false)
    },
    keydown: (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !dragging) return
      event.preventDefault()
      event.stopPropagation()
      end(false)
    },
    // While dragging, a finger moves the items rather than the page, and a
    // long press opens no menu.
    touchmove: (event: TouchEvent) => {
      if (dragging) event.preventDefault()
    },
    contextmenu: (event: Event) => {
      if (!dragging) return
      event.preventDefault()
      event.stopPropagation()
    },
  })

  function stop() {
    if (ended) return
    ended = true
    dragging = false
    clearTimeout(timer)
    view.cancelAnimationFrame(frame)
    unlisten()
    preview?.remove()
    preview = null
    if (capture) capture.style.cursor = ""
    onStop?.()
  }
  return stop
}

export { trackPointerDrag, scrollerOf, stickyTopOf }
export type { PointerDragOptions, Point }
