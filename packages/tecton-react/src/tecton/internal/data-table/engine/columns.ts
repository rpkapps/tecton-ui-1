/**
 * `createColumns` and the column model the rest of the engine and the parts
 * read. `createColumns` checks the definitions once (ids unique and not
 * empty, groups not empty) and throws a clear error otherwise: it runs where
 * the columns are written, usually at module level. It resolves each leaf
 * column's type defaults (alignment, aggregate, value access, sort key) from
 * one table, so every feature reads a column the same way.
 *
 * `DataTableColumns<T>` is opaque to applications; `getColumnModel` reads
 * the model behind it. Header rows are built for the columns shown, in their
 * order, so hidden, reordered and pinned columns split or shrink their
 * group headers as they must.
 */
import { toBoolean, toNumber, toTime } from "./values"
import type {
  DataTableAggregate,
  DataTableColumn,
  DataTableColumnGroup,
  DataTableColumns,
  DataTableColumnType,
  DataTableFilterValue,
  DataTableLeafColumn,
  DataTableOption,
  DataTableValue,
} from "./types"

/** A leaf column with its type defaults resolved. */
type EngineColumn<T> = {
  readonly id: string
  readonly header: string
  readonly description: string | undefined
  readonly type: DataTableColumnType
  /** The column as written, for its render functions. */
  readonly definition: DataTableLeafColumn<T>
  /** The column's default position among the leaf columns. */
  readonly index: number
  /** The ids of the groups the column is in, the outermost first. */
  readonly groups: ReadonlyArray<string>
  readonly align: "start" | "center" | "end"
  readonly aggregate: DataTableAggregate<T> | null
  readonly format:
    Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | undefined
  /** An `options` column's options (empty for other types). */
  readonly options: ReadonlyArray<DataTableOption>
  /** Each option's position, by value. */
  readonly optionIndex: ReadonlyMap<string, number>
  readonly getValue: (item: T) => DataTableValue
  /**
   * The value the column sorts by: text in natural order, numbers (dates as
   * timestamps, booleans as 0 / 1, options as their position), `undefined`
   * for no value.
   */
  readonly sortValue: (item: T) => string | number | undefined
  readonly compare: ((a: T, b: T) => number) | undefined
  readonly filter:
    ((item: T, filterValue: DataTableFilterValue) => boolean) | undefined
  /** The column's own opt-outs; the root's features still have to be on. */
  readonly sortable: boolean
  readonly filterable: boolean
  readonly groupable: boolean
  readonly resizable: boolean
  readonly reorderable: boolean
  readonly hideable: boolean
  readonly pinnable: boolean
  /** Whether search reads the column: filterable, and shown as text (not a boolean's check). */
  readonly searchable: boolean
  readonly width: number | undefined
  readonly minWidth: number | undefined
  readonly maxWidth: number | undefined
  /** Whether this is the column that names the row. */
  readonly rowHeader: boolean
}

type EngineColumnGroup = {
  readonly id: string
  readonly header: string
  readonly description: string | undefined
  /** The ids of its leaf columns, in default order. */
  readonly columns: ReadonlyArray<string>
  /** The ids of the groups it is in, the outermost first. */
  readonly groups: ReadonlyArray<string>
}

/** The definitions' shape: what column reordering keeps together. */
type ColumnNode =
  | { readonly kind: "column"; readonly id: string }
  | {
      readonly kind: "group"
      readonly id: string
      readonly children: ReadonlyArray<ColumnNode>
    }

type ColumnModel<T> = {
  /** Every leaf column, in default order. */
  readonly leaves: ReadonlyArray<EngineColumn<T>>
  readonly byId: ReadonlyMap<string, EngineColumn<T>>
  readonly groups: ReadonlyMap<string, EngineColumnGroup>
  readonly tree: ReadonlyArray<ColumnNode>
  /** The column that names the row: the first with `rowHeader`, else the first. */
  readonly rowHeader: string | undefined
}

type HeaderCell = {
  /** Unique within its row. */
  readonly key: string
  readonly kind: "column" | "group" | "placeholder"
  /** The column's or group's id; `null` for a placeholder. */
  readonly id: string | null
  readonly colSpan: number
  /** The leaf columns below the cell. */
  readonly columns: ReadonlyArray<string>
}

type HeaderRow = {
  readonly key: string
  /** From 0 at the top; the last row holds the leaf columns. */
  readonly level: number
  readonly cells: ReadonlyArray<HeaderCell>
}

const ALIGN: Record<DataTableColumnType, EngineColumn<unknown>["align"]> = {
  text: "start",
  number: "end",
  date: "start",
  boolean: "center",
  options: "start",
}

const AGGREGATE: Record<DataTableColumnType, "sum" | "count" | null> = {
  text: null,
  number: "sum",
  date: null,
  boolean: "count",
  options: null,
}

const models = new WeakMap<object, ColumnModel<unknown>>()

function isGroup<T>(
  column: DataTableColumn<T>
): column is DataTableColumnGroup<T> {
  return Array.isArray(column.columns)
}

function valueReader<T>(
  definition: DataTableLeafColumn<T>
): (item: T) => DataTableValue {
  const { accessor, id } = definition
  if (typeof accessor === "function") return accessor
  const key = accessor ?? id
  return (item) => (item as Record<PropertyKey, DataTableValue>)[key]
}

function sortReader<T>(
  type: DataTableColumnType,
  getValue: (item: T) => DataTableValue,
  optionIndex: ReadonlyMap<string, number>
): EngineColumn<T>["sortValue"] {
  switch (type) {
    case "number":
      return (item) => toNumber(getValue(item))
    case "date":
      return (item) => toTime(getValue(item))
    case "boolean":
      return (item) => {
        const value = toBoolean(getValue(item))
        return value === undefined ? undefined : Number(value)
      }
    case "options":
      return (item) => {
        const value = getValue(item)
        if (value === null || value === undefined || value === "")
          return undefined
        // Values the options do not list sort after the ones they do.
        return optionIndex.get(String(value)) ?? optionIndex.size
      }
    case "text":
      // "" is no value, as for every other type: empty rows sort last.
      return (item) => {
        const value = getValue(item)
        return value === null || value === undefined || value === ""
          ? undefined
          : String(value)
      }
  }
}

function resolveLeaf<T>(
  definition: DataTableLeafColumn<T>,
  index: number,
  groups: ReadonlyArray<string>
): EngineColumn<T> {
  const type = definition.type ?? "text"
  const options = type === "options" ? (definition.options ?? []) : []
  const optionIndex = new Map(options.map((option, i) => [option.value, i]))
  const getValue = valueReader(definition)
  const filterable = definition.filterable !== false
  return {
    id: definition.id,
    header: definition.header,
    description: definition.description,
    type,
    definition,
    index,
    groups,
    align: definition.align ?? ALIGN[type],
    aggregate: definition.aggregate ?? AGGREGATE[type],
    format: definition.format,
    options,
    optionIndex,
    getValue,
    sortValue: sortReader(type, getValue, optionIndex),
    compare: definition.compare,
    filter: definition.filter,
    sortable: definition.sortable !== false,
    filterable,
    groupable: definition.groupable !== false,
    resizable: definition.resizable !== false,
    reorderable: definition.reorderable !== false,
    hideable: definition.hideable !== false,
    pinnable: definition.pinnable !== false,
    searchable: filterable && type !== "boolean",
    width: definition.width,
    minWidth: definition.minWidth,
    maxWidth: definition.maxWidth,
    rowHeader: false,
  }
}

/**
 * Checks and resolves column definitions for `DataTable`. Call it once per
 * set of columns (at module level, or memoized): the table recomputes what
 * depends on the columns when this object changes.
 *
 * @throws When an id is empty or used twice, or a group has no columns.
 */
function createColumns<T>(
  columns: ReadonlyArray<DataTableColumn<T>>
): DataTableColumns<T> {
  const leaves: Array<EngineColumn<T>> = []
  const groups = new Map<string, EngineColumnGroup>()
  const seen = new Set<string>()

  const walk = (
    definitions: ReadonlyArray<DataTableColumn<T>>,
    parents: ReadonlyArray<string>
  ): Array<ColumnNode> =>
    definitions.map((definition) => {
      const { id } = definition
      if (typeof id !== "string" || id === "")
        throw new Error(
          `createColumns: every column and group needs a non-empty \`id\` (the one with header "${String(definition.header)}" has none).`
        )
      if (seen.has(id))
        throw new Error(
          `createColumns: the id "${id}" is used more than once. Column and group ids must be unique.`
        )
      seen.add(id)
      if (!isGroup(definition)) {
        leaves.push(resolveLeaf(definition, leaves.length, parents))
        return { kind: "column", id }
      }
      if (definition.columns.length === 0)
        throw new Error(`createColumns: the group "${id}" has no columns.`)
      const first = leaves.length
      const children = walk(definition.columns, [...parents, id])
      groups.set(id, {
        id,
        header: definition.header,
        description: definition.description,
        columns: leaves.slice(first).map((leaf) => leaf.id),
        groups: parents,
      })
      return { kind: "group", id, children }
    })

  const tree = walk(columns, [])
  const rowHeaderIndex = Math.max(
    0,
    leaves.findIndex((leaf) => leaf.definition.rowHeader)
  )
  if (leaves[rowHeaderIndex])
    leaves[rowHeaderIndex] = { ...leaves[rowHeaderIndex], rowHeader: true }

  const model: ColumnModel<T> = {
    leaves,
    byId: new Map(leaves.map((leaf) => [leaf.id, leaf])),
    groups,
    tree,
    rowHeader: leaves[rowHeaderIndex]?.id,
  }
  // The handle applications pass around; the model stays behind it.
  const handle = Object.freeze({}) as DataTableColumns<T>
  models.set(handle, model as ColumnModel<unknown>)
  return handle
}

/**
 * The model behind columns from `createColumns`.
 *
 * @throws When `columns` did not come from `createColumns`.
 */
function getColumnModel<T>(columns: DataTableColumns<T>): ColumnModel<T> {
  const model = models.get(columns)
  if (!model)
    throw new Error(
      "DataTable: `columns` must be made with `createColumns(...)` from @tecton/react/tecton/data-table."
    )
  return model
}

/** The narrowest a column is, unless its `minWidth` says. */
const MIN_COLUMN_WIDTH = 48
/**
 * The widest the user resizes a column to, unless its `maxWidth` says: a
 * ceiling for the resizer, not for a width a column has (one stretched
 * over a wide table may be wider).
 */
const MAX_COLUMN_WIDTH = 1000

/**
 * `width` within a column's `minWidth` (48 px when it has none) and its
 * `maxWidth`; the minimum wins.
 */
function clampColumnWidth(
  minWidth: number | undefined,
  maxWidth: number | undefined,
  width: number
) {
  return Math.max(
    minWidth ?? MIN_COLUMN_WIDTH,
    maxWidth === undefined ? width : Math.min(width, maxWidth)
  )
}

/** The group a column or group is in; `null` at the top level. */
function parentOf<T>(model: ColumnModel<T>, id: string): string | null {
  const node = model.byId.get(id) ?? model.groups.get(id)
  return node?.groups.at(-1) ?? null
}

/** The columns and groups directly in `parent` (the top level for `null`), in definition order. */
function childrenOf<T>(
  model: ColumnModel<T>,
  parent: string | null
): ReadonlyArray<ColumnNode> {
  if (parent === null) return model.tree
  const find = (nodes: ReadonlyArray<ColumnNode>): ColumnNode | undefined => {
    for (const node of nodes) {
      if (node.kind !== "group") continue
      if (node.id === parent) return node
      const found = find(node.children)
      if (found) return found
    }
    return undefined
  }
  const group = find(model.tree)
  return group?.kind === "group" ? group.children : []
}

/** Where a column or group starts in `order`: its first column's place. */
function placeIn<T>(
  model: ColumnModel<T>,
  position: ReadonlyMap<string, number>,
  id: string
) {
  const leaves = model.groups.get(id)?.columns ?? [id]
  return Math.min(...leaves.map((leaf) => position.get(leaf) ?? Infinity))
}

/**
 * The columns and groups directly in `parent` (the top level for `null`), in
 * the order `order` (a reconciled `columns.order`) shows them: the list a
 * column or group moves within when the user reorders the columns.
 */
function siblingsInOrder<T>(
  model: ColumnModel<T>,
  order: ReadonlyArray<string>,
  parent: string | null
): Array<string> {
  const position = new Map(order.map((id, index) => [id, index]))
  return childrenOf(model, parent)
    .map((node) => node.id)
    .sort((a, b) => placeIn(model, position, a) - placeIn(model, position, b))
}

/**
 * `order` with the columns and groups directly in `parent` put in the order
 * of `siblings` (their ids); a group's columns move with it, and every
 * other column keeps its place among its own siblings.
 */
function orderSiblings<T>(
  model: ColumnModel<T>,
  order: ReadonlyArray<string>,
  parent: string | null,
  siblings: ReadonlyArray<string>
): Array<string> {
  const position = new Map(order.map((id, index) => [id, index]))
  const rank = new Map(siblings.map((id, index) => [id, index]))
  const arrange = (
    nodes: ReadonlyArray<ColumnNode>,
    within: string | null
  ): Array<string> =>
    nodes
      .map((node) => ({
        id: node.id,
        at: placeIn(model, position, node.id),
        ids:
          node.kind === "column" ? [node.id] : arrange(node.children, node.id),
      }))
      .sort((a, b) =>
        within === parent
          ? (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
            a.at - b.at
          : a.at - b.at
      )
      .flatMap((node) => node.ids)
  return arrange(model.tree, null)
}

/**
 * The header rows over the given leaf columns, in the order given. A group
 * spans its consecutive columns (split where columns of another group, or
 * none, come between them, and where `segments` differ: pinned columns
 * never share a cell with unpinned ones); the leaf columns are all in the
 * last row, with placeholders above a column that sits in fewer groups
 * than the deepest, merged while they sit side by side under the same cell.
 */
function buildHeaderRows<T>(
  model: ColumnModel<T>,
  columnIds: ReadonlyArray<string>,
  segments?: ReadonlyArray<string>
): Array<HeaderRow> {
  const columns = columnIds.flatMap((id) => model.byId.get(id) ?? [])
  if (!columns.length) return []
  const depth = Math.max(...columns.map((column) => column.groups.length))
  const rows: Array<HeaderRow> = []
  for (let level = 0; level <= depth; level++) {
    const cells: Array<{
      key: string
      kind: HeaderCell["kind"]
      id: string | null
      colSpan: number
      columns: Array<string>
    }> = []
    let previous: string | undefined
    columns.forEach((column, position) => {
      const kind: HeaderCell["kind"] =
        level === depth
          ? "column"
          : level < column.groups.length
            ? "group"
            : "placeholder"
      const id =
        kind === "column"
          ? column.id
          : kind === "group"
            ? column.groups[level]
            : null
      // What the cell belongs to: itself, or for a placeholder the cell
      // above it, so placeholders under different cells stay apart.
      const owner = `${segments?.[position] ?? ""}|${
        kind === "placeholder"
          ? `placeholder:${column.groups[column.groups.length - 1] ?? ""}`
          : `${kind}:${id}`
      }`
      const last = cells[cells.length - 1] as (typeof cells)[number] | undefined
      if (kind !== "column" && last && previous === owner) {
        last.colSpan++
        last.columns.push(column.id)
      } else {
        cells.push({
          key: `${owner}:${position}`,
          kind,
          id,
          colSpan: 1,
          columns: [column.id],
        })
      }
      previous = owner
    })
    rows.push({ key: `header:${level}`, level, cells })
  }
  return rows
}

export {
  buildHeaderRows,
  childrenOf,
  clampColumnWidth,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  createColumns,
  getColumnModel,
  orderSiblings,
  parentOf,
  siblingsInOrder,
}
export type {
  ColumnModel,
  ColumnNode,
  EngineColumn,
  EngineColumnGroup,
  HeaderCell,
  HeaderRow,
}
