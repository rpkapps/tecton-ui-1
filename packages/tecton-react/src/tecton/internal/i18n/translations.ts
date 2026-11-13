"use client"

/**
 * Internal to `@tecton/react`: translated strings for every Tecton component,
 * in the locale of the `TectonProvider` in scope.
 *
 *   const t = useTranslations("chip")
 *   t("removeButtonLabel")                  // "Remove"
 *   t("dropOnItem", { itemText: "Wells" })  // checked: the placeholders are typed
 *
 * en-US (`translations/en-US.ts`) ships with the components and defines the
 * types: its namespaces, keys and `{placeholders}`. Every other locale is a
 * module of its own (`translations/<locale>.ts`, written with
 * `defineTranslations`), loaded only when a provider asks for it; until it
 * arrives, and for any key it lacks, the en-US string is used.
 *
 * To translate a new component: add a namespace to `translations/en-US.ts`,
 * call `useTranslations("<namespace>")`, and add the namespace to the other
 * locales as translations come.
 *
 * A feature loaded on demand keeps its strings out of the bundle: its
 * namespace is deferred, a folder of its own (`translations/<namespace>/`,
 * en-US and every other locale, written with `defineTranslations` as
 * above), typed from its `en-US.ts` here (`DeferredTranslations`). The
 * feature's module registers it (`registerTranslations`: its en-US table,
 * imported with the feature, and a loader per locale) before it calls
 * `useTranslations` with it; a locale's strings then load with the
 * feature, not with the locale's main table.
 */
import * as React from "react"

import { useLocale } from "@tecton/react/provider"

import type dataTableQuery from "./translations/data-table-query/en-US"
import enUS from "./translations/en-US"

type PluralCategory = Intl.LDMLPluralRule | "=0"

/** A string chosen by count: `Intl.PluralRules` categories, `=0` for none. */
type PluralTranslation = { readonly other: string } & {
  readonly [C in PluralCategory]?: string
}

type Translation = string | PluralTranslation

/** The shape every translation table has: namespace → key → string. */
type TranslationTable = {
  readonly [namespace: string]: { readonly [key: string]: Translation }
}

/** The deferred namespaces (see the module comment), by their en-US tables. */
type DeferredTranslations = typeof dataTableQuery

type Translations = typeof enUS & DeferredTranslations
type Namespace = keyof Translations
type DeferredNamespace = keyof DeferredTranslations
type TranslationKey<TNamespace extends Namespace> =
  keyof Translations[TNamespace] & string

/** The `{placeholders}` of a string, as a union of their names. */
type Placeholders<TText> = TText extends `${string}{${infer Name}}${infer Rest}`
  ? Name | Placeholders<Rest>
  : never

/** The placeholders of a translation; a plural one also takes `count`. */
type TranslationParams<TTranslation> = TTranslation extends string
  ? Placeholders<TTranslation>
  : TTranslation extends Record<string, string>
    ? Placeholders<TTranslation[keyof TTranslation]> | "count"
    : never

type TranslationValues<TNames extends string> = {
  [K in TNames]: K extends "count" ? number : string | number
}

/** The arguments after the key: the placeholder values, when there are any. */
type ValuesArgument<TTranslation> = [TranslationParams<TTranslation>] extends [
  never,
]
  ? []
  : [values: TranslationValues<TranslationParams<TTranslation>>]

/** Translates a key of one namespace, with its placeholder values. */
type Translator<TNamespace extends Namespace> = <
  TKey extends TranslationKey<TNamespace>,
>(
  key: TKey,
  ...values: ValuesArgument<Translations[TNamespace][TKey]>
) => string

/** What a locale may hold: any of the en-US namespaces and keys. */
type LocaleTranslations = {
  readonly [N in Namespace]?: {
    readonly [K in TranslationKey<N>]?: Translation
  }
}

type Same<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false

/**
 * `table` as written when it is a valid translation of en-US; otherwise a
 * type the offending entry is not assignable to: an unknown namespace or
 * key, a string whose placeholders differ from the English one's, or a
 * plural map in place of a plain string (or the reverse).
 */
type ValidTranslations<TTable> = {
  [N in keyof TTable]: N extends Namespace
    ? {
        [K in keyof TTable[N]]: K extends TranslationKey<N>
          ? (
              TTable[N][K] extends string
                ? Translations[N][K] extends string
                  ? true
                  : false
                : Translations[N][K] extends string
                  ? false
                  : true
            ) extends true
            ? Same<
                TranslationParams<TTable[N][K]>,
                TranslationParams<Translations[N][K]>
              > extends true
              ? TTable[N][K]
              : { error: "the placeholders differ from en-US" }
            : { error: "a plural map where en-US has a string, or the reverse" }
          : { error: "en-US has no such key" }
      }
    : { error: "en-US has no such namespace" }
}

/**
 * Declares the translations of one locale, checked against en-US. Keys may
 * be left out: they fall back to en-US.
 */
function defineTranslations<const TTable extends LocaleTranslations>(
  table: TTable & ValidTranslations<TTable>
): TTable {
  return table
}

type LocaleLoader = () => Promise<{ default: LocaleTranslations }>

/** Every locale besides en-US, loaded on first use. */
const LOADERS: Record<string, LocaleLoader> = {
  "ar-AE": () => import("./translations/ar-AE"),
  "bg-BG": () => import("./translations/bg-BG"),
  "cs-CZ": () => import("./translations/cs-CZ"),
  "da-DK": () => import("./translations/da-DK"),
  "de-DE": () => import("./translations/de-DE"),
  "el-GR": () => import("./translations/el-GR"),
  "es-ES": () => import("./translations/es-ES"),
  "et-EE": () => import("./translations/et-EE"),
  "fi-FI": () => import("./translations/fi-FI"),
  "fr-FR": () => import("./translations/fr-FR"),
  "he-IL": () => import("./translations/he-IL"),
  "hr-HR": () => import("./translations/hr-HR"),
  "hu-HU": () => import("./translations/hu-HU"),
  "it-IT": () => import("./translations/it-IT"),
  "ja-JP": () => import("./translations/ja-JP"),
  "ko-KR": () => import("./translations/ko-KR"),
  "lt-LT": () => import("./translations/lt-LT"),
  "lv-LV": () => import("./translations/lv-LV"),
  "nb-NO": () => import("./translations/nb-NO"),
  "nl-NL": () => import("./translations/nl-NL"),
  "pl-PL": () => import("./translations/pl-PL"),
  "pt-BR": () => import("./translations/pt-BR"),
  "pt-PT": () => import("./translations/pt-PT"),
  "ro-RO": () => import("./translations/ro-RO"),
  "ru-RU": () => import("./translations/ru-RU"),
  "sk-SK": () => import("./translations/sk-SK"),
  "sl-SI": () => import("./translations/sl-SI"),
  "sr-SP": () => import("./translations/sr-SP"),
  "sv-SE": () => import("./translations/sv-SE"),
  "tr-TR": () => import("./translations/tr-TR"),
  "uk-UA": () => import("./translations/uk-UA"),
  "zh-CN": () => import("./translations/zh-CN"),
  "zh-TW": () => import("./translations/zh-TW"),
}

/** The supported locale for `locale`: itself, one of its language, or en-US. */
function resolveLocale(locale: string): string {
  if (locale === "en-US" || locale in LOADERS) return locale
  const language = locale.split(/[-_]/)[0].toLowerCase()
  if (language === "en") return "en-US"
  return (
    Object.keys(LOADERS).find((tag) => tag.split("-")[0] === language) ??
    "en-US"
  )
}

const loaded = new Map<string, LocaleTranslations>()
const loading = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Loads a locale's translations once; its users re-render when they come. */
function loadTranslations(tag: string): Promise<void> {
  const loader = LOADERS[tag] as
    (() => Promise<{ default: LocaleTranslations }>) | undefined
  if (!loader || loaded.has(tag) || loading.has(tag)) return Promise.resolve()
  loading.add(tag)
  return loader().then(
    (module) => {
      loaded.set(tag, module.default)
      for (const listener of [...listeners]) listener()
    },
    () => {
      // Unreachable chunk: the locale stays on en-US.
      loading.delete(tag)
    }
  )
}

/** A deferred namespace's tables: en-US, and a loader per other locale. */
type DeferredSource = {
  readonly english: { readonly [N in DeferredNamespace]?: Translations[N] }
  readonly loaders: Readonly<Record<string, LocaleLoader>>
}

/** The deferred namespaces registered, by namespace. */
const deferred = new Map<string, DeferredSource>()
/** A deferred namespace's locales loaded (`namespace|tag`), and loading. */
const loadedDeferred = new Map<string, LocaleTranslations>()
const loadingDeferred = new Set<string>()

/**
 * Registers the deferred namespaces of `source.english` (once; later calls
 * change nothing), for `useTranslations` to use them.
 */
function registerTranslations(source: DeferredSource) {
  for (const namespace of Object.keys(source.english))
    if (!deferred.has(namespace)) deferred.set(namespace, source)
}

/** Loads a deferred namespace's translations for `tag` once. */
function loadDeferred(namespace: string, tag: string): Promise<void> {
  const key = `${namespace}|${tag}`
  const loader = deferred.get(namespace)?.loaders[tag]
  if (!loader || loadedDeferred.has(key) || loadingDeferred.has(key))
    return Promise.resolve()
  loadingDeferred.add(key)
  return loader().then(
    (module) => {
      loadedDeferred.set(key, module.default)
      for (const listener of [...listeners]) listener()
    },
    () => {
      // Unreachable chunk: the namespace stays on en-US.
      loadingDeferred.delete(key)
    }
  )
}

/** The en-US strings of `namespace`, bundled or registered. */
function englishOf(namespace: string): Record<string, Translation> {
  const bundled = (enUS as TranslationTable)[namespace] as
    Record<string, Translation> | undefined
  if (bundled) return bundled
  const source = deferred.get(namespace)?.english as
    Record<string, Record<string, Translation>> | undefined
  return source?.[namespace] ?? {}
}

/** A translator for `namespace` from `table`, falling back to en-US per key. */
function createTranslator<TNamespace extends Namespace>(
  namespace: TNamespace,
  locale: string,
  table?: LocaleTranslations
): Translator<TNamespace> {
  const own = table?.[namespace] as
    Partial<Record<string, Translation>> | undefined
  const english = englishOf(namespace)
  let plurals: Intl.PluralRules | null = null
  return (key: string, values: Record<string, string | number> = {}) => {
    const translation = own?.[key] ?? english[key] ?? key
    let text: string
    if (typeof translation === "string") text = translation
    else {
      const count = Number(values.count) || 0
      plurals ??= new Intl.PluralRules(own?.[key] ? locale : "en-US")
      text =
        (count === 0 ? translation["=0"] : undefined) ??
        translation[plurals.select(count)] ??
        translation.other
    }
    return text.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match
    )
  }
}

/**
 * The translator for `namespace` in the locale of the `TectonProvider` in
 * scope. Renders en-US first (on the server too, so hydration matches) and
 * again once another locale's translations have loaded.
 */
function useTranslations<TNamespace extends Namespace>(
  namespace: TNamespace
): Translator<TNamespace> {
  const tag = resolveLocale(useLocale().locale)
  // A deferred namespace's own tables, once registered by its feature.
  const own = deferred.has(namespace)
  const table = React.useSyncExternalStore(
    subscribe,
    () => (own ? loadedDeferred.get(`${namespace}|${tag}`) : loaded.get(tag)),
    () => undefined
  )
  React.useEffect(() => {
    if (tag === "en-US") return
    if (own) void loadDeferred(namespace, tag)
    else void loadTranslations(tag)
  }, [tag, own, namespace])
  return React.useMemo(
    () => createTranslator(namespace, tag, table),
    [namespace, tag, table]
  )
}

export {
  createTranslator,
  defineTranslations,
  loadDeferred,
  loadTranslations,
  registerTranslations,
  resolveLocale,
  useTranslations,
}
export type {
  DeferredNamespace,
  DeferredSource,
  LocaleLoader,
  LocaleTranslations,
  Namespace,
  PluralTranslation,
  Translation,
  TranslationKey,
  TranslationParams,
  TranslationTable,
  Translations,
  Translator,
}
