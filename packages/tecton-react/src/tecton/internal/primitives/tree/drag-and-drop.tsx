"use client"

/**
 * Internal to `@tecton/react`: the tree's drop strategy for the shared drag
 * and drop (`../drag-and-drop`). It knows where rows can go: before or after
 * any row, inside a folder (a row marked `folder`, or with child rows), never
 * into or next to the dragged rows; `canDrop` adds the owner's rules.
 *
 * - Pointer: over a row's middle half, a folder takes the drop inside; over
 *   a gap, the pointer's inline position picks the depth (the column of each
 *   level's chevron), so a row reaches any ancestor level by moving towards
 *   the tree's start. A collapsed folder held over for 800 ms opens.
 * - Keyboard: the places in tree order, named as React Aria names them
 *   ("Drop on Wells", "Insert between Wells and Notes"); Right / Left open
 *   and close the aimed folder.
 */
import * as React from "react"

import { useDirection } from "@tecton/react/tecton/provider"

import type { Formatter } from "../messages"
import {
  useDragAndDrop,
  type DragMessageKey,
  type DropStrategy,
} from "../drag-and-drop/use-drag-and-drop"
import { ancestorAt, isWithin, type Tree, type TreeNode } from "./collection"
import type {
  TreeDragAndDropConnection,
  TreeDropPlace,
  TreeHandle,
} from "./context"

type TreeMove = {
  values: Array<string>
  target: string
  position: "before" | "after" | "inside"
}

type TreeDragAndDropOptions = {
  /** Called on a drop; drag and drop is on while it is set. */
  onMove?: (move: TreeMove) => void
  /** Whether a drop is allowed, on top of the tree's own rules. */
  canDrop?: (move: TreeMove) => boolean
  onDragStart?: () => void
  /** The drop indicator, rendered in the tree (`TreePrimitive.DropIndicator`). */
  indicator?: React.ReactNode
  /**
   * The inline position of a level's chevron column, in px from the row's
   * start (for the depth a pointer over a gap picks). Default: 20 px a level.
   */
  levelOffset?: (level: number, row: HTMLElement) => number
  /** The width of a level's column, in px. Default 20. */
  levelWidth?: (row: HTMLElement) => number
}

const FOLDER_OPEN_DELAY = 800

/** The row of `tree` under (x, y), or the nearest one by y. */
function rowAtPoint(tree: HTMLElement, x: number, y: number) {
  const ours = (row: Element) => row.closest('[role="treegrid"]') === tree
  const doc = tree.ownerDocument
  // jsdom and some embedded engines lack `elementsFromPoint`.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const hits = doc.elementsFromPoint ? doc.elementsFromPoint(x, y) : []
  const hit = hits.find(
    (element) => element.matches('[role="row"][data-value]') && ours(element)
  )
  if (hit instanceof HTMLElement) return hit
  // Over a gap, or rows ignoring the pointer while they scroll.
  let nearest: HTMLElement | null = null
  let distance = Infinity
  for (const row of tree.querySelectorAll<HTMLElement>(
    '[role="row"][data-value]'
  )) {
    const rect = row.getBoundingClientRect()
    const d = Math.max(rect.top - y, 0, y - rect.bottom)
    if (ours(row) && d < distance) [nearest, distance] = [row, d]
  }
  return nearest
}

/** The next or previous visible row. */
function neighbour(
  rows: ReadonlyArray<TreeNode>,
  index: Map<string, number>,
  key: string,
  step: 1 | -1
) {
  const at = index.get(key)
  return at === undefined ? null : (rows[at + step]?.value ?? null)
}

function useTreeDragAndDrop({
  onMove,
  canDrop,
  onDragStart,
  indicator,
  levelOffset = (level) => 4 + 20 + 6 + (level - 1) * 20,
  levelWidth = () => 20,
}: TreeDragAndDropOptions): TreeDragAndDropConnection {
  const rtl = useDirection() === "rtl"
  const handle = React.useRef<TreeHandle | null>(null)
  const latest = React.useRef({
    onMove,
    canDrop,
    onDragStart,
    levelOffset,
    levelWidth,
    rtl,
  })
  React.useInsertionEffect(() => {
    latest.current = {
      onMove,
      canDrop,
      onDragStart,
      levelOffset,
      levelWidth,
      rtl,
    }
  })
  const folderTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  React.useEffect(() => () => clearTimeout(folderTimer.current), [])

  const [strategy] = React.useState(() => {
    const tree = (): Tree | null => handle.current?.tree ?? null
    const moveFor = (
      place: TreeDropPlace,
      dragging: ReadonlyArray<string>
    ): TreeMove | null => {
      const t = tree()
      const node = t?.byValue.get(place.key)
      if (!t || !node || !dragging.length) return null
      // Never into, or next to, a dragged row or anything inside one.
      if (isWithin(t, place.key, new Set(dragging))) return null
      if (place.position === "inside" && !node.isFolder) return null
      return {
        values: [...dragging],
        target: place.key,
        position: place.position,
      }
    }
    const allowed = (place: TreeDropPlace, dragging: ReadonlyArray<string>) => {
      const move = moveFor(place, dragging)
      const { canDrop } = latest.current
      return !!move && (!canDrop || canDrop(move))
    }

    const strategy: DropStrategy<TreeDropPlace> = {
      placeAt({ x, y }, dragging) {
        const h = handle.current
        const t = tree()
        if (!h?.element || !t) return null
        const row = rowAtPoint(h.element, x, y)
        const key = row?.dataset.value
        if (!row || key === undefined || !t.byValue.has(key)) return null
        const rows = h.rows
        const index = new Map(rows.map((n, i) => [n.value, i]))

        const rect = row.getBoundingClientRect()
        const along = rect.height ? (y - rect.top) / rect.height : 0.5
        const on: TreeDropPlace = { key, position: "inside" }
        // A folder takes drops inside over its middle half; the rest of a
        // row is the gap above or below it.
        const inside = allowed(on, dragging)
        if (inside && along >= 0.25 && along <= 0.75) return on
        const upper = along < (inside ? 0.25 : 0.5)
        const above = upper ? neighbour(rows, index, key, -1) : key
        const below = upper ? key : neighbour(rows, index, key, 1)
        const levelOf = (k: string) => t.byValue.get(k)?.level ?? 1

        // The gap between `above` and `below`, at each level it can take:
        // just before `below`, or after `above` or one of its ancestors when
        // `above` ends deeper than `below` starts.
        const candidates: Array<{ level: number; place: TreeDropPlace }> = []
        if (below != null)
          candidates.push({
            level: levelOf(below),
            place: { key: below, position: "before" },
          })
        const lowest = below == null ? 1 : levelOf(below) + 1
        if (above != null) {
          for (let level = levelOf(above); level >= lowest; level--) {
            candidates.push({
              level,
              place: { key: ancestorAt(t, above, level), position: "after" },
            })
          }
        }

        // The level whose chevron column the pointer is in.
        const { levelOffset, levelWidth, rtl } = latest.current
        const inline = rtl ? rect.right - x : x - rect.left
        const width = levelWidth(row) || 20
        const wanted =
          1 + Math.floor((inline - levelOffset(1, row)) / width + 0.5)
        const byDistance = [...candidates].sort(
          (a, b) => Math.abs(a.level - wanted) - Math.abs(b.level - wanted)
        )
        return byDistance.find((c) => allowed(c.place, dragging))?.place ?? null
      },

      places(dragging) {
        const h = handle.current
        const t = tree()
        if (!h || !t) return { places: [], start: 0 }
        const all: Array<TreeDropPlace> = []
        let startAt = -1
        const visible = new Set(h.rows.map((n) => n.value))
        const visit = (nodes: Array<TreeNode>) => {
          nodes.forEach((node, i) => {
            if (!visible.has(node.value)) return
            if (node.value === dragging[0]) startAt = all.length
            all.push({ key: node.value, position: "before" })
            if (node.isFolder) all.push({ key: node.value, position: "inside" })
            if (h.store.get().expanded.has(node.value)) visit(node.children)
            if (i === nodes.length - 1)
              all.push({ key: node.value, position: "after" })
          })
        }
        visit(t.roots)
        const places: Array<TreeDropPlace> = []
        let start = -1
        all.forEach((place, i) => {
          if (!allowed(place, dragging)) return
          if (start < 0 && i > startAt) start = places.length
          places.push(place)
        })
        return {
          places,
          start: start < 0 ? Math.max(places.length - 1, 0) : start,
        }
      },

      isSame: (a, b) => a.key === b.key && a.position === b.position,

      label(place, format: Formatter<DragMessageKey>) {
        const t = tree()
        const node = t?.byValue.get(place.key)
        const text = (n: TreeNode | undefined) => n?.textValue || n?.value || ""
        if (!t || !node) return ""
        if (place.position === "inside")
          return format("dropOnItem", { itemText: text(node) })
        if (place.position === "after")
          return format("insertAfter", { itemText: text(node) })
        const siblings =
          node.parent === null
            ? t.roots
            : (t.byValue.get(node.parent)?.children ?? [])
        const previous = siblings[siblings.indexOf(node) - 1] as
          TreeNode | undefined
        return previous
          ? format("insertBetween", {
              beforeItemText: text(previous),
              afterItemText: text(node),
            })
          : format("insertBefore", { itemText: text(node) })
      },

      onAim(place, mode) {
        const h = handle.current
        clearTimeout(folderTimer.current)
        h?.store.set({
          dropTarget: place?.position === "inside" ? place.key : null,
        })
        if (!h || !place) return
        if (mode !== "pointer") h.scrollToRow(place.key)
        const node = h.tree.byValue.get(place.key)
        // A collapsed folder held over opens.
        if (
          mode === "pointer" &&
          place.position === "inside" &&
          node?.children.length &&
          !h.store.get().expanded.has(place.key)
        )
          folderTimer.current = setTimeout(
            () => h.setExpanded(place.key, true),
            FOLDER_OPEN_DELAY
          )
      },

      onKey(event, place) {
        const h = handle.current
        const { rtl } = latest.current
        const open = rtl ? "ArrowLeft" : "ArrowRight"
        const close = rtl ? "ArrowRight" : "ArrowLeft"
        if (!h || !place || (event.key !== open && event.key !== close))
          return false
        h.setExpanded(place.key, event.key === open)
        return true
      },
    }
    return strategy
  })

  const dragAndDrop = useDragAndDrop<TreeDropPlace>({
    strategy,
    getDragged: (key) => {
      const h = handle.current
      if (!h) return [key]
      const selected = h.store.get().selected
      if (!selected.has(key)) return [key]
      return h.tree.order.filter((value) => selected.has(value))
    },
    getItemElement: (key) => handle.current?.getRowElement(key) ?? null,
    getContainer: () => handle.current?.element ?? null,
    focusItem: (key) => handle.current?.focusRow(key),
    onDragStart: () => latest.current.onDragStart?.(),
    onDrop: (place, keys) =>
      latest.current.onMove?.({
        values: [...keys],
        target: place.key,
        position: place.position,
      }),
  })

  // The rows being dragged, as the tree's state.
  React.useEffect(
    () =>
      dragAndDrop.store.subscribe(() => {
        const { dragging } = dragAndDrop.store.get()
        handle.current?.store.set({ dragging: new Set(dragging) })
      }),
    [dragAndDrop]
  )

  const getPlacement = React.useCallback(
    (place: TreeDropPlace): React.CSSProperties | null => {
      const h = handle.current
      const node = h?.tree.byValue.get(place.key)
      if (!h || !node || place.position === "inside") return null
      const index = h.rows.findIndex((n) => n.value === place.key)
      if (index < 0) return null
      // After a row: after its last visible descendant.
      let last = index
      if (place.position === "after")
        while (h.rows[last + 1] && h.rows[last + 1].level > node.level) last++
      let top: number
      if (h.rowHeight) {
        top = (place.position === "after" ? last + 1 : index) * h.rowHeight
      } else {
        const element = h.getRowElement(
          h.rows[place.position === "after" ? last : index].value
        )
        if (!element) return null
        top =
          element.offsetTop +
          (place.position === "after" ? element.offsetHeight : 0)
      }
      return { top, ["--tree-drop-level" as string]: node.level }
    },
    []
  )

  return {
    dragAndDrop,
    getPlacement,
    enabled: !!onMove,
    connect: (tree) => {
      handle.current = tree
    },
    keep: () => [],
    indicator,
  }
}

export { useTreeDragAndDrop }
export type { TreeDragAndDropOptions, TreeMove }
