"use client"

import * as React from "react"

import { useDirection } from "@tecton/react/tecton/provider"

import { edgeKey, nextKey, useTypeahead } from "../navigation"
import { usePrimitive, type PrimitiveProps } from "../render"
import { useRovingFocus } from "../roving-focus"
import { useSelectionAnnouncement } from "../selection-announcement"
import {
  ChipListContext,
  ChipRootContext,
  useRequired,
  type ChipItem,
  type ChipListContextValue,
} from "./context"

type ChipListState = { empty: boolean }

type ChipListProps = PrimitiveProps<"div", ChipListState> & {
  /** Rendered in place of the chips when there are none. */
  empty?: React.ReactNode
}

const isPlatformMac = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform)

/**
 * The chips: a grid with one tab stop, moved through with the arrow keys
 * (in the reading direction), Home and End, and type-ahead. Space or Enter
 * selects, Ctrl/Cmd+A selects all, Escape clears, Delete or Backspace
 * removes. Chips are ordered as they are in the DOM.
 */
function ChipList({ empty, children, ...props }: ChipListProps) {
  const root = useRequired(ChipRootContext, "ChipList", "ChipGroup")
  const rtl = useDirection() === "rtl"
  const items = React.useRef(new Map<string, ChipItem>())
  const element = React.useRef<HTMLDivElement | null>(null)

  /** The chips' values in DOM order. */
  const order = React.useCallback(() => {
    const entries = [...items.current]
    entries.sort(([, a], [, b]) =>
      a.element.compareDocumentPosition(b.element) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
    )
    return entries.map(([value]) => value)
  }, [])
  const isDisabled = (value: string) =>
    root.disabled || !!items.current.get(value)?.disabled
  React.useLayoutEffect(() => {
    root.collection.current = {
      order,
      isDisabled: (value) => !!items.current.get(value)?.disabled,
    }
  }, [root.collection, order])

  const focus = useRovingFocus({
    getElement: (value) => items.current.get(value)?.element,
  })

  /** Puts the tab stop on the focused chip, or the first enabled one. */
  const updateTabStop = React.useCallback(() => {
    const keys = order()
    const { focused } = focus.store.get()
    const tabStop =
      focused !== null && keys.includes(focused)
        ? focused
        : (edgeKey(keys, 1, (v) => !!items.current.get(v)?.disabled) ??
          (keys.length > 0 ? keys[0] : null))
    focus.store.set({ tabStop })
  }, [focus, order])

  const restore = React.useRef<number | null>(null)
  const context = React.useMemo<ChipListContextValue>(
    () => ({
      focus,
      register(value, item) {
        items.current.set(value, item)
        return () => {
          if (items.current.get(value) !== item) return
          const index = order().indexOf(value)
          items.current.delete(value)
          // The focused chip went (removed): its neighbour takes focus.
          if (focus.store.get().focused === value) restore.current = index
          queueMicrotask(() => {
            updateTabStop()
            const at = restore.current
            restore.current = null
            if (at === null) return
            const doc = element.current?.ownerDocument
            const active = doc?.activeElement
            // Focus moved on already (the owner focused something else).
            if (
              active &&
              active !== doc.body &&
              !element.current?.contains(active)
            )
              return
            const keys = order()
            const next = keys.at(Math.min(at, keys.length - 1))
            if (next !== undefined) focus.focus(next)
          })
        }
      },
    }),
    [focus, order, updateTabStop]
  )
  React.useLayoutEffect(updateTabStop)

  const typeahead = useTypeahead({
    getKeys: order,
    getText: (value) => items.current.get(value)?.textValue ?? value,
    isDisabled,
    getFocused: () => focus.store.get().focused,
    onMatch: (value) => focus.focus(value),
  })

  useSelectionAnnouncement({
    selected: root.selection.selected,
    mode: root.selection.mode,
    behavior: "toggle",
    hasFocus: () =>
      !!element.current?.contains(element.current.ownerDocument.activeElement),
    getText: (value) => items.current.get(value)?.textValue ?? value,
    getAllKeys: () => order().filter((v) => !isDisabled(v)),
  })

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest('[role="row"]')
    const value = [...items.current].find(([, i]) => i.element === row)?.[0]
    if (value === undefined) return
    const keys = order()
    const move = (to: string | null) => {
      event.preventDefault()
      if (to !== null) focus.focus(to)
    }
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const backward = rtl ? "ArrowRight" : "ArrowLeft"
    const { selection } = root
    const mod = isPlatformMac() ? event.metaKey : event.ctrlKey
    switch (event.key) {
      case forward:
      case "ArrowDown":
        return move(nextKey(keys, value, 1, isDisabled))
      case backward:
      case "ArrowUp":
        return move(nextKey(keys, value, -1, isDisabled))
      case "Home":
        return move(edgeKey(keys, 1, isDisabled))
      case "End":
        return move(edgeKey(keys, -1, isDisabled))
      case " ":
      case "Enter":
        if (event.key === " " && typeahead(event)) return
        event.preventDefault()
        selection.select(value, { event, reason: "keyboard" })
        return
      case "Escape":
        if (selection.selected.size && selection.mode !== "none") {
          event.preventDefault()
          selection.clear(event)
        }
        return
      case "Delete":
      case "Backspace": {
        if (!root.removable || isDisabled(value)) return
        event.preventDefault()
        const values = selection.isSelected(value)
          ? keys.filter((v) => selection.isSelected(v))
          : [value]
        root.remove(values, "keyboard", event)
        return
      }
      default:
        if (
          mod &&
          event.key.toLowerCase() === "a" &&
          selection.mode === "multiple"
        ) {
          event.preventDefault()
          selection.selectAll(event)
          return
        }
        typeahead(event)
    }
  }

  const isEmpty = React.Children.count(children) === 0
  const rendered = usePrimitive(
    "div",
    props,
    { empty: isEmpty },
    {
      ref: element,
      role: isEmpty ? "group" : "grid",
      ...root.labelling,
      "aria-multiselectable":
        !isEmpty && root.selection.mode === "multiple" ? true : undefined,
      onKeyDown,
      children: isEmpty ? empty : children,
    }
  )
  return <ChipListContext value={context}>{rendered}</ChipListContext>
}

export { ChipList }
export type { ChipListProps, ChipListState }
