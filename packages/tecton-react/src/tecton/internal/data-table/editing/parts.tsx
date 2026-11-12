"use client"

/**
 * What the editors share (`editor.tsx`, and the pieces loaded apart:
 * `options.tsx`, `date.tsx`): how a field lies flush over its cell, the
 * cell's content held under it, and the keys that save, move and cancel.
 */
import * as React from "react"

import type { CellEditorProps } from "../context"
import type { EditMove, Session } from "./session"

/**
 * A field flush with its cell: no border, fill, shadow or ring of its own
 * (the cell's focus ring outlines it), the cell's text size and alignment.
 * A custom editor's field gets it (`inputProps.className`): it makes
 * Tecton's `Input` flush too.
 */
const FLUSH_FIELD =
  "h-full w-full min-w-0 rounded-none border-0 bg-transparent p-0 text-[length:inherit] shadow-none outline-none transition-none [text-align:inherit] focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 md:text-[length:inherit] dark:bg-transparent dark:aria-invalid:ring-0"

/** A field over the cell's content, as big as it. */
const FLUSH = `absolute inset-0 ${FLUSH_FIELD}`

/**
 * An options field: its text where the option's badge has its label (in
 * by the badge's padding and border, `px-2` and 1 px; in its size and
 * weight), so the label does not move as the editor opens.
 */
const OPTION_FIELD =
  "px-[calc(--spacing(2)+1px)] text-xs font-medium md:text-xs"

/** The cell's content as it shows, unseen under the editor: the cell keeps its size. */
function Holder({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="invisible">
      {children}
    </span>
  )
}

type KeyMove = Exclude<EditMove, null> | "cancel"

/** What Enter, Tab and Escape do in an editor; `undefined` for a key that is its own. */
function keyMove(
  event: React.KeyboardEvent,
  multiline: boolean
): KeyMove | undefined {
  // An input method's keys are its own: Enter picks its candidate.
  if (event.nativeEvent.isComposing || event.keyCode === 229) return undefined
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined
  switch (event.key) {
    case "Enter":
      if (multiline && event.shiftKey) return undefined
      return event.shiftKey ? "up" : "down"
    case "Tab":
      return event.shiftKey ? "previous" : "next"
    case "Escape":
      return "cancel"
  }
  return undefined
}

/** Saves and moves, or cancels, by a key's move. */
function runKey(session: Session, event: React.KeyboardEvent, move: KeyMove) {
  event.preventDefault()
  event.stopPropagation()
  const { finish } = session.controller
  if (move === "cancel") finish(session, { commit: false })
  else finish(session, { commit: true, move, event: event.nativeEvent })
}

/** What each editor is given. */
type EditorParts = Pick<CellEditorProps, "column" | "item" | "display"> & {
  session: Session
  /** The editor's name, invalid state and description. */
  field: {
    "aria-label": string
    "aria-invalid": true | undefined
    "aria-describedby": string | undefined
  }
  error: string | null
  /** The element that takes focus. */
  target: React.RefObject<HTMLElement | null>
  /** The cell, which popups open from. */
  cell: React.RefObject<HTMLElement | null>
}

/**
 * Focuses an editor's field that comes in place of another (a piece
 * loaded): focus was in the editor, or went with the field before it.
 */
function useTakeFocus(
  session: Session,
  target: React.RefObject<HTMLElement | null>
) {
  React.useLayoutEffect(() => {
    const field = target.current
    const doc = field?.ownerDocument
    if (!field || !doc) return
    if (!session.focused && doc.activeElement !== doc.body) return
    field.focus({ preventScroll: true })
    if (field instanceof HTMLInputElement)
      field.setSelectionRange(field.value.length, field.value.length)
  }, [session, target])
}

export {
  FLUSH,
  FLUSH_FIELD,
  Holder,
  keyMove,
  OPTION_FIELD,
  runKey,
  useTakeFocus,
}
export type { EditorParts, KeyMove }
