"use client"

/**
 * Internal to `@tecton/react` (not in the package `exports` map): the router
 * adapter of the `TectonProvider` in scope, for Tecton's own links. The
 * context itself lives in `tecton/provider`, imported by package name so a
 * host and a remote sharing `@tecton/react/` meet on one context.
 */
import * as React from "react"

import { TectonContext } from "@tecton/react/tecton/provider"

type TectonRouter = {
  navigate?: (href: string, options?: unknown) => void
  useHref?: (href: string) => string
}

/**
 * The router adapter in scope. `useHref` is a hook: call it unconditionally
 * when it is set.
 */
export function useTectonRouter(): TectonRouter {
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
 * Whether a click on `anchor` should be handed to the router instead of the
 * browser: a plain primary click (no modifier keys, which mean "new tab /
 * window / download"), not already handled, on a same-origin link that opens
 * in the same browsing context and is not a download.
 */
export function shouldClientNavigate(
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
