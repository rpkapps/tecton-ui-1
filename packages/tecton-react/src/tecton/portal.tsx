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
   * Element the overlays portal into, or a function returning it. `null`
   * clears an outer provider and restores the `document.body` default.
   */
  container: HTMLElement | null | (() => HTMLElement | null)
  children: React.ReactNode
}

type PortalContainer = HTMLElement | null | (() => HTMLElement | null)

const PortalContainerContext = React.createContext<PortalContainer | undefined>(
  undefined
)

function PortalProvider({ container, children }: PortalProviderProps) {
  return (
    <PortalContainerContext value={container}>
      {children}
    </PortalContainerContext>
  )
}

/**
 * The element overlays currently portal into, or `null` when no
 * `PortalProvider` is in scope (React Aria then uses `document.body`).
 */
function usePortalContainer(): HTMLElement | null {
  const container = React.useContext(PortalContainerContext)
  return typeof container === "function" ? container() : (container ?? null)
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
