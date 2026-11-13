"use client"

/**
 * The strings of `DataTableSearch syntax="query"`: a deferred namespace
 * (`../i18n/translations.ts`), its en-US table loaded with the query field
 * and every other locale's when a `TectonProvider` uses it, so a table
 * without the query field neither bundles nor loads them.
 */
import {
  registerTranslations,
  useTranslations,
  type DeferredSource,
} from "../i18n/translations"
import english from "../i18n/translations/data-table-query/en-US"

const SOURCE: DeferredSource = {
  english,
  loaders: {
    "ar-AE": () => import("../i18n/translations/data-table-query/ar-AE"),
    "bg-BG": () => import("../i18n/translations/data-table-query/bg-BG"),
    "cs-CZ": () => import("../i18n/translations/data-table-query/cs-CZ"),
    "da-DK": () => import("../i18n/translations/data-table-query/da-DK"),
    "de-DE": () => import("../i18n/translations/data-table-query/de-DE"),
    "el-GR": () => import("../i18n/translations/data-table-query/el-GR"),
    "es-ES": () => import("../i18n/translations/data-table-query/es-ES"),
    "et-EE": () => import("../i18n/translations/data-table-query/et-EE"),
    "fi-FI": () => import("../i18n/translations/data-table-query/fi-FI"),
    "fr-FR": () => import("../i18n/translations/data-table-query/fr-FR"),
    "he-IL": () => import("../i18n/translations/data-table-query/he-IL"),
    "hr-HR": () => import("../i18n/translations/data-table-query/hr-HR"),
    "hu-HU": () => import("../i18n/translations/data-table-query/hu-HU"),
    "it-IT": () => import("../i18n/translations/data-table-query/it-IT"),
    "ja-JP": () => import("../i18n/translations/data-table-query/ja-JP"),
    "ko-KR": () => import("../i18n/translations/data-table-query/ko-KR"),
    "lt-LT": () => import("../i18n/translations/data-table-query/lt-LT"),
    "lv-LV": () => import("../i18n/translations/data-table-query/lv-LV"),
    "nb-NO": () => import("../i18n/translations/data-table-query/nb-NO"),
    "nl-NL": () => import("../i18n/translations/data-table-query/nl-NL"),
    "pl-PL": () => import("../i18n/translations/data-table-query/pl-PL"),
    "pt-BR": () => import("../i18n/translations/data-table-query/pt-BR"),
    "pt-PT": () => import("../i18n/translations/data-table-query/pt-PT"),
    "ro-RO": () => import("../i18n/translations/data-table-query/ro-RO"),
    "ru-RU": () => import("../i18n/translations/data-table-query/ru-RU"),
    "sk-SK": () => import("../i18n/translations/data-table-query/sk-SK"),
    "sl-SI": () => import("../i18n/translations/data-table-query/sl-SI"),
    "sr-SP": () => import("../i18n/translations/data-table-query/sr-SP"),
    "sv-SE": () => import("../i18n/translations/data-table-query/sv-SE"),
    "tr-TR": () => import("../i18n/translations/data-table-query/tr-TR"),
    "uk-UA": () => import("../i18n/translations/data-table-query/uk-UA"),
    "zh-CN": () => import("../i18n/translations/data-table-query/zh-CN"),
    "zh-TW": () => import("../i18n/translations/data-table-query/zh-TW"),
  },
}

/** The query field's translator, its namespace registered first. */
function useQueryTranslations() {
  registerTranslations(SOURCE)
  return useTranslations("dataTableQuery")
}

export { useQueryTranslations }
