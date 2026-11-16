"use client"

/**
 * Focus continuity in the table's frame: where focus goes when the element
 * it was on goes (a page change, "Show more" gone), unless the user moved
 * it elsewhere since.
 *
 * - `useFocusAway(frame, inside, away)`: `away(left)` when focus leaves an
 *   element `inside` for one that is not, by a move of the user's. An
 *   element removed while focused is none: Chrome sends its `focusout` as
 *   it removes it, while it is still in the document, told apart once the
 *   render that removes it is done (and its layout effects, which move the
 *   focus it lost, have run).
 * - `focusFree(frame)`: focus may be moved, being in the frame or nowhere
 *   (dropped to the page); elsewhere on the page it is the user's, left as
 *   it is.
 */
import * as React from "react"

function useFocusAway(
  frame: React.RefObject<HTMLElement | null>,
  inside: (node: EventTarget | null, frame: HTMLElement) => boolean,
  away: (left: Node) => void
) {
  const latest = React.useRef({ inside, away })
  React.useInsertionEffect(() => {
    latest.current = { inside, away }
  })
  React.useEffect(() => {
    const element = frame.current
    if (!element) return
    const leave = (event: FocusEvent) => {
      const { inside: within } = latest.current
      if (
        !within(event.target, element) ||
        within(event.relatedTarget, element)
      )
        return
      const left = event.target as Node
      queueMicrotask(() => {
        if (left.isConnected) latest.current.away(left)
      })
    }
    element.addEventListener("focusout", leave)
    return () => element.removeEventListener("focusout", leave)
  }, [frame])
}

function focusFree(frame: HTMLElement) {
  const doc = frame.ownerDocument
  const active = doc.activeElement
  return !active || active === doc.body || frame.contains(active)
}

export { focusFree, useFocusAway }
