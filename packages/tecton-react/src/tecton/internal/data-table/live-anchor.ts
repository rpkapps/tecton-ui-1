"use client"

/**
 * Live data's anchor (`highlightChanges`, `live-rows.tsx`, whose chunk it
 * is in): the row the user is on, which a change of the items keeps still
 * (`createAnchor`, the content's `LiveAnchor` asks it), and the layout the
 * live module reads: where a content's rows are, where they are seen, and
 * which of them is in use.
 */
import type * as React from "react"

import type { Anchor, AnchorSnapshot } from "./live-bridge"
import { FRAME, scrollParentOf } from "./scroll-parent"

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
  /** The body row under the pointer. */
  state: { pointer: Element | null }
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

export { anchorRow, createAnchor, partsOf, regionOf, rowsInUse, scrollRowsBy }
export type { Parts, Region }
