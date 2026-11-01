"use client"

import * as React from "react"
import { cn } from "cn"
import { GripHorizontalIcon, GripIcon, GripVerticalIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"
import { usePortalTarget } from "@tecton/react/tecton/portal"
import { useDirection } from "@tecton/react/tecton/provider"

import {
  animateFrom,
  settle,
  useDropAnimation,
} from "./internal/primitives/drag-and-drop/drop-animation"
import {
  createListStrategy,
  listPlacement,
  moveInList,
  type ListAxis,
  type ListDropPlace,
  type ListItem,
} from "./internal/primitives/drag-and-drop/list-strategy"
import * as DragAndDropPrimitive from "./internal/primitives/drag-and-drop/index.parts"
import {
  createSlotStrategy,
  swapInList,
  type SlotDropPlace,
  type SlotItem,
} from "./internal/primitives/drag-and-drop/slot-strategy"
import {
  scrollerOf,
  stickyTopOf,
} from "./internal/primitives/drag-and-drop/pointer-drag"
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
import { useTranslations } from "./internal/i18n/translations"
import { useStore } from "./internal/store"

/**
 * Tecton Reorderable — items the user puts in order by dragging their
 * handle: table rows, table columns, a stack of items or a grid of cards. A
 * mouse, a pen or a finger drags the handle and a line shows where the item
 * will land; Enter or Space on the handle starts a keyboard drag (the arrow
 * keys or Tab pick the gap, Enter drops, Escape cancels); a screen reader's
 * activation turns every gap into a button. Each step is announced.
 *
 * The order is `value`, an array of item values; the items render in that
 * order. Items left out of the page (another page of rows, a hidden column)
 * keep their place in `value`: a drop moves the item next to the item it
 * landed beside.
 *
 * `Reorderable` is a `div` around the items: around the `Table`, not its
 * body, so the line and the drop targets stay out of the table's markup.
 *
 * A drop animates: the dropped item glides from where it was let go into
 * its place and the items it passes slide aside (`dropAnimation`).
 *
 * `mode="swap"` keeps the layout instead: each `ReorderableSlot` is a fixed
 * place (a tile of a bento grid), `value[i]` the item slot `i` holds or
 * `null`, and a drop swaps the dragged item with the one in the slot it is
 * dropped on, or moves it into an empty slot. The swap shows while the
 * item is dragged over the slot; only the two slots change.
 */

type ReorderableChangeDetails = ChangeEventDetails<DragMode>

type ReorderableOrientation = "vertical" | "horizontal" | "grid"

type ReorderableMode = "insert" | "swap"

/** Where a drop goes: a gap between items, or a slot (`mode="swap"`). */
type ReorderPlace = ListDropPlace | SlotDropPlace

const isSlot = (
  place: ReorderPlace | null | undefined
): place is SlotDropPlace => !!place && "slot" in place

/** `base` and the caller's class, which may be a function of the state. */
function withClass<TState>(
  base: string,
  className: string | ((state: TState) => string | undefined) | undefined
) {
  return typeof className === "function"
    ? (state: TState) => cn(base, className(state))
    : cn(base, className)
}

type ReorderableState = {
  orientation: ReorderableOrientation
  mode: ReorderableMode
  dragging: boolean
  disabled: boolean
}

type ReorderableInsertProps = {
  /**
   * "insert" (default): a drop moves the item into a gap between the
   * others, which close up behind it. "swap": the items sit in fixed
   * `ReorderableSlot`s and a drop swaps two of them.
   */
  mode?: "insert"
  /** The values of the items, in order (controlled). */
  value?: ReadonlyArray<string>
  /** The initial order, when not controlled. */
  defaultValue?: ReadonlyArray<string>
  /** Called with the new order when an item is dropped in another place. */
  onValueChange?: (
    value: Array<string>,
    eventDetails: ReorderableChangeDetails
  ) => void
}

type ReorderableSwapProps = {
  /**
   * "swap": the items sit in fixed `ReorderableSlot`s and a drop swaps two
   * of them. "insert" (default): a drop moves the item into a gap.
   */
  mode: "swap"
  /** The item each slot holds, in slot order; `null` for an empty slot (controlled). */
  value?: ReadonlyArray<string | null>
  /** The slots' initial items, when not controlled. */
  defaultValue?: ReadonlyArray<string | null>
  /** Called with the slots' new items when a drop swaps two of them. */
  onValueChange?: (
    value: Array<string | null>,
    eventDetails: ReorderableChangeDetails
  ) => void
}

type ReorderableProps = Omit<
  PrimitiveProps<"div", ReorderableState>,
  "defaultValue" | "onChange"
> &
  (ReorderableInsertProps | ReorderableSwapProps) & {
    /**
     * "vertical" (default): the items are stacked, as table rows are.
     * "horizontal": the items are side by side, as table columns are.
     * "grid": the items fill rows that wrap, in reading order (a CSS grid of
     * cards, a wrapping flex row).
     */
    orientation?: ReorderableOrientation
    /** Turns every handle off. */
    disabled?: boolean
    /**
     * Animates a drop: the dropped item glides from where it was let go into
     * its place, and the items it passes slide aside. Default `true`; never
     * when the user prefers reduced motion.
     */
    dropAnimation?: boolean
  }

type Entry = { element: HTMLElement | null; label: string }

/**
 * Scrolls `element` into view along `axis` within its nearest scroll
 * container, the least needed, clear of a sticky table header.
 */
function reveal(element: HTMLElement, axis: "x" | "y") {
  const scroller = scrollerOf(element, axis)
  if (!scroller) return
  const page = scroller === element.ownerDocument.scrollingElement
  const view = element.ownerDocument.defaultView ?? window
  const box = page
    ? { top: 0, bottom: view.innerHeight, left: 0, right: view.innerWidth }
    : scroller.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  if (axis === "y") {
    const top = box.top + stickyTopOf(scroller)
    if (rect.top < top) scroller.scrollTop -= top - rect.top
    else if (rect.bottom > box.bottom)
      scroller.scrollTop += rect.bottom - box.bottom
  } else if (rect.left < box.left) {
    scroller.scrollLeft -= box.left - rect.left
  } else if (rect.right > box.right) {
    scroller.scrollLeft += rect.right - box.right
  }
}

type ReorderableContextValue = {
  dragAndDrop: DragAndDrop<ReorderPlace>
  /** `mode="swap"`: the items sit in slots. */
  swap: boolean
  registerSlot: (element: HTMLElement, label: string | undefined) => () => void
  /** The slot at `index`, in document order. */
  slotAt: (index: number) => HTMLElement | undefined
  orientation: ReorderableOrientation
  disabled: boolean
  register: (value: string, entry: Entry) => () => void
  /** Whether `value` is one of this list's items. */
  has: (value: string) => boolean
  /** The `Reorderable` around this one, if any. */
  parent: ReorderableContextValue | null
}

const ReorderableContext = React.createContext<ReorderableContextValue | null>(
  null
)

/**
 * The `Reorderable` an item belongs to: the nearest one whose `value`
 * holds it, so a table can reorder its rows and its columns with one
 * `Reorderable` inside the other; the nearest one otherwise.
 */
function useReorderable(part: string, value: string) {
  const context = React.useContext(ReorderableContext)
  if (!context) throw new Error(`${part} must be used inside Reorderable`)
  let root: ReorderableContextValue | null = context
  while (root && !root.has(value)) root = root.parent
  return root ?? context
}

function Reorderable({
  value: valueProp,
  defaultValue = [],
  onValueChange: onValueChangeProp,
  mode = "insert",
  orientation = "vertical",
  disabled = false,
  dropAnimation = true,
  className,
  children,
  ref,
  ...props
}: ReorderableProps) {
  const [value, setValue] = useControlled<ReadonlyArray<string | null>>(
    valueProp,
    defaultValue
  )
  // One signature for both modes: an insert never puts `null` in.
  const onValueChange = onValueChangeProp as
    | ((
        value: Array<string | null>,
        eventDetails: ReorderableChangeDetails
      ) => void)
    | undefined
  const swap = mode === "swap"
  const t = useTranslations("reorderable")
  const direction = useDirection()
  const portal = usePortalTarget()
  const root = React.useRef<HTMLDivElement | null>(null)
  const [registry] = React.useState(() => new Map<string, Entry>())
  const axis: ListAxis =
    orientation === "horizontal" ? "x" : orientation === "grid" ? "grid" : "y"

  const latest = React.useRef({
    value,
    axis,
    direction,
    swap,
    t,
    dropAnimation,
  })
  React.useInsertionEffect(() => {
    latest.current = { value, axis, direction, swap, t, dropAnimation }
  })

  /** The items on the page, in order. */
  const shown = React.useCallback(
    (): Array<ListItem> =>
      latest.current.value.flatMap((key) => {
        if (key === null) return []
        const entry = registry.get(key)
        return entry?.element
          ? [{ value: key, element: entry.element, label: entry.label }]
          : []
      }),
    [registry]
  )

  // The slots of `mode="swap"`, in document order.
  const [slotRegistry] = React.useState(
    () => new Map<HTMLElement, string | undefined>()
  )
  const slotElements = React.useCallback(
    () =>
      [...slotRegistry.keys()].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      ),
    [slotRegistry]
  )
  const slotItems = React.useCallback(
    (): Array<SlotItem> =>
      slotElements().map((element, index) => {
        const item = latest.current.value[index] ?? null
        return {
          element,
          item,
          itemLabel: item === null ? null : (registry.get(item)?.label ?? item),
          label: slotRegistry.get(element),
        }
      }),
    [slotElements, slotRegistry, registry]
  )

  // The swap a drag shows (`mode="swap"`): the items moved into other
  // slots, with the inline styles they had before.
  const preview = React.useRef(
    new Map<HTMLElement, Partial<CSSStyleDeclaration>>()
  )
  const dragApi = React.useRef<DragAndDrop<ReorderPlace> | null>(null)
  const restyle = React.useCallback(
    (moves: ReadonlyArray<readonly [HTMLElement, HTMLElement]>) => {
      const styled = preview.current
      const before = new Map<HTMLElement, DOMRect>()
      // Where they show now (mid-animation, perhaps), then at rest: the
      // boxes they move into are measured from where they rest.
      for (const element of [...styled.keys(), ...moves.map(([e]) => e)])
        if (element.isConnected)
          before.set(element, element.getBoundingClientRect())
      for (const element of before.keys()) settle(element)
      for (const [element, saved] of styled) Object.assign(element.style, saved)
      styled.clear()
      for (const [element, slot] of moves) {
        const natural = element.getBoundingClientRect()
        const own =
          element
            .closest<HTMLElement>('[data-slot="reorderable-slot"]')
            ?.getBoundingClientRect() ?? natural
        const to = slot.getBoundingClientRect()
        const { position, zIndex, translate, width, height } = element.style
        styled.set(element, { position, zIndex, translate, width, height })
        Object.assign(element.style, {
          position:
            getComputedStyle(element).position === "static"
              ? "relative"
              : position,
          zIndex: "1",
          translate: `${to.left - own.left}px ${to.top - own.top}px`,
          width: `${natural.width + to.width - own.width}px`,
          height: `${natural.height + to.height - own.height}px`,
        })
      }
      animateFrom(before, !latest.current.dropAnimation)
    },
    []
  )

  const [strategy] = React.useState((): DropStrategy<ReorderPlace> => {
    const list = createListStrategy({
      items: shown,
      axis: () => latest.current.axis,
      direction: () => latest.current.direction,
    })
    const slots = createSlotStrategy({
      slots: slotItems,
      t: () => latest.current.t,
    })
    const pick = () =>
      (latest.current.swap ? slots : list) as DropStrategy<ReorderPlace>
    return {
      placeAt: (point, dragging) => pick().placeAt(point, dragging),
      places: (dragging) => pick().places(dragging),
      isSame: (a, b) => isSlot(a) === isSlot(b) && pick().isSame(a, b),
      isStop: (a, b) => (pick().isStop ?? pick().isSame)(a, b),
      label: (place, translate, dragging) =>
        pick().label(place, translate, dragging),
      move: (event, place, dragging) => pick().move?.(event, place, dragging),
      onAim: (place, dragMode) => {
        if (latest.current.swap) {
          // The swap shows while dragging: the dragged item in the aimed
          // slot, the item there in the dragged one's. (Not as the drag
          // ends: the drop, or the layout effect below, settles them.)
          const store = dragApi.current?.store.get()
          const key = store?.dragging[0]
          if (!store || store.mode === null || key === undefined) return
          const elements = slotElements()
          const current = latest.current.value
          const origin = current.indexOf(key)
          const moves: Array<readonly [HTMLElement, HTMLElement]> = []
          if (isSlot(place) && origin >= 0 && place.slot !== origin) {
            const dragged = registry.get(key)?.element
            const target = elements[place.slot] as HTMLElement | undefined
            const occupant = current[place.slot]
            const other = occupant ? registry.get(occupant)?.element : null
            if (dragged && target) moves.push([dragged, target])
            if (other) moves.push([other, elements[origin]])
          }
          restyle(moves)
          if (isSlot(place) && dragMode !== "pointer")
            elements[place.slot]?.scrollIntoView({
              block: "nearest",
              inline: "nearest",
            })
          return
        }
        // A keyboard or screen reader drag shows the aimed gap: the item
        // after it (the last one, past the end) scrolls into view.
        if (!place || isSlot(place) || dragMode === "pointer") return
        const items = shown()
        const item = items[Math.min(place.gap, items.length - 1)] as
          ListItem | undefined
        // A grid scrolls down, like a column.
        if (item) reveal(item.element, latest.current.axis === "x" ? "x" : "y")
      },
    }
  })

  const dragModeRef = React.useRef<DragMode>("pointer")
  const animation = useDropAnimation({
    disabled: !dropAnimation,
    items: () => [...registry].map(([key, entry]) => [key, entry.element]),
  })
  const change = useEventCallback(
    (
      place: ReorderPlace,
      keys: ReadonlyArray<string>,
      {
        from,
        takePreview,
      }: { from: DOMRect | null; takePreview: (() => HTMLElement) | null }
    ) => {
      const key = keys.at(0)
      if (key === undefined) return
      const current = latest.current.value
      const next: Array<string | null> = isSlot(place)
        ? swapInList(current, key, place.slot)
        : moveInList(
            current as ReadonlyArray<string>,
            shown().map((item) => item.value),
            key,
            place.gap
          )
      if (next.every((v, i) => v === current[i])) return
      const details = createChangeEventDetails(dragModeRef.current)
      // Where every item shows now, the swap included; they slide from
      // there into the slots the new value gives them, whether the slots'
      // elements are re-created or given other items.
      // A swap's placeholder already shows where the item lands: the
      // pointer preview lands on it rather than the item flying in.
      animation.capture(
        [key],
        from,
        isSlot(place) ? (takePreview?.() ?? null) : null
      )
      onValueChange?.(next, details)
      if (details.isCanceled) return animation.discard()
      for (const [element, saved] of preview.current) {
        settle(element)
        Object.assign(element.style, saved)
      }
      preview.current.clear()
      setValue(next)
    }
  )

  const dragAndDrop = useDragAndDrop<ReorderPlace>({
    strategy,
    // In a grid, Left and Right step through the gaps in reading order;
    // Up and Down cross the rows (the strategy's `move`).
    axis: axis === "grid" ? "x" : axis,
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) => registry.get(key)?.element ?? null,
    getContainer: () => root.current,
    getPreviewContainer: () => portal ?? null,
    onDragStart: (_keys, dragMode) => {
      dragModeRef.current = dragMode
    },
    onDrop: change,
    // Back on the dropped item's handle, where the keyboard drag started.
    focusItem: (key) => {
      const element = registry.get(key)?.element
      const handle = element?.querySelector<HTMLElement>(
        '[data-slot="reorderable-handle"]'
      )
      ;(handle ?? element)?.focus()
    },
  })

  dragApi.current = dragAndDrop
  const dragging = useStore(dragAndDrop.store, (s) => s.mode !== null)

  // A swap shown by a drag that ended without it (cancelled, refused by
  // `onValueChange`, or no change): its items glide back to their slots. A
  // drop that swaps re-renders them in their new slots.
  React.useLayoutEffect(() => {
    if (!dragging && preview.current.size) restyle([])
  }, [dragging, restyle])

  const registerSlot = React.useCallback(
    (element: HTMLElement, label: string | undefined) => {
      slotRegistry.set(element, label)
      return () => {
        slotRegistry.delete(element)
      }
    },
    [slotRegistry]
  )
  const slotAt = React.useCallback(
    (index: number) => slotElements()[index] as HTMLElement | undefined,
    [slotElements]
  )

  const register = React.useCallback(
    (key: string, entry: Entry) => {
      registry.set(key, entry)
      return () => {
        if (registry.get(key) === entry) registry.delete(key)
      }
    },
    [registry]
  )

  const parent = React.useContext(ReorderableContext)
  // Built on first use, once per `value`: most items ask their own list.
  const has = React.useMemo(() => {
    let values: Set<string | null> | null = null
    return (key: string) => (values ??= new Set(value)).has(key)
  }, [value])
  const context = React.useMemo<ReorderableContextValue>(
    () => ({
      dragAndDrop,
      swap,
      registerSlot,
      slotAt,
      orientation,
      disabled,
      register,
      has,
      parent,
    }),
    [
      dragAndDrop,
      swap,
      registerSlot,
      slotAt,
      orientation,
      disabled,
      register,
      has,
      parent,
    ]
  )

  const getPlacement = React.useCallback(
    (place: ReorderPlace): React.CSSProperties | null => {
      const element = root.current
      // A swap shows itself: no line.
      if (!element || isSlot(place)) return null
      return listPlacement(
        element,
        shown(),
        place,
        latest.current.axis,
        latest.current.direction
      )
    },
    [shown]
  )

  const element = usePrimitive(
    "div",
    { ...props, className: withClass("relative", className), ref },
    { orientation, mode, dragging, disabled },
    {
      ref: root,
      "data-slot": "reorderable",
      "data-orientation": orientation,
      "data-mode": mode,
      children: (
        <ReorderableContext.Provider value={context}>
          {children}
          <DragAndDropPrimitive.DropIndicator
            data-slot="reorderable-drop-indicator"
            className={cn("z-10", orientation === "vertical" ? "h-0" : "w-0")}
            dragAndDrop={dragAndDrop}
            getPlacement={getPlacement}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute rounded-full bg-primary",
                orientation !== "vertical"
                  ? "inset-y-0 -start-px w-0.5"
                  : "inset-x-0 -top-px h-0.5"
              )}
            />
          </DragAndDropPrimitive.DropIndicator>
        </ReorderableContext.Provider>
      ),
    },
    { orientation: hidden, mode: hidden, disabled: hidden }
  )
  return element
}

type ReorderableItemState = { dragging: boolean }

type ReorderableItemProps = PrimitiveProps<"div", ReorderableItemState> & {
  /** The item's value in the `Reorderable`'s `value`. */
  value: string
  /**
   * The item's name, as the handle and the announcements say it
   * ("Drag 34/10-A-12", "Insert between A-12 and B-3").
   */
  label: string
  /**
   * `false`: the item is its own handle, for items with no room for a grip
   * (table column headers). It is dragged from anywhere on it, its
   * buttons included: a press that moves drags, one that does not is the
   * button's click (sorting); only text fields keep their presses. It is
   * focused with Tab, and Enter or Space on it (not on its buttons) starts
   * a keyboard drag. Default `true`: drags start from a
   * `ReorderableHandle`.
   */
  dragHandle?: boolean
}

/**
 * Fields keep their presses: a drag from one would fight selecting its
 * text. Buttons and links inside an item do not: a press that moves drags
 * the item, and one that does not is still their click (a column header's
 * sort button), as in a spreadsheet.
 */
const FIELD = 'input, select, textarea, [contenteditable="true"]'

function isOwnField(event: React.SyntheticEvent<HTMLElement>) {
  const target = event.target as Element
  const field = target.closest(FIELD)
  return (
    !!field &&
    field !== event.currentTarget &&
    event.currentTarget.contains(field)
  )
}

const ItemContext = React.createContext<{
  value: string
  label: string
  root: ReorderableContextValue
} | null>(null)

/**
 * One item. Renders a `div`; pass `render={<TableRow />}` for a row or
 * `render={<TableHead />}` for a column. Carries `data-dragging` while it
 * is dragged.
 */
function ReorderableItem({
  value,
  label,
  dragHandle = true,
  className,
  children,
  ref,
  ...props
}: ReorderableItemProps) {
  const root = useReorderable("ReorderableItem", value)
  const { dragAndDrop, register, disabled } = root
  const t = useTranslations("dragAndDrop")
  const self = !dragHandle && !disabled
  const dragging = useStore(dragAndDrop.store, (s) =>
    s.dragging.includes(value)
  )
  // The element as soon as it is attached, before any layout effect: a
  // drop that mounts the item in another slot (`mode="swap"`) must find it
  // in the same commit to animate it.
  const entry = React.useRef<Entry>({ element: null, label })
  const attach = React.useCallback((node: HTMLElement | null) => {
    entry.current.element = node
  }, [])
  React.useLayoutEffect(() => {
    entry.current.label = label
  }, [label])
  React.useLayoutEffect(() => register(value, entry.current), [register, value])

  const item = React.useMemo(
    () => ({ value, label, root }),
    [value, label, root]
  )

  return usePrimitive(
    "div",
    {
      ...props,
      className: withClass(
        cn(
          "data-dragging:opacity-50",
          // A swapped item takes the size of its slot.
          root.swap && "size-full",
          self &&
            "cursor-grab outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-dragging:cursor-grabbing"
        ),
        className
      ),
      ref,
    },
    { dragging },
    {
      ref: attach,
      "data-slot": "reorderable-item",
      ...(self && {
        tabIndex: 0,
        "aria-description": t("dragItem", { itemText: label }),
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
          if (!isOwnField(event)) dragAndDrop.onPointerDown(event, value)
        },
        // A link or an image inside would start the browser's own drag.
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

type ReorderableHandleProps = Omit<
  PrimitiveProps<"button", { dragging: boolean }>,
  "value"
>

/**
 * The item's grip: drag it, or press Enter or Space on it to move the item
 * with the keyboard. Named "Drag {label}". A grip icon by default.
 */
function ReorderableHandle({
  className,
  children,
  disabled,
  ...props
}: ReorderableHandleProps) {
  const item = React.useContext(ItemContext)
  if (!item)
    throw new Error("ReorderableHandle must be used inside ReorderableItem")
  const { root } = item
  const off = root.disabled || !!disabled
  const Icon =
    root.swap || root.orientation === "grid"
      ? GripIcon
      : root.orientation === "horizontal"
        ? GripHorizontalIcon
        : GripVerticalIcon
  return (
    <DragAndDropPrimitive.Handle
      data-slot="reorderable-handle"
      {...props}
      dragAndDrop={root.dragAndDrop as DragAndDrop<unknown>}
      value={item.value}
      label={item.label}
      // A table has no arrow-key focus between rows: each handle is a stop.
      tabIndex={0}
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
      {children ?? <Icon />}
    </DragAndDropPrimitive.Handle>
  )
}

type ReorderableSlotState = {
  /** The slot holds no item. */
  empty: boolean
  /** A drag is aimed at the slot. */
  dropTarget: boolean
}

type ReorderableSlotProps = PrimitiveProps<"div", ReorderableSlotState> & {
  /** The slot's name, as an empty slot is announced (`Move to {label}`). */
  label?: string
}

/**
 * A fixed place of a `Reorderable mode="swap"`: render one per entry of
 * `value`, in order, keyed by its index, with its item (if any) inside.
 * Give it its size in the grid (`col-span-2 row-span-2`): it stays put
 * while items swap through it. An empty slot shows a dashed outline and the
 * aimed slot a ring; they carry `data-empty` and `data-drop-target`.
 */
function ReorderableSlot({
  label,
  className,
  children,
  ref,
  ...props
}: ReorderableSlotProps) {
  const context = React.useContext(ReorderableContext)
  if (!context)
    throw new Error("ReorderableSlot must be used inside Reorderable")
  const { dragAndDrop, registerSlot, slotAt } = context
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(
    () => (element ? registerSlot(element, label) : undefined),
    [registerSlot, element, label]
  )
  const dropTarget = useStore(
    dragAndDrop.store,
    (s) =>
      isSlot(s.aimed) && element !== null && slotAt(s.aimed.slot) === element
  )
  const empty =
    children === null || children === undefined || children === false
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
    { empty, dropTarget },
    { ref: setElement, "data-slot": "reorderable-slot", children },
    { dropTarget: (aimed) => (aimed ? { "data-drop-target": "" } : null) }
  )
}

export { Reorderable, ReorderableItem, ReorderableHandle, ReorderableSlot }
export type {
  ReorderableMode,
  ReorderableOrientation,
  ReorderableProps,
  ReorderableSlotProps,
  ReorderableItemProps,
  ReorderableHandleProps,
  ReorderableChangeDetails,
}
