/**
 * Display rows: the one flat list of plain objects (items, group rows,
 * detail rows) that the body renders and a virtualizer windows, built from
 * the sorted rows or groups (`buildRows`), and its pages (`pageRows`).
 *
 * - A tree row's children follow it while it is expanded: in `expanded`,
 *   or shown expanded because a match is below it (`autoExpanded`).
 * - Group rows come before their rows and are open unless their key is in
 *   `collapsedGroups`; their `ids`, `items` and `aggregates` are the
 *   model's to give (`DataTableRowModel.groupIds` and the like).
 * - An expanded row with a detail row (not in a tree) is followed by it.
 * - `depth` is from 0. Tree and group rows (and the rows in groups) carry
 *   `posinset` / `setsize` among the rows shown with the same parent; a
 *   flat list's rows do not (their position is their index).
 * - In server mode a tree row whose children are `undefined` is
 *   expandable, and `loading` while expanded.
 *
 * Rows are shared between builds: a row whose fields are all the same as
 * in the build before is that build's object, so a part showing it need
 * not render again (`RowCache`).
 *
 * A page that starts inside a group, or below a tree parent, starts with
 * copies of the rows above it (the groups, the parents), marked
 * `continued`; they do not count towards the page size.
 */
import { NO_ROWS, type Core, type RowSet } from "./core"
import type { Formatter } from "./format"
import type { OrderedGroups } from "./group"
import { clampPage, getPageCount } from "./pagination"
import type { DataTableValue } from "./types"

type ItemRow<T> = {
  readonly kind: "item"
  /** Unique among the rows: the id. */
  readonly key: string
  readonly id: string
  readonly item: T
  /** From 0: the tree level, or the number of grouping columns in groups. */
  readonly depth: number
  /** The parent row's id in a tree, the group's key in groups. */
  readonly parentId: string | null
  /** In a tree or groups: from 1, among the rows shown with the same parent. */
  readonly posinset?: number
  readonly setsize?: number
  /** Has children shown in the tree (after filtering). */
  readonly hasChildren: boolean
  readonly hasDetail: boolean
  /** Has a chevron: children, a detail row, or (server) children not loaded yet. */
  readonly expandable: boolean
  readonly expanded: boolean
  /** Expanded in server mode while its children are not loaded. */
  readonly loading: boolean
  /** `isItemDisabled` of the item. */
  readonly disabled: boolean
  /** Shown only as an ancestor of matches: not a match itself, never selected by "select all". */
  readonly context: boolean
  /** A copy at the top of a page, of a row from an earlier one. */
  readonly continued?: true
}

type GroupRow = {
  readonly kind: "group"
  /** Opaque and stable while the grouping and the group's value stay. */
  readonly key: string
  /** The same as `key`. */
  readonly id: string
  readonly depth: number
  /** The enclosing group's key. */
  readonly parentId: string | null
  readonly posinset: number
  readonly setsize: number
  /** The grouping column's id. */
  readonly column: string
  /** The grouping column's value of the group's first row. */
  readonly value: DataTableValue
  /** That value's display text. */
  readonly text: string
  /** The number of items in the group, nested groups included. */
  readonly count: number
  readonly open: boolean
  /** A copy at the top of a page, of a row from an earlier one. */
  readonly continued?: true
}

type DetailRow<T> = {
  readonly kind: "detail"
  /** `detail:` and the item's id. */
  readonly key: string
  /** The item's id. */
  readonly id: string
  readonly item: T
  readonly depth: number
}

/** The totals row, over every matching item: in the footer, not in the body rows. */
type TotalsRow<T> = {
  readonly kind: "totals"
  readonly key: "totals"
  readonly count: number
  readonly items: ReadonlyArray<T>
  readonly aggregates: Readonly<Record<string, DataTableValue>>
}

type BodyRow<T> = ItemRow<T> | GroupRow | DetailRow<T>
type DisplayRow<T> = BodyRow<T> | TotalsRow<T>

/** The rows of the last build, for the next to share. */
type RowCache<T> = {
  core: Core<T> | undefined
  /** Item rows by position in `core`. */
  items: Array<ItemRow<T> | undefined>
  /** Group rows by group number in `grouping`. */
  grouping: object | undefined
  groups: Array<GroupRow | undefined>
  details: Map<string, DetailRow<T>>
  /** What a flat list's rows were built from, besides their order. */
  flat: ReadonlyArray<unknown> | undefined
  /** The number of the last build, and by position the last build each item row was in. */
  build: number
  stamps: Array<number>
}

function createRowCache<T>(): RowCache<T> {
  return {
    core: undefined,
    items: [],
    grouping: undefined,
    groups: [],
    details: new Map(),
    flat: undefined,
    build: 0,
    stamps: [],
  }
}

/** Points `cache` at `core`, keeping the rows of the items `core` still has. */
function retarget<T>(cache: RowCache<T>, core: Core<T>) {
  if (cache.core === core) return
  const previous = cache.items
  cache.items = []
  // Rows kept from other data are only reused after comparing their fields.
  cache.stamps = []
  for (const row of previous) {
    if (!row) continue
    const position = core.positions.get(row.id)
    if (position !== undefined && core.items[position] === row.item)
      cache.items[position] = row
  }
  cache.core = core
}

type BuildRowsInput<T> = {
  core: Core<T>
  /** The sorted rows (tree or flat), used without groups. */
  set: RowSet
  /** The ordered groups, when grouped. */
  groups: OrderedGroups<T> | null
  formatter: Formatter<T>
  server: boolean
  /** `isItemDisabled` by position, `null` without it. */
  disabled: Uint8Array | null
  expanded: ReadonlySet<string>
  /** Rows shown expanded however `expanded` is: 1 by position, `"parents"` for every row with children. */
  autoExpanded: Uint8Array | "parents" | null
  collapsedGroups: ReadonlySet<string>
  detail: boolean
  cache: RowCache<T>
}

/** The body rows (see the module comment). */
function buildRows<T>(input: BuildRowsInput<T>): Array<BodyRow<T>> {
  const { core, set, groups, expanded, autoExpanded, cache } = input
  const { items, ids } = core
  const children = set.children
  const hasDetail = input.detail && !children
  const out: Array<BodyRow<T>> = []
  retarget(cache, core)
  // A flat list's rows hold nothing about their place: when what they are
  // built from is the same, the rows of the last build are still right,
  // only their order (a new sort) may differ. Only those of the last build:
  // a row hidden then (by a search) missed the changes made meanwhile.
  const previousBuild = cache.build
  const build = ++cache.build
  const flatState =
    children || groups
      ? undefined
      : [core, input.server, input.disabled, expanded, set.context, hasDetail]
  const reuse =
    flatState !== undefined &&
    cache.flat?.length === flatState.length &&
    flatState.every((part, i) => cache.flat?.[i] === part)
  cache.flat = flatState
  const previousDetails = cache.details
  cache.details = new Map()
  if (groups && cache.grouping !== groups.grouping) {
    // Another grouping: keep the rows of groups it still has, by key.
    const byKey = new Map(
      cache.groups.flatMap((row) => (row ? [[row.key, row]] : []))
    )
    cache.groups = groups.grouping.keys.map((key) => byKey.get(key))
    cache.grouping = groups.grouping
  }

  const pushItem = (
    row: number,
    depth: number,
    parentId: string | null,
    posinset: number | undefined,
    setsize: number | undefined
  ) => {
    const id = ids[row]
    const item = items[row]
    const built =
      reuse && cache.stamps[row] === previousBuild
        ? cache.items[row]
        : undefined
    cache.stamps[row] = build
    if (built) {
      out.push(built)
      if (built.expanded && hasDetail) {
        const detail = previousDetails.get(id) ?? {
          kind: "detail" as const,
          key: `detail:${id}`,
          id,
          item,
          depth: 0,
        }
        cache.details.set(id, detail)
        out.push(detail)
      }
      return false
    }
    const hasChildren = children?.[row] !== undefined
    const unloaded = input.server && core.unloaded?.[row] === 1
    const expandable = hasChildren || hasDetail || unloaded
    const isExpanded =
      expandable &&
      (expanded.has(id) ||
        (hasChildren &&
          (autoExpanded === "parents" || autoExpanded?.[row] === 1)))
    const loading = isExpanded && unloaded
    const disabled = input.disabled?.[row] === 1
    const context = set.context?.[row] === 1
    const previous = cache.items[row]
    let next: ItemRow<T>
    if (
      previous?.item === item &&
      previous.depth === depth &&
      previous.parentId === parentId &&
      previous.posinset === posinset &&
      previous.setsize === setsize &&
      previous.hasChildren === hasChildren &&
      previous.hasDetail === hasDetail &&
      previous.expandable === expandable &&
      previous.expanded === isExpanded &&
      previous.loading === loading &&
      previous.disabled === disabled &&
      previous.context === context
    )
      next = previous
    else {
      // Two literals rather than a spread: one allocation, one shape each.
      next =
        posinset === undefined
          ? {
              kind: "item",
              key: id,
              id,
              item,
              depth,
              parentId,
              hasChildren,
              hasDetail,
              expandable,
              expanded: isExpanded,
              loading,
              disabled,
              context,
            }
          : {
              kind: "item",
              key: id,
              id,
              item,
              depth,
              parentId,
              posinset,
              setsize,
              hasChildren,
              hasDetail,
              expandable,
              expanded: isExpanded,
              loading,
              disabled,
              context,
            }
      cache.items[row] = next
    }
    out.push(next)
    if (isExpanded && hasDetail) {
      const before = previousDetails.get(id)
      const detail =
        before?.item === item && before.depth === depth
          ? before
          : { kind: "detail" as const, key: `detail:${id}`, id, item, depth }
      cache.details.set(id, detail)
      out.push(detail)
    }
    return isExpanded && hasChildren
  }

  const pushTree = (
    rows: Uint32Array,
    depth: number,
    parentId: string | null
  ) => {
    const tree = children !== null
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (
        pushItem(
          row,
          depth,
          parentId,
          tree ? i + 1 : undefined,
          tree ? rows.length : undefined
        )
      )
        pushTree(children?.[row] ?? NO_ROWS, depth + 1, ids[row])
    }
  }

  const pushGroups = (
    ordered: OrderedGroups<T>,
    depth: number,
    from: number,
    to: number,
    parentId: string | null
  ) => {
    const { grouping } = ordered
    const column = grouping.columns[depth]
    const level = ordered.order[depth]
    const last = depth === ordered.order.length - 1
    for (let i = from; i < to; i++) {
      const group = level[i]
      const key = grouping.keys[group]
      const open = !input.collapsedGroups.has(key)
      const firstItem = items[grouping.first[group]]
      const count = ordered.end[group] - ordered.start[group]
      const value = column.getValue(firstItem)
      const text = input.formatter.text(column, firstItem)
      const before = cache.groups[group]
      const row: GroupRow =
        before?.depth === depth &&
        before.parentId === parentId &&
        before.posinset === i - from + 1 &&
        before.setsize === to - from &&
        before.count === count &&
        before.open === open &&
        before.text === text &&
        Object.is(before.value, value)
          ? before
          : {
              kind: "group",
              key,
              id: key,
              depth,
              parentId,
              posinset: i - from + 1,
              setsize: to - from,
              column: column.id,
              value,
              text,
              count,
              open,
            }
      cache.groups[group] = row
      out.push(row)
      if (!open) continue
      if (!last)
        pushGroups(
          ordered,
          depth + 1,
          ordered.childStart[group],
          ordered.childEnd[group],
          key
        )
      else
        for (let r = ordered.start[group]; r < ordered.end[group]; r++)
          pushItem(
            ordered.rows[r],
            depth + 1,
            key,
            r - ordered.start[group] + 1,
            count
          )
    }
  }

  if (groups) pushGroups(groups, 0, 0, groups.order[0]?.length ?? 0, null)
  else pushTree(set.roots, 0, null)
  return out
}

/** Each row's index in `rows`, by key: the ids of items and the keys of groups. */
function indexRows<T>(rows: ReadonlyArray<BodyRow<T>>) {
  const map = new Map<string, number>()
  rows.forEach((row, i) => {
    if (row.kind !== "detail") map.set(row.key, i)
  })
  return map
}

type Page<T> = {
  rows: ReadonlyArray<BodyRow<T>>
  /** The rows the pages are counted in: item and group rows, not detail rows. */
  counted: number
  page: number
  pageCount: number
}

/**
 * Page `page` (clamped) of `pageSize` rows, detail rows going with their
 * row, and the page's continued ancestors first (see the module comment).
 */
function pageRows<T>(
  rows: ReadonlyArray<BodyRow<T>>,
  page: number,
  pageSize: number,
  indexOfRow: () => ReadonlyMap<string, number>
): Page<T> {
  let counted = 0
  for (const row of rows) if (row.kind !== "detail") counted++
  const pageCount = getPageCount(counted, pageSize)
  const current = clampPage(page, pageCount)
  const first = (current - 1) * pageSize
  let start = rows.length
  let end = rows.length
  let seen = 0
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].kind === "detail") continue
    if (seen === first) start = i
    if (seen === first + pageSize) {
      end = i
      break
    }
    seen++
  }
  const slice = rows.slice(start, end)
  const top = slice[0] as BodyRow<T> | undefined
  if (top === undefined || top.kind === "detail" || top.parentId === null)
    return { rows: slice, counted, page: current, pageCount }
  const ancestors: Array<BodyRow<T>> = []
  const index = indexOfRow()
  let parentId: string | null = top.parentId
  while (parentId !== null) {
    const at = index.get(parentId)
    if (at === undefined) break
    const parent = rows[at]
    if (parent.kind === "detail") break
    ancestors.unshift({ ...parent, continued: true })
    parentId = parent.parentId
  }
  return { rows: [...ancestors, ...slice], counted, page: current, pageCount }
}

/** A value computed when first asked for, then kept. */
function lazy<TValue>(fn: () => TValue) {
  let value: TValue | undefined
  let done = false
  return () => {
    if (!done) {
      value = fn()
      done = true
    }
    return value as TValue
  }
}

/**
 * The rows' positions in display order, collapsed ones included: a tree
 * depth first, else the groups' rows in turn.
 */
function displayOrder<T>(
  set: RowSet,
  groups: OrderedGroups<T> | null
): Uint32Array {
  if (groups) return groups.rows
  if (!set.children) return set.roots
  const out: Array<number> = []
  const visit = (rows: Uint32Array) => {
    for (const row of rows) {
      out.push(row)
      const children = set.children?.[row]
      if (children) visit(children)
    }
  }
  visit(set.roots)
  return Uint32Array.from(out)
}

export { buildRows, createRowCache, displayOrder, indexRows, lazy, pageRows }
export type {
  BodyRow,
  BuildRowsInput,
  DetailRow,
  DisplayRow,
  GroupRow,
  ItemRow,
  Page,
  RowCache,
  TotalsRow,
}
