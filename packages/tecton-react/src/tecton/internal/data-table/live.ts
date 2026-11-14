"use client"

/**
 * Live data (`highlightChanges`), the root's side: which rows a change of
 * `items` added, and, with client pages, the rows kept back while the
 * table is in use. The content's side (`live-rows.tsx`) highlights them,
 * counts those out of view, keeps the row the user is on still, and says
 * what came.
 *
 * Added rows are the ids of the new `items` that the items before had not
 * (`addedIds`: one pass, O(n)), after the table's first rows. Not
 * additions:
 *
 * - the rows of the first render, or of a table that starts empty, its
 *   first rows;
 * - rows that come with a load: while `loading`, or in the change that
 *   ends it, and the batch `onLoadMore` asked for;
 * - in server mode, the rows of a new view: the first `items` after its
 *   search, filters, sorting, grouping, page or page size change;
 * - in a tree, the rows under a row whose children were not loaded.
 *
 * In client mode `items` are compared, not the rows the view shows: a
 * search or filter that shows rows already there adds none.
 *
 * Held rows (`hold`: with client pages, rows that would land on an earlier
 * page while the user works in the rows) are left out of the items the
 * engine gets (a tree's children too) until `release`; their ids stay
 * known, so the change that brings them back adds them again, under
 * `released` (already announced). A held row the application removes from
 * `items` is no longer held.
 */
import * as React from "react"

import { addedIds, type DataTableRowModel } from "./engine/index"

/**
 * `DataTable`'s `highlightChanges`: `true` for added rows, highlighted
 * until seen, then fading over 1,500 ms; or which changes, and for how
 * long.
 */
type DataTableHighlightChanges =
  | boolean
  | {
      /**
       * Rows added after the first render: highlighted where they land
       * until seen, and counted while out of view. On by default.
       */
      added?: boolean
      /** How long a row's highlight fades once seen, in ms: 1,500 by default. */
      duration?: number
    }

/** `highlightChanges`, resolved. */
type LiveOptions = {
  readonly duration: number
}

const DEFAULT_DURATION = 1500

/** `null` when nothing is highlighted. */
function resolveHighlightChanges(
  value: DataTableHighlightChanges | undefined
): LiveOptions | null {
  if (!value) return null
  const options = value === true ? {} : value
  if (options.added === false) return null
  const duration = options.duration
  return {
    duration:
      typeof duration === "number" && Number.isFinite(duration)
        ? Math.max(0, duration)
        : DEFAULT_DURATION,
  }
}

/** The rows one change of `items` added. */
type LiveBatch = {
  /** The added items' ids, depth first in data order. */
  readonly ids: ReadonlyArray<string>
  /** Those that were held: announced when they came, not again. */
  readonly released: ReadonlySet<string>
}

/** What the content reads of live data (the store's `live`). */
type LiveState = {
  readonly duration: number
  /** The rows the last change added; a new object for each change. */
  readonly batch: LiveBatch | null
  /** Client pages: the rows kept back while the table is in use, not shown yet. */
  readonly held: ReadonlySet<string>
}

/** What the actions call: hold rows back (client pages), and show them. */
type LiveControl = {
  hold: (ids: ReadonlyArray<string>) => void
  release: () => void
  /** `onLoadMore` was called: the rows it brings are no additions. */
  loadMoreAsked: () => void
}

const NO_IDS: ReadonlySet<string> = new Set()
const SAME = { batch: null, changed: false }
const CHANGED = { batch: null, changed: true }

function defaultItemToId(item: unknown) {
  return String((item as { id?: unknown } | null)?.id)
}

/**
 * The items and children the engine gets: `items` but the held rows. With
 * none held, the props themselves. `present` is the held ids still in
 * `items`.
 */
function withoutHeld<T>(
  items: ReadonlyArray<T>,
  held: ReadonlySet<string>,
  itemToId: ((item: T) => string) | undefined,
  itemToChildren: ((item: T) => ReadonlyArray<T> | undefined) | undefined
) {
  if (held.size === 0) return { items, itemToChildren, present: held }
  const idOf = itemToId ?? defaultItemToId
  const present = new Set<string>()
  const keep = (item: T) => {
    const id = idOf(item)
    if (!held.has(id)) return true
    present.add(id)
    return false
  }
  // Every level, for the held ids still there: the engine reads a tree's
  // children again, through the same filter.
  const visit = (item: T): void => {
    for (const child of itemToChildren?.(item) ?? [])
      if (keep(child)) visit(child)
  }
  // A new array: the engine builds its rows again for each held set.
  const kept: Array<T> = []
  for (const item of items)
    if (keep(item)) {
      kept.push(item)
      if (itemToChildren) visit(item)
    }
  return {
    items: kept,
    itemToChildren:
      itemToChildren &&
      ((item: T) => {
        const children = itemToChildren(item)
        return children?.some((child) => held.has(idOf(child)))
          ? children.filter((child) => !held.has(idOf(child)))
          : children
      }),
    present,
  }
}

/**
 * The root's held rows: the items and children for the engine (`items`
 * but the rows held), and the set held.
 */
function useHeldItems<T>({
  on,
  items,
  itemToId,
  itemToChildren,
}: {
  on: boolean
  items: ReadonlyArray<T>
  itemToId: ((item: T) => string) | undefined
  itemToChildren: ((item: T) => ReadonlyArray<T> | undefined) | undefined
}) {
  const [held, setHeld] = React.useState<ReadonlySet<string>>(NO_IDS)
  const holding = on ? held : NO_IDS
  const result = React.useMemo(
    () => withoutHeld(items, holding, itemToId, itemToChildren),
    [items, holding, itemToId, itemToChildren]
  )
  // Held rows the application removed: no longer held. Highlighting
  // turned off: none held.
  if (held !== NO_IDS && (!on || result.present.size !== held.size))
    setHeld(on && result.present.size > 0 ? result.present : NO_IDS)
  return { ...result, held: holding, setHeld }
}

/** The last committed render, which a change of items is compared with. */
type Baseline<T> = {
  model: DataTableRowModel<T>
  /** Server mode: the view the items are of. */
  viewKey: string
  loading: boolean
  /** `onLoadMore` was called, and its rows have not come. */
  loadMore: boolean
  /** The table has had rows: the next ones may be additions. */
  seeded: boolean
}

/**
 * Live data's state for the store, and its control. `model` is the
 * engine's, of the items but the held rows; `viewKey` names the server
 * view (empty in client mode).
 */
function useLiveFeed<T>({
  options,
  model,
  server,
  viewKey,
  loading,
  held,
  setHeld,
}: {
  options: LiveOptions | null
  model: DataTableRowModel<T>
  server: boolean
  viewKey: string
  loading: boolean
  held: ReadonlySet<string>
  setHeld: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>
}): { live: LiveState | null; control: LiveControl } {
  const baseline = React.useRef<Baseline<T> | null>(null)
  /** The rows the last `release` brought back, until they render. */
  const released = React.useRef<ReadonlySet<string>>(NO_IDS)
  const on = options !== null

  // Against the last committed render, for new items: the rows they add,
  // and whether they are other rows at all (new items with the same ids,
  // an array made anew on each render, are no change: a server view's
  // rows are still to come).
  const { batch, changed } = React.useMemo((): {
    batch: LiveBatch | null
    changed: boolean
  } => {
    const before = baseline.current
    if (!on) return SAME
    if (!before) return CHANGED
    if (before.model.ids === model.ids) return SAME
    const added = addedIds(before.model, model)
    if (added.length === 0 && model.ids.length === before.model.ids.length)
      return SAME
    const additions =
      added.length > 0 &&
      before.seeded &&
      !before.loading &&
      !loading &&
      !before.loadMore &&
      !(server && before.viewKey !== viewKey)
    return {
      batch: additions ? { ids: added, released: released.current } : null,
      changed: true,
    }
  }, [on, model, server, viewKey, loading])

  React.useLayoutEffect(() => {
    const before = baseline.current
    if (!on) {
      baseline.current = null
      return
    }
    // Other rows than the last commit's: a render of the same model (a
    // new selection) keeps what the rows were compared with.
    const rows = changed && before?.model !== model
    if (rows) released.current = NO_IDS
    baseline.current = {
      model,
      viewKey: rows || !before ? viewKey : before.viewKey,
      loading,
      loadMore:
        !!before && !rows && !(before.loading && !loading) && before.loadMore,
      seeded: (before?.seeded ?? false) || model.itemCount > 0,
    }
  })

  const [control] = React.useState<LiveControl>(() => ({
    hold: (add) => {
      if (add.length === 0) return
      setHeld((current) => {
        const next = new Set(current)
        for (const id of add) next.add(id)
        return next.size === current.size ? current : next
      })
    },
    release: () =>
      setHeld((current) => {
        if (current.size === 0) return current
        released.current = current
        return NO_IDS
      }),
    loadMoreAsked: () => {
      if (baseline.current) baseline.current.loadMore = true
    },
  }))

  const duration = options?.duration ?? 0
  const live = React.useMemo<LiveState | null>(
    () => (on ? { duration, batch, held } : null),
    [on, duration, batch, held]
  )
  return { live, control }
}

export { resolveHighlightChanges, useHeldItems, useLiveFeed }
export type {
  DataTableHighlightChanges,
  LiveBatch,
  LiveControl,
  LiveOptions,
  LiveState,
}
