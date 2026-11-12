"use client"

/**
 * The cell editors (§4.1's editor column, §6's editing cell), drawn by the
 * row of the cell being edited in place of its content:
 *
 * - text: an input; a `wrap` column's, a textarea (Enter saves, Shift +
 *   Enter is a new line), the cell growing with its lines;
 * - number: an input (`inputMode="decimal"`), read in the locale;
 * - date: an input read in the locale, and a calendar from the cell (Alt +
 *   Down, or its button): a day picked is saved;
 * - options: a combobox, its list of the options' badges from the cell,
 *   the options matching what is typed; Enter and Tab save the option
 *   highlighted, a click the option clicked;
 * - a column's `renderEditor`: its own, over the cell, Enter, Tab and
 *   Escape (that it does not take itself) saving and cancelling as above.
 *
 * Flush: the cell keeps its padding, its size and where its text is. Its
 * content stays under the editor, unseen, holding the cell's size to the
 * pixel; the editor lies over it, transparent and borderless, in the
 * cell's font and alignment, and the cell's own focus ring outlines it
 * (`cell.tsx`). Popups open from the cell, in Tecton's portal.
 *
 * The editor is named by its column and its row ("Depth, Troll A-1"); a
 * draft that is not valid makes it `aria-invalid`, described by the
 * message, which a tooltip on the cell shows too (`cell-error.tsx`).
 */
import * as React from "react"
import { cn } from "cn"
import { CalendarIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/components/combobox"
import { Input } from "@tecton/react/components/input"
import { Popover, PopoverContent } from "@tecton/react/components/popover"
import { useDirection, useLocale } from "@tecton/react/tecton/provider"

import { useTranslations } from "../../i18n/translations"
import { CalendarPlaceholder } from "../calendar-placeholder"
import type { CellEditorProps } from "../context"
import { foldText } from "../engine/format"
import type {
  DataTableEditorProps,
  DataTableOption,
  DataTableValue,
  EngineColumn,
} from "../engine/index"
import { dayOf, startOfDay, toDate } from "../engine/values"
import { useFeature } from "../lazy"
import type { EditMove, Session } from "./session"

/**
 * A field over the cell's content: its size, the cell's font, size and
 * alignment, no border, fill or ring of its own.
 */
const FLUSH =
  "absolute inset-0 h-full w-full min-w-0 rounded-none border-0 bg-transparent p-0 text-[length:inherit] shadow-none transition-none [text-align:inherit] focus-visible:ring-0 aria-invalid:ring-0 md:text-[length:inherit] dark:aria-invalid:ring-0"

/** The same for a custom editor's own field (`inputProps.className`). */
const FLUSH_CUSTOM =
  "h-full w-full min-w-0 bg-transparent p-0 [font:inherit] [text-align:inherit] outline-none"

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

/** Saves and moves, or cancels, by a key's move; whether the key was taken. */
function runKey(session: Session, event: React.KeyboardEvent, move: KeyMove) {
  event.preventDefault()
  event.stopPropagation()
  const { finish } = session.controller
  if (move === "cancel") finish(session, { commit: false })
  else finish(session, { commit: true, move, event: event.nativeEvent })
}

/** What each editor is given. */
type EditorParts = {
  session: Session
  column: EngineColumn<unknown>
  item: unknown
  display: React.ReactNode
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
  /** The editor's popup: focus in it is still the edit's. */
  popup: React.RefObject<HTMLElement | null>
}

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
        {/* The draft, wrapped as the textarea wraps it: the cell grows with its lines. */}
        <span
          aria-hidden
          className="invisible block break-words whitespace-pre-wrap"
        >
          {draft}
          {"\u200b"}
        </span>
        {/* A plain text area: the cell is all of its look (the input's
            component would bring only classes to undo). */}
        <textarea
          ref={target as React.RefObject<HTMLTextAreaElement | null>}
          {...field}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(FLUSH, "resize-none overflow-hidden outline-none")}
        />
      </>
    )
  return (
    <>
      <Holder>{display}</Holder>
      <Input
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        inputMode={column.type === "number" ? "decimal" : undefined}
        autoComplete="off"
        className={FLUSH}
      />
    </>
  )
}

/**
 * A date: its text, and a calendar from the cell (Alt + Down, the button).
 * A day picked keeps the value's time of day, in the column's time zone.
 */
function DateEditor({
  session,
  column,
  item,
  display,
  field,
  target,
  cell,
  popup,
}: EditorParts) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const direction = useDirection()
  const [draft, setDraft] = React.useState(session.draft)
  const [open, setOpen] = React.useState(false)
  const { module, load } = useFeature("dateInput", true)
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
  const { timeZone } = (column.format ?? {}) as Intl.DateTimeFormatOptions
  const { controller } = session
  const parsed = controller.parse(column, item, draft)
  const date = "value" in parsed ? toDate(parsed.value) : undefined
  const shown = date && dayOf(date, timeZone)
  const pick = (day: Date) => {
    const start = startOfDay(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      timeZone
    )
    // The time of day of the value before (its draft's, else its own).
    const before = date ?? toDate(column.getValue(item))
    const own = before && dayOf(before, timeZone)
    const time = own
      ? before.getTime() -
        startOfDay(own.year, own.month, own.day, timeZone).getTime()
      : 0
    const value = new Date(start.getTime() + time)
    controller.finish(session, { commit: true, draft: { value } })
  }
  const DateCalendar = module?.DateCalendar
  return (
    <>
      <Holder>{display}</Holder>
      <Input
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
        // In the cell's end padding: the text keeps all its room.
        className="absolute -end-4 top-1/2 h-6 w-4 -translate-y-1/2 rounded-sm"
      >
        <CalendarIcon className="size-3.5" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent
          ref={popup as React.RefObject<HTMLDivElement | null>}
          anchor={cell}
          align="start"
          aria-label={t("chooseDate")}
          dir={direction}
          // The calendar focuses its day itself; closing, back to the field.
          initialFocus={false}
          finalFocus={target}
          className="w-auto"
        >
          {DateCalendar ? (
            <DateCalendar
              value={shown && new Date(shown.year, shown.month, shown.day)}
              onValueChange={pick}
              locale={locale}
              dir={direction}
              fallback={<CalendarPlaceholder />}
            />
          ) : (
            <CalendarPlaceholder />
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}

/**
 * An options column: a combobox over the cell, its list from the cell.
 * Every option shows until the user types; then those whose label holds
 * the text (case and accents aside), the first highlighted. Enter and Tab
 * save the option highlighted, else the text (read as an option's label or
 * value: one that is neither is refused); a click saves the option.
 */
function OptionsEditor({
  session,
  column,
  item,
  display,
  field,
  target,
  cell,
  popup,
}: EditorParts) {
  const t = useTranslations("dataTable")
  const direction = useDirection()
  const { options } = column
  const [text, setText] = React.useState(session.draft)
  const [typed, setTyped] = React.useState(session.how === "type")
  const [open, setOpen] = React.useState(false)
  const highlighted = React.useRef<DataTableOption | undefined>(undefined)
  // Opened once the editor is laid out, from the cell.
  React.useEffect(() => setOpen(true), [])
  const index = column.optionIndex.get(String(column.getValue(item)))
  const selected = index === undefined ? null : options[index]
  const query = foldText(text.trim())
  const filtered = typed && query !== ""
  const shown = React.useMemo(
    () =>
      filtered
        ? options.filter((option) => foldText(option.label).includes(query))
        : options,
    [filtered, query, options]
  )
  React.useInsertionEffect(() => {
    session.draft = text
    session.read = () => {
      // The option highlighted; typed, the first that matches.
      const option = highlighted.current ?? (filtered ? shown[0] : undefined)
      return option
        ? { value: option.value, attempted: option.label }
        : { text }
    }
  })
  return (
    <Combobox<DataTableOption>
      items={options}
      filteredItems={shown}
      value={selected}
      inputValue={text}
      onInputValueChange={(next, details) => {
        setText(next)
        if (details.reason === "input-change") setTyped(true)
      }}
      onValueChange={(option) => {
        if (option)
          session.controller.finish(session, {
            commit: true,
            draft: { value: option.value, attempted: option.label },
          })
      }}
      open={open}
      onOpenChange={(next, details) => {
        // Escape cancels the edit (the field's own keys), not only the list.
        if (details.reason !== "escape-key") setOpen(next)
      }}
      autoHighlight
      onItemHighlighted={(option) => {
        highlighted.current = option
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <Holder>{display}</Holder>
      {/* The combobox's bare field: the cell is its frame. */}
      <ComboboxChipsInput
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        onKeyDown={(event) => {
          const move = keyMove(event, false)
          if (!move) return
          event.preventBaseUIHandler()
          runKey(session, event, move)
        }}
        autoComplete="off"
        className={cn(FLUSH, "outline-none")}
      />
      <ComboboxContent
        ref={popup as React.RefObject<HTMLDivElement | null>}
        anchor={cell}
        // In the table's direction wherever it is portalled.
        dir={direction}
        // As wide as the cell, or its badges and checks.
        className="w-auto min-w-(--anchor-width)"
      >
        <ComboboxEmpty>{t("noMatchingOptions")}</ComboboxEmpty>
        <ComboboxList>
          {(option: DataTableOption) => (
            <ComboboxItem key={option.value} value={option}>
              <Badge variant={option.variant ?? "outline"} appearance="outline">
                {option.label}
              </Badge>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
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
    inputProps: { ref, ...field, className: FLUSH_CUSTOM },
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
  const popup = React.useRef<HTMLElement | null>(null)
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
    session.owns = (node) =>
      node !== null &&
      (!!element?.contains(node) || !!popup.current?.contains(node))
    session.focus = () => target.current?.focus({ preventScroll: true })
    session.mounted++
    // Focus, the caret at the end of the text.
    const field = target.current
    if (field && !session.owns(field.ownerDocument.activeElement)) {
      field.focus({ preventScroll: true })
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      )
        field.setSelectionRange(field.value.length, field.value.length)
    }
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

  const onBlur = (event: React.FocusEvent) => {
    const to = event.relatedTarget as Node | null
    if (session.closed || session.owns(to)) return
    const blurred = event.nativeEvent
    const save = () =>
      controller.finish(session, {
        commit: true,
        markInvalid: true,
        event: blurred,
      })
    if (to) return save()
    // Focus gone nowhere in the page: once it has settled, another window
    // taking it leaves it on the editor (to come back to); a press on the
    // page outside any control does not.
    const doc = event.currentTarget.ownerDocument
    queueMicrotask(() => {
      if (!session.closed && !session.owns(doc.activeElement)) save()
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
    popup,
  }
  const render = column.definition.renderEditor as
    ((props: DataTableEditorProps<unknown>) => React.ReactNode) | undefined
  return (
    <span
      ref={box}
      data-slot="data-table-editor"
      className="relative block min-h-[1lh]"
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
