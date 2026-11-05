"use client"

import * as React from "react"
import { cn } from "cn"
import { GripIcon, XIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"
import { usePortalTarget } from "@tecton/react/tecton/portal"
import { useDirection } from "@tecton/react/tecton/provider"

import {
  animateFrom,
  land,
  settle,
} from "./internal/primitives/drag-and-drop/drop-animation"
import {
  bottomOf,
  firstFit,
  inReadingOrder,
  limitsOf,
  resolveLayout,
  sameRect,
  stepMove,
  type GridCompaction,
  type GridLayoutItem,
  type GridOptions,
  type GridRect,
} from "./internal/primitives/drag-and-drop/grid-layout"
import {
  createGridStrategy,
  type GridDropPlace,
  type GridMetrics,
} from "./internal/primitives/drag-and-drop/grid-strategy"
import * as DragAndDropPrimitive from "./internal/primitives/drag-and-drop/index.parts"
import { trackPointerDrag } from "./internal/primitives/drag-and-drop/pointer-drag"
import {
  useDragAndDrop,
  type DragAndDrop,
  type DragMode,
  type DropDetails,
} from "./internal/primitives/drag-and-drop/use-drag-and-drop"
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "./internal/primitives/event-details"
import { announce } from "./internal/primitives/live-announcer"
import {
  hidden,
  usePrimitive,
  type PrimitiveProps,
} from "./internal/primitives/render"
import {
  useControlled,
  useEventCallback,
} from "./internal/primitives/use-controlled"
import { useTranslations, type Translator } from "./internal/i18n/translations"
import { createStore, useStore, type Store } from "./internal/store"

/**
 * Tecton Widget Grid — a dashboard the user arranges: widgets on a grid of
 * columns and rows that are moved, resized, added and removed, from a
 * pointer, the keyboard or a screen reader.
 *
 * The layout is `value`: one entry per widget, `{ id, x, y, w, h }` in
 * cells (`x` from the inline start), with optional size limits and
 * `locked`. Every change (a drop, the end of a resize, an added or removed
 * widget) hands back the whole new layout, in reading order, through
 * `onValueChange` with the reason; nothing is reported while a drag is
 * still going.
 *
 * - `WidgetGrid` holds the layout and wraps everything that works on it:
 *   the toolbar, a catalog of `WidgetGridSource`s, the grid.
 * - `WidgetGridContent` is the CSS grid; each `WidgetGridItem` (render a
 *   `Panel`) is placed by its entry. Its `WidgetGridHandle` moves it, its
 *   `WidgetGridResizeHandle` resizes it, its `WidgetGridRemove` removes it.
 *
 * While a widget is dragged, a dashed placeholder shows where it will land
 * and the others make way, gliding into their places; Escape puts
 * everything back. With `compaction="vertical"` (default) the widgets float
 * up, so the grid has no holes. `editable={false}` is the view mode: the
 * handles go and the layout stays put. A narrow grid (`stackBelow`) shows
 * the widgets in one column, in reading order, and is not edited.
 */

type WidgetGridLayoutItem = GridLayoutItem

/** The steps of the spacing scale a grid's gap can take. */
const WIDGET_GRID_GAPS = [0, 1, 1.5, 2, 3, 4, 5, 6, 8] as const

type WidgetGridGap = (typeof WIDGET_GRID_GAPS)[number]

/** `gap` as one of the steps (the nearest, for a value from outside TypeScript). */
function gapStep(gap: number): WidgetGridGap {
  return WIDGET_GRID_GAPS.reduce<WidgetGridGap>(
    (best, step) => (Math.abs(step - gap) < Math.abs(best - gap) ? step : best),
    4
  )
}

/** A step of the spacing scale, as CSS: it follows the theme's `--spacing`. */
const spacing = (step: WidgetGridGap) => `calc(var(--spacing) * ${step})`

type WidgetGridChangeReason = "move" | "resize" | "add" | "remove"

type WidgetGridChangeDetails = ChangeEventDetails<WidgetGridChangeReason> & {
  /** The id of the widget the change is about. */
  item: string
}

type WidgetGridState = {
  editable: boolean
  stacked: boolean
}

type WidgetGridProps = Omit<
  PrimitiveProps<"div", WidgetGridState>,
  "defaultValue" | "onChange"
> & {
  /** The layout: one entry per widget (controlled). */
  value?: ReadonlyArray<WidgetGridLayoutItem>
  /** The initial layout, when not controlled. */
  defaultValue?: ReadonlyArray<WidgetGridLayoutItem>
  /**
   * Called with the whole new layout, in reading order, after a drop, a
   * resize, an added or a removed widget. `eventDetails.reason` says which
   * ("move" | "resize" | "add" | "remove"), `eventDetails.item` names the
   * widget, and `eventDetails.cancel()` refuses the change.
   */
  onValueChange?: (
    value: Array<WidgetGridLayoutItem>,
    eventDetails: WidgetGridChangeDetails
  ) => void
  /** The number of columns. Default 12. */
  columns?: number
  /** The height of a row, in px. Default 64. */
  rowHeight?: number
  /**
   * The space between columns and between rows: a step of the spacing
   * scale, as in the `gap-*` classes (`4` is `gap-4`, 1rem). Default 4.
   */
  gap?: WidgetGridGap
  /**
   * "vertical" (default): the widgets float up into the space above them,
   * so the grid has no holes. "none": they stay where they are put, and
   * only move to make way.
   */
  compaction?: GridCompaction
  /**
   * Whether the layout can be changed: the edit mode of a dashboard. The
   * handles, the remove buttons and the grid's cells show only then.
   * Default `true`.
   */
  editable?: boolean
  /**
   * Below this width of the grid, in px, the widgets stack in one column,
   * in reading order, and the layout is not edited. Default 640; `0` never
   * stacks.
   */
  stackBelow?: number
  /**
   * Animates the widgets into their new places as the layout changes.
   * Default `true`; never when the user prefers reduced motion.
   */
  animated?: boolean
}

type ItemEntry = { element: HTMLElement | null; label: string }
type SourceEntry = {
  element: HTMLElement | null
  label: string
  item: WidgetGridLayoutItem
}

type GridStoreState = {
  /** The layout shown while a drag or a resize is under way. */
  preview: ReadonlyArray<WidgetGridLayoutItem> | null
  /** `preview` by id, for each widget to find its own entry at once. */
  previewById: ReadonlyMap<string, WidgetGridLayoutItem> | null
  /** The widget being resized. */
  resizing: string | null
  /** Whether the grid is narrow enough to stack. */
  stacked: boolean
}

type MoveDirection = "up" | "down" | "left" | "right"

type WidgetGridContextValue = {
  store: Store<GridStoreState>
  /** Stacked: the row each widget starts on (1-based), in reading order. */
  stackRows: ReadonlyMap<string, number> | null
  dragAndDrop: DragAndDrop<GridDropPlace>
  /** The layout as committed, resolved, by id. */
  byId: ReadonlyMap<string, WidgetGridLayoutItem>
  layout: ReadonlyArray<WidgetGridLayoutItem>
  columns: number
  rowHeight: number
  gap: WidgetGridGap
  editable: boolean
  t: Translator<"widgetGrid">
  registerItem: (id: string, entry: ItemEntry) => () => void
  registerSource: (id: string, entry: SourceEntry) => () => void
  registerContent: (element: HTMLElement | null) => void
  startResize: (event: React.PointerEvent<HTMLElement>, id: string) => void
  remove: (id: string) => void
  add: (id: string) => void
  move: (id: string, direction: MoveDirection) => void
  canMove: (id: string, direction: MoveDirection) => boolean | undefined
  resize: (id: string, size: { w: number; h: number }) => void
  /** Where the last press in the grid was, for the lifted widget's corner. */
  press: React.RefObject<{ x: number; y: number } | null>
}

const WidgetGridContext = React.createContext<WidgetGridContextValue | null>(
  null
)

function useWidgetGrid(part: string) {
  const context = React.useContext(WidgetGridContext)
  if (!context) throw new Error(`${part} must be used inside WidgetGrid`)
  return context
}

/** `base` and the caller's class, which may be a function of the state. */
function withClass<TState>(
  base: string,
  className: string | ((state: TState) => string | undefined) | undefined
) {
  return typeof className === "function"
    ? (state: TState) => cn(base, className(state))
    : cn(base, className)
}

/** Long enough to follow, short enough not to wait for. */
const DURATION = 200
const EASING = "cubic-bezier(0.2, 0, 0, 1)"

const reducedMotion = (element: Element) =>
  !!element.ownerDocument.defaultView?.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

/**
 * A removed widget fades out where it was: a copy of it, over the page,
 * while the others close the gap under it.
 */
function fadeOut(element: HTMLElement, container: HTMLElement | null) {
  // `animate` is missing from some embedded engines (jsdom).
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!element.isConnected || !element.animate || reducedMotion(element)) return
  const rect = element.getBoundingClientRect()
  const copy = element.cloneNode(true) as HTMLElement
  for (const node of [copy, ...copy.querySelectorAll("[id]")])
    node.removeAttribute("id")
  copy.removeAttribute("data-slot")
  copy.setAttribute("aria-hidden", "true")
  copy.setAttribute("inert", "")
  copy.dir = getComputedStyle(element).direction
  Object.assign(copy.style, {
    position: "fixed",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    pointerEvents: "none",
    zIndex: "50",
  })
  ;(container ?? element.ownerDocument.body).append(copy)
  const remove = () => copy.remove()
  copy
    .animate(
      [
        { opacity: 1, scale: "1" },
        { opacity: 0, scale: "0.94" },
      ],
      { duration: DURATION, easing: EASING, fill: "forwards" }
    )
    .finished.then(remove, remove)
}

/** A new widget grows into its place. */
function growIn(element: HTMLElement) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!element.animate || reducedMotion(element)) return
  element.animate(
    [
      { opacity: 0, scale: "0.94" },
      { opacity: 1, scale: "1" },
    ],
    { duration: DURATION * 1.5, easing: EASING }
  )
}

const rectKey = (rect: GridRect | undefined) =>
  rect ? `${rect.x},${rect.y},${rect.w},${rect.h}` : ""

const layoutKey = (layout: ReadonlyArray<WidgetGridLayoutItem> | null) =>
  layout ? layout.map((item) => `${item.id}:${rectKey(item)}`).join(";") : ""

function WidgetGrid({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  columns: columnsProp = 12,
  rowHeight = 64,
  gap: gapProp = 4,
  compaction = "vertical",
  editable: editableProp = true,
  stackBelow = 640,
  animated = true,
  className,
  children,
  ref,
  ...props
}: WidgetGridProps) {
  const [value, setValue] = useControlled<ReadonlyArray<WidgetGridLayoutItem>>(
    valueProp,
    defaultValue
  )
  const columns = Math.max(1, Math.round(columnsProp))
  const gap = gapStep(gapProp)
  const t = useTranslations("widgetGrid")
  const direction = useDirection()
  const portal = usePortalTarget()

  const [store] = React.useState(() =>
    createStore<GridStoreState>({
      preview: null,
      previewById: null,
      resizing: null,
      stacked: false,
    })
  )
  const stacked = useStore(store, (s) => s.stacked)
  const editable = editableProp && !stacked

  const options = React.useMemo<GridOptions>(
    () => ({ columns, compaction }),
    [columns, compaction]
  )
  // What shows: overlaps resolved, limits applied, holes closed.
  const layout = React.useMemo(
    () => resolveLayout(value, options),
    [value, options]
  )
  const byId = React.useMemo(
    () => new Map(layout.map((item) => [item.id, item])),
    [layout]
  )
  const byIdRef = React.useRef(byId)
  React.useInsertionEffect(() => {
    byIdRef.current = byId
  })

  const content = React.useRef<HTMLElement | null>(null)
  const [items] = React.useState(() => new Map<string, ItemEntry>())
  const [sources] = React.useState(() => new Map<string, SourceEntry>())
  const press = React.useRef<{ x: number; y: number } | null>(null)
  const grab = React.useRef<{ x: number; y: number; width: number } | null>(
    null
  )

  const snapshot = {
    layout,
    options,
    direction,
    t,
    animated,
    rowHeight,
    onValueChange,
    setValue,
    portal,
  }
  const latest = React.useRef(snapshot)
  React.useInsertionEffect(() => {
    latest.current = snapshot
  })

  // The grid's box model, read once and kept until the grid's size or
  // props change: a drag measures on every pointer move.
  const boxModel = React.useRef<{
    start: number
    end: number
    top: number
    bottom: number
    row: number
    columnGap: number
    rowGap: number
  } | null>(null)
  React.useLayoutEffect(() => {
    boxModel.current = null
  }, [rowHeight, gap, columns])

  /** The grid's content box and pitches, in viewport px. */
  const metrics = React.useCallback((): GridMetrics | null => {
    const element = content.current
    if (!element) return null
    const rect = element.getBoundingClientRect()
    let box = boxModel.current
    if (!box) {
      const style = getComputedStyle(element)
      const px = (value: string) => parseFloat(value) || 0
      box = {
        start: px(style.borderLeftWidth) + px(style.paddingLeft),
        end: px(style.borderRightWidth) + px(style.paddingRight),
        top: px(style.borderTopWidth) + px(style.paddingTop),
        bottom: px(style.borderBottomWidth) + px(style.paddingBottom),
        row: px(style.gridAutoRows) || latest.current.rowHeight,
        columnGap: px(style.columnGap),
        rowGap: px(style.rowGap),
      }
      boxModel.current = box
    }
    const left = rect.left + box.start
    const right = rect.right - box.end
    const { columns: count } = latest.current.options
    return {
      left,
      right,
      top: rect.top + box.top,
      bottom: rect.bottom - box.bottom,
      columnPitch: (right - left + box.columnGap) / count,
      rowPitch: box.row + box.rowGap,
      columnGap: box.columnGap,
      rowGap: box.rowGap,
    }
  }, [])

  const itemOf = React.useCallback(
    (key: string) =>
      latest.current.layout.find((item) => item.id === key) ??
      (sources.get(key)?.item
        ? { ...sources.get(key)!.item, id: key, x: 0, y: 0 }
        : null),
    [sources]
  )
  const labelOf = React.useCallback(
    (key: string) => items.get(key)?.label ?? sources.get(key)?.label ?? key,
    [items, sources]
  )

  const [grid] = React.useState(() =>
    createGridStrategy({
      layout: () => latest.current.layout,
      options: () => latest.current.options,
      itemOf,
      labelOf,
      metrics,
      grab: () => grab.current,
      direction: () => latest.current.direction,
      t: () => latest.current.t,
    })
  )

  // Animation: where every widget shows before a change, for the commit
  // that applies it to slide them from there (`animateFrom`).
  const pending = React.useRef<{
    before: Map<HTMLElement, DOMRect>
    expires: number
  } | null>(null)
  const landing = React.useRef<{ key: string; ghost: HTMLElement } | null>(null)
  const entering = React.useRef<string | null>(null)
  const focusAfter = React.useRef<{
    removed: string
    next: string | null
  } | null>(null)
  /** Measures the widgets (those of `only`, when given) before a change. */
  const measure = React.useCallback(
    (only?: ReadonlySet<string>) => {
      if (!latest.current.animated) return
      const before = new Map<HTMLElement, DOMRect>()
      for (const [id, { element }] of items)
        if (element?.isConnected && (!only || only.has(id)))
          before.set(element, element.getBoundingClientRect())
      // Where they show (perhaps mid-way): now at rest, for the commit to
      // measure where they land.
      for (const element of before.keys()) settle(element)
      pending.current = { before, expires: performance.now() + 500 }
    },
    [items]
  )

  const showPreview = React.useCallback(
    (preview: ReadonlyArray<WidgetGridLayoutItem> | null) => {
      const now = store.get()
      if (layoutKey(now.preview) === layoutKey(preview)) return
      // Only the widgets this preview moves are measured and animated.
      const from = now.previewById ?? byIdRef.current
      const moved = new Set<string>()
      for (const item of preview ?? latest.current.layout)
        if (rectKey(from.get(item.id)) !== rectKey(item)) moved.add(item.id)
      if (!preview)
        for (const [id, item] of from)
          if (rectKey(byIdRef.current.get(id)) !== rectKey(item)) moved.add(id)
      measure(moved)
      store.set({
        preview,
        previewById: preview && new Map(preview.map((item) => [item.id, item])),
      })
    },
    [store, measure]
  )

  /** Applies `next`, unless `onValueChange` refuses it; whether it did. */
  const commit = useEventCallback(
    (
      next: Array<WidgetGridLayoutItem>,
      reason: WidgetGridChangeReason,
      item: string
    ) => {
      const current = latest.current.layout
      if (layoutKey(next) === layoutKey(current)) {
        showPreview(null)
        return false
      }
      const details: WidgetGridChangeDetails = Object.assign(
        createChangeEventDetails(reason),
        { item }
      )
      latest.current.onValueChange?.(next, details)
      if (details.isCanceled) {
        showPreview(null)
        return false
      }
      if (!store.get().preview) measure()
      latest.current.setValue(next)
      store.set({ preview: null, previewById: null })
      return true
    }
  )

  const onDrop = useEventCallback(
    (
      place: GridDropPlace,
      keys: ReadonlyArray<string>,
      { mode, takePreview }: DropDetails
    ) => {
      const key = keys.at(0)
      if (key === undefined) return
      const own = latest.current.layout.find((item) => item.id === key)
      const reason: WidgetGridChangeReason = !own
        ? "add"
        : own.x === place.x && own.y === place.y
          ? "resize"
          : "move"
      const next = grid.preview(key, place)
      const ghost = takePreview?.() ?? null
      if (!commit(next, reason, key)) return ghost?.remove()
      if (ghost && latest.current.animated) {
        landing.current = { key, ghost }
        // The copy never outlives its landing, whatever becomes of it.
        setTimeout(() => ghost.remove(), DURATION * 5)
      } else ghost?.remove()
      if (reason === "add") {
        if (!ghost) entering.current = key
        if (mode === "pointer") {
          const at = next.find((entry) => entry.id === key)
          if (at)
            announce(
              latest.current.t("added", {
                itemText: labelOf(key),
                position: grid.position(at),
              })
            )
        }
      }
    }
  )

  const dragAndDrop = useDragAndDrop<GridDropPlace>({
    strategy: {
      ...grid.strategy,
      onAim: (place, mode) => {
        const key = dragApi.current?.store.get().dragging.at(0)
        showPreview(
          key !== undefined && place ? grid.preview(key, place) : null
        )
        if (place && mode !== "pointer") revealActive.current = key ?? null
      },
    },
    axis: "x",
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) =>
      items.get(key)?.element ?? sources.get(key)?.element ?? null,
    getContainer: () => content.current,
    getPreviewContainer: () => portal ?? null,
    keyboardInstructions: (keys) =>
      latest.current.t("dragStarted", { itemText: labelOf(keys[0] ?? "") }),
    onDragStart: (keys) => {
      const element = items.get(keys[0] ?? "")?.element
      const at = press.current
      if (element && at) {
        const rect = element.getBoundingClientRect()
        grab.current = {
          x: at.x - rect.left,
          y: at.y - rect.top,
          width: rect.width,
        }
      } else grab.current = null
    },
    onDrop,
    focusItem: (key) => {
      const element = items.get(key)?.element
      const handle = element?.querySelector<HTMLElement>(
        '[data-slot="widget-grid-handle"]'
      )
      ;(handle ?? element)?.focus()
    },
  })
  const dragApi = React.useRef<DragAndDrop<GridDropPlace> | null>(null)
  dragApi.current = dragAndDrop
  const revealActive = React.useRef<string | null>(null)

  // Leaving the edit mode ends a drag or a resize under way, and so does
  // unmounting.
  const stopResize = React.useRef<(() => void) | null>(null)
  React.useEffect(() => {
    if (editable) return
    dragAndDrop.cancel()
    stopResize.current?.()
  }, [editable, dragAndDrop])
  React.useEffect(() => () => stopResize.current?.(), [])

  // Re-rendered by every preview, for the effect below to animate it.
  useStore(store, (s) => s.preview)

  // After every commit: the widgets slide from
  // where they were, a dropped one's preview lands on it, a new one grows
  // in, and focus goes where a removal left it.
  React.useLayoutEffect(() => {
    const flip = pending.current
    pending.current = null
    if (flip && performance.now() < flip.expires)
      animateFrom(flip.before, !latest.current.animated)
    const land_ = landing.current
    landing.current = null
    if (land_) {
      const element = items.get(land_.key)?.element
      if (element) land(land_.ghost, element)
      else land_.ghost.remove()
    }
    const key = entering.current
    entering.current = null
    const added = key ? items.get(key)?.element : null
    if (added) {
      if (latest.current.animated) growIn(added)
      // `scrollIntoView` is missing from some embedded engines (jsdom).
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      added.scrollIntoView?.({ block: "nearest", inline: "nearest" })
    }
    const shown = revealActive.current
    revealActive.current = null
    if (shown)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      items.get(shown)?.element?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      })
    const focus = focusAfter.current
    if (focus && !items.has(focus.removed)) {
      focusAfter.current = null
      const next = focus.next ? items.get(focus.next)?.element : null
      const handle = next?.querySelector<HTMLElement>(
        '[data-slot="widget-grid-handle"]'
      )
      if (handle) handle.focus()
      else if (content.current) {
        content.current.tabIndex = -1
        content.current.focus()
      }
    }
    // After every commit, not only those that change what shows: a drop
    // commits the layout its preview already showed.
  })

  const startResize = useEventCallback(
    (event: React.PointerEvent<HTMLElement>, id: string) => {
      if (event.button !== 0 || dragAndDrop.store.get().mode !== null) return
      const origin = latest.current.layout.find((item) => item.id === id)
      const element = items.get(id)?.element
      const m = metrics()
      if (!origin || origin.locked || !element || !m) return
      event.preventDefault()
      event.stopPropagation()
      const rtl = latest.current.direction === "rtl"
      const box = element.getBoundingClientRect()
      // How far the press is from the widget's bottom corner on the inline
      // end side: that corner follows the pointer.
      const offset = {
        x: rtl ? event.clientX - box.left : box.right - event.clientX,
        y: box.bottom - event.clientY,
      }
      const { minW, maxW, minH, maxH } = limitsOf(
        origin,
        latest.current.options.columns
      )
      let aimed: GridRect = origin
      stopResize.current = trackPointerDrag(event, {
        threshold: 2,
        capture: content.current,
        autoScroll: element,
        onStart: () => {
          store.set({ resizing: id })
        },
        onMove: (point) => {
          const rect = element.getBoundingClientRect()
          const now = metrics()
          if (!now) return
          const width =
            (rtl ? rect.right - point.x : point.x - rect.left) + offset.x
          const height = point.y - rect.top + offset.y
          const gapX = now.columnGap
          const gapY = now.rowGap
          const { columns } = latest.current.options
          const w = Math.min(
            Math.max(Math.round((width + gapX) / now.columnPitch), minW),
            Math.min(maxW, columns - origin.x)
          )
          const h = Math.min(
            Math.max(Math.round((height + gapY) / now.rowPitch), minH),
            maxH
          )
          const next = { x: origin.x, y: origin.y, w, h }
          if (sameRect(next, aimed)) return
          aimed = next
          showPreview(grid.preview(id, next))
        },
        onStop: () => {
          stopResize.current = null
          if (store.get().resizing === id) {
            store.set({ resizing: null })
            showPreview(null)
          }
        },
        onEnd: (drop) => {
          store.set({ resizing: null })
          if (drop && !sameRect(aimed, origin))
            commit(grid.preview(id, aimed), "resize", id)
          else showPreview(null)
        },
      })
    }
  )

  const remove = useEventCallback((id: string) => {
    const current = latest.current.layout
    const order = inReadingOrder(current)
    const index = order.findIndex((item) => item.id === id)
    if (index < 0) return
    const next = resolveLayout(
      current.filter((item) => item.id !== id),
      latest.current.options
    )
    const element = items.get(id)?.element
    const neighbour = order.at(index + 1) ?? order.at(index - 1) ?? null
    // Taken before the change: the element goes with it.
    const copyOf = element && latest.current.animated ? element : null
    const removed = commit(next, "remove", id)
    if (!removed) return
    if (copyOf) fadeOut(copyOf, latest.current.portal ?? null)
    focusAfter.current = { removed: id, next: neighbour?.id ?? null }
    announce(latest.current.t("removed", { itemText: labelOf(id) }))
  })

  const add = useEventCallback((id: string) => {
    const source = sources.get(id)
    if (!source || latest.current.layout.some((item) => item.id === id)) return
    const { columns } = latest.current.options
    const size = { w: Math.min(source.item.w, columns), h: source.item.h }
    const at = firstFit(latest.current.layout, size, columns)
    const next = resolveLayout(
      [...latest.current.layout, { ...source.item, ...size, ...at, id }],
      latest.current.options
    )
    if (!commit(next, "add", id)) return
    entering.current = id
    focusAfter.current = null
    queueMicrotask(() => {
      const handle = items
        .get(id)
        ?.element?.querySelector<HTMLElement>(
          '[data-slot="widget-grid-handle"]'
        )
      handle?.focus({ preventScroll: true })
    })
    const placed = next.find((item) => item.id === id)
    if (placed)
      announce(
        latest.current.t("added", {
          itemText: source.label,
          position: grid.position(placed),
        })
      )
  })

  const step = (id: string, way: MoveDirection) => {
    const from = latest.current.layout.find((item) => item.id === id)
    if (!from || from.locked) return null
    const rtl = latest.current.direction === "rtl"
    const dx = way === "left" ? -1 : way === "right" ? 1 : 0
    const dy = way === "up" ? -1 : way === "down" ? 1 : 0
    return stepMove(
      latest.current.layout,
      latest.current.options,
      id,
      from,
      rtl ? -dx : dx,
      dy
    )
  }

  const move = useEventCallback((id: string, way: MoveDirection) => {
    const to = step(id, way)
    if (!to) return
    const next = grid.preview(id, to)
    if (!commit(next, "move", id)) return
    const at = next.find((item) => item.id === id)
    if (at)
      announce(
        latest.current.t("moved", {
          itemText: labelOf(id),
          position: grid.position(at),
        })
      )
  })

  const canMove = useEventCallback(
    (id: string, way: MoveDirection) => step(id, way) !== null
  )

  const resize = useEventCallback(
    (id: string, size: { w: number; h: number }) => {
      const from = latest.current.layout.find((item) => item.id === id)
      if (!from || from.locked) return
      const { columns } = latest.current.options
      const { minW, maxW, minH, maxH } = limitsOf(from, columns)
      const w = Math.min(Math.max(Math.round(size.w), minW), maxW)
      const h = Math.min(Math.max(Math.round(size.h), minH), maxH)
      const to = { x: Math.min(from.x, columns - w), y: from.y, w, h }
      if (sameRect(to, from)) return
      if (!commit(grid.preview(id, to), "resize", id)) return
      announce(
        latest.current.t("resized", {
          itemText: labelOf(id),
          width: w,
          height: h,
        })
      )
    }
  )

  const registerItem = React.useCallback(
    (id: string, entry: ItemEntry) => {
      items.set(id, entry)
      return () => {
        if (items.get(id) === entry) items.delete(id)
      }
    },
    [items]
  )
  const registerSource = React.useCallback(
    (id: string, entry: SourceEntry) => {
      sources.set(id, entry)
      return () => {
        if (sources.get(id) === entry) sources.delete(id)
      }
    },
    [sources]
  )

  // The grid stacks when it is narrow, measured before it first paints.
  const stackWidth = React.useRef(stackBelow)
  stackWidth.current = stackBelow
  const observer = React.useRef<ResizeObserver | null>(null)
  const registerContent = React.useCallback(
    (element: HTMLElement | null) => {
      observer.current?.disconnect()
      observer.current = null
      content.current = element
      if (!element) return
      const update = (width: number) => {
        boxModel.current = null
        store.set({ stacked: width > 0 && width < stackWidth.current })
      }
      update(element.getBoundingClientRect().width)
      if (typeof ResizeObserver === "undefined") return
      observer.current = new ResizeObserver((entries) => {
        const entry = entries.at(0)
        if (entry) update(entry.contentRect.width)
      })
      observer.current.observe(element)
    },
    [store]
  )

  // Stacked, the widgets follow one another in reading order.
  const stackRows = React.useMemo(() => {
    if (!stacked) return null
    const rows = new Map<string, number>()
    let row = 1
    for (const item of layout) {
      rows.set(item.id, row)
      row += item.h
    }
    return rows
  }, [stacked, layout])

  const context = React.useMemo<WidgetGridContextValue>(
    () => ({
      store,
      stackRows,
      dragAndDrop,
      byId,
      layout,
      columns,
      rowHeight,
      gap,
      editable,
      t,
      registerItem,
      registerSource,
      registerContent,
      startResize,
      remove,
      add,
      move,
      canMove,
      resize,
      press,
    }),
    [
      store,
      stackRows,
      dragAndDrop,
      byId,
      layout,
      columns,
      rowHeight,
      gap,
      editable,
      t,
      registerItem,
      registerSource,
      registerContent,
      startResize,
      remove,
      add,
      move,
      canMove,
      resize,
    ]
  )

  return usePrimitive(
    "div",
    { ...props, className, ref },
    { editable, stacked },
    {
      "data-slot": "widget-grid",
      children: (
        <WidgetGridContext.Provider value={context}>
          {children}
        </WidgetGridContext.Provider>
      ),
    }
  )
}

type WidgetGridContentState = {
  editable: boolean
  stacked: boolean
  /** A widget is being dragged or resized. */
  active: boolean
}

type WidgetGridContentProps = PrimitiveProps<"div", WidgetGridContentState>

/** A cell of the grid, as a mask: a rounded rectangle one row tall. */
const cellMask = (rowHeight: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='${rowHeight}' rx='8'/></svg>`
  )}")`

/**
 * The cells of an editable grid, under its widgets: where they can go. One
 * strip per column, its cells drawn by a repeating mask, so a grid of any
 * length costs `columns` elements.
 */
function GridCells({
  rows,
  columns,
  rowHeight,
  gap,
}: {
  rows: number
  columns: number
  rowHeight: number
  gap: WidgetGridGap
}) {
  const mask = cellMask(rowHeight)
  const pitch = `calc(${rowHeight}px + ${spacing(gap)})`
  return Array.from({ length: columns }, (_, column) => (
    <div
      key={column}
      aria-hidden
      data-slot="widget-grid-cell"
      className="pointer-events-none animate-in bg-foreground/[0.035] duration-300 fade-in"
      style={{
        gridColumn: column + 1,
        gridRow: `1 / span ${rows}`,
        maskImage: mask,
        maskSize: `100% ${pitch}`,
        maskRepeat: "repeat-y",
        WebkitMaskImage: mask,
        WebkitMaskSize: `100% ${pitch}`,
        WebkitMaskRepeat: "repeat-y",
      }}
    />
  ))
}

/**
 * The grid itself: `columns` equal columns and rows of `rowHeight` px,
 * a `gap` step of the spacing scale apart (all three set on `WidgetGrid`). In the edit mode its cells
 * show under the widgets, with a row to spare at the bottom; while a
 * widget is resized (or moved from the keyboard) its size shows in its
 * corner, and a new widget dragged in from a source shows as a dashed
 * placeholder. Carries `data-editable`, `data-stacked` and `data-active`.
 */
function WidgetGridContent({
  className,
  style,
  children,
  ref,
  ...props
}: WidgetGridContentProps) {
  const context = useWidgetGrid("WidgetGridContent")
  const {
    store,
    dragAndDrop,
    byId,
    layout,
    columns,
    rowHeight,
    gap,
    editable,
    registerContent,
    press,
  } = context
  const stacked = useStore(store, (s) => s.stacked)
  const preview = useStore(store, (s) => s.preview)
  const resizing = useStore(store, (s) => s.resizing)
  const mode = useStore(dragAndDrop.store, (s) => s.mode)
  const dragged = useStore(dragAndDrop.store, (s) => s.dragging.at(0) ?? null)
  const shown = preview ?? layout
  // A new widget, dragged in from a source.
  const incoming =
    dragged !== null && !byId.has(dragged)
      ? shown.find((item) => item.id === dragged)
      : undefined
  const sized = resizing ?? (mode && mode !== "pointer" ? dragged : null)
  const sizedRect = sized ? shown.find((item) => item.id === sized) : undefined
  const rows = bottomOf(shown) + 1
  const active = mode !== null || resizing !== null
  const cells = React.useMemo(
    () =>
      editable && !stacked ? (
        <GridCells
          rows={rows}
          columns={columns}
          rowHeight={rowHeight}
          gap={gap}
        />
      ) : null,
    [editable, stacked, rows, columns, rowHeight, gap]
  )

  return usePrimitive(
    "div",
    {
      ...props,
      className: withClass("relative grid outline-none", className),
      style: (state: WidgetGridContentState) => ({
        gridTemplateColumns: stacked
          ? "minmax(0, 1fr)"
          : `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
        gap: spacing(gap),
        ...(typeof style === "function" ? style(state) : style),
      }),
      ref,
    },
    { editable, stacked, active },
    {
      ref: registerContent,
      "data-slot": "widget-grid-content",
      onPointerDownCapture: (event: React.PointerEvent<HTMLElement>) => {
        press.current = { x: event.clientX, y: event.clientY }
      },
      children: (
        <>
          {cells}
          {children}
          {incoming && (
            <div
              aria-hidden
              data-slot="widget-grid-placeholder"
              className="pointer-events-none rounded-xl border-2 border-dashed border-primary/60 bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))]"
              style={{
                gridColumn: `${incoming.x + 1} / span ${incoming.w}`,
                gridRow: `${incoming.y + 1} / span ${incoming.h}`,
              }}
            />
          )}
          {sizedRect && !stacked && (
            <div
              aria-hidden
              data-slot="widget-grid-size"
              dir="ltr"
              className="pointer-events-none relative z-20 m-2 self-end justify-self-end rounded-md bg-foreground px-1.5 py-0.5 font-mono text-xs text-background tabular-nums shadow-sm"
              style={{
                gridColumn: `${sizedRect.x + 1} / span ${sizedRect.w}`,
                gridRow: `${sizedRect.y + 1} / span ${sizedRect.h}`,
              }}
            >
              {sizedRect.w} × {sizedRect.h}
            </div>
          )}
          <DragAndDropPrimitive.DropIndicator
            data-slot="widget-grid-drop-indicator"
            dragAndDrop={dragAndDrop}
            getPlacement={() => null}
          />
        </>
      ),
    }
  )
}

type WidgetGridItemState = {
  /** Being dragged: "pointer" (it shows as the placeholder), "keyboard" or "virtual". */
  dragging: boolean
  resizing: boolean
  locked: boolean
}

type WidgetGridItemProps = PrimitiveProps<"div", WidgetGridItemState> & {
  /** The widget's `id` in the layout. */
  value: string
  /**
   * The widget's name, as its handles and the announcements say it
   * ("Drag Production", "Production moved to column 4, row 2, 6 by 4").
   */
  label: string
}

const ItemContext = React.createContext<{
  value: string
  label: string
  root: WidgetGridContextValue
} | null>(null)

function useItem(part: string) {
  const item = React.useContext(ItemContext)
  if (!item) throw new Error(`${part} must be used inside WidgetGridItem`)
  return item
}

/**
 * One widget, placed by its entry of the layout. Renders a `div`; pass
 * `render={<Panel />}` for a titled widget. While dragged with a pointer it
 * shows as a dashed placeholder where it will land (its content travels
 * with the pointer); from the keyboard it is lifted where it goes. Carries
 * `data-dragging` (the way it is dragged), `data-resizing` and
 * `data-locked`.
 */
function WidgetGridItem({
  value,
  label,
  className,
  style,
  children,
  ref,
  ...props
}: WidgetGridItemProps) {
  const root = useWidgetGrid("WidgetGridItem")
  const { store, dragAndDrop, byId, stackRows, registerItem } = root
  const committed = byId.get(value)
  // The place it shows, as a string: a preview that leaves it where it is
  // does not re-render it.
  const shown = useStore(store, (s) =>
    rectKey(s.previewById?.get(value) ?? committed)
  )
  const resizing = useStore(store, (s) => s.resizing === value)
  const dragMode = useStore(dragAndDrop.store, (s): DragMode | null =>
    s.dragging.includes(value) ? s.mode : null
  )
  const rect: GridRect | undefined = shown
    ? (() => {
        const [x, y, w, h] = shown.split(",").map(Number)
        return { x, y, w, h }
      })()
    : undefined
  const stackRow = stackRows?.get(value)
  const placement: React.CSSProperties =
    rect && stackRow !== undefined
      ? { gridColumn: "1 / -1", gridRow: `${stackRow} / span ${rect.h}` }
      : rect
        ? {
            gridColumn: `${rect.x + 1} / span ${rect.w}`,
            gridRow: `${rect.y + 1} / span ${rect.h}`,
          }
        : {}

  // The element as soon as it is attached, before any layout effect: a
  // new widget's preview lands on it in the commit that adds it.
  const entry = React.useRef<ItemEntry>({ element: null, label })
  const attach = React.useCallback((node: HTMLElement | null) => {
    entry.current.element = node
  }, [])
  React.useLayoutEffect(() => {
    entry.current.label = label
  }, [label])
  React.useLayoutEffect(
    () => registerItem(value, entry.current),
    [registerItem, value]
  )

  const item = React.useMemo(
    () => ({ value, label, root }),
    [value, label, root]
  )
  const state: WidgetGridItemState = {
    dragging: dragMode !== null,
    resizing,
    locked: !!committed?.locked,
  }

  return usePrimitive(
    "div",
    {
      ...props,
      className: withClass(
        cn(
          // Its content lays out on its own: live data inside a widget
          // never lays the grid out again, and a widget out of view is not
          // rendered at all.
          "relative min-h-0 min-w-0 [contain:layout_style] [content-visibility:auto]",
          // The pointer drags a copy: the widget is the placeholder where
          // it will land.
          "data-[dragging=pointer]:border-transparent data-[dragging=pointer]:bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))] data-[dragging=pointer]:shadow-none data-[dragging=pointer]:ring-0 data-[dragging=pointer]:outline-2 data-[dragging=pointer]:-outline-offset-2 data-[dragging=pointer]:outline-primary/60 data-[dragging=pointer]:outline-dashed data-[dragging=pointer]:*:invisible",
          // From the keyboard, or while resized, it is lifted.
          "data-[dragging=keyboard]:z-10 data-[dragging=keyboard]:shadow-lg data-[dragging=keyboard]:ring-2 data-[dragging=keyboard]:ring-ring data-[dragging=virtual]:z-10 data-[dragging=virtual]:ring-2 data-[dragging=virtual]:ring-ring",
          "data-resizing:z-10 data-resizing:shadow-lg data-resizing:ring-2 data-resizing:ring-primary/60 data-resizing:select-none"
        ),
        className
      ),
      style: (s: WidgetGridItemState) => ({
        ...placement,
        ...(typeof style === "function" ? style(s) : style),
      }),
      ref,
    },
    state,
    {
      ref: attach,
      "data-slot": "widget-grid-item",
      children: (
        <ItemContext.Provider value={item}>{children}</ItemContext.Provider>
      ),
    },
    { dragging: () => (dragMode ? { "data-dragging": dragMode } : null) }
  )
}

type WidgetGridHandleProps = Omit<
  PrimitiveProps<"button", { dragging: boolean }>,
  "value"
>

/**
 * The widget's grip, for its header: drag it to move the widget, or press
 * Enter or Space on it and move the widget with the arrow keys (Shift and
 * the arrow keys resize it). Named "Drag {label}". Only in the edit mode,
 * and never on a locked widget.
 */
function WidgetGridHandle({
  className,
  children,
  disabled,
  ...props
}: WidgetGridHandleProps) {
  const { root, value, label } = useItem("WidgetGridHandle")
  if (!root.editable || root.byId.get(value)?.locked) return null
  return (
    <DragAndDropPrimitive.Handle
      data-slot="widget-grid-handle"
      aria-description={root.t("handleDescription")}
      {...props}
      dragAndDrop={root.dragAndDrop as DragAndDrop<unknown>}
      value={value}
      label={label}
      tabIndex={0}
      disabled={disabled}
      className={withClass(
        cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "-ms-1 cursor-grab text-muted-foreground data-dragging:cursor-grabbing"
        ),
        className
      )}
    >
      {children ?? <GripIcon />}
    </DragAndDropPrimitive.Handle>
  )
}

/** Two strokes in the corner, as a window's resize grip draws them. */
function ResizeGlyph() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M11 4 4 11M11 8l-3 3" />
    </svg>
  )
}

type WidgetGridResizeHandleProps = PrimitiveProps<"span", { resizing: boolean }>

/**
 * The widget's resize grip, in its bottom corner on the inline end side
 * (bottom right, bottom left in a right-to-left page): drag it and the
 * widget snaps to whole cells, within its size limits, with its size
 * shown. A pointer's control: from the keyboard, Shift and the arrow keys
 * resize a picked-up widget. Only in the edit mode.
 */
function WidgetGridResizeHandle({
  className,
  children,
  ...props
}: WidgetGridResizeHandleProps) {
  const { root, value, label } = useItem("WidgetGridResizeHandle")
  const resizing = useStore(root.store, (s) => s.resizing === value)
  const element = usePrimitive(
    "span",
    {
      ...props,
      className: withClass(
        "absolute end-0 bottom-0 z-10 flex size-6 cursor-nwse-resize touch-none items-end justify-end p-1 text-muted-foreground/70 transition-colors select-none hover:text-foreground data-resizing:text-primary rtl:cursor-nesw-resize [&_svg]:size-3 rtl:[&_svg]:-scale-x-100",
        className
      ),
    },
    { resizing },
    {
      "aria-hidden": true,
      "data-slot": "widget-grid-resize-handle",
      title: root.t("resizeItem", { itemText: label }),
      onPointerDown: (event: React.PointerEvent<HTMLElement>) =>
        root.startResize(event, value),
      children: children ?? <ResizeGlyph />,
    }
  )
  if (!root.editable || root.byId.get(value)?.locked) return null
  return element
}

type WidgetGridRemoveProps = PrimitiveProps<"button", object>

/**
 * Removes the widget at once (offer an undo, rather than asking first):
 * the others close the gap, focus goes to the next widget's handle, and
 * "{label} removed." is announced. An icon button named "Remove {label}";
 * only in the edit mode, and never on a locked widget.
 */
function WidgetGridRemove({
  className,
  children,
  ...props
}: WidgetGridRemoveProps) {
  const { root, value, label } = useItem("WidgetGridRemove")
  const element = usePrimitive(
    "button",
    {
      ...props,
      className: withClass(
        cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "text-muted-foreground"
        ),
        className
      ),
    },
    {},
    {
      type: "button",
      "data-slot": "widget-grid-remove",
      "aria-label": root.t("removeItem", { itemText: label }),
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!event.defaultPrevented) root.remove(value)
      },
      children: children ?? <XIcon />,
    }
  )
  if (!root.editable || root.byId.get(value)?.locked) return null
  return element
}

type WidgetGridSourceProps = Omit<
  PrimitiveProps<"button", { disabled: boolean }>,
  "value"
> & {
  /** The `id` the new widget gets in the layout. */
  value: string
  /** The widget's name, for the announcements. */
  label: string
  /** The new widget's size, in cells. */
  w: number
  h: number
  /** The new widget's size limits, in cells. */
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
}

/**
 * A widget of the catalog, not yet on the grid: press it to add the widget
 * at the first free place, or drag it to the place it goes (a finger:
 * after a long press). Renders a `button`; put it anywhere inside
 * `WidgetGrid` (a side `Panel` of widgets beside the grid). Disabled out of
 * the edit mode and while a widget with its `value` is on the grid.
 */
function WidgetGridSource({
  value,
  label,
  w,
  h,
  minW,
  maxW,
  minH,
  maxH,
  disabled,
  className,
  children,
  ref,
  ...props
}: WidgetGridSourceProps) {
  const root = useWidgetGrid("WidgetGridSource")
  const off = !!disabled || !root.editable || root.byId.has(value)
  const entry = React.useRef<SourceEntry>({
    element: null,
    label,
    item: { id: value, x: 0, y: 0, w, h },
  })
  const attach = React.useCallback((node: HTMLElement | null) => {
    entry.current.element = node
  }, [])
  React.useLayoutEffect(() => {
    entry.current.label = label
    entry.current.item = { id: value, x: 0, y: 0, w, h, minW, maxW, minH, maxH }
  }, [value, label, w, h, minW, maxW, minH, maxH])
  React.useLayoutEffect(
    () => root.registerSource(value, entry.current),
    [root.registerSource, value]
  )
  return usePrimitive(
    "button",
    {
      ...props,
      className: withClass(
        "cursor-grab select-none disabled:cursor-default",
        className
      ),
      ref,
    },
    { disabled: off },
    {
      ref: attach,
      type: "button",
      "data-slot": "widget-grid-source",
      disabled: off,
      "aria-description": root.t("sourceDescription"),
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (!off) root.dragAndDrop.onPointerDown(event, value)
      },
      // An image inside would start the browser's own drag.
      onDragStart: (event: React.DragEvent<HTMLElement>) =>
        event.preventDefault(),
      onClick: () => {
        if (!off) root.add(value)
      },
      children,
    }
  )
}

type WidgetGridItemActions = {
  /** The widget's `id`. */
  value: string
  label: string
  /** Its entry of the layout, as it shows. */
  layout: WidgetGridLayoutItem | undefined
  /** Whether its layout can be changed now (the edit mode, not locked). */
  editable: boolean
  /** Moves it one place that way (past the widget in the way, if need be). */
  move: (direction: MoveDirection) => void
  /** Whether `move(direction)` would move it. */
  canMove: (direction: MoveDirection) => boolean
  /** Resizes it to `w` × `h` cells, within its limits (a size preset). */
  resize: (size: { w: number; h: number }) => void
  remove: () => void
}

/**
 * The actions of the `WidgetGridItem` around it, for a widget's menu: the
 * way to move, resize and remove a widget with a single press, without
 * dragging (`Move left`, size presets such as `Small` / `Large`). Each one
 * is announced, as a drag's drop is.
 */
function useWidgetGridItem(): WidgetGridItemActions {
  const { root, value, label } = useItem("useWidgetGridItem")
  const entry = root.byId.get(value)
  return {
    value,
    label,
    layout: entry,
    editable: root.editable && !!entry && !entry.locked,
    move: (direction) => root.move(value, direction),
    canMove: (direction) =>
      root.editable && !!entry && !!root.canMove(value, direction),
    resize: (size) => root.resize(value, size),
    remove: () => root.remove(value),
  }
}

export {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridItem,
  WidgetGridHandle,
  WidgetGridResizeHandle,
  WidgetGridRemove,
  WidgetGridSource,
  useWidgetGridItem,
}
export type {
  WidgetGridProps,
  WidgetGridContentProps,
  WidgetGridItemProps,
  WidgetGridHandleProps,
  WidgetGridResizeHandleProps,
  WidgetGridRemoveProps,
  WidgetGridSourceProps,
  WidgetGridLayoutItem,
  WidgetGridGap,
  WidgetGridChangeDetails,
  WidgetGridChangeReason,
  WidgetGridItemActions,
}
