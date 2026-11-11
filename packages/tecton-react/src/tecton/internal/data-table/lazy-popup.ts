"use client"

/**
 * A menu or popover whose code loads on demand (`lazy.ts`): the part's
 * button is a plain button for the part's whole life, never swapped for
 * the popup's own trigger, so focus, the pointer and screen readers keep
 * the same element. The button owns the popup's state and says it:
 * `aria-haspopup`, `aria-expanded`, `aria-controls` while open. Once the
 * code is there, the part renders the popup controlled (`popupProps`),
 * placed by the button (`anchor`), focus going back to it as it closes.
 *
 * Pointing at or focusing the button asks for the code. A press made
 * before it is there (a click, Enter or Space, Down for a menu) only
 * records how the popup was asked for, and opens it once the code comes,
 * unless the user moved on meanwhile: pressed elsewhere, moved focus away
 * or pressed Escape. A pointer counts as a press only by its click: down
 * and up on the button. Nothing is replayed or synthesized.
 *
 * Opened from the keyboard, a menu has its first item active; from a
 * pointer, the popup itself takes focus (as a loaded Tecton menu does).
 * The server and the first client render have the button only, closed:
 * hydration-safe.
 */
import * as React from "react"

import { useFeature, type FeatureName } from "./lazy"
import { tabbablesIn } from "./popup-focus"

type OpenedBy = "keyboard" | "pointer"

/** What the loaded popup part takes from the button (`useLazyPopup`). */
type LazyPopupProps = {
  open: boolean
  onOpenChange: (
    open: boolean,
    eventDetails: { reason?: string; event?: Event }
  ) => void
  onOpenChangeComplete: (open: boolean) => void
  /** The button: the popup is placed by it, and focus comes back to it. */
  anchor: React.RefObject<HTMLButtonElement | null>
  /** The popup's id (the button's `aria-controls`). */
  popupId: string
  /** The button's id (a menu's `aria-labelledby`). */
  buttonId: string
  /** How the popup was opened: a menu opened by the keyboard has its first item active. */
  openedBy: OpenedBy | null
  /**
   * Where focus goes as the popup closes (the popup's `finalFocus`): the
   * button, unless focus moved on by itself (Tab, or focus leaving).
   */
  finalFocus: () => HTMLElement | boolean
  /** Closes the popup as Tab leaves it: focus moves on from the button. */
  tabOut: () => void
}

function useLazyPopup<TName extends FeatureName>(
  name: TName,
  {
    on = true,
    popup,
    /** Asked for with the popup's code (the code its content needs). */
    also,
    /** The button's own id, when the caller names it. */
    id: ownId,
    /** The button's ref, when the caller needs it too. */
    anchor: ownAnchor,
  }: {
    on?: boolean
    popup: "menu" | "dialog"
    also?: () => void
    id?: string
    anchor?: React.RefObject<HTMLButtonElement | null>
  }
) {
  const feature = useFeature(name, on)
  const { load } = feature
  const ownRef = React.useRef<HTMLButtonElement | null>(null)
  const anchor = ownAnchor ?? ownRef
  const generated = React.useId()
  const buttonId = ownId ?? `${generated}-button`
  const popupId = `${generated}-popup`
  const [open, setOpen] = React.useState(false)
  // Rendered while open, and while it closes (its exit animation).
  const [mounted, setMounted] = React.useState(false)
  const [openedBy, setOpenedBy] = React.useState<OpenedBy | null>(null)
  // A press made before the code came: how, until it opens or is given up.
  const [intent, setIntent] = React.useState<OpenedBy | null>(null)
  const ask = React.useCallback(() => {
    load()
    also?.()
  }, [load, also])
  const show = React.useCallback((by: OpenedBy) => {
    setOpenedBy(by)
    setMounted(true)
    setOpen(true)
  }, [])

  // The code came: the press waiting opens the popup.
  const { module } = feature
  React.useEffect(() => {
    if (!module || !intent) return
    setIntent(null)
    show(intent)
  }, [module, intent, show])

  // The user moves on before the code comes: a press elsewhere, focus
  // elsewhere, or Escape gives the press up.
  React.useEffect(() => {
    const button = anchor.current
    if (!intent || !button) return
    const doc = button.ownerDocument
    const away = (event: Event) => {
      if (!button.contains(event.target as Node | null)) setIntent(null)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIntent(null)
    }
    // Focus leaving the button, also out of the page (Tab past its last
    // control), where no element gains it.
    const leave = (event: FocusEvent) => {
      if (!button.contains(event.relatedTarget as Node | null)) setIntent(null)
    }
    doc.addEventListener("pointerdown", away, true)
    doc.addEventListener("focusin", away, true)
    doc.addEventListener("keydown", key, true)
    button.addEventListener("focusout", leave)
    return () => {
      doc.removeEventListener("pointerdown", away, true)
      doc.removeEventListener("focusin", away, true)
      doc.removeEventListener("keydown", key, true)
      button.removeEventListener("focusout", leave)
    }
  }, [intent])

  const press = (by: OpenedBy) => {
    // Pressed again: closes the popup, or gives up the press waiting.
    if (open) return setOpen(false)
    if (intent) return setIntent(null)
    if (module) return show(by)
    setIntent(by)
    ask()
  }

  const buttonProps = {
    ref: anchor,
    id: buttonId,
    "aria-haspopup": popup,
    "aria-expanded": open,
    "aria-controls": open ? popupId : undefined,
    // As a popup's own trigger has it (the parts' classes read it).
    "data-popup-open": open ? "" : undefined,
    onPointerEnter: ask,
    onFocus: ask,
    // A click with no pointer (`detail` 0) comes from Enter or Space.
    onClick: (event: React.MouseEvent<HTMLElement>) =>
      press(event.detail === 0 ? "keyboard" : "pointer"),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      // A popover open while focus is back on its button (Shift+Tab from
      // its first control): Tab enters it again, Shift+Tab leaves both.
      if (open && popup === "dialog" && event.key === "Tab") {
        if (event.shiftKey) return tabOut()
        const element = anchor.current?.ownerDocument.getElementById(popupId)
        if (!element) return
        event.preventDefault()
        ;(tabbablesIn(element)[0] ?? element).focus()
        return
      }
      const opening = event.key === "Enter" || event.key === " "
      const down = popup === "menu" && event.key === "ArrowDown"
      // A key held down presses once.
      if (event.repeat && (opening || down)) return event.preventDefault()
      if (!down) return
      // A menu's Down, not the grid's.
      event.preventDefault()
      if (!open) press("keyboard")
    },
  }

  // How the popup last closed: focus moved on by itself (Tab, focus
  // leaving) or not, for `finalFocus`.
  const movedOn = React.useRef(false)
  React.useEffect(() => {
    if (open) movedOn.current = false
  }, [open])
  const tabOut = () => {
    movedOn.current = true
    setOpen(false)
  }

  const popupProps: LazyPopupProps = {
    open,
    anchor,
    popupId,
    buttonId,
    openedBy,
    finalFocus: () => (movedOn.current ? false : (anchor.current ?? true)),
    tabOut,
    onOpenChange: (next, details) => {
      if (next) return
      // A press on the button closes the popup by its own click.
      const target = details.event?.target as Node | null | undefined
      if (
        details.reason === "outside-press" &&
        target &&
        anchor.current?.contains(target)
      )
        return
      if (details.reason === "focus-out") {
        // Focus on the button keeps the popup open, as on its own trigger
        // (Shift+Tab from a popover's first control, `usePopupTabbing`).
        const to = (details.event as FocusEvent | undefined)?.relatedTarget
        if (to instanceof Node && anchor.current?.contains(to)) return
        movedOn.current = true
      }
      setOpen(false)
    },
    onOpenChangeComplete: (next) => {
      if (!next) setMounted(false)
    },
  }

  return {
    module,
    buttonProps,
    popupProps,
    /** The popup is to be rendered (open, or closing). */
    mounted: mounted && module !== null,
    open,
    close: () => setOpen(false),
    load: ask,
  }
}

type Handlers = Record<string, unknown>

/** One ref callback for both refs. */
function mergeRefs(...refs: Array<unknown>) {
  return (element: HTMLElement | null) => {
    for (const ref of refs)
      if (typeof ref === "function") ref(element)
      else if (ref && typeof ref === "object")
        (ref as React.MutableRefObject<HTMLElement | null>).current = element
  }
}

/**
 * `own` props with `lazy`'s (`useLazyPopup().buttonProps`): an event
 * handler both have runs both, the caller's first.
 */
function mergeButtonProps<TProps extends object>(
  own: TProps,
  lazy: Handlers
): TProps {
  const merged: Handlers = { ...(own as Handlers) }
  for (const [name, value] of Object.entries(lazy)) {
    const mine = merged[name]
    if (name === "ref" && mine) {
      merged.ref = mergeRefs(mine, value)
      continue
    }
    merged[name] =
      typeof value === "function" &&
      typeof mine === "function" &&
      name.startsWith("on")
        ? (...args: Array<unknown>) => {
            ;(mine as (...a: Array<unknown>) => void)(...args)
            ;(value as (...a: Array<unknown>) => void)(...args)
          }
        : value
  }
  return merged as TProps
}

export { mergeButtonProps, useLazyPopup }
export type { LazyPopupProps, OpenedBy }
