"use client"

/**
 * Live data (`highlightChanges`), the content's side: what the rows added
 * to `items` look like and do (the root works out which they are, and
 * keeps rows back for a page, `live.ts`). Loaded on demand, as soon as a
 * table with `highlightChanges` mounts (`lazy.ts`): `DataTableContent`
 * renders `DataTableLive` once it is there, and keeps what its rows and
 * the anchor read (`live-bridge.ts`).
 *
 * - Highlight: each added row the view shows takes a tint where it lands,
 *   pinned cells too, over its stripe, hover or selection (`LIVE_STYLES`).
 *   It stays at full strength until the row is seen (half of it in the
 *   scroll area's visible region, on the page shown), and fades over
 *   `duration` from then: a row landing in view fades at once, one landing
 *   out of view, or on another page, keeps its tint until scrolled or paged
 *   to. A row in a closed group, or under a closed tree row, highlights the
 *   row that holds it. A highlight belongs to the row's key, not to an
 *   element: a row that mounts as it scrolls into view (virtualized), or one
 *   recycled for it, shows its state, a fade set on its clock (`syncFlash`).
 *   Rows the search or filters hide are left out.
 * - Out of view: the added rows not seen yet are counted in one button per
 *   edge of the scroll area: "↑ 3 new rows" for those above the view;
 *   "↓ 2 new rows" for those below it on the page, else "3 new rows on
 *   other pages". Pressed, it goes to the topmost row above, the nearest
 *   below, or turns to the first one's page; the row fades once there.
 *   Smoothly to a row rendered near the view (nothing counts as seen until
 *   the scroll ends: the rows it passes stay counted), at once to one
 *   further away or with reduced motion. Pressed from the keyboard (no
 *   pointer, `detail` 0), focus goes to that row, the button going.
 * - The row the user is on never moves (`LiveAnchor`, `createAnchor`): a
 *   change of `items` keeps the row with an open menu or popover, else the
 *   one with focus, else the one under the pointer, else (scrolled into the
 *   rows) the first in view where it was. At the top of the rows and idle,
 *   rows added above push the others down.
 * - Client pages: a row landing on an earlier page would move every row of
 *   the page shown. While the user works in the rows (a menu open, focus or
 *   the pointer in them), such rows are kept back
 *   (`DataTableActions.holdRows`), counted with the other pages', and come
 *   `RELEASE_DELAY` ms after that ends.
 * - The table's status region says how many rows came ("3 rows added"),
 *   at most once a second (`ANNOUNCE_INTERVAL`).
 */
import * as React from "react"
import { ArrowDownIcon } from "lucide-react"

import { Button } from "@tecton/react/button"

import { useTranslations } from "../i18n/translations"
import type { TableGridController } from "../table-grid"
import { useNumberFormat, type DataTableActions } from "./context"
import {
  isGroupClosed,
  type BodyRow,
  type ClosedGroups,
  type DataTableRowModel,
} from "./engine/index"
import type { LiveState } from "./live"
import {
  type Anchor,
  type AnchorSnapshot,
  type LiveBridge,
  type LiveMessage,
} from "./live-bridge"
import { FRAME, scrollParentOf } from "./scroll-parent"

/** The highlight's keyframes. */
const FLASH_ANIMATION = "tecton-live-added"

/**
 * The highlight: a tint of the info colour (the status colour that says
 * nothing is good or bad, and is neither the selection's nor the hover's
 * neutral) over each cell's own fill, held while the row waits to be seen
 * (`data-live-added` empty), then faded from full to none. The tint is a
 * registered property, so the animation fades it; a gradient of it is an
 * image over every cell's background, a pinned cell's opaque one too, so
 * stripes, hover and selection show through. In forced colours, an
 * outline instead, for as long.
 */
const LIVE_STYLES = `@property --tecton-live-tint{syntax:"<color>";inherits:true;initial-value:transparent}
@keyframes ${FLASH_ANIMATION}{0%,20%{--tecton-live-tint:var(--tecton-live-color)}to{--tecton-live-tint:transparent}}
[data-live-added]{--tecton-live-color:color-mix(in oklab,var(--info) 24%,transparent);animation:${FLASH_ANIMATION} var(--tecton-live-duration,1.5s) ease-out}
[data-live-added=""]{--tecton-live-tint:var(--tecton-live-color);animation:none}
[data-live-added]>td,[data-live-added]>th{background-image:linear-gradient(var(--tecton-live-tint),var(--tecton-live-tint))}
@media (forced-colors:active){[data-live-added]{outline:2px solid Highlight;outline-offset:-2px}}`

/**
 * The fade on `row`, set on its clock: a row that mounts, is recycled for
 * another or moved late shows what is left of it, not all of it again.
 */
function syncFlash(row: HTMLElement) {
  const start = Number(row.dataset.liveAdded || NaN)
  if (!Number.isFinite(start) || typeof row.getAnimations !== "function") return
  for (const animation of row.getAnimations())
    if (
      (animation as CSSAnimation).animationName === FLASH_ANIMATION &&
      Math.abs((Number(animation.startTime) || 0) - start) > 1
    )
      animation.startTime = start
}

/** Client pages: after the user stops using the rows, how long rows kept back wait (ms). */
const RELEASE_DELAY = 300
/** The least time between two announcements of added rows (ms). */
const ANNOUNCE_INTERVAL = 1000
/** The longest a button's smooth scroll is waited for, without `scrollend` (ms). */
const GLIDE_LIMIT = 1000

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now()
}

/** The elements of a content's table, as laid out now. */
type Parts = {
  table: HTMLTableElement
  body: HTMLTableSectionElement
  /** Where the rows scroll: the table's container when virtualized, else an ancestor, or the page (`null`). */
  scroller: HTMLElement | null
}

function partsOf(frame: HTMLElement | null, virtualized: boolean) {
  const container = frame?.querySelector<HTMLElement>(`:scope > ${FRAME}`)
  const table = container?.querySelector<HTMLTableElement>(":scope > table")
  const body = table?.querySelector<HTMLTableSectionElement>(
    ':scope > tbody[data-slot="table-body"]'
  )
  if (!container || !table || !body) return null
  return {
    table,
    body,
    scroller: virtualized ? container : scrollParentOf(table),
  } satisfies Parts
}

/**
 * Where the body's rows are seen, in viewport px: the scroll area's
 * client box within the frame, under the header and over a footer.
 * `laidOut` is false without layout (no size: on the server, in tests).
 */
type Region = { top: number; bottom: number; laidOut: boolean }

function regionOf(frame: HTMLElement, parts: Parts): Region {
  const box = frame.getBoundingClientRect()
  let top = box.top
  let bottom = box.bottom
  const { scroller, table } = parts
  if (scroller) {
    const area = scroller.getBoundingClientRect()
    top = Math.max(top, area.top + scroller.clientTop)
    bottom = Math.min(
      bottom,
      area.top + scroller.clientTop + scroller.clientHeight
    )
  } else {
    const view = frame.ownerDocument.defaultView
    top = Math.max(top, 0)
    if (view) bottom = Math.min(bottom, view.innerHeight)
  }
  if (table.tHead)
    top = Math.max(top, table.tHead.getBoundingClientRect().bottom)
  if (table.tFoot)
    bottom = Math.min(bottom, table.tFoot.getBoundingClientRect().top)
  return { top, bottom, laidOut: box.height > 0 }
}

/** Where an added row is: in view, above or below it, or on an earlier or later page. */
type Place = "view" | "above" | "below" | "before" | "after"

/** What places rows: the layout and the model, read once per pass. */
type Placing = {
  region: Region
  /** The rows rendered, by key. */
  rendered: Map<string, HTMLTableRowElement>
  /** The first rendered row's index in the body rows (a virtualized body renders some). */
  firstRendered: number
  model: DataTableRowModel<unknown>
  /** Client pages: rows of other pages are on them. */
  pages: boolean
  indexOf: (key: string) => number
}

function placingOf(
  frame: HTMLElement | null,
  virtualized: boolean,
  model: DataTableRowModel<unknown>,
  pages: boolean,
  indexOf: (key: string) => number
): Placing | null {
  const parts = partsOf(frame, virtualized)
  if (!frame || !parts) return null
  const rendered = new Map<string, HTMLTableRowElement>()
  let firstRendered = Infinity
  for (const row of parts.body.rows) {
    const key = row.dataset.liveKey
    if (key === undefined) continue
    rendered.set(key, row)
    if (firstRendered === Infinity) {
      const index = row.dataset.index
      firstRendered = index === undefined ? 0 : Number(index)
    }
  }
  return {
    region: regionOf(frame, parts),
    rendered,
    firstRendered,
    model,
    pages,
    indexOf,
  }
}

/**
 * Where the row `key` is, or `null` when the view does not show it. A row
 * is in view when its middle is (half of it seen).
 */
function placeOf(key: string, placing: Placing): Place | null {
  const { model, region } = placing
  const at = model.indexOfRow(key)
  if (at < 0) return null
  if (placing.pages) {
    const page = Math.floor(at / model.pageSize) + 1
    if (page !== model.page) return page < model.page ? "before" : "after"
  }
  const element = placing.rendered.get(key)
  if (element) {
    if (!region.laidOut) return "view"
    const box = element.getBoundingClientRect()
    const middle = (box.top + box.bottom) / 2
    return middle < region.top
      ? "above"
      : middle > region.bottom
        ? "below"
        : "view"
  }
  // Not rendered: out of a virtualized body's window.
  return placing.indexOf(key) < placing.firstRendered ? "above" : "below"
}

/**
 * The row that shows an added item: its own, else that of the outermost
 * closed group it is in, or of the nearest tree row shown above it;
 * `null` when the search or filters hide it.
 */
function targetOf(
  id: string,
  model: DataTableRowModel<unknown>,
  closed: ClosedGroups
): string | null {
  if (!model.kept(id)) return null
  if (model.indexOfRow(id) >= 0) return id
  for (const key of model.groupPath(id))
    if (isGroupClosed(closed, key))
      return model.indexOfRow(key) >= 0 ? key : null
  for (
    let parent = model.treeParentOf(id);
    parent !== null;
    parent = model.treeParentOf(parent)
  )
    if (model.indexOfRow(parent) >= 0) return parent
  return null
}

/** An index of the body rows by key, made when first asked for. */
function rowIndexOf(rows: ReadonlyArray<BodyRow<unknown>>) {
  let index: Map<string, number> | undefined
  return (key: string) => {
    if (!index) {
      index = new Map()
      rows.forEach((row, at) => {
        if (!index!.has(row.key)) index!.set(row.key, at)
      })
    }
    return index.get(key) ?? -1
  }
}

function prefersReducedMotion(view: Window | null | undefined) {
  return (
    typeof view?.matchMedia === "function" &&
    view.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Scrolls the rows by `delta` px, in their scroll area or the page; at
 * once unless `smooth`, whatever the page's `scroll-behavior`.
 */
function scrollRowsBy(
  frame: HTMLElement,
  scroller: HTMLElement | null,
  delta: number,
  smooth = false
) {
  ;(scroller ?? frame.ownerDocument.defaultView)?.scrollBy({
    top: delta,
    behavior: smooth ? "smooth" : "instant",
  })
}

/** The first of the rows (in DOM order, top to bottom) whose bottom is past `top`. */
function firstBelow(rows: HTMLCollectionOf<HTMLTableRowElement>, top: number) {
  let low = 0
  let high = rows.length
  while (low < high) {
    const middle = (low + high) >> 1
    const box = rows[middle].getBoundingClientRect()
    // Hidden rows (a detail row's parity row) have no box: look after them.
    if (box.height > 0 && box.bottom > top + 0.5) high = middle
    else low = middle + 1
  }
  return low
}

/** The "new rows" buttons' counts, by where the rows are. */
type Pills = { above: number; below: number; pages: number }

const NO_PILLS: Pills = { above: 0, below: 0, pages: 0 }

type PillKind = keyof Pills

const samePills = (a: Pills, b: Pills) =>
  a.above === b.above && a.below === b.below && a.pages === b.pages

/** Where the buttons go: px from the frame's top and bottom to the scroll area's. */
type Edges = { top: number; bottom: number }

/**
 * Says how many rows were added, at most once every `ANNOUNCE_INTERVAL`:
 * the rows added meanwhile are said together. `key` is new for each, so
 * the same words are read again.
 */
function useLiveAnnouncer(
  setMessage: React.Dispatch<React.SetStateAction<LiveMessage | null>>
) {
  const pending = React.useRef(0)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const last = React.useRef(-Infinity)
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const announce = React.useCallback(
    (count: number) => {
      pending.current += count
      if (timer.current) return
      const wait = Math.max(0, last.current + ANNOUNCE_INTERVAL - Date.now())
      timer.current = setTimeout(() => {
        timer.current = null
        last.current = Date.now()
        const said = pending.current
        pending.current = 0
        setMessage((before) => ({ count: said, key: (before?.key ?? 0) + 1 }))
      }, wait)
    },
    [setMessage]
  )
  return announce
}

type DataTableLiveProps = {
  live: LiveState
  /** What the content's rows and anchor read. */
  bridge: LiveBridge
  /** Says how many rows were added, in the content's status region. */
  onMessage: React.Dispatch<React.SetStateAction<LiveMessage | null>>
  frame: React.RefObject<HTMLDivElement | null>
  virtualized: boolean
  model: DataTableRowModel<unknown>
  /** The body rows rendered (detail rows too); none in the error state. */
  rows: ReadonlyArray<BodyRow<unknown>>
  /** Client pages: added rows may be on other pages. */
  pagination: boolean
  closedGroups: ClosedGroups
  grid: React.RefObject<TableGridController | null>
  actions: DataTableActions<unknown>
}

/** The live module's own state, read by the anchor too. */
type LiveRowsState = {
  /** The added rows not seen yet, by item id. */
  unseen: Set<string>
  /** The batch last handled. */
  handled: LiveState["batch"]
  /** The body row under the pointer; `null` with the pointer off the rows. */
  pointer: HTMLTableRowElement | null
  releaseTimer: ReturnType<typeof setTimeout> | null
  popups: MutationObserver | null
  /** A row to go to once its page shows. */
  pending: { key: string; page: number; focus: boolean } | null
  /** "On other pages" pressed with rows kept back: pressed again once they are in. */
  pressAfter: { focus: boolean } | null
  /** A button's smooth scroll under way: what its end calls (one at a time). */
  glide: (() => void) | null
  timers: Set<ReturnType<typeof setTimeout>>
  frame: number
}

/** Live data for `DataTableContent` (see the module comment). */
function useLiveRows({
  live,
  bridge,
  onMessage,
  frame,
  virtualized,
  model,
  rows,
  pagination,
  closedGroups,
  grid,
  actions,
}: DataTableLiveProps) {
  const flashStore = bridge.flashes
  const indexOf = React.useMemo(() => rowIndexOf(rows), [rows])
  const latest = React.useRef({
    live,
    virtualized,
    model,
    rows,
    pagination,
    closedGroups,
    indexOf,
  })
  React.useInsertionEffect(() => {
    latest.current = {
      live,
      virtualized,
      model,
      rows,
      pagination,
      closedGroups,
      indexOf,
    }
  })

  const [pills, setPills] = React.useState<Pills>(NO_PILLS)
  const [edges, setEdges] = React.useState<Edges>({ top: 0, bottom: 0 })
  const announce = useLiveAnnouncer(onMessage)
  const [state] = React.useState<LiveRowsState>(() => ({
    unseen: new Set(),
    handled: null,
    pointer: null,
    releaseTimer: null,
    popups: null,
    pending: null,
    pressAfter: null,
    glide: null,
    timers: new Set(),
    frame: 0,
  }))

  const placing = React.useCallback(() => {
    const current = latest.current
    return placingOf(
      frame.current,
      current.virtualized,
      current.model,
      current.pagination,
      current.indexOf
    )
  }, [frame])

  const syncFlashes = React.useCallback(() => {
    const body = partsOf(frame.current, latest.current.virtualized)?.body
    if (!body) return
    for (const row of body.querySelectorAll<HTMLElement>(
      ":scope > tr[data-live-added]"
    ))
      syncFlash(row)
  }, [frame])

  /**
   * Highlights the rows `keys`: at full strength until seen (`start`
   * `null`), or fading from `start` for the duration.
   */
  const flash = React.useCallback(
    (keys: ReadonlyArray<string>, start: number | null) => {
      const duration = latest.current.live.duration
      if (keys.length === 0 || duration <= 0) return
      const flashes = new Map(flashStore.get().flashes)
      for (const key of keys) flashes.set(key, start)
      flashStore.set({ flashes })
      if (start === null) return
      const timer = setTimeout(
        () => {
          state.timers.delete(timer)
          const after = new Map(flashStore.get().flashes)
          let changed = false
          for (const key of keys)
            if (after.get(key) === start) changed = after.delete(key) || changed
          if (changed) flashStore.set({ flashes: after })
        },
        Math.max(0, start + duration - now())
      )
      state.timers.add(timer)
      // The rows render with it at once; their animations are set on its
      // clock before the next paint.
      const view = frame.current?.ownerDocument.defaultView
      if (typeof view?.requestAnimationFrame === "function")
        view.requestAnimationFrame(syncFlashes)
    },
    [flashStore, state, frame, syncFlashes]
  )

  /**
   * The rows as they are now: the added rows seen (half in view) stop
   * being counted and start to fade, the others are counted by where they
   * are, and the buttons placed. Nothing is seen during a button's smooth
   * scroll: the rows it passes stay as they were.
   */
  const update = React.useCallback(() => {
    const current = latest.current
    const element = frame.current
    if (!element) {
      setPills((before) => (samePills(before, NO_PILLS) ? before : NO_PILLS))
      return
    }
    const seeing = !state.glide
    // Rows kept back are on earlier pages.
    const counts: Pills = { above: 0, below: 0, pages: current.live.held.size }
    const at = placing()
    for (const id of [...state.unseen]) {
      if (!current.model.has(id)) {
        state.unseen.delete(id)
        continue
      }
      const target = targetOf(id, current.model, current.closedGroups)
      const place = target !== null && at ? placeOf(target, at) : null
      if (place === null) continue
      if (place === "view") {
        if (seeing) state.unseen.delete(id)
      } else if (place === "before" || place === "after") counts.pages++
      else counts[place]++
    }
    // The tints waiting in view start to fade; a row gone stops waiting.
    if (seeing && at) {
      const seen: Array<string> = []
      let gone: Map<string, number | null> | null = null
      for (const [key, start] of flashStore.get().flashes) {
        if (start !== null) continue
        const place = placeOf(key, at)
        if (place === "view") seen.push(key)
        else if (place === null) {
          gone ??= new Map(flashStore.get().flashes)
          gone.delete(key)
        }
      }
      if (gone) flashStore.set({ flashes: gone })
      flash(seen, now())
    }
    setPills((before) => (samePills(before, counts) ? before : counts))
    if (counts.above + counts.below + counts.pages === 0) return
    const parts = partsOf(element, current.virtualized)
    if (!parts) return
    const region = regionOf(element, parts)
    const box = element.getBoundingClientRect()
    const next = region.laidOut
      ? {
          top: Math.max(0, region.top - box.top),
          bottom: Math.max(0, box.bottom - region.bottom),
        }
      : { top: 0, bottom: 0 }
    setEdges((before) =>
      Math.abs(before.top - next.top) < 0.5 &&
      Math.abs(before.bottom - next.bottom) < 0.5
        ? before
        : next
    )
  }, [frame, placing, state, flashStore, flash])

  /**
   * Waits for a button's smooth scroll in `target` to end (`scrollend`, or
   * `GLIDE_LIMIT`), then looks at the rows again.
   */
  const glide = React.useCallback(
    (target: EventTarget) => {
      // The first of the two ends it; a later glide's end is its own.
      const end = () => {
        if (state.glide !== end) return
        state.glide = null
        update()
      }
      state.glide = end
      target.addEventListener("scrollend", end, { once: true })
      setTimeout(end, GLIDE_LIMIT)
    },
    [state, update]
  )

  /** Scrolls to the row `key` (smoothly unless the user prefers reduced motion), or focuses it. */
  const revealRow = React.useCallback(
    (key: string, focus: boolean) => {
      const index = latest.current.indexOf(key)
      const element = frame.current
      if (index < 0 || !element) return
      if (focus) return grid.current?.focusRow(index)
      const parts = partsOf(element, latest.current.virtualized)
      const row = parts
        ? [...parts.body.rows].find((each) => each.dataset.liveKey === key)
        : undefined
      const region = parts ? regionOf(element, parts) : null
      if (parts && row && region?.laidOut) {
        const box = row.getBoundingClientRect()
        const delta =
          box.top < region.top
            ? box.top - region.top
            : box.bottom > region.bottom
              ? box.bottom - region.bottom
              : 0
        if (Math.abs(delta) < 0.5) return
        const view = element.ownerDocument.defaultView
        const smooth = !prefersReducedMotion(view)
        if (smooth && view) glide(parts.scroller ?? view)
        scrollRowsBy(element, parts.scroller, delta, smooth)
        return
      }
      grid.current?.scrollToIndex(index)
    },
    [frame, grid, glide]
  )

  /**
   * Goes to the new rows `kind` counts: the topmost above, the nearest
   * below, or the first one on another page (turned to).
   */
  const goTo = React.useCallback(
    (kind: PillKind, focus: boolean) => {
      const { model, closedGroups } = latest.current
      const at = placing()
      let first: string | null = null
      let firstIndex = Infinity
      for (const id of state.unseen) {
        const target = targetOf(id, model, closedGroups)
        const place = target !== null && at ? placeOf(target, at) : null
        const of = place === "before" || place === "after" ? "pages" : place
        const index = target === null ? -1 : model.indexOfRow(target)
        if (of === kind && index >= 0 && index < firstIndex) {
          first = target
          firstIndex = index
        }
      }
      if (first === null) return
      const page = Math.floor(firstIndex / model.pageSize) + 1
      if (kind === "pages" && page !== model.page) {
        state.pending = { key: first, page, focus }
        actions.setPage(page, "new-rows")
      } else revealRow(first, focus)
    },
    [placing, state, actions, revealRow]
  )

  /** Whether the user is using the rows: a row's popup open, focus or the pointer in them. */
  const interacting = React.useCallback(() => {
    const body = partsOf(frame.current, latest.current.virtualized)?.body
    return !!body && rowsInUse(body, state.pointer).some(Boolean)
  }, [frame, state])

  const stopWatching = React.useCallback(() => {
    if (state.releaseTimer) clearTimeout(state.releaseTimer)
    state.releaseTimer = null
    state.popups?.disconnect()
    state.popups = null
  }, [state])

  /**
   * Client pages: adds the rows kept back `RELEASE_DELAY` after the user
   * stops using the rows (`holding`: rows are being kept back now, not
   * rendered as such yet).
   */
  const scheduleRelease = React.useCallback(
    (holding = false) => {
      if (!holding && latest.current.live.held.size === 0) return
      if (state.releaseTimer) clearTimeout(state.releaseTimer)
      state.releaseTimer = setTimeout(() => {
        state.releaseTimer = null
        if (latest.current.live.held.size === 0) return
        if (!interacting()) {
          stopWatching()
          actions.releaseRows()
          return
        }
        // A row's menu or popover open, focus elsewhere: once it closes.
        const body = partsOf(frame.current, latest.current.virtualized)?.body
        if (!state.popups && body && typeof MutationObserver !== "undefined") {
          state.popups = new MutationObserver(() => scheduleRelease())
          state.popups.observe(body, {
            subtree: true,
            attributes: true,
            attributeFilter: ["aria-expanded"],
          })
        }
      }, RELEASE_DELAY)
    },
    [state, interacting, stopWatching, actions, frame]
  )

  // The user's use of the rows: the row under the pointer, focus leaving.
  React.useEffect(() => {
    const element = frame.current
    if (!element) return
    const over = (event: PointerEvent) => {
      const body = partsOf(element, latest.current.virtualized)?.body
      const target = event.target
      state.pointer =
        target instanceof Element && body?.contains(target)
          ? target.closest<HTMLTableRowElement>("tr[data-live-key]")
          : null
      if (!state.pointer) scheduleRelease()
    }
    const leave = () => {
      state.pointer = null
      scheduleRelease()
    }
    const focusOut = () => scheduleRelease()
    element.addEventListener("pointerover", over)
    element.addEventListener("pointerleave", leave)
    element.addEventListener("focusout", focusOut)
    return () => {
      element.removeEventListener("pointerover", over)
      element.removeEventListener("pointerleave", leave)
      element.removeEventListener("focusout", focusOut)
      state.pointer = null
    }
  }, [frame, state, scheduleRelease])

  // Scrolling and resizing: the counts, the buttons' place, and the
  // highlights of rows scrolled into view. Where the rows scroll is known
  // once they are laid out, and may change (a table growing taller than
  // its parent): looked at after each render.
  const listening = React.useRef<{
    target: EventTarget
    stop: () => void
  } | null>(null)
  React.useLayoutEffect(() => {
    const element = frame.current
    const view = element?.ownerDocument.defaultView
    const parts = partsOf(element, virtualized)
    const target = parts ? (parts.scroller ?? view ?? null) : null
    if (listening.current?.target === target) return
    listening.current?.stop()
    listening.current = null
    if (!target || !view) return
    const changed = () => {
      if (state.frame || typeof view.requestAnimationFrame !== "function")
        return
      state.frame = view.requestAnimationFrame(() => {
        state.frame = 0
        syncFlashes()
        update()
      })
    }
    target.addEventListener("scroll", changed, { passive: true })
    view.addEventListener("resize", changed)
    listening.current = {
      target,
      stop: () => {
        target.removeEventListener("scroll", changed)
        view.removeEventListener("resize", changed)
        if (state.frame) view.cancelAnimationFrame(state.frame)
        state.frame = 0
      },
    }
  })
  React.useEffect(
    () => () => {
      listening.current?.stop()
      listening.current = null
    },
    []
  )

  // Gone (live data off, the table unmounted): nothing left running or
  // highlighted.
  React.useEffect(
    () => () => {
      stopWatching()
      state.glide = null
      for (const timer of state.timers) clearTimeout(timer)
      state.timers.clear()
      state.unseen.clear()
      flashStore.set({ flashes: new Map() })
    },
    [state, stopWatching, flashStore]
  )

  // After each render: a new batch of rows, a page turned to for one, the
  // counts and fades.
  React.useLayoutEffect(() => {
    const { batch } = live
    if (batch && batch !== state.handled) {
      state.handled = batch
      const at = placing()
      const added = new Set(batch.ids)
      const byTarget = new Map<string, Array<string>>()
      let announced = 0
      for (const id of batch.ids) {
        const target = targetOf(id, model, closedGroups)
        if (target === null) continue
        if (!batch.released.has(id)) announced++
        const ids = byTarget.get(target)
        if (ids) ids.push(id)
        else byTarget.set(target, [id])
      }
      const using = pagination && interacting()
      const hold: Array<string> = []
      const keys: Array<string> = []
      for (const [target, ids] of byTarget) {
        // A row of its own (or a group it makes) landing on an earlier
        // page moves the page's rows: kept back while in use.
        const own =
          added.has(target) ||
          (!model.has(target) &&
            model.groupIds(target).every((id) => added.has(id)))
        if (using && own && at && placeOf(target, at) === "before") {
          hold.push(...ids)
          continue
        }
        keys.push(target)
        // The groups the row made, new with it, are new too.
        if (added.has(target))
          for (const key of model.groupPath(target))
            if (
              !byTarget.has(key) &&
              model.groupIds(key).every((id) => added.has(id))
            )
              keys.push(key)
        for (const id of ids) state.unseen.add(id)
      }
      if (announced > 0) announce(announced)
      // All wait to be seen; those in view are, below (`update`).
      flash(keys, null)
      if (hold.length) {
        actions.holdRows(hold)
        // Added once the user is done: the pointer and focus say when, a
        // row's menu or popover is watched until it closes.
        scheduleRelease(true)
      }
    }
    const pending = state.pending
    if (pending && model.page === pending.page) {
      state.pending = null
      revealRow(pending.key, pending.focus)
    }
    // Nothing kept back any more (added, or removed by the application),
    // and none just asked for: nothing to watch.
    if (live.held.size === 0 && !state.releaseTimer) stopWatching()
    syncFlashes()
    update()
    const press = state.pressAfter
    if (press && live.held.size === 0) {
      state.pressAfter = null
      goTo("pages", press.focus)
    }
  })

  const pressed = React.useCallback(
    (kind: PillKind, event: React.MouseEvent) => {
      // A click from the keyboard (or a screen reader) has no detail: focus
      // follows to the row, the button going.
      const focus = event.detail === 0
      if (kind === "pages" && latest.current.live.held.size > 0) {
        stopWatching()
        state.pressAfter = { focus }
        actions.releaseRows()
        return
      }
      goTo(kind, focus)
    },
    [actions, goTo, state, stopWatching]
  )

  // The content's anchor keeps the row the user is on still while this is here.
  React.useLayoutEffect(() => {
    bridge.anchor = createAnchor(frame, latest, state)
    return () => {
      bridge.anchor = null
    }
  }, [bridge, frame, state])

  return { pills, edges, pressed }
}

/** A keyed body row: the row of `node`, if it is one of `body`'s. */
function rowOf(body: HTMLTableSectionElement, node: Element | null) {
  const row = node?.closest<HTMLTableRowElement>("tr[data-live-key]")
  return row?.parentElement === body ? row : null
}

/** The rows in use: the one whose menu or popover is open, the one with focus, the one under the pointer. */
function rowsInUse(body: HTMLTableSectionElement, pointer: Element | null) {
  return [
    rowOf(body, body.querySelector('[aria-haspopup][aria-expanded="true"]')),
    rowOf(body, body.ownerDocument.activeElement),
    rowOf(body, pointer),
  ]
}

/**
 * The row the user is on, which a change of the items keeps still: the
 * row whose menu or popover is open, else the one with focus, else the
 * one under the pointer (each while any of it is in view), else, scrolled
 * into the rows, the first in view. `null` at the top of the rows and
 * idle: rows added above push the others down.
 */
function anchorRow(parts: Parts, region: Region, pointer: Element | null) {
  const { body } = parts
  for (const row of rowsInUse(body, pointer)) {
    const box = row?.getBoundingClientRect()
    // Any of it in view.
    if (box && box.bottom > region.top + 0.5 && box.top < region.bottom - 0.5)
      return row
  }
  if (body.getBoundingClientRect().top >= region.top - 0.5) return null
  return body.rows[firstBelow(body.rows, region.top)] ?? null
}

/** A content's `Anchor` (see `LiveAnchor`). */
function createAnchor(
  frame: React.RefObject<HTMLDivElement | null>,
  latest: React.RefObject<{
    virtualized: boolean
    indexOf: (key: string) => number
  }>,
  state: LiveRowsState
): Anchor {
  return {
    capture() {
      const element = frame.current
      const parts = partsOf(element, latest.current.virtualized)
      if (!element || !parts) return null
      const region = regionOf(element, parts)
      if (!region.laidOut) return null
      const anchor = anchorRow(parts, region, state.pointer)
      if (!anchor) return null
      // The anchor, and the next rows in case it goes.
      const { rows } = parts.body
      const kept: AnchorSnapshot["rows"] = []
      let height = 0
      for (
        let at = Array.prototype.indexOf.call(rows, anchor);
        at >= 0 && at < rows.length && kept.length < 3;
        at++
      ) {
        const row = rows[at]
        const key = row.dataset.liveKey
        if (key === undefined) continue
        const box = row.getBoundingClientRect()
        if (!height) height = box.height
        kept.push({ key, top: box.top, index: latest.current.indexOf(key) })
      }
      return kept.length
        ? { rows: kept, height, scroller: parts.scroller }
        : null
    },
    restore(snapshot) {
      const element = frame.current
      const parts = partsOf(element, latest.current.virtualized)
      if (!element || !parts) return
      const rendered = new Map<string, HTMLTableRowElement>()
      for (const row of parts.body.rows) {
        const key = row.dataset.liveKey
        if (key !== undefined) rendered.set(key, row)
      }
      for (const { key, top, index } of snapshot.rows) {
        const row = rendered.get(key)
        if (row) {
          scrollRowsBy(
            element,
            snapshot.scroller,
            row.getBoundingClientRect().top - top
          )
          return
        }
        // Out of a virtualized body's window now: moved by its rows.
        const now = latest.current.indexOf(key)
        if (now >= 0 && index >= 0) {
          scrollRowsBy(
            element,
            snapshot.scroller,
            (now - index) * snapshot.height
          )
          return
        }
      }
    },
  }
}

/** A button's content: what it counts, kept while it goes so its text stays. */
type Shown = { kind: PillKind; count: number }

/** `value`, or the last one while it is `null`. */
function useLast(value: Shown | null, initial: PillKind): Shown {
  const [last, setLast] = React.useState<Shown>(
    value ?? { kind: initial, count: 0 }
  )
  if (value && (value.kind !== last.kind || value.count !== last.count))
    setLast(value)
  return value ?? last
}

/**
 * The "new rows" buttons, one over each edge of the scroll area: above
 * the view's rows at the top; below them, else on other pages, at the
 * bottom. Real buttons, in the tab order after the table while shown;
 * nothing moves focus to them. They look and move as the message
 * scroller's (`message-scroller.tsx`'s `MessageScrollerButton`, whose
 * class list this is): mounted throughout, shown and hidden by
 * `data-active`, inert while hidden.
 */
function DataTableNewRows({
  pills,
  edges,
  onPress,
}: {
  pills: Pills
  edges: Edges
  onPress: (kind: PillKind, event: React.MouseEvent) => void
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const top = useLast(
    pills.above > 0 ? { kind: "above", count: pills.above } : null,
    "above"
  )
  const bottom = useLast(
    pills.below > 0
      ? { kind: "below", count: pills.below }
      : pills.pages > 0
        ? { kind: "pages", count: pills.pages }
        : null,
    "below"
  )
  const button = (side: "top" | "bottom", { kind, count }: Shown) => {
    const active = pills[kind] > 0
    const values = { count, total: format.format(count) }
    const label =
      kind === "above"
        ? t("newRowsAbove", values)
        : kind === "below"
          ? t("newRowsBelow", values)
          : t("newRowsOnOtherPages", values)
    return (
      <div
        data-slot="data-table-new-rows"
        data-edge={side}
        className="absolute inset-x-0 z-30 h-0"
        style={side === "top" ? { top: edges.top } : { bottom: edges.bottom }}
      >
        <Button
          variant="secondary"
          size="sm"
          data-kind={kind}
          data-direction={side === "top" ? "start" : "end"}
          data-active={active}
          aria-label={label}
          tabIndex={active ? undefined : -1}
          inert={!active}
          // `MessageScrollerButton`'s, and no transition with reduced motion.
          className="absolute inset-s-1/2 -translate-x-1/2 rounded-full border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full motion-reduce:transition-none rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180"
          onClick={(event) => onPress(kind, event)}
        >
          {kind !== "pages" && (
            <ArrowDownIcon data-icon="inline-start" aria-hidden />
          )}
          {kind === "pages" ? label : t("newRows", values)}
        </Button>
      </div>
    )
  }
  return (
    <>
      {button("top", top)}
      {button("bottom", bottom)}
    </>
  )
}

/** The highlight's rules, in the document head once (a hoistable style). */
function LiveStyles() {
  return (
    <style href="tecton-data-table-live" precedence="tecton">
      {LIVE_STYLES}
    </style>
  )
}

/**
 * Live data in a `DataTableContent` (see the module comment): rendered in
 * its frame, after the table, while the table has `highlightChanges`.
 */
function DataTableLive(props: DataTableLiveProps) {
  const { pills, edges, pressed } = useLiveRows(props)
  return (
    <>
      <LiveStyles />
      <DataTableNewRows pills={pills} edges={edges} onPress={pressed} />
    </>
  )
}

export { ANNOUNCE_INTERVAL, DataTableLive, RELEASE_DELAY }
export type { DataTableLiveProps }
