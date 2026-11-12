"use client"

/**
 * The state of a part's menu or popover: `DataTableFilter`'s,
 * `DataTableGroupBy`'s, `DataTableColumnsMenu`'s, a column's menu, a
 * description's popover and `DataTableRowActions`' menu. Each part renders
 * the popup with its own `DropdownMenuTrigger` or `PopoverTrigger`, as the
 * documented `DropdownMenu` and `Popover` are, so it opens, animates and
 * gives focus back as they do; the popup's content renders only while it
 * is open.
 *
 * What a trigger does not do, this adds:
 * - In a `DataTableToolbar`, a part that has gone into the toolbar's
 *   "More" menu opens from that menu's item (`openBy`), placed by the More
 *   button, focus going back to it.
 * - The popup is placed by what is there: the part's trigger while it is in
 *   the row, the More button while the part is in the menu. As the toolbar
 *   lays its items out again while the popup is open (the part comes back
 *   into the row, the More button goes away), the popup moves with them; it
 *   is never left by an element that has gone, which would put it in the
 *   corner of the page.
 * - How the popup was opened (`openedBy`): a date filter's calendar focuses
 *   its day when it was opened from the keyboard, and a menu opened from
 *   the More menu with a key has its first item active, as from its own
 *   trigger.
 */
import * as React from "react"

type OpenedBy = "keyboard" | "pointer"

type OpenChangeDetails = { event?: Event }

/** How an open was asked for: a key, or a click with no pointer (Enter, Space). */
function openedByOf(event: Event | undefined): OpenedBy {
  if (typeof KeyboardEvent !== "undefined" && event instanceof KeyboardEvent)
    return "keyboard"
  if (typeof MouseEvent !== "undefined" && event instanceof MouseEvent)
    return event.detail === 0 && event.type === "click" ? "keyboard" : "pointer"
  return "pointer"
}

/** The toolbar's "More" button, of the toolbar `element` is in. */
function moreButtonOf(element: Element): HTMLElement | null {
  const toolbar = element.closest(
    '[data-slot="toolbar"], [data-slot="overflow"]'
  )
  return (
    toolbar?.querySelector<HTMLElement>(
      ':scope > [data-slot="overflow-menu"] button'
    ) ?? null
  )
}

/**
 * What the popup is placed by: `trigger` while it is in the row, the More
 * button while a toolbar has moved it into its menu; `null` when neither
 * is there.
 */
function placeOf(trigger: HTMLElement | null): HTMLElement | null {
  if (!trigger?.isConnected) return null
  if (!trigger.closest('[data-slot="overflow-item"][data-overflowing]'))
    return trigger
  return moreButtonOf(trigger)
}

const ITEM =
  '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])'

function usePartPopup() {
  const [open, setOpen] = React.useState(false)
  const [openedBy, setOpenedBy] = React.useState<OpenedBy | null>(null)
  const trigger = React.useRef<HTMLButtonElement | null>(null)
  // The element the popup is placed by while it is not the trigger (the
  // More button); `undefined` leaves the trigger.
  const [anchor, setAnchor] = React.useState<HTMLElement | undefined>()
  const [fromMenu, setFromMenu] = React.useState(false)

  // While open, the popup follows the toolbar's layout.
  React.useLayoutEffect(() => {
    const button = trigger.current
    if (!open || !button) return
    const update = () => {
      const place = placeOf(button)
      // Nothing there (the part and the toolbar gone): it stays put until
      // it closes.
      if (!place) return
      // Opened by the trigger and still by it: left to the trigger, no
      // render. Else the element, named (the trigger again included).
      setAnchor((current) =>
        current === undefined && place === button ? undefined : place
      )
    }
    update()
    const toolbar = button.closest(
      '[data-slot="toolbar"], [data-slot="overflow"]'
    )
    if (!toolbar || typeof MutationObserver === "undefined") return
    const observer = new MutationObserver(update)
    observer.observe(toolbar, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-overflowing"],
    })
    return () => observer.disconnect()
  }, [open])

  const onOpenChange = (next: boolean, details?: OpenChangeDetails) => {
    if (next) {
      setOpenedBy(openedByOf(details?.event))
      setFromMenu(false)
    }
    setOpen(next)
  }

  /** Opens the popup from the toolbar's More menu, placed by its `button`. */
  const openBy = (button: HTMLButtonElement, by: OpenedBy) => {
    setAnchor(button)
    setOpenedBy(by)
    setFromMenu(true)
    setOpen(true)
  }

  return {
    open,
    openedBy,
    /** The trigger's ref. */
    trigger,
    openBy,
    close: () => setOpen(false),
    /** For the popup's root (`DropdownMenu`, `Popover`). */
    root: {
      open,
      onOpenChange,
      onOpenChangeComplete: (next: boolean) => {
        if (next) return
        setAnchor(undefined)
        setFromMenu(false)
      },
    },
    /** For the popup's content (`DropdownMenuContent`, `PopoverContent`). */
    content: {
      anchor,
      // Back to the More button while the part is in the menu.
      finalFocus: anchor
        ? (): HTMLElement | boolean => placeOf(trigger.current) ?? true
        : undefined,
    },
    /** The popup was opened from the More menu, not by its trigger. */
    fromMenu,
  }
}

/**
 * A menu opened from the More menu with a key has its first item active,
 * as one opened by its own trigger does (the menu takes focus itself
 * first; the item takes it once the popup has).
 */
function useFirstItemFromKeyboard(
  popup: React.RefObject<HTMLElement | null>,
  on: boolean
) {
  React.useEffect(() => {
    if (!on) return
    let frame = 0
    let tries = 0
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
  }, [popup, on])
}

/**
 * A menu trigger's keys in the grid (a column's menu, a row's actions):
 * Down opens the menu, as on any menu trigger; Up is the grid's, to the
 * row above, not the menu's.
 */
function gridMenuKeys(
  event: React.KeyboardEvent & { preventBaseUIHandler?: () => void }
) {
  if (event.key === "ArrowUp") event.preventBaseUIHandler?.()
}

/** A part's popup state, as its popup's content takes it. */
type PartPopup = ReturnType<typeof usePartPopup>

export { gridMenuKeys, openedByOf, useFirstItemFromKeyboard, usePartPopup }
export type { OpenedBy, PartPopup }
