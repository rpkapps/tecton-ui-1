"use client"

import * as React from "react"
import { cn } from "cn"
import { ArrowUpIcon, SquareIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@tecton/react/components/input-group"
import { Kbd } from "@tecton/react/components/kbd"
import { Spinner } from "@tecton/react/components/spinner"
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"
import { useDirection } from "@tecton/react/tecton/provider"

/**
 * Tecton Composer — the message box of a chat: a textarea that grows with
 * its text, a toolbar with the send button, and optional suggestions and
 * attachment chips. Upstream shadcn has the conversation components
 * (`message`, `bubble`, `message-scroller`) but no composer, so this is
 * Tecton's.
 *
 * Keyboard: Enter sends, Shift+Enter is a new line, ⌘/Ctrl+Enter always
 * sends (and is the only way to send with `submitMode="mod-enter"`);
 * nothing sends while an IME is composing; Escape stops a reply that is
 * arriving. With `history`, ArrowUp on the first line of the box steps back
 * through the prompts sent before (the newest `historyLimit` of them) and
 * ArrowDown on the last line forward, back to the draft the box held when
 * browsing began (a terminal's history; sending ends browsing, typing in a
 * loaded prompt does not). With `ComposerCommands`, a `/` at the start of
 * the box opens a list of commands: ArrowUp and ArrowDown move through it,
 * Enter or Tab picks, Escape closes it. The textarea stays enabled while a
 * reply streams, and focus stays in it after sending.
 *
 * Announcements: the composer announces its own state changes (sent,
 * stopped, failed) in a polite status region; the transcript, a
 * `MessageScrollerContent` with `aria-busy` while a reply streams,
 * announces the messages.
 */

/** The chat's state, in the shape the AI SDK and TanStack AI use. */
type ComposerStatus = "ready" | "submitted" | "streaming" | "error"

type ComposerSubmitMode = "enter" | "mod-enter"

/** Where ArrowUp and ArrowDown have taken the box in `history`, and what it held before. */
type ComposerHistoryPosition = {
  /** The index of the entry in the box, among the entries the arrows reach. */
  index: number
  /**
   * The box's text while browsing, as loaded or as typed since: any other
   * text means it was changed from outside, which starts over.
   */
  text: string
  /** What the box held when browsing began, restored past the newest entry. */
  draft: string
}

type ComposerContextValue = {
  value: string
  /** A change from outside the textarea: it ends browsing `history`. */
  setValue: (value: string) => void
  /** The textarea's own change: typing in a loaded prompt keeps browsing, and the draft. */
  typeValue: (value: string) => void
  status: ComposerStatus
  isBusy: boolean
  disabled: boolean
  canSubmit: boolean
  submitMode: ComposerSubmitMode
  submit: () => void
  /** Sends `text` as it is, leaving the box alone: a suggestion that sends. */
  send: (text: string) => void
  stop: (() => void) | undefined
  focus: () => void
  /** Whether `history` has an entry to load, for the hint. */
  hasHistory: boolean
  /** Whether ArrowUp has taken the box into `history`, so ArrowDown can step forward. */
  isBrowsingHistory: () => boolean
  /**
   * Loads the next older or newer entry of `history` into the box, with
   * `current` the box's text; the text loaded, or undefined when there is
   * none that way.
   */
  stepHistory: (
    direction: "older" | "newer",
    current: string
  ) => string | undefined
  /**
   * The entry of `history` last loaded, while the user browses: the box
   * holding exactly it means the entry is unedited, so ArrowUp keeps
   * stepping and the command list stays shut on it.
   */
  historyEntry: string | undefined
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  /** The ids of the rendered `ComposerHint`s, for the textarea's `aria-describedby`. */
  hintIds: readonly string[]
  /** A `ComposerHint` mounts with `id`; returns the function that removes it. */
  registerHint: (id: string) => () => void
  /** Counts the replies the user stopped, so the status says so each time. */
  stopCount: number
  /** The open command list's keys, asked before the textarea's own; true when it took the key. */
  commandKeys: React.RefObject<
    ((event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean) | null
  >
  /** What the textarea says about the command list, for `aria-controls` and `aria-activedescendant`. */
  commandList: ComposerCommandListState | undefined
  setCommandList: (state: ComposerCommandListState | undefined) => void
}

type ComposerCommandListState = {
  listId: string
  open: boolean
  activeId: string | undefined
}

const ComposerContext = React.createContext<ComposerContextValue | null>(null)

function useComposerContext(part: string): ComposerContextValue {
  const context = React.useContext(ComposerContext)
  if (context === null) {
    throw new Error(`${part} must be rendered inside <Composer>.`)
  }
  return context
}

/** What a component outside the parts reads and does: the value, send, stop and focus. */
function useComposer() {
  const { value, setValue, status, isBusy, canSubmit, submit, stop, focus } =
    useComposerContext("useComposer")
  return { value, setValue, status, isBusy, canSubmit, submit, stop, focus }
}

type ComposerProps = Omit<
  React.ComponentProps<"form">,
  "onSubmit" | "defaultValue"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** The trimmed text; the box is cleared after it returns. */
  onSubmit: (message: { text: string }) => void
  /** Stops the reply that is arriving: Escape and the stop button call it. */
  onStop?: () => void
  status?: ComposerStatus
  /** `"mod-enter"` makes Enter a new line, for long-form input. */
  submitMode?: ComposerSubmitMode
  /**
   * The prompts the user has sent, oldest first: ArrowUp on the first line
   * of the box steps back through them, ArrowDown on the last line forward.
   * Never changed by the composer.
   */
  history?: readonly string[]
  /**
   * How many of the newest entries of `history` ArrowUp reaches; the older
   * ones are left out. Unset, all of them.
   */
  historyLimit?: number
  /** Disables the whole composer. */
  disabled?: boolean
}

function Composer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  submitMode = "enter",
  history,
  historyLimit,
  disabled = false,
  className,
  children,
  ...props
}: ComposerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [hintIds, setHintIds] = React.useState<readonly string[]>([])
  // Counted, not a flag: with two hints, one unmounting leaves the other.
  const registerHint = React.useCallback((id: string) => {
    setHintIds((ids) => [...ids, id])
    return () =>
      setHintIds((ids) => {
        const index = ids.indexOf(id)
        return index === -1 ? ids : ids.filter((_, at) => at !== index)
      })
  }, [])
  const [stopCount, setStopCount] = React.useState(0)
  const commandKeys = React.useRef<
    ((event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean) | null
  >(null)
  const [commandList, setCommandList] =
    React.useState<ComposerCommandListState>()
  // The part of `history` the arrows reach: its newest `historyLimit` entries.
  const recent = React.useMemo(() => {
    const entries = history ?? []
    if (historyLimit === undefined) return entries
    // Floored first: `slice(-0)` would be the whole history.
    const limit = Math.floor(historyLimit)
    return limit > 0 ? entries.slice(-limit) : []
  }, [history, historyLimit])
  const historyPosition = React.useRef<ComposerHistoryPosition | null>(null)
  const [historyEntry, setHistoryEntry] = React.useState<string>()
  // The position is read in key handlers, so it is a ref; the entry it
  // loaded is state too, for the parts that render from it.
  const setPosition = React.useCallback(
    (position: ComposerHistoryPosition | null) => {
      historyPosition.current = position
      setHistoryEntry(position === null ? undefined : recent[position.index])
    },
    [recent]
  )

  const commitValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange]
  )

  // A change from outside the textarea (a suggestion, a command, the app,
  // a send) ends browsing: the new text is the draft.
  const setValue = React.useCallback(
    (next: string) => {
      setPosition(null)
      commitValue(next)
    },
    [setPosition, commitValue]
  )

  // Typing in a loaded prompt keeps browsing, so ArrowDown past the newest
  // still brings back the draft the user had before; the edit itself goes
  // when they step away, as in a terminal.
  const typeValue = React.useCallback(
    (next: string) => {
      if (historyPosition.current !== null) {
        historyPosition.current = { ...historyPosition.current, text: next }
      }
      commitValue(next)
    },
    [commitValue]
  )

  const hasHistory = recent.some((entry) => entry.trim() !== "")
  const isBrowsingHistory = React.useCallback(
    () => historyPosition.current !== null,
    []
  )

  const stepHistory = React.useCallback(
    (direction: "older" | "newer", current: string): string | undefined => {
      const entries = recent
      let position = historyPosition.current
      // The box was changed from outside, or the history shrank: start over.
      if (
        position !== null &&
        (current !== position.text || position.index >= entries.length)
      ) {
        position = null
        setPosition(null)
      }
      const shown = position === null ? undefined : entries[position.index]
      // Blank entries, and a run of the same prompt, are stepped over.
      const skip = (entry: string) => entry === shown || entry.trim() === ""

      if (direction === "older") {
        let index = (position?.index ?? entries.length) - 1
        while (index >= 0 && skip(entries[index])) index -= 1
        if (index < 0) return undefined
        setPosition({
          index,
          text: entries[index],
          draft: position?.draft ?? current,
        })
        commitValue(entries[index])
        return entries[index]
      }

      if (position === null) return undefined
      let index = position.index + 1
      while (index < entries.length && skip(entries[index])) index += 1
      if (index >= entries.length) {
        setPosition(null)
        commitValue(position.draft)
        return position.draft
      }
      setPosition({ ...position, index, text: entries[index] })
      commitValue(entries[index])
      return entries[index]
    },
    [recent, setPosition, commitValue]
  )

  const isBusy = status === "submitted" || status === "streaming"
  const canSubmit = !disabled && !isBusy && value.trim() !== ""

  const focus = React.useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const submit = React.useCallback(() => {
    if (!canSubmit) return
    onSubmit({ text: value.trim() })
    setValue("")
    focus()
  }, [canSubmit, onSubmit, value, setValue, focus])

  const send = React.useCallback(
    (text: string) => {
      if (disabled || isBusy || text.trim() === "") return
      setPosition(null)
      onSubmit({ text: text.trim() })
      focus()
    },
    [disabled, isBusy, setPosition, onSubmit, focus]
  )

  const stop = React.useMemo(
    () =>
      onStop === undefined
        ? undefined
        : () => {
            if (!isBusy) return
            onStop()
            setStopCount((count) => count + 1)
          },
    [onStop, isBusy]
  )

  const context = React.useMemo<ComposerContextValue>(
    () => ({
      value,
      setValue,
      typeValue,
      status,
      isBusy,
      disabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      hasHistory,
      isBrowsingHistory,
      historyEntry,
      stepHistory,
      inputRef,
      hintIds,
      registerHint,
      stopCount,
      commandKeys,
      commandList,
      setCommandList,
    }),
    [
      value,
      setValue,
      typeValue,
      status,
      isBusy,
      disabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      hasHistory,
      isBrowsingHistory,
      historyEntry,
      stepHistory,
      hintIds,
      registerHint,
      stopCount,
      commandList,
    ]
  )

  return (
    <ComposerContext.Provider value={context}>
      <form
        data-slot="composer"
        data-status={status}
        className={cn("flex w-full min-w-0 flex-col gap-2", className)}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        {...props}
      >
        {children}
      </form>
    </ComposerContext.Provider>
  )
}

/** The bordered box that holds the textarea and the toolbar. */
function ComposerField({
  className,
  ...props
}: React.ComponentProps<typeof InputGroup>) {
  const { disabled } = useComposerContext("ComposerField")
  return (
    <InputGroup
      data-slot="composer-field"
      // The value the input group's own styles dim its addons for.
      data-disabled={disabled ? "true" : undefined}
      className={cn("h-auto flex-col", className)}
      {...props}
    />
  )
}

type ComposerInputProps = Omit<
  React.ComponentProps<typeof InputGroupTextarea>,
  "value" | "defaultValue" | "onChange"
>

function isComposing(event: React.KeyboardEvent) {
  // Safari ends the composition before the Enter that confirms it arrives,
  // so `isComposing` alone lets that Enter send; 229 is the IME's key code.
  return event.nativeEvent.isComposing || event.keyCode === 229
}

/** The styles that decide where the textarea's text wraps, copied to the copy that measures it. */
const WRAP_STYLES = [
  "direction",
  "font-family",
  "font-feature-settings",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "overflow-wrap",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "tab-size",
  "text-indent",
  "text-transform",
  "white-space",
  "word-break",
  "word-spacing",
]

/**
 * Whether the caret is on the first (or last) line the textarea shows: no
 * newline between it and that edge, and no wrap either. Where it wraps is
 * measured in a hidden copy laid out as the textarea is, with a mark at the
 * start, one around the character after the caret (a caret at a wrap is
 * drawn on the line below) and one at the end.
 */
function caretOnEdgeLine(
  node: HTMLTextAreaElement,
  edge: "first" | "last"
): boolean {
  const { selectionStart, selectionEnd, value } = node
  if (selectionStart !== selectionEnd) return false
  const between =
    edge === "first"
      ? value.slice(0, selectionStart)
      : value.slice(selectionEnd)
  if (between.includes("\n")) return false
  if (between === "") return true

  const style = window.getComputedStyle(node)
  const copy = document.createElement("div")
  for (const property of WRAP_STYLES) {
    copy.style.setProperty(property, style.getPropertyValue(property))
  }
  Object.assign(copy.style, {
    position: "absolute",
    top: "0",
    left: "-9999px",
    visibility: "hidden",
    boxSizing: "border-box",
    width: `${node.clientWidth}px`,
    border: "0",
  })
  const mark = (text = "") => {
    const span = copy.appendChild(document.createElement("span"))
    span.textContent = text
    return span
  }
  const next =
    selectionStart + ((value.codePointAt(selectionStart) ?? 0) > 0xffff ? 2 : 1)
  const start = mark()
  copy.append(value.slice(0, selectionStart))
  const caret = mark(value.slice(selectionStart, next))
  copy.append(value.slice(next))
  const end = mark()
  document.body.appendChild(copy)
  // Same line within half a line: a glyph from a fallback font can sit a
  // pixel or two off the line's other marks.
  const lineHeight =
    parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 16
  const onEdge =
    Math.abs(caret.offsetTop - (edge === "first" ? start : end).offsetTop) <
    lineHeight / 2
  copy.remove()
  return onEdge
}

function supportsFieldSizing() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("field-sizing", "content")
  )
}

function ComposerInput({
  className,
  onKeyDown,
  ref,
  "aria-label": ariaLabel = "Message",
  "aria-describedby": ariaDescribedBy,
  ...props
}: ComposerInputProps) {
  const {
    value,
    typeValue,
    isBusy,
    disabled,
    submitMode,
    submit,
    stop,
    stepHistory,
    hasHistory,
    isBrowsingHistory,
    historyEntry,
    inputRef,
    hintIds,
    commandKeys,
    commandList,
  } = useComposerContext("ComposerInput")

  // A history entry goes in with the caret at its end, once React has put
  // it in the textarea.
  const caretAtEnd = React.useRef<string | null>(null)
  React.useLayoutEffect(() => {
    const node = inputRef.current
    if (caretAtEnd.current === null || node === null) return
    if (node.value !== caretAtEnd.current) return
    node.setSelectionRange(node.value.length, node.value.length)
    caretAtEnd.current = null
  })

  // The textarea grows with its text through `field-sizing: content`. A
  // browser without it (Firefox) would keep one line, so there the height
  // follows the text's scroll height instead; `max-h-48` still caps it and
  // the rest scrolls.
  const fitHeight = React.useCallback(() => {
    const node = inputRef.current
    if (node === null || supportsFieldSizing()) return
    node.style.height = "auto"
    // `scrollHeight` counts the padding but not the border.
    const style = getComputedStyle(node)
    const px = (value: string) => parseFloat(value) || 0
    const extra =
      style.boxSizing === "border-box"
        ? px(style.borderTopWidth) + px(style.borderBottomWidth)
        : -(px(style.paddingTop) + px(style.paddingBottom))
    node.style.height = `${node.scrollHeight + extra}px`
  }, [inputRef])
  React.useLayoutEffect(fitHeight, [value, fitHeight])
  // The text wraps again when the box gets narrower or wider (a resized
  // panel, a sidebar that opens), with no change to the value.
  React.useEffect(() => {
    const node = inputRef.current
    if (
      node === null ||
      supportsFieldSizing() ||
      typeof ResizeObserver === "undefined"
    )
      return
    let width = node.clientWidth
    const observer = new ResizeObserver(() => {
      // Only a new width: the height is ours, and setting it resizes too.
      if (node.clientWidth === width) return
      width = node.clientWidth
      fitHeight()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [inputRef, fitHeight])

  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [inputRef, ref]
  )
  const describedBy = [...hintIds, ariaDescribedBy].filter(Boolean).join(" ")

  // No `data-slot` of its own: the field draws its focus ring from the
  // textarea's `input-group-control` slot.
  return (
    <InputGroupTextarea
      ref={setRef}
      aria-label={ariaLabel}
      aria-describedby={describedBy || undefined}
      aria-autocomplete={commandList === undefined ? undefined : "list"}
      aria-controls={commandList?.open ? commandList.listId : undefined}
      aria-activedescendant={
        commandList?.open ? commandList.activeId : undefined
      }
      value={value}
      disabled={disabled}
      rows={1}
      className={cn("max-h-48 min-h-10 overflow-y-auto px-3", className)}
      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
        typeValue(event.target.value)
      }
      onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || isComposing(event)) return
        if (commandKeys.current?.(event)) return

        const mod = event.metaKey || event.ctrlKey
        if (event.key === "Enter") {
          if (event.shiftKey && !mod) return
          if (mod || submitMode === "enter") {
            event.preventDefault()
            submit()
          }
          return
        }

        if (event.key === "Escape" && isBusy && stop !== undefined) {
          // Handled here, so a sheet around the chat stays open.
          event.preventDefault()
          event.stopPropagation()
          stop()
          return
        }

        if (
          (event.key === "ArrowUp" || event.key === "ArrowDown") &&
          !mod &&
          !event.shiftKey &&
          !event.altKey
        ) {
          // Only from the first line up, or the last line down, so the
          // arrows still move the caret inside a message of several lines,
          // whether they are split by newlines or wrapped. A prompt just
          // loaded, as it was, keeps stepping up from wherever the caret is,
          // as a terminal's history does.
          const node = event.currentTarget
          const older = event.key === "ArrowUp"
          // Nothing to step to: leave the key to the caret without
          // measuring where it is.
          if (older ? !hasHistory : !isBrowsingHistory()) return
          const unedited =
            node.selectionStart === node.selectionEnd &&
            historyEntry === node.value
          const onEdge =
            (older && unedited) ||
            caretOnEdgeLine(node, older ? "first" : "last")
          if (!onEdge) return
          const loaded = stepHistory(older ? "older" : "newer", value)
          if (loaded === undefined) return
          event.preventDefault()
          if (node.value === loaded) {
            node.setSelectionRange(loaded.length, loaded.length)
          } else {
            caretAtEnd.current = loaded
          }
        }
      }}
      {...props}
    />
  )
}

type ComposerToolbarProps = Omit<React.ComponentProps<"div">, "role">

const TOOLBAR_ITEMS =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** What the arrow keys move between in a toolbar: its enabled, shown controls. */
function toolbarItems(toolbar: HTMLElement): HTMLElement[] {
  return [...toolbar.querySelectorAll<HTMLElement>(TOOLBAR_ITEMS)].filter(
    (item) =>
      !item.matches(":disabled") &&
      item.tabIndex !== -1 &&
      item.closest("[hidden], [inert]") === null
  )
}

/**
 * A toolbar that is one tab stop, over whatever controls it holds (Tecton
 * Buttons, tooltip triggers…), with no wrapper of their own: the arrow keys
 * (reversed right to left), Home and End move focus between them, and Tab
 * leaves from the last one (Shift+Tab from the first), so the browser's own
 * Tab carries on past the toolbar. Tabbing back in returns to the control
 * last used.
 */
function useToolbar() {
  const direction = useDirection()
  const lastFocused = React.useRef<HTMLElement | null>(null)
  // Focus a press brings in stays where the press put it.
  const pressed = React.useRef(false)

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const toolbar = event.currentTarget
    const target = event.target as HTMLElement
    // A key from a popup portalled out of the toolbar is not the toolbar's.
    if (event.defaultPrevented || !toolbar.contains(target)) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const items = toolbarItems(toolbar)
    if (event.key === "Tab") {
      lastFocused.current = target
      const edge = event.shiftKey ? items[0] : items.at(-1)
      edge?.focus()
      return
    }
    const index = items.findIndex((item) => item.contains(target))
    const next = direction === "rtl" ? "ArrowLeft" : "ArrowRight"
    const previous = direction === "rtl" ? "ArrowRight" : "ArrowLeft"
    let item: HTMLElement | undefined
    switch (event.key) {
      case next:
        item = items[index + 1]
        break
      case previous:
        item = index > 0 ? items[index - 1] : undefined
        break
      case "Home":
        item = items[0]
        break
      case "End":
        item = items.at(-1)
        break
      default:
        return
    }
    event.preventDefault()
    item?.focus()
  }

  const onPointerDown = () => {
    pressed.current = true
  }

  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const toolbar = event.currentTarget
    const last = lastFocused.current
    const byPress = pressed.current
    pressed.current = false
    if (toolbar.contains(event.relatedTarget)) return
    lastFocused.current = null
    if (byPress || last === null || last === event.target) return
    if (toolbar.contains(last) && toolbarItems(toolbar).includes(last)) {
      last.focus()
    }
  }

  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const toolbar = event.currentTarget
    if (toolbar.contains(event.relatedTarget)) return
    lastFocused.current ??= event.target as HTMLElement
  }

  return {
    role: "toolbar",
    "aria-orientation": "horizontal" as const,
    onKeyDown,
    onPointerDownCapture: onPointerDown,
    onFocusCapture: onFocus,
    onBlurCapture: onBlur,
  }
}

/**
 * The row under the textarea: one tab stop, the arrow keys between its
 * controls, the send button at its end. Put any Tecton button in it as it
 * is, `InputGroupButton` for the field's look.
 */
function ComposerToolbar({
  className,
  "aria-label": ariaLabel = "Message actions",
  onKeyDown,
  ...props
}: ComposerToolbarProps) {
  const { focus } = useComposerContext("ComposerToolbar")
  const toolbar = useToolbar()
  return (
    <InputGroupAddon
      align="block-end"
      data-slot="composer-toolbar-addon"
      className="px-2 pb-2"
      // The addon focuses the group's `input`; the composer's is a textarea.
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return
        focus()
      }}
    >
      <div
        {...toolbar}
        data-slot="composer-toolbar"
        aria-label={ariaLabel}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 *:data-[slot=composer-submit]:ms-auto",
          className
        )}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          toolbar.onKeyDown(event)
        }}
        {...props}
      />
    </InputGroupAddon>
  )
}

type ComposerSubmitProps = {
  sendLabel?: string
  stopLabel?: string
  className?: string
}

/**
 * Send, or Stop while a reply is arriving: two buttons with names of their
 * own that swap, rather than one whose name changes under the user. Focus
 * follows the swap. Send is `aria-disabled` rather than disabled while the
 * box is empty, so it keeps its place in the tab order and its name.
 */
function ComposerSubmit({
  sendLabel = "Send message",
  stopLabel = "Stop generating",
  className,
}: ComposerSubmitProps) {
  const { status, isBusy, canSubmit, disabled, stop, inputRef } =
    useComposerContext("ComposerSubmit")
  const showStop = isBusy && stop !== undefined
  const stopRef = React.useRef<HTMLButtonElement>(null)
  const focused = React.useRef<"send" | "stop" | null>(null)

  // A button that unmounts while focused leaves focus on the body, and
  // fires no blur React sees: hand it to the button or textarea that follows,
  // and forget the button, so a later swap does not pull focus back.
  React.useLayoutEffect(() => {
    const gone = showStop ? "send" : "stop"
    if (focused.current !== gone) return
    focused.current = null
    const active = document.activeElement
    if (active !== null && active !== document.body) return
    if (showStop) stopRef.current?.focus()
    else inputRef.current?.focus()
  }, [showStop, inputRef])

  if (showStop) {
    return (
      <InputGroupButton
        // Keys make these two elements: without them React reuses one
        // button and only renames it.
        key="stop"
        ref={stopRef}
        data-slot="composer-submit"
        data-action="stop"
        size="icon-sm"
        variant="secondary"
        aria-label={stopLabel}
        className={cn("rounded-full", className)}
        onFocus={() => (focused.current = "stop")}
        onBlur={() => (focused.current = null)}
        onClick={() => stop()}
      >
        {status === "submitted" ? (
          <Spinner aria-hidden />
        ) : (
          <SquareIcon className="fill-current" />
        )}
      </InputGroupButton>
    )
  }

  const unavailable = !canSubmit
  return (
    <InputGroupButton
      key="send"
      type={unavailable ? "button" : "submit"}
      data-slot="composer-submit"
      data-action="send"
      size="icon-sm"
      variant="default"
      aria-label={sendLabel}
      aria-disabled={unavailable || undefined}
      disabled={disabled}
      className={cn(
        "rounded-full aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        className
      )}
      onFocus={() => (focused.current = "send")}
      onBlur={() => (focused.current = null)}
    >
      <ArrowUpIcon />
    </InputGroupButton>
  )
}

function isMacPlatform() {
  if (typeof navigator === "undefined") return false
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
}

const subscribeNoop = () => () => {}

/**
 * Whether the keyboard is an Apple one, so ⌘ is shown where others see
 * Ctrl. False on the server and in the first client render, so hydration
 * matches, then the real answer.
 */
function useIsMacPlatform(): boolean {
  return React.useSyncExternalStore(subscribeNoop, isMacPlatform, () => false)
}

/** How to send, tied to the textarea by `aria-describedby`; visible or for screen readers only. */
function ComposerHint({
  className,
  visible = true,
  id: idProp,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  /** False keeps the hint for screen readers only. */
  visible?: boolean
}) {
  const { registerHint, submitMode, commandList, hasHistory } =
    useComposerContext("ComposerHint")
  const generatedId = React.useId()
  // A caller's id is the one the textarea points at.
  const id = idProp ?? generatedId
  React.useLayoutEffect(() => registerHint(id), [registerHint, id])
  // Either modifier sends; the hint names the one on the reader's keyboard.
  const isMac = useIsMacPlatform()
  const sendKeys =
    submitMode === "enter" ? (
      <>
        <Kbd>Enter</Kbd> to send, <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> for a new
        line
      </>
    ) : (
      <>
        <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>+<Kbd>Enter</Kbd> to send,{" "}
        <Kbd>Enter</Kbd> for a new line
      </>
    )
  const commandKeysHint =
    commandList === undefined ? null : (
      <>
        , <Kbd>/</Kbd> for commands
      </>
    )
  const historyKeysHint = hasHistory ? (
    <>
      , <Kbd>↑</Kbd> for earlier messages
    </>
  ) : null

  return (
    <p
      data-slot="composer-hint"
      className={cn(
        visible ? "px-1 text-xs text-muted-foreground" : "sr-only",
        className
      )}
      {...props}
      id={id}
    >
      {children ?? (
        <>
          {sendKeys}
          {commandKeysHint}
          {historyKeysHint}
        </>
      )}
    </p>
  )
}

type ComposerStatusMessages = {
  submitted?: string
  stopped?: string
  error?: string
}

const DEFAULT_STATUS_MESSAGES: Required<ComposerStatusMessages> = {
  submitted: "Message sent.",
  stopped: "Stopped.",
  error: "The reply failed.",
}

/**
 * A polite status region for the composer's own changes. The reply itself
 * is the transcript's to announce, once it is complete. Each change renders
 * a new node, so the same message sent twice is announced twice.
 */
function ComposerStatusMessage({
  messages,
  className,
  ...props
}: React.ComponentProps<"div"> & { messages?: ComposerStatusMessages }) {
  const { status, stopCount } = useComposerContext("ComposerStatusMessage")
  const text = { ...DEFAULT_STATUS_MESSAGES, ...messages }
  const [announcement, setAnnouncement] = React.useState({ text: "", key: 0 })
  const previous = React.useRef({ status, stopCount })

  React.useEffect(() => {
    const before = previous.current
    previous.current = { status, stopCount }
    let next: string | undefined
    const wasBusy =
      before.status === "submitted" || before.status === "streaming"
    const isBusy = status === "submitted" || status === "streaming"
    if (stopCount !== before.stopCount) next = text.stopped
    // From ready or error to busy, whichever busy state a chat goes to first.
    else if (isBusy && !wasBusy) next = text.submitted
    else if (status !== before.status && status === "error") next = text.error
    if (next !== undefined) {
      setAnnouncement((current) => ({ text: next, key: current.key + 1 }))
    }
  }, [status, stopCount, text.stopped, text.submitted, text.error])

  return (
    <div
      role="status"
      data-slot="composer-status"
      className={cn("sr-only", className)}
      {...props}
    >
      <span key={announcement.key}>{announcement.text}</span>
    </div>
  )
}

type ComposerAttachmentItem = {
  id: string
  label: string
  description?: string
  /** Marked `data-icon="inline-start"`, as in any `Chip`, so it takes the chip's size. */
  icon?: React.ReactNode
}

type ComposerAttachmentsProps = {
  items: readonly ComposerAttachmentItem[]
  onRemove: (id: string) => void
  className?: string
  "aria-label"?: string
}

/**
 * What goes with the message besides its text, as Tecton chips: a focused
 * chip is removed with Delete or Backspace, or its own button. Removing
 * the last one returns focus to the textarea.
 */
function ComposerAttachments({
  items,
  onRemove,
  className,
  "aria-label": ariaLabel = "Attachments",
}: ComposerAttachmentsProps) {
  const { focus } = useComposerContext("ComposerAttachments")
  if (items.length === 0) return null

  return (
    <ChipGroup
      data-slot="composer-attachments"
      aria-label={ariaLabel}
      className={cn("w-full px-2 pt-2", className)}
      onRemove={(ids) => {
        for (const id of ids) onRemove(id)
        if (ids.length >= items.length) focus()
      }}
    >
      <ChipList items={items}>
        {(item) => (
          <Chip
            value={item.id}
            label={item.label}
            appearance="outline"
            size="md"
            className="max-w-full"
          >
            {item.icon}
            <span className="min-w-0 truncate">{item.label}</span>
            {item.description !== undefined && (
              <span className="min-w-0 truncate font-normal text-muted-foreground">
                {item.description}
              </span>
            )}
          </Chip>
        )}
      </ChipList>
    </ChipGroup>
  )
}

/** Prompts to start from, as one toolbar: a single tab stop, arrow keys between them. */
function ComposerSuggestions({
  className,
  "aria-label": ariaLabel = "Suggestions",
  onKeyDown,
  ...props
}: ComposerToolbarProps) {
  const toolbar = useToolbar()
  return (
    <div
      {...toolbar}
      data-slot="composer-suggestions"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-1.5", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        toolbar.onKeyDown(event)
      }}
      {...props}
    />
  )
}

type ComposerSuggestionProps = {
  value: string
  /** Sends the suggestion at once, instead of filling the box. */
  submit?: boolean
  /** Replaces the default: the composer does nothing else with the click. */
  onSelect?: (value: string) => void
  className?: string
  children?: React.ReactNode
}

/**
 * One suggestion. It fills the box for the user to edit and send, or sends
 * straight away with `submit`; `onSelect` hands the click to the app
 * instead, for a suggestion that carries more than its text.
 */
function ComposerSuggestion({
  value,
  submit: sendNow = false,
  onSelect,
  className,
  children,
}: ComposerSuggestionProps) {
  const { setValue, send, focus, isBusy, disabled } =
    useComposerContext("ComposerSuggestion")

  return (
    <Button
      data-slot="composer-suggestion"
      variant="outline"
      size="xs"
      disabled={disabled || (sendNow && isBusy)}
      className={cn("max-w-full rounded-full", className)}
      onClick={() => {
        if (onSelect) {
          onSelect(value)
          return
        }
        if (sendNow) {
          send(value)
          return
        }
        setValue(value)
        focus()
      }}
    >
      <span className="min-w-0 truncate">{children ?? value}</span>
    </Button>
  )
}

type ComposerCommandItem = {
  id: string
  /** What is typed after the slash, such as `new`: one word, no spaces. */
  command: string
  /** What the command does, in words; matched too. */
  label: string
  description?: string
  /**
   * Commands with the same group are listed together under it; the groups
   * come in the order of their best match.
   */
  group?: string
  icon?: React.ReactNode
}

/** What a picked command can do to the composer. */
type ComposerCommandControls = Pick<
  ComposerContextValue,
  "setValue" | "send" | "focus"
>

/** The typed `/word` at the start of the box, or undefined when there is none. */
function commandQuery(value: string): string | undefined {
  const match = /^\/(\S*)$/.exec(value)
  return match === null ? undefined : match[1].toLowerCase()
}

/**
 * The commands that match `query`, best first: the command starts with it,
 * then a word of the label does, then the command contains it.
 */
function matchCommands(
  items: readonly ComposerCommandItem[],
  query: string
): ComposerCommandItem[] {
  const rank = (item: ComposerCommandItem): number => {
    const command = item.command.toLowerCase()
    if (command.startsWith(query)) return 0
    if (
      item.label
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .some((word) => word.startsWith(query))
    )
      return 1
    if (command.includes(query)) return 2
    return -1
  }
  return items
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.item)
}

/** The matches grouped: each group where its best match ranks, its commands in rank order. */
function groupCommands(matches: readonly ComposerCommandItem[]) {
  const groups = new Map<string | undefined, ComposerCommandItem[]>()
  for (const item of matches) {
    const group = groups.get(item.group)
    if (group === undefined) groups.set(item.group, [item])
    else group.push(item)
  }
  return [...groups].map(([name, items]) => ({ name, items }))
}

function defaultCountMessage(count: number) {
  return `${count} ${count === 1 ? "command" : "commands"}, arrow keys to choose.`
}

type ComposerCommandsProps = {
  items: readonly ComposerCommandItem[]
  onCommand: (
    item: ComposerCommandItem,
    composer: ComposerCommandControls
  ) => void
  /** What the polite status says while the list is open, for `count` matches. */
  countMessage?: (count: number) => string
  className?: string
  "aria-label"?: string
}

/**
 * Commands behind a `/` at the start of the box, listed above the field: the
 * textarea keeps focus and points at the active one with
 * `aria-activedescendant`, as a combobox does. ArrowUp and ArrowDown move,
 * Enter or Tab picks, Escape closes the list until the text changes; with no
 * match the list stays closed and Enter sends as usual. Picking empties the
 * box and hands the command to `onCommand`. Render it inside
 * `ComposerField`, which it is positioned against.
 */
function ComposerCommands({
  items,
  onCommand,
  countMessage = defaultCountMessage,
  className,
  "aria-label": ariaLabel = "Commands",
}: ComposerCommandsProps) {
  const {
    value,
    setValue,
    send,
    focus,
    disabled,
    historyEntry,
    commandKeys,
    setCommandList,
  } = useComposerContext("ComposerCommands")
  const listId = React.useId()
  const [active, setActive] = React.useState(0)
  const [dismissed, setDismissed] = React.useState<string>()
  const listRef = React.useRef<HTMLDivElement>(null)

  // Escape closes the list for the text it was pressed on; any other text,
  // even the same `/word` typed again after a send, opens it again.
  if (dismissed !== undefined && dismissed !== value) setDismissed(undefined)

  const query = commandQuery(value)
  const groups = React.useMemo(
    () => groupCommands(query === undefined ? [] : matchCommands(items, query)),
    [items, query]
  )
  // In the order they are listed, which the arrow keys follow.
  const matches = React.useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )
  const open =
    !disabled &&
    query !== undefined &&
    matches.length > 0 &&
    dismissed !== value &&
    // A prompt loaded from the history is browsed, not a command typed.
    historyEntry !== value
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1))
  const activeItem = open ? matches.at(activeIndex) : undefined
  // An option's id is its place in `items`: the same while the list narrows,
  // whatever the item's own id holds.
  const optionId = (item: ComposerCommandItem) =>
    `${listId}-option-${items.indexOf(item)}`
  const activeId = activeItem === undefined ? undefined : optionId(activeItem)

  // A new query starts at the best match.
  React.useEffect(() => {
    setActive(0)
  }, [query])

  // The textarea points at the list and its active option once they are in
  // the DOM: the list renders with them, and the textarea follows.
  React.useLayoutEffect(() => {
    setCommandList({ listId, open, activeId })
  }, [setCommandList, listId, open, activeId])
  React.useLayoutEffect(() => () => setCommandList(undefined), [setCommandList])

  // The active option is scrolled into the list's view, and only the list's:
  // `scrollIntoView` would scroll the transcript and the page with it.
  React.useEffect(() => {
    const list = listRef.current
    if (!open || list === null || activeId === undefined) return
    const option = [
      ...list.querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((element) => element.id === activeId)
    if (option === undefined) return
    const top =
      option.getBoundingClientRect().top -
      list.getBoundingClientRect().top -
      list.clientTop +
      list.scrollTop
    const bottom = top + option.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight
    }
  }, [open, activeId])

  const pick = React.useCallback(
    (item: ComposerCommandItem) => {
      setValue("")
      onCommand(item, { setValue, send, focus })
      focus()
    },
    [setValue, onCommand, send, focus]
  )

  React.useLayoutEffect(() => {
    commandKeys.current = (event) => {
      if (!open) return false
      const mod = event.metaKey || event.ctrlKey || event.altKey
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp": {
          if (mod || event.shiftKey) return false
          event.preventDefault()
          const step = event.key === "ArrowDown" ? 1 : -1
          setActive((activeIndex + step + matches.length) % matches.length)
          return true
        }
        case "Enter":
        case "Tab": {
          if (mod || event.shiftKey) return false
          event.preventDefault()
          pick(matches[activeIndex])
          return true
        }
        case "Escape":
          // Handled here, so a sheet around the chat stays open.
          event.preventDefault()
          event.stopPropagation()
          setDismissed(value)
          return true
        default:
          return false
      }
    }
    return () => {
      commandKeys.current = null
    }
  }, [commandKeys, open, matches, activeIndex, pick, value])

  const option = (item: ComposerCommandItem) => {
    const at = matches.indexOf(item)
    const id = optionId(item)
    const selected = at === activeIndex
    return (
      <div
        key={id}
        id={id}
        role="option"
        aria-selected={selected}
        data-highlighted={selected ? "" : undefined}
        data-slot="composer-command"
        className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
        // A mouse or pen over a command makes it the active one; a touch
        // only picks it.
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setActive(at)
        }}
        onClick={() => pick(item)}
      >
        {item.icon}
        <span className="shrink-0 font-mono text-xs">/{item.command}</span>
        <span className="min-w-0 truncate">{item.label}</span>
        {item.description !== undefined && (
          <span className="ms-auto min-w-0 truncate text-xs text-muted-foreground">
            {item.description}
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      {open && (
        // The options never take focus: the textarea keeps it and moves
        // through them with its own arrow keys.
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          data-slot="composer-commands"
          className={cn(
            "absolute inset-x-0 bottom-full z-10 mb-2 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none",
            className
          )}
          // A press, by mouse or touch, anywhere in the list leaves focus
          // in the textarea.
          onMouseDown={(event) => event.preventDefault()}
        >
          {groups.map((group, index) => {
            if (group.name === undefined) return group.items.map(option)
            const headingId = `${listId}-group-${index}`
            return (
              <div
                key={headingId}
                role="group"
                aria-labelledby={headingId}
                data-slot="composer-command-group"
              >
                <div
                  id={headingId}
                  role="presentation"
                  className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
                >
                  {group.name}
                </div>
                {group.items.map(option)}
              </div>
            )
          })}
        </div>
      )}
      <span
        role="status"
        data-slot="composer-commands-status"
        className="sr-only"
      >
        {open ? countMessage(matches.length) : ""}
      </span>
    </>
  )
}

export {
  Composer,
  ComposerAttachments,
  ComposerCommands,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerSuggestion,
  ComposerSuggestions,
  ComposerToolbar,
  useComposer,
}
export type {
  ComposerAttachmentItem,
  ComposerAttachmentsProps,
  ComposerCommandControls,
  ComposerCommandItem,
  ComposerCommandsProps,
  ComposerProps,
  ComposerStatus,
  ComposerStatusMessages,
  ComposerSubmitMode,
  ComposerSuggestionProps,
  ComposerToolbarProps,
}
