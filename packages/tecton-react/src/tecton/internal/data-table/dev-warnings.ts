"use client"

/**
 * DataTable's development warnings (`warnings.ts`): one effect for the
 * root's, one for the content's. Each is called only where
 * `process.env.NODE_ENV !== "production"`, written out at its call site in
 * a `try` (see `warnings.ts`):
 *
 *     try {
 *       if (process.env.NODE_ENV !== "production") useRootWarnings(…)
 *     } catch {}
 *
 * so a production build keeps neither the effect nor its messages. The
 * condition is the same on every render (the build's), so the hooks are
 * called in the same order on every render.
 */
import * as React from "react"

import {
  getColumnModel,
  hidesEveryColumn,
  type DataTableColumns,
  type EngineColumn,
} from "./engine/index"
import type { Warn } from "./warnings"

/** The root's: the items' ids, the columns, and features that cannot work together. */
function useRootWarnings<T>(
  warn: Warn,
  {
    columns,
    idIssues,
    hidden,
    groupable,
    reorderableRows,
    tree,
    hasMore,
    pagination,
    server,
    rowCount,
  }: {
    columns: DataTableColumns<T>
    idIssues: { missingIds: number; duplicateIds: ReadonlyArray<string> }
    /** The view's hidden columns, as given. */
    hidden: ReadonlyArray<string> | undefined
    groupable: boolean
    reorderableRows: boolean
    tree: boolean
    hasMore: boolean
    pagination: boolean
    server: boolean
    rowCount: number | undefined
  }
) {
  const previousColumns = React.useRef(columns)
  React.useEffect(() => {
    // New columns re-render every row: said when they are new but the same.
    const previous = previousColumns.current
    previousColumns.current = columns
    const ids = (handle: DataTableColumns<T>) => {
      const model = getColumnModel(handle)
      return [
        ...model.leaves.map((leaf) => leaf.id),
        ...model.groups.keys(),
      ].join(" ")
    }
    if (previous !== columns && ids(previous) === ids(columns))
      warn(
        "inline-columns",
        "DataTable: `columns` is a new object on every render, with the same columns, so every row renders again on every change (a selection, a page). Make the columns once with `createColumns` at module level, or in a `React.useMemo`."
      )
    const { missingIds, duplicateIds } = idIssues
    if (missingIds > 0)
      warn(
        "missing-ids",
        `DataTable: ${missingIds} ${missingIds === 1 ? "item has" : "items have"} no id. Rows are selected, opened and kept across sorting by id: give each item an \`id\`, or pass \`itemToId\`.`
      )
    if (duplicateIds.length > 0)
      warn(
        "duplicate-ids",
        `DataTable: more than one item has the id ${duplicateIds
          .slice(0, 5)
          .map((id) => `"${id}"`)
          .join(
            ", "
          )}${duplicateIds.length > 5 ? ` and ${duplicateIds.length - 5} more` : ""}. Rows are selected, opened and kept across sorting by id: make each item's id unique.`
      )
    if (hidesEveryColumn(columns, hidden))
      warn(
        "hides-every-column",
        "DataTable: the view hides every column; the first column in its order stays shown."
      )
    if (groupable && tree)
      warn(
        "groupable-tree",
        "DataTable: `groupable` is off in a tree (`itemToChildren`): a tree's rows nest by their items, so they are not grouped."
      )
    if (reorderableRows && tree)
      warn(
        "reorderable-rows-tree",
        "DataTable: `reorderableRows` is off in a tree (`itemToChildren`): rows are reordered in a flat list only."
      )
    if (hasMore && pagination)
      warn(
        "has-more-pagination",
        "DataTable: `hasMore` is off with `pagination`: pages are loaded a page at a time (`onPageChange`), not as the user scrolls."
      )
    if (server && pagination && rowCount === undefined)
      warn(
        "server-row-count",
        "DataTable: in server mode, pages are counted from `rowCount`: pass the number of rows the view matches, or the table has a single page."
      )
  }, [
    warn,
    columns,
    idIssues,
    hidden,
    groupable,
    reorderableRows,
    tree,
    hasMore,
    pagination,
    server,
    rowCount,
  ])
}

/** The content's: features of its own that are off with the table's. */
function useContentWarnings(
  warn: Warn,
  {
    detail,
    tree,
    virtualized,
    columns,
  }: {
    /** `renderDetail` is given. */
    detail: boolean
    tree: boolean
    virtualized: boolean
    columns: ReadonlyArray<EngineColumn<unknown>>
  }
) {
  React.useEffect(() => {
    if (detail && tree)
      warn(
        "detail-tree",
        "DataTableContent: `renderDetail` is off in a tree (`itemToChildren`): a tree's rows open to show their children."
      )
    if (!virtualized) return
    const wrapped = columns.filter((column) => column.definition.wrap)
    if (wrapped.length > 0)
      warn(
        "wrap-virtualized",
        `DataTableContent: \`wrap\` is off for ${wrapped
          .map((column) => `"${column.id}"`)
          .join(", ")} in a virtualized table, whose rows are one height.`
      )
  }, [warn, detail, tree, virtualized, columns])
}

export { useContentWarnings, useRootWarnings }
