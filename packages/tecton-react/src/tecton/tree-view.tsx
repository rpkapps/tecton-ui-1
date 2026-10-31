"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  DropIndicator as DropIndicatorPrimitive,
  ListLayout,
  TreeItemContent as TreeItemContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
  useDragAndDrop,
  Virtualizer,
  type DragAndDropOptions,
  type DropTarget,
  type Key,
  type Selection,
  type TreeRenderProps,
} from "react-aria-components"
import {
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  FolderIcon,
  FolderOpenIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
} from "lucide-react"
import type { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"

import {
  ContextMenu,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

import { AriaBridge } from "./internal/aria-bridge"

// ---------------------------------------------------------------------------
// DOM state attributes
// ---------------------------------------------------------------------------

/**
 * Attributes the underlying primitives write that are not part of the Tecton
 * contract: hover, press and focus are styled with `:hover`, `:active` and
 * `:focus-visible`, and the rest is internal.
 */
const DROPPED_ATTRIBUTES = new Set([
  "data-rac",
  "data-hovered",
  "data-pressed",
  "data-focused",
  "data-focus-visible",
  "data-pending",
  "data-current",
  "data-allows-dragging",
  "data-selection-mode",
  "data-has-child-items",
])

/** Boolean states, written as presence attributes (`data-selected=""`). */
const PRESENCE_ATTRIBUTES = new Set([
  "data-selected",
  "data-expanded",
  "data-disabled",
  "data-empty",
  "data-dragging",
  "data-drop-target",
])

function stateAttributes<TProps extends object>(props: TProps): TProps {
  const result: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if (DROPPED_ATTRIBUTES.has(name)) continue
    if (!PRESENCE_ATTRIBUTES.has(name)) result[name] = value
    else if (value !== undefined && value !== false && value !== "false") {
      result[name] = ""
    }
  }
  return result as TProps
}

type DivProps = React.ComponentProps<"div">

function renderDiv(props: DivProps) {
  return <div {...stateAttributes(props)} />
}

function renderButton(props: React.ComponentProps<"button">) {
  return <button {...stateAttributes(props)} />
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/** Renders `items` with `render`, keyed by each row's `value`. */
function renderItems<T>(
  items: Iterable<T>,
  render: (item: T) => React.ReactNode
): React.ReactNode {
  return Array.from(items, (item, index) => {
    const element = render(item)
    let key: React.Key = index
    if (React.isValidElement<{ value?: unknown }>(element)) {
      if (element.key != null) key = element.key
      else if (typeof element.props.value === "string") {
        key = element.props.value
      }
    } else if (item && typeof item === "object") {
      const record = item as { value?: unknown; id?: unknown }
      const candidate = record.value ?? record.id
      if (typeof candidate === "string" || typeof candidate === "number") {
        key = candidate
      }
    }
    return <React.Fragment key={key}>{element}</React.Fragment>
  })
}

/**
 * The attributes every TreeView part forwards to its element (`data-*`
 * attributes are forwarded too). Event handlers are not: the tree owns
 * pointer and keyboard interaction.
 */
type TreeViewElementProps = {
  id?: string
  className?: string
  style?: React.CSSProperties
}

type TreeViewProps<T extends object = object> = TreeViewElementProps & {
  ref?: React.Ref<HTMLDivElement>
  /** The tree's accessible name. */
  "aria-label"?: string
  /** The id of the element naming the tree. */
  "aria-labelledby"?: string
  "aria-describedby"?: string
  /** Whether rows can be selected, one or several at a time. */
  selectionMode?: "none" | "single" | "multiple"
  /** The selected rows' values (controlled). */
  value?: string[]
  /** The rows selected initially (uncontrolled). */
  defaultValue?: string[]
  /** Called with every selected row's value when the selection changes. */
  onValueChange?: (value: string[]) => void
  /** Keeps at least one row selected: the last one cannot be deselected. */
  disallowEmptySelection?: boolean
  /**
   * Called with a row's value when the row is activated (opened): Enter on
   * the focused row, or a click. When rows are also selectable, a click
   * selects and a double click activates; Ctrl/Cmd- or Shift-click then
   * extends a multiple selection.
   */
  onActivate?: (value: string) => void
  /** Shown in place of the rows when the tree has none. */
  empty?: React.ReactNode
  /** The expanded rows' values (controlled). */
  expanded?: string[]
  /** The rows expanded initially (uncontrolled). */
  defaultExpanded?: string[]
  /** Called with every expanded row's value when a row expands or collapses. */
  onExpandedChange?: (expanded: string[]) => void
  /** Data for the top-level rows; `children` is then a render function. */
  items?: Iterable<T>
  /** `TreeViewItem`s, or a function rendering one per entry of `items`. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  /**
   * Renders only the rows in view, for trees of hundreds or thousands of
   * rows. Rows are then a fixed 32 px tall, and the tree needs a bounded
   * height (`h-80`, or `min-h-0 flex-1` in a flex column) to scroll in.
   */
  virtualized?: boolean
  /**
   * The context menu of a row: called with the row's `value` when the row
   * is right-clicked, long-pressed, or focused and Shift+F10 / the Menu key
   * is pressed. Return a `ContextMenuContent`, or `null` for no menu. The
   * selection is not changed.
   */
  contextMenu?: (value: string) => React.ReactNode
  /**
   * Makes rows draggable: called when rows are dropped before or after a
   * row, or inside a folder. Apply it to `items` (`moveTreeItems` does it for
   * `{ value | id, children }` data). Rows drag with the pointer, a long
   * press, or from their grip with Enter, the arrow keys and Enter again.
   */
  onMove?: (move: TreeViewMove) => void
  /**
   * Whether a drop is allowed. Rows already only drop inside folders
   * (`kind="folder"`, or a row with children), never into themselves.
   */
  canDrop?: (move: TreeViewMove) => boolean
}

/** A drop of `values` (in tree order) before, after or inside `target`. */
type TreeViewMove = {
  values: string[]
  target: string
  position: "before" | "after" | "inside"
}

type TreeState = TreeRenderProps["state"]
type TreeCollection = TreeState["collection"]

/** Which row's context menu is showing; read per row, not through a context
 * value, so opening a menu re-renders two rows rather than all of them. */
type MenuState = { value: string | null; open: boolean }

function createMenuStore() {
  let state: MenuState = { value: null, open: false }
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: Partial<MenuState>) {
      state = { ...state, ...next }
      for (const listener of listeners) listener()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}

type MenuStore = ReturnType<typeof createMenuStore>

const TreeViewMenuContext = React.createContext<MenuStore | null>(null)

const noSubscription = () => () => {}

const VIRTUAL_LAYOUT_OPTIONS = {
  rowSize: 32,
  gap: 1,
  // The drop line's box, centred on the row boundary; room for its dot.
  dropIndicatorThickness: 10,
}

const TREE_SELECTOR = '[data-slot="tree-view"]'
const ROW_SELECTOR = '[data-slot="tree-view-item"]'

/** The enabled row an event happened in, if it belongs to `tree`. */
function rowOf(target: EventTarget | null, tree: Element | null) {
  if (!(target instanceof Element) || !tree) return null
  const row = target.closest<HTMLElement>(ROW_SELECTOR)
  if (!row || row.closest(TREE_SELECTOR) !== tree) return null
  return row.hasAttribute("data-disabled") ? null : row
}

/** Opens the context menu from the keyboard, under the row's label. */
function openMenuAt(row: HTMLElement) {
  const label = row.querySelector('[data-slot="tree-view-label"]') ?? row
  const rowRect = row.getBoundingClientRect()
  const labelRect = label.getBoundingClientRect()
  const rtl = getComputedStyle(row).direction === "rtl"
  row.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: rtl ? labelRect.right : labelRect.left,
      clientY: rowRect.bottom,
    })
  )
}

function TreeViewMenuContent({
  contextMenu,
}: {
  contextMenu: (value: string) => React.ReactNode
}) {
  const store = React.useContext(TreeViewMenuContext)!
  const value = React.useSyncExternalStore(
    store.subscribe,
    () => store.get().value,
    () => null
  )
  return value === null ? null : contextMenu(value)
}

/**
 * The values of the rows `keep` accepts, in tree order (depth first),
 * collapsed rows included.
 */
function rowValues(collection: TreeCollection, keep: (key: Key) => boolean) {
  const values: string[] = []
  const seen = new Set<Key>()
  const walk = (key: Key) => {
    if (collection.getItem(key)?.type !== "item" || seen.has(key)) return
    seen.add(key)
    if (keep(key)) values.push(String(key))
    for (const child of collection.getChildren?.(key) ?? []) walk(child.key)
  }
  for (const node of collection) walk(node.key)
  return values
}

/** Every row that `"all"` (select all) stands for, collapsed ones included. */
function selectableValues(state: TreeState | null) {
  if (!state) return []
  return rowValues(
    state.collection,
    (k) => !state.selectionManager.isDisabled(k)
  )
}

/** Whether `key` is one of `rows` or inside one of them. */
function isWithin(collection: TreeCollection, key: Key, rows: Set<Key>) {
  for (
    let node = collection.getItem(key);
    node;
    node = node.parentKey == null ? null : collection.getItem(node.parentKey)
  ) {
    if (rows.has(node.key)) return true
  }
  return false
}

/** A row with `kind="folder"` content, or with child rows. */
function isFolder(collection: TreeCollection, key: Key) {
  const props = collection.getItem(key)?.props as
    { "data-kind"?: string } | undefined
  if (props?.["data-kind"] === "folder") return true
  const children = [...(collection.getChildren?.(key) ?? [])]
  return children.some((child) => child.type === "item")
}

// Geometry of a draggable row, in rem: the grip column at the start, then
// the level indent, the chevron and the icon (`TreeViewItemContent`).
const ROW_PADDING = 0.25
const CONTROL = 1.25
const GAP = 0.375
const INDENT = 1.25

/** The inline offset of a draggable row's chevron at `level` (from 1). */
function chevronOffset(level: number) {
  return ROW_PADDING + CONTROL + GAP + (level - 1) * INDENT
}

function TreeViewDropIndicator({
  target,
  collection,
  virtualized,
}: {
  target: DropTarget
  collection: TreeCollection | undefined
  virtualized: boolean
}) {
  const node =
    target.type === "item" ? collection?.getItem(target.key) : undefined
  // Collection levels count from 0, row levels from 1.
  const level = (node?.level ?? 0) + 1
  return (
    <DropIndicatorPrimitive
      target={target}
      data-slot="tree-view-drop-indicator"
      className={({ isDropTarget }) =>
        cn(
          "relative outline-none",
          // Virtualized, the tree gives the line a box centred on the row
          // boundary. Otherwise it sits, with no height, between two rows.
          virtualized ? "h-full" : "h-0",
          !isDropTarget && "invisible"
        )
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute end-1 top-1/2 z-10 h-0.5 -translate-y-1/2 rounded-full bg-primary before:absolute before:-start-1 before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-primary before:bg-background"
        style={{
          insetInlineStart: `${chevronOffset(level) + CONTROL + GAP}rem`,
        }}
      />
    </DropIndicatorPrimitive>
  )
}

/**
 * Applies a `TreeViewMove` to nested data, without changing it: returns new
 * arrays along the changed paths and keeps every other subtree as it was (so
 * memoized rows stay memoized). Rows dropped `inside` a row become its last
 * children. A drop into one of the moved rows changes nothing.
 */
function moveTreeItems<T extends object>(
  items: T[],
  move: TreeViewMove,
  getValue: (item: T) => string = defaultItemValue
): T[] {
  const childrenOf = (item: T) => (item as { children?: T[] }).children
  const withChildren = (item: T, children: T[]) => ({ ...item, children }) as T
  const moving = new Set(move.values)
  const isMovingAncestor = (list: T[], ancestors: boolean): boolean | null => {
    for (const item of list) {
      const inside = ancestors || moving.has(getValue(item))
      if (getValue(item) === move.target) return inside
      const children = childrenOf(item)
      const found = children && isMovingAncestor(children, inside)
      if (found != null) return found
    }
    return null
  }
  if (isMovingAncestor(items, false) !== false) return items

  // A list rebuilt with nothing changed is the same list.
  const keep = (next: T[], list: T[]) =>
    next.length === list.length && next.every((item, i) => item === list[i])
      ? list
      : next
  const taken: T[] = []
  const take = (list: T[]): T[] => {
    const next = list.flatMap((item) => {
      if (moving.has(getValue(item))) {
        taken.push(item)
        return []
      }
      const children = childrenOf(item)
      const kept = children && take(children)
      return [kept && kept !== children ? withChildren(item, kept) : item]
    })
    return keep(next, list)
  }
  const put = (list: T[]): T[] => {
    const index = list.findIndex((item) => getValue(item) === move.target)
    if (index >= 0) {
      const next = [...list]
      if (move.position === "inside") {
        const target = list[index]
        next[index] = withChildren(target, [
          ...(childrenOf(target) ?? []),
          ...taken,
        ])
      } else {
        next.splice(move.position === "before" ? index : index + 1, 0, ...taken)
      }
      return next
    }
    const next = list.map((item) => {
      const children = childrenOf(item)
      const placed = children && put(children)
      return placed && placed !== children ? withChildren(item, placed) : item
    })
    return keep(next, list)
  }
  return put(take(items))
}

function defaultItemValue(item: object): string {
  const record = item as { value?: unknown; id?: unknown }
  return String(record.value ?? record.id)
}

/**
 * Tecton TreeView — hierarchical inventory / project / file structures as
 * an ARIA treegrid. Rows support folder or item kind, depth indentation,
 * selection, disabled and hidden states, a colour tag, a suffix (e.g. a
 * `Badge`) and an end adornment (visibility toggle, menu button). Arrow
 * keys follow the `TectonProvider` direction.
 */
function TreeView<T extends object = object>({
  className,
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  disallowEmptySelection,
  onActivate,
  empty,
  expanded,
  defaultExpanded,
  onExpandedChange,
  items,
  children,
  virtualized,
  contextMenu,
  onMove,
  canDrop,
  ...props
}: TreeViewProps<T>) {
  const stateRef = React.useRef<TreeState | null>(null)
  const treeRef = React.useRef<HTMLDivElement | null>(null)
  const [menuStore] = React.useState(createMenuStore)
  const menuActionsRef = React.useRef<ContextMenuPrimitive.Root.Actions>(null)
  const { dragAndDropHooks } = useTreeDragAndDrop({
    stateRef,
    treeRef,
    virtualized: !!virtualized,
    onMove,
    canDrop,
    // A long press opens the menu and starts a drag: the drag wins.
    onDragStart: () => menuActionsRef.current?.close(),
  })
  // Rendered rows are kept while `items` and the render function stay the
  // same, so a selection or focus change does not re-render every row.
  const rows = React.useMemo(
    () =>
      typeof children === "function"
        ? renderItems(items ?? [], children)
        : children,
    [items, children]
  )

  // The selection the tree last reported. Passed back as the same `value`, it
  // is handed on as it was: it carries the anchor Shift+click extends from,
  // which an array of values cannot.
  const reported = React.useRef<Set<Key> | null>(null)
  const selectedKeys = React.useMemo(() => {
    const last = reported.current
    const same =
      value?.length === last?.size && value?.every((key) => last?.has(key))
    return same && last ? last : value
  }, [value])

  const renderTree = ({ ref, onKeyDown, ...domProps }: DivProps) => {
    const element = renderDiv({
      ...domProps,
      ref: (element: HTMLDivElement | null) => {
        treeRef.current = element
        if (typeof ref === "function") ref(element)
        else if (ref) ref.current = element
      },
      onKeyDown: (event) => {
        // Shift+F10 and the Menu key open the focused row's context menu.
        const row =
          contextMenu &&
          (event.key === "ContextMenu" ||
            (event.key === "F10" && event.shiftKey)) &&
          rowOf(event.target, treeRef.current)
        if (!row) return onKeyDown?.(event)
        event.preventDefault()
        openMenuAt(row)
      },
    })
    return contextMenu ? <ContextMenuTrigger render={element} /> : element
  }

  const tree = (
    <TreePrimitive
      data-slot="tree-view"
      className={cn(
        "w-full overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        // Rows are spaced by their own margin, not a `gap`: a gap around the
        // zero-height elements a drag puts between rows would move them.
        virtualized ? "relative block" : "flex flex-col",
        className,
        // Virtualized rows are positioned across the full, rounded
        // `clientWidth`: no padding, and no sideways scroll for a pixel over.
        virtualized && "overflow-x-hidden p-0"
      )}
      {...props}
      render={(domProps, renderProps) => {
        // Kept for `onSelectionChange("all")`, which lists no keys.
        stateRef.current = renderProps.state
        return renderTree(domProps)
      }}
      selectionMode={selectionMode}
      disallowEmptySelection={disallowEmptySelection}
      onAction={onActivate && ((key: Key) => onActivate(String(key)))}
      // With both, a click selects and a double click activates (the file
      // browser convention); otherwise a click on a row would only ever
      // activate it, since rows have no checkbox to select with.
      selectionBehavior={onActivate ? "replace" : "toggle"}
      renderEmptyState={empty === undefined ? undefined : () => empty}
      selectedKeys={selectedKeys}
      defaultSelectedKeys={defaultValue}
      onSelectionChange={
        onValueChange &&
        ((selection: Selection) => {
          reported.current = selection === "all" ? null : selection
          onValueChange(
            selection === "all"
              ? selectableValues(stateRef.current)
              : Array.from(selection, String)
          )
        })
      }
      expandedKeys={expanded}
      defaultExpandedKeys={defaultExpanded}
      onExpandedChange={
        onExpandedChange &&
        ((keys: Set<Key>) => onExpandedChange(Array.from(keys, String)))
      }
      dragAndDropHooks={onMove ? dragAndDropHooks : undefined}
    >
      {rows}
    </TreePrimitive>
  )

  const virtualizedTree = virtualized ? (
    <Virtualizer layout={ListLayout} layoutOptions={VIRTUAL_LAYOUT_OPTIONS}>
      {tree}
    </Virtualizer>
  ) : (
    tree
  )

  if (!contextMenu) return <AriaBridge>{virtualizedTree}</AriaBridge>

  return (
    <AriaBridge>
      <TreeViewMenuContext value={menuStore}>
        <ContextMenu
          actionsRef={menuActionsRef}
          onOpenChange={(open, details) => {
            if (!open) {
              menuStore.set({ open: false })
              return
            }
            const row = rowOf(details.event.target, treeRef.current)
            const rowValue = row?.dataset.value
            if (rowValue === undefined || contextMenu(rowValue) == null) {
              details.cancel()
              return
            }
            // Focus follows the menu's row; the selection stays as it is.
            stateRef.current?.selectionManager.setFocusedKey(rowValue)
            menuStore.set({ value: rowValue, open: true })
          }}
          onOpenChangeComplete={(open) => {
            if (!open) menuStore.set({ value: null })
          }}
        >
          {virtualizedTree}
          <TreeViewMenuContent contextMenu={contextMenu} />
        </ContextMenu>
      </TreeViewMenuContext>
    </AriaBridge>
  )
}

/** The next or previous visible row, skipping non-row collection nodes. */
function visibleNeighbour(
  collection: TreeCollection,
  key: Key,
  direction: "before" | "after"
): Key | null {
  const step = (from: Key) =>
    direction === "after"
      ? collection.getKeyAfter(from)
      : collection.getKeyBefore(from)
  let next = step(key)
  while (next != null && collection.getItem(next)?.type !== "item") {
    next = step(next)
  }
  return next
}

function levelOf(collection: TreeCollection, key: Key) {
  return (collection.getItem(key)?.level ?? 0) + 1
}

/** `key`'s ancestor at `level` (from 1), or `key` itself at its own level. */
function ancestorAt(collection: TreeCollection, key: Key, level: number) {
  let node = collection.getItem(key)
  while (node && node.level + 1 > level && node.parentKey != null) {
    node = collection.getItem(node.parentKey)
  }
  return node?.key ?? key
}

/**
 * Keeps a pointer drag aimed while the rows scroll under a resting pointer
 * (autoscroll at an edge, the wheel): React Aria only re-aims when the pointer
 * moves, so after a scroll the last drag event is sent again as a `dragover`
 * from where the pointer rests, a pixel off so it does not read as a repeat.
 * Returns the cleanup.
 */
function followScroll(getTree: () => HTMLElement | null) {
  let last: DragEvent | null = null
  let frame = 0
  let nudge = 1
  const onPointer = (event: DragEvent) => {
    if (event.isTrusted) last = event
  }
  const onScroll = () => {
    if (!last || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!last?.dataTransfer) return
      const { clientX, clientY, dataTransfer } = last
      const under = document.elementFromPoint(clientX, clientY)
      if (!under || !getTree()?.contains(under)) return
      nudge = -nudge
      under.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY: clientY + nudge,
          dataTransfer,
        })
      )
    })
  }
  const events = ["dragenter", "dragover"] as const
  for (const type of events) document.addEventListener(type, onPointer, true)
  document.addEventListener("scroll", onScroll, true)
  return () => {
    cancelAnimationFrame(frame)
    for (const type of events) {
      document.removeEventListener(type, onPointer, true)
    }
    document.removeEventListener("scroll", onScroll, true)
  }
}

/** The row of `tree` under (x, y), or the nearest one by y. */
function rowAtPoint(tree: HTMLElement, x: number, y: number) {
  const ours = (row: Element) => row.closest(TREE_SELECTOR) === tree
  const hit = document
    .elementsFromPoint(x, y)
    .find((element) => element.matches(ROW_SELECTOR))
  if (hit instanceof HTMLElement && ours(hit)) return hit
  // Over a gap, or rows ignoring the pointer while they scroll.
  let nearest: HTMLElement | null = null
  let distance = Infinity
  for (const row of tree.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
    const rect = row.getBoundingClientRect()
    const d = Math.max(rect.top - y, 0, y - rect.bottom)
    if (ours(row) && d < distance) [nearest, distance] = [row, d]
  }
  return nearest
}

/**
 * Drag and drop for the tree: one set of hooks for the tree's lifetime, with
 * callbacks that read the latest props, so a re-render does not rebuild them.
 *
 * Pointer drops go where the pointer is: over a gap between rows, its inline
 * position picks the depth (the column of the level's chevron), so a row
 * reaches any ancestor level by moving towards the tree's start. (Our drop
 * target delegate replaces React Aria's, which picks the depth from the
 * direction the pointer last moved.)
 */
function useTreeDragAndDrop({
  stateRef,
  treeRef,
  virtualized,
  onMove,
  canDrop,
  onDragStart,
}: {
  stateRef: React.RefObject<TreeState | null>
  treeRef: React.RefObject<HTMLElement | null>
  virtualized: boolean
  onMove: TreeViewProps["onMove"]
  canDrop: TreeViewProps["canDrop"]
  onDragStart: () => void
}) {
  const latest = React.useRef({ onMove, canDrop, onDragStart, virtualized })
  React.useLayoutEffect(() => {
    latest.current = { onMove, canDrop, onDragStart, virtualized }
  })
  // The dragged rows, in tree order, while a drag is on.
  const dragged = React.useRef<{ keys: Set<Key>; values: string[] } | null>(
    null
  )
  const stopFollowing = React.useRef<(() => void) | null>(null)
  React.useEffect(() => () => stopFollowing.current?.(), [])
  /** The move a drop on `target` makes, or null where rows cannot go. */
  const moveFor = (target: DropTarget): TreeViewMove | null => {
    const collection = stateRef.current?.collection
    const drag = dragged.current
    if (target.type !== "item" || !collection || !drag) return null
    // Never into, or next to, a dragged row or anything inside one.
    if (isWithin(collection, target.key, drag.keys)) return null
    const position =
      target.dropPosition === "on" ? "inside" : target.dropPosition
    if (position === "inside" && !isFolder(collection, target.key)) return null
    return { values: drag.values, target: String(target.key), position }
  }

  const isAllowed = (target: DropTarget) => {
    const move = moveFor(target)
    const { canDrop } = latest.current
    return !!move && (!canDrop || canDrop(move))
  }

  /** The drop target at (x, y), measured from the tree's corner. */
  const targetAt = (x: number, y: number): DropTarget | null => {
    const tree = treeRef.current
    const collection = stateRef.current?.collection
    if (!tree || !collection) return null
    // React Aria measures from the tree's corner; rows are in the viewport's.
    const box = tree.getBoundingClientRect()
    x += box.left
    y += box.top
    const row = rowAtPoint(tree, x, y)
    const key = row?.dataset.value
    if (!row || key === undefined || !collection.getItem(key)) return null

    const rect = row.getBoundingClientRect()
    const along = (y - rect.top) / rect.height
    const on: DropTarget = { type: "item", key, dropPosition: "on" }
    // A folder takes drops inside over its middle half; the rest of a row is
    // the gap above or below it.
    const inside = isAllowed(on)
    if (inside && along >= 0.25 && along <= 0.75) return on
    const upper = along < (inside ? 0.25 : 0.5)
    const above = upper ? visibleNeighbour(collection, key, "before") : key
    const below = upper ? key : visibleNeighbour(collection, key, "after")

    // The gap between `above` and `below`, at each level it can take: just
    // before `below`, or after `above` or one of its ancestors when `above`
    // ends deeper than `below` starts.
    const candidates: { level: number; target: DropTarget }[] = []
    if (below != null) {
      const target: DropTarget = {
        type: "item",
        key: below,
        dropPosition: "before",
      }
      candidates.push({ level: levelOf(collection, below), target })
    }
    const lowest = below == null ? 1 : levelOf(collection, below) + 1
    if (above != null) {
      for (let level = levelOf(collection, above); level >= lowest; level--) {
        const key = ancestorAt(collection, above, level)
        const target: DropTarget = { type: "item", key, dropPosition: "after" }
        candidates.push({ level, target })
      }
    }

    // The level whose chevron column the pointer is in, from the row's start.
    const rem =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const rtl = getComputedStyle(tree).direction === "rtl"
    const inline = (rtl ? rect.right - x : x - rect.left) / rem
    const wanted = 1 + Math.floor((inline - chevronOffset(1)) / INDENT + 0.5)
    const byDistance = [...candidates].sort(
      (a, b) => Math.abs(a.level - wanted) - Math.abs(b.level - wanted)
    )
    return byDistance.find((c) => isAllowed(c.target))?.target ?? null
  }

  const [options] = React.useState<DragAndDropOptions>(() => ({
    getItems: (keys) => {
      const collection = stateRef.current?.collection
      return Array.from(keys, (key) => ({
        "text/plain": collection?.getItem(key)?.textValue || String(key),
      }))
    },
    onDragStart: ({ keys }) => {
      const collection = stateRef.current?.collection
      const values = collection
        ? rowValues(collection, (key) => keys.has(key))
        : Array.from(keys, String)
      dragged.current = { keys, values }
      stopFollowing.current = followScroll(() => treeRef.current)
      latest.current.onDragStart()
    },
    onDragEnd: () => {
      dragged.current = null
      stopFollowing.current?.()
      stopFollowing.current = null
    },
    dropTargetDelegate: { getDropTargetFromPoint: targetAt },
    getDropOperation: (target) => (isAllowed(target) ? "move" : "cancel"),
    onMove: (event) => {
      const move = moveFor(event.target)
      if (move) latest.current.onMove?.(move)
    },
    renderDropIndicator: (target) => (
      <TreeViewDropIndicator
        target={target}
        collection={stateRef.current?.collection}
        virtualized={latest.current.virtualized}
      />
    ),
  }))

  return useDragAndDrop(options)
}

type TreeViewCollectionProps<T> = {
  /** Data for the child rows. */
  items: Iterable<T>
  /** Renders one `TreeViewItem` per entry. */
  children: (item: T) => React.ReactNode
}

/**
 * The child rows of a `TreeViewItem` rendered from data. Rows re-render when
 * `items` or the render function change: a render function created during
 * render (closing over a hidden set, a selection map) keeps them current,
 * and a stable one (module-level or `useCallback`) skips the rows the parent
 * did not change, which large trees need.
 */
function TreeViewCollection<T>({
  items,
  children,
}: TreeViewCollectionProps<T>) {
  return React.useMemo(
    () => <>{renderItems(items, children)}</>,
    [items, children]
  )
}

type TreeViewItemProps = Omit<TreeViewElementProps, "id"> & {
  ref?: React.Ref<HTMLDivElement>
  /** The row's identity, unique in the tree (selection and expansion). */
  value: string
  /**
   * The row's plain-text name, for type-ahead and announcements. Defaults to
   * the `TreeViewItemContent` children when they are plain text.
   */
  label?: string
  /** Disables the row: not selectable, not expandable, skipped by arrows. */
  disabled?: boolean
  /** Dimmed "hidden" state (the layer is hidden in the view; the row stays). */
  hidden?: boolean
  /** `TreeViewItemContent` first, then child `TreeViewItem`s. */
  children?: React.ReactNode
}

/** The props of the row's `TreeViewItemContent`: its text and its `kind`. */
function contentOf(children: React.ReactNode) {
  return React.Children.toArray(children).find(
    (child): child is React.ReactElement<TreeViewItemContentProps> =>
      React.isValidElement(child) && child.type === TreeViewItemContent
  )?.props
}

function TreeViewItem({
  className,
  value,
  label,
  disabled,
  hidden,
  children,
  ...props
}: TreeViewItemProps) {
  const menuStore = React.useContext(TreeViewMenuContext)
  const menuOpen = React.useSyncExternalStore(
    menuStore?.subscribe ?? noSubscription,
    () => {
      const state = menuStore?.get()
      return !!state?.open && state.value === value
    },
    () => false
  )
  const content = contentOf(children)
  const text = content?.children
  return (
    <TreeItemPrimitive
      data-slot="tree-view-item"
      data-value={value}
      // Read by the drop rules, which see rows that are not rendered.
      data-kind={content && (content.kind ?? "item")}
      data-hidden={hidden ? "" : undefined}
      data-context-menu-open={menuOpen ? "" : undefined}
      {...(props as unknown as React.ComponentProps<typeof TreeItemPrimitive>)}
      id={value}
      textValue={
        label ??
        (typeof text === "string" || typeof text === "number"
          ? String(text)
          : "")
      }
      isDisabled={disabled}
      render={renderDiv}
      className={({ selectionMode }) =>
        cn(
          "group/tree-item relative mb-px flex cursor-default items-center rounded-md outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset",
          // A dragged row keeps its look: no hover or press state stuck on it.
          selectionMode !== "none" &&
            "not-data-[dragging]:hover:bg-accent/60 not-data-[dragging]:active:bg-accent",
          "data-[selected]:bg-accent data-[selected]:text-accent-foreground",
          "data-[context-menu-open]:ring-2 data-[context-menu-open]:ring-ring/40 data-[context-menu-open]:ring-inset",
          "data-[drop-target]:bg-accent data-[drop-target]:ring-2 data-[drop-target]:ring-primary data-[drop-target]:ring-inset",
          "data-hidden:text-muted-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
          className
        )
      }
    >
      {children}
    </TreeItemPrimitive>
  )
}

/**
 * The id of the row's label, for controls in `endAdornment` that name
 * themselves after the row ("Hide Faults").
 */
const TreeViewItemLabelContext = React.createContext<string | undefined>(
  undefined
)

type TreeViewItemContentProps = {
  className?: string
  children?: React.ReactNode
  /** Folder rows get a folder icon; item rows a small dot. */
  kind?: "folder" | "item"
  /** Custom leading icon (replaces the kind icon). */
  icon?: React.ReactNode
  /** Colour tag rendered after the icon (`ColorSwatch`, a coloured square…). */
  colorTag?: React.ReactNode
  /** Content after the label (e.g. a `Badge`). */
  suffix?: React.ReactNode
  /** Trailing content (visibility toggle, action menu…). */
  endAdornment?: React.ReactNode
}

function TreeViewItemContent({
  className,
  children,
  kind = "item",
  icon,
  colorTag,
  suffix,
  endAdornment,
}: TreeViewItemContentProps) {
  const labelId = React.useId()
  return (
    <TreeItemContentPrimitive>
      {({ hasChildItems, isExpanded, level, allowsDragging }) => (
        <div
          data-slot="tree-view-item-content"
          data-kind={kind}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 pe-1",
            className
          )}
          // Draggable rows keep their grips in one column at the start and
          // indent after it, from the chevron on.
          style={{
            paddingInlineStart: `${allowsDragging ? ROW_PADDING : ROW_PADDING + (level - 1) * INDENT}rem`,
          }}
        >
          {allowsDragging && (
            <ButtonPrimitive
              slot="drag"
              data-slot="tree-view-drag-handle"
              render={renderButton}
              className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&_svg]:size-4"
            >
              <GripVerticalIcon />
            </ButtonPrimitive>
          )}
          <ButtonPrimitive
            slot="chevron"
            data-slot="tree-view-chevron"
            aria-hidden={!hasChildItems}
            style={
              allowsDragging
                ? { marginInlineStart: `${(level - 1) * INDENT}rem` }
                : undefined
            }
            render={renderButton}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
              !hasChildItems && "invisible"
            )}
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform rtl:-scale-x-100",
                isExpanded && "rotate-90 rtl:-rotate-90"
              )}
            />
          </ButtonPrimitive>
          <span
            data-slot="tree-view-icon"
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
          >
            {icon ??
              (kind === "folder" ? (
                isExpanded ? (
                  <FolderOpenIcon />
                ) : (
                  <FolderIcon />
                )
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              ))}
          </span>
          {colorTag && (
            <span
              data-slot="tree-view-color-tag"
              className="flex shrink-0 items-center [&>*]:size-3 [&>*]:rounded-xs"
            >
              {colorTag}
            </span>
          )}
          <span
            id={labelId}
            data-slot="tree-view-label"
            className="min-w-0 flex-1 truncate"
          >
            {children}
          </span>
          {suffix && (
            <span
              data-slot="tree-view-suffix"
              className="flex shrink-0 items-center"
            >
              {suffix}
            </span>
          )}
          {endAdornment && (
            <span
              data-slot="tree-view-end"
              className="flex shrink-0 items-center gap-0.5 text-muted-foreground"
            >
              <TreeViewItemLabelContext value={labelId}>
                {endAdornment}
              </TreeViewItemLabelContext>
            </span>
          )}
        </div>
      )}
    </TreeItemContentPrimitive>
  )
}

type TreeViewActionProps = TreeViewElementProps & {
  ref?: React.Ref<HTMLButtonElement>
  /** The button's accessible name, e.g. "Actions for Faults". */
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-pressed"?: boolean
  "aria-expanded"?: boolean
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog"
  "aria-controls"?: string
  /** The icon; a vertical ellipsis by default. */
  children?: React.ReactNode
  /**
   * Called when the button is activated (pointer, Enter or Space). The row
   * itself is not selected or toggled by it.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Disables the button. */
  disabled?: boolean
}

function TreeViewAction({
  className,
  children,
  onClick,
  disabled,
  ...props
}: TreeViewActionProps) {
  return (
    <ButtonPrimitive
      data-slot="tree-view-action"
      {...props}
      isDisabled={disabled}
      // The click event (a synthetic one for Enter and Space), so a menu
      // trigger composed through `render` handles it like a native button.
      onClick={
        onClick as ((event: React.MouseEvent<Element>) => void) | undefined
      }
      render={renderButton}
      className={cn(
        "flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className
      )}
    >
      {children ?? <MoreVerticalIcon />}
    </ButtonPrimitive>
  )
}

type TreeViewVisibilityToggleProps = Omit<
  TreeViewActionProps,
  "onClick" | "children"
> & {
  /** Whether the row's layer is shown; the toggle is pressed when `false`. */
  visible?: boolean
  /** Called with the next visibility. */
  onVisibleChange?: (visible: boolean) => void
  /** What the toggle hides, for its accessible name ("Hide {name}"). */
  name?: string
}

/**
 * Show / hide a row. The name stays the same and `aria-pressed` carries the
 * state ("Hide Faults, toggle button, pressed" while hidden), as a toggle
 * button should; inside `TreeViewItemContent` the name includes the row's
 * label, so a list of toggles does not read as a list of bare "Hide"s. Pass
 * `name` when the row label is not plain text.
 */
function TreeViewVisibilityToggle({
  visible = true,
  onVisibleChange,
  name,
  ...props
}: TreeViewVisibilityToggleProps) {
  const generatedId = React.useId()
  const id = props.id ?? generatedId
  const labelId = React.useContext(TreeViewItemLabelContext)
  const named =
    name !== undefined ||
    props["aria-label"] !== undefined ||
    props["aria-labelledby"] !== undefined
  return (
    <TreeViewAction
      id={id}
      aria-label={name ? `Hide ${name}` : "Hide"}
      // "Hide" followed by the row's own label.
      aria-labelledby={!named && labelId ? `${id} ${labelId}` : undefined}
      aria-pressed={!visible}
      {...props}
      onClick={() => onVisibleChange?.(!visible)}
    >
      {visible ? <EyeIcon /> : <EyeOffIcon />}
    </TreeViewAction>
  )
}

export {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewCollection,
  TreeViewAction,
  TreeViewVisibilityToggle,
  moveTreeItems,
}
export type {
  TreeViewProps,
  TreeViewMove,
  TreeViewItemProps,
  TreeViewItemContentProps,
  TreeViewCollectionProps,
  TreeViewActionProps,
  TreeViewVisibilityToggleProps,
}
