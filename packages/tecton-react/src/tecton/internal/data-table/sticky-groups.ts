"use client"

/**
 * Sticky group rows (`groupable`). While the rows of a group scroll past,
 * its row sticks under the column header (which sticks to the top of a
 * table of bounded height), each level of groups under the levels above
 * it; the next row of the same level or above pushes it up as it comes,
 * like section headers on a phone.
 *
 * - The cells stick (`position: sticky`, `top` at the frame's
 *   `--data-table-group-top-<depth>`), the pinned ones sideways too, on
 *   their row's fill. The column header is over every group row; a level
 *   is over the levels below it, for a row coming to push them up to pass
 *   over the deeper rows it pushes; a row's pinned cells are over its
 *   scrolled ones (`groupCellClassName`).
 * - A browser keeps a stuck table cell within its table, not its group:
 *   nothing would push a stuck row up, and the next would slide over it.
 *   The push is a `translate` (`--data-table-group-push` on the row),
 *   worked out on scroll from the rows' places, measured once per layout:
 *   no render, no layout, only the rows whose push changes are written.
 * - The levels' tops are measured: the header's height, and each level's
 *   row's height above it. Rows scrolled to (the keyboard) come to rest
 *   clear of the group rows stuck over them (`scroll-margin-top`).
 * - A virtualized body keeps the group rows of the row at the top of the
 *   view rendered (`stickyRowsOf`), as it keeps the focused row: a row out
 *   of the rendered window stays in its place in the table, and sticks.
 *
 * Visual only: the rows keep their place in the table for screen readers
 * and the keyboard.
 */
import * as React from "react"
import { cn } from "cn"

import type { BodyRow } from "./engine/index"

/** The row's push, set on the row and read by its cells. */
const PUSH = "--data-table-group-push"
/** Where the item rows come to rest when scrolled to: under every level. */
const CLEAR = "--data-table-group-clear"

/** Where a group row of this depth sticks, from the top of the scroll area. */
function groupTop(depth: number) {
  return `--data-table-group-top-${depth}`
}

/**
 * A group row's cells by depth: the shallower levels over the deeper ones,
 * the pinned cells over the scrolled ones (and over them, a pinned cell
 * holding the focus, as `pinnedCellClassName`); all under the column header
 * (`z-10`) and the totals row, over the item rows' pinned cells (`z-[1]`,
 * `z-[2]`). From the third level on, one stacking.
 */
const GROUP_LAYERS = [
  { scrolled: "z-[7]", pinned: "z-[8] has-[:focus-visible]:z-[9]" },
  { scrolled: "z-[5]", pinned: "z-[6] has-[:focus-visible]:z-[7]" },
  { scrolled: "z-[3]", pinned: "z-[4] has-[:focus-visible]:z-[5]" },
] as const

const GROUP_CELL =
  "sticky bg-inherit [&[scope=row]]:bg-inherit [translate:0_var(--data-table-group-push,0px)]"

/** A group row's cell's sticky classes (after `pinnedCellClassName`). */
function groupCellClassName(depth: number, pinned: boolean) {
  const layer = GROUP_LAYERS[Math.min(depth, GROUP_LAYERS.length - 1)]
  return cn(GROUP_CELL, pinned ? layer.pinned : layer.scrolled)
}

/** A group row's cell's `top`, and where it comes to rest when scrolled to. */
function groupCellStyle(depth: number): React.CSSProperties {
  const top = `var(${groupTop(depth)},0px)`
  return { top, scrollMarginTop: top }
}

/**
 * The table's class while grouped: its rows (and their cells) come to rest
 * under the stuck group rows when scrolled to; a group row's own cells
 * rest where they stick (`groupCellStyle`). Its own rows only, not a
 * nested table's.
 */
const GROUPED_TABLE_CLASS =
  "[&>tbody>tr]:scroll-mt-(--data-table-group-clear) [&>tbody>tr>*]:scroll-mt-(--data-table-group-clear)"

const NO_ROWS: ReadonlyArray<number> = []

/**
 * For a virtualized body (`TableGridOptions.stickyRowsOf`): the group rows
 * over each row, by index (a group row's own included), worked out once
 * per set of rows when first asked.
 */
function stickyRowsOf(rows: ReadonlyArray<BodyRow<unknown>>) {
  let chains: Array<ReadonlyArray<number>> | null = null
  return (index: number): ReadonlyArray<number> => {
    if (!chains) {
      chains = new Array<ReadonlyArray<number>>(rows.length)
      const open: Array<number> = []
      let chain = NO_ROWS
      for (let at = 0; at < rows.length; at++) {
        const row = rows[at]
        if (row.kind === "group") {
          open.length = Math.min(open.length, row.depth)
          open.push(at)
          chain = [...open]
        }
        chains[at] = chain
      }
    }
    return chains[index] ?? NO_ROWS
  }
}

type Placed = {
  row: HTMLElement
  depth: number
  /** From the top of the scroll area's content, in px. */
  top: number
  height: number
}

const GROUP_ROWS = ':scope > tbody > tr[data-slot="data-table-group-row"]'

/**
 * Keeps the group rows of the table in `container` (its scroll container)
 * stuck and pushed while `on`. `levels`: the number of grouping columns.
 * Returns a function that measures again before the next paint, for a row
 * that mounts or takes another's place (a virtualized body's).
 */
function useStickyGroups(
  container: React.RefObject<HTMLElement | null>,
  on: boolean,
  levels: number
) {
  const measure = React.useRef<(() => void) | null>(null)
  const pending = React.useRef(false)
  const schedule = React.useCallback(() => {
    if (pending.current || !measure.current) return
    pending.current = true
    queueMicrotask(() => {
      pending.current = false
      measure.current?.()
    })
  }, [])

  React.useLayoutEffect(() => {
    const element = container.current
    const table = element?.querySelector<HTMLTableElement>(":scope > table")
    if (!on || !element || !table) return
    let placed: Array<Placed> = []
    let tops: Array<number> = []
    /** The push each row was last given. */
    const pushes = new WeakMap<HTMLElement, number>()
    const written = new Map<string, string>()
    const setVariable = (name: string, value: string) => {
      if (written.get(name) === value) return
      written.set(name, value)
      element.style.setProperty(name, value)
    }

    // Where the rows are, from the top of the scroll area: they move only
    // with the layout, never with the scroll.
    const read = () => {
      const head = table.tHead
      const offset = table.offsetTop
      const heights: Array<number> = []
      placed = [...table.querySelectorAll<HTMLElement>(GROUP_ROWS)].map(
        (row) => {
          const depth = Math.max(0, Number(row.getAttribute("aria-level")) - 1)
          const height = row.offsetHeight
          heights[depth] ??= height
          return { row, depth, top: offset + row.offsetTop, height }
        }
      )
      tops = [head ? head.offsetHeight : 0]
      for (let depth = 1; depth <= levels; depth++)
        tops[depth] = tops[depth - 1] + (heights[depth - 1] ?? 0)
      for (let depth = 0; depth < levels; depth++)
        setVariable(groupTop(depth), `${tops[depth]}px`)
      setVariable(CLEAR, `${tops[levels] ?? tops[0]}px`)
    }

    // Each row where it sticks, unless the next row of its level or above
    // comes within its height: then just above that row (as that row is
    // placed). A row pushed out of the view goes no further.
    const place = () => {
      const scrolled = element.scrollTop
      const below: Array<number | undefined> = []
      for (let at = placed.length - 1; at >= 0; at--) {
        const { row, depth, top, height } = placed[at]
        const stuck = Math.max(top - scrolled, tops[depth] ?? 0)
        let shown = stuck
        const next = below[depth]
        if (next !== undefined)
          shown = Math.max(Math.min(stuck, next - height), -height)
        for (let level = depth; level < levels; level++) below[level] = shown
        const push = Math.min(0, Math.round((shown - stuck) * 100) / 100)
        if ((pushes.get(row) ?? 0) === push) continue
        pushes.set(row, push)
        if (push === 0) row.style.removeProperty(PUSH)
        else row.style.setProperty(PUSH, `${push}px`)
      }
    }

    const update = () => {
      read()
      place()
    }
    measure.current = update
    update()
    element.addEventListener("scroll", place, { passive: true })
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update)
    observer?.observe(table)
    if (table.tHead) observer?.observe(table.tHead)
    return () => {
      measure.current = null
      element.removeEventListener("scroll", place)
      observer?.disconnect()
      for (const name of written.keys()) element.style.removeProperty(name)
      for (const { row } of placed) row.style.removeProperty(PUSH)
    }
  }, [container, on, levels])

  // After each render of the table: rows may have opened, closed or moved.
  React.useLayoutEffect(() => {
    measure.current?.()
  })

  return on ? schedule : null
}

export {
  groupCellClassName,
  groupCellStyle,
  GROUPED_TABLE_CLASS,
  stickyRowsOf,
  useStickyGroups,
}
