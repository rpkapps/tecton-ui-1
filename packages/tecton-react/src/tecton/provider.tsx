"use client"

import * as React from "react"
import { DirectionProvider } from "@base-ui/react/direction-provider"

import { PortalProvider } from "@tecton/react/tecton/portal"

import { localeDirection } from "./internal/locale"

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

/**
 * @internal `null` = no provider in scope: fall back to the defaults. Read
 * through `useDirection` / `useLocale`, or the internal router hook
 * (`internal/router`); stripped from the published declarations.
 */
export const TectonContext = React.createContext<TectonContextValue | null>(
  null
)

const SERVER_LOCALE = "en-US"

function browserLocale() {
  if (typeof navigator === "undefined") return SERVER_LOCALE
  return navigator.language || navigator.languages[0] || SERVER_LOCALE
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

export { TectonProvider, useDirection, useLocale }
export type { TectonProviderProps }
