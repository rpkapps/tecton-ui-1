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

type Box = { left: number; top: number }

type Pending = {
  boxes: Map<string, Box>
  dropped: ReadonlySet<string>
  /** Where the preview was let go, for the first dropped item. */
  from: Box | null
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
      dx: number
      dy: number
      dropped: boolean
    }> = []
    let moved = false
    for (const [key, element] of latest.current.items()) {
      if (!element) continue
      const dropped = capture.dropped.has(key)
      const old = capture.boxes.get(key)
      if (!old) continue
      const rect = element.getBoundingClientRect()
      const dx = old.left - rect.left
      const dy = old.top - rect.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      moved = true
      // The first dropped item comes from the preview, the others (a
      // multiple selection) from their old places.
      const from = dropped && capture.from
      moves.push({
        element,
        dx: from ? from.left - rect.left : dx,
        dy: from ? from.top - rect.top : dy,
        dropped,
      })
      if (from) capture.from = null
    }
    if (!moved) return
    pending.current = null
    for (const { element, dx, dy, dropped } of moves) {
      // Added to the item's own `translate`, if it has one.
      const animation = element.animate(
        [{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }],
        { duration: DURATION, easing: EASING, composite: "add" }
      )
      if (!dropped) continue
      raise(element, animation)
      // Lifted while it passes the others, then its own surface (an end
      // keyframe left out is the item's own).
      element.animate([LIFTED, { ...LIFTED, offset: 0.7 }], DURATION)
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
          boxes.set(key, { left: rect.left, top: rect.top })
      }
      if (!boxes.size) return
      pending.current = {
        boxes,
        dropped: new Set(dropped),
        from: from && { left: from.left, top: from.top },
        expires: performance.now() + EXPIRY,
      }
    },
  }))
  return api
}

export { useDropAnimation }
export type { DropAnimation, DropAnimationOptions }
