"use client"

/**
 * A field bound to a piece of the view that it changes after a delay (the
 * search, a text or number filter): the field shows each key at once, and
 * the value reaches the view `delay` ms after the last one (at once with
 * no delay). A change from elsewhere (a filter chip removed, a controlled
 * view), and "Clear all" or a reset even when the view's value stays the
 * same (`clears`), replace what the field shows and drop a change still
 * waiting; a change the view does not take (`onViewChange` cancels
 * it) puts the view's value back. A change still waiting when the field
 * goes (its popover closed) is made then.
 */
import * as React from "react"

function useDelayedCommit<TValue>({
  value,
  commit,
  delay,
  clears,
  same = Object.is,
}: {
  /** The view's value. */
  value: TValue
  /** Sets the view's value; `false` when the view did not take it. */
  commit: (value: TValue) => boolean
  delay: number
  /** The table's count of clears and resets (`DataTableState.clears`). */
  clears: number
  same?: (a: TValue, b: TValue) => boolean
}) {
  const [draft, setDraft] = React.useState(value)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  /** The value last sent to the view, or taken from it. */
  const sent = React.useRef(value)
  const latest = React.useRef({ value, commit, same })
  React.useInsertionEffect(() => {
    latest.current = { value, commit, same }
  })

  const lastClears = React.useRef(clears)
  React.useEffect(() => {
    const cleared = lastClears.current !== clears
    lastClears.current = clears
    // The view caught up with what was sent: nothing to do.
    if (!cleared && latest.current.same(value, sent.current)) return
    clearTimeout(timer.current)
    timer.current = undefined
    sent.current = value
    setDraft(value)
  }, [value, clears])

  const send = React.useCallback((next: TValue) => {
    timer.current = undefined
    sent.current = next
    if (latest.current.commit(next)) return
    // Not taken: the view's value again.
    sent.current = latest.current.value
    setDraft(latest.current.value)
  }, [])

  const pending = React.useRef<TValue | undefined>(undefined)
  React.useEffect(
    () => () => {
      if (timer.current === undefined) return
      clearTimeout(timer.current)
      send(pending.current as TValue)
    },
    [send]
  )

  const change = React.useCallback(
    (next: TValue) => {
      setDraft(next)
      clearTimeout(timer.current)
      timer.current = undefined
      if (delay <= 0) return send(next)
      pending.current = next
      timer.current = setTimeout(() => send(next), delay)
    },
    [delay, send]
  )
  /** Sends the value waiting now (Enter in the field). */
  const flush = React.useCallback(() => {
    if (timer.current === undefined) return
    clearTimeout(timer.current)
    send(pending.current as TValue)
  }, [send])

  return { draft, change, flush }
}

export { useDelayedCommit }
