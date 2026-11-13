"use client"

/**
 * Live data (`highlightChanges`) in `DataTableContent`: what the content
 * and its rows hold while the live module (`live-rows.tsx`, loaded on
 * demand once a table has `highlightChanges`) does the rest.
 *
 * - The rows highlighted, by key, with when each highlight started to
 *   fade, or `null` while it waits to be seen: a store the rows read
 *   (`useLiveRowProps`), which the live module writes. A row renders its
 *   key (`data-live-key`, how the module finds it) and, while highlighted,
 *   `data-live-added`: empty while the tint waits at full strength, else
 *   the fade's start, which its CSS animation runs on (the live module
 *   sets it on that clock).
 * - `LiveAnchor` around the table: keeps the row the user is on still
 *   across a change of the items, through the module's `Anchor` once it
 *   is there.
 */
import * as React from "react"

import { createStore, useStore, type Store } from "../store"

/**
 * The rows highlighted, by row key: when each highlight started to fade
 * (`performance.now()`), or `null` while it waits to be seen.
 */
type FlashState = { readonly flashes: ReadonlyMap<string, number | null> }
type FlashStore = Store<FlashState>

const NO_FLASHES: FlashStore = createStore<FlashState>({ flashes: new Map() })

/**
 * A row's live attributes (`store` is the table's while live data is on):
 * its key, which the live module finds it by, and its highlight's start.
 */
function useLiveRowProps(store: FlashStore | null, key: string) {
  const start = useStore(store ?? NO_FLASHES, (state) => state.flashes.get(key))
  if (!store) return undefined
  return {
    "data-live-key": key,
    "data-live-added":
      start === undefined ? undefined : start === null ? "" : String(start),
  }
}

/** The anchor row, and the ones after it (in case it goes), where they were. */
type AnchorSnapshot = {
  rows: Array<{ key: string; top: number; index: number }>
  height: number
  scroller: HTMLElement | null
}

/** What `LiveAnchor` asks of the live module: the anchor row before a change, and after. */
type Anchor = {
  capture: () => AnchorSnapshot | null
  restore: (snapshot: AnchorSnapshot) => void
}

/** How many rows were added, for the content's status region; a new `key` each time. */
type LiveMessage = { readonly count: number; readonly key: number }

/** What a content shares with its live module. */
type LiveBridge = {
  /** The highlights its rows render. */
  flashes: FlashStore
  /** Set by the live module while it is mounted. */
  anchor: Anchor | null
}

function createLiveBridge(): LiveBridge {
  return {
    flashes: createStore<FlashState>({ flashes: new Map() }),
    anchor: null,
  }
}

/**
 * Keeps the row the user is on where it is across a change of the items
 * (`itemsKey`): the anchor row (or, gone, one of the next) is found before
 * the change is applied to the DOM and put back where it was once it is,
 * before the browser paints, by scrolling the rows' scroll area (`Anchor`,
 * the live module's, which picks the row).
 */
class LiveAnchor extends React.Component<{
  itemsKey: unknown
  bridge: LiveBridge | null
  children: React.ReactNode
}> {
  getSnapshotBeforeUpdate(previous: Readonly<{ itemsKey: unknown }>) {
    const anchor = this.props.bridge?.anchor
    return anchor && previous.itemsKey !== this.props.itemsKey
      ? anchor.capture()
      : null
  }

  componentDidUpdate(
    _props: unknown,
    _state: unknown,
    snapshot: AnchorSnapshot | null
  ) {
    if (snapshot) this.props.bridge?.anchor?.restore(snapshot)
  }

  render() {
    return this.props.children
  }
}

export { createLiveBridge, LiveAnchor, useLiveRowProps }
export type {
  Anchor,
  AnchorSnapshot,
  FlashState,
  FlashStore,
  LiveBridge,
  LiveMessage,
}
