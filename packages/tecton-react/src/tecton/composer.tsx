"use client"

import * as React from "react"
import { cn } from "cn"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import {
  Pressable,
  Toolbar,
  type Key,
  type ToolbarProps,
} from "react-aria-components"

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
import { useIsMacPlatform } from "@tecton/react/tecton/shortcuts"

/**
 * Tecton Composer — the message box of a chat: a textarea that grows with
 * its text, a toolbar with the send button, and optional suggestions and
 * attachment chips. Upstream shadcn has the conversation components
 * (`message`, `bubble`, `message-scroller`) but no composer, so this is
 * Tecton's (docs/research/composer.md has the survey it follows).
 *
 * Keyboard: Enter sends, Shift+Enter is a new line, ⌘/Ctrl+Enter always
 * sends (and is the only way to send with `submitMode="mod-enter"`);
 * nothing sends while an IME is composing; Escape stops a reply that is
 * arriving. With `history`, ArrowUp with the caret at the very start of the
 * box steps back through the prompts sent before, and ArrowDown with the
 * caret at the very end forward, back to the draft the box held when
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
  /** The index in `history` of the entry in the box. */
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
  isDisabled: boolean
  canSubmit: boolean
  submitMode: ComposerSubmitMode
  submit: () => void
  /** Sends `text` as it is, leaving the box alone: a suggestion that sends. */
  send: (text: string) => void
  stop: (() => void) | undefined
  focus: () => void
  /** Whether `history` has an entry to load, for the hint. */
  hasHistory: boolean
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
  hintId: string
  /** Whether a `ComposerHint` is rendered, for the textarea's `aria-describedby`. */
  hasHint: boolean
  setHasHint: (hasHint: boolean) => void
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
   * The prompts the user has sent, oldest first: ArrowUp with the caret at
   * the start of the box steps back through them, ArrowDown with the caret
   * at the end forward. Never changed by the composer.
   */
  history?: readonly string[]
  isDisabled?: boolean
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
  isDisabled = false,
  className,
  children,
  ...props
}: ComposerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const hintId = React.useId()
  const [hasHint, setHasHint] = React.useState(false)
  const [stopCount, setStopCount] = React.useState(0)
  const commandKeys = React.useRef<
    ((event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean) | null
  >(null)
  const [commandList, setCommandList] =
    React.useState<ComposerCommandListState>()
  const historyPosition = React.useRef<ComposerHistoryPosition | null>(null)
  const [historyEntry, setHistoryEntry] = React.useState<string>()
  // The position is read in key handlers, so it is a ref; the entry it
  // loaded is state too, for the parts that render from it.
  const setPosition = React.useCallback(
    (position: ComposerHistoryPosition | null) => {
      historyPosition.current = position
      setHistoryEntry(position === null ? undefined : history?.[position.index])
    },
    [history]
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

  const hasHistory =
    history !== undefined && history.some((entry) => entry.trim() !== "")

  const stepHistory = React.useCallback(
    (direction: "older" | "newer", current: string): string | undefined => {
      const entries = history ?? []
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
    [history, setPosition, commitValue]
  )

  const isBusy = status === "submitted" || status === "streaming"
  const canSubmit = !isDisabled && !isBusy && value.trim() !== ""

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
      if (isDisabled || isBusy || text.trim() === "") return
      setPosition(null)
      onSubmit({ text: text.trim() })
      focus()
    },
    [isDisabled, isBusy, setPosition, onSubmit, focus]
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
      isDisabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      hasHistory,
      historyEntry,
      stepHistory,
      inputRef,
      hintId,
      hasHint,
      setHasHint,
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
      isDisabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      hasHistory,
      historyEntry,
      stepHistory,
      hintId,
      hasHint,
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
}: Omit<React.ComponentProps<typeof InputGroup>, "className"> & {
  className?: string
}) {
  const { isDisabled } = useComposerContext("ComposerField")
  return (
    <InputGroup
      data-slot="composer-field"
      isDisabled={isDisabled}
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
    isDisabled,
    submitMode,
    submit,
    stop,
    stepHistory,
    historyEntry,
    inputRef,
    hintId,
    hasHint,
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
  React.useLayoutEffect(() => {
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
  }, [value, inputRef])

  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [inputRef, ref]
  )
  const describedBy = [hasHint ? hintId : undefined, ariaDescribedBy]
    .filter(Boolean)
    .join(" ")

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
      disabled={isDisabled}
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
          // Only from the very start up, or the very end down, so the arrows
          // still move the caret inside a message of several lines. A line
          // break is not enough to tell: a long paragraph wraps onto lines
          // of its own, and the caret can be on the third of them with no
          // "\n" before it. A prompt just loaded, as it was, keeps stepping
          // up from wherever the caret is, as a terminal's history does.
          const node = event.currentTarget
          const { selectionStart, selectionEnd } = node
          const older = event.key === "ArrowUp"
          const atEdge =
            selectionStart === selectionEnd &&
            (older
              ? selectionStart === 0 || historyEntry === node.value
              : selectionEnd === node.value.length)
          if (!atEdge) return
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

/** The row under the textarea: an arrow-key toolbar, the send button at its end. */
type ComposerToolbarProps = Omit<ToolbarProps, "className"> & {
  className?: string
}

function ComposerToolbar({
  className,
  "aria-label": ariaLabel = "Message actions",
  ...props
}: ComposerToolbarProps) {
  const { focus } = useComposerContext("ComposerToolbar")
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
      <Toolbar
        data-slot="composer-toolbar"
        aria-label={ariaLabel}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 *:data-[slot=composer-submit]:ms-auto",
          className
        )}
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
  const { status, isBusy, canSubmit, isDisabled, stop, inputRef } =
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
        onPress={stop}
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
      isDisabled={isDisabled}
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

/** How to send, tied to the textarea by `aria-describedby`; visible or for screen readers only. */
function ComposerHint({
  className,
  isVisible = true,
  children,
  ...props
}: React.ComponentProps<"p"> & { isVisible?: boolean }) {
  const { hintId, setHasHint, submitMode, commandList, hasHistory } =
    useComposerContext("ComposerHint")
  React.useLayoutEffect(() => {
    setHasHint(true)
    return () => setHasHint(false)
  }, [setHasHint])
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
      id={hintId}
      data-slot="composer-hint"
      className={cn(
        isVisible ? "px-1 text-xs text-muted-foreground" : "sr-only",
        className
      )}
      {...props}
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
  id: Key
  label: string
  description?: string
  /** Marked `data-icon="inline-start"`, as in any `Chip`, so it takes the chip's size. */
  icon?: React.ReactNode
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
}: {
  items: readonly ComposerAttachmentItem[]
  onRemove: (id: Key) => void
  className?: string
  "aria-label"?: string
}) {
  const { focus } = useComposerContext("ComposerAttachments")
  if (items.length === 0) return null

  return (
    <ChipGroup
      data-slot="composer-attachments"
      aria-label={ariaLabel}
      className={cn("w-full px-2 pt-2", className)}
      onRemove={(keys) => {
        for (const key of keys) onRemove(key)
        if (keys.size >= items.length) focus()
      }}
    >
      <ChipList items={items}>
        {(item) => (
          <Chip
            id={item.id}
            textValue={item.label}
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
  ...props
}: ComposerToolbarProps) {
  return (
    <Toolbar
      data-slot="composer-suggestions"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * One suggestion. It fills the box for the user to edit and send, or sends
 * straight away with `submit`; `onSelect` hands the press to the app
 * instead, for a suggestion that carries more than its text.
 */
function ComposerSuggestion({
  value,
  submit: sendNow = false,
  onSelect,
  className,
  children,
}: {
  value: string
  submit?: boolean
  /** Replaces the default: the composer does nothing else with the press. */
  onSelect?: (value: string) => void
  className?: string
  children?: React.ReactNode
}) {
  const { setValue, send, focus, isBusy, isDisabled } =
    useComposerContext("ComposerSuggestion")

  return (
    <Button
      data-slot="composer-suggestion"
      variant="outline"
      size="xs"
      isDisabled={isDisabled || (sendNow && isBusy)}
      className={cn("max-w-full rounded-full", className)}
      onPress={() => {
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
  /** Commands with the same group are listed together under it, in order. */
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

type ComposerCommandGroup = {
  name: string | undefined
  items: ComposerCommandItem[]
}

/**
 * The commands that match `query`, in their groups: the groups in the order
 * they first appear in `items`, the commands without one as a group of
 * their own, and inside each the best match first (the command starts with
 * the query, then a word of the label does, then the command contains it).
 * Grouping before ranking keeps a group in one piece: ranked first, a group
 * would split around a better match from another and be listed twice.
 */
function matchCommands(
  items: readonly ComposerCommandItem[],
  query: string
): ComposerCommandGroup[] {
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
  const groups = new Map<
    string | undefined,
    { item: ComposerCommandItem; index: number; rank: number }[]
  >()
  items.forEach((item, index) => {
    const entries = groups.get(item.group) ?? []
    groups.set(item.group, entries)
    const itemRank = rank(item)
    if (itemRank >= 0) entries.push({ item, index, rank: itemRank })
  })
  return [...groups]
    .filter(([, entries]) => entries.length > 0)
    .map(([name, entries]) => ({
      name,
      items: entries
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map((entry) => entry.item),
    }))
}

function defaultCountMessage(count: number) {
  return `${count} ${count === 1 ? "command" : "commands"}, arrow keys to choose.`
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
}: {
  items: readonly ComposerCommandItem[]
  onCommand: (
    item: ComposerCommandItem,
    composer: ComposerCommandControls
  ) => void
  /** What the polite status says while the list is open, for `count` matches. */
  countMessage?: (count: number) => string
  className?: string
  "aria-label"?: string
}) {
  const {
    value,
    setValue,
    send,
    focus,
    isDisabled,
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
    () => (query === undefined ? [] : matchCommands(items, query)),
    [items, query]
  )
  // The options in the order they are listed, which the arrows follow.
  const matches = React.useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )
  const open =
    !isDisabled &&
    query !== undefined &&
    matches.length > 0 &&
    dismissed !== value &&
    // A prompt loaded from the history is browsed, not a command typed.
    historyEntry !== value
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1))
  const optionId = React.useCallback(
    (index: number) => `${listId}-${index}`,
    [listId]
  )

  // A new query starts at the first match.
  React.useEffect(() => {
    setActive(0)
  }, [query])

  React.useLayoutEffect(() => {
    setCommandList({
      listId,
      open,
      activeId: open ? optionId(activeIndex) : undefined,
    })
  }, [listId, open, activeIndex, optionId, setCommandList])
  React.useLayoutEffect(() => () => setCommandList(undefined), [setCommandList])

  React.useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`[id="${optionId(activeIndex)}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [open, activeIndex, optionId])

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

  let index = -1
  return (
    <>
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          data-slot="composer-commands"
          className={cn(
            "absolute inset-x-0 bottom-full z-10 mb-2 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
            className
          )}
          // The textarea keeps focus: a press on a heading or the padding
          // must not take it either.
          onMouseDown={(event) => event.preventDefault()}
        >
          {groups.map((group, groupIndex) => {
            // The group's place, not its name, which may hold spaces that
            // would split `aria-labelledby` into several ids.
            const headingId = `${listId}-group-${groupIndex}`
            const options = group.items.map((item) => {
              index += 1
              const at = index
              return (
                // React Aria's press, not a click: it fires for touch and
                // pointer alike, cancels when the pointer leaves, and with
                // `preventFocusOnPress` leaves focus in the textarea, which
                // owns the list's keys.
                <Pressable
                  key={item.id}
                  preventFocusOnPress
                  onPress={() => pick(item)}
                >
                  <div
                    id={optionId(at)}
                    role="option"
                    // Pressable asks for a focusable child; -1 keeps the
                    // option out of the tab order, as React Aria's own are.
                    tabIndex={-1}
                    aria-selected={at === activeIndex}
                    data-slot="composer-command"
                    className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
                    onPointerMove={() => setActive(at)}
                  >
                    {item.icon}
                    <span className="shrink-0 font-mono text-xs">
                      /{item.command}
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.description !== undefined && (
                      <span className="ms-auto min-w-0 truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                </Pressable>
              )
            })
            return group.name === undefined ? (
              <React.Fragment key={groupIndex}>{options}</React.Fragment>
            ) : (
              <div key={groupIndex} role="group" aria-labelledby={headingId}>
                <div
                  id={headingId}
                  className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
                >
                  {group.name}
                </div>
                {options}
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
  ComposerCommandControls,
  ComposerCommandItem,
  ComposerProps,
  ComposerStatus,
  ComposerStatusMessages,
  ComposerSubmitMode,
}
