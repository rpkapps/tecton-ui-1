"use client"

/**
 * Internal to `@tecton/react`: the animation of a drop, for any collection
 * built on `useDragAndDrop` (Reorderable's items, tree rows). Without it a
 * drop is hard to follow: the preview vanishes and the order changes in one
 * frame.
 *
 * A FLIP animation: `capture` measures the items in view just before the
 * drop is applied; on the next commit that moves any of them, each moved
 * item slides from its old box to its new one, and the dropped items from
 * where the pointer preview was let go (from their old place after a
 * keyboard drop), over the others and shedding the preview's surface.
 *
 * The items stay in the document and only their `translate` animates, on
 * the compositor: a scroll container still clips them, a sticky header
 * stays on top, the page stays interactive and the drop commits at once, as
 * it would without the animation. Nothing animates when the user prefers
 * reduced motion or the owner turns it off.
 */
import * as React from "react"

/** Long enough to follow, short enough not to wait for. */
const DURATION = 200
/** Fast out of the gate, settling gently: the item lands. */
const EASING = "cubic-bezier(0.2, 0, 0, 1)"
/**
 * The pointer preview's surface (`bg-background shadow-md`), which a
 * dropped item starts from and sheds as it lands: it passes over the others
 * and stays legible.
 */
const LIFTED: Keyframe = {
  backgroundColor: "var(--background)",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
}
/** A capture the drop never committed (cancelled) is dropped after this. */
const EXPIRY = 1000

type Box = { left: number; top: number; width: number; height: number }

/** The animations this module runs, per element, so a new one can stop them. */
const running = new WeakMap<Element, Array<Animation>>()

function track(element: Element, animation: Animation) {
  const list = running.get(element) ?? []
  list.push(animation)
  running.set(element, list)
  const done = () => {
    const now = running.get(element)
    if (now)
      running.set(
        element,
        now.filter((a) => a !== animation)
      )
  }
  animation.finished.then(done, done)
  return animation
}

/**
 * Stops the animations running on `element`, so it rests where its styles
 * put it: measure where it shows first, then settle it, then measure where
 * it rests. A box measured mid-animation is neither.
 */
function settle(element: Element) {
  for (const animation of running.get(element) ?? []) animation.cancel()
  running.delete(element)
}

type Pending = {
  boxes: Map<string, Box>
  dropped: ReadonlySet<string>
  /** Where the preview was let go, and its size, for the first dropped item. */
  from: (Box & { width: number; height: number }) | null
  expires: number
}

type DropAnimationOptions = {
  /** Turns the animation off. */
  disabled?: boolean
  /** The items' elements now (the mounted ones, in a virtual list). */
  items: () => Iterable<readonly [string, HTMLElement | null]>
}

type DropAnimation = {
  /**
   * Measures the items before a drop of `dropped` is applied; `from` is
   * where the pointer preview was let go.
   */
  capture: (dropped: ReadonlyArray<string>, from: DOMRect | null) => void
}

function prefersReducedMotion(element: Element) {
  const view = element.ownerDocument.defaultView
  return !!view?.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Whether `rect` is at least partly in the viewport. */
function inView(rect: DOMRect, view: Window) {
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < view.innerHeight &&
    rect.left < view.innerWidth
  )
}

type Bounds = { left: number; top: number; right: number; bottom: number }

/**
 * The scroll areas of `element`'s scroll containers, in viewport px: a
 * moving item kept inside them adds no scrollbar for the length of the
 * animation (a transform counts towards a container's scrollable overflow).
 * The page itself is left out.
 */
function scrollAreasOf(
  element: HTMLElement,
  cache: Map<Element, Bounds | null>
) {
  const areas: Array<Bounds> = []
  const page = element.ownerDocument.scrollingElement
  for (
    let node = element.parentElement;
    node && node !== page && node !== element.ownerDocument.body;
    node = node.parentElement
  ) {
    let area = cache.get(node)
    if (area === undefined) {
      const style = getComputedStyle(node)
      area = null
      if (
        /auto|scroll/.test(style.overflow + style.overflowX + style.overflowY)
      ) {
        const rect = node.getBoundingClientRect()
        const left = rect.left + node.clientLeft - node.scrollLeft
        const top = rect.top + node.clientTop - node.scrollTop
        area = {
          left,
          top,
          right: left + node.scrollWidth,
          bottom: top + node.scrollHeight,
        }
      }
      cache.set(node, area)
    }
    if (area) areas.push(area)
  }
  return areas
}

/** `offset` narrowed so that `[start, end]` moved by it stays in `[min, max]`. */
function within(
  offset: number,
  start: number,
  end: number,
  min: number,
  max: number
) {
  const low = min - start
  const high = max - end
  return low > high ? 0 : Math.min(Math.max(offset, low), high)
}

/** Raises `element` over its siblings while `animation` runs. */
function raise(element: HTMLElement, animation: Animation) {
  const { position, zIndex } = element.style
  if (getComputedStyle(element).position === "static")
    element.style.position = "relative"
  element.style.zIndex = "1"
  const restore = () => {
    element.style.position = position
    element.style.zIndex = zIndex
  }
  animation.finished.then(restore, restore)
}

/**
 * Slides each element of `before` from the box it had there to the one it
 * has now, resizing it too when its size changed (a swap preview moving an
 * item into a slot of another size). Nothing moves when `disabled` or when
 * the user prefers reduced motion.
 */
function animateFrom(
  before: ReadonlyMap<HTMLElement, DOMRect>,
  disabled = false
) {
  if (disabled) return
  for (const [element, old] of before) {
    // `animate` is missing from some embedded engines (jsdom).
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!element.isConnected || !element.animate) continue
    if (prefersReducedMotion(element)) return
    settle(element)
    const now = element.getBoundingClientRect()
    slide(element, old, now)
  }
}

/** Animates `element` from the box `from` to its box `to`: position and size. */
function slide(element: HTMLElement, from: Box, to: Box) {
  const dx = from.left - to.left
  const dy = from.top - to.top
  let moved: Animation | null = null
  if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5)
    // Added to the element's own `translate`, if it has one.
    moved = track(
      element,
      element.animate(
        [{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }],
        { duration: DURATION, easing: EASING, composite: "add" }
      )
    )
  if (
    Math.abs(from.width - to.width) >= 0.5 ||
    Math.abs(from.height - to.height) >= 0.5
  )
    track(
      element,
      element.animate(
        [
          { width: `${from.width}px`, height: `${from.height}px` },
          { width: `${to.width}px`, height: `${to.height}px` },
        ],
        { duration: DURATION, easing: EASING }
      )
    )
  return moved
}

function useDropAnimation({
  disabled = false,
  items,
}: DropAnimationOptions): DropAnimation {
  const latest = React.useRef({ disabled, items })
  React.useInsertionEffect(() => {
    latest.current = { disabled, items }
  })
  const pending = React.useRef<Pending | null>(null)

  // After every commit of the owner: the first one that moved the captured
  // items plays. Commits before it (the drag's own state clearing) move
  // nothing and leave the capture waiting.
  React.useLayoutEffect(() => {
    const capture = pending.current
    if (!capture) return
    if (performance.now() > capture.expires) {
      pending.current = null
      return
    }
    const moves: Array<{
      element: HTMLElement
      /** The box it slides from, and its box now. */
      start: Box
      rect: DOMRect
      dropped: boolean
    }> = []
    const areas = new Map<Element, Bounds | null>()
    for (const [key, element] of latest.current.items()) {
      if (!element) continue
      const dropped = capture.dropped.has(key)
      const old = capture.boxes.get(key)
      if (!old) continue
      const rect = element.getBoundingClientRect()
      // The first dropped item comes from the preview (its place and its
      // size), the others from where they showed.
      const from = dropped && capture.from
      const source = from || old
      const same =
        Math.abs(source.left - rect.left) < 0.5 &&
        Math.abs(source.top - rect.top) < 0.5 &&
        Math.abs(source.width - rect.width) < 0.5 &&
        Math.abs(source.height - rect.height) < 0.5
      if (from) capture.from = null
      if (same) continue
      let x = source.left - rect.left
      let y = source.top - rect.top
      // From the nearest point inside its scroll containers: a preview let
      // go past a table's edge would otherwise flash a scrollbar.
      for (const area of scrollAreasOf(element, areas)) {
        x = within(x, rect.left, rect.right, area.left, area.right)
        y = within(y, rect.top, rect.bottom, area.top, area.bottom)
      }
      moves.push({
        element,
        start: {
          left: rect.left + x,
          top: rect.top + y,
          width: source.width,
          height: source.height,
        },
        rect,
        dropped,
      })
    }
    if (!moves.length) return
    pending.current = null
    for (const { element, start, rect, dropped } of moves) {
      const moved = slide(element, start, rect)
      if (!dropped) continue
      if (moved) raise(element, moved)
      // Lifted while it passes the others, then its own surface (an end
      // keyframe left out is the item's own).
      track(
        element,
        element.animate([LIFTED, { ...LIFTED, offset: 0.7 }], DURATION)
      )
    }
  })

  const [api] = React.useState<DropAnimation>(() => ({
    capture(dropped, from) {
      pending.current = null
      const { disabled, items } = latest.current
      if (disabled) return
      const boxes = new Map<string, Box>()
      let view: Window | null = null
      for (const [key, element] of items()) {
        if (!element) continue
        view ??= element.ownerDocument.defaultView
        if (!view || prefersReducedMotion(element)) return
        // `animate` is missing from some embedded engines (jsdom).
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!element.animate) return
        const rect = element.getBoundingClientRect()
        if (inView(rect, view) || dropped.includes(key))
          boxes.set(key, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
      }
      // Measured where they show; now at rest, for the commit to measure
      // where they land.
      for (const [, element] of items()) if (element) settle(element)
      if (!boxes.size) return
      pending.current = {
        boxes,
        dropped: new Set(dropped),
        from: from && {
          left: from.left,
          top: from.top,
          width: from.width,
          height: from.height,
        },
        expires: performance.now() + EXPIRY,
      }
    },
  }))
  return api
}

export { animateFrom, settle, useDropAnimation }
export type { DropAnimation, DropAnimationOptions }
