"use client"

/**
 * The `dateInput` feature of `lazy.ts`: a date filter's calendar and a
 * date editor's, loaded on demand with the calendar's code. The
 * calendar is in the provider's locale: its month and day names, its first
 * day of the week, its labels for screen readers, each locale a chunk of
 * its own loaded with it (en-US is built in). It shows `fallback` while a
 * locale loads, and stays in en-US if one cannot. Month and year are
 * dropdowns as well as arrows: dates decades back (a well's spud date) are
 * a few presses away, from a hundred years back to ten ahead.
 */
import * as React from "react"
import type { DateRange, DayPickerLocale } from "react-day-picker"

import { Calendar } from "@tecton/react/components/calendar"

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
function supported(tag: string) {
  if (tag in LOCALES) return tag
  const language = tag.split(/[-_]/)[0].toLowerCase()
  return Object.keys(LOCALES).find((key) => key.split("-")[0] === language)
}

const locales = new Map<string, DayPickerLocale>()
const loading = new Map<string, Promise<void>>()
/** Locales whose chunk could not be loaded: en-US, tried again by the next calendar. */
const failed = new Set<string>()

/** The calendar's locale for `tag`; `null` while it loads; `undefined` for en-US. */
function useCalendarLocale(tag: string) {
  const key = supported(tag)
  const [, setLoaded] = React.useState(0)
  React.useEffect(() => {
    if (key === undefined || locales.has(key)) return
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
    let live = true
    current.then(() => {
      if (live) setLoaded((n) => n + 1)
    })
    return () => {
      live = false
    }
  }, [key])
  if (key === undefined) return undefined
  return locales.get(key) ?? (failed.has(key) ? undefined : null)
}

/** A range of days picked on a month calendar, for a date filter. */
function DateRangeFilter({
  value,
  onValueChange,
  locale,
  dir,
  fallback,
}: {
  value: { from?: Date; to?: Date } | undefined
  onValueChange: (range: DateRange | undefined) => void
  /** The provider's locale. */
  locale: string
  dir: "ltr" | "rtl"
  /** Shown while the calendar's locale loads. */
  fallback: React.ReactNode
}) {
  const calendarLocale = useCalendarLocale(locale)
  const [month, setMonth] = React.useState(
    () => value?.from ?? value?.to ?? new Date()
  )
  const [endMonth] = React.useState(
    () => new Date(new Date().getFullYear() + 10, 11)
  )
  if (calendarLocale === null) return fallback
  return (
    <Calendar
      mode="range"
      selected={value?.from ? { from: value.from, to: value.to } : undefined}
      onSelect={onValueChange}
      month={month}
      onMonthChange={setMonth}
      captionLayout="dropdown"
      endMonth={endMonth}
      locale={calendarLocale}
      dir={dir}
      // Always six weeks: as tall in every month as the placeholder.
      fixedWeeks
      className="p-0"
    />
  )
}

/**
 * A day picked on a month calendar, for a date editor: the day shown
 * focused as it opens (the selected one, else today's), so the arrows move
 * from it at once.
 */
function DateCalendar({
  value,
  onValueChange,
  locale,
  dir,
  fallback,
}: {
  value: Date | undefined
  onValueChange: (day: Date) => void
  /** The provider's locale. */
  locale: string
  dir: "ltr" | "rtl"
  /** Shown while the calendar's locale loads. */
  fallback: React.ReactNode
}) {
  const calendarLocale = useCalendarLocale(locale)
  const [month, setMonth] = React.useState(() => value ?? new Date())
  const [endMonth] = React.useState(
    () => new Date(new Date().getFullYear() + 10, 11)
  )
  if (calendarLocale === null) return fallback
  return (
    <Calendar
      mode="single"
      selected={value}
      onSelect={(day) => {
        if (day) onValueChange(day)
      }}
      month={month}
      onMonthChange={setMonth}
      captionLayout="dropdown"
      endMonth={endMonth}
      locale={calendarLocale}
      dir={dir}
      fixedWeeks
      autoFocus
      className="p-0"
    />
  )
}

export { DateCalendar, DateRangeFilter }
