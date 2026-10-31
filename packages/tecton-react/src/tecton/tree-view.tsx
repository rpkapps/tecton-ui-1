"use client"

import * as React from "react"
import { cn } from "cn"
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

import {
  defineTreeItem,
  TreePrimitive,
  useTreeDragAndDrop,
} from "./internal/primitives/tree/index"

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

/** Virtualized rows: 32 px tall, 1 px apart. */
const VIRTUAL = { rowHeight: 32, gap: 1 }

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
  const treeRef = React.useRef<HTMLDivElement | null>(null)
  const [menuStore] = React.useState(createMenuStore)
  const menuActionsRef = React.useRef<ContextMenuPrimitive.Root.Actions>(null)
  const dragAndDrop = useTreeDragAndDrop({
    onMove,
    canDrop,
    // A long press opens the menu and starts a drag: the drag wins.
    onDragStart: () => menuActionsRef.current?.close(),
    indicator: <TreeViewDropIndicator />,
    levelOffset: (level) => chevronOffset(level) * remOf(),
    levelWidth: () => INDENT * remOf(),
  })

  const tree = (
    <TreePrimitive.Root<T>
      data-slot="tree-view"
      className={cn(
        "relative w-full overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        // Rows are spaced by their own margin, not a `gap`.
        virtualized ? "block" : "flex flex-col",
        className,
        // Virtualized rows are positioned across the full, rounded
        // `clientWidth`: no padding, and no sideways scroll for a pixel over.
        virtualized && "overflow-x-hidden p-0"
      )}
      {...props}
      ref={mergeRefs(treeRef, props.ref)}
      items={items}
      selectionMode={selectionMode}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange && ((next) => onValueChange(next))}
      disallowEmptySelection={disallowEmptySelection}
      onActivate={onActivate}
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange && ((next) => onExpandedChange(next))}
      empty={empty}
      virtualized={virtualized ? VIRTUAL : false}
      dragAndDrop={onMove ? dragAndDrop : undefined}
      onKeyDown={
        contextMenu &&
        ((event: React.KeyboardEvent<HTMLDivElement>) => {
          // Shift+F10 and the Menu key open the focused row's context menu.
          const row =
            (event.key === "ContextMenu" ||
              (event.key === "F10" && event.shiftKey)) &&
            rowOf(event.target, treeRef.current)
          if (!row) return
          event.preventDefault()
          openMenuAt(row)
        })
      }
      render={
        contextMenu &&
        ((rootProps) => <ContextMenuTrigger render={<div {...rootProps} />} />)
      }
    >
      {children}
    </TreePrimitive.Root>
  )

  if (!contextMenu) return tree

  return (
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
          if (!row || rowValue === undefined || contextMenu(rowValue) == null) {
            details.cancel()
            return
          }
          // Focus follows the menu's row; the selection stays as it is.
          row.focus({ preventScroll: true })
          menuStore.set({ value: rowValue, open: true })
        }}
        onOpenChangeComplete={(open) => {
          if (!open) menuStore.set({ value: null })
        }}
      >
        {tree}
        <TreeViewMenuContent contextMenu={contextMenu} />
      </ContextMenu>
    </TreeViewMenuContext>
  )
}

/** The root font size, in px: the tree's geometry is in rem. */
function remOf() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

/** The line a drop between rows lands on, indented to the rows' level. */
function TreeViewDropIndicator() {
  return (
    <TreePrimitive.DropIndicator
      data-slot="tree-view-drop-indicator"
      className="inset-x-0 z-10 h-0"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute end-1 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary before:absolute before:-start-1 before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-primary before:bg-background"
        style={{
          insetInlineStart: `calc(${chevronOffset(1) + CONTROL + GAP - INDENT}rem + var(--tree-drop-level) * ${INDENT}rem)`,
        }}
      />
    </TreePrimitive.DropIndicator>
  )
}

/** Sets every ref it is given. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (element: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element
    }
  }
}

type TreeViewCollectionProps<T> = TreePrimitive.TreeCollectionProps<T>

/**
 * The child rows of a `TreeViewItem` rendered from data. Rows re-render when
 * `items` or the render function change: a render function created during
 * render (closing over a hidden set, a selection map) keeps them current,
 * and a stable one (module-level or `useCallback`) skips the rows the parent
 * did not change, which large trees need.
 */
const TreeViewCollection = TreePrimitive.Collection

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

/** The text of the row's `TreeViewItemContent`, when it is plain text. */
function textOf(content: TreeViewItemContentProps | undefined) {
  const text = content?.children
  return typeof text === "string" || typeof text === "number"
    ? String(text)
    : ""
}

function TreeViewItem({
  className,
  value,
  label: _label,
  disabled: _disabled,
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
  return (
    <TreePrimitive.Item
      value={value}
      data-slot="tree-view-item"
      data-kind={content && (content.kind ?? "item")}
      data-hidden={hidden ? "" : undefined}
      data-context-menu-open={menuOpen ? "" : undefined}
      {...props}
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
    </TreePrimitive.Item>
  )
}

defineTreeItem(TreeViewItem, (props: TreeViewItemProps) => {
  const content = contentOf(props.children)
  return {
    value: props.value,
    textValue: props.label ?? textOf(content),
    disabled: !!props.disabled,
    folder: content?.kind === "folder",
    children: props.children,
  }
})

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
    <TreePrimitive.ItemContent
      data-slot="tree-view-item-content"
      data-kind={kind}
      className={cn(
        "flex h-8 min-w-0 flex-1 items-center gap-1.5 pe-1",
        className
      )}
      // Draggable rows keep their grips in one column at the start and
      // indent after it, from the chevron on.
      style={({ draggable, level }) => ({
        paddingInlineStart: `${draggable ? ROW_PADDING : ROW_PADDING + (level - 1) * INDENT}rem`,
      })}
    >
      {({ hasChildren, expanded, level, draggable }) => (
        <>
          {draggable && <TreeViewDragHandle />}
          <TreePrimitive.Chevron
            data-slot="tree-view-chevron"
            style={
              draggable
                ? { marginInlineStart: `${(level - 1) * INDENT}rem` }
                : undefined
            }
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
              !hasChildren && "invisible"
            )}
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform rtl:-scale-x-100",
                expanded && "rotate-90 rtl:-rotate-90"
              )}
            />
          </TreePrimitive.Chevron>
          <span
            data-slot="tree-view-icon"
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
          >
            {icon ??
              (kind === "folder" ? (
                expanded ? (
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
        </>
      )}
    </TreePrimitive.ItemContent>
  )
}

/** A draggable row's grip, at the start of its content. */
function TreeViewDragHandle() {
  return (
    <TreePrimitive.DragHandle
      data-slot="tree-view-drag-handle"
      className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&_svg]:size-4"
    >
      <GripVerticalIcon />
    </TreePrimitive.DragHandle>
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
  disabled,
  ...props
}: TreeViewActionProps) {
  return (
    <button
      type="button"
      data-slot="tree-view-action"
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      {...props}
      className={cn(
        "flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className
      )}
    >
      {children ?? <MoreVerticalIcon />}
    </button>
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
