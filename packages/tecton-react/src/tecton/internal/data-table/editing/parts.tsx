"use client"

/**
 * What the editors share (`editor.tsx`, and the pieces loaded apart:
 * `options.tsx`, `date.tsx`): how a field lies flush over its cell, the
 * cell's content held under it, and the keys that save, move and cancel
 * (the field before this code has them too: `edit-field.tsx`).
 */
import * as React from "react"

import type { CellEditorProps } from "../context"
import {
  FLUSH,
  FLUSH_FIELD,
  Holder,
  keyMove,
  OPTION_FIELD,
  type KeyMove,
} from "../edit-field"
import type { Session } from "./session"

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
