"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  ListLayout,
  TreeItemContent as TreeItemContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
  Virtualizer,
  type DragAndDropHooks,
  type Key,
  type PressEvent,
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
import { usePortalTarget } from "@tecton/react/tecton/portal"

import { AriaBridge } from "./internal/aria-bridge"
import { startKeyboardDrag, trackPointerDrag } from "./internal/drag-session"
import { createStore, useStore, type Store } from "./internal/store"

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
   * `{ value | id, children }` data). Rows drag with the pointer, with a
   * finger from their grip or after a long press, or from their grip with
   * Enter, the arrow keys and Enter again.
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

/**
 * The row states the tree sets from outside the rows: which row's context
 * menu is showing, which rows are being dragged, which folder a drop would
 * go into. Each row reads its own slice, so a change re-renders the rows it
 * concerns rather than all of them.
 */
type TreeViewState = {
  menuValue: string | null
  menuOpen: boolean
  dragged: ReadonlySet<string> | null
  dropInside: string | null
}

const initialState: TreeViewState = {
  menuValue: null,
  menuOpen: false,
  dragged: null,
  dropInside: null,
}

const TreeViewStoreContext = React.createContext<Store<TreeViewState>>(
  createStore(initialState)
)

const VIRTUAL_LAYOUT_OPTIONS = { rowSize: 32, gap: 1 }

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
  const store = React.useContext(TreeViewStoreContext)
  const value = useStore(store, (state) => state.menuValue)
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

/**
 * The drop line: one element in the tree, placed over the gap a drop would
 * go into by the drag code, so it neither moves the rows nor is clipped by
 * them.
 */
function TreeViewDropLine({ ref }: { ref: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      hidden
      aria-hidden
      data-slot="tree-view-drop-indicator"
      className="pointer-events-none absolute z-10 h-0"
    >
      <span className="absolute end-1 top-0 h-0.5 -translate-y-1/2 rounded-full bg-primary before:absolute before:-start-1 before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-primary before:bg-background" />
    </div>
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
  const lineRef = React.useRef<HTMLDivElement | null>(null)
  const announcerRef = React.useRef<HTMLDivElement | null>(null)
  const [store] = React.useState(() => createStore(initialState))
  const menuActionsRef = React.useRef<ContextMenuPrimitive.Root.Actions>(null)
  const drag = useTreeDragAndDrop({
    stateRef,
    treeRef,
    lineRef,
    announcerRef,
    store,
    portal: usePortalTarget(),
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

  const renderTree = ({ ref, onKeyDown, children, ...domProps }: DivProps) => {
    const element = renderDiv({
      ...domProps,
      children: (
        <>
          {children}
          {onMove && <TreeViewDropLine ref={lineRef} />}
        </>
      ),
      onPointerDownCapture: onMove ? drag.onPointerDownCapture : undefined,
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
        "relative w-full overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        virtualized ? "block" : "flex flex-col",
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
      selectedKeys={value}
      defaultSelectedKeys={defaultValue}
      onSelectionChange={
        onValueChange &&
        ((selection: Selection) =>
          onValueChange(
            selection === "all"
              ? selectableValues(stateRef.current)
              : Array.from(selection, String)
          ))
      }
      expandedKeys={expanded}
      defaultExpandedKeys={defaultExpanded}
      onExpandedChange={
        onExpandedChange &&
        ((keys: Set<Key>) => onExpandedChange(Array.from(keys, String)))
      }
      dragAndDropHooks={onMove ? drag.dragAndDropHooks : undefined}
    >
      {rows}
    </TreePrimitive>
  )

  const virtualizedTree = (
    <>
      {virtualized ? (
        <Virtualizer layout={ListLayout} layoutOptions={VIRTUAL_LAYOUT_OPTIONS}>
          {tree}
        </Virtualizer>
      ) : (
        tree
      )}
      {onMove && (
        <div
          ref={announcerRef}
          aria-live="assertive"
          data-slot="tree-view-announcer"
          className="sr-only"
        />
      )}
    </>
  )

  if (!contextMenu) {
    return (
      <AriaBridge>
        <TreeViewStoreContext value={store}>
          {virtualizedTree}
        </TreeViewStoreContext>
      </AriaBridge>
    )
  }

  return (
    <AriaBridge>
      <TreeViewStoreContext value={store}>
        <ContextMenu
          actionsRef={menuActionsRef}
          onOpenChange={(open, details) => {
            if (!open) {
              store.set({ menuOpen: false })
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
            store.set({ menuValue: rowValue, menuOpen: true })
          }}
          onOpenChangeComplete={(open) => {
            if (!open) store.set({ menuValue: null })
          }}
        >
          {virtualizedTree}
          <TreeViewMenuContent contextMenu={contextMenu} />
        </ContextMenu>
      </TreeViewStoreContext>
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

/** `key`'s last visible descendant, or `key` itself when it is collapsed. */
function lastVisible(state: TreeState, key: Key) {
  for (;;) {
    if (!state.expandedKeys.has(key)) return key
    const children = [...(state.collection.getChildren?.(key) ?? [])].filter(
      (child) => child.type === "item"
    )
    if (!children.length) return key
    key = children[children.length - 1].key
  }
}

type Place = { key: Key; position: TreeViewMove["position"]; level: number }

/**
 * The places in the gap between the visible rows `above` and `below` (null
 * at either end), deepest first: after `above`, or after one of its
 * ancestors when `above` ends deeper than `below` starts, then just before
 * `below`.
 */
function gapPlaces(
  collection: TreeCollection,
  above: Key | null,
  below: Key | null
) {
  const places: Place[] = []
  const lowest = below == null ? 1 : levelOf(collection, below) + 1
  if (above != null) {
    for (let level = levelOf(collection, above); level >= lowest; level--) {
      const key = ancestorAt(collection, above, level)
      places.push({ key, position: "after", level })
    }
  }
  if (below != null) {
    const level = levelOf(collection, below)
    places.push({ key: below, position: "before", level })
  }
  return places
}

/** The row element of `key` in `tree`, if it is rendered. */
function rowElement(tree: HTMLElement, key: Key) {
  const value = String(key).replace(/["\\]/g, "\\$&")
  return tree.querySelector<HTMLElement>(
    `${ROW_SELECTOR}[data-value="${value}"]`
  )
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

const EXPAND_DELAY = 800

type DragSession = {
  keys: Set<Key>
  /** The dragged rows' values, in tree order. */
  values: string[]
  /** Where a drop would go now, and since when (to open folders). */
  move: TreeViewMove | null
  since: number
  /** Ends the pointer or keyboard session. */
  stop: () => void
}

/**
 * Drag and drop for the tree, on the internal drag sessions rather than
 * React Aria's drag and drop: the tree only learns that rows can be dragged
 * (so a press selects on release, not on press, and the grips get their
 * props), and this decides what is dragged and where it lands.
 *
 * - Pointer: a row (not its other controls), or the selection when the row
 *   is selected. The drop goes where the pointer is: over a gap between
 *   rows, its inline position picks the depth (the column of the level's
 *   chevron), so a row reaches any ancestor level by moving towards the
 *   tree's start. Folders open after 800 ms under the pointer.
 * - Keyboard: Enter or Space on the grip, then the arrow keys through every
 *   place a drop can go; the inline arrows open and close the aimed folder.
 */
function useTreeDragAndDrop({
  stateRef,
  treeRef,
  lineRef,
  announcerRef,
  store,
  portal,
  onMove,
  canDrop,
  onDragStart,
}: {
  stateRef: React.RefObject<TreeState | null>
  treeRef: React.RefObject<HTMLElement | null>
  lineRef: React.RefObject<HTMLElement | null>
  announcerRef: React.RefObject<HTMLElement | null>
  store: Store<TreeViewState>
  portal: HTMLElement | undefined
  onMove: TreeViewProps["onMove"]
  canDrop: TreeViewProps["canDrop"]
  onDragStart: () => void
}) {
  const latest = React.useRef({ onMove, canDrop, onDragStart, portal })
  React.useLayoutEffect(() => {
    latest.current = { onMove, canDrop, onDragStart, portal }
  })
  const session = React.useRef<DragSession | null>(null)
  React.useEffect(
    () => () => {
      session.current?.stop()
      session.current = null
    },
    []
  )

  const labelOf = (key: Key) =>
    stateRef.current?.collection.getItem(key)?.textValue || String(key)

  /** The move a drop at `key` makes, or null where rows cannot go. */
  const moveFor = (key: Key, position: TreeViewMove["position"]) => {
    const collection = stateRef.current?.collection
    const drag = session.current
    if (!collection?.getItem(key) || !drag) return null
    // Never into, or next to, a dragged row or anything inside one.
    if (isWithin(collection, key, drag.keys)) return null
    if (position === "inside" && !isFolder(collection, key)) return null
    const move: TreeViewMove = {
      values: drag.values,
      target: String(key),
      position,
    }
    const { canDrop } = latest.current
    return !canDrop || canDrop(move) ? move : null
  }

  /** The move a drop at (x, y) in the viewport makes. */
  const targetAt = (x: number, y: number): TreeViewMove | null => {
    const tree = treeRef.current
    const collection = stateRef.current?.collection
    const under = document.elementFromPoint(x, y)
    if (!tree || !collection || !under || !tree.contains(under)) return null
    const row = rowAtPoint(tree, x, y)
    const key = row?.dataset.value
    if (!row || key === undefined || !collection.getItem(key)) return null

    const rect = row.getBoundingClientRect()
    const along = (y - rect.top) / rect.height
    // A folder takes drops inside over its middle half; the rest of a row is
    // the gap above or below it.
    const inside = moveFor(key, "inside")
    if (inside && along >= 0.25 && along <= 0.75) return inside
    const upper = along < (inside ? 0.25 : 0.5)
    const above = upper ? visibleNeighbour(collection, key, "before") : key
    const below = upper ? key : visibleNeighbour(collection, key, "after")

    // The level whose chevron column the pointer is in, from the row's start.
    const rem =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const rtl = getComputedStyle(tree).direction === "rtl"
    const inline = (rtl ? rect.right - x : x - rect.left) / rem
    const wanted = 1 + Math.floor((inline - chevronOffset(1)) / INDENT + 0.5)
    const byDistance = gapPlaces(collection, above, below).sort(
      (a, b) => Math.abs(a.level - wanted) - Math.abs(b.level - wanted)
    )
    for (const place of byDistance) {
      const move = moveFor(place.key, place.position)
      if (move) return move
    }
    return null
  }

  /** Every place a drop can go, top to bottom, and the first one below `key`. */
  const keyboardMoves = (key: Key) => {
    const collection = stateRef.current?.collection
    const places: TreeViewMove[] = []
    let start = 0
    if (!collection) return { places, start }
    const add = (place: Pick<Place, "key" | "position">) => {
      const move = moveFor(place.key, place.position)
      if (move) places.push(move)
    }
    let above: Key | null = null
    for (
      let row = collection.getFirstKey();
      row != null;
      row = collection.getKeyAfter(row)
    ) {
      if (collection.getItem(row)?.type !== "item") continue
      gapPlaces(collection, above, row).forEach(add)
      add({ key: row, position: "inside" })
      if (row === key) start = places.length
      above = row
    }
    gapPlaces(collection, above, null).forEach(add)
    return { places, start }
  }

  /** Places the drop line over the gap of the current move. */
  const placeLine = () => {
    const line = lineRef.current
    const tree = treeRef.current
    const state = stateRef.current
    const move = session.current?.move
    if (!line || !tree || !state) return
    const edgeKey =
      move?.position === "before"
        ? move.target
        : move?.position === "after"
          ? lastVisible(state, move.target)
          : null
    const row = edgeKey == null ? null : rowElement(tree, edgeKey)
    line.hidden = !row
    if (!row || !move) return
    const box = tree.getBoundingClientRect()
    const rect = row.getBoundingClientRect()
    // The middle of the pixel between two rows, kept clear of the tree's
    // edges so the line's dot is not clipped.
    const edge = move.position === "before" ? rect.top - 0.5 : rect.bottom + 0.5
    const top = edge - box.top - tree.clientTop + tree.scrollTop
    line.style.top = `${Math.min(Math.max(top, 4), tree.scrollHeight - 4)}px`
    line.style.left = `${rect.left - box.left - tree.clientLeft + tree.scrollLeft}px`
    line.style.width = `${rect.width}px`
    const level = levelOf(state.collection, move.target)
    const span = line.firstElementChild as HTMLElement
    span.style.insetInlineStart = `${chevronOffset(level) + CONTROL + GAP}rem`
  }

  const show = (move: TreeViewMove | null) => {
    const drag = session.current
    if (!drag) return
    const previous = drag.move
    if (
      previous?.target !== move?.target ||
      previous?.position !== move?.position
    ) {
      drag.move = move
      drag.since = performance.now()
    }
    store.set({ dropInside: move?.position === "inside" ? move.target : null })
    placeLine()
  }

  /** Opens the collapsed folder a drop has aimed into for a while. */
  const openAimedFolder = () => {
    const state = stateRef.current
    const drag = session.current
    const move = drag?.move
    if (!state || !drag || move?.position !== "inside") return
    if (state.expandedKeys.has(move.target)) return
    if (performance.now() - drag.since >= EXPAND_DELAY) {
      state.toggleKey(move.target)
    }
  }

  /** Scrolls the row of `move` into view, rendering it when virtualized. */
  const reveal = (tree: HTMLElement, move: TreeViewMove) => {
    const state = stateRef.current
    if (!state) return
    const key =
      move.position === "after" ? lastVisible(state, move.target) : move.target
    const row = rowElement(tree, key)
    if (row) return row.scrollIntoView({ block: "nearest" })
    let index = 0
    const { collection } = state
    for (
      let k = collection.getFirstKey();
      k != null && k !== key;
      k = collection.getKeyAfter(k)
    ) {
      if (collection.getItem(k)?.type === "item") index++
    }
    const { rowSize, gap } = VIRTUAL_LAYOUT_OPTIONS
    tree.scrollTop = index * (rowSize + gap) - tree.clientHeight / 2
  }

  const begin = (key: Key) => {
    const state = stateRef.current
    if (!state || session.current) return null
    const { selectionManager: selection, collection } = state
    // The selection when the row is in it, the row alone otherwise.
    const keys = selection.isSelected(key)
      ? new Set(
          [...selection.selectedKeys].filter((k) => !selection.isDisabled(k))
        )
      : new Set([key])
    const values = rowValues(collection, (k) => keys.has(k))
    const drag: DragSession = {
      keys,
      values,
      move: null,
      since: 0,
      stop: () => {},
    }
    session.current = drag
    store.set({ dragged: new Set(values) })
    latest.current.onDragStart()
    return drag
  }

  /** Ends the drag, dropping where it aims when `drop`. */
  const finish = (drop: boolean) => {
    const drag = session.current
    if (!drag) return
    session.current = null
    drag.stop()
    store.set({ dragged: null, dropInside: null })
    if (lineRef.current) lineRef.current.hidden = true
    if (drop && drag.move) latest.current.onMove?.(drag.move)
  }

  const onPointerDownCapture = (event: React.PointerEvent<HTMLElement>) => {
    const tree = treeRef.current
    const row = rowOf(event.target, tree)
    const key = row?.dataset.value
    const target = event.target as Element
    const onGrip = !!target.closest('[data-slot="tree-view-drag-handle"]')
    if (!tree || !row || key === undefined) return
    if (session.current || event.button !== 0) return
    // The row's other controls keep their presses.
    if (!onGrip && target.closest("button, a, input, select, textarea")) return
    const stop = trackPointerDrag(event.nativeEvent, {
      item: row,
      container: tree,
      previewContainer: latest.current.portal,
      longPress: event.pointerType === "touch" && !onGrip,
      onStart: () => {
        const drag = begin(key)
        if (drag) drag.stop = stop
        return !!drag
      },
      onMove: (x, y) => {
        // Every frame, as rows scroll, open or render under a resting pointer.
        show(targetAt(x, y))
        openAimedFolder()
      },
      onEnd: finish,
    })
  }

  const dragFromKeyboard = (key: Key) => {
    const tree = treeRef.current
    const drag = tree && begin(key)
    if (!tree || !drag) return
    drag.stop = startKeyboardDrag<TreeViewMove>({
      container: tree,
      name:
        drag.values.length === 1
          ? labelOf(drag.values[0])
          : `${drag.values.length} rows`,
      places: () => keyboardMoves(key),
      isSame: (a, b) => a.target === b.target && a.position === b.position,
      describe: (move) => `${move.position} ${labelOf(move.target)}`,
      onAim: (move) => {
        show(move)
        if (move) reveal(tree, move)
      },
      onKey: (event, move) => {
        const rtl = getComputedStyle(tree).direction === "rtl"
        const opens = event.key === (rtl ? "ArrowLeft" : "ArrowRight")
        const closes = event.key === (rtl ? "ArrowRight" : "ArrowLeft")
        if (!opens && !closes) return false
        // Opens or closes the folder a drop would go into.
        const state = stateRef.current
        if (
          move?.position === "inside" &&
          state &&
          state.expandedKeys.has(move.target) !== opens
        ) {
          state.toggleKey(move.target)
        }
        return true
      },
      // Rows render as they scroll into view: follow them with the line.
      onFrame: placeLine,
      onEnd: (move) => {
        finish(move !== null)
        // Focus stays on the dropped row, which the move may have re-rendered.
        if (move) {
          requestAnimationFrame(() => {
            if (tree.contains(tree.ownerDocument.activeElement)) return
            stateRef.current?.selectionManager.setFocusedKey(move.values[0])
            rowElement(tree, move.values[0])?.focus()
          })
        }
      },
      announce: (message) => {
        if (announcerRef.current) announcerRef.current.textContent = message
      },
    })
  }

  // React Aria's drag hooks, reduced to what tells the tree its rows drag.
  const [dragAndDropHooks] = React.useState(() => {
    type DragState = ReturnType<
      NonNullable<DragAndDropHooks["useDraggableCollectionState"]>
    >
    type DragItem = ReturnType<
      NonNullable<DragAndDropHooks["useDraggableItem"]>
    >
    let state: DragState | null = null
    const hooks: Pick<
      DragAndDropHooks,
      | "useDraggableCollectionState"
      | "useDraggableCollection"
      | "useDraggableItem"
    > = {
      useDraggableCollectionState: ({ collection, selectionManager }) => {
        if (
          state?.collection !== collection ||
          state.selectionManager !== selectionManager
        ) {
          state = {
            collection,
            selectionManager,
            isDisabled: false,
            isDragging: () => false,
          } as unknown as DragState
        }
        return state
      },
      useDraggableCollection: () => {},
      useDraggableItem: ({ key }, { collection }) =>
        ({
          dragProps: {},
          dragButtonProps: {
            "aria-label": `Drag ${collection.getItem(key)?.textValue || key}`,
            // A pointer drags through the tree's pointer handler.
            onPress: (event: PressEvent) => {
              if (
                event.pointerType === "keyboard" ||
                event.pointerType === "virtual"
              ) {
                dragFromKeyboard(key)
              }
            },
          },
          isDragging: false,
        }) as DragItem,
    }
    return hooks as DragAndDropHooks
  })

  return { dragAndDropHooks, onPointerDownCapture }
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
  const store = React.useContext(TreeViewStoreContext)
  const menuOpen = useStore(
    store,
    (state) => state.menuOpen && state.menuValue === value
  )
  const dragging = useStore(store, (state) => !!state.dragged?.has(value))
  const dropTarget = useStore(store, (state) => state.dropInside === value)
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
      // Set last: the primitive writes its own drag attributes over props.
      render={(rowProps: DivProps) =>
        renderDiv({
          ...rowProps,
          "data-dragging": dragging ? "" : undefined,
          "data-drop-target": dropTarget ? "" : undefined,
        } as DivProps)
      }
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
              // A finger drags from the grip at once, without a long press.
              style={{ pointerEvents: "auto" }}
              render={renderButton}
              className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground/60 outline-none group-focus-within/tree-item:text-muted-foreground group-hover/tree-item:text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 [&_svg]:size-4"
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
