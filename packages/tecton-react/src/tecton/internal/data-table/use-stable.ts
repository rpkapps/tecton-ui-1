"use client"

import * as React from "react"

/**
 * `next`, or the object (or array) returned last while each of its own
 * values is the same (`Object.is`): an object written out on every render
 * that stays one object while what it holds does, without a memo listing
 * every value again as its dependencies.
 */
function useStable<T extends object>(next: T): T {
  const last = React.useRef(next)
  const before = last.current as Record<string, unknown>
  const now = next as Record<string, unknown>
  const keys = Object.keys(now)
  const same =
    keys.length === Object.keys(before).length &&
    keys.every((key) => Object.is(before[key], now[key]))
  if (!same) last.current = next
  return last.current
}

export { useStable }
