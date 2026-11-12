/**
 * An edit in progress, as the controller (`index.tsx`) and the editors it
 * draws (`editor.tsx`, `options.tsx`, `date.tsx`) share it: one per table
 * at a time, from the key or press that begins it to the save or cancel
 * that ends it.
 */
import type { Translator } from "../../i18n/translations"
import type { DataTableContextValue } from "../context"
import type { EditStart, SaveMove } from "../edits"
import type { ParseResult } from "../cell-parse"
import type { DataTableValue, EngineColumn } from "../engine/index"

/**
 * Where focus goes once an edit is saved: down (Enter), up (Shift +
 * Enter), to the next or previous cell that can be written (Tab, Shift +
 * Tab), or nowhere (`null`: it stays on the cell).
 */
type EditMove = SaveMove | null

/** What a draft writes: the text typed (read as the column's value), or a value. */
type Draft =
  | { text: string }
  | {
      value: DataTableValue
      /** Shown with a message if the save fails; the value formatted otherwise. */
      attempted?: string
    }

type FinishOptions = {
  /** Saves the draft; `false` drops it. */
  commit: boolean
  /** Where focus goes once saved. */
  move?: EditMove
  /**
   * A draft that is not valid ends the edit anyway, its cell showing the
   * message with the text refused (the edit ends without the user's say:
   * focus went elsewhere); otherwise the editor stays, with the message.
   */
  markInvalid?: boolean
  /** What to write in place of the editor's draft (a day picked, an option chosen). */
  draft?: Draft
  event?: Event
}

type EditController = {
  context: DataTableContextValue<unknown>
  t: () => Translator<"dataTable">
  /** Ends the edit (see `FinishOptions`); `false` when it stays (its draft not valid). */
  finish: (session: Session, options: FinishOptions) => boolean
  /** A text typed, read as the column's value, as a save reads it. */
  parse: (
    column: EngineColumn<unknown>,
    item: unknown,
    text: string
  ) => ParseResult
}

type Session = {
  readonly row: string
  readonly column: string
  readonly how: EditStart
  /**
   * The text the edit began with: the value as text, the character typed,
   * a failed save's text (a custom editor's `initialText`).
   */
  readonly initialText: string
  /**
   * The value's own text when the edit began with it (not typed, not a
   * failed save's): a draft still equal to it is no change, and is not
   * written.
   */
  readonly own: string | null
  /** The editor's text as typed, kept for a remount of the editor. */
  draft: string
  /**
   * Where the caret and selection go as the editor takes focus (a field
   * before the editing code taken over); `null`: the caret at the end.
   */
  selection: {
    start: number
    end: number
    direction: "forward" | "backward" | "none"
  } | null
  /** A custom editor's value, likewise. */
  value: DataTableValue
  /** The draft now: the editor's, once it is drawn; until then, `draft` and `value`'s. */
  read: () => Draft | null
  /** Focus is in the editor, its popups (portalled) included. */
  focused: boolean
  /** Focuses the editor. */
  focus: () => void
  /** The cell, once the editor is in it. */
  cell: HTMLTableCellElement | null
  /** The editors drawing it now: none, and the edit was not ended, ends it. */
  mounted: number
  closed: boolean
  readonly controller: EditController
}

export type { Draft, EditController, EditMove, FinishOptions, Session }
