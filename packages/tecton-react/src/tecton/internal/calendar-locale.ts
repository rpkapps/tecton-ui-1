"use client"

/**
 * Internal to `@tecton/react`: the `Calendar`'s locale for the provider's
 * locale — its month and day names, its first day of the week, its labels
 * for screen readers. en-US is built into the calendar; every other locale
 * is a chunk of its own, loaded on demand the first time a calendar in it
 * renders, then shared by every calendar.
 *
 *   const calendarLocale = useCalendarLocale(useLocale().locale)
 *   if (calendarLocale === null) return <Placeholder />  // still loading
 *   return <Calendar locale={calendarLocale} … />        // undefined: en-US
 */
import * as React from "react"
import type { DayPickerLocale } from "react-day-picker"

/** The calendar's locale for each of Tecton's locales but en-US. */
const LOCALES: Record<string, () => Promise<DayPickerLocale>> = {
  "ar-AE": () => import("react-day-picker/locale/ar").then((m) => m.ar),
  "bg-BG": () => import("react-day-picker/locale/bg").then((m) => m.bg),
  "cs-CZ": () => import("react-day-picker/locale/cs").then((m) => m.cs),
  "da-DK": () => import("react-day-picker/locale/da").then((m) => m.da),
  "de-DE": () => import("react-day-picker/locale/de").then((m) => m.de),
  "el-GR": () => import("react-day-picker/locale/el").then((m) => m.el),
  "es-ES": () => import("react-day-picker/locale/es").then((m) => m.es),
  "et-EE": () => import("react-day-picker/locale/et").then((m) => m.et),
  "fi-FI": () => import("react-day-picker/locale/fi").then((m) => m.fi),
  "fr-FR": () => import("react-day-picker/locale/fr").then((m) => m.fr),
  "he-IL": () => import("react-day-picker/locale/he").then((m) => m.he),
  "hr-HR": () => import("react-day-picker/locale/hr").then((m) => m.hr),
  "hu-HU": () => import("react-day-picker/locale/hu").then((m) => m.hu),
  "it-IT": () => import("react-day-picker/locale/it").then((m) => m.it),
  "ja-JP": () => import("react-day-picker/locale/ja").then((m) => m.ja),
  "ko-KR": () => import("react-day-picker/locale/ko").then((m) => m.ko),
  "lt-LT": () => import("react-day-picker/locale/lt").then((m) => m.lt),
  "lv-LV": () => import("react-day-picker/locale/lv").then((m) => m.lv),
  "nb-NO": () => import("react-day-picker/locale/nb").then((m) => m.nb),
  "nl-NL": () => import("react-day-picker/locale/nl").then((m) => m.nl),
  "pl-PL": () => import("react-day-picker/locale/pl").then((m) => m.pl),
  "pt-BR": () => import("react-day-picker/locale/pt-BR").then((m) => m.ptBR),
  "pt-PT": () => import("react-day-picker/locale/pt").then((m) => m.pt),
  "ro-RO": () => import("react-day-picker/locale/ro").then((m) => m.ro),
  "ru-RU": () => import("react-day-picker/locale/ru").then((m) => m.ru),
  "sk-SK": () => import("react-day-picker/locale/sk").then((m) => m.sk),
  "sl-SI": () => import("react-day-picker/locale/sl").then((m) => m.sl),
  // Tecton's Serbian is written in Latin script.
  "sr-SP": () =>
    import("react-day-picker/locale/sr-Latn").then((m) => m.srLatn),
  "sv-SE": () => import("react-day-picker/locale/sv").then((m) => m.sv),
  "tr-TR": () => import("react-day-picker/locale/tr").then((m) => m.tr),
  "uk-UA": () => import("react-day-picker/locale/uk").then((m) => m.uk),
  "zh-CN": () => import("react-day-picker/locale/zh-CN").then((m) => m.zhCN),
  "zh-TW": () => import("react-day-picker/locale/zh-TW").then((m) => m.zhTW),
}

/** The supported locale for a tag: itself, one of its language, or none (en-US). */
function supportedCalendarLocale(tag: string) {
  if (tag in LOCALES) return tag
  const language = tag.split(/[-_]/)[0].toLowerCase()
  return Object.keys(LOCALES).find((key) => key.split("-")[0] === language)
}

const locales = new Map<string, DayPickerLocale>()
const loading = new Map<string, Promise<void>>()
/** Locales whose chunk could not be loaded: en-US, tried again by the next calendar. */
const failed = new Set<string>()

/** Loads the calendar's locale for `tag` (once); resolves when it is ready. */
function loadCalendarLocale(tag: string): Promise<void> {
  const key = supportedCalendarLocale(tag)
  if (key === undefined || locales.has(key)) return Promise.resolve()
  failed.delete(key)
  let current = loading.get(key)
  if (!current) {
    current = LOCALES[key]().then(
      (locale) => {
        locales.set(key, locale)
      },
      () => {
        loading.delete(key)
        failed.add(key)
      }
    )
    loading.set(key, current)
  }
  return current
}

/**
 * The calendar's locale for `tag`: `null` while it loads, `undefined` for
 * en-US (and for a locale whose chunk could not be loaded).
 */
function useCalendarLocale(tag: string): DayPickerLocale | null | undefined {
  const key = supportedCalendarLocale(tag)
  const [, setLoaded] = React.useState(0)
  React.useEffect(() => {
    if (key === undefined || locales.has(key)) return
    let live = true
    void loadCalendarLocale(key).then(() => {
      if (live) setLoaded((n) => n + 1)
    })
    return () => {
      live = false
    }
  }, [key])
  if (key === undefined) return undefined
  return locales.get(key) ?? (failed.has(key) ? undefined : null)
}

export { loadCalendarLocale, supportedCalendarLocale, useCalendarLocale }
