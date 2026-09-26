"use client"

/**
 * Internal to `@tecton/react` (not in the package `exports` map): the bridge
 * the Tecton components still built on React Aria (tree view, chip) wrap
 * themselves in.
 */
import * as React from "react"
import { I18nProvider, RouterProvider } from "react-aria-components"

import { useLocale } from "@tecton/react/tecton/provider"

import { localeDirection } from "./locale"
import { useTectonRouter } from "./router"

const FALLBACK_LOCALE = "en-US"

/**
 * Feeds React Aria the Tecton locale, direction and router, so the
 * components built on it behave like everything else under the same
 * `TectonProvider`. React Aria derives the direction from the locale, so when
 * the two disagree the locale gets the script of the Tecton direction
 * (`ar` + `ltr` → `ar-Latn`).
 */
export function AriaBridge({ children }: { children: React.ReactNode }) {
  const { locale, direction } = useLocale()
  const { navigate, useHref } = useTectonRouter()
  const ariaLocale = React.useMemo(() => {
    if (localeDirection(locale) === direction) return locale
    try {
      return new Intl.Locale(locale, {
        script: direction === "rtl" ? "Arab" : "Latn",
      }).toString()
    } catch {
      return direction === "rtl" ? "ar" : FALLBACK_LOCALE
    }
  }, [locale, direction])

  const content = <I18nProvider locale={ariaLocale}>{children}</I18nProvider>
  if (!navigate) return content
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      {content}
    </RouterProvider>
  )
}
