"use client"

/**
 * DataTable's features loaded on demand (§7): the code a table needs only
 * once a feature is on, kept out of the table's own modules so an
 * application that does not use it never downloads it.
 *
 * - `loadFeature(name)` imports a feature's module once (later calls share
 *   the promise; a failed load is tried again on the next call).
 * - `usePrefetchFeatures(names)` loads the features a mounted table has on,
 *   in idle time (within two seconds), so they are there before they are
 *   first used; an `eager` feature loads as soon as the table mounts
 *   instead. A part asks for its feature as it is pointed at or focused,
 *   before then (a date filter's button, a column's menu button).
 * - `useFeature(name, on)` is a feature's module for a part to render with:
 *   `undefined` until it has loaded (the part renders without it, with no
 *   change of layout), then the module; and `load`, for a press that needs
 *   it before the idle prefetch has brought it.
 * - Nothing loads on the server or while rendering: only effects and
 *   handlers call these.
 *
 * Adding a feature is one entry of `FEATURES`: its `import()`, and `true`
 * after it to make it eager. To bundle a feature with the table instead
 * (its size is small enough to not matter), import its module statically
 * where it is used.
 */
import * as React from "react"

type Feature<TModule> = {
  load: () => Promise<TModule>
  /** Loaded as soon as a table mounts with the feature on, not in idle time. */
  eager: boolean
}

function feature<TModule extends object>(
  load: () => Promise<TModule>,
  eager = false
): Feature<TModule> {
  return { load, eager }
}

const FEATURES = {
  /** `exportCsv`: loaded when it is first called, never prefetched. */
  csv: feature(() => import("./engine/csv")),
  /** `reorderableColumns`, `reorderableRows`: one chunk for both. */
  dragAndDrop: feature(() => import("./reorder")),
  /** A date filter's calendar: `DateRangePicker`'s (`date-calendar.tsx`). */
  dateInput: feature(() => import("../date-calendar")),
  /** `resizableColumns`: the columns' resizers and their drags. */
  resizer: feature(() => import("../../table-column-resizer")),
  /**
   * `DataTableSearch syntax="query"`: the query language, its colours,
   * suggestions and help, and their strings (`query-translations.ts`).
   */
  query: feature(() => import("./query-search")),
}

type FeatureName = keyof typeof FEATURES

/** The longest an idle prefetch waits for the browser to be idle. */
const IDLE_TIMEOUT = 2000
type FeatureModule<TName extends FeatureName> =
  (typeof FEATURES)[TName] extends Feature<infer TModule> ? TModule : never

const loads = new Map<FeatureName, Promise<object>>()
/** The modules loaded, for a part that mounts after its feature has. */
const loaded = new Map<FeatureName, object>()

function loadFeature<TName extends FeatureName>(
  name: TName
): Promise<FeatureModule<TName>> {
  let load = loads.get(name)
  if (!load) {
    load = FEATURES[name].load()
    loads.set(name, load)
    load
      .then((module) => {
        loaded.set(name, module)
        for (const listener of [...listeners]) listener()
      })
      .catch(() => undefined)
    // An unreachable chunk is not remembered: the next call tries again.
    load.catch(() => loads.delete(name))
  }
  return load as Promise<FeatureModule<TName>>
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

/** Loads the features a mounted table has on: in idle time, eager ones at once. */
function usePrefetchFeatures(names: ReadonlyArray<FeatureName>) {
  // The list is compared by value: the root builds it on every render.
  const key = names.join(" ")
  React.useEffect(() => {
    if (!key) return
    // Asked for already (by another table, another row): nothing to wait for.
    const wanted = (key.split(" ") as Array<FeatureName>).filter(
      (name) => !loads.has(name)
    )
    if (!wanted.length) return
    const prefetch = () => {
      // A prefetch that fails is retried by the load that needs the module.
      for (const name of wanted) loadFeature(name).catch(() => undefined)
    }
    const eager = wanted.filter((name) => FEATURES[name].eager)
    for (const name of eager) loadFeature(name).catch(() => undefined)
    if (eager.length === wanted.length) return
    return whenIdle(prefetch)
  }, [key])
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
function useFeature<TName extends FeatureName>(
  name: TName,
  on: boolean
): { module: FeatureModule<TName> | undefined; load: () => void } {
  const module = React.useSyncExternalStore(
    subscribe,
    () => loaded.get(name) as FeatureModule<TName> | undefined,
    () => undefined
  )
  const load = React.useCallback(() => {
    // A failed load is tried again by the next press.
    loadFeature(name).catch(() => undefined)
  }, [name])
  return { module: on ? module : undefined, load }
}

export { loadFeature, useFeature, usePrefetchFeatures }
export type { FeatureModule, FeatureName }
