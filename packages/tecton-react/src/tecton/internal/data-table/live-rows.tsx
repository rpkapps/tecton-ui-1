"use client"

/**
 * Live data (`highlightChanges`), the content's side: what the rows added
 * to `items` look like and do (the root works out which they are and holds
 * rows back, `live.ts`). Loaded on demand, as soon as a table with
 * `highlightChanges` mounts (`lazy.ts`): `DataTableContent` renders
 * `DataTableLive` once it is there, and keeps what its rows and the
 * anchor read (`live-bridge.ts`).
 *
 * - Highlight: each added row the view shows takes a tint that fades out
 *   over `duration` where it lands, pinned cells too, over its stripe,
 *   hover or selection (`LIVE_STYLES`: a CSS animation of the tint, run by
 *   the row's `data-live-added`). A row in a closed group, or under a
 *   closed tree row, highlights the row that holds it. A highlight belongs
 *   to the row's id and the time it started, not to an element: a row that
 *   scrolls into view (a virtualized row mounting, or one recycled for it)
 *   shows what is left of it, set on the animation's clock
 *   (`syncFlash`). Rows the search or filters hide are left out.
 * - Out of view: the added rows above the visible rows, below them, or on
 *   other pages are counted in a button at the matching edge of the scroll
 *   area ("↑ 3 new rows", "↓ 2 new rows", "3 new rows on other pages"),
 *   until each has been seen (half of it in view) or the button pressed:
 *   it scrolls to the first of them (smoothly to a row rendered near the
 *   view, at once to one further away or with reduced motion), or turns to
 *   its page, and highlights them again. Pressed from the keyboard (no
 *   pointer, `detail` 0), focus goes to that row, the button being gone.
 * - Rows in view stay where they are. Scrolled into the rows, a change of
 *   `items` keeps the first row in view where it was (`LiveAnchor`):
 *   rows added above it go above the view. While the user points at the
 *   rows (or a "new rows" button), has focus in them, or has a row's menu
 *   or popover open, the rows that would show in the view (even cut by its
 *   edge) or land on an earlier page (moving the page's rows) are held
 *   back (`DataTableActions.holdRows`) and counted ("Show 2 new rows");
 *   they come `RELEASE_DELAY` ms after that ends, or when the button is
 *   pressed. Removals and changes are never held.
 * - The table's status region says how many rows came ("3 rows added"),
 *   at most once a second (`ANNOUNCE_INTERVAL`).
 */
import * as React from "react"
import { cn } from "cn"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

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
 * neutral) over each cell's own fill, from full to none. The tint is a
 * registered property, so the animation fades it; a gradient of it is an
 * image over every cell's background, a pinned cell's opaque one too, so
 * stripes, hover and selection show through. In forced colours, an
 * outline instead.
 */
const LIVE_STYLES = `@property --tecton-live-tint{syntax:"<color>";inherits:true;initial-value:transparent}
@keyframes ${FLASH_ANIMATION}{0%,20%{--tecton-live-tint:var(--tecton-live-color)}to{--tecton-live-tint:transparent}}
[data-live-added]{--tecton-live-color:color-mix(in oklab,var(--info) 24%,transparent);animation:${FLASH_ANIMATION} var(--tecton-live-duration,1.5s) ease-out}
[data-live-added]>td,[data-live-added]>th{background-image:linear-gradient(var(--tecton-live-tint),var(--tecton-live-tint))}
@media (forced-colors:active){[data-live-added]{outline:2px solid Highlight;outline-offset:-2px}}`

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

/** After the user stops using the rows, how long held rows wait to show (ms). */
const RELEASE_DELAY = 300
/** The least time between two announcements of added rows (ms). */
const ANNOUNCE_INTERVAL = 1000

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
 * Whether the new row `key`, where it landed, moved rows the user sees:
 * any of it in view (the rows after it went down, a row cut by the edge
 * too), or on an earlier page (the page's rows moved on).
 */
function movesView(key: string, place: Place | null, placing: Placing) {
  if (place === "before" || place === "view") return true
  if (place === "after" || place === null) return false
  const element = placing.rendered.get(key)
  if (!element) return false
  const box = element.getBoundingClientRect()
  return (
    box.top < placing.region.bottom - 0.5 &&
    box.bottom > placing.region.top + 0.5
  )
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

/** Scrolls the rows by `delta` px, in their scroll area or the page. */
function scrollRowsBy(
  frame: HTMLElement,
  scroller: HTMLElement | null,
  delta: number,
  behavior: ScrollBehavior = "auto"
) {
  if (Math.abs(delta) < 0.5) return
  if (scroller) {
    if (behavior === "smooth" && typeof scroller.scrollBy === "function")
      scroller.scrollBy({ top: delta, behavior })
    else scroller.scrollTop += delta
    return
  }
  const view = frame.ownerDocument.defaultView
  if (typeof view?.scrollBy === "function")
    view.scrollBy({ top: delta, behavior })
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
type Pills = {
  above: number
  below: number
  pages: number
  held: number
}

const NO_PILLS: Pills = { above: 0, below: 0, pages: 0, held: 0 }

type PillKind = keyof Pills

function samePills(a: Pills, b: Pills) {
  return (
    a.above === b.above &&
    a.below === b.below &&
    a.pages === b.pages &&
    a.held === b.held
  )
}

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
  const [state] = React.useState(() => ({
    /** The added rows not seen yet, by item id. */
    unseen: new Set<string>(),
    /** The batch last handled. */
    handled: null as LiveState["batch"],
    /** Pointer over the rows or a "new rows" button; focus in either. */
    pointer: false,
    focus: false,
    releaseTimer: null as ReturnType<typeof setTimeout> | null,
    popups: null as MutationObserver | null,
    /** "Show N new rows" pressed: the rows it brings are revealed. */
    revealing: null as { focus: boolean } | null,
    /** A row to reveal once its page shows. */
    pending: null as { key: string; page: number; focus: boolean } | null,
    timers: new Set<ReturnType<typeof setTimeout>>(),
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

  /** Highlights the rows `keys` from `start`, for the duration. */
  const flash = React.useCallback(
    (keys: ReadonlyArray<string>, start: number) => {
      const duration = latest.current.live.duration
      if (keys.length === 0 || duration <= 0) return
      const flashes = new Map(flashStore.get().flashes)
      for (const key of keys) flashes.set(key, start)
      flashStore.set({ flashes })
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

  /** The "new rows" counts and where they go, as the rows are now. */
  const update = React.useCallback(() => {
    const current = latest.current
    const held = current.live.held.size
    const element = frame.current
    if (!element) {
      setPills((before) => (samePills(before, NO_PILLS) ? before : NO_PILLS))
      return
    }
    const counts: Pills = { above: 0, below: 0, pages: 0, held }
    const at = state.unseen.size > 0 ? placing() : null
    for (const id of [...state.unseen]) {
      if (!current.model.has(id)) {
        state.unseen.delete(id)
        continue
      }
      const target = targetOf(id, current.model, current.closedGroups)
      const place = target !== null && at ? placeOf(target, at) : null
      if (place === null) continue
      if (place === "view") state.unseen.delete(id)
      else if (place === "before" || place === "after") counts.pages++
      else counts[place]++
    }
    setPills((before) => (samePills(before, counts) ? before : counts))
    if (counts.above + counts.below + counts.pages + counts.held === 0) return
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
  }, [frame, placing, state])

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
        const view = element.ownerDocument.defaultView
        scrollRowsBy(
          element,
          parts.scroller,
          delta,
          prefersReducedMotion(view) ? "auto" : "smooth"
        )
        return
      }
      grid.current?.scrollToIndex(index)
    },
    [frame, grid]
  )

  /** Goes to the first of `keys` (on its page, scrolled to), and highlights them all again. */
  const reveal = React.useCallback(
    (keys: ReadonlyArray<string>, focus: boolean) => {
      const { model } = latest.current
      const sorted = [...keys]
        .filter((key) => model.indexOfRow(key) >= 0)
        .sort((a, b) => model.indexOfRow(a) - model.indexOfRow(b))
      if (sorted.length === 0) return
      const first = sorted[0]
      flash(sorted, now())
      const pages = latest.current.pagination
      const page = Math.floor(model.indexOfRow(first) / model.pageSize) + 1
      if (pages && page !== model.page) {
        state.pending = { key: first, page, focus }
        actions.setPage(page, "new-rows")
      } else revealRow(first, focus)
    },
    [flash, revealRow, state, actions]
  )

  /** Whether the user is using the rows: pointing, focused, or in a row's popup. */
  const interacting = React.useCallback(() => {
    if (state.pointer || state.focus) return true
    const body = partsOf(frame.current, latest.current.virtualized)?.body
    return !!body?.querySelector('[aria-haspopup][aria-expanded="true"]')
  }, [frame, state])

  const stopWatching = React.useCallback(() => {
    if (state.releaseTimer) clearTimeout(state.releaseTimer)
    state.releaseTimer = null
    state.popups?.disconnect()
    state.popups = null
  }, [state])

  /**
   * Shows the held rows `RELEASE_DELAY` after the user stops using the
   * rows (`holding`: rows are being held now, not rendered as held yet).
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

  // The user's use of the rows: pointer, focus.
  React.useEffect(() => {
    const element = frame.current
    if (!element) return
    const inRows = (node: EventTarget | null) => {
      if (!(node instanceof Node)) return false
      const body = partsOf(element, latest.current.virtualized)?.body
      if (body?.contains(node)) return true
      const at = node instanceof Element ? node : node.parentElement
      const pill = at?.closest(PILLS)
      return !!pill && pill.closest(CONTENT) === element
    }
    const over = (event: PointerEvent) => {
      state.pointer = inRows(event.target)
      if (!state.pointer) scheduleRelease()
    }
    const leave = () => {
      state.pointer = false
      scheduleRelease()
    }
    const focusIn = (event: FocusEvent) => {
      state.focus = inRows(event.target)
    }
    const focusOut = (event: FocusEvent) => {
      state.focus = inRows(event.relatedTarget)
      if (!state.focus) scheduleRelease()
    }
    element.addEventListener("pointerover", over)
    element.addEventListener("pointerleave", leave)
    element.addEventListener("focusin", focusIn)
    element.addEventListener("focusout", focusOut)
    return () => {
      element.removeEventListener("pointerover", over)
      element.removeEventListener("pointerleave", leave)
      element.removeEventListener("focusin", focusIn)
      element.removeEventListener("focusout", focusOut)
      state.pointer = false
      state.focus = false
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
      for (const timer of state.timers) clearTimeout(timer)
      state.timers.clear()
      state.unseen.clear()
      flashStore.set({ flashes: new Map() })
    },
    [state, stopWatching, flashStore]
  )

  // After each render: a new batch of rows, a page turned to for one, the
  // counts.
  React.useLayoutEffect(() => {
    const { batch } = live
    if (batch && batch !== state.handled) {
      state.handled = batch
      const at = placing()
      const start = now()
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
      const revealing = state.revealing
      state.revealing = null
      const using = !revealing && interacting()
      const hold: Array<string> = []
      const shown = new Set<string>()
      for (const [target, ids] of byTarget) {
        const place = at ? placeOf(target, at) : "view"
        // A row of its own (or a group it makes) landing where it moves
        // the rows the user is on.
        const own =
          added.has(target) ||
          (!model.has(target) &&
            model.groupIds(target).every((id) => added.has(id)))
        if (using && own && (!at || movesView(target, place, at))) {
          hold.push(...ids)
          continue
        }
        shown.add(target)
        // The groups the row made, new with it, are new too.
        if (added.has(target))
          for (const key of model.groupPath(target))
            if (
              !byTarget.has(key) &&
              model.groupIds(key).every((id) => added.has(id))
            )
              shown.add(key)
        if (!revealing && place !== "view" && place !== null)
          for (const id of ids) state.unseen.add(id)
      }
      if (announced > 0) announce(announced)
      if (revealing) reveal([...shown], revealing.focus)
      else flash([...shown], start)
      if (hold.length) {
        actions.holdRows(hold)
        // Shown once the user is done: the pointer and focus say when, a
        // row's menu or popover is watched until it closes.
        scheduleRelease(true)
      }
    } else if (live.held.size === 0) state.revealing = null
    const pending = state.pending
    if (pending && model.page === pending.page) {
      state.pending = null
      revealRow(pending.key, pending.focus)
    }
    // Nothing held any more (shown, or removed by the application), and no
    // hold just asked for: nothing to watch.
    if (live.held.size === 0 && !state.releaseTimer) stopWatching()
    syncFlashes()
    update()
  })

  const pressed = React.useCallback(
    (kind: PillKind, event: React.MouseEvent) => {
      // A click from the keyboard (or a screen reader) has no detail: focus
      // follows to the row, the button being gone.
      const focus = event.detail === 0
      if (kind === "held") {
        stopWatching()
        state.revealing = { focus }
        actions.releaseRows()
        return
      }
      const current = latest.current
      const at = placing()
      const keys = new Set<string>()
      for (const id of [...state.unseen]) {
        const target = targetOf(id, current.model, current.closedGroups)
        const place = target !== null && at ? placeOf(target, at) : null
        const of: PillKind | null =
          place === "before" || place === "after"
            ? "pages"
            : place === "above" || place === "below"
              ? place
              : null
        if (of !== kind || target === null) continue
        state.unseen.delete(id)
        keys.add(target)
      }
      reveal([...keys], focus)
      update()
    },
    [actions, placing, reveal, state, stopWatching, update]
  )

  // The content's anchor keeps the rows in view still while this is here.
  React.useLayoutEffect(() => {
    bridge.anchor = createAnchor(frame, latest)
    return () => {
      bridge.anchor = null
    }
  }, [bridge, frame])

  return { pills, edges, pressed }
}

/** A content's `Anchor` (see `LiveAnchor`). */
function createAnchor(
  frame: React.RefObject<HTMLDivElement | null>,
  latest: React.RefObject<{
    virtualized: boolean
    indexOf: (key: string) => number
  }>
): Anchor {
  return {
    capture() {
      const element = frame.current
      const parts = partsOf(element, latest.current.virtualized)
      if (!element || !parts) return null
      const region = regionOf(element, parts)
      if (!region.laidOut) return null
      const { rows } = parts.body
      // At the top of the rows: rows added above come into view.
      if (parts.body.getBoundingClientRect().top >= region.top - 0.5)
        return null
      const kept: AnchorSnapshot["rows"] = []
      let height = 0
      for (let at = firstBelow(rows, region.top); at < rows.length; at++) {
        const row = rows[at]
        const key = row.dataset.liveKey
        if (key === undefined) continue
        const box = row.getBoundingClientRect()
        if (box.top >= region.bottom) break
        if (!height) height = box.height
        kept.push({ key, top: box.top, index: latest.current.indexOf(key) })
        if (kept.length === 3) break
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

const PILLS = '[data-slot="data-table-new-rows"]'
const CONTENT = '[data-slot="data-table-content"]'

/**
 * The "new rows" buttons, over the scroll area's top and bottom edges:
 * the rows above the view and those held at the top, those below and on
 * other pages at the bottom. Real buttons, in the tab order after the
 * table; nothing moves focus to them.
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
  const button = (kind: PillKind) => {
    const count = pills[kind]
    if (count === 0) return null
    const values = { count, total: format.format(count) }
    const label =
      kind === "above"
        ? t("newRowsAbove", values)
        : kind === "below"
          ? t("newRowsBelow", values)
          : kind === "pages"
            ? t("newRowsOnOtherPages", values)
            : t("showNewRows", values)
    const Icon =
      kind === "above" ? ArrowUpIcon : kind === "below" ? ArrowDownIcon : null
    return (
      <Button
        key={kind}
        size="sm"
        data-kind={kind}
        aria-label={label}
        className="pointer-events-auto animate-in rounded-full shadow-md fade-in-0 motion-reduce:animate-none"
        onClick={(event) => onPress(kind, event)}
      >
        {Icon && <Icon data-icon="inline-start" aria-hidden />}
        {kind === "above" || kind === "below" ? t("newRows", values) : label}
      </Button>
    )
  }
  const edge = (side: "top" | "bottom", kinds: ReadonlyArray<PillKind>) =>
    kinds.some((kind) => pills[kind] > 0) && (
      <div
        data-slot="data-table-new-rows"
        data-edge={side}
        className={cn(
          "pointer-events-none absolute inset-x-0 z-30 flex flex-wrap justify-center gap-2 px-2"
        )}
        style={
          side === "top" ? { top: edges.top + 8 } : { bottom: edges.bottom + 8 }
        }
      >
        {kinds.map(button)}
      </div>
    )
  return (
    <>
      {edge("top", TOP)}
      {edge("bottom", BOTTOM)}
    </>
  )
}

const TOP: ReadonlyArray<PillKind> = ["held", "above"]
const BOTTOM: ReadonlyArray<PillKind> = ["below", "pages"]

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
