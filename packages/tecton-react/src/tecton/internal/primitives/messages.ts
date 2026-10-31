"use client"

/**
 * Internal to `@tecton/react`: localized strings for the primitives, picked
 * by the `TectonProvider` locale. A table maps a locale (`de-DE`) to its
 * strings; the exact locale wins, then the first one of the same language,
 * then `en-US`. Strings hold `{name}` placeholders; a count string is a map
 * of `Intl.PluralRules` categories (and `=0`).
 */
import * as React from "react"

import { useLocale } from "@tecton/react/tecton/provider"

type PluralMessage = Partial<Record<Intl.LDMLPluralRule | "=0", string>> & {
  other: string
}
type Message = string | PluralMessage
type MessageTable<TKeys extends string> = Record<string, Record<TKeys, Message>>

type Formatter<TKeys extends string> = (
  key: TKeys,
  values?: Record<string, string | number>
) => string

function resolveLocale(table: Record<string, unknown>, locale: string) {
  if (locale in table) return locale
  const language = locale.split(/[-_]/)[0].toLowerCase()
  return (
    Object.keys(table).find((tag) => tag.split("-")[0] === language) ??
    "en-US"
  )
}

function createFormatter<TKeys extends string>(
  table: MessageTable<TKeys>,
  locale: string
): Formatter<TKeys> {
  const resolved = resolveLocale(table, locale)
  const strings = table[resolved]
  let plurals: Intl.PluralRules | null = null
  return (key, values = {}) => {
    let message = strings[key]
    if (typeof message !== "string") {
      const count = Number(values.count) || 0
      plurals ??= new Intl.PluralRules(resolved)
      message =
        (count === 0 && message["=0"]) ||
        message[plurals.select(count)] ||
        message.other
    }
    return message.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match
    )
  }
}

/** The formatter for `table` in the locale of the `TectonProvider` in scope. */
function useMessages<TKeys extends string>(
  table: MessageTable<TKeys>
): Formatter<TKeys> {
  const { locale } = useLocale()
  return React.useMemo(() => createFormatter(table, locale), [table, locale])
}

export { createFormatter, useMessages }
export type { Formatter, Message, MessageTable }
