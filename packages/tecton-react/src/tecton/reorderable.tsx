"use client"

import * as React from "react"
import { cn } from "cn"
import { GripHorizontalIcon, GripVerticalIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"
import { usePortalTarget } from "@tecton/react/tecton/portal"
import { useDirection } from "@tecton/react/tecton/provider"

import { useDropAnimation } from "./internal/primitives/drag-and-drop/drop-animation"
import {
  createListStrategy,
  listPlacement,
  moveInList,
  type ListDropPlace,
  type ListItem,
} from "./internal/primitives/drag-and-drop/list-strategy"
import * as DragAndDropPrimitive from "./internal/primitives/drag-and-drop/index.parts"
import {
  scrollerOf,
  stickyTopOf,
} from "./internal/primitives/drag-and-drop/pointer-drag"
import {
  useDragAndDrop,
  type DragAndDrop,
  type DragMode,
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
 * handle: table rows, table columns or a stack of items. A mouse, a pen or a
 * finger drags the handle and a line shows where the item will land; Enter
 * or Space on the handle starts a keyboard drag (the arrow keys or Tab pick
 * the gap, Enter drops, Escape cancels); a screen reader's activation turns
 * every gap into a button. Each step is announced.
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
 */

type ReorderableChangeDetails = ChangeEventDetails<DragMode>

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
  orientation: "vertical" | "horizontal"
  dragging: boolean
  disabled: boolean
}

type ReorderableProps = Omit<
  PrimitiveProps<"div", ReorderableState>,
  "defaultValue" | "onChange"
> & {
  /** The values of the items, in order (controlled). */
  value?: ReadonlyArray<string>
  /** The initial order, when not controlled. */
  defaultValue?: ReadonlyArray<string>
  /** Called with the new order when an item is dropped in another place. */
  onValueChange?: (
    value: Array<string>,
    eventDetails: ReorderableChangeDetails
  ) => void
  /**
   * "vertical" (default): the items are stacked, as table rows are.
   * "horizontal": the items are side by side, as table columns are.
   */
  orientation?: "vertical" | "horizontal"
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
  dragAndDrop: DragAndDrop<ListDropPlace>
  orientation: "vertical" | "horizontal"
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
  onValueChange,
  orientation = "vertical",
  disabled = false,
  dropAnimation = true,
  className,
  children,
  ref,
  ...props
}: ReorderableProps) {
  const [value, setValue] = useControlled(valueProp, defaultValue)
  const direction = useDirection()
  const portal = usePortalTarget()
  const root = React.useRef<HTMLDivElement | null>(null)
  const [registry] = React.useState(() => new Map<string, Entry>())
  const axis: "x" | "y" = orientation === "horizontal" ? "x" : "y"

  const latest = React.useRef({ value, axis, direction })
  React.useInsertionEffect(() => {
    latest.current = { value, axis, direction }
  })

  /** The items on the page, in order. */
  const shown = React.useCallback(
    (): Array<ListItem> =>
      latest.current.value.flatMap((key) => {
        const entry = registry.get(key)
        return entry?.element
          ? [{ value: key, element: entry.element, label: entry.label }]
          : []
      }),
    [registry]
  )

  const [strategy] = React.useState(() => ({
    ...createListStrategy({
      items: shown,
      axis: () => latest.current.axis,
      direction: () => latest.current.direction,
    }),
    // A keyboard or screen reader drag shows the aimed gap: the item
    // after it (the last one, past the end) scrolls into view.
    onAim: (place: ListDropPlace | null, dragMode: DragMode) => {
      if (!place || dragMode === "pointer") return
      const items = shown()
      const item = items[Math.min(place.gap, items.length - 1)] as
        ListItem | undefined
      if (item) reveal(item.element, latest.current.axis)
    },
  }))

  const mode = React.useRef<DragMode>("pointer")
  const animation = useDropAnimation({
    disabled: !dropAnimation,
    items: () => [...registry].map(([key, entry]) => [key, entry.element]),
  })
  const change = useEventCallback(
    (
      place: ListDropPlace,
      keys: ReadonlyArray<string>,
      { from }: { from: DOMRect | null }
    ) => {
      const key = keys.at(0)
      if (key === undefined) return
      const current = latest.current.value
      const next = moveInList(
        current,
        shown().map((item) => item.value),
        key,
        place.gap
      )
      if (next.every((v, i) => v === current[i])) return
      const details = createChangeEventDetails(mode.current)
      animation.capture([key], from)
      onValueChange?.(next, details)
      if (!details.isCanceled) setValue(next)
    }
  )

  const dragAndDrop = useDragAndDrop<ListDropPlace>({
    strategy,
    axis,
    direction,
    getDragged: (key) => [key],
    getItemElement: (key) => registry.get(key)?.element ?? null,
    getContainer: () => root.current,
    getPreviewContainer: () => portal ?? null,
    onDragStart: (_keys, dragMode) => {
      mode.current = dragMode
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

  const dragging = useStore(dragAndDrop.store, (s) => s.mode !== null)

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
    let values: Set<string> | null = null
    return (key: string) => (values ??= new Set(value)).has(key)
  }, [value])
  const context = React.useMemo<ReorderableContextValue>(
    () => ({
      dragAndDrop,
      orientation,
      disabled,
      register,
      has,
      parent,
    }),
    [dragAndDrop, orientation, disabled, register, has, parent]
  )

  const getPlacement = React.useCallback(
    (place: ListDropPlace): React.CSSProperties | null => {
      const element = root.current
      if (!element) return null
      return listPlacement(
        element,
        shown(),
        place.gap,
        latest.current.axis,
        latest.current.direction
      )
    },
    [shown]
  )

  const element = usePrimitive(
    "div",
    { ...props, className: withClass("relative", className), ref },
    { orientation, dragging, disabled },
    {
      ref: root,
      "data-slot": "reorderable",
      "data-orientation": orientation,
      children: (
        <ReorderableContext.Provider value={context}>
          {children}
          <DragAndDropPrimitive.DropIndicator
            data-slot="reorderable-drop-indicator"
            className={cn("z-10", orientation === "horizontal" ? "w-0" : "h-0")}
            dragAndDrop={dragAndDrop}
            getPlacement={getPlacement}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute rounded-full bg-primary",
                orientation === "horizontal"
                  ? "inset-y-0 -start-px w-0.5"
                  : "inset-x-0 -top-px h-0.5"
              )}
            />
          </DragAndDropPrimitive.DropIndicator>
        </ReorderableContext.Provider>
      ),
    },
    { orientation: hidden, disabled: hidden }
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
  const [element, setElement] = React.useState<HTMLElement | null>(null)

  React.useLayoutEffect(
    () => register(value, { element, label }),
    [register, value, element, label]
  )

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
          self &&
            "cursor-grab outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-dragging:cursor-grabbing"
        ),
        className
      ),
      ref,
    },
    { dragging },
    {
      ref: setElement,
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
    root.orientation === "horizontal" ? GripHorizontalIcon : GripVerticalIcon
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

export { Reorderable, ReorderableItem, ReorderableHandle }
export type {
  ReorderableProps,
  ReorderableItemProps,
  ReorderableHandleProps,
  ReorderableChangeDetails,
}
