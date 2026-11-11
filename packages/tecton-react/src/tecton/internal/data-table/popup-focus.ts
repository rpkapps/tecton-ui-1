"use client"

/**
 * For the on-demand popups (`lazy-popup.ts`), which open by their part's
 * plain button rather than by a trigger of their own, what the trigger
 * would give them:
 * - a menu opened from the keyboard has its first item active (the menu
 *   first takes focus itself; the item takes it once the popup has);
 * - Tab and Shift+Tab leave the popup by the button
 *   (`usePopupTabbing`).
 *
 * Kept free of the popups' code: `lazy-popup.ts` uses `tabbablesIn` too.
 */
import * as React from "react"

import type { LazyPopupProps, OpenedBy } from "./lazy-popup"

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]'

function shown(element: HTMLElement) {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  return style?.display !== "none" && style?.visibility !== "hidden"
}

/**
 * The elements of `element` Tab stops on, in order: also those the popup
 * takes out of the Tab order while focus is outside it (`data-tabindex`
 * keeps their own), which it puts back as focus comes in.
 */
function tabbablesIn(element: HTMLElement): Array<HTMLElement> {
  return [...element.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (candidate) =>
      (candidate.dataset.tabindex !== undefined
        ? candidate.dataset.tabindex !== "-1"
        : candidate.tabIndex >= 0) &&
      !candidate.hasAttribute("data-base-ui-focus-guard") &&
      !candidate.closest("[inert], [hidden]") &&
      shown(candidate)
  )
}

const ITEM =
  '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])'

function useFirstItemFromKeyboard(
  popup: React.RefObject<HTMLElement | null>,
  open: boolean,
  openedBy: OpenedBy | null
) {
  React.useEffect(() => {
    if (!open || openedBy !== "keyboard") return
    let frame = 0
    let tries = 0
    // After the popup's own initial focus (a frame after it mounts).
    const step = () => {
      const element = popup.current
      const doc = element?.ownerDocument
      if (element && doc && element.contains(doc.activeElement)) {
        if (doc.activeElement === element)
          element.querySelector<HTMLElement>(ITEM)?.focus()
        return
      }
      if (++tries < 10) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [popup, open, openedBy])
}

/**
 * Tab and Shift+Tab in a popup opened by a plain button, as by its own
 * trigger:
 * - a menu closes; Tab moves on from the button, Shift+Tab stops on it;
 * - a popover keeps Tab among its controls; past the last, it closes and
 *   Tab moves on from the button; before the first, Shift+Tab goes back to
 *   the button, the popover staying open (the button's Tab enters it
 *   again, its Shift+Tab leaves both: `lazy-popup.ts`).
 * Focus is put on the button in the key's own event, so the browser moves
 * on from there.
 */
function usePopupTabbing(
  popup: Pick<LazyPopupProps, "open" | "anchor" | "tabOut" | "popupId">,
  kind: "menu" | "dialog"
) {
  const { open, anchor, tabOut, popupId } = popup
  const latest = React.useRef(tabOut)
  latest.current = tabOut
  React.useEffect(() => {
    const doc = anchor.current?.ownerDocument
    if (!open || !doc) return
    // On the document, before the popup's own handling of the key: the
    // popup mounts after it opens.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return
      const element = doc.getElementById(popupId)
      const button = anchor.current
      if (!element || !button) return
      if (!element.contains(event.target as Node | null)) return
      if (kind === "menu") {
        latest.current()
        button.focus({ preventScroll: true })
        if (event.shiftKey) event.preventDefault()
        return
      }
      const stops = tabbablesIn(element)
      const active = doc.activeElement
      const first = stops[0] ?? element
      const last = stops.at(-1) ?? element
      if (event.shiftKey) {
        if (active !== first && active !== element) return
        event.preventDefault()
        button.focus({ preventScroll: true })
      } else {
        if (active !== last && stops.length > 0) return
        latest.current()
        button.focus({ preventScroll: true })
      }
    }
    doc.addEventListener("keydown", onKeyDown, true)
    return () => doc.removeEventListener("keydown", onKeyDown, true)
  }, [open, anchor, popupId, kind])
}

export { tabbablesIn, useFirstItemFromKeyboard, usePopupTabbing }
