"use client"

/**
 * Internal to `@tecton/react`: selection over a collection of string keys,
 * for the primitives with selectable items (tree rows, chips). The pure
 * functions take and return the selected keys in collection order; the hook
 * adds controlled / uncontrolled state, the Shift anchor and `eventDetails`.
 *
 * - `"toggle"` behaviour: a press adds or removes the item (checkbox-like).
 * - `"replace"` behaviour: a press selects only the item; Ctrl/Cmd adds or
 *   removes it, Shift selects the range from the anchor.
 */
import * as React from "react"

import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "./event-details"
import { useControlled } from "./use-controlled"

type SelectionMode = "none" | "single" | "multiple"
type SelectionBehavior = "toggle" | "replace"
type SelectionReason = "item-press" | "keyboard" | "select-all" | "clear"

/** Keys in `order` from `anchor` to `key`, inclusive, in collection order. */
function rangeBetween(order: Array<string>, anchor: string, key: string) {
  const a = order.indexOf(anchor)
  const b = order.indexOf(key)
  if (a < 0 || b < 0) return [key]
  return order.slice(Math.min(a, b), Math.max(a, b) + 1)
}

type SelectionOptions = {
  mode?: SelectionMode
  behavior?: SelectionBehavior
  value?: Array<string>
  defaultValue?: Array<string>
  onValueChange?: (
    value: Array<string>,
    eventDetails: ChangeEventDetails<SelectionReason>
  ) => void
  /** Keeps at least one item selected. */
  disallowEmptySelection?: boolean
  /** Whether a key can be selected (enabled). */
  isSelectable?: (key: string) => boolean
  /** The keys a Shift range runs over (the visible ones), in order. */
  getOrder: () => Array<string>
  /** Every key "select all" stands for (collapsed ones too); `getOrder` by default. */
  getAllKeys?: () => Array<string>
}

type SelectOptions = {
  /** Shift: the range from the anchor. */
  range?: boolean
  /** Ctrl / Cmd, or the toggle behaviour: add or remove the key. */
  toggle?: boolean
  event?: Event | { nativeEvent: Event }
  reason?: SelectionReason
}

type Selection = {
  mode: SelectionMode
  selected: ReadonlySet<string>
  isSelected: (key: string) => boolean
  /** Selects `key` as a press or key would; returns whether it changed. */
  select: (key: string, options?: SelectOptions) => boolean
  selectAll: (event?: SelectOptions["event"]) => void
  clear: (event?: SelectOptions["event"]) => void
  /** Sets the anchor Shift extends from, without selecting. */
  setAnchor: (key: string | null) => void
}

const EMPTY: Array<string> = []
const alwaysSelectable = () => true

function useSelection({
  mode = "none",
  behavior = "toggle",
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  disallowEmptySelection = false,
  isSelectable = alwaysSelectable,
  getOrder,
  getAllKeys = getOrder,
}: SelectionOptions): Selection {
  const [value, setValue] = useControlled(valueProp, defaultValue)
  const selected = React.useMemo(() => new Set(value), [value])
  const anchor = React.useRef<string | null>(null)
  const props = {
    value,
    mode,
    behavior,
    onValueChange,
    disallowEmptySelection,
    isSelectable,
    getOrder,
    getAllKeys,
  }
  // Read by the handlers, which run after the commit.
  const latest = React.useRef(props)
  React.useInsertionEffect(() => {
    latest.current = props
  })

  const commit = React.useCallback(
    (
      next: Array<string>,
      reason: SelectionReason,
      event?: SelectOptions["event"]
    ) => {
      const current = latest.current
      if (current.disallowEmptySelection && next.length === 0) return false
      const same =
        next.length === current.value.length &&
        next.every((key) => current.value.includes(key))
      if (same) return false
      const details = createChangeEventDetails(reason, event)
      current.onValueChange?.(next, details)
      if (details.isCanceled) return false
      setValue(next)
      return true
    },
    [setValue]
  )

  return React.useMemo<Selection>(() => {
    const inOrder = (keys: Iterable<string>) => {
      const set = new Set(keys)
      const ordered = latest.current.getAllKeys().filter((k) => set.has(k))
      // Keys outside the collection (controlled values not rendered) stay.
      for (const key of set) if (!ordered.includes(key)) ordered.push(key)
      return ordered
    }
    return {
      mode,
      selected,
      isSelected: (key) => selected.has(key),
      select(key, { range, toggle, event, reason = "item-press" } = {}) {
        const current = latest.current
        if (current.mode === "none" || !current.isSelectable(key)) return false
        const keys = current.value
        if (current.mode === "single") {
          const removing =
            keys.includes(key) && (toggle || current.behavior === "toggle")
          anchor.current = key
          return commit(removing ? [] : [key], reason, event)
        }
        if (range && anchor.current !== null) {
          const span = rangeBetween(
            current.getOrder(),
            anchor.current,
            key
          ).filter(current.isSelectable)
          // Replace: the range alone; toggle: the range added.
          const next =
            current.behavior === "replace" && !toggle
              ? span
              : inOrder([...keys, ...span])
          return commit(next, reason, event)
        }
        anchor.current = key
        if (toggle || current.behavior === "toggle") {
          const next = keys.includes(key)
            ? keys.filter((k) => k !== key)
            : [...keys, key]
          return commit(next, reason, event)
        }
        return commit([key], reason, event)
      },
      selectAll(event) {
        const current = latest.current
        if (current.mode !== "multiple") return
        commit(
          current.getAllKeys().filter(current.isSelectable),
          "select-all",
          event
        )
      },
      clear(event) {
        commit([], "clear", event)
      },
      setAnchor(key) {
        anchor.current = key
      },
    }
  }, [mode, selected, commit])
}

export { useSelection, rangeBetween }
export type {
  Selection,
  SelectionBehavior,
  SelectionMode,
  SelectionOptions,
  SelectionReason,
  SelectOptions,
}
