"use client"

import * as React from "react"

/**
 * Tecton PortalProvider — chooses the element that every Tecton overlay
 * rendered by its children portals into (Dialog, Sheet, Popover, Tooltip,
 * Select, Combobox, Dropdown Menu, Command dialog…). By default overlays
 * portal into `document.body`.
 *
 * Applications that render several isolated React roots on one page (micro
 * frontends, embedded widgets) give each root a body-level container of its
 * own, so the overlays keep escaping `overflow: hidden` ancestors while the
 * container carries that root's scoped styles, theme tokens and ownership
 * attributes. Tecton owns the container context and overlay wrappers pass the
 * resolved container directly to their React Aria Components primitive.
 */
type PortalProviderProps = {
  /**
   * Element the overlays portal into, or a function returning it (called
   * after the provider mounts, and again whenever a new function is passed,
   * so `() => ref.current` sees the committed element). `null` clears an
   * outer provider and restores the `document.body` default.
   */
  container: HTMLElement | null | (() => HTMLElement | null)
  children: React.ReactNode
}

const PortalContainerContext = React.createContext<HTMLElement | null>(null)

/**
 * A function `container` is resolved after the commit, not while the
 * overlays render: the usual `() => ref.current` reads a ref that is only set
 * once the host element has committed, and an overlay wrapper that rendered
 * before that would keep portalling to `document.body` for good. A passive
 * effect, not a layout one: layout effects run in tree order while refs are
 * still being attached, so a host rendered after the provider (a sibling, an
 * ancestor) would not be set yet. The resolved element lives in state, so the
 * overlays re-render with it; a new function identity (an inline arrow gives
 * one every render) resolves again.
 */
function useResolvedContainer(
  container: PortalProviderProps["container"]
): HTMLElement | null {
  const isFunction = typeof container === "function"
  const [resolved, setResolved] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    if (typeof container === "function") setResolved(container())
  }, [container])
  return isFunction ? resolved : container
}

function PortalProvider({ container, children }: PortalProviderProps) {
  const resolved = useResolvedContainer(container)
  return (
    <PortalContainerContext value={resolved}>{children}</PortalContainerContext>
  )
}

/**
 * The element overlays currently portal into, or `null` when no
 * `PortalProvider` is in scope (React Aria then uses `document.body`).
 */
function usePortalContainer(): HTMLElement | null {
  return React.useContext(PortalContainerContext)
}

/**
 * The target passed to React Aria Components overlay primitives, or
 * `undefined` when no `PortalProvider` is in scope. `undefined` matters: React
 * Aria reads a set `UNSTABLE_portalContainer` as "the caller has decided" and
 * stops resolving the target itself, which would defeat its own defaults — the
 * root popover's container for submenus, and `document.body` only once
 * hydration is over.
 */
function usePortalTarget(): HTMLElement | undefined {
  return usePortalContainer() ?? undefined
}

export { PortalProvider, usePortalContainer, usePortalTarget }
export type { PortalProviderProps }
