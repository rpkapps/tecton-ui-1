"use client"

/**
 * DataTable's features loaded on demand (§7): the code a table needs only
 * once a feature is on, kept out of the table's own modules so an
 * application that does not use it never downloads it.
 *
 * - `loadFeature(name)` imports a feature's module once (later calls share
 *   the promise; a failed load is tried again on the next call).
 * - `usePrefetchFeatures(names)` loads the features a mounted table has on,
 *   in idle time, so they are there before they are first used; an `eager`
 *   feature loads as soon as the table mounts instead.
 * - Nothing loads on the server or while rendering: only effects and
 *   handlers call these.
 *
 * Adding a feature is one entry of `FEATURES`: its `import()`, and `true`
 * after it to make it eager. The entries a later phase fills in load nothing yet. To
 * bundle a feature with the table instead (its size is small enough to not
 * matter), import its module statically where it is used.
 */
import * as React from "react"

/** The module of a feature whose code is still to come. */
type PendingFeature = Readonly<Record<never, never>>

const PENDING: PendingFeature = Object.freeze({})
const pending = () => Promise.resolve(PENDING)

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
  /** `editable`: editors, validation, saves. */
  editing: feature(pending),
  /** `cellSelectionMode`: ranges, copy and paste, fill down. */
  cellSelection: feature(pending),
  /** `reorderableColumns`, `reorderableRows`. */
  dragAndDrop: feature(pending),
  /** The calendar of a date filter or editor. */
  dateInput: feature(pending),
}

type FeatureName = keyof typeof FEATURES
type FeatureModule<TName extends FeatureName> =
  (typeof FEATURES)[TName] extends Feature<infer TModule> ? TModule : never

const loads = new Map<FeatureName, Promise<object>>()

function loadFeature<TName extends FeatureName>(
  name: TName
): Promise<FeatureModule<TName>> {
  let load = loads.get(name)
  if (!load) {
    load = FEATURES[name].load()
    loads.set(name, load)
    // An unreachable chunk is not remembered: the next call tries again.
    load.catch(() => loads.delete(name))
  }
  return load as Promise<FeatureModule<TName>>
}

/** Runs `task` when the browser is idle; returns its cancel. */
function whenIdle(task: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(task)
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
    const wanted = key.split(" ") as Array<FeatureName>
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

export { loadFeature, usePrefetchFeatures }
export type { FeatureModule, FeatureName }
