"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  ChevronDownIcon,
  ListXIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
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
import { createStore, useStore, type Store } from "./internal/store"

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

/**
 * What changes while the user works the strip. Parts select the slice they
 * draw from this store, so a change re-renders only the tabs it concerns.
 */
type DocumentTabsState = {
  /** The open tab. */
  value: string | null
  /** The tab being renamed. */
  editing: string | null
  /** The tabs in the More menu, in tab order. */
  hidden: ReadonlySet<string>
  /** The open tab, when even alone it is wider than the room: it shrinks. */
  squeezed: string | null
}

type DocumentTabsRootContextValue = {
  store: Store<DocumentTabsState>
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
  setEditing: (value: string | null) => void
  messages: DocumentTabsMessages
}

const EMPTY_SET: ReadonlySet<string> = new Set()

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
  const [store] = React.useState(() =>
    createStore<DocumentTabsState>({
      value: controlled ? valueProp : defaultValue,
      editing: null,
      hidden: EMPTY_SET,
      squeezed: null,
    })
  )
  // A controlled value reaches the store once committed; the tab list
  // itself reads the prop directly.
  React.useLayoutEffect(() => {
    if (controlled) store.set({ value: valueProp })
  }, [controlled, valueProp, store])
  // Controlled, the root already has the value: it does not subscribe.
  const storeValue = useStore(store, (state) =>
    controlled ? null : state.value
  )
  const value = controlled ? valueProp : storeValue

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
      if (!controlled && !details.isCanceled) store.set({ value: next })
    },
    [controlled, store]
  )

  const setEditing = React.useCallback(
    (editing: string | null) => store.set({ editing }),
    [store]
  )

  const messages = React.useMemo(
    () => ({ ...DEFAULT_MESSAGES, ...messagesProp }),
    [messagesProp]
  )

  const closable = onClose !== undefined
  const renamable = onRename !== undefined
  const reorderable = onReorder !== undefined
  // Stable while the user works the strip: what changes is in `store`.
  const context = React.useMemo<DocumentTabsRootContextValue>(
    () => ({
      store,
      controlled,
      select,
      callbacks,
      closable,
      renamable,
      reorderable,
      setEditing,
      messages,
    }),
    [
      store,
      controlled,
      select,
      closable,
      renamable,
      reorderable,
      setEditing,
      messages,
    ]
  )

  return (
    <DocumentTabsRootContext value={context}>
      <TabsPrimitive.Root
        data-slot="document-tabs"
        value={value}
        onValueChange={(next, details) => {
          if (typeof next !== "string") return
          callbacks.current.onValueChange?.(next, details)
          if (!controlled && !details.isCanceled) store.set({ value: next })
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
  /** Close every closable tab but this one, and focus it. */
  closeOthers: (value: string, event?: Event) => void
  move: (value: string, delta: -1 | 1) => void
  /** Pointer down on a tab's wrapper: may start a drag to reorder. */
  startDrag: (event: React.PointerEvent<HTMLElement>) => void
  touchAction: "pan-y" | "pan-x"
  /** Focus this tab once it is rendered and visible. */
  requestFocus: (value: string) => void
  /** Moves focus to the requested tab if it can take it now. */
  flushFocus: () => void
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
  const { store } = root

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
    (item) =>
      !isElementOf(item, DocumentTabsAdd, DocumentTabsMore, DocumentTabsMenu)
  )
  const more = items.find((item) => isElementOf(item, DocumentTabsMore)) ?? (
    <DocumentTabsMore />
  )
  const after = items.filter((item) => isElementOf(item, DocumentTabsAdd))
  const menu = items.find((item) => isElementOf(item, DocumentTabsMenu)) as
    React.ReactElement<DocumentTabsMenuProps> | undefined
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
      store.set({ hidden: EMPTY_SET, squeezed: null })
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
      const open = store.get().value
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
    const previous = store.get().hidden
    store.set({
      hidden: sameSet(previous, next) ? previous : next,
      squeezed: squeeze,
    })
  }, [store, wrappers])

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

  // An uncontrolled strip opens its first tab, and opens the first one
  // again when the open tab goes away.
  const ensureSelection = React.useCallback(() => {
    const { controlled, select } = latest.current.root
    const open = store.get().value
    const values = order()
    if (controlled || values.length === 0) return
    if (open !== null && values.includes(open)) return
    const first = values.find((value) => !entries.current.get(value)?.disabled)
    if (first !== undefined)
      select(first, open === null ? "initial" : "missing")
  }, [order, store])

  // Measure again when the tabs, their order or the size change...
  React.useLayoutEffect(() => {
    measure()
    ensureSelection()
  }, [measure, ensureSelection, tabsKey, size])

  // ...and when another tab opens, without rendering the list again.
  React.useLayoutEffect(() => {
    let open = store.get().value
    return store.subscribe(() => {
      const next = store.get().value
      if (next === open) return
      open = next
      measure()
      ensureSelection()
    })
  }, [store, measure, ensureSelection])

  const flushFocus = React.useCallback(() => {
    if (pendingFocus.current === null) return
    const tab = tabElement(pendingFocus.current)
    if (!tab) return
    tab.focus()
    if (tab.ownerDocument.activeElement === tab) pendingFocus.current = null
  }, [tabElement])

  React.useLayoutEffect(() => {
    flushFocus()
  })

  const close = React.useCallback<DocumentTabsListContextValue["close"]>(
    (values, { event, focus: moveFocus = listHasFocus() } = {}) => {
      const current = latest.current.root
      const onClose = current.callbacks.current.onClose
      if (!onClose || values.length === 0) return
      const tabsInOrder = order()
      const closing = new Set(values)
      const openValue = store.get().value
      let focus = openValue
      if (openValue !== null && closing.has(openValue)) {
        const index = tabsInOrder.indexOf(openValue)
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
    [listHasFocus, order, store]
  )

  const closeOthers = React.useCallback<
    DocumentTabsListContextValue["closeOthers"]
  >(
    (value, event) => {
      const others = order().filter(
        (other) => other !== value && entries.current.get(other)?.closable
      )
      if (others.length === 0) return
      close(others, { event, focus: false })
      pendingFocus.current = value
    },
    [close, order]
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
      latest.current.root.reorderable && store.get().editing === null,
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
      entries,
      close,
      closeOthers,
      move,
      startDrag: drag.onPointerDown,
      touchAction: drag.touchAction,
      requestFocus,
      flushFocus,
      observe,
    }),
    [
      size,
      close,
      closeOthers,
      move,
      drag.onPointerDown,
      drag.touchAction,
      requestFocus,
      flushFocus,
      observe,
    ]
  )

  const hasMenu = menu ? !menu.props.disabled : root.renamable || root.closable
  // Built once: an announcement re-renders the live region alone.
  const announcer = React.useMemo(() => <Announcer handle={announce} />, [])

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
          <TabsContextMenu menu={menu ?? <DocumentTabsMenu />}>
            {tablist}
          </TabsContextMenu>
        ) : (
          tablist
        )}
        {more}
        {after}
        {announcer}
      </div>
    </DocumentTabsListContext>
  )
}

/**
 * One context menu for the whole list: it acts on the tab it opened on. Its
 * state lives here, so opening it renders the menu, not the tabs.
 */
function TabsContextMenu({
  menu,
  children,
}: {
  menu: React.ReactNode
  children: React.ReactNode
}) {
  const root = useRootContext("DocumentTabsList")
  const list = useListContext("DocumentTabsList")
  const [target, setTarget] = React.useState<string | null>(null)
  const acted = React.useRef(false)
  const focusBefore = React.useRef<Element | null>(null)

  // The tab under the pointer, or the focused one for the keyboard; false
  // when the menu must not open there.
  const aim = (eventTarget: EventTarget | null) => {
    const value = (eventTarget as Element | null)?.closest<HTMLElement>(
      TRIGGER_SELECTOR
    )?.dataset.value
    if (
      value === undefined ||
      list.entries.current.get(value)?.disabled ||
      root.store.get().editing !== null
    )
      return false
    const doc = (eventTarget as Element).ownerDocument
    focusBefore.current = doc.activeElement
    setTarget(value)
    return true
  }

  const menuContext = React.useMemo<DocumentTabsMenuContextValue>(
    () => ({
      value: target,
      act: () => {
        acted.current = true
      },
      // Focus goes back where it was: a right click neither focuses nor
      // opens the tab it was on.
      finalFocus: () => {
        const took = acted.current
        acted.current = false
        const before = focusBefore.current
        if (took || !(before instanceof HTMLElement) || !before.isConnected)
          return false
        return before === before.ownerDocument.body ? false : before
      },
    }),
    [target]
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<div />}
        className="flex min-w-0"
        // A secondary press does not move focus to the tab it is on.
        onMouseDown={(event) => {
          if (event.button !== 0) event.preventDefault()
        }}
        onTouchStart={(event) => {
          if (!aim(event.target)) event.preventBaseUIHandler()
        }}
        onContextMenu={(event) => {
          if (!aim(event.target)) event.preventBaseUIHandler()
        }}
      >
        {children}
      </ContextMenuTrigger>
      <DocumentTabsMenuContext value={menuContext}>
        {menu}
      </DocumentTabsMenuContext>
    </ContextMenu>
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
  // Each tab selects its own slice: another tab opening or overflowing does
  // not render this one again.
  const active = useStore(root.store, (state) => state.value === value)
  const overflowing = useStore(root.store, (state) => state.hidden.has(value))
  const squeezed = useStore(root.store, (state) => state.squeezed === value)
  const editing =
    useStore(root.store, (state) => state.editing === value) && !overflowing

  React.useLayoutEffect(() => {
    list.entries.current.set(value, { label, content, closable, disabled })
  })
  React.useLayoutEffect(() => {
    const entries = list.entries.current
    return () => {
      entries.delete(value)
    }
  }, [list.entries, value])

  const { close, requestFocus, flushFocus } = list
  // A requested focus can land once this tab opens, shows or stops editing.
  React.useLayoutEffect(() => {
    flushFocus()
  }, [flushFocus, active, overflowing, editing])
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
        data-squeezed={squeezed ? "" : undefined}
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
            if (event.key === "Delete" && event.shiftKey && root.closable) {
              event.preventDefault()
              list.closeOthers(value, event.nativeEvent)
            } else if (event.key === "Delete" && closable) {
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
  const hiddenSet = useStore(root.store, (state) => state.hidden)
  // The tab picked in the menu opens once the menu has closed: opening it
  // moves the trigger, and the closing menu would follow it.
  const picked = React.useRef<string | null>(null)
  // The opened tab takes focus, not the trigger.
  const keepFocus = React.useRef(false)
  if (hiddenSet.size === 0) return null
  // In tab order: the set is built from the tabs in order.
  const hidden = Array.from(hiddenSet)
  const count = hidden.length
  return (
    // Not modal: like a browser's tab list, it neither locks the page's
    // scroll nor hides the page from assistive technology.
    <DropdownMenu
      modal={false}
      onOpenChangeComplete={(open) => {
        const value = picked.current
        if (open || value === null) return
        picked.current = null
        list.requestFocus(value)
        root.select(value)
      }}
    >
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
          const keep = keepFocus.current
          keepFocus.current = false
          return !keep
        }}
      >
        {hidden.map((value) => {
          const entry = list.entries.current.get(value)
          return (
            <DropdownMenuItem
              key={value}
              data-value={value}
              disabled={entry?.disabled}
              onClick={() => {
                picked.current = value
                keepFocus.current = true
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

/* -------------------------------------------------------------------------- */
/* Context menu                                                               */
/* -------------------------------------------------------------------------- */

type DocumentTabsMenuContextValue = {
  /** The tab the menu opened on. */
  value: string | null
  /** Marks that an item took over focus (rename field, closing). */
  act: () => void
  finalFocus: () => HTMLElement | false | null
}

const DocumentTabsMenuContext =
  React.createContext<DocumentTabsMenuContextValue | null>(null)

function useMenuContext(part: string) {
  const context = React.useContext(DocumentTabsMenuContext)
  if (!context)
    throw new Error(`${part} must be used within <DocumentTabsMenu>`)
  return context
}

type DocumentTabsMenuProps = Omit<
  React.ComponentProps<typeof ContextMenuContent>,
  "children"
> & {
  /**
   * The items, or a function of the value of the tab the menu opened on.
   * Default: rename, close and close other tabs.
   */
  children?: React.ReactNode | ((value: string) => React.ReactNode)
  /** No context menu on the tabs. */
  disabled?: boolean
}

/**
 * The context menu of the tabs, opened by right click, long press, Shift+F10
 * or the context menu key on a tab. Render it in `DocumentTabsList` to choose
 * its items; without it the list shows the default items.
 */
function DocumentTabsMenu({
  children,
  disabled: _disabled,
  finalFocus,
  ...props
}: DocumentTabsMenuProps) {
  const root = useRootContext("DocumentTabsMenu")
  const menu = useMenuContext("DocumentTabsMenu")
  let content: React.ReactNode = null
  if (menu.value !== null) {
    content =
      typeof children === "function"
        ? children(menu.value)
        : (children ?? (
            <>
              <DocumentTabsMenuRename />
              {root.renamable && root.closable ? (
                <ContextMenuSeparator />
              ) : null}
              <DocumentTabsMenuClose />
              <DocumentTabsMenuCloseOthers />
            </>
          ))
  }
  return (
    <ContextMenuContent finalFocus={finalFocus ?? menu.finalFocus} {...props}>
      {content}
    </ContextMenuContent>
  )
}

type DocumentTabsMenuItemProps = React.ComponentProps<typeof ContextMenuItem>

/** Renames the tab the menu opened on. Renders nothing without `onRename`. */
function DocumentTabsMenuRename({
  children,
  disabled,
  onClick,
  ...props
}: DocumentTabsMenuItemProps) {
  const root = useRootContext("DocumentTabsMenuRename")
  const list = useListContext("DocumentTabsMenuRename")
  const menu = useMenuContext("DocumentTabsMenuRename")
  const value = menu.value
  if (!root.renamable || value === null) return null
  const entry = list.entries.current.get(value)
  return (
    <ContextMenuItem
      // The shortcut hint is drawn for the eye and announced from here.
      aria-keyshortcuts={children === undefined ? "F2" : undefined}
      disabled={disabled || !entry || entry.disabled}
      onClick={(event) => {
        onClick?.(event)
        menu.act()
        root.setEditing(value)
      }}
      {...props}
    >
      {children ?? (
        <>
          <PencilIcon />
          {root.messages.rename}
          <ContextMenuShortcut aria-hidden>F2</ContextMenuShortcut>
        </>
      )}
    </ContextMenuItem>
  )
}

/** Closes the tab the menu opened on. Renders nothing without `onClose`. */
function DocumentTabsMenuClose({
  children,
  disabled,
  onClick,
  ...props
}: DocumentTabsMenuItemProps) {
  const root = useRootContext("DocumentTabsMenuClose")
  const list = useListContext("DocumentTabsMenuClose")
  const menu = useMenuContext("DocumentTabsMenuClose")
  const value = menu.value
  if (!root.closable || value === null) return null
  return (
    <ContextMenuItem
      // The shortcut hint is drawn for the eye and announced from here.
      aria-keyshortcuts={children === undefined ? "Delete" : undefined}
      disabled={disabled || !list.entries.current.get(value)?.closable}
      onClick={(event) => {
        onClick?.(event)
        menu.act()
        list.close([value], { event: event.nativeEvent, focus: true })
      }}
      {...props}
    >
      {children ?? (
        <>
          <XIcon />
          {root.messages.close}
          <ContextMenuShortcut aria-hidden>Del</ContextMenuShortcut>
        </>
      )}
    </ContextMenuItem>
  )
}

/**
 * Closes every closable tab but the one the menu opened on. Renders nothing
 * without `onClose`.
 */
function DocumentTabsMenuCloseOthers({
  children,
  disabled,
  onClick,
  ...props
}: DocumentTabsMenuItemProps) {
  const root = useRootContext("DocumentTabsMenuCloseOthers")
  const list = useListContext("DocumentTabsMenuCloseOthers")
  const menu = useMenuContext("DocumentTabsMenuCloseOthers")
  const value = menu.value
  if (!root.closable || value === null) return null
  const none = !Array.from(list.entries.current).some(
    ([other, entry]) => other !== value && entry.closable
  )
  return (
    <ContextMenuItem
      // The shortcut hint is drawn for the eye and announced from here.
      aria-keyshortcuts={children === undefined ? "Shift+Delete" : undefined}
      disabled={disabled || none}
      onClick={(event) => {
        onClick?.(event)
        menu.act()
        list.closeOthers(value, event.nativeEvent)
      }}
      {...props}
    >
      {children ?? (
        <>
          <ListXIcon />
          {root.messages.closeOthers}
          <ContextMenuShortcut aria-hidden>⇧Del</ContextMenuShortcut>
        </>
      )}
    </ContextMenuItem>
  )
}

function DocumentTabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="document-tabs-content"
      // The panel that is leaving hides at once: kept for its exit animation,
      // it would stack on the new one for a frame and shift the page.
      className={cn(
        "flex-1 text-sm outline-none data-ending-style:hidden",
        className
      )}
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
  DocumentTabsMenu,
  DocumentTabsMenuRename,
  DocumentTabsMenuClose,
  DocumentTabsMenuCloseOthers,
  DocumentTabsContent,
  documentTabsListVariants,
}
export type {
  DocumentTabsProps,
  DocumentTabsListProps,
  DocumentTabsTriggerProps,
  DocumentTabsMenuProps,
  DocumentTabsMessages,
  DocumentTabsChangeEventDetails,
}
