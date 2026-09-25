"use client"

import * as React from "react"
import { cn } from "cn"
import { ArrowUpIcon, SquareIcon, XIcon } from "lucide-react"
import {
  Tag,
  TagGroup,
  TagList,
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
 * arriving; ArrowUp in an empty box recalls the last message when
 * `onRecallLast` is given. The textarea stays enabled while a reply
 * streams, and focus stays in it after sending.
 *
 * Announcements: the composer announces its own state changes (sent,
 * stopped, failed) in a polite status region; the transcript, a
 * `MessageScrollerContent` with `aria-busy` while a reply streams,
 * announces the messages.
 */

/** The chat's state, in the shape the AI SDK and TanStack AI use. */
type ComposerStatus = "ready" | "submitted" | "streaming" | "error"

type ComposerSubmitMode = "enter" | "mod-enter"

type ComposerContextValue = {
  value: string
  setValue: (value: string) => void
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
  recallLast: (() => string | undefined) | undefined
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  hintId: string
  /** Whether a `ComposerHint` is rendered, for the textarea's `aria-describedby`. */
  hasHint: boolean
  setHasHint: (hasHint: boolean) => void
  /** Counts the replies the user stopped, so the status says so each time. */
  stopCount: number
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
  /** The last message the user sent, loaded by ArrowUp in an empty box. */
  onRecallLast?: () => string | undefined
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
  onRecallLast,
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

  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange]
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
      onSubmit({ text: text.trim() })
      focus()
    },
    [isDisabled, isBusy, onSubmit, focus]
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
      status,
      isBusy,
      isDisabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      recallLast: onRecallLast,
      inputRef,
      hintId,
      hasHint,
      setHasHint,
      stopCount,
    }),
    [
      value,
      setValue,
      status,
      isBusy,
      isDisabled,
      canSubmit,
      submitMode,
      submit,
      send,
      stop,
      focus,
      onRecallLast,
      hintId,
      hasHint,
      stopCount,
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
    setValue,
    isBusy,
    isDisabled,
    submitMode,
    submit,
    stop,
    recallLast,
    inputRef,
    hintId,
    hasHint,
  } = useComposerContext("ComposerInput")

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
      value={value}
      disabled={isDisabled}
      rows={1}
      className={cn("max-h-48 min-h-10 overflow-y-auto px-3", className)}
      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
        setValue(event.target.value)
      }
      onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || isComposing(event)) return

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
          event.key === "ArrowUp" &&
          value === "" &&
          recallLast !== undefined &&
          !mod &&
          !event.shiftKey &&
          !event.altKey
        ) {
          const last = recallLast()
          if (last !== undefined && last !== "") {
            event.preventDefault()
            setValue(last)
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
  return (
    <InputGroupAddon
      align="block-end"
      data-slot="composer-toolbar-addon"
      className="px-2 pb-2"
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
  // fires no blur React sees: hand it to the button or textarea that follows.
  React.useLayoutEffect(() => {
    const active = document.activeElement
    const lost = active === null || active === document.body
    if (showStop && focused.current === "send" && lost) stopRef.current?.focus()
    if (!showStop && focused.current === "stop" && lost)
      inputRef.current?.focus()
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
  const { hintId, setHasHint, submitMode } = useComposerContext("ComposerHint")
  React.useLayoutEffect(() => {
    setHasHint(true)
    return () => setHasHint(false)
  }, [setHasHint])
  const sendKeys =
    submitMode === "enter" ? (
      <>
        <Kbd>Enter</Kbd> to send, <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> for a new
        line
      </>
    ) : (
      <>
        <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> to send, <Kbd>Enter</Kbd> for a new
        line
      </>
    )

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
      {children ?? sendKeys}
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
    if (stopCount !== before.stopCount) next = text.stopped
    else if (status !== before.status && status === "submitted")
      next = text.submitted
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
  icon?: React.ReactNode
}

/**
 * What goes with the message besides its text, as removable chips: a
 * focused chip is removed with Delete or Backspace, or its own button.
 * Removing the last one returns focus to the textarea.
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
    <TagGroup
      data-slot="composer-attachments"
      aria-label={ariaLabel}
      className={cn("w-full px-2 pt-2", className)}
      onRemove={(keys) => {
        for (const key of keys) onRemove(key)
        if (keys.size >= items.length) focus()
      }}
    >
      <TagList className="flex flex-wrap gap-1.5" items={items}>
        {(item) => (
          <Tag
            id={item.id}
            textValue={item.label}
            data-slot="composer-attachment"
            className="flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border bg-card py-1 ps-2 pe-1 text-xs text-card-foreground outline-none data-focus-visible:ring-2 data-focus-visible:ring-ring [&_svg:not([class*='size-'])]:size-3.5"
          >
            {item.icon}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium">{item.label}</span>
              {item.description !== undefined && (
                <span className="truncate text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            {/* React Aria names it "Remove <label>", localized. */}
            <Button slot="remove" variant="ghost" size="icon-xs">
              <XIcon />
            </Button>
          </Tag>
        )}
      </TagList>
    </TagGroup>
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

export {
  Composer,
  ComposerAttachments,
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
  ComposerProps,
  ComposerStatus,
  ComposerStatusMessages,
  ComposerSubmitMode,
}
