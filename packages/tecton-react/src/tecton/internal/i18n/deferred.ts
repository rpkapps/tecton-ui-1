"use client"

/**
 * Internal to `@tecton/react`: the translations of a deferred namespace
 * (`translations.ts`), for a feature loaded on demand. Imported by that
 * feature alone, so neither this module nor the namespace's strings reach
 * a bundle that does not load the feature.
 *
 *   const t = useDeferredTranslations("dataTableQuery", {
 *     english,                                   // its en-US table
 *     loaders: { "de-DE": () => import("./de-DE"), ... },
 *   })
 *
 * Renders en-US first (on the server too) and again once the provider's
 * locale has loaded; a locale without a loader stays on en-US, and a key a
 * locale lacks falls back to en-US.
 */
import * as React from "react"

import { useLocale } from "@tecton/react/provider"

import {
  createTranslator,
  resolveLocale,
  type DeferredNamespace,
  type LocaleLoader,
  type LocaleTranslations,
  type Translations,
  type Translator,
} from "./translations"

/** A deferred namespace's tables: en-US, and a loader per other locale. */
type DeferredSource<TNamespace extends DeferredNamespace> = {
  readonly english: { readonly [N in TNamespace]: Translations[N] }
  readonly loaders: Readonly<Record<string, LocaleLoader>>
}

/** The locales loaded (`namespace|tag`), and loading. */
const loaded = new Map<string, LocaleTranslations>()
const loading = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Loads `namespace`'s translations for `tag` once; its users re-render. */
function loadDeferred<TNamespace extends DeferredNamespace>(
  namespace: TNamespace,
  source: DeferredSource<TNamespace>,
  tag: string
): Promise<void> {
  const key = `${namespace}|${tag}`
  const loader = source.loaders[tag] as LocaleLoader | undefined
  if (!loader || loaded.has(key) || loading.has(key)) return Promise.resolve()
  loading.add(key)
  return loader().then(
    (module) => {
      loaded.set(key, module.default)
      for (const listener of [...listeners]) listener()
    },
    () => {
      // Unreachable chunk: the namespace stays on en-US.
      loading.delete(key)
    }
  )
}

/** The translator for a deferred `namespace` in the provider's locale. */
function useDeferredTranslations<TNamespace extends DeferredNamespace>(
  namespace: TNamespace,
  source: DeferredSource<TNamespace>
): Translator<TNamespace> {
  const tag = resolveLocale(useLocale().locale)
  const key = `${namespace}|${tag}`
  const table = React.useSyncExternalStore(
    subscribe,
    () => loaded.get(key),
    () => undefined
  )
  React.useEffect(() => {
    if (tag !== "en-US") void loadDeferred(namespace, source, tag)
  }, [namespace, source, tag])
  const english = source.english[namespace]
  return React.useMemo(
    () => createTranslator(namespace, tag, table, english),
    [namespace, tag, table, english]
  )
}

export { loadDeferred, useDeferredTranslations }
export type { DeferredSource }
