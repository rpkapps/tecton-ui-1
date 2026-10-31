"use client"

/**
 * Internal to `@tecton/react`: moving through an ordered list of keys (the
 * visible rows of a tree, the chips of a list) and type-ahead, for the
 * primitives whose items are one tab stop moved through with the keyboard.
 */
import * as React from "react"

import { useLocale } from "@tecton/react/tecton/provider"

/**
 * The key `step` places from `from` (or the first / last when `from` is
 * null), skipping disabled keys; `from` itself when there is none further.
 */
function nextKey(
  keys: ReadonlyArray<string>,
  from: string | null,
  step: number,
  isDisabled: (key: string) => boolean = () => false
): string | null {
  const direction = Math.sign(step) || 1
  let index =
    from === null ? (direction > 0 ? -1 : keys.length) : keys.indexOf(from)
  let remaining = Math.abs(step) || 1
  let found: string | null = null
  for (
    index += direction;
    index >= 0 && index < keys.length;
    index += direction
  ) {
    if (isDisabled(keys[index])) continue
    found = keys[index]
    if (--remaining === 0) break
  }
  return found ?? (from !== null && keys.includes(from) ? from : null)
}

/** The first (or last, with `step < 0`) enabled key. */
function edgeKey(
  keys: ReadonlyArray<string>,
  step: 1 | -1,
  isDisabled?: (key: string) => boolean
) {
  return nextKey(keys, null, step, isDisabled)
}

const TYPEAHEAD_TIMEOUT = 1000

type TypeaheadOptions = {
  /** The keys to search, in order (unrendered ones too). */
  getKeys: () => ReadonlyArray<string>
  getText: (key: string) => string
  isDisabled?: (key: string) => boolean
  /** The focused key: the search starts there. */
  getFocused: () => string | null
  onMatch: (key: string, event: React.KeyboardEvent) => void
}

/**
 * Type-ahead: printable keys typed within a second of each other build a
 * search, and the next item whose text starts with it (case and accents
 * ignored) is matched. A space extends a search under way rather than
 * selecting. Returns a `keydown` handler; it calls `preventDefault` on the
 * keys it takes.
 */
function useTypeahead(options: TypeaheadOptions) {
  const { locale } = useLocale()
  const latest = React.useRef(options)
  React.useInsertionEffect(() => {
    latest.current = options
  })
  const state = React.useRef<{
    search: string
    timer: ReturnType<typeof setTimeout> | undefined
  }>({ search: "", timer: undefined })
  const collator = React.useMemo(
    () => new Intl.Collator(locale, { usage: "search", sensitivity: "base" }),
    [locale]
  )
  React.useEffect(() => () => clearTimeout(state.current.timer), [])

  return React.useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event
      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey)
        return false
      if (key === " " && !state.current.search.trim()) return false
      const current = latest.current
      const search = state.current.search + key
      state.current.search = search
      clearTimeout(state.current.timer)
      state.current.timer = setTimeout(() => {
        state.current.search = ""
      }, TYPEAHEAD_TIMEOUT)

      const keys = current.getKeys()
      const focused = current.getFocused()
      const start = focused === null ? 0 : Math.max(keys.indexOf(focused), 0)
      const matches = (k: string) => {
        if (current.isDisabled?.(k)) return false
        const text = current.getText(k)
        return collator.compare(text.slice(0, search.length), search) === 0
      }
      // The focused item stays while it still matches; otherwise the next one.
      const ordered = [...keys.slice(start), ...keys.slice(0, start)]
      const match = ordered.find(matches)
      event.preventDefault()
      event.stopPropagation()
      if (match !== undefined) current.onMatch(match, event)
      return true
    },
    [collator]
  )
}

export { nextKey, edgeKey, useTypeahead }
export type { TypeaheadOptions }
