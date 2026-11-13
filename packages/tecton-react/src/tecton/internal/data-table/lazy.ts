"use client"

/**
 * DataTable's features loaded on demand (§7): the code a table needs only
 * once a feature is on, kept out of the table's own modules so an
 * application that does not use it never downloads it.
 *
 * - `loadFeature(feature)` imports a feature's module once (later calls
 *   share the promise; a failed load is tried again on the next call).
 * - `usePrefetchFeatures(features)` loads the features a mounted table has
 *   on, in idle time (within two seconds), so they are there before they
 *   are first used; an `eager` feature loads as soon as the table mounts
 *   instead. A part asks for its feature as it is pointed at or focused,
 *   before then (a date filter's button, a column's menu button).
 * - `useFeature(feature, on)` is a feature's module for a part to render
 *   with: `undefined` until it has loaded (the part renders without it,
 *   with no change of layout), then the module; and `load`, for a press
 *   that needs it before the idle prefetch has brought it.
 * - Nothing loads on the server or while rendering: only effects and
 *   handlers call these.
 *
 * Adding a feature is one `feature(() => import(…))`, with `true` after it
 * to make it eager: here for the features of the table's own modules,
 * else in the module of the part that uses it (`QUERY` in `search.tsx`,
 * `DATE_INPUT` in `date-input.ts`, `CSV` in `more-actions.ts`), so that an
 * application without that part has no chunk for it. To bundle a feature
 * with the table instead (its size is small enough to not matter), import
 * its module statically where it is used.
 */
import * as React from "react"

type Feature<TModule extends object> = {
  load: () => Promise<TModule>
  /** Loaded as soon as a table mounts with the feature on, not in idle time. */
  eager: boolean
}

type AnyFeature = Feature<object>

function feature<TModule extends object>(
  load: () => Promise<TModule>,
  eager = false
): Feature<TModule> {
  return { load, eager }
}

/** `reorderableColumns`, `reorderableRows`: one chunk for both. */
const DRAG_AND_DROP = feature(() => import("./reorder"))
/** `resizableColumns`: the columns' resizers and their drags. */
const RESIZER = feature(() => import("../../table-column-resizer"))
/**
 * `highlightChanges`: what added rows look like and do in the content
 * (`live-rows.tsx`), loaded as soon as the table mounts, before rows come.
 */
const LIVE = feature(() => import("./live-rows"), true)

/** The longest an idle prefetch waits for the browser to be idle. */
const IDLE_TIMEOUT = 2000

const loads = new Map<AnyFeature, Promise<object>>()
/** The modules loaded, for a part that mounts after its feature has. */
const loaded = new Map<AnyFeature, object>()

function loadFeature<TModule extends object>(
  feature: Feature<TModule>
): Promise<TModule> {
  let load = loads.get(feature)
  if (!load) {
    load = feature.load()
    loads.set(feature, load)
    load
      .then((module) => {
        loaded.set(feature, module)
        for (const listener of [...listeners]) listener()
      })
      .catch(() => undefined)
    // An unreachable chunk is not remembered: the next call tries again.
    load.catch(() => loads.delete(feature))
  }
  return load as Promise<TModule>
}

/**
 * Runs `task` when the browser is idle, or after `IDLE_TIMEOUT` on a page
 * that never is (animations, many tables mounting); returns its cancel.
 */
function whenIdle(task: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(task, { timeout: IDLE_TIMEOUT })
    return () => cancelIdleCallback(handle)
  }
  // Without idle callbacks (Safari before 18), soon after the first paint.
  const handle = setTimeout(task, 200)
  return () => clearTimeout(handle)
}

/**
 * Loads the features a mounted table has on: in idle time, eager ones at
 * once. `features` stays the same array while they are the same (one
 * constant for each set), as the effect compares it.
 */
function usePrefetchFeatures(features: ReadonlyArray<AnyFeature>) {
  React.useEffect(() => {
    // Asked for already (by another table, another row): nothing to wait for.
    const wanted = features.filter((feature) => !loads.has(feature))
    if (!wanted.length) return
    const prefetch = () => {
      // A prefetch that fails is retried by the load that needs the module.
      for (const feature of wanted) loadFeature(feature).catch(() => undefined)
    }
    const eager = wanted.filter((feature) => feature.eager)
    for (const feature of eager) loadFeature(feature).catch(() => undefined)
    if (eager.length === wanted.length) return
    return whenIdle(prefetch)
  }, [features])
}

/** Told when a module has loaded, for `useFeature`. */
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * A feature's module while `on`: `undefined` until it has loaded (a
 * prefetch in idle time, or `load`), then the module. Never on the server
 * nor while hydrating, so the first render is the server's even when
 * another table has loaded the feature already. `load` asks for it now (a
 * press that needs it).
 */
function useFeature<TModule extends object>(
  feature: Feature<TModule>,
  on: boolean
): { module: TModule | undefined; load: () => void } {
  const module = React.useSyncExternalStore(
    subscribe,
    () => loaded.get(feature) as TModule | undefined,
    () => undefined
  )
  const load = React.useCallback(() => {
    // A failed load is tried again by the next press.
    loadFeature(feature).catch(() => undefined)
  }, [feature])
  return { module: on ? module : undefined, load }
}

export {
  DRAG_AND_DROP,
  feature,
  LIVE,
  loadFeature,
  RESIZER,
  useFeature,
  usePrefetchFeatures,
}
export type { AnyFeature, Feature }
