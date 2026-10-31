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
  MoreVerticalIcon,
} from "lucide-react"

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
  "data-drop-target",
  "data-allows-dragging",
  "data-dragging",
  "data-selection-mode",
  "data-has-child-items",
])

/** Boolean states, written as presence attributes (`data-selected=""`). */
const PRESENCE_ATTRIBUTES = new Set([
  "data-selected",
  "data-expanded",
  "data-disabled",
  "data-empty",
])

function stateAttributes<TProps extends object>(props: TProps): TProps {
  const result: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if (DROPPED_ATTRIBUTES.has(name)) continue
    if (PRESENCE_ATTRIBUTES.has(name)) {
      if (value !== undefined && value !== false && value !== "false") {
        result[name] = ""
      }
      continue
    }
    result[name] = value
  }
  return result as TProps
}

function renderDiv(props: React.ComponentProps<"div">) {
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
}

type TreeState = TreeRenderProps["state"]

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
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

type MenuStore = ReturnType<typeof createMenuStore>

const TreeViewMenuContext = React.createContext<MenuStore | null>(null)

const noSubscription = () => () => {}

const VIRTUAL_LAYOUT_OPTIONS = { rowSize: 32, gap: 1 }

const ROW_SELECTOR = '[data-slot="tree-view-item"]'

/** The enabled row an event happened in, if it belongs to `tree`. */
function rowOf(target: EventTarget | null, tree: Element | null) {
  if (!(target instanceof Element) || !tree) return null
  const row = target.closest<HTMLElement>(ROW_SELECTOR)
  if (!row || row.closest('[data-slot="tree-view"]') !== tree) return null
  if (row.hasAttribute("data-disabled")) return null
  return row
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

/** Every row that `"all"` (select all) stands for, collapsed ones included. */
function selectableValues(state: TreeState | null): string[] {
  if (!state) return []
  const { collection, selectionManager } = state
  const seen = new Set<Key>()
  const values: string[] = []
  const visit = (key: Key) => {
    const node = collection.getItem(key)
    if (!node || node.type !== "item" || seen.has(key)) return
    seen.add(key)
    if (!selectionManager.isDisabled(key)) values.push(String(key))
    for (const child of collection.getChildren?.(key) ?? []) visit(child.key)
  }
  for (const node of collection) visit(node.key)
  return values
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
  ...props
}: TreeViewProps<T>) {
  const stateRef = React.useRef<TreeState | null>(null)
  const treeRef = React.useRef<HTMLDivElement | null>(null)
  const [menuStore] = React.useState(createMenuStore)
  // Rendered rows are kept while `items` and the render function stay the
  // same, so a selection or focus change does not re-render every row.
  const rows = React.useMemo(
    () =>
      typeof children === "function"
        ? renderItems(items ?? [], children)
        : children,
    [items, children]
  )

  const renderTree = (domProps: React.ComponentProps<"div">) => {
    if (!contextMenu) return renderDiv(domProps)
    const { onKeyDown } = domProps
    return (
      <ContextMenuTrigger
        ref={treeRef}
        render={renderDiv({
          ...domProps,
          onKeyDown: (event) => {
            const row =
              (event.key === "ContextMenu" ||
                (event.key === "F10" && event.shiftKey)) &&
              rowOf(event.target, treeRef.current)
            if (row) {
              event.preventDefault()
              openMenuAt(row)
              return
            }
            onKeyDown?.(event)
          },
        })}
      />
    )
  }

  const tree = (
    <TreePrimitive
      data-slot="tree-view"
      className={cn(
        "w-full overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        // Virtualized rows are positioned by the tree, not laid out by it,
        // and span its full width: padding would push them out sideways.
        virtualized ? "relative block" : "flex flex-col gap-px",
        className,
        // Rows are sized from the rounded `clientWidth`, which can exceed a
        // fractional content box by a pixel: never scroll sideways for it.
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

function textOf(children: React.ReactNode): string | undefined {
  let text: string | undefined
  React.Children.forEach(children, (child) => {
    if (
      text === undefined &&
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.type === TreeViewItemContent &&
      (typeof child.props.children === "string" ||
        typeof child.props.children === "number")
    ) {
      text = String(child.props.children)
    }
  })
  return text
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
  return (
    <TreeItemPrimitive
      data-slot="tree-view-item"
      data-value={value}
      data-hidden={hidden ? "" : undefined}
      data-context-menu-open={menuOpen ? "" : undefined}
      {...(props as unknown as React.ComponentProps<typeof TreeItemPrimitive>)}
      id={value}
      textValue={label ?? textOf(children) ?? ""}
      isDisabled={disabled}
      render={renderDiv}
      className={({ selectionMode }) =>
        cn(
          "group/tree-item relative flex cursor-default items-center rounded-md outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset",
          selectionMode !== "none" && "hover:bg-accent/60 active:bg-accent",
          "data-[selected]:bg-accent data-[selected]:text-accent-foreground",
          "data-[context-menu-open]:ring-2 data-[context-menu-open]:ring-ring/40 data-[context-menu-open]:ring-inset",
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
      {({ hasChildItems, isExpanded, level }) => (
        <div
          data-slot="tree-view-item-content"
          data-kind={kind}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 pe-1",
            className
          )}
          style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.25}rem` }}
        >
          <ButtonPrimitive
            slot="chevron"
            data-slot="tree-view-chevron"
            aria-hidden={!hasChildItems}
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
}
export type {
  TreeViewProps,
  TreeViewItemProps,
  TreeViewItemContentProps,
  TreeViewCollectionProps,
  TreeViewActionProps,
  TreeViewVisibilityToggleProps,
}
