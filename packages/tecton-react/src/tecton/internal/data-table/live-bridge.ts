"use client"

/**
 * Live data (`highlightChanges`) in `DataTableContent`: what the content
 * and its rows hold while the live module (`live-rows.tsx`, loaded on
 * demand once a table has `highlightChanges`) does the rest.
 *
 * - The rows highlighted, by key, with when each highlight started: a
 *   store the rows read (`useLiveRowProps`), which the live module writes.
 *   A row renders its key (`data-live-key`, how the module finds it) and,
 *   while highlighted, `data-live-added`, which the highlight's CSS
 *   animation runs on; `syncFlash` sets that animation on the
 *   highlight's clock.
 * - `LiveAnchor` around the table: keeps the rows in view still across a
 *   change of the items, through the module's `Anchor` once it is there.
 */
import * as React from "react"

import { createStore, useStore, type Store } from "../store"

/** The rows highlighted, by row key: when each highlight started (`performance.now()`). */
type FlashState = { readonly flashes: ReadonlyMap<string, number> }
type FlashStore = Store<FlashState>

const NO_FLASHES: FlashStore = createStore<FlashState>({ flashes: new Map() })

/** The highlight's keyframes (`live-rows.tsx`). */
const FLASH_ANIMATION = "tecton-live-added"

/**
 * A row's live attributes (`store` is the table's while live data is on):
 * its key, which the live module finds it by, and its highlight's start.
 */
function useLiveRowProps(store: FlashStore | null, key: string) {
  const start = useStore(store ?? NO_FLASHES, (state) => state.flashes.get(key))
  if (!store) return undefined
  return {
    "data-live-key": key,
    "data-live-added": start === undefined ? undefined : String(start),
  }
}

/**
 * The highlight's animation on `row`, set on its highlight's clock: a row
 * that mounts, is recycled for another or moved late shows what is left
 * of it, not all of it again.
 */
function syncFlash(row: HTMLElement) {
  const start = Number(row.dataset.liveAdded)
  if (!Number.isFinite(start) || typeof row.getAnimations !== "function") return
  for (const animation of row.getAnimations())
    if (
      (animation as CSSAnimation).animationName === FLASH_ANIMATION &&
      Math.abs((Number(animation.startTime) || 0) - start) > 1
    )
      animation.startTime = start
}

/** The first row in view, and the ones after it, where they were. */
type AnchorSnapshot = {
  rows: Array<{ key: string; top: number; index: number }>
  height: number
  scroller: HTMLElement | null
}

/** What `LiveAnchor` asks of the live module: the rows in view before a change, and after. */
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
 * Keeps the rows in view where they are across a change of the items
 * (`itemsKey`): the first row in view (or, gone, one of the next) is
 * found before the change is applied to the DOM and put back where it was
 * once it is, before the browser paints, by scrolling the rows' scroll
 * area (`Anchor`, the live module's). Only once the user has scrolled into
 * the rows: at their top, rows added above the first come into view and
 * move the others down.
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

export {
  createLiveBridge,
  FLASH_ANIMATION,
  LiveAnchor,
  syncFlash,
  useLiveRowProps,
}
export type {
  Anchor,
  AnchorSnapshot,
  FlashState,
  FlashStore,
  LiveBridge,
  LiveMessage,
}
