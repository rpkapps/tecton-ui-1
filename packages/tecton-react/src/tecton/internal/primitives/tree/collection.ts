/**
 * Internal to `@tecton/react`: the structure of a tree, read from the
 * elements it is given rather than from rendered rows, so that collapsed
 * rows and rows scrolled out of a virtualized tree still count: select all,
 * type-ahead, keyboard navigation and drag and drop see every row.
 *
 * An element is a row when its component is marked with `defineTreeItem`,
 * and a list of rows from data when marked with `defineTreeCollection`;
 * Fragments and arrays are walked through, anything else is ignored. The
 * nodes built for an element are kept while the element is the same, and a
 * collection's elements while its `items` and render function are, so a
 * render that changes neither rebuilds nothing and memoized rows stay
 * memoized.
 */
import * as React from "react"

const TREE_PART = Symbol.for("tecton.tree.part")

/** What the tree needs to know about a row element. */
type TreeItemInfo = {
  value: string
  textValue: string
  disabled: boolean
  /** Takes drops inside even with no child rows (`kind="folder"`). */
  folder: boolean
  /** Holds the child rows (and the row's own content, which is skipped). */
  children: React.ReactNode
}

type TreeCollectionInfo = {
  items: Iterable<unknown>
  render: (item: unknown) => React.ReactNode
}

type TreePart =
  | { kind: "item"; read: (props: never) => TreeItemInfo }
  | { kind: "collection"; read: (props: never) => TreeCollectionInfo }

type Marked = { [TREE_PART]?: TreePart }

/** Marks `component` as a tree row, read with `read`. */
function defineTreeItem<TProps>(
  component: React.ComponentType<TProps>,
  read: (props: TProps) => TreeItemInfo
) {
  ;(component as Marked)[TREE_PART] = { kind: "item", read }
}

/** Marks `component` as a list of rows rendered from data. */
function defineTreeCollection<TProps>(
  component: React.ComponentType<TProps>,
  read: (props: TProps) => TreeCollectionInfo
) {
  ;(component as Marked)[TREE_PART] = { kind: "collection", read }
}

function partOf(node: React.ReactNode): TreePart | undefined {
  if (!React.isValidElement(node) || typeof node.type === "string") return
  return (node.type as Marked)[TREE_PART]
}

/** Whether `node` is a row or a list of rows (not a row's own content). */
function isTreePart(node: React.ReactNode) {
  return partOf(node) !== undefined
}

type TreeNode = {
  value: string
  textValue: string
  disabled: boolean
  /** Takes drops inside: `folder`, or has child rows. */
  isFolder: boolean
  /** From 1. */
  level: number
  parent: string | null
  /** Position among its siblings, from 1, and their number. */
  posInSet: number
  setSize: number
  children: Array<TreeNode>
  /** The element the row renders. */
  element: React.ReactElement
}

type Tree = {
  roots: Array<TreeNode>
  byValue: ReadonlyMap<string, TreeNode>
  /** Every row's value, depth first (collapsed rows included). */
  order: Array<string>
}

// A render function's output, per `items`, per function.
const rendered = new WeakMap<
  object,
  WeakMap<TreeCollectionInfo["render"], Array<React.ReactNode>>
>()

/** Renders `items` with `render`, keyed by each row's value; cached. */
function renderCollection(
  items: Iterable<unknown>,
  render: TreeCollectionInfo["render"]
) {
  const cacheable = typeof items === "object"
  let byRender = cacheable ? rendered.get(items) : undefined
  const cached = byRender?.get(render)
  if (cached) return cached
  const elements = Array.from(items, (item, index) => {
    const element = render(item)
    let key: React.Key = index
    if (React.isValidElement<{ value?: unknown }>(element)) {
      if (element.key != null) key = element.key
      else if (typeof element.props.value === "string")
        key = element.props.value
    } else if (item && typeof item === "object") {
      const record = item as { value?: unknown; id?: unknown }
      const candidate = record.value ?? record.id
      if (typeof candidate === "string" || typeof candidate === "number")
        key = candidate
    }
    return React.isValidElement(element) && element.key === key
      ? element
      : React.createElement(React.Fragment, { key }, element)
  })
  if (cacheable) {
    if (!byRender) rendered.set(items, (byRender = new WeakMap()))
    byRender.set(render, elements)
  }
  return elements
}

// The nodes of an element, while it stays at the same level and parent.
const nodes = new WeakMap<React.ReactElement, TreeNode>()

/** The row elements in `children`, through Fragments, arrays and collections. */
function rowElements(
  children: React.ReactNode,
  out: Array<React.ReactElement> = []
) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const part = partOf(child)
    if (part?.kind === "item") out.push(child)
    else if (part?.kind === "collection") {
      const { items, render } = (
        part.read as (p: unknown) => TreeCollectionInfo
      )(child.props)
      rowElements(renderCollection(items, render), out)
    } else if (child.type === React.Fragment) {
      rowElements((child.props as { children?: React.ReactNode }).children, out)
    }
  })
  return out
}

function buildNodes(
  children: React.ReactNode,
  level: number,
  parent: string | null
): Array<TreeNode> {
  const elements = rowElements(children)
  return elements.map((element, index) => {
    const cached = nodes.get(element)
    if (
      cached &&
      cached.level === level &&
      cached.parent === parent &&
      cached.posInSet === index + 1 &&
      cached.setSize === elements.length
    )
      return cached
    const info = (partOf(element)!.read as (p: unknown) => TreeItemInfo)(
      element.props
    )
    const childNodes = buildNodes(info.children, level + 1, info.value)
    const node: TreeNode = {
      value: info.value,
      textValue: info.textValue,
      disabled: info.disabled,
      isFolder: info.folder || childNodes.length > 0,
      level,
      parent,
      posInSet: index + 1,
      setSize: elements.length,
      children: childNodes,
      element,
    }
    nodes.set(element, node)
    return node
  })
}

/** The tree described by `children` (row elements, collections, Fragments). */
function buildTree(children: React.ReactNode): Tree {
  const roots = buildNodes(children, 1, null)
  const byValue = new Map<string, TreeNode>()
  const order: Array<string> = []
  const walk = (list: Array<TreeNode>) => {
    for (const node of list) {
      if (byValue.has(node.value)) continue
      byValue.set(node.value, node)
      order.push(node.value)
      walk(node.children)
    }
  }
  walk(roots)
  return { roots, byValue, order }
}

/** The rows on screen: depth first, into expanded rows only. */
function visibleRows(tree: Tree, expanded: ReadonlySet<string>) {
  const rows: Array<TreeNode> = []
  const walk = (list: Array<TreeNode>) => {
    for (const node of list) {
      rows.push(node)
      if (node.children.length && expanded.has(node.value)) walk(node.children)
    }
  }
  walk(tree.roots)
  return rows
}

/** Whether `value` is one of `rows` or inside one of them. */
function isWithin(tree: Tree, value: string, rows: ReadonlySet<string>) {
  for (
    let node = tree.byValue.get(value);
    node;
    node = node.parent === null ? undefined : tree.byValue.get(node.parent)
  ) {
    if (rows.has(node.value)) return true
  }
  return false
}

/** `value`'s ancestor at `level` (from 1), or `value` itself at its own level. */
function ancestorAt(tree: Tree, value: string, level: number) {
  let node = tree.byValue.get(value)
  while (node && node.level > level && node.parent !== null) {
    node = tree.byValue.get(node.parent)
  }
  return node?.value ?? value
}

export {
  ancestorAt,
  buildTree,
  defineTreeCollection,
  defineTreeItem,
  isTreePart,
  isWithin,
  renderCollection,
  visibleRows,
}
export type { Tree, TreeCollectionInfo, TreeItemInfo, TreeNode }
