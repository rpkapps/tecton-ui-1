"use client"

/**
 * Internal to `@tecton/react` (not in the package `exports` map): a minimal
 * external store for state that many parts read but each needs only a
 * slice of. A part subscribes with a selector and re-renders only when what
 * it selected changes, where a context would re-render every consumer.
 */
import * as React from "react"

type Store<T extends object> = {
  get: () => T
  /** Merges `patch`; listeners run only when a key changed. */
  set: (patch: Partial<T>) => void
  subscribe: (listener: () => void) => () => void
}

function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(patch) {
      const keys = Object.keys(patch) as Array<keyof T>
      if (keys.every((key) => Object.is(state[key], patch[key]))) return
      state = { ...state, ...patch }
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * The slice of `store` that `selector` picks. Select a primitive, or a value
 * kept in the state as is: a new object on every call would re-render on
 * every change.
 */
function useStore<T extends object, TSlice>(
  store: Store<T>,
  selector: (state: T) => TSlice
): TSlice {
  const read = () => selector(store.get())
  return React.useSyncExternalStore(store.subscribe, read, read)
}

export { createStore, useStore }
export type { Store }
