"use client"

/**
 * An edit's field before the editing code has come (`edits.tsx`), and
 * what it shares with the editors (`editing/`): how a field lies flush
 * over its cell, the cell's content held under it, a value as an editor's
 * text, and the keys that save, move and cancel.
 *
 * The field is the browser's own `<input>` (a `<textarea>` in a `wrap`
 * column), in the cell as the editor is, with the editor's name, classes
 * and caret: everything typed in it (selections, shortcuts, undo, an input
 * method) is the browser's. Enter, Tab and Escape end it as they end an
 * editor (`close`), and so does focus leaving it. Once the code is there,
 * the editor takes its text, selection and focus over (`take`, in
 * `editing/index.tsx`).
 */
import * as React from "react"
import { cn } from "cn"

import type { CellEditorProps } from "./context"
import type { EditStart, SaveMove } from "./edits"
import type { DataTableValue, EngineColumn, Formatter } from "./engine/index"

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

/** A text area's classes (the cell grows with its lines, `editor.tsx`). */
const AREA = "resize-none overflow-hidden"

/** Ends a text area's lines as they lay out: a last empty line has its height. */
const LINE_END = "\u200b"

/** The editor's box in the cell. */
const BOX = "relative block min-h-[1lh]"

/** The cell's content as it shows, unseen under the editor: the cell keeps its size. */
function Holder({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="invisible">
      {children}
    </span>
  )
}

type KeyMove = SaveMove | "cancel"

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

/**
 * A number as its editor shows it: every digit it has (the shortest that
 * reads back as it), in the locale, without grouping or an exponent, with
 * the column's currency, percent sign or unit.
 */
function numberText(
  value: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: string
) {
  if (!Number.isFinite(value)) return String(value)
  const {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    signDisplay,
  } = format ?? {}
  // The decimals of its shortest digits, the exponent of a very small or
  // large number counted; a percent shows its value times 100: two fewer.
  const [mantissa, exponent] = value.toExponential().split("e")
  const decimals =
    (mantissa.split(".")[1]?.length ?? 0) -
    Number(exponent) -
    (style === "percent" ? 2 : 0)
  const digits = Math.min(100, Math.max(0, decimals))
  return new Intl.NumberFormat(locale, {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    signDisplay,
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** A cell's value as its editor's text. */
function editText(
  column: EngineColumn<unknown>,
  value: DataTableValue,
  formatter: Formatter<unknown>
) {
  if (value === null || value === undefined) return ""
  if (column.type === "text") return String(value)
  if (column.type === "number" && typeof value === "number")
    return numberText(value, column.format, formatter.locale)
  return formatter.format(column, value)
}

/** The field before the editing code (see the module comment). */
type FieldSession = {
  readonly kind: "field"
  readonly row: string
  readonly column: string
  readonly how: EditStart
  /** The text it began with. */
  readonly initialText: string
  /** The value's own text when it began with it (not typed, not refused). */
  readonly own: string | null
  /** The editor's name ("Depth, Troll A-1"). */
  readonly label: string
  /** The field, once it is in the cell. */
  element: HTMLInputElement | HTMLTextAreaElement | null
  /** Its text when it went (a field drawn again begins with it). */
  draft: string
  /** An input method is composing in it. */
  composing: boolean
  /** Ended, or taken over by the editor. */
  closed: boolean
  /** The fields drawing it (none, and it was not ended: it ends, saved). */
  mounted: number
  /** Ends it: saved (`commit`) and moved, or dropped. */
  close: (commit: boolean, move?: SaveMove | null, event?: Event) => void
}

function isFieldSession(session: object): session is FieldSession {
  return (session as Partial<FieldSession>).kind === "field"
}

/** A field before the editing code (see the module comment). */
function FieldEditor({ editing, column, display, wrap }: CellEditorProps) {
  const session = editing.session as FieldSession
  const field = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const lines = React.useRef<HTMLSpanElement>(null)
  // A custom editor's column: a plain field until its editor is there.
  const custom = column.definition.renderEditor !== undefined
  const multiline = wrap && column.type === "text" && !custom
  React.useLayoutEffect(() => {
    const element = field.current
    session.element = element
    session.mounted++
    if (lines.current) lines.current.textContent = `${session.draft}${LINE_END}`
    // Focus, the caret at the end of the text.
    if (element && element.ownerDocument.activeElement !== element) {
      element.focus({ preventScroll: true })
      element.setSelectionRange(element.value.length, element.value.length)
    }
    return () => {
      if (element) session.draft = element.value
      session.mounted--
      // Gone without the edit ending (its row moved away): saved.
      queueMicrotask(() => {
        if (!session.closed && session.mounted === 0) session.close(true)
      })
    }
  }, [session])
  const props = {
    ref: field,
    "aria-label": session.label,
    defaultValue: session.draft,
    autoComplete: "off",
    onKeyDown: (event: React.KeyboardEvent) => {
      const move = keyMove(event, multiline)
      if (!move) return
      event.preventDefault()
      event.stopPropagation()
      if (move === "cancel") session.close(false)
      else session.close(true, move, event.nativeEvent)
    },
    // Focus leaving it saves; focus going to another window keeps it.
    onBlur: (event: React.FocusEvent) => {
      if (session.closed) return
      if (event.relatedTarget) return session.close(true)
      const element = event.currentTarget
      queueMicrotask(() => {
        if (!session.closed && element.ownerDocument.activeElement !== element)
          session.close(true)
      })
    },
    onCompositionStart: () => {
      session.composing = true
    },
    onCompositionEnd: () => {
      session.composing = false
    },
  }
  return (
    <span data-slot="data-table-editor" className={BOX}>
      {multiline ? (
        <>
          <span
            ref={lines}
            aria-hidden
            className="invisible block break-words whitespace-pre-wrap"
          />
          <textarea
            {...props}
            onInput={(event) => {
              if (lines.current)
                lines.current.textContent = `${event.currentTarget.value}${LINE_END}`
            }}
            className={cn(FLUSH, AREA)}
          />
        </>
      ) : (
        <>
          <Holder>{display}</Holder>
          <input
            {...props}
            inputMode={column.type === "number" ? "decimal" : undefined}
            className={cn(
              FLUSH,
              column.type === "options" && !custom && OPTION_FIELD
            )}
          />
        </>
      )}
    </span>
  )
}

export {
  AREA,
  BOX,
  editText,
  FieldEditor,
  FLUSH,
  FLUSH_FIELD,
  Holder,
  isFieldSession,
  keyMove,
  numberText,
  OPTION_FIELD,
}
export type { FieldSession, KeyMove }
