"use client"

import * as React from "react"

/**
 * The portal context behind `TectonProvider`'s `portalContainer`: the element
 * every Tecton overlay rendered below it portals into (Dialog, Sheet,
 * Popover, Tooltip, Select, Combobox, Dropdown Menu, Drawer, Command
 * dialog…). By default overlays portal into `document.body`.
 *
 * Applications that render several isolated React roots on one page (micro
 * frontends, embedded widgets) give each root a body-level container of its
 * own — `ThemeRoot` creates one — so the overlays keep escaping
 * `overflow: hidden` ancestors while the container carries that root's scoped
 * styles, theme tokens and ownership attributes. Tecton owns this context,
 * and each overlay wrapper passes the resolved container straight to its
 * primitive's portal, so isolated roots never depend on sharing a component
 * library's private context.
 *
 * Applications set the container with `TectonProvider` (or `ThemeRoot`);
 * `PortalProvider` is the internal building block and not public API.
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

/** @internal Use `TectonProvider`'s `portalContainer`. */
function PortalProvider({ container, children }: PortalProviderProps) {
  const resolved = useResolvedContainer(container)
  return (
    <PortalContainerContext value={resolved}>{children}</PortalContainerContext>
  )
}

/**
 * The element overlays currently portal into, or `null` when no container is
 * set (overlays then use `document.body`).
 */
function usePortalContainer(): HTMLElement | null {
  return React.useContext(PortalContainerContext)
}

/**
 * The `container` an overlay passes to its primitive's portal, or `undefined`
 * when none is set. Never `null`: Base UI reads `container={null}` as "render
 * nothing" rather than "use the default", so the no-container case has to be
 * `undefined`, which leaves the primitive to its own default (`document.body`,
 * or the parent popup's container for a nested menu).
 */
function usePortalTarget(): HTMLElement | undefined {
  return usePortalContainer() ?? undefined
}

export { PortalProvider, usePortalContainer, usePortalTarget }
export type { PortalProviderProps }
