"use client"

/**
 * Internal to `@tecton/react`: one tab stop for a collection of items (a
 * grid's rows, a list's chips), moved with the keyboard. The focused key
 * lives in a store, so moving focus re-renders the two items concerned, not
 * all of them. An item that is not rendered yet (a virtualized row) is
 * focused as soon as it is: `ensureRendered` brings it in, and the owner
 * calls `flush()` after rendering.
 */
import * as React from "react"

import { createStore, useStore, type Store } from "../store"

type RovingFocusState = {
  /** The item that has, or last had, focus. */
  focused: string | null
  /** The item Tab lands on: the focused one, or the first enabled one. */
  tabStop: string | null
}

type RovingFocusOptions = {
  getElement: (key: string) => HTMLElement | null | undefined
  /** Renders an item that is out of the DOM (scrolls a virtualized list). */
  ensureRendered?: (key: string) => void
}

type RovingFocus = {
  store: Store<RovingFocusState>
  /** Moves focus to `key` (its element, now or once it renders). */
  focus: (key: string) => void
  /** Records `key` as focused, from the item's own `focus` event. */
  setFocused: (key: string) => void
  /** Focuses an item `focus` asked for that has rendered since. */
  flush: () => void
}

function useRovingFocus(options: RovingFocusOptions): RovingFocus {
  const latest = React.useRef(options)
  React.useInsertionEffect(() => {
    latest.current = options
  })
  const [focus] = React.useState(() => {
    const store = createStore<RovingFocusState>({
      focused: null,
      tabStop: null,
    })
    let pending: string | null = null
    const focusElement = (key: string) => {
      const element = latest.current.getElement(key)
      if (!element) return false
      element.focus({ preventScroll: true })
      element.scrollIntoView({ block: "nearest", inline: "nearest" })
      return true
    }
    return {
      store,
      focus(key: string) {
        store.set({ focused: key, tabStop: key })
        if (focusElement(key)) {
          pending = null
          return
        }
        pending = key
        latest.current.ensureRendered?.(key)
      },
      setFocused(key: string) {
        store.set({ focused: key, tabStop: key })
      },
      flush() {
        if (pending !== null && focusElement(pending)) pending = null
      },
    } satisfies RovingFocus
  })
  return focus
}

/** `0` for the item Tab lands on, `-1` for the others. */
function useTabIndex(store: Store<RovingFocusState>, key: string) {
  return useStore(store, (state) => (state.tabStop === key ? 0 : -1))
}

export { useRovingFocus, useTabIndex }
export type { RovingFocus, RovingFocusState }
