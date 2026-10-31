"use client"

/**
 * Internal to `@tecton/react`: announces selection changes in a grid (tree
 * rows, chips) through a live region, since screen readers do not announce
 * `aria-selected` changing on the focused row: "Wells selected.", "3 items
 * selected.". Only changes made while the grid has focus are announced.
 */
import * as React from "react"

import { GRID_MESSAGES } from "./grid-messages"
import { announce } from "./live-announcer"
import { useMessages } from "./messages"
import type { SelectionBehavior, SelectionMode } from "./selection"

type SelectionAnnouncementOptions = {
  selected: ReadonlySet<string>
  mode: SelectionMode
  behavior: SelectionBehavior
  /** Whether focus is in the grid. */
  hasFocus: () => boolean
  getText: (key: string) => string
  /** Every key "select all" covers: selecting them all reads "All items selected." */
  getAllKeys: () => ReadonlyArray<string>
}

function useSelectionAnnouncement({
  selected,
  mode,
  behavior,
  hasFocus,
  getText,
  getAllKeys,
}: SelectionAnnouncementOptions) {
  const format = useMessages(GRID_MESSAGES)
  const last = React.useRef(selected)
  React.useEffect(() => {
    const previous = last.current
    last.current = selected
    if (previous === selected || mode === "none" || !hasFocus()) return
    const added = [...selected].filter((key) => !previous.has(key))
    const removed = [...previous].filter((key) => !selected.has(key))
    if (!added.length && !removed.length) return
    const messages: Array<string> = []
    if (selected.size === 1 && behavior === "replace") {
      const [key] = selected
      messages.push(format("selectedItem", { item: getText(key) }))
    } else if (added.length === 1 && removed.length === 0) {
      messages.push(format("selectedItem", { item: getText(added[0]) }))
    } else if (removed.length === 1 && added.length === 0) {
      messages.push(format("deselectedItem", { item: getText(removed[0]) }))
    }
    if (mode === "multiple") {
      const all = getAllKeys()
      const isAll = selected.size > 1 && all.every((key) => selected.has(key))
      if (messages.length === 0 || selected.size > 1 || previous.size > 1)
        messages.push(
          isAll
            ? format("selectedAll")
            : format("selectedCount", { count: selected.size })
        )
    }
    announce(messages.join(" "))
    // Only a new selection is announced; the callbacks are read as they are.
  }, [selected])
}

export { useSelectionAnnouncement }
