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

import { useDragReorder } from "./internal/drag-reorder"

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
  hidden: ReadonlySet<string>
  /** The open tab, when even alone it is wider than the room: it shrinks. */
  squeezed: string | null
  entries: React.RefObject<Map<string, TabEntry>>
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
  /** Pointer down on a tab's wrapper: may start a drag to reorder. */
  startDrag: (event: React.PointerEvent<HTMLElement>) => void
  touchAction: "pan-y" | "pan-x"
  /** Focus this tab once it is rendered and visible. */
  requestFocus: (value: string) => void
  /** Ref callback for a tab's wrapper: its width feeds the overflow. */
  observe: (element: HTMLElement | null) => (() => void) | undefined
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
const EMPTY_SET: ReadonlySet<string> = new Set()

function rectOf(element: Element) {
  return element.getBoundingClientRect()
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) return false
  for (const value of a) if (!b.has(value)) return false
  return true
}

function isElementOf(
  node: React.ReactNode,
  ...types: Array<React.ElementType>
): node is React.ReactElement {
  return React.isValidElement(node) && types.includes(node.type as never)
}

/** What identifies a child of the list, for re-measuring when the tabs change. */
function childKey(node: React.ReactNode) {
  if (!React.isValidElement(node)) return ""
  const value = (node.props as { value?: unknown }).value
  return typeof value === "string" ? value : String(node.key)
}

/** The live region of the list, in its own component so that an announcement does not render the tabs again. */
function Announcer({
  handle,
}: {
  handle: React.RefObject<((text: string) => void) | null>
}) {
  const [text, setText] = React.useState("")
  React.useLayoutEffect(() => {
    handle.current = setText
    return () => {
      handle.current = null
    }
  }, [handle])
  return (
    <div
      data-slot="document-tabs-announcer"
      aria-live="polite"
      className="sr-only"
    >
      {text}
    </div>
  )
}

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
  const announce = React.useRef<((text: string) => void) | null>(null)
  const observer = React.useRef<ResizeObserver | null>(null)
  // Each tab's own width, kept while it is squeezed below it.
  const natural = React.useRef(new Map<string, number>())
  const [hidden, setHidden] = React.useState(EMPTY_SET)
  const [squeezed, setSqueezed] = React.useState<string | null>(null)
  const [menuTarget, setMenuTarget] = React.useState<string | null>(null)
  const menuAction = React.useRef(false)

  // The callbacks below are stable, so the list context only changes with
  // what the tabs draw; they read the latest root and direction from here.
  const latest = React.useRef({ root, direction })
  React.useInsertionEffect(() => {
    latest.current = { root, direction }
  })

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
  const tabsKey = tabs.map(childKey).join("\u0000")

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
  const listHasFocus = React.useCallback(() => {
    const list = listRef.current
    return !!list && list.contains(list.ownerDocument.activeElement)
  }, [])

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
      setHidden(EMPTY_SET)
      setSqueezed(null)
      return
    }
    for (const child of Array.from(row.children)) {
      const slot = (child as HTMLElement).dataset.slot
      if (child.contains(list) || slot === "document-tabs-announcer") continue
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
    let next = EMPTY_SET
    let squeeze: string | null = null
    if (total > room + 0.5) {
      const open = latest.current.root.value
      const active = open === null ? -1 : values.indexOf(open)
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
      next = new Set(values.filter((_, index) => !visible.has(index)))
    }
    setHidden((previous) => (sameSet(previous, next) ? previous : next))
    setSqueezed(squeeze)
  }, [wrappers])

  // One observer for the row and every tab, created on first use: tabs
  // register their wrapper before the list's effects run.
  const getObserver = React.useCallback(() => {
    if (!observer.current && typeof ResizeObserver !== "undefined")
      observer.current = new ResizeObserver(() => measure())
    return observer.current
  }, [measure])

  React.useEffect(() => {
    const instance = getObserver()
    if (rowRef.current) instance?.observe(rowRef.current)
    for (const element of wrappers()) instance?.observe(element)
    return () => {
      instance?.disconnect()
      observer.current = null
    }
  }, [getObserver, wrappers])

  const observe = React.useCallback<DocumentTabsListContextValue["observe"]>(
    (element) => {
      if (!element) return undefined
      const instance = getObserver()
      instance?.observe(element)
      return () => instance?.unobserve(element)
    },
    [getObserver]
  )

  // Measure again when the tabs, their order, the open tab or the size change.
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
  }, [measure, order, tabsKey, root.value, root.controlled, root.select, size])

  React.useLayoutEffect(() => {
    if (pendingFocus.current === null) return
    const tab = tabElement(pendingFocus.current)
    if (!tab) return
    tab.focus()
    if (tab.ownerDocument.activeElement === tab) pendingFocus.current = null
  })

  const close = React.useCallback<DocumentTabsListContextValue["close"]>(
    (values, { event, focus: moveFocus = listHasFocus() } = {}) => {
      const current = latest.current.root
      const onClose = current.callbacks.current.onClose
      if (!onClose || values.length === 0) return
      const tabsInOrder = order()
      const closing = new Set(values)
      let focus = current.value
      if (current.value !== null && closing.has(current.value)) {
        const index = tabsInOrder.indexOf(current.value)
        const open = (value: string) =>
          !closing.has(value) && !entries.current.get(value)?.disabled
        const neighbour =
          tabsInOrder.slice(index + 1).find(open) ??
          tabsInOrder.slice(0, Math.max(index, 0)).reverse().find(open)
        focus = neighbour ?? null
        if (neighbour !== undefined) current.select(neighbour, "none", event)
      }
      if (focus !== null && moveFocus) pendingFocus.current = focus
      onClose(values)
    },
    [listHasFocus, order]
  )

  const reorder = React.useCallback((value: string, next: Array<string>) => {
    const current = latest.current.root
    current.callbacks.current.onReorder?.(next)
    announce.current?.(
      current.messages.moved(
        entries.current.get(value)?.label ?? value,
        next.indexOf(value) + 1,
        next.length
      )
    )
  }, [])

  const move = React.useCallback<DocumentTabsListContextValue["move"]>(
    (value, delta) => {
      const current = order()
      const from = current.indexOf(value)
      const to = from + delta
      if (from < 0 || to < 0 || to >= current.length) return
      const next = current.filter((item) => item !== value)
      next.splice(to, 0, value)
      if (listHasFocus()) pendingFocus.current = value
      reorder(value, next)
    },
    [listHasFocus, order, reorder]
  )

  const drag = useDragReorder({
    axis: "x",
    direction,
    // Only the tabs in the row: the ones in the More menu stay put.
    getItems: () =>
      wrappers().filter((wrapper) => !("overflowing" in wrapper.dataset)),
    enabled: () =>
      latest.current.root.reorderable && latest.current.root.editing === null,
    onReorder: (from, to, visible) => {
      const value = visible[from].dataset.value!
      const others = visible
        .filter((_, at) => at !== from)
        .map((wrapper) => wrapper.dataset.value!)
      // Place it among every tab, hidden ones included.
      const next = order().filter((other) => other !== value)
      next.splice(
        to < others.length
          ? next.indexOf(others[to])
          : next.indexOf(others[others.length - 1]) + 1,
        0,
        value
      )
      reorder(value, next)
    },
  })

  const requestFocus = React.useCallback((value: string) => {
    pendingFocus.current = value
  }, [])

  const context = React.useMemo<DocumentTabsListContextValue>(
    () => ({
      size: size ?? "default",
      hidden,
      squeezed,
      entries,
      close,
      move,
      startDrag: drag.onPointerDown,
      touchAction: drag.touchAction,
      requestFocus,
      observe,
    }),
    [
      size,
      hidden,
      squeezed,
      close,
      move,
      drag.onPointerDown,
      drag.touchAction,
      requestFocus,
      observe,
    ]
  )

  // One context menu for the whole list: it acts on the tab it opened on.
  const target =
    menuTarget === null ? undefined : entries.current.get(menuTarget)
  const canRename = root.renamable && target !== undefined && !target.disabled
  const others = () =>
    order().filter(
      (value) => value !== menuTarget && entries.current.get(value)?.closable
    )
  const hasMenu = root.renamable || root.closable

  const tablist = (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="document-tabs-tablist"
      activateOnFocus={activateOnFocus}
      className="relative flex min-w-0 items-stretch overflow-hidden"
      {...props}
    >
      {tabs}
    </TabsPrimitive.List>
  )

  return (
    <DocumentTabsListContext value={context}>
      <div
        ref={rowRef}
        data-slot="document-tabs-list"
        data-size={size}
        className={cn(documentTabsListVariants({ size }), className)}
      >
        {hasMenu ? (
          <ContextMenu>
            <ContextMenuTrigger
              render={<div />}
              className="flex min-w-0"
              onContextMenu={(event) => {
                const wrapper = (event.target as Element).closest<HTMLElement>(
                  TRIGGER_SELECTOR
                )
                const value = wrapper?.dataset.value
                if (
                  value === undefined ||
                  entries.current.get(value)?.disabled ||
                  root.editing !== null
                ) {
                  event.preventBaseUIHandler()
                  return
                }
                setMenuTarget(value)
              }}
            >
              {tablist}
            </ContextMenuTrigger>
            <ContextMenuContent
              finalFocus={() => {
                const acted = menuAction.current
                menuAction.current = false
                return acted || menuTarget === null
                  ? false
                  : tabElement(menuTarget)
              }}
            >
              {canRename ? (
                <ContextMenuItem
                  onClick={() => {
                    menuAction.current = true
                    root.setEditing(menuTarget)
                  }}
                >
                  {root.messages.rename}
                </ContextMenuItem>
              ) : null}
              {canRename && root.closable ? <ContextMenuSeparator /> : null}
              {root.closable ? (
                <>
                  <ContextMenuItem
                    disabled={!target?.closable}
                    onClick={(event) => {
                      menuAction.current = true
                      close([menuTarget!], {
                        event: event.nativeEvent,
                        focus: true,
                      })
                    }}
                  >
                    {root.messages.close}
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={others().length === 0}
                    onClick={(event) => {
                      menuAction.current = true
                      requestFocus(menuTarget!)
                      close(others(), { event: event.nativeEvent })
                    }}
                  >
                    {root.messages.closeOthers}
                  </ContextMenuItem>
                </>
              ) : null}
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          tablist
        )}
        {more}
        {after}
        <Announcer handle={announce} />
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
  const [label, setLabel] = React.useState("")

  // The close button sits beside the tab, not in it: a button cannot hold
  // another button.
  const items = React.Children.toArray(children)
  const closeButton = items.find((item) => isElementOf(item, DocumentTabsClose))
  const content = items.filter((item) => !isElementOf(item, DocumentTabsClose))

  const closable = closeButton !== undefined && root.closable && !disabled
  const renamable = root.renamable && !disabled
  const active = root.value === value
  const overflowing = list.hidden.has(value)
  const editing = root.editing === value && !overflowing

  React.useLayoutEffect(() => {
    list.entries.current.set(value, { label, content, closable, disabled })
  })
  React.useLayoutEffect(() => {
    const entries = list.entries.current
    return () => {
      entries.delete(value)
    }
  }, [list.entries, value])

  const { close, requestFocus } = list
  const triggerContext = React.useMemo<DocumentTabsTriggerContextValue>(
    () => ({
      value,
      label,
      setLabel,
      close: (event) => close([value], { event }),
    }),
    [value, label, close]
  )

  const finishRename = (next: string | null, refocus: boolean) => {
    root.setEditing(null)
    const trimmed = next?.trim()
    if (trimmed && trimmed !== label)
      root.callbacks.current.onRename?.(value, trimmed)
    if (refocus) requestFocus(value)
  }

  return (
    <DocumentTabsTriggerContext value={triggerContext}>
      <div
        ref={list.observe}
        role="presentation"
        data-slot="document-tabs-trigger"
        data-value={value}
        data-active={active ? "" : undefined}
        data-closable={closable ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-overflowing={overflowing ? "" : undefined}
        data-squeezed={list.squeezed === value ? "" : undefined}
        aria-hidden={overflowing || undefined}
        style={
          overflowing
            ? OVERFLOWING_STYLE
            : root.reorderable
              ? { touchAction: list.touchAction }
              : undefined
        }
        // `**:transition-none`: a tab that moves into the menu hides at
        // once; a transition would keep its children visible for its length.
        className="group/document-tab relative flex shrink-0 items-stretch border-e border-border-subtle select-none [-webkit-touch-callout:none] data-dragging:z-10 data-dragging:shadow-md data-overflowing:**:transition-none data-squeezed:min-w-0 data-squeezed:shrink"
        onPointerDown={root.reorderable ? list.startDrag : undefined}
      >
        <TabsPrimitive.Tab
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
              close([value], { event: event.nativeEvent })
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
        {/* A tab in the More menu has nothing to press or edit. */}
        {closable && !overflowing ? closeButton : null}
        {editing ? (
          <RenameField
            label={label}
            name={`${root.messages.rename} ${label}`.trim()}
            onDone={finishRename}
          />
        ) : null}
      </div>
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
        "absolute inset-y-0 end-1.5 z-[1] my-auto text-muted-foreground opacity-0 group-focus-within/document-tab:opacity-100 group-hover/document-tab:opacity-100 group-data-active/document-tab:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
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
  if (list.hidden.size === 0) return null
  // In tab order: the set is built from the tabs in order.
  const hidden = Array.from(list.hidden)
  const count = hidden.length
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
        {hidden.map((value) => {
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
