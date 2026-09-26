"use client"

import * as React from "react"
import { DirectionProvider } from "@base-ui/react/direction-provider"
import { I18nProvider, RouterProvider } from "react-aria-components"

import { PortalProvider } from "@tecton/react/tecton/portal"

type Direction = "ltr" | "rtl"

type PortalContainer = HTMLElement | null | (() => HTMLElement | null)

type TectonProviderProps = {
  /** Reading direction. Defaults to the direction of `locale`, else inherited. */
  direction?: Direction
  /** BCP 47 language tag used for formatting, collation and direction. */
  locale?: string
  /**
   * Client-side navigation: called with a Tecton link's `href` instead of a
   * full page load (`router.navigate({ to: href, ...options })`).
   */
  navigate?: (href: string, options?: unknown) => void
  /** Turns a router path into the `href` rendered on the anchor (base paths). */
  useHref?: (href: string) => string
  /**
   * Element overlays (Dialog, Popover, Menu, Tooltip…) portal into, or a
   * function returning it. `null` restores the `document.body` default.
   */
  portalContainer?: PortalContainer
  children: React.ReactNode
}

type TectonContextValue = {
  direction: Direction
  locale: string
  navigate?: (href: string, options?: unknown) => void
  useHref?: (href: string) => string
}

/** `null` = no provider in scope: fall back to the defaults. */
const TectonContext = React.createContext<TectonContextValue | null>(null)

// Scripts and languages written right to left, for engines without
// `Intl.Locale#getTextInfo` (the same lists the Unicode CLDR data implies).
const RTL_SCRIPTS = new Set([
  "Adlm",
  "Arab",
  "Hebr",
  "Mand",
  "Mend",
  "Nkoo",
  "Rohg",
  "Samr",
  "Syrc",
  "Thaa",
])
const RTL_LANGUAGES = new Set([
  "ae",
  "ar",
  "arc",
  "bcc",
  "bqi",
  "ckb",
  "dv",
  "fa",
  "glk",
  "he",
  "iw",
  "ku",
  "mzn",
  "nqo",
  "pnb",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
])

type LocaleWithTextInfo = Intl.Locale & {
  getTextInfo?: () => { direction?: string }
  textInfo?: { direction?: string }
}

/** @internal The direction a BCP 47 locale is written in. */
function localeDirection(locale: string): Direction {
  try {
    const parsed = new Intl.Locale(locale) as LocaleWithTextInfo
    const info = parsed.getTextInfo?.() ?? parsed.textInfo
    if (info?.direction === "rtl" || info?.direction === "ltr") {
      return info.direction
    }
    const script = parsed.maximize().script
    if (script) return RTL_SCRIPTS.has(script) ? "rtl" : "ltr"
    return RTL_LANGUAGES.has(parsed.language) ? "rtl" : "ltr"
  } catch {
    const language = locale.split(/[-_]/)[0]?.toLowerCase() ?? ""
    return RTL_LANGUAGES.has(language) ? "rtl" : "ltr"
  }
}

const SERVER_LOCALE = "en-US"

function browserLocale() {
  if (typeof navigator === "undefined") return SERVER_LOCALE
  return navigator.language || navigator.languages?.[0] || SERVER_LOCALE
}

function subscribeLocale(onChange: () => void) {
  window.addEventListener("languagechange", onChange)
  return () => window.removeEventListener("languagechange", onChange)
}

/**
 * The browser's locale, `"en-US"` on the server and in the hydration render
 * (so the markup matches), then the real one; follows `languagechange`.
 */
function useBrowserLocale() {
  return React.useSyncExternalStore(
    subscribeLocale,
    browserLocale,
    () => SERVER_LOCALE
  )
}

/**
 * Tecton TectonProvider — the one provider an application mounts around
 * Tecton. It carries the reading direction, the locale, the client-side
 * router and the element overlays portal into, and every Tecton component
 * reads them from here. It renders no DOM of its own: set `dir` and `lang`
 * on your `<html>` (or use `ThemeRoot`, which sets `dir` on its root).
 *
 * Providers nest: a nested provider inherits every value it does not set.
 * `locale` without `direction` also sets the direction the locale is
 * written in (`ar`, `he`, `fa`… are right to left); `direction` always
 * wins over the locale's own. With no provider at all the direction is
 * `"ltr"` and the locale is the browser's (`"en-US"` on the server).
 */
function TectonProvider({
  direction,
  locale,
  navigate,
  useHref,
  portalContainer,
  children,
}: TectonProviderProps) {
  const parent = React.useContext(TectonContext)
  const fallbackLocale = useBrowserLocale()

  const resolvedLocale = locale ?? parent?.locale ?? fallbackLocale
  const resolvedDirection: Direction =
    direction ??
    (locale !== undefined ? localeDirection(locale) : undefined) ??
    parent?.direction ??
    "ltr"
  const resolvedNavigate = navigate ?? parent?.navigate
  const resolvedUseHref = useHref ?? parent?.useHref

  const value = React.useMemo<TectonContextValue>(
    () => ({
      direction: resolvedDirection,
      locale: resolvedLocale,
      navigate: resolvedNavigate,
      useHref: resolvedUseHref,
    }),
    [resolvedDirection, resolvedLocale, resolvedNavigate, resolvedUseHref]
  )

  let content = (
    <TectonContext value={value}>
      <DirectionProvider direction={resolvedDirection}>
        {children}
      </DirectionProvider>
    </TectonContext>
  )
  if (portalContainer !== undefined) {
    content = (
      <PortalProvider container={portalContainer}>{content}</PortalProvider>
    )
  }
  return content
}

/** The reading direction in scope: `"ltr"` without a provider. */
function useDirection(): Direction {
  return React.useContext(TectonContext)?.direction ?? "ltr"
}

/** The locale and direction in scope. */
function useLocale(): { locale: string; direction: Direction } {
  const context = React.useContext(TectonContext)
  const fallbackLocale = useBrowserLocale()
  return {
    locale: context?.locale ?? fallbackLocale,
    direction: context?.direction ?? "ltr",
  }
}

/**
 * @internal The router adapter in scope, for Tecton's own links. `useHref`
 * is a hook: call it unconditionally when it is set.
 */
function useTectonRouter(): {
  navigate?: (href: string, options?: unknown) => void
  useHref?: (href: string) => string
} {
  const context = React.useContext(TectonContext)
  return { navigate: context?.navigate, useHref: context?.useHref }
}

type ClickLike = {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  defaultPrevented?: boolean
}

/**
 * @internal Whether a click on `anchor` should be handed to the router
 * instead of the browser: a plain primary click (no modifier keys, which
 * mean "new tab / window / download"), not already handled, on a same-origin
 * link that opens in the same browsing context and is not a download.
 */
function shouldClientNavigate(
  event: ClickLike,
  anchor: HTMLAnchorElement
): boolean {
  if (event.defaultPrevented) return false
  if (event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return false
  }
  if (!anchor.hasAttribute("href") || anchor.hasAttribute("download")) {
    return false
  }
  const target = anchor.getAttribute("target")
  if (target && target !== "_self") return false
  if (typeof window === "undefined") return false
  return anchor.origin === window.location.origin
}

/**
 * @internal For the Tecton components still built on React Aria (tree view,
 * chip): feeds React Aria the Tecton locale, direction and router, so they
 * behave like everything else under the same `TectonProvider`. React Aria
 * derives the direction from the locale, so when the two disagree the locale
 * gets the script of the Tecton direction (`ar` + `ltr` → `ar-Latn`).
 */
function AriaBridge({ children }: { children: React.ReactNode }) {
  const { locale, direction } = useLocale()
  const { navigate, useHref } = useTectonRouter()
  const ariaLocale = React.useMemo(() => {
    if (localeDirection(locale) === direction) return locale
    try {
      return new Intl.Locale(locale, {
        script: direction === "rtl" ? "Arab" : "Latn",
      }).toString()
    } catch {
      return direction === "rtl" ? "ar" : SERVER_LOCALE
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

export {
  TectonProvider,
  useDirection,
  useLocale,
  useTectonRouter,
  shouldClientNavigate,
  AriaBridge,
  localeDirection,
}
export type { TectonProviderProps }
