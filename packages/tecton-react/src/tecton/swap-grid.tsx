"use client"

import * as React from "react"
import { cn } from "cn"
import { GripIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"
import { usePortalTarget } from "@tecton/react/tecton/portal"
import { useDirection } from "@tecton/react/tecton/provider"

import { useDropAnimation } from "./internal/primitives/drag-and-drop/drop-animation"
import * as DragAndDropPrimitive from "./internal/primitives/drag-and-drop/index.parts"
import type { Point } from "./internal/primitives/drag-and-drop/pointer-drag"
import {
  useDragAndDrop,
  type DragAndDrop,
  type DragMode,
  type DropStrategy,
} from "./internal/primitives/drag-and-drop/use-drag-and-drop"
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "./internal/primitives/event-details"
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
import { useStore } from "./internal/store"

/**
 * Tecton SwapGrid — a layout of slots whose items the user rearranges by
 * swapping them: a dashboard of tiles of several sizes, a bento grid. The
 * slots are the layout and never move; an item dragged over another slot
 * swaps with the item there, live, so the result shows before the drop;
 * over an empty slot it moves there. Only the two items change places.
 *
 * The value is which item each slot holds, `{ [slot]: item | null }`. Each
 * `SwapGridSlot` renders the item it holds through its children function,
 * which receives the item while a drag shows the swap. Enter or Space on a
 * handle starts a keyboard drag: the arrow keys move between the slots by
 * where they are, Enter drops, Escape cancels; each step is announced.
 */

type SwapGridValue = Readonly<Record<string, string | null>>

type SwapGridChangeDetails = ChangeEventDetails<DragMode>

/** A slot a drag is aimed at. */
type SlotPlace = { slot: string }

type SlotEntry = { element: HTMLElement | null; label: string | undefined }
type ItemEntry = { element: HTMLElement | null; label: string }

/** `value` with `item` swapped into `slot` (and the item there into its slot). */
function swap(value: SwapGridValue, item: string, slot: string) {
  const from = Object.keys(value).find((key) => value[key] === item)
  if (from === undefined || from === slot) return value
  return { ...value, [slot]: item, [from]: value[slot] ?? null }
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

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/**
 * The drop strategy of a swap grid: a drop goes into the slot under the
 * pointer (the nearest one, over the gutter between slots); the arrow keys
 * go to the nearest slot that way.
 */
function createSlotStrategy({
  slots,
  value,
  itemLabel,
  t,
}: {
  slots: () => Array<{ value: string; element: HTMLElement; label: string }>
  value: () => SwapGridValue
  itemLabel: (item: string) => string
  /** The swap grid's strings, in the provider's locale. */
  t: () => Translator<"swapGrid">
}): DropStrategy<SlotPlace> {
  const originOf = (dragging: ReadonlyArray<string>) => {
    const current = value()
    return Object.keys(current).find((key) => current[key] === dragging[0])
  }
  /** The distance between the ranges `[a1, a2]` and `[b1, b2]` (0 when they overlap). */
  const apart = (a1: number, a2: number, b1: number, b2: number) =>
    Math.max(0, Math.max(a1, b1) - Math.min(a2, b2))
  return {
    placeAt(point: Point, dragging) {
      const list = slots()
      let nearest: (typeof list)[number] | undefined
      let distance = Infinity
      for (const slot of list) {
        const rect = slot.element.getBoundingClientRect()
        const dx = Math.max(rect.left - point.x, 0, point.x - rect.right)
        const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom)
        const d = Math.hypot(dx, dy)
        if (d < distance) [nearest, distance] = [slot, d]
      }
      // Over the gutter between slots the nearest one still holds; well
      // outside the grid nothing does.
      const gutter = nearest
        ? parseFloat(
            getComputedStyle(nearest.element.parentElement ?? nearest.element)
              .gap
          ) || 16
        : 0
      if (!nearest || distance > gutter) return null
      if (nearest.value === originOf(dragging)) return null
      return { slot: nearest.value }
    },

    // Every slot in document order, starting on the item's own: a
    // keyboard drag shows no swap until a key aims one.
    places(dragging) {
      const list = slots()
      const origin = originOf(dragging)
      return {
        places: list.map((slot) => ({ slot: slot.value })),
        start: Math.max(
          list.findIndex((slot) => slot.value === origin),
          0
        ),
      }
    },

    isSame: (a, b) => a.slot === b.slot,

    label({ slot }, _t, dragging) {
      const own = t()
      const item = value()[slot]
      if (item && item === dragging[0])
        return own("stay", { itemText: itemLabel(item) })
      if (item) return own("swapWith", { itemText: itemLabel(item) })
      const list = slots()
      const index = list.findIndex((s) => s.value === slot)
      return own("moveTo", {
        slotText:
          list[index]?.label ?? own("slot", { index: String(index + 1) }),
      })
    },

    // The arrow keys: the nearest slot wholly that way, in the same row or
    // column first.
    move(event, place, dragging) {
      const way = ARROWS[event.key] as { x: number; y: number } | undefined
      if (!way) return undefined
      const list = slots()
      const from =
        list.find((slot) => slot.value === place?.slot) ??
        list.find((slot) => slot.value === originOf(dragging))
      if (!from) return place
      const r = from.element.getBoundingClientRect()
      let best: SlotPlace | null = place
      let score = Infinity
      for (const slot of list) {
        if (slot.value === from.value) continue
        const c = slot.element.getBoundingClientRect()
        const ahead =
          way.x < 0
            ? r.left - c.right
            : way.x > 0
              ? c.left - r.right
              : way.y < 0
                ? r.top - c.bottom
                : c.top - r.bottom
        if (ahead < -1) continue
        const aside = way.x
          ? apart(c.top, c.bottom, r.top, r.bottom)
          : apart(c.left, c.right, r.left, r.right)
        const s = Math.max(ahead, 0) + aside * 3
        if (s < score) [best, score] = [{ slot: slot.value }, s]
      }
      return best
    },

    onAim(place, mode) {
      if (!place || mode === "pointer") return
      slots()
        .find((slot) => slot.value === place.slot)
        ?.element.scrollIntoView({ block: "nearest", inline: "nearest" })
    },
  }
}

type SwapGridState = { dragging: boolean; disabled: boolean }

type SwapGridProps = Omit<
  PrimitiveProps<"div", SwapGridState>,
  "defaultValue" | "onChange"
> & {
  /** Which item each slot holds, `{ [slot]: item | null }` (controlled). */
  value?: SwapGridValue
  /** The initial items of the slots, when not controlled. */
  defaultValue?: SwapGridValue
  /** Called with the slots' new items when a drop swaps two of them. */
  onValueChange?: (
    value: Record<string, string | null>,
    eventDetails: SwapGridChangeDetails
  ) => void
  /** Turns every handle off. */
  disabled?: boolean
  /**
   * Animates the swap: the items glide between their slots, and the
   * dropped one from where it was let go. Default `true`; never when the
   * user prefers reduced motion.
   */
  dropAnimation?: boolean
}

type SwapGridContextValue = {
  dragAndDrop: DragAndDrop<SlotPlace>
  disabled: boolean
  /** The slots' items as shown: with the aimed swap while a drag aims one. */
  shown: SwapGridValue
  registerSlot: (value: string, entry: SlotEntry) => () => void
  registerItem: (value: string, entry: ItemEntry) => () => void
}

const SwapGridContext = React.createContext<SwapGridContextValue | null>(null)

function useSwapGrid(part: string) {
  const context = React.useContext(SwapGridContext)
  if (!context) throw new Error(`${part} must be used inside SwapGrid`)
  return context
}

/**
 * The grid: a `div` around the slots. Lay the slots out with your own
 * classes (`grid grid-cols-4 auto-rows-[8rem] gap-3`); each slot's span is
 * the size of whatever item it holds.
 */
function SwapGrid({
  value: valueProp,
  defaultValue = {},
  onValueChange,
  disabled = false,
  dropAnimation = true,
  className,
  children,
  ref,
  ...props
}: SwapGridProps) {
  const [value, setValue] = useControlled(valueProp, defaultValue)
  const direction = useDirection()
  const portal = usePortalTarget()
  const root = React.useRef<HTMLDivElement | null>(null)
  const [slotRegistry] = React.useState(() => new Map<string, SlotEntry>())
  const [itemRegistry] = React.useState(() => new Map<string, ItemEntry>())

  const t = useTranslations("swapGrid")
  const latest = React.useRef(value)
  const latestT = React.useRef(t)
  React.useInsertionEffect(() => {
    latest.current = value
    latestT.current = t
  })

  const animation = useDropAnimation({
    disabled: !dropAnimation,
    items: () =>
      [...itemRegistry].map(([key, entry]) => [key, entry.element] as const),
  })

  const [strategy] = React.useState(() => {
    const slots = createSlotStrategy({
      // The slots on the page, in document order.
      slots: () =>
        [...slotRegistry]
          .flatMap(([key, entry]) =>
            entry.element
              ? [{ value: key, element: entry.element, label: entry.label }]
              : []
          )
          .sort((a, b) =>
            a.element.compareDocumentPosition(b.element) &
            Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1
          ) as Array<{ value: string; element: HTMLElement; label: string }>,
      value: () => latest.current,
      itemLabel: (item) => itemRegistry.get(item)?.label ?? item,
      t: () => latestT.current,
    })
    return {
      ...slots,
      // Each swap shown while dragging glides into place.
      onAim: (place: SlotPlace | null, mode: DragMode) => {
        animation.capture([], null)
        slots.onAim?.(place, mode)
      },
    }
  })

  const mode = React.useRef<DragMode>("pointer")
  const change = useEventCallback(
    (
      place: SlotPlace,
      keys: ReadonlyArray<string>,
      { from }: { from: DOMRect | null }
    ) => {
      const key = keys.at(0)
      if (key === undefined) return
      const current = latest.current
      const next = swap(current, key, place.slot)
      if (next === current) return
      const details = createChangeEventDetails(mode.current)
      animation.capture([key], from)
      onValueChange?.(next, details)
      if (!details.isCanceled) setValue(next)
    }
  )

  const dragAndDrop = useDragAndDrop<SlotPlace>({
    strategy,
    // Tab steps through the slots in document order; the arrow keys go by
    // where they are (the strategy's `move`).
    axis: "x",
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) => itemRegistry.get(key)?.element ?? null,
    getContainer: () => root.current,
    getPreviewContainer: () => portal ?? null,
    onDragStart: (_keys, dragMode) => {
      mode.current = dragMode
    },
    onDrop: change,
    focusItem: (key) => {
      const element = itemRegistry.get(key)?.element
      const handle = element?.querySelector<HTMLElement>(
        '[data-slot="swap-grid-handle"]'
      )
      ;(handle ?? element)?.focus()
    },
  })

  const dragging = useStore(dragAndDrop.store, (s) => s.dragging.at(0))
  const aimed = useStore(dragAndDrop.store, (s) => s.aimed)
  const shown = React.useMemo(
    () =>
      dragging !== undefined && aimed
        ? swap(value, dragging, aimed.slot)
        : value,
    [value, dragging, aimed]
  )

  const registerSlot = React.useCallback(
    (key: string, entry: SlotEntry) => {
      slotRegistry.set(key, entry)
      return () => {
        if (slotRegistry.get(key) === entry) slotRegistry.delete(key)
      }
    },
    [slotRegistry]
  )
  const registerItem = React.useCallback(
    (key: string, entry: ItemEntry) => {
      itemRegistry.set(key, entry)
      return () => {
        if (itemRegistry.get(key) === entry) itemRegistry.delete(key)
      }
    },
    [itemRegistry]
  )

  const context = React.useMemo<SwapGridContextValue>(
    () => ({ dragAndDrop, disabled, shown, registerSlot, registerItem }),
    [dragAndDrop, disabled, shown, registerSlot, registerItem]
  )

  return usePrimitive(
    "div",
    { ...props, className, ref },
    { dragging: dragging !== undefined, disabled },
    {
      ref: root,
      "data-slot": "swap-grid",
      children: (
        <SwapGridContext.Provider value={context}>
          {children}
          {/* No line: the swap shows itself. The keyboard's and a screen
              reader's drop targets. */}
          <DragAndDropPrimitive.DropIndicator
            data-slot="swap-grid-drop-targets"
            dragAndDrop={dragAndDrop}
            getPlacement={() => null}
          />
        </SwapGridContext.Provider>
      ),
    },
    { disabled: hidden }
  )
}

type SwapGridSlotState = {
  /** The slot holds no item. */
  empty: boolean
  /** A drag is aimed at this slot. */
  dropTarget: boolean
}

type SwapGridSlotProps = Omit<
  PrimitiveProps<"div", SwapGridSlotState>,
  "children"
> & {
  /** The slot's key in the grid's `value`. */
  value: string
  /** The slot's name, as an empty slot is announced ("Move to {label}"). */
  label?: string
  /**
   * The slot's content: a function of the item it holds (`null` when it is
   * empty), which a drag aimed at a swap calls with the swapped item.
   */
  children?: React.ReactNode | ((item: string | null) => React.ReactNode)
}

/**
 * One place of the layout. Renders a `div`; give it its size in the grid
 * (`col-span-2 row-span-2`). An empty slot shows a dashed outline, the
 * aimed slot a ring; both carry `data-empty` / `data-drop-target`.
 */
function SwapGridSlot({
  value,
  label,
  className,
  children,
  ref,
  ...props
}: SwapGridSlotProps) {
  const { dragAndDrop, shown, registerSlot } = useSwapGrid("SwapGridSlot")
  const item = shown[value] ?? null
  const dropTarget = useStore(dragAndDrop.store, (s) => s.aimed?.slot === value)
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(
    () => registerSlot(value, { element, label }),
    [registerSlot, value, element, label]
  )
  return usePrimitive(
    "div",
    {
      ...props,
      className: withClass(
        "relative min-w-0 rounded-xl outline-offset-2 data-drop-target:outline-2 data-drop-target:outline-primary data-empty:border-2 data-empty:border-dashed data-empty:border-border",
        className
      ),
      ref,
    },
    { empty: item === null, dropTarget },
    {
      ref: setElement,
      "data-slot": "swap-grid-slot",
      children: typeof children === "function" ? children(item) : children,
    },
    {
      dropTarget: (aimed) => (aimed ? { "data-drop-target": "" } : null),
    }
  )
}

type SwapGridItemState = { dragging: boolean }

type SwapGridItemProps = PrimitiveProps<"div", SwapGridItemState> & {
  /** The item's key, as the grid's `value` holds it. */
  value: string
  /** The item's name, as the handle and the announcements say it. */
  label: string
  /**
   * `false`: the item is its own handle, dragged from anywhere on it (its
   * text fields keep their presses). Default `true`: drags start from a
   * `SwapGridHandle`.
   */
  dragHandle?: boolean
}

const FIELD = 'input, select, textarea, [contenteditable="true"]'

const ItemContext = React.createContext<{
  value: string
  label: string
  grid: SwapGridContextValue
} | null>(null)

/**
 * The item a slot holds. Renders a `div` filling the slot; pass
 * `render={<Card />}` for a card. Carries `data-dragging` while dragged.
 */
function SwapGridItem({
  value,
  label,
  dragHandle = true,
  className,
  children,
  ref,
  ...props
}: SwapGridItemProps) {
  const grid = useSwapGrid("SwapGridItem")
  const { dragAndDrop, registerItem, disabled } = grid
  const t = useTranslations("dragAndDrop")
  const self = !dragHandle && !disabled
  const dragging = useStore(dragAndDrop.store, (s) =>
    s.dragging.includes(value)
  )
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(
    () => registerItem(value, { element, label }),
    [registerItem, value, element, label]
  )
  const item = React.useMemo(
    () => ({ value, label, grid }),
    [value, label, grid]
  )

  return usePrimitive(
    "div",
    {
      ...props,
      className: withClass(
        cn(
          "size-full data-dragging:opacity-50",
          self &&
            "cursor-grab outline-none select-none focus-visible:ring-2 focus-visible:ring-ring data-dragging:cursor-grabbing"
        ),
        className
      ),
      ref,
    },
    { dragging },
    {
      ref: setElement,
      "data-slot": "swap-grid-item",
      ...(self && {
        tabIndex: 0,
        "aria-description": t("dragItem", { itemText: label }),
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
          const field = (event.target as Element).closest(FIELD)
          if (!field || !event.currentTarget.contains(field))
            dragAndDrop.onPointerDown(event, value)
        },
        onDragStart: (event: React.DragEvent<HTMLElement>) =>
          event.preventDefault(),
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          if (event.target === event.currentTarget)
            dragAndDrop.onHandleKeyDown(event, value)
        },
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          if (event.target === event.currentTarget)
            dragAndDrop.onHandleClick(event, value)
        },
      }),
      children: (
        <ItemContext.Provider value={item}>{children}</ItemContext.Provider>
      ),
    }
  )
}

type SwapGridHandleProps = Omit<
  PrimitiveProps<"button", { dragging: boolean }>,
  "value"
>

/**
 * The item's grip: drag it, or press Enter or Space on it to move the item
 * with the keyboard. Named "Drag {label}". A grip icon by default.
 */
function SwapGridHandle({
  className,
  children,
  disabled,
  ...props
}: SwapGridHandleProps) {
  const item = React.useContext(ItemContext)
  if (!item) throw new Error("SwapGridHandle must be used inside SwapGridItem")
  const off = item.grid.disabled || !!disabled
  return (
    <DragAndDropPrimitive.Handle
      data-slot="swap-grid-handle"
      {...props}
      dragAndDrop={item.grid.dragAndDrop as DragAndDrop<unknown>}
      value={item.value}
      label={item.label}
      disabled={off}
      // Browsers still send pointer events to a disabled button.
      onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
        if (off) event.preventDefault()
        props.onPointerDown?.(event)
      }}
      className={withClass(
        cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "cursor-grab text-muted-foreground data-dragging:cursor-grabbing"
        ),
        className
      )}
    >
      {children ?? <GripIcon />}
    </DragAndDropPrimitive.Handle>
  )
}

export { SwapGrid, SwapGridSlot, SwapGridItem, SwapGridHandle }
export type {
  SwapGridProps,
  SwapGridSlotProps,
  SwapGridItemProps,
  SwapGridHandleProps,
  SwapGridChangeDetails,
  SwapGridValue,
}
