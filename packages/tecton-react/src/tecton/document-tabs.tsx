"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ChevronDownIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { useDirection } from "@tecton/react/tecton/provider"

/**
 * Tecton DocumentTabs — the tabs of a workspace the user opens, closes,
 * renames and reorders: open wells, open views of a well. The parts mirror
 * the shadcn `Tabs` (`DocumentTabs` → `Tabs`, `DocumentTabsList` →
 * `TabsList`, `DocumentTabsTrigger` → `TabsTrigger`, `DocumentTabsContent` →
 * `TabsContent`) and take the same props; the strip adds a close button per
 * tab, inline rename, drag and keyboard reordering, a context menu and a
 * "More tabs" menu for the tabs that do not fit (`docs/OVERFLOW-RULES.md`
 * §15.4). The tabs themselves are application state: the strip reports
 * `onClose`, `onRename` and `onReorder`, the owner updates its list.
 */

type DocumentTabsChangeEventDetails = TabsPrimitive.Root.ChangeEventDetails
type DocumentTabsChangeEventReason = TabsPrimitive.Root.ChangeEventReason

/** The words the strip says. Pass `messages` on `DocumentTabs` to translate. */
type DocumentTabsMessages = {
  /** The add button's name. */
  add: string
  /** The More menu trigger's name; the count of hidden tabs follows it. */
  more: string
  /** Context menu item, and the rename field's name ("Rename Well-01"). */
  rename: string
  /** Context menu item, and the close button's name ("Close Well-01"). */
  close: string
  closeOthers: string
  /** Announced after a keyboard or drag move. */
  moved: (label: string, position: number, total: number) => string
}

const DEFAULT_MESSAGES: DocumentTabsMessages = {
  add: "New tab",
  more: "More tabs",
  rename: "Rename",
  close: "Close",
  closeOthers: "Close other tabs",
  moved: (label, position, total) =>
    `${label} moved to position ${position} of ${total}`,
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

type DocumentTabsCallbacks = {
  onValueChange?: (
    value: string,
    eventDetails: DocumentTabsChangeEventDetails
  ) => void
  onClose?: (values: Array<string>) => void
  onRename?: (value: string, label: string) => void
  onReorder?: (values: Array<string>) => void
}

type DocumentTabsRootContextValue = {
  value: string | null
  controlled: boolean
  select: (
    value: string,
    reason?: DocumentTabsChangeEventReason,
    event?: Event
  ) => void
  callbacks: React.RefObject<DocumentTabsCallbacks>
  closable: boolean
  renamable: boolean
  reorderable: boolean
  editing: string | null
  setEditing: (value: string | null) => void
  messages: DocumentTabsMessages
}

const DocumentTabsRootContext =
  React.createContext<DocumentTabsRootContextValue | null>(null)

function useRootContext(part: string) {
  const context = React.useContext(DocumentTabsRootContext)
  if (!context) throw new Error(`${part} must be used within <DocumentTabs>`)
  return context
}

/** The details of a change the strip makes itself (closing, the More menu). */
function changeDetails(
  reason: DocumentTabsChangeEventReason,
  event?: Event
): DocumentTabsChangeEventDetails {
  let canceled = false
  let propagationAllowed = false
  return {
    reason,
    event: event ?? new Event("document-tabs"),
    trigger: undefined,
    activationDirection: "none",
    cancel() {
      canceled = true
    },
    allowPropagation() {
      propagationAllowed = true
    },
    get isCanceled() {
      return canceled
    },
    get isPropagationAllowed() {
      return propagationAllowed
    },
  }
}

type DocumentTabsProps = Omit<
  TabsPrimitive.Root.Props,
  "value" | "defaultValue" | "onValueChange" | "orientation"
> &
  DocumentTabsCallbacks & {
    /** The open tab (controlled). */
    value?: string | null
    /** The tab open on mount (uncontrolled). Default: the first tab. */
    defaultValue?: string | null
    /**
     * Called with the values to close: the × button and Delete close one
     * tab, "Close other tabs" all the others. When the open tab closes, the
     * strip first opens its neighbour through `onValueChange`. Without it, no
     * tab can close.
     */
    onClose?: (values: Array<string>) => void
    /** Called with the trimmed new label. Without it, tabs cannot be renamed. */
    onRename?: (value: string, label: string) => void
    /** Called with every value in the new order. Without it, tabs stay put. */
    onReorder?: (values: Array<string>) => void
    messages?: Partial<DocumentTabsMessages>
  }

function DocumentTabs({
  className,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onClose,
  onRename,
  onReorder,
  messages: messagesProp,
  ...props
}: DocumentTabsProps) {
  const controlled = valueProp !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | null
  >(defaultValue)
  const value = controlled ? valueProp : uncontrolledValue
  const [editing, setEditing] = React.useState<string | null>(null)

  const callbacks = React.useRef<DocumentTabsCallbacks>({})
  React.useInsertionEffect(() => {
    callbacks.current = { onValueChange, onClose, onRename, onReorder }
  })

  const select = React.useCallback(
    (
      next: string,
      reason: DocumentTabsChangeEventReason = "none",
      event?: Event
    ) => {
      const details = changeDetails(reason, event)
      callbacks.current.onValueChange?.(next, details)
      if (!controlled && !details.isCanceled) setUncontrolledValue(next)
    },
    [controlled]
  )

  const messages = React.useMemo(
    () => ({ ...DEFAULT_MESSAGES, ...messagesProp }),
    [messagesProp]
  )

  const context = React.useMemo<DocumentTabsRootContextValue>(
    () => ({
      value,
      controlled,
      select,
      callbacks,
      closable: onClose !== undefined,
      renamable: onRename !== undefined,
      reorderable: onReorder !== undefined,
      editing,
      setEditing,
      messages,
    }),
    [value, controlled, select, onClose, onRename, onReorder, editing, messages]
  )

  return (
    <DocumentTabsRootContext value={context}>
      <TabsPrimitive.Root
        data-slot="document-tabs"
        value={value}
        onValueChange={(next, details) => {
          if (typeof next !== "string") return
          callbacks.current.onValueChange?.(next, details)
          if (!controlled && !details.isCanceled) setUncontrolledValue(next)
        }}
        className={cn("flex min-w-0 flex-col", className)}
        {...props}
      />
    </DocumentTabsRootContext>
  )
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

type TabEntry = {
  label: string
  /** The tab's content without its close button, for the More menu. */
  content: React.ReactNode
  closable: boolean
  disabled: boolean
}

type DocumentTabsListContextValue = {
  size: "default" | "sm"
  hidden: Array<string>
  /** The open tab, when even alone it is wider than the room: it shrinks. */
  squeezed: string | null
  entries: React.RefObject<Map<string, TabEntry>>
  order: () => Array<string>
  /**
   * Close tabs, opening the neighbour of the open one first. `focus` moves
   * focus to the tab that stays open; by default only when focus was in the
   * tab list.
   */
  close: (
    values: Array<string>,
    options?: { event?: Event; focus?: boolean }
  ) => void
  move: (value: string, delta: -1 | 1) => void
  startDrag: (event: React.PointerEvent<HTMLElement>, value: string) => void
  /** Focus this tab once it is rendered and visible. */
  requestFocus: (value: string) => void
}

const DocumentTabsListContext =
  React.createContext<DocumentTabsListContextValue | null>(null)

function useListContext(part: string) {
  const context = React.useContext(DocumentTabsListContext)
  if (!context)
    throw new Error(`${part} must be used within <DocumentTabsList>`)
  return context
}

const documentTabsListVariants = cva(
  "group/document-tabs-list relative flex w-full min-w-0 items-stretch border-b border-border-subtle bg-card text-sm",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/** Room kept for the More trigger before it has been measured. */
const MORE_FALLBACK_WIDTH = 48
/** Pointer travel before a press on a tab becomes a drag. */
const DRAG_THRESHOLD = 4

const TRIGGER_SELECTOR = '[data-slot="document-tabs-trigger"]'

function rectOf(element: Element) {
  return element.getBoundingClientRect()
}

function sameList(a: Array<string>, b: Array<string>) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function isElementOf(
  node: React.ReactNode,
  ...types: Array<React.ElementType>
): node is React.ReactElement {
  return React.isValidElement(node) && types.includes(node.type as never)
}

/** A press on a tab that may become a drag; `cancel` ends it without moving. */
type DragState = { cancel: () => void }

type DocumentTabsListProps = TabsPrimitive.List.Props &
  VariantProps<typeof documentTabsListVariants>

function DocumentTabsList({
  className,
  size = "default",
  activateOnFocus = true,
  children,
  ...props
}: DocumentTabsListProps) {
  const root = useRootContext("DocumentTabsList")
  const direction = useDirection()
  const rowRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const entries = React.useRef(new Map<string, TabEntry>())
  const moreWidth = React.useRef(MORE_FALLBACK_WIDTH)
  const pendingFocus = React.useRef<string | null>(null)
  const drag = React.useRef<DragState | null>(null)
  const [hidden, setHidden] = React.useState<Array<string>>([])
  const [squeezed, setSqueezed] = React.useState<string | null>(null)
  // Each tab's own width, kept while it is squeezed below it.
  const natural = React.useRef(new Map<string, number>())
  const [announcement, setAnnouncement] = React.useState("")

  // The add button and the More menu sit beside the tab list, not in it: a
  // tablist owns tabs only.
  const items = React.Children.toArray(children)
  const tabs = items.filter(
    (item) => !isElementOf(item, DocumentTabsAdd, DocumentTabsMore)
  )
  const more = items.find((item) => isElementOf(item, DocumentTabsMore)) ?? (
    <DocumentTabsMore />
  )
  const after = items.filter((item) => isElementOf(item, DocumentTabsAdd))

  const wrappers = React.useCallback(
    () =>
      Array.from(
        listRef.current?.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR) ?? []
      ),
    []
  )
  const order = React.useCallback(
    () => wrappers().map((element) => element.dataset.value!),
    [wrappers]
  )
  const tabElement = React.useCallback(
    (value: string) =>
      wrappers()
        .find((element) => element.dataset.value === value)
        ?.querySelector<HTMLElement>('[role="tab"]') ?? null,
    [wrappers]
  )

  const listHasFocus = () => {
    const list = listRef.current
    return !!list && list.contains(list.ownerDocument.activeElement)
  }

  const announce = (text: string) => setAnnouncement(text)

  /**
   * Which tabs fit. Tabs keep their order and the open tab always shows:
   * the visible set is the longest run of leading tabs that fits beside it
   * and the More trigger; the rest go to the More menu.
   */
  const measure = React.useCallback(() => {
    const row = rowRef.current
    const list = listRef.current
    if (!row || !list) return
    let room = rectOf(row).width
    // Not laid out (display: none, or no layout at all): nothing overflows.
    if (room === 0) {
      setHidden((previous) => (previous.length === 0 ? previous : []))
      setSqueezed(null)
      return
    }
    for (const child of Array.from(row.children)) {
      const slot = (child as HTMLElement).dataset.slot
      if (child === list || slot === "document-tabs-announcer") continue
      const width = rectOf(child).width
      if (slot === "document-tabs-more") {
        if (width > 0) moreWidth.current = width
        continue
      }
      room -= width
    }
    const elements = wrappers()
    const values = elements.map((element) => element.dataset.value!)
    const widths = elements.map((element) => {
      const value = element.dataset.value!
      const width = rectOf(element).width
      if ("squeezed" in element.dataset)
        return natural.current.get(value) ?? width
      natural.current.set(value, width)
      return width
    })
    const total = widths.reduce((sum, width) => sum + width, 0)
    let next: Array<string> = []
    let squeeze: string | null = null
    if (total > room + 0.5) {
      const active = root.value === null ? -1 : values.indexOf(root.value)
      if (active >= 0 && widths[active] > room - moreWidth.current)
        squeeze = values[active]
      let budget = room - moreWidth.current - (active >= 0 ? widths[active] : 0)
      const visible = new Set<number>(active >= 0 ? [active] : [])
      for (let index = 0; index < values.length; index++) {
        if (index === active) continue
        if (widths[index] > budget) break
        budget -= widths[index]
        visible.add(index)
      }
      next = values.filter((_, index) => !visible.has(index))
    }
    setHidden((previous) => (sameList(previous, next) ? previous : next))
    setSqueezed(squeeze)
  }, [root.value, wrappers])

  React.useLayoutEffect(() => {
    measure()

    // An uncontrolled strip opens its first tab, and opens the first one
    // again when the open tab goes away.
    const values = order()
    if (
      !root.controlled &&
      values.length > 0 &&
      (root.value === null || !values.includes(root.value))
    ) {
      const first = values.find(
        (value) => !entries.current.get(value)?.disabled
      )
      if (first !== undefined)
        root.select(first, root.value === null ? "initial" : "missing")
    }

    if (pendingFocus.current !== null) {
      const tab = tabElement(pendingFocus.current)
      if (tab) {
        tab.focus()
        if (tab.ownerDocument.activeElement === tab) pendingFocus.current = null
      }
    }
  })

  React.useEffect(() => {
    const row = rowRef.current
    if (!row || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(row)
    for (const element of wrappers()) observer.observe(element)
    return () => observer.disconnect()
  })

  const close: DocumentTabsListContextValue["close"] = (
    values,
    { event, focus: moveFocus = listHasFocus() } = {}
  ) => {
    const onClose = root.callbacks.current.onClose
    if (!onClose || values.length === 0) return
    const current = order()
    const closing = new Set(values)
    let focus = root.value
    if (root.value !== null && closing.has(root.value)) {
      const index = current.indexOf(root.value)
      const open = (value: string) =>
        !closing.has(value) && !entries.current.get(value)?.disabled
      const neighbour =
        current.slice(index + 1).find(open) ??
        current.slice(0, Math.max(index, 0)).reverse().find(open)
      focus = neighbour ?? null
      if (neighbour !== undefined) root.select(neighbour, "none", event)
    }
    if (focus !== null && moveFocus) pendingFocus.current = focus
    onClose(values)
  }

  const reorder = (value: string, next: Array<string>) => {
    root.callbacks.current.onReorder?.(next)
    announce(
      root.messages.moved(
        entries.current.get(value)?.label ?? value,
        next.indexOf(value) + 1,
        next.length
      )
    )
  }

  const move = (value: string, delta: -1 | 1) => {
    const current = order()
    const from = current.indexOf(value)
    const to = from + delta
    if (from < 0 || to < 0 || to >= current.length) return
    const next = current.filter((item) => item !== value)
    next.splice(to, 0, value)
    if (listHasFocus()) pendingFocus.current = value
    reorder(value, next)
  }

  const rtl = direction === "rtl"

  const startDrag = (event: React.PointerEvent<HTMLElement>, value: string) => {
    if (
      !root.reorderable ||
      drag.current ||
      event.button !== 0 ||
      root.editing !== null
    )
      return
    const element = event.currentTarget
    const visible = wrappers().filter(
      (wrapper) => !("overflowing" in wrapper.dataset)
    )
    const index = visible.indexOf(element)
    if (index < 0 || visible.length < 2) return
    const doc = element.ownerDocument
    const pointerId = event.pointerId
    const startX = event.clientX
    const width = rectOf(element).width
    const items = visible.map((wrapper) => {
      const box = rectOf(wrapper)
      return {
        value: wrapper.dataset.value!,
        element: wrapper,
        mid: box.left + box.width / 2,
      }
    })
    // The dragged tab stays within the visible tabs: the list clips the rest.
    const own = rectOf(element)
    const minDx = rectOf(visible[0]).left - own.left
    const maxDx = rectOf(visible[visible.length - 1]).right - own.right
    let started = false
    let target = index

    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return
      const travel = move.clientX - startX
      if (!started) {
        if (Math.abs(travel) < DRAG_THRESHOLD) return
        started = true
        element.dataset.dragging = ""
        for (const item of items)
          if (item.element !== element)
            item.element.style.transition = "transform 150ms ease"
      }
      const dx = Math.min(Math.max(travel, minDx), maxDx)
      element.style.transform = `translateX(${dx}px)`
      const center = items[index].mid + dx
      target = items.filter(
        (item, at) =>
          at !== index && (rtl ? item.mid > center : item.mid < center)
      ).length
      // The tabs between the old and the new slot step aside by one tab.
      let slot = 0
      items.forEach((item, at) => {
        if (at === index) return
        const shift = (slot < target ? slot : slot + 1) - at
        item.element.style.transform = shift
          ? `translateX(${shift * width * (rtl ? -1 : 1)}px)`
          : ""
        slot++
      })
    }

    const finish = (commit: boolean) => {
      drag.current = null
      doc.removeEventListener("pointermove", onMove)
      doc.removeEventListener("pointerup", onUp)
      doc.removeEventListener("pointercancel", onCancel)
      if (!started) return
      for (const item of items) {
        item.element.style.transform = ""
        item.element.style.transition = ""
      }
      delete element.dataset.dragging
      if (!commit || target === index) return
      const others = items.filter((_, at) => at !== index)
      const next = order().filter((other) => other !== value)
      const before = target < others.length ? others[target].value : null
      next.splice(
        before === null
          ? next.indexOf(others[others.length - 1].value) + 1
          : next.indexOf(before),
        0,
        value
      )
      reorder(value, next)
    }
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) finish(true)
    }
    const onCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === pointerId) finish(false)
    }

    drag.current = { cancel: () => finish(false) }
    doc.addEventListener("pointermove", onMove)
    doc.addEventListener("pointerup", onUp)
    doc.addEventListener("pointercancel", onCancel)
  }

  React.useEffect(() => () => drag.current?.cancel(), [])

  const context: DocumentTabsListContextValue = {
    size: size ?? "default",
    hidden,
    squeezed,
    entries,
    order,
    close,
    move,
    startDrag,
    requestFocus: (value) => {
      pendingFocus.current = value
    },
  }

  return (
    <DocumentTabsListContext value={context}>
      <div
        ref={rowRef}
        data-slot="document-tabs-list"
        data-size={size}
        className={cn(documentTabsListVariants({ size }), className)}
      >
        <TabsPrimitive.List
          ref={listRef}
          data-slot="document-tabs-tablist"
          activateOnFocus={activateOnFocus}
          className="relative flex min-w-0 items-stretch overflow-hidden"
          {...props}
        >
          {tabs}
        </TabsPrimitive.List>
        {more}
        {after}
        <div
          data-slot="document-tabs-announcer"
          aria-live="polite"
          className="sr-only"
        >
          {announcement}
        </div>
      </div>
    </DocumentTabsListContext>
  )
}

/* -------------------------------------------------------------------------- */
/* Trigger                                                                    */
/* -------------------------------------------------------------------------- */

type DocumentTabsTriggerContextValue = {
  value: string
  label: string
  setLabel: (label: string) => void
  closable: boolean
  close: (event?: Event) => void
}

const DocumentTabsTriggerContext =
  React.createContext<DocumentTabsTriggerContextValue | null>(null)

/** Out of the layout but still measurable, and skipped by the arrow keys. */
const OVERFLOWING_STYLE: React.CSSProperties = {
  position: "absolute",
  insetInlineStart: 0,
  top: 0,
  visibility: "hidden",
  pointerEvents: "none",
}

type DocumentTabsTriggerProps = Omit<TabsPrimitive.Tab.Props, "value"> & {
  value: string
}

function DocumentTabsTrigger({
  className,
  value,
  disabled = false,
  children,
  onKeyDown,
  onDoubleClick,
  style,
  ...props
}: DocumentTabsTriggerProps) {
  const root = useRootContext("DocumentTabsTrigger")
  const list = useListContext("DocumentTabsTrigger")
  const direction = useDirection()
  const tabRef = React.useRef<HTMLElement>(null)
  const [label, setLabel] = React.useState("")

  // The close button sits beside the tab, not in it: a button cannot hold
  // another button.
  const items = React.Children.toArray(children)
  const closeButton = items.find((item) => isElementOf(item, DocumentTabsClose))
  const content = items.filter((item) => !isElementOf(item, DocumentTabsClose))

  const closable = closeButton !== undefined && root.closable && !disabled
  const renamable = root.renamable && !disabled
  const active = root.value === value
  const overflowing = list.hidden.includes(value)
  const editing = root.editing === value

  React.useLayoutEffect(() => {
    list.entries.current.set(value, { label, content, closable, disabled })
  })
  React.useLayoutEffect(() => {
    const entries = list.entries.current
    return () => {
      entries.delete(value)
    }
  }, [list.entries, value])

  const closeSelf = (event?: Event, focus?: boolean) =>
    list.close([value], { event, focus })

  const finishRename = (next: string | null, refocus: boolean) => {
    root.setEditing(null)
    const trimmed = next?.trim()
    if (trimmed && trimmed !== label)
      root.callbacks.current.onRename?.(value, trimmed)
    if (refocus) list.requestFocus(value)
  }

  // What the context menu did, so it can hand focus to the right place.
  const menuAction = React.useRef<"rename" | "close" | null>(null)
  const closeOthers = () =>
    list
      .order()
      .filter(
        (other) => other !== value && list.entries.current.get(other)?.closable
      )

  const hasMenu = renamable || root.closable

  const triggerContext: DocumentTabsTriggerContextValue = {
    value,
    label,
    setLabel,
    closable,
    close: closeSelf,
  }

  const wrapperProps = {
    role: "presentation",
    "data-slot": "document-tabs-trigger",
    "data-value": value,
    "data-active": active ? "" : undefined,
    "data-closable": closable ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-overflowing": overflowing ? "" : undefined,
    "data-squeezed": list.squeezed === value ? "" : undefined,
    "aria-hidden": overflowing || undefined,
    style: overflowing ? OVERFLOWING_STYLE : undefined,
    className:
      "group/document-tab relative flex shrink-0 items-stretch border-e border-border-subtle select-none data-squeezed:min-w-0 data-squeezed:shrink data-dragging:z-10 data-dragging:shadow-md",
    onPointerDown: root.reorderable
      ? (event: React.PointerEvent<HTMLElement>) => list.startDrag(event, value)
      : undefined,
  } as const

  const tab = (
    <TabsPrimitive.Tab
      ref={tabRef}
      data-slot="document-tabs-tab"
      value={value}
      disabled={disabled}
      style={
        overflowing
          ? (state) => ({
              ...(typeof style === "function" ? style(state) : style),
              visibility: "hidden",
            })
          : style
      }
      className={cn(
        "relative flex h-full max-w-80 min-w-24 items-center gap-2 px-3 whitespace-nowrap text-muted-foreground transition-colors outline-none group-hover/document-tab:bg-ghost-hover group-hover/document-tab:text-foreground group-data-closable/document-tab:pe-9 group-data-dragging/document-tab:bg-background group-data-squeezed/document-tab:min-w-0 group-data-squeezed/document-tab:shrink group-data-squeezed/document-tab:overflow-hidden group-data-[size=sm]/document-tabs-list:min-w-20 group-data-[size=sm]/document-tabs-list:px-2.5 group-data-[size=sm]/document-tabs-list:group-data-closable/document-tab:pe-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-disabled:pointer-events-none data-disabled:text-disabled-subtle-foreground data-active:bg-background data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>[data-slot=badge]]:shrink-0 group-data-squeezed/document-tab:[&>[data-slot=badge]]:hidden",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-outline-active-border after:opacity-0 data-active:after:opacity-100",
        className
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight"
        const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft"
        if (event.key === "Delete" && closable) {
          event.preventDefault()
          closeSelf(event.nativeEvent)
        } else if (event.key === "F2" && renamable) {
          event.preventDefault()
          root.setEditing(value)
        } else if (
          root.reorderable &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          (event.key === forward || event.key === backward)
        ) {
          event.preventDefault()
          event.stopPropagation()
          list.move(value, event.key === forward ? 1 : -1)
        }
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (!event.defaultPrevented && renamable) root.setEditing(value)
      }}
      {...props}
    >
      {content}
    </TabsPrimitive.Tab>
  )

  const inner = (
    <>
      {tab}
      {closable ? closeButton : null}
      {editing ? (
        <RenameField
          label={label}
          name={`${root.messages.rename} ${label}`.trim()}
          onDone={finishRename}
        />
      ) : null}
    </>
  )

  return (
    <DocumentTabsTriggerContext value={triggerContext}>
      {hasMenu ? (
        <ContextMenu>
          <ContextMenuTrigger render={<div />} {...wrapperProps}>
            {inner}
          </ContextMenuTrigger>
          <ContextMenuContent
            finalFocus={() => {
              const action = menuAction.current
              menuAction.current = null
              return action === null ? tabRef.current : false
            }}
          >
            {renamable ? (
              <ContextMenuItem
                onClick={() => {
                  menuAction.current = "rename"
                  root.setEditing(value)
                }}
              >
                {root.messages.rename}
              </ContextMenuItem>
            ) : null}
            {renamable && root.closable ? <ContextMenuSeparator /> : null}
            {root.closable ? (
              <>
                <ContextMenuItem
                  disabled={!closable}
                  onClick={(event) => {
                    menuAction.current = "close"
                    closeSelf(event.nativeEvent, true)
                  }}
                >
                  {root.messages.close}
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={closeOthers().length === 0}
                  onClick={(event) => {
                    menuAction.current = "close"
                    list.close(closeOthers(), {
                      event: event.nativeEvent,
                      focus: true,
                    })
                  }}
                >
                  {root.messages.closeOthers}
                </ContextMenuItem>
              </>
            ) : null}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <div {...wrapperProps}>{inner}</div>
      )}
    </DocumentTabsTriggerContext>
  )
}

/** The inline field that replaces a tab's label while it is renamed. */
function RenameField({
  label,
  name,
  onDone,
}: {
  label: string
  name: string
  onDone: (label: string | null, refocus: boolean) => void
}) {
  const done = React.useRef(false)
  const finish = (next: string | null, refocus: boolean) => {
    if (done.current) return
    done.current = true
    onDone(next, refocus)
  }
  return (
    <input
      data-slot="document-tabs-rename"
      aria-label={name}
      defaultValue={label}
      autoFocus
      spellCheck={false}
      className="absolute inset-1 z-10 min-w-0 rounded-sm bg-background px-2 text-sm text-foreground ring-2 ring-ring outline-none"
      onFocus={(event) => event.currentTarget.select()}
      // The field owns every key and pointer event while it is open: the
      // arrow keys move the caret, not the focus between tabs.
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === "Enter") {
          event.preventDefault()
          finish(event.currentTarget.value, true)
        } else if (event.key === "Escape") {
          event.preventDefault()
          finish(null, true)
        }
      }}
      onBlur={(event) => finish(event.currentTarget.value, false)}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Label, close, add, more, content                                           */
/* -------------------------------------------------------------------------- */

/**
 * The tab's name: what rename edits, what the More menu and the
 * announcements say. Truncates when the tab reaches its maximum width.
 */
function DocumentTabsLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const trigger = React.useContext(DocumentTabsTriggerContext)
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    trigger?.setLabel(ref.current?.textContent ?? "")
  })
  return (
    <span
      ref={ref}
      data-slot="document-tabs-label"
      className={cn("min-w-0 truncate", className)}
      {...props}
    />
  )
}

/** The × of a closable tab. Pointer only: the keyboard closes with Delete. */
function DocumentTabsClose({
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof Button>) {
  const root = useRootContext("DocumentTabsClose")
  const trigger = React.useContext(DocumentTabsTriggerContext)
  if (!trigger)
    throw new Error(
      "DocumentTabsClose must be used within <DocumentTabsTrigger>"
    )
  return (
    <Button
      data-slot="document-tabs-close"
      type="button"
      variant="ghost"
      size="icon-xs"
      tabIndex={-1}
      aria-label={ariaLabel ?? `${root.messages.close} ${trigger.label}`.trim()}
      className={cn(
        "absolute end-1.5 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground opacity-0 group-focus-within/document-tab:opacity-100 group-hover/document-tab:opacity-100 group-data-active/document-tab:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
        className
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) trigger.close(event.nativeEvent)
      }}
      {...props}
    >
      {children ?? <XIcon />}
    </Button>
  )
}

/** The + after the tabs. Opening a tab is the owner's: pass `onClick`. */
function DocumentTabsAdd({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof Button>) {
  const root = useRootContext("DocumentTabsAdd")
  return (
    <Button
      data-slot="document-tabs-add"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel ?? root.messages.add}
      className={cn("mx-1 shrink-0 self-center", className)}
      {...props}
    >
      {children ?? <PlusIcon />}
    </Button>
  )
}

/**
 * The menu of the tabs that do not fit, in tab order. The list renders one
 * itself; render it only to restyle or rename the trigger.
 */
function DocumentTabsMore({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof Button>) {
  const root = useRootContext("DocumentTabsMore")
  const list = useListContext("DocumentTabsMore")
  const picked = React.useRef(false)
  if (list.hidden.length === 0) return null
  const count = list.hidden.length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            data-slot="document-tabs-more"
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${ariaLabel ?? root.messages.more} (${count})`}
            className={cn("mx-1 shrink-0 self-center tabular-nums", className)}
            {...props}
          />
        }
      >
        {count}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto max-w-72 min-w-48"
        finalFocus={() => {
          const wasPicked = picked.current
          picked.current = false
          return !wasPicked
        }}
      >
        {list.hidden.map((value) => {
          const entry = list.entries.current.get(value)
          return (
            <DropdownMenuItem
              key={value}
              data-value={value}
              disabled={entry?.disabled}
              onClick={(event) => {
                picked.current = true
                list.requestFocus(value)
                root.select(value, "none", event.nativeEvent)
              }}
            >
              {entry?.content ?? value}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DocumentTabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="document-tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export {
  DocumentTabs,
  DocumentTabsList,
  DocumentTabsTrigger,
  DocumentTabsLabel,
  DocumentTabsClose,
  DocumentTabsAdd,
  DocumentTabsMore,
  DocumentTabsContent,
  documentTabsListVariants,
}
export type {
  DocumentTabsProps,
  DocumentTabsListProps,
  DocumentTabsTriggerProps,
  DocumentTabsMessages,
  DocumentTabsChangeEventDetails,
}
