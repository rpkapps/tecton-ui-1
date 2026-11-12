"use client"

/**
 * The cell editors (§4.1's editor column, §6's editing cell), drawn by the
 * row of the cell being edited in place of its content:
 *
 * - text: an input; a `wrap` column's, a textarea (Enter saves, Shift +
 *   Enter is a new line), the cell growing with its lines;
 * - number: an input (`inputMode="decimal"`), read in the locale;
 * - date: an input read in the locale, and a calendar from the cell (Alt +
 *   Down, or its button), loaded apart (`date.tsx`);
 * - options: a combobox (`options.tsx`, loaded apart), a field with the
 *   same text until it is there;
 * - a column's `renderEditor`: its own, over the cell, Enter, Tab and
 *   Escape (that it does not take itself) saving and cancelling as above.
 *
 * Flush: the cell keeps its padding, its size and where its text is. Its
 * content stays under the editor, unseen, holding the cell's size to the
 * pixel; the editor lies over it, transparent and borderless, in the
 * cell's font and alignment, and the cell's own focus ring outlines it
 * (`cell.tsx`). Popups open from the cell, in Tecton's portal.
 *
 * Focus leaving the editor saves: at once for another cell (rendered once
 * the table has moved focus there) and for an element of the page no popup
 * holds (a button: rendered at once, so a click there sees the value); for
 * a popup, or no element, once focus has settled (a microtask): focus
 * going into the editor's own popups (portalled, but in its React tree, so
 * their focus events reach it) keeps the edit, and so does focus going to
 * another window (it stays on the field, to come back to).
 *
 * The editor is named by its column and its row ("Depth, Troll A-1"); a
 * draft that is not valid makes it `aria-invalid`, described by the
 * message, which a tooltip on the cell shows too (`cell-error.tsx`).
 */
import * as React from "react"
import { flushSync } from "react-dom"
import { cn } from "cn"
import { CalendarIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { usePortalTarget } from "@tecton/react/tecton/portal"

import { useTranslations } from "../../i18n/translations"
import type { CellEditorProps } from "../context"
import type { DataTableEditorProps, DataTableValue } from "../engine/index"
import { AREA, BOX } from "../edit-field"
import { useFeature } from "../lazy"
import {
  FLUSH,
  FLUSH_FIELD,
  Holder,
  keyMove,
  OPTION_FIELD,
  runKey,
  type EditorParts,
} from "./parts"
import type { EditMove, Session } from "./session"

/** Text and numbers: an input, a textarea in a `wrap` column. */
function TextEditor({
  session,
  column,
  display,
  field,
  target,
  wrap,
}: EditorParts & { wrap: boolean }) {
  const [draft, setDraft] = React.useState(session.draft)
  React.useInsertionEffect(() => {
    session.draft = draft
    session.read = () => ({ text: draft })
  })
  const multiline = wrap && column.type === "text"
  const onKeyDown = (event: React.KeyboardEvent) => {
    const move = keyMove(event, multiline)
    if (move) runKey(session, event, move)
  }
  if (multiline)
    return (
      <>
        {/* The draft, wrapped as the textarea and the cell wrap it
            (`whitespace-pre-wrap`): the cell grows with its lines. */}
        <span
          aria-hidden
          className="invisible block break-words whitespace-pre-wrap"
        >
          {draft}
          {"​"}
        </span>
        {/* A plain text area: the cell is all of its look (the input's
            component would bring only classes to undo). */}
        <textarea
          ref={target as React.RefObject<HTMLTextAreaElement | null>}
          {...field}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(FLUSH, AREA)}
        />
      </>
    )
  return (
    <>
      <Holder>{display}</Holder>
      {/* A plain input, as the field before the editing code is
          (`edit-field.tsx`): the cell is all of its look. */}
      <input
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        // Phones show digits; iOS's keypad has no minus (a column of
        // negative numbers can draw its own editor, `renderEditor`).
        inputMode={column.type === "number" ? "decimal" : undefined}
        autoComplete="off"
        className={FLUSH}
      />
    </>
  )
}

/**
 * A date: its text, and a calendar from the cell (Alt + Down, the button),
 * whose popover loads apart (`date.tsx`): asked for as it opens, it shows
 * once it is there.
 */
function DateEditor(parts: EditorParts) {
  const { session, display, field, target } = parts
  const t = useTranslations("dataTable")
  const [draft, setDraft] = React.useState(session.draft)
  const [open, setOpen] = React.useState(false)
  const { module, load } = useFeature("editingDate", true)
  React.useInsertionEffect(() => {
    session.draft = draft
    session.read = () => ({ text: draft })
  })
  // Asked for with Alt + Down: opened once the editor is laid out.
  React.useEffect(() => {
    if (session.how === "popup") setOpen(true)
  }, [session])
  React.useEffect(() => {
    if (open && !module) load()
  }, [open, module, load])
  const DatePopup = module?.DatePopup
  return (
    <>
      <Holder>{display}</Holder>
      <input
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" &&
            event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            event.preventDefault()
            setOpen(true)
            return
          }
          const move = keyMove(event, false)
          if (move) runKey(session, event, move)
        }}
        autoComplete="off"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={FLUSH}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        // The keyboard's way is Alt + Down, from the field.
        tabIndex={-1}
        aria-label={t("chooseDate")}
        aria-haspopup="dialog"
        aria-expanded={open}
        // The field keeps focus.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((was) => !was)}
        // In the cell's end padding (16 px), clear of its 2 px focus ring:
        // the text keeps all its room.
        className="absolute -end-3 top-1/2 h-6 w-3 -translate-y-1/2 rounded-sm"
      >
        <CalendarIcon className="size-3" />
      </Button>
      {DatePopup && (
        <DatePopup
          {...parts}
          draft={draft}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}

/**
 * An options column: its combobox (`options.tsx`), loaded apart; until it
 * is there, a field with the same text, so typing goes on (Enter and Tab
 * save the first option the text matches, as the combobox does).
 */
function OptionsEditor(parts: EditorParts) {
  const { session, display, field, target } = parts
  const { module, load } = useFeature("editingOptions", true)
  React.useEffect(() => {
    if (!module) load()
  }, [module, load])
  const [text, setText] = React.useState(session.draft)
  const [typed, setTyped] = React.useState(session.how === "type")
  React.useInsertionEffect(() => {
    session.draft = text
  })
  const change = (next: string, byUser: boolean) => {
    setText(next)
    if (byUser) setTyped(true)
  }
  const Combobox = module?.OptionsCombobox
  if (Combobox)
    return (
      <Combobox {...parts} text={text} onTextChange={change} typed={typed} />
    )
  return (
    <>
      <Holder>{display}</Holder>
      <input
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        value={text}
        onChange={(event) => change(event.target.value, true)}
        onKeyDown={(event) => {
          const move = keyMove(event, false)
          if (move) runKey(session, event, move)
        }}
        autoComplete="off"
        className={cn(FLUSH, OPTION_FIELD)}
      />
    </>
  )
}

/** Where a custom editor's `commit` moves. */
const MOVES: Record<
  NonNullable<
    NonNullable<Parameters<DataTableEditorProps<unknown>["commit"]>[0]>["move"]
  >,
  EditMove
> = {
  down: "down",
  up: "up",
  next: "next",
  previous: "previous",
  none: null,
}

/** A column's `renderEditor`, over the cell, with the table's keys. */
function CustomEditor({
  session,
  column,
  item,
  display,
  field,
  error,
  target,
  render,
}: EditorParts & {
  render: (props: DataTableEditorProps<unknown>) => React.ReactNode
}) {
  const [value, setValue] = React.useState(session.value)
  // Read by a commit in the same moment as the change.
  const latest = React.useRef(value)
  React.useInsertionEffect(() => {
    session.value = latest.current
    session.read = () => ({ value: latest.current })
  })
  const { finish } = session.controller
  const ref = React.useCallback(
    (element: HTMLElement | null) => {
      target.current = element
    },
    [target]
  )
  const props: DataTableEditorProps<unknown> = {
    item,
    column: column.id,
    value,
    initialText: session.initialText,
    onValueChange: (next: DataTableValue) => {
      latest.current = next
      setValue(next)
    },
    commit: (options) =>
      finish(session, {
        commit: true,
        move: MOVES[options?.move ?? "none"],
      }),
    cancel: () => finish(session, { commit: false }),
    error,
    inputProps: { ref, ...field, className: FLUSH_FIELD },
  }
  return (
    <>
      <Holder>{display}</Holder>
      <span
        className="absolute inset-0 flex items-center"
        onKeyDown={(event) => {
          // Its own keys (a list's Enter) are prevented; a popup's are not its.
          if (
            event.defaultPrevented ||
            !event.currentTarget.contains(event.target as Node)
          )
            return
          const move = keyMove(event, false)
          if (move) runKey(session, event, move)
        }}
      >
        {render(props)}
      </span>
    </>
  )
}

/** A draft's message: the editor's description, and a tooltip on the cell. */
function EditorMessage({
  id,
  message,
  cell,
}: {
  id: string
  message: string
  cell: React.RefObject<HTMLElement | null>
}) {
  const { module, load } = useFeature("cellError", true)
  React.useEffect(() => {
    if (!module) load()
  }, [module, load])
  const Tip = module?.DataTableCellErrorTip
  return (
    <>
      <span id={id} hidden>
        {message}
      </span>
      {Tip && <Tip message={message} cell={cell} />}
    </>
  )
}

/** The editor of the cell being edited, by its column's type (see the module comment). */
function CellEditor({ editing, column, item, display, wrap }: CellEditorProps) {
  const session = editing.session as Session
  const { controller } = session
  const t = useTranslations("dataTable")
  const box = React.useRef<HTMLSpanElement | null>(null)
  const target = React.useRef<HTMLElement | null>(null)
  const cell = React.useRef<HTMLElement | null>(null)
  /** A save waiting for focus to settle: a focus in the editor drops it. */
  const leaving = React.useRef(0)
  /** Tecton's overlay container, where popups are (else `document.body`). */
  const portal = usePortalTarget()
  const messageId = React.useId()
  const { error } = editing
  const rowName = controller.context.store.get().model.textOf(session.row)
  const field = {
    "aria-label": t("editorLabel", { columnName: column.header, rowName }),
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? messageId : undefined,
  }

  React.useLayoutEffect(() => {
    const element = box.current
    const own = element?.closest<HTMLTableCellElement>("td, th") ?? null
    cell.current = own
    session.cell = own
    session.focus = () => target.current?.focus({ preventScroll: true })
    session.mounted++
    // Focus, the caret at the end of the text (or where a field before
    // the editing code had it).
    const field = target.current
    if (field && !element?.contains(field.ownerDocument.activeElement)) {
      field.focus({ preventScroll: true })
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      ) {
        const end = field.value.length
        const { selection } = session
        if (selection)
          field.setSelectionRange(
            Math.min(selection.start, end),
            Math.min(selection.end, end),
            selection.direction
          )
        else field.setSelectionRange(end, end)
      }
    }
    session.selection = null
    return () => {
      session.mounted--
      // Gone without the edit ending (its row moved away): it ends, saved.
      // A remount (Strict Mode) keeps it.
      queueMicrotask(() => {
        if (!session.closed && session.mounted === 0)
          controller.finish(session, { commit: true, markInvalid: true })
      })
    }
  }, [session, controller])

  const onFocus = () => {
    leaving.current++
    session.focused = true
  }
  const onBlur = (event: React.FocusEvent) => {
    session.focused = false
    const left = event.target
    const to = event.relatedTarget as Node | null
    const blurred = event.nativeEvent
    const save = () =>
      controller.finish(session, {
        commit: true,
        markInvalid: true,
        event: blurred,
      })
    const token = ++leaving.current
    if (to && !box.current?.contains(to)) {
      // To another cell, or anything else of the table: saved at once,
      // rendered once the table has moved focus there (an editor going in
      // the middle of that move would take focus back to its cell).
      if (session.cell?.closest("table")?.contains(to)) return save()
      // To an element of the page that no popup holds (a button): saved
      // at once, and rendered, so a press there (even one in the same
      // task) sees the value. A popup may be the editor's own: its focus
      // reaches the editor through React's tree, so that waits.
      if (
        !(to instanceof Element && to.closest("[data-base-ui-portal]")) &&
        !portal?.contains(to)
      ) {
        // The application's update rendered too, before the press goes on.
        if (!session.closed) flushSync(save)
        return
      }
    }
    // Into a popup, or nowhere: once focus has settled, into the editor
    // again (its popup), or still on the field (another window took
    // focus), the edit goes on.
    const doc = event.currentTarget.ownerDocument
    queueMicrotask(() => {
      if (session.closed || token !== leaving.current) return
      if (doc.activeElement === left) {
        session.focused = true
        return
      }
      save()
    })
  }

  const parts: EditorParts = {
    session,
    column,
    item,
    display,
    field,
    error,
    target,
    cell,
  }
  const render = column.definition.renderEditor as
    ((props: DataTableEditorProps<unknown>) => React.ReactNode) | undefined
  return (
    <span
      ref={box}
      data-slot="data-table-editor"
      className={BOX}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {render ? (
        <CustomEditor {...parts} render={render} />
      ) : column.type === "options" ? (
        <OptionsEditor {...parts} />
      ) : column.type === "date" ? (
        <DateEditor {...parts} />
      ) : (
        <TextEditor {...parts} wrap={wrap} />
      )}
      {error && <EditorMessage id={messageId} message={error} cell={box} />}
    </span>
  )
}

export { CellEditor }
