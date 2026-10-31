"use client"

/**
 * Internal to `@tecton/react` (not in the package `exports` map): drag and
 * drop sessions for a collection that decides where a drop goes itself (a
 * tree, a list with folders, a grid). The caller owns what is dragged, the
 * drop rules and the drop indicator; a session runs the input around them.
 *
 * - `trackPointerDrag` follows a press: past a 4 px move, or after a long
 *   press for a finger on an item without a grip, it becomes a drag. A copy
 *   of the item follows the pointer (the item itself keeps its look), the
 *   nearest scroll container scrolls at its edges, and the caller hears the
 *   pointer every frame, so a drop target stays right under a resting
 *   pointer while the items scroll. Release drops; Escape cancels.
 * - `startKeyboardDrag` steps through the places a drop can go with the
 *   arrow keys, Enter drops and Escape, Tab or a click elsewhere cancel;
 *   each step is announced.
 *
 * Listeners sit on the window in the capture phase, ahead of everything
 * else: the collection's own key and press handling (on the document when
 * React renders the whole page) must not see the keys and pointer a drag
 * uses.
 *
 * For one row or column reordered with the items sliding aside, use
 * `useDragReorder` (`./drag-reorder`) instead.
 */

const DRAG_THRESHOLD = 4
const LONG_PRESS = 500

/** The nearest element that scrolls vertically, the page at the latest. */
function scrollerOf(element: HTMLElement) {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const { overflowY } = getComputedStyle(node)
    if (/auto|scroll/.test(overflowY) && node.scrollHeight > node.clientHeight)
      return node
  }
  return element.ownerDocument.scrollingElement as HTMLElement | null
}

/** Scrolls `scroller` while `y` is near its top or bottom edge. */
function autoScroll(scroller: HTMLElement, y: number) {
  const page = scroller === scroller.ownerDocument.scrollingElement
  const { top, bottom } = page
    ? { top: 0, bottom: window.innerHeight }
    : scroller.getBoundingClientRect()
  const edge = Math.min(40, (bottom - top) / 4)
  const depth =
    y < top + edge ? y - top - edge : y > bottom - edge ? y - bottom + edge : 0
  if (depth) scroller.scrollTop += Math.max(-1, Math.min(1, depth / edge)) * 16
}

/** A copy of `item` under the pointer, as the browser's own drag shows one. */
function dragPreview(item: HTMLElement, container: HTMLElement) {
  const preview = item.cloneNode(true) as HTMLElement
  for (const element of [preview, ...preview.querySelectorAll("[id]")]) {
    element.removeAttribute("id")
  }
  // Not an item of the collection, for its code or assistive technology.
  preview.removeAttribute("data-slot")
  preview.setAttribute("aria-hidden", "true")
  preview.setAttribute("inert", "")
  const style = getComputedStyle(item)
  preview.dir = style.direction
  Object.assign(preview.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${item.getBoundingClientRect().width}px`,
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

type PointerDragOptions = {
  /** The pressed item: its copy follows the pointer. */
  item: HTMLElement
  /** The collection: it takes the pointer and the grabbing cursor. */
  container: HTMLElement
  /** Where the copy goes (the portal target); the document body otherwise. */
  previewContainer?: HTMLElement
  /**
   * Waits for a long press before dragging, for a finger on an item rather
   * than on its grip: a finger that moves first is scrolling.
   */
  longPress?: boolean
  /** Called as the press becomes a drag; `false` refuses it. */
  onStart: () => boolean
  /**
   * Called every frame of the drag with the pointer in the viewport, after
   * any edge scrolling.
   */
  onMove: (x: number, y: number) => void
  /** Called once when a started drag ends: `drop` on release. */
  onEnd: (drop: boolean) => void
}

/**
 * Follows the press `down` and turns it into a drag. Returns a function
 * that ends it, with no `onEnd`; calling it again does nothing.
 */
function trackPointerDrag(
  down: PointerEvent,
  {
    item,
    container,
    previewContainer,
    longPress = false,
    onStart,
    onMove,
    onEnd,
  }: PointerDragOptions
) {
  const doc = container.ownerDocument
  const { pointerId } = down
  const itemBox = item.getBoundingClientRect()
  const grab = { x: down.clientX - itemBox.left, y: down.clientY - itemBox.top }
  let pointer = { x: down.clientX, y: down.clientY }
  let dragging = false
  let preview: HTMLElement | null = null
  let scroller: HTMLElement | null = null
  let frame = 0
  let cancelling = false

  const tick = () => {
    frame = requestAnimationFrame(tick)
    if (scroller) autoScroll(scroller, pointer.y)
    onMove(pointer.x, pointer.y)
    preview!.style.transform = `translate(${pointer.x - grab.x}px, ${pointer.y - grab.y}px)`
  }

  const start = () => {
    if (!onStart()) return stop()
    dragging = true
    // The drag takes the pointer, as the browser's own does: the press that
    // began it would otherwise select or open the item on release.
    cancelling = true
    down.target?.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        pointerId,
        pointerType: down.pointerType,
      })
    )
    cancelling = false
    try {
      // Pointer events keep coming outside the window, and items show no
      // hover while the drag is on.
      container.setPointerCapture(pointerId)
    } catch {
      // A pointer the browser no longer tracks.
    }
    container.style.cursor = "grabbing"
    preview = dragPreview(item, previewContainer ?? doc.body)
    scroller = scrollerOf(container)
    tick()
  }
  const timer = longPress ? setTimeout(start, LONG_PRESS) : undefined

  const end = (drop: boolean) => {
    const started = dragging
    stop()
    if (started) onEnd(drop)
  }

  const unlisten = listen(doc.defaultView ?? window, {
    pointermove: (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      pointer = { x: event.clientX, y: event.clientY }
      if (dragging) return
      const travel = Math.hypot(
        pointer.x - down.clientX,
        pointer.y - down.clientY
      )
      if (travel < DRAG_THRESHOLD) return
      // A finger that moves before the long press is scrolling.
      if (longPress) stop()
      else start()
    },
    pointerup: (event: PointerEvent) => {
      if (event.pointerId === pointerId) end(true)
    },
    pointercancel: (event: PointerEvent) => {
      if (!cancelling && event.pointerId === pointerId) end(false)
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
    dragging = false
    clearTimeout(timer)
    cancelAnimationFrame(frame)
    unlisten()
    preview?.remove()
    preview = null
    container.style.cursor = ""
  }
  return stop
}

type KeyboardDragOptions<TPlace> = {
  /** The collection, for its document and reading direction. */
  container: HTMLElement
  /**
   * Every place a drop can go, in order, and the index to aim at first.
   * Read on every key, since the places change with the collection.
   */
  places: () => { places: TPlace[]; start: number }
  /** Whether two places are the same one. */
  isSame: (a: TPlace, b: TPlace) => boolean
  /** The place in words, after "Drop" and "Moved <name>": "before Wells". */
  describe: (place: TPlace) => string
  /** What is moving, in the announcements: "Wells", "3 rows". */
  name: string
  /** Shows the place a drop would go (null for none) and brings it into view. */
  onAim: (place: TPlace | null) => void
  /**
   * Other keys during the drag (opening the aimed folder…): `true` when
   * handled, which keeps them from the collection.
   */
  onKey?: (event: KeyboardEvent, place: TPlace | null) => boolean
  /** Called every frame, to follow items as they render into view. */
  onFrame?: () => void
  /** Called once: with the place on a drop, null on a cancel. */
  onEnd: (place: TPlace | null) => void
  /** Speaks a message (a live region). */
  announce: (message: string) => void
}

/**
 * Starts a keyboard drag, usually from Enter or Space on a drag handle that
 * keeps the focus throughout. Returns a function that ends it, with no
 * `onEnd`.
 */
function startKeyboardDrag<TPlace>({
  container,
  places,
  isSame,
  describe,
  name,
  onAim,
  onKey,
  onFrame,
  onEnd,
  announce,
}: KeyboardDragOptions<TPlace>) {
  let aimed: TPlace | null = null
  let frame = 0
  const tick = () => {
    frame = requestAnimationFrame(tick)
    onFrame?.()
  }

  /** Aims `step` places on from the current one; returns its announcement. */
  const aim = (step: number) => {
    const { places: list, start } = places()
    const index = aimed === null ? -1 : list.findIndex((p) => isSame(p, aimed!))
    const last = list.length - 1
    aimed =
      list.at(
        index < 0
          ? Math.min(start, last)
          : Math.max(0, Math.min(last, index + step))
      ) ?? null
    onAim(aimed)
    return aimed === null ? "Nowhere to drop" : `Drop ${describe(aimed)}`
  }

  const end = (drop: boolean) => {
    const place = drop ? aimed : null
    stop()
    announce(
      place === null ? "Move cancelled" : `Moved ${name} ${describe(place)}`
    )
    onEnd(place)
  }

  const unlisten = listen(container.ownerDocument.defaultView ?? window, {
    keydown: (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        announce(aim(event.key === "ArrowDown" ? 1 : -1))
      } else if (event.key === "Enter" || event.key === " ") {
        end(true)
      } else if (event.key === "Escape") {
        end(false)
      } else if (!onKey?.(event, aimed)) {
        if (event.key === "Tab") end(false)
        return
      }
      event.preventDefault()
      event.stopPropagation()
    },
    pointerdown: () => end(false),
  })

  function stop() {
    cancelAnimationFrame(frame)
    unlisten()
  }

  tick()
  announce(
    `Moving ${name}. ${aim(0)}. Arrow keys choose where, Enter drops, Escape cancels.`
  )
  return stop
}

export { trackPointerDrag, startKeyboardDrag }
export type { PointerDragOptions, KeyboardDragOptions }
