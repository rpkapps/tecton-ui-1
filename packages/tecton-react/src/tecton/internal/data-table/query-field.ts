"use client"

/**
 * The query field's own state, as hooks of `QuerySearch` (`query-search.tsx`)
 * in the same chunk: the query it holds and the view it writes
 * (`useQueryDraft`), what the plain field handed it (`useHandoff`), its
 * caret (`useCaret`), the mirror over its input (`useMirror`), its list's
 * width (`useFieldWidth`), its focus kept through presses on its own parts
 * (`useKeepFocus`), and when its list is open (`useListOpen`).
 */
import * as React from "react"

import type { DataTableActions } from "./context"
import { useDelayedCommit } from "./delayed-commit"
import {
  applyQuery,
  parseQuery,
  serializeQuery,
  type ParsedQuery,
  type QueryLanguage,
  type QueryView,
} from "./engine/query/index"
import { sameFilters } from "./engine/view"

/** How long typing pauses before the problem being typed shows. */
const TYPING_PAUSE = 650

/** What the plain field held when the query layer took its place. */
type QueryHandoff = {
  /** What was typed in it; `null` when nothing was. */
  readonly text: string | null
  readonly selectionStart: number | null
  readonly selectionEnd: number | null
  readonly focused: boolean
  /** "?" was pressed before the layer loaded: the help opens. */
  readonly help: boolean
}

type InputRef = React.RefObject<HTMLInputElement | null>

/**
 * The query the field holds (`draft`, read as `parsed`) and the query the
 * view reads as (`written`): the view's filters and search, the presets
 * the field held kept. A change reaches the view after the search's delay
 * (`useDelayedCommit`); a query that means the same as the view's (other
 * spaces, another order) is not written over.
 */
function useQueryDraft(
  language: QueryLanguage,
  { filters, search }: QueryView,
  actions: Pick<DataTableActions<unknown>, "updateView" | "currentView">,
  /** The search's delay and the table's count of clears (`useDelayedCommit`). */
  delay: number,
  clears: number
) {
  // The query the field held when the view changed, and the language: kept
  // as the render commits, for the callbacks and the next serialization.
  const previous = React.useRef<ParsedQuery | undefined>(undefined)
  const latest = React.useRef(language)
  const written = React.useMemo(
    () =>
      serializeQuery(
        language,
        { filters, search },
        { previous: previous.current }
      ),
    [language, filters, search]
  )
  const sameMeaning = React.useCallback((a: string, b: string) => {
    if (a === b) return true
    const x = parseQuery(latest.current, a)
    const y = parseQuery(latest.current, b)
    return x.search === y.search && sameFilters(x.filters, y.filters)
  }, [])
  const { draft, change, flush } = useDelayedCommit({
    value: written,
    commit: (text) => {
      const query = parseQuery(latest.current, text)
      return (
        actions.updateView(
          (view) => applyQuery(latest.current, view, query),
          (before, after) =>
            sameFilters(before.filters, after.filters) ? "search" : "filter"
        ) ||
        applyQuery(latest.current, actions.currentView(), query) ===
          actions.currentView()
      )
    },
    delay,
    clears,
    same: sameMeaning,
  })
  const parsed = React.useMemo(
    () => parseQuery(language, draft),
    [language, draft]
  )
  React.useInsertionEffect(() => {
    previous.current = parsed
    latest.current = language
  })
  return { written, draft, parsed, change, flush }
}

/**
 * The plain field's state, taken over once, on mount: its text is parsed
 * (and applied), and focus and the selection stay where they were. It
 * showed the search only: the view's filters go before what it held, the
 * selection moved past them.
 */
function useHandoff(
  handoff: QueryHandoff,
  language: QueryLanguage,
  /** The view's filters and search, and the query they read as. */
  { filters, search }: QueryView,
  written: string,
  change: (text: string) => void,
  inputRef: InputRef,
  /** Selects `start`–`end` once the input holds `text`. */
  select: (text: string, start: number, end: number) => void,
  /** The field has focus, its list open. */
  focus: () => void
) {
  React.useLayoutEffect(() => {
    const input = inputRef.current
    const shown = handoff.text ?? search
    const filtersText = serializeQuery(language, { filters, search: "" })
    const text =
      handoff.text === null
        ? written
        : filtersText && handoff.text
          ? `${filtersText} ${handoff.text}`
          : filtersText || handoff.text
    if (text !== written) change(text)
    if (input && handoff.focused) {
      input.focus()
      const shift = text.endsWith(shown)
        ? text.length - shown.length
        : text.length
      const at = (offset: number | null) =>
        Math.min(text.length, (offset ?? shown.length) + shift)
      select(text, at(handoff.selectionStart), at(handoff.selectionEnd))
      focus()
    }
    // Once, on mount.
  }, [])
}

/**
 * The input's metrics the mirror must share for its glyphs to line up:
 * the font's longhands (its shorthand reads as "" while a variant is not
 * its initial one), spacing, case and direction.
 */
const METRICS = [
  ...(
    [
      "Family",
      "Size",
      "Style",
      "Weight",
      "Stretch",
      // Every `font-variant-*`: a shorthand that can say them all.
      "Variant",
      "Kerning",
      "FeatureSettings",
      "VariationSettings",
    ] as const
  ).map((name) => `font${name}` as const),
  "lineHeight",
  "letterSpacing",
  "wordSpacing",
  "textTransform",
  "direction",
] as const

/**
 * The mirror over the input (`mirrorRef`): it follows the input's
 * horizontal scroll and its metrics, read again on every render (the
 * caret's layout effect calls `sync`), window resize, font load and scroll
 * (never once only: the input's size changes at a breakpoint and with
 * zoom, and a mirror left at the old size would draw its letters away
 * from the caret).
 */
function useMirror(
  inputRef: InputRef,
  mirrorRef: React.RefObject<HTMLElement | null>
) {
  const sync = React.useCallback(() => {
    const input = inputRef.current
    const layer = mirrorRef.current
    if (!input || !layer) return
    const style = getComputedStyle(input)
    for (const name of METRICS)
      if (layer.style[name] !== style[name]) layer.style[name] = style[name]
    const clip = layer.parentElement
    if (clip) {
      // Clipped where the input clips its text: at its content box.
      clip.style.insetInlineStart = style.paddingInlineStart
      clip.style.insetInlineEnd = style.paddingInlineEnd
    }
    layer.style.transform = `translateX(${-input.scrollLeft}px)`
  }, [inputRef, mirrorRef])
  React.useEffect(() => {
    const input = inputRef.current
    // Not every environment has font loading events (a test's DOM).
    const fonts = (document as { fonts?: FontFaceSet }).fonts
    window.addEventListener("resize", sync)
    fonts?.addEventListener("loadingdone", sync)
    input?.addEventListener("scroll", sync)
    return () => {
      window.removeEventListener("resize", sync)
      fonts?.removeEventListener("loadingdone", sync)
      input?.removeEventListener("scroll", sync)
    }
  }, [inputRef, sync])
  return sync
}

/**
 * The caret, as the input's selection has it (read on `selectionchange`
 * while the input has focus), and the caret or selection to place once
 * the input holds the text a change makes (`placeCaret`, `select`): placed
 * in a layout effect after every render, then `sync` (the mirror follows).
 */
function useCaret(inputRef: InputRef, initial: number, sync: () => void) {
  const [caret, setCaret] = React.useState(initial)
  const pendingCaret = React.useRef<number | null>(null)
  const pendingSelection = React.useRef<{
    text: string
    start: number
    end: number
  } | null>(null)
  const readCaret = React.useCallback(() => {
    const input = inputRef.current
    if (input) setCaret(input.selectionStart ?? input.value.length)
  }, [inputRef])
  const placeCaret = (at: number) => {
    pendingCaret.current = at
    setCaret(at)
  }
  const select = (text: string, start: number, end: number) => {
    pendingSelection.current = { text, start, end }
    setCaret(start)
  }
  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (input && pendingCaret.current !== null) {
      const at = pendingCaret.current
      pendingCaret.current = null
      input.focus()
      input.setSelectionRange(at, at)
    }
    const selection = pendingSelection.current
    if (input && selection && input.value === selection.text) {
      pendingSelection.current = null
      input.setSelectionRange(selection.start, selection.end)
    }
    sync()
  })
  React.useEffect(() => {
    const input = inputRef.current
    const onSelection = () => {
      if (input && document.activeElement === input) {
        readCaret()
        sync()
      }
    }
    document.addEventListener("selectionchange", onSelection)
    return () => document.removeEventListener("selectionchange", onSelection)
  }, [inputRef, readCaret, sync])
  return { caret, readCaret, placeCaret, select }
}

/**
 * The list as wide as the field on every frame: the positioner reads its
 * anchor a frame late, so the field's width is copied into the popup from
 * a ResizeObserver, which runs after layout and before paint.
 */
function useFieldWidth(group: HTMLElement | null, popup: HTMLElement | null) {
  React.useLayoutEffect(() => {
    if (!group || !popup) return
    const follow = () =>
      popup.style.setProperty(
        "--field-width",
        `${group.getBoundingClientRect().width}px`
      )
    follow()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(follow)
    observer.observe(group)
    return () => observer.disconnect()
  }, [group, popup])
}

/**
 * A press anywhere in the field around the input (its icon, its padding,
 * its clear and help buttons) leaves focus in the input it already has:
 * the field is never blurred and focused again, nor its list closed and
 * opened again, by a press on its own parts.
 */
function useKeepFocus(group: HTMLElement | null, inputRef: InputRef) {
  React.useEffect(() => {
    if (!group) return
    const keep = (event: MouseEvent) => {
      const input = inputRef.current
      if (
        event.button === 0 &&
        input &&
        event.target !== input &&
        document.activeElement === input
      )
        event.preventDefault()
    }
    group.addEventListener("mousedown", keep)
    return () => group.removeEventListener("mousedown", keep)
  }, [group, inputRef])
}

/** Why the list would open or close (the combobox's reasons). */
type OpenChangeDetails = { reason: string; event: Event }

/**
 * When the list is open: while the field has focus (`focused`), but once
 * Escape dismissed it (`open` false), until the user types, clicks in the
 * field or presses ↓. Focus within the field, its help or its list
 * (`inPopup`) is still the field's: a press on the field's own parts, or
 * focus moving into its popups, keeps it open. `settled` is false while
 * the user types (`markTyping`), until typing pauses; `leave` is focus
 * leaving the field, its change sent at once.
 */
function useListOpen(
  group: HTMLElement | null,
  inPopup: (element: Element | null | undefined) => boolean,
  flush: () => void
) {
  const [focused, setFocused] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [settled, setSettled] = React.useState(true)
  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  React.useEffect(() => () => clearTimeout(settleTimer.current), [])
  const markTyping = () => {
    setSettled(false)
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => setSettled(true), TYPING_PAUSE)
  }
  const leave = () => {
    setFocused(false)
    setOpen(false)
    setSettled(true)
    flush()
  }
  const onOpenChange = (next: boolean, details: OpenChangeDetails) => {
    if (!next && details.reason === "item-press") return
    // A press on the field's own parts around the input (its clear and
    // help buttons, an underlined problem, its icon): the list knows only
    // the input as its own, but these are the field's too.
    if (!next && details.reason === "outside-press") {
      const target = details.event.target
      if (target instanceof Node && group?.contains(target)) return
    }
    if (!next && details.reason === "focus-out") {
      const target = (details.event as FocusEvent | undefined)
        ?.relatedTarget as Element | null
      if (inPopup(target) || inPopup(document.activeElement)) return
    }
    setOpen(next)
  }
  return {
    focused,
    open,
    setOpen,
    settled,
    setSettled,
    markTyping,
    /** Focus came to the field: its list opens. */
    focus: () => {
      setFocused(true)
      setOpen(true)
    },
    leave,
    onOpenChange,
  }
}

export {
  useCaret,
  useFieldWidth,
  useHandoff,
  useKeepFocus,
  useListOpen,
  useMirror,
  useQueryDraft,
}
export type { QueryHandoff }
