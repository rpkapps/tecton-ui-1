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
 * Tecton DocumentTabs — workspace tabs the user opens, closes, renames and
 * reorders. The parts mirror the shadcn `Tabs`; the tabs are application
 * state, updated from `onClose`, `onRename` and `onReorder`. Overflow rules:
 * `docs/OVERFLOW-RULES.md` §15.4.
 */

type DocumentTabsChangeEventDetails = TabsPrimitive.Root.ChangeEventDetails
type ChangeReason = TabsPrimitive.Root.ChangeEventReason

/** The words the strip says; pass `messages` on `DocumentTabs` to translate. */
const DEFAULT_MESSAGES = {
  add: "New tab",
  more: "More tabs",
  rename: "Rename",
  close: "Close",
  closeOthers: "Close other tabs",
  moved: (label: string, position: number, total: number) =>
    `${label} moved to position ${position} of ${total}`,
}
type DocumentTabsMessages = typeof DEFAULT_MESSAGES

/** What changes as the user works the strip; each part selects its slice. */
type DocumentTabsState = {
  value: string | null
  editing: string | null
  /** The tabs in the More menu, in tab order. */
  hidden: ReadonlySet<string>
  /** The open tab, when even alone it is wider than the room: it shrinks. */
  squeezed: string | null
  /** The tab the context menu opened on. */
  menu: string | null
}

const EMPTY: ReadonlySet<string> = new Set()
const TRIGGER = '[data-slot="document-tabs-trigger"]'
/** Room kept for the More trigger before it has been measured. */
const MORE_WIDTH = 48

function useRequired<T>(context: React.Context<T | null>, parent: string) {
  const value = React.useContext(context)
  if (!value) throw new Error(`Must be used within <${parent}>`)
  return value
}

function isElementOf(
  node: React.ReactNode,
  ...types: Array<React.ElementType>
): node is React.ReactElement {
  return React.isValidElement(node) && types.includes(node.type as never)
}

/** The details of a change the strip makes itself (closing, the More menu). */
function changeDetails(reason: ChangeReason, event?: Event) {
  let canceled = false
  return {
    reason,
    event: event ?? new Event("change"),
    trigger: undefined,
    activationDirection: "none",
    cancel: () => (canceled = true),
    allowPropagation: () => {},
    get isCanceled() {
      return canceled
    },
    isPropagationAllowed: false,
  } as DocumentTabsChangeEventDetails
}

type DocumentTabsProps = Omit<
  TabsPrimitive.Root.Props,
  "value" | "defaultValue" | "onValueChange" | "orientation"
> & {
  value?: string | null
  /** Default: the first tab. */
  defaultValue?: string | null
  onValueChange?: (
    value: string,
    eventDetails: DocumentTabsChangeEventDetails
  ) => void
  /** Called with the values to close; the open tab's neighbour opens first. */
  onClose?: (values: Array<string>) => void
  /** Called with the trimmed new label. Without it, tabs cannot be renamed. */
  onRename?: (value: string, label: string) => void
  /** Called with every value in the new order. Without it, tabs stay put. */
  onReorder?: (values: Array<string>) => void
  messages?: Partial<DocumentTabsMessages>
}

type Callbacks = Pick<
  DocumentTabsProps,
  "onValueChange" | "onClose" | "onRename" | "onReorder"
>

function rootContext(
  store: Store<DocumentTabsState>,
  controlled: boolean,
  callbacks: React.RefObject<Callbacks>,
  { closable = false, renamable = false, reorderable = false },
  messages: DocumentTabsMessages
) {
  const commit = (next: string, details: DocumentTabsChangeEventDetails) => {
    callbacks.current.onValueChange?.(next, details)
    if (!controlled && !details.isCanceled) store.set({ value: next })
  }
  return {
    store,
    controlled,
    callbacks,
    closable,
    renamable,
    reorderable,
    messages,
    commit,
    select: (next: string, reason: ChangeReason = "none", event?: Event) =>
      commit(next, changeDetails(reason, event)),
    setEditing: (editing: string | null) => store.set({ editing }),
  }
}
type RootContext = ReturnType<typeof rootContext>

const RootContext = React.createContext<RootContext | null>(null)
const useRoot = () => useRequired(RootContext, "DocumentTabs")

function DocumentTabs({
  className,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onClose,
  onRename,
  onReorder,
  messages,
  ...props
}: DocumentTabsProps) {
  const controlled = valueProp !== undefined
  const [store] = React.useState(() =>
    createStore<DocumentTabsState>({
      value: controlled ? valueProp : defaultValue,
      editing: null,
      hidden: EMPTY,
      squeezed: null,
      menu: null,
    })
  )
  // Controlled, the value reaches the store once committed.
  React.useLayoutEffect(() => {
    if (controlled) store.set({ value: valueProp })
  }, [controlled, valueProp, store])
  const storeValue = useStore(store, (s) => (controlled ? null : s.value))

  const callbacks = React.useRef<Callbacks>({})
  React.useInsertionEffect(() => {
    callbacks.current = { onValueChange, onClose, onRename, onReorder }
  })

  const closable = !!onClose
  const renamable = !!onRename
  const reorderable = !!onReorder
  const context = React.useMemo(
    () =>
      rootContext(
        store,
        controlled,
        callbacks,
        { closable, renamable, reorderable },
        { ...DEFAULT_MESSAGES, ...messages }
      ),
    [store, controlled, closable, renamable, reorderable, messages]
  )

  return (
    <RootContext value={context}>
      <TabsPrimitive.Root
        data-slot="document-tabs"
        value={controlled ? valueProp : storeValue}
        onValueChange={(next, details) => {
          if (typeof next === "string") context.commit(next, details)
        }}
        className={cn("flex min-w-0 flex-col", className)}
        {...props}
      />
    </RootContext>
  )
}

type TabEntry = {
  label: string
  /** The tab's content without its close button, for the More menu. */
  content: React.ReactNode
  closable: boolean
  disabled: boolean
}

/** Everything the list does, created once: the list context never changes. */
function listController() {
  const row = React.createRef<HTMLDivElement>()
  const tablist = React.createRef<HTMLDivElement>()
  const announcer = React.createRef<HTMLDivElement>()
  const entries = new Map<string, TabEntry>()
  // Each tab's own width, kept while it is squeezed below it.
  const natural = new Map<string, number>()
  let moreWidth = MORE_WIDTH
  let pendingFocus: string | null = null
  let observer: ResizeObserver | null = null
  // Set by the list as it renders; read by the tabs and the methods below.
  const live = {
    root: null as unknown as RootContext,
    size: "default" as "default" | "sm",
    rtl: false,
    startDrag: (_event: React.PointerEvent<HTMLElement>) => {},
    touchAction: "pan-y" as "pan-y" | "pan-x",
  }

  const wrappers = () =>
    Array.from(tablist.current?.querySelectorAll<HTMLElement>(TRIGGER) ?? [])
  const order = () => wrappers().map((el) => el.dataset.value!)
  const hasFocus = () =>
    !!tablist.current?.contains(tablist.current.ownerDocument.activeElement)

  /** The longest run of leading tabs that fits beside the open one shows. */
  function measure() {
    const { store } = live.root
    if (!row.current || !tablist.current) return
    let room = row.current.getBoundingClientRect().width
    // Not laid out (display: none, or no layout at all): nothing overflows.
    if (room === 0) return store.set({ hidden: EMPTY, squeezed: null })
    for (const child of row.current.children) {
      const slot = (child as HTMLElement).dataset.slot
      if (child.contains(tablist.current) || slot?.endsWith("announcer"))
        continue
      const width = child.getBoundingClientRect().width
      if (slot !== "document-tabs-more") room -= width
      else if (width > 0) moreWidth = width
    }
    const elements = wrappers()
    const values = elements.map((el) => el.dataset.value!)
    const widths = elements.map((el, i) => {
      const width = el.getBoundingClientRect().width
      if ("squeezed" in el.dataset) return natural.get(values[i]) ?? width
      natural.set(values[i], width)
      return width
    })
    let next = EMPTY
    let squeezed: string | null = null
    if (widths.reduce((sum, width) => sum + width, 0) > room + 0.5) {
      const open = store.get().value
      const active = open === null ? -1 : values.indexOf(open)
      const own = active >= 0 ? widths[active] : 0
      if (own > room - moreWidth) squeezed = open
      let budget = room - moreWidth - own
      const visible = new Set([active])
      for (let i = 0; i < values.length; i++) {
        if (i === active) continue
        if (widths[i] > budget) break
        budget -= widths[i]
        visible.add(i)
      }
      next = new Set(values.filter((_, i) => !visible.has(i)))
    }
    const previous = store.get().hidden
    const same =
      previous.size === next.size && [...next].every((v) => previous.has(v))
    store.set({ hidden: same ? previous : next, squeezed })
  }

  // One observer, created on first use: tabs register before list effects.
  function observe(element: HTMLElement | null) {
    if (!element || typeof ResizeObserver === "undefined") return
    const current = (observer ??= new ResizeObserver(measure))
    current.observe(element)
    return () => current.unobserve(element)
  }
  function connect() {
    observe(row.current)
    for (const el of wrappers()) observe(el)
    return () => {
      observer?.disconnect()
      observer = null
    }
  }

  /** Uncontrolled, the first tab opens, and opens again when the open one goes. */
  function ensureSelection() {
    const { controlled, store, select } = live.root
    const open = store.get().value
    const values = order()
    if (controlled || !values.length || (open && values.includes(open))) return
    const first = values.find((v) => !entries.get(v)?.disabled)
    if (first) select(first, open === null ? "initial" : "missing")
  }

  function requestFocus(value: string) {
    pendingFocus = value
  }
  function flushFocus() {
    const tab =
      pendingFocus === null
        ? null
        : tablist.current?.querySelector<HTMLElement>(
            `${TRIGGER}[data-value="${CSS.escape(pendingFocus)}"] [role="tab"]`
          )
    tab?.focus()
    if (tab && tab.ownerDocument.activeElement === tab) pendingFocus = null
  }

  /** Close tabs; the open tab's neighbour opens (and takes focus) first. */
  function close(
    values: Array<string>,
    { event, focus = hasFocus() }: { event?: Event; focus?: boolean } = {}
  ) {
    const { callbacks, store, select } = live.root
    if (!callbacks.current.onClose || !values.length) return
    const tabs = order()
    const closing = new Set(values)
    let next = store.get().value
    if (next !== null && closing.has(next)) {
      const index = tabs.indexOf(next)
      const open = (v: string) => !closing.has(v) && !entries.get(v)?.disabled
      next =
        tabs.slice(index + 1).find(open) ??
        tabs.slice(0, index).reverse().find(open) ??
        null
      if (next !== null) select(next, "none", event)
    }
    if (next !== null && focus) pendingFocus = next
    callbacks.current.onClose(values)
  }
  function closeOthers(value: string, event?: Event) {
    const others = order().filter(
      (v) => v !== value && entries.get(v)?.closable
    )
    if (!others.length) return
    close(others, { event, focus: false })
    pendingFocus = value
  }

  function reorder(value: string, next: Array<string>) {
    const { callbacks, messages } = live.root
    callbacks.current.onReorder?.(next)
    // Written straight into the live region: announcing renders nothing.
    if (announcer.current)
      announcer.current.textContent = messages.moved(
        entries.get(value)?.label ?? value,
        next.indexOf(value) + 1,
        next.length
      )
  }
  function move(value: string, delta: number) {
    const tabs = order()
    const to = tabs.indexOf(value) + delta
    if (to < 0 || to >= tabs.length) return
    const next = tabs.filter((v) => v !== value)
    next.splice(to, 0, value)
    if (hasFocus()) pendingFocus = value
    reorder(value, next)
  }
  /** A drag among the visible tabs, placed among all of them. */
  function drop(from: number, to: number, visible: Array<HTMLElement>) {
    const value = visible[from].dataset.value!
    const others = visible
      .filter((_, i) => i !== from)
      .map((el) => el.dataset.value!)
    const next = order().filter((v) => v !== value)
    next.splice(
      to < others.length
        ? next.indexOf(others[to])
        : next.indexOf(others[others.length - 1]) + 1,
      0,
      value
    )
    reorder(value, next)
  }

  return Object.assign(live, {
    row,
    tablist,
    announcer,
    entries,
    wrappers,
    measure,
    observe,
    connect,
    ensureSelection,
    requestFocus,
    flushFocus,
    close,
    closeOthers,
    move,
    drop,
  })
}

type ListContext = ReturnType<typeof listController>

const ListContext = React.createContext<ListContext | null>(null)
const useList = () => useRequired(ListContext, "DocumentTabsList")

const documentTabsListVariants = cva(
  "group/document-tabs-list relative flex w-full min-w-0 items-stretch border-b border-border-subtle bg-card text-sm",
  {
    variants: { size: { default: "h-10", sm: "h-9" } },
    defaultVariants: { size: "default" },
  }
)

type DocumentTabsListProps = TabsPrimitive.List.Props &
  VariantProps<typeof documentTabsListVariants>

function DocumentTabsList({
  className,
  size = "default",
  activateOnFocus = true,
  children,
  ...props
}: DocumentTabsListProps) {
  const root = useRoot()
  const direction = useDirection()
  const [ctl] = React.useState(listController)
  const drag = useDragReorder({
    direction,
    // Only the tabs in the row: the ones in the More menu stay put.
    getItems: () =>
      ctl.wrappers().filter((el) => !("overflowing" in el.dataset)),
    enabled: () => root.reorderable && root.store.get().editing === null,
    onReorder: ctl.drop,
  })
  // Read by the tabs as they render; the context itself never changes.
  Object.assign(ctl, {
    root,
    size: size ?? "default",
    rtl: direction === "rtl",
    startDrag: drag.onPointerDown,
    touchAction: drag.touchAction,
  })

  // A tablist owns tabs only: the add button and the menus sit beside it.
  const items = React.Children.toArray(children)
  const tabs = items.filter(
    (item) =>
      !isElementOf(item, DocumentTabsAdd, DocumentTabsMore, DocumentTabsMenu)
  )
  const more = items.find((item) => isElementOf(item, DocumentTabsMore))
  const menu = items.find((item) => isElementOf(item, DocumentTabsMenu)) as
    React.ReactElement<DocumentTabsMenuProps> | undefined
  const tabsKey = tabs
    .map((tab) =>
      React.isValidElement<{ value?: string }>(tab)
        ? (tab.props.value ?? tab.key)
        : ""
    )
    .join("\u0000")

  React.useEffect(() => ctl.connect(), [ctl])
  // Measure again when the tabs, their order or the size change...
  React.useLayoutEffect(() => {
    ctl.measure()
    ctl.ensureSelection()
  }, [ctl, tabsKey, size])
  // ...and when another tab opens, without rendering the list again.
  React.useLayoutEffect(() => {
    let open = root.store.get().value
    return root.store.subscribe(() => {
      if (root.store.get().value === open) return
      open = root.store.get().value
      ctl.measure()
      ctl.ensureSelection()
    })
  }, [ctl, root.store])
  React.useLayoutEffect(() => ctl.flushFocus())

  const tablist = (
    <TabsPrimitive.List
      ref={ctl.tablist}
      data-slot="document-tabs-tablist"
      activateOnFocus={activateOnFocus}
      className="relative flex min-w-0 items-stretch overflow-hidden"
      {...props}
    >
      {tabs}
    </TabsPrimitive.List>
  )

  return (
    <ListContext value={ctl}>
      <div
        ref={ctl.row}
        data-slot="document-tabs-list"
        data-size={size}
        className={cn(documentTabsListVariants({ size }), className)}
      >
        {(menu ? !menu.props.disabled : root.renamable || root.closable) ? (
          <TabsContextMenu menu={menu ?? <DocumentTabsMenu />}>
            {tablist}
          </TabsContextMenu>
        ) : (
          tablist
        )}
        {more ?? <DocumentTabsMore />}
        {items.filter((item) => isElementOf(item, DocumentTabsAdd))}
        <div
          ref={ctl.announcer}
          data-slot="document-tabs-announcer"
          aria-live="polite"
          className="sr-only"
        />
      </div>
    </ListContext>
  )
}

type TriggerContext = {
  label: string
  setLabel: (label: string) => void
  close: (event?: Event) => void
}

const TriggerContext = React.createContext<TriggerContext | null>(null)

const ARROWS: Partial<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

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
  ...props
}: DocumentTabsTriggerProps) {
  const root = useRoot()
  const list = useList()
  const [label, setLabel] = React.useState("")

  // The close button sits beside the tab: a button cannot hold a button.
  const items = React.Children.toArray(children)
  const closeButton = items.find((item) => isElementOf(item, DocumentTabsClose))
  const content = items.filter((item) => item !== closeButton)
  const closable = !!closeButton && root.closable && !disabled
  const renamable = root.renamable && !disabled

  // Each tab selects its own slice, so other tabs' changes skip it.
  const active = useStore(root.store, (s) => s.value === value)
  const overflowing = useStore(root.store, (s) => s.hidden.has(value))
  const squeezed = useStore(root.store, (s) => s.squeezed === value)
  const editing =
    useStore(root.store, (s) => s.editing === value) && !overflowing

  React.useLayoutEffect(() => {
    list.entries.set(value, { label, content, closable, disabled })
    return () => void list.entries.delete(value)
  })
  // A requested focus can land once this tab opens, shows or stops editing.
  React.useLayoutEffect(
    () => list.flushFocus(),
    [list, active, overflowing, editing]
  )

  const finishRename = (next: string | null, refocus: boolean) => {
    root.setEditing(null)
    const trimmed = next?.trim()
    if (trimmed && trimmed !== label)
      root.callbacks.current.onRename?.(value, trimmed)
    if (refocus) list.requestFocus(value)
  }

  const flag = (on: boolean) => (on ? "" : undefined)
  return (
    <TriggerContext
      value={{
        label,
        setLabel,
        close: (event) => list.close([value], { event }),
      }}
    >
      <div
        ref={list.observe}
        role="presentation"
        data-slot="document-tabs-trigger"
        data-value={value}
        data-active={flag(active)}
        data-closable={flag(closable)}
        data-disabled={flag(disabled)}
        data-overflowing={flag(overflowing)}
        data-squeezed={flag(squeezed)}
        style={
          overflowing
            ? OVERFLOWING_STYLE
            : root.reorderable
              ? { touchAction: list.touchAction }
              : undefined
        }
        // The wrapper is the surface, so the close button shares its colours;
        // a tab moving into the menu hides at once (`**:transition-none`).
        className="group/document-tab relative flex shrink-0 items-stretch border-e border-border-subtle text-muted-foreground transition-colors select-none [-webkit-touch-callout:none] hover:bg-ghost-hover hover:text-foreground data-dragging:z-10 data-dragging:bg-background data-dragging:shadow-md data-overflowing:**:transition-none data-squeezed:min-w-0 data-squeezed:shrink data-disabled:pointer-events-none data-disabled:text-disabled-subtle-foreground data-active:bg-background data-active:text-foreground"
        onPointerDown={root.reorderable ? list.startDrag : undefined}
      >
        {/* `transition`, not `transition-all`: a tab back from the More menu
            must be visible at once to take focus. */}
        <TabsPrimitive.Tab
          data-slot="document-tabs-tab"
          data-size={list.size}
          data-closable={flag(closable)}
          data-squeezed={flag(squeezed)}
          value={value}
          disabled={disabled}
          className={cn(
            "relative flex h-full max-w-80 min-w-24 items-center gap-2 px-3 whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-closable:pe-9 data-squeezed:min-w-0 data-squeezed:shrink data-squeezed:overflow-hidden data-[size=sm]:min-w-20 data-[size=sm]:px-2.5 data-[size=sm]:data-closable:pe-8 *:data-[slot=badge]:shrink-0 data-squeezed:*:data-[slot=badge]:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-outline-active-border after:opacity-0 after:transition-opacity data-active:after:opacity-100",
            className
          )}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) return
            const arrow = ARROWS[event.key]
            if (event.key === "Delete" && event.shiftKey && root.closable)
              list.closeOthers(value, event.nativeEvent)
            else if (event.key === "Delete" && closable)
              list.close([value], { event: event.nativeEvent })
            else if (event.key === "F2" && renamable) root.setEditing(value)
            else if (
              arrow &&
              root.reorderable &&
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey
            ) {
              event.stopPropagation()
              list.move(value, list.rtl ? -arrow : arrow)
            } else return
            event.preventDefault()
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
    </TriggerContext>
  )
}

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
      // The arrow keys move the caret, not the focus between tabs.
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key !== "Enter" && event.key !== "Escape") return
        event.preventDefault()
        finish(event.key === "Enter" ? event.currentTarget.value : null, true)
      }}
      onBlur={(event) => finish(event.currentTarget.value, false)}
    />
  )
}

/** The tab's name: what rename edits and what the More menu and announcements say. */
function DocumentTabsLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const trigger = React.useContext(TriggerContext)
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
  const root = useRoot()
  const trigger = useRequired(TriggerContext, "DocumentTabsTrigger")
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
  const root = useRoot()
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

/** The menu of the tabs that do not fit, in tab order; rendered by the list. */
function DocumentTabsMore({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof Button>) {
  const root = useRoot()
  const list = useList()
  const hidden = useStore(root.store, (s) => s.hidden)
  // The picked tab opens (and takes focus) once the menu has closed, so
  // the closing menu does not follow its moving trigger.
  const picked = React.useRef<string | null>(null)
  const keepFocus = React.useRef(false)
  if (!hidden.size) return null
  return (
    // Not modal: no scroll lock or inert page, like a browser's tab list.
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
            aria-label={`${ariaLabel ?? root.messages.more} (${hidden.size})`}
            className={cn("mx-1 shrink-0 self-center tabular-nums", className)}
            {...props}
          />
        }
      >
        {hidden.size}
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
        {[...hidden].map((value) => (
          <DropdownMenuItem
            key={value}
            disabled={list.entries.get(value)?.disabled}
            onClick={() => {
              picked.current = value
              keepFocus.current = true
            }}
          >
            {list.entries.get(value)?.content ?? value}
          </DropdownMenuItem>
        ))}
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
      // The leaving panel hides at once instead of stacking for a frame.
      className={cn(
        "flex-1 text-sm outline-none data-ending-style:hidden",
        className
      )}
      {...props}
    />
  )
}

type MenuContext = {
  /** Marks that an item took over focus (rename field, closing). */
  act: () => void
  finalFocus: () => HTMLElement | false
}

const MenuContext = React.createContext<MenuContext | null>(null)

/** One menu for the list; a right click neither focuses nor opens the tab. */
function TabsContextMenu({
  menu,
  children,
}: {
  menu: React.ReactNode
  children: React.ReactNode
}) {
  const root = useRoot()
  const list = useList()
  const [context] = React.useState(() => {
    let acted = false
    let before: Element | null = null
    return {
      aim(target: EventTarget | null) {
        const value = (target as Element).closest<HTMLElement>(TRIGGER)?.dataset
          .value
        if (
          !value ||
          list.entries.get(value)?.disabled ||
          root.store.get().editing !== null
        )
          return false
        before = (target as Element).ownerDocument.activeElement
        root.store.set({ menu: value })
        return true
      },
      act: () => void (acted = true),
      finalFocus() {
        const took = acted
        acted = false
        return !took &&
          before instanceof HTMLElement &&
          before.isConnected &&
          before !== before.ownerDocument.body
          ? before
          : false
      },
    }
  })
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<div />}
        className="flex min-w-0"
        onMouseDown={(event) => {
          if (event.button !== 0) event.preventDefault()
        }}
        onTouchStart={(event) => {
          if (!context.aim(event.target)) event.preventBaseUIHandler()
        }}
        onContextMenu={(event) => {
          if (!context.aim(event.target)) event.preventBaseUIHandler()
        }}
      >
        {children}
      </ContextMenuTrigger>
      <MenuContext value={context}>{menu}</MenuContext>
    </ContextMenu>
  )
}

type DocumentTabsMenuProps = Omit<
  React.ComponentProps<typeof ContextMenuContent>,
  "children"
> & {
  /** The items, or a function of the value of the tab the menu opened on. */
  children?: React.ReactNode | ((value: string) => React.ReactNode)
  /** No context menu on the tabs. */
  disabled?: boolean
}

/** The tabs' context menu. Default items: rename, close, close others. */
function DocumentTabsMenu({
  children,
  disabled: _disabled,
  finalFocus,
  ...props
}: DocumentTabsMenuProps) {
  const root = useRoot()
  const menu = useRequired(MenuContext, "DocumentTabsList")
  const value = useStore(root.store, (s) => s.menu)
  return (
    <ContextMenuContent finalFocus={finalFocus ?? menu.finalFocus} {...props}>
      {value === null
        ? null
        : typeof children === "function"
          ? children(value)
          : (children ?? (
              <>
                <DocumentTabsMenuRename />
                {root.renamable && root.closable ? (
                  <ContextMenuSeparator />
                ) : null}
                <DocumentTabsMenuClose />
                <DocumentTabsMenuCloseOthers />
              </>
            ))}
    </ContextMenuContent>
  )
}

/** Icon, shortcut hint and announced keys of each prebuilt item. */
const MENU_ACTIONS = {
  rename: [<PencilIcon key="i" />, "F2", "F2"],
  close: [<XIcon key="i" />, "Del", "Delete"],
  closeOthers: [<ListXIcon key="i" />, "⇧Del", "Shift+Delete"],
} as const

/** A prebuilt item: shown when its action is on, disabled when it does not apply. */
function menuAction(kind: keyof typeof MENU_ACTIONS) {
  return function DocumentTabsMenuAction({
    children,
    disabled,
    onClick,
    ...props
  }: React.ComponentProps<typeof ContextMenuItem>) {
    const root = useRoot()
    const list = useList()
    const menu = useRequired(MenuContext, "DocumentTabsMenu")
    const value = useStore(root.store, (s) => s.menu)
    if (!(kind === "rename" ? root.renamable : root.closable) || !value)
      return null
    const entry = list.entries.get(value)
    const applies =
      kind === "rename"
        ? entry?.disabled === false
        : kind === "close"
          ? !!entry?.closable
          : [...list.entries].some(([v, e]) => v !== value && e.closable)
    const [icon, hint, keys] = MENU_ACTIONS[kind]
    return (
      <ContextMenuItem
        aria-keyshortcuts={children === undefined ? keys : undefined}
        disabled={disabled || !applies}
        onClick={(event) => {
          onClick?.(event)
          menu.act()
          if (kind === "rename") root.setEditing(value)
          else if (kind === "close")
            list.close([value], { event: event.nativeEvent, focus: true })
          else list.closeOthers(value, event.nativeEvent)
        }}
        {...props}
      >
        {children ?? [
          icon,
          root.messages[kind],
          <ContextMenuShortcut key="k" aria-hidden>
            {hint}
          </ContextMenuShortcut>,
        ]}
      </ContextMenuItem>
    )
  }
}

/** Renames the tab the menu opened on. Renders nothing without `onRename`. */
const DocumentTabsMenuRename = menuAction("rename")
/** Closes the tab the menu opened on. Renders nothing without `onClose`. */
const DocumentTabsMenuClose = menuAction("close")
/** Closes every other closable tab. Renders nothing without `onClose`. */
const DocumentTabsMenuCloseOthers = menuAction("closeOthers")

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
