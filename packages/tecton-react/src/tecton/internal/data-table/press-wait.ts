/**
 * A press that comes before the code it needs has loaded (`lazy.ts`): on a
 * column header before drag and drop (column reordering), on a
 * resizer's grip before the resizer. The press asks for the code and
 * waits; once the code is there, the part gives the press to it (`start`),
 * as if it had come then. (Menus and popovers do not wait: their code
 * comes with the table, `part-popup.ts`.)
 *
 * A waiting press is given up when the user moves on:
 * - a key (Enter, Space): when focus leaves the element, or another key
 *   is pressed (the same key held down is not another);
 * - a pointer press: when the pointer is let go first (that was a click,
 *   not a drag).
 *
 * Nothing here imports the code waited for.
 */
import type * as React from "react"

type Press = { key: string } | { pointer: React.PointerEvent<HTMLElement> }

type PressWait<TTarget> = {
  /** Waits with `press` on `element` (`id`'s); a press waiting before is given up. */
  wait: (id: string, element: HTMLElement | null, press: Press) => void
  /** The id of the press waiting, if any. */
  waiting: () => string | null
  /** Gives the waiting press to `target`, on `element`; stops waiting. */
  start: (target: TTarget, element: HTMLElement) => void
  /** Gives up the waiting press. */
  cancel: () => void
}

/**
 * Replays a press: `key` with the key pressed, `pointer` with the press's
 * event (`pointer` only for a pointer press that waited).
 */
type Replay<TTarget> = (
  target: TTarget,
  element: HTMLElement,
  press: { id: string; key?: string; pointer?: React.PointerEvent<HTMLElement> }
) => void

function createPressWait<TTarget>(replay: Replay<TTarget>): PressWait<TTarget> {
  let waiting: {
    id: string
    press: Press
    stop: () => void
  } | null = null
  const cancel = () => {
    waiting?.stop()
    waiting = null
  }
  return {
    wait(id, element, press) {
      cancel()
      const view = element?.ownerDocument.defaultView ?? window
      const listeners: Array<[EventTarget, string, EventListener]> = []
      const on = (
        target: EventTarget,
        type: string,
        listener: EventListener
      ) => {
        target.addEventListener(type, listener, true)
        listeners.push([target, type, listener])
      }
      const stop = () => {
        for (const [target, type, listener] of listeners)
          target.removeEventListener(type, listener, true)
      }
      if ("key" in press) {
        if (element) on(element, "focusout", cancel)
        on(view, "keydown", (event) => {
          if (!(event as KeyboardEvent).repeat) cancel()
        })
      } else {
        const { pointerId } = press.pointer
        // Let go before the code arrives: a click, no drag.
        const release = (event: Event) => {
          if ((event as PointerEvent).pointerId === pointerId) cancel()
        }
        on(view, "pointerup", release)
        on(view, "pointercancel", release)
      }
      waiting = { id, press, stop }
    },
    waiting: () => waiting?.id ?? null,
    start(target, element) {
      const current = waiting
      cancel()
      if (!current) return
      replay(target, element, {
        id: current.id,
        ...("key" in current.press
          ? { key: current.press.key }
          : { pointer: current.press.pointer }),
      })
    },
    cancel,
  }
}

export { createPressWait }
export type { Press, PressWait }
