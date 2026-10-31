"use client"

import * as React from "react"
import { cn } from "cn"
import { XIcon } from "lucide-react"

import { AttachmentAction } from "@tecton/react/components/attachment"
import { Button } from "@tecton/react/components/button"
import { Empty } from "@tecton/react/components/empty"

/**
 * Tecton Dropzone — picks files by dragging them onto an `Empty` drop area
 * or through a browse button, and lists the picked files as `Attachment`
 * cards. Upstream shadcn has the attachment card and the empty state but no
 * file picker, so this composes the two. The component owns the list
 * (`value` / `defaultValue` / `onValueChange`) and checks every file against
 * `accept`, `maxSize`, `minSize` and `maxFiles`; refused files go to
 * `onFileReject`. Uploading is the application's: it drives each card's
 * `state`.
 *
 * Keyboard users pick files with `DropzoneTrigger`, a real button; a click
 * anywhere else on the area opens the same picker for the mouse. Added,
 * refused and removed files are announced politely.
 */

type DropzoneRejectionReason = "type" | "too-large" | "too-small" | "count"

type DropzoneFileRejection = {
  file: File
  reason: DropzoneRejectionReason
  /** The reason in words, from `messages.rejected`: ready for a `FieldError`. */
  message: string
}

type DropzoneMessages = {
  /** Announced after files are added. */
  added?: (count: number) => string
  /** Announced after a file is removed. */
  removed?: (name: string) => string
  /** The `message` of a refused file, also announced. */
  rejected?: (rejection: Omit<DropzoneFileRejection, "message">) => string
  /** The default `aria-label` of `DropzoneRemove`. */
  remove?: (name: string) => string
}

const DEFAULT_MESSAGES: Required<DropzoneMessages> = {
  added: (count) => (count === 1 ? "1 file added." : `${count} files added.`),
  removed: (name) => `${name} removed.`,
  rejected: ({ file, reason }) => {
    switch (reason) {
      case "type":
        return `${file.name}: this file type is not accepted.`
      case "too-large":
        return `${file.name}: the file is too large.`
      case "too-small":
        return `${file.name}: the file is too small.`
      case "count":
        return `${file.name}: no more files can be added.`
    }
  },
  remove: (name) => `Remove ${name}`,
}

type DropzoneContextValue = {
  files: readonly File[]
  add: (files: readonly File[]) => File[]
  remove: (file: File) => void
  clear: () => void
  open: () => void
  dragging: boolean
  setDragging: (dragging: boolean) => void
  disabled: boolean
  /** `maxFiles` reached: the trigger is disabled and drops are refused. */
  full: boolean
  messages: Required<DropzoneMessages>
  /** Focus moves on from a removed file's button once the list re-renders. */
  focusAfterRemove: (index: number) => void
}

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null)

function useDropzoneContext(part: string): DropzoneContextValue {
  const context = React.useContext(DropzoneContext)
  if (context === null) {
    throw new Error(`${part} must be rendered inside <Dropzone>.`)
  }
  return context
}

/** The dropzone's files and actions, for parts of your own. */
function useDropzone() {
  const { files, open, add, remove, clear, dragging, disabled } =
    useDropzoneContext("useDropzone")
  return { files, open, add, remove, clear, dragging, disabled }
}

/**
 * Whether `file` matches an `accept` list in the `<input type="file">`
 * syntax: extensions (`.pdf`), MIME types (`application/pdf`) and wildcards
 * (`image/*`), comma-separated. An empty list accepts everything.
 */
function matchesAccept(file: File, accept: string | undefined) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith(".")) return name.endsWith(entry)
      if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1))
      return type === entry
    })
}

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"]

/**
 * A file size in words, `2.4 MB`, counted in steps of 1024 like `maxSize`
 * usually is (`10 * 1024 * 1024` reads `10 MB`). One decimal below ten.
 */
function formatFileSize(bytes: number, locale?: string) {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: SIZE_UNITS[unit],
    unitDisplay: unit === 0 ? "long" : "short",
    maximumFractionDigits: unit > 0 && value < 10 ? 1 : 0,
  }).format(value)
}

const EMPTY: readonly File[] = []

type DropzoneProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  value?: readonly File[]
  defaultValue?: readonly File[]
  onValueChange?: (files: File[]) => void
  /** Allowed files, as in `<input accept>`: `"image/*,.pdf"`. */
  accept?: string
  /** `false` keeps one file: a new one replaces it. */
  multiple?: boolean
  maxFiles?: number
  /** In bytes. */
  maxSize?: number
  /** In bytes. */
  minSize?: number
  disabled?: boolean
  /** Submits the files with a native form, under this field name. */
  name?: string
  /** Called with the files refused by one drop or one pick. */
  onFileReject?: (rejections: DropzoneFileRejection[]) => void
  messages?: DropzoneMessages
}

function Dropzone({
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  minSize,
  disabled = false,
  name,
  onFileReject,
  messages: messagesProp,
  className,
  children,
  ...props
}: DropzoneProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const files = valueProp ?? uncontrolled
  const [dragging, setDragging] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState({ text: "", key: 0 })
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const pendingFocus = React.useRef<number | null>(null)
  // Read by the callbacks, so two drops before a re-render both count.
  const filesRef = React.useRef(files)
  filesRef.current = files

  const messages = React.useMemo(
    () => ({ ...DEFAULT_MESSAGES, ...messagesProp }),
    [messagesProp]
  )
  const full = multiple && maxFiles !== undefined && files.length >= maxFiles

  const announce = React.useCallback((text: string) => {
    setAnnouncement((current) => ({ text, key: current.key + 1 }))
  }, [])

  const setFiles = React.useCallback(
    (next: File[]) => {
      filesRef.current = next
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange]
  )

  const add = React.useCallback(
    (incoming: readonly File[]) => {
      const current = filesRef.current
      if (disabled || incoming.length === 0) return [...current]
      const kept = multiple ? current : EMPTY
      const limit = multiple ? (maxFiles ?? Infinity) : 1
      const seen = new Set(kept.map(fileKey))
      const accepted: File[] = []
      const rejections: DropzoneFileRejection[] = []
      const reject = (file: File, reason: DropzoneRejectionReason) =>
        rejections.push({
          file,
          reason,
          message: messages.rejected({ file, reason }),
        })

      for (const file of incoming) {
        if (!matchesAccept(file, accept)) reject(file, "type")
        else if (maxSize !== undefined && file.size > maxSize)
          reject(file, "too-large")
        else if (minSize !== undefined && file.size < minSize)
          reject(file, "too-small")
        else if (seen.has(fileKey(file))) continue
        else if (kept.length + accepted.length >= limit) reject(file, "count")
        else {
          seen.add(fileKey(file))
          accepted.push(file)
        }
      }

      const next = accepted.length > 0 ? [...kept, ...accepted] : [...current]
      if (accepted.length > 0) setFiles(next)
      if (rejections.length > 0) onFileReject?.(rejections)
      const said = [
        accepted.length > 0 ? messages.added(accepted.length) : "",
        ...rejections.map((rejection) => rejection.message),
      ].filter(Boolean)
      if (said.length > 0) announce(said.join(" "))
      return next
    },
    [
      disabled,
      multiple,
      maxFiles,
      accept,
      maxSize,
      minSize,
      messages,
      setFiles,
      onFileReject,
      announce,
    ]
  )

  const remove = React.useCallback(
    (file: File) => {
      const current = filesRef.current
      if (!current.includes(file)) return
      setFiles(current.filter((item) => item !== file))
      announce(messages.removed(file.name))
    },
    [setFiles, announce, messages]
  )

  const clear = React.useCallback(() => setFiles([]), [setFiles])

  const open = React.useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  const focusAfterRemove = React.useCallback((index: number) => {
    pendingFocus.current = index
  }, [])

  // The removed file's button is gone: focus the one now in its place (or
  // the last), else the browse button, so focus never falls to the body.
  React.useLayoutEffect(() => {
    const index = pendingFocus.current
    pendingFocus.current = null
    const root = rootRef.current
    if (index === null || root === null) return
    const buttons = root.querySelectorAll<HTMLElement>(
      "[data-slot=dropzone-remove]"
    )
    const target =
      buttons.length > 0
        ? buttons[Math.min(index, buttons.length - 1)]
        : root.querySelector<HTMLElement>("[data-slot=dropzone-trigger]")
    target?.focus()
  }, [files])

  // The input holds the list too, so a native form submits it. Engines
  // without a constructible `DataTransfer` keep the input empty instead.
  const syncInput = React.useCallback((list: readonly File[]) => {
    const input = inputRef.current
    if (input === null) return
    try {
      const transfer = new DataTransfer()
      for (const file of list) transfer.items.add(file)
      input.files = transfer.files
    } catch {
      input.value = ""
    }
  }, [])

  React.useEffect(() => syncInput(files), [files, syncInput])

  const context = React.useMemo<DropzoneContextValue>(
    () => ({
      files,
      add,
      remove,
      clear,
      open,
      dragging,
      setDragging,
      disabled,
      full,
      messages,
      focusAfterRemove,
    }),
    [
      files,
      add,
      remove,
      clear,
      open,
      dragging,
      disabled,
      full,
      messages,
      focusAfterRemove,
    ]
  )

  return (
    <DropzoneContext.Provider value={context}>
      <div
        ref={rootRef}
        data-slot="dropzone"
        data-disabled={disabled ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        className={cn("flex w-full min-w-0 flex-col gap-3", className)}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          data-slot="dropzone-input"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const picked = Array.from(event.currentTarget.files ?? [])
            syncInput(add(picked))
          }}
        />
        {children}
        <div role="status" data-slot="dropzone-status" className="sr-only">
          <span key={announcement.key}>{announcement.text}</span>
        </div>
      </div>
    </DropzoneContext.Provider>
  )
}

const INTERACTIVE =
  "button, a[href], input, select, textarea, label, [role=button], [tabindex]:not([tabindex='-1'])"

const carriesFiles = (event: React.DragEvent) =>
  Array.from(event.dataTransfer.types).includes("Files")

/**
 * The drop target: an `Empty` with its dashed outline, so it takes
 * `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` and
 * `EmptyContent` (with a `DropzoneTrigger`) as children. `data-dragging`
 * while files are held over it, `data-disabled` when the dropzone is.
 */
function DropzoneArea({
  className,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: React.ComponentProps<typeof Empty>) {
  const { add, open, dragging, setDragging, disabled, full } =
    useDropzoneContext("DropzoneArea")
  // Entering a child fires dragenter on it before dragleave on the parent.
  const depth = React.useRef(0)
  const refuses = disabled || full

  return (
    <Empty
      data-slot="dropzone-area"
      data-dragging={dragging ? "" : undefined}
      data-disabled={refuses ? "" : undefined}
      className={cn(
        "cursor-pointer border transition-colors hover:bg-accent/50 aria-invalid:border-destructive data-dragging:border-filled data-dragging:bg-accent data-disabled:cursor-default data-disabled:opacity-50 data-disabled:hover:bg-transparent",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || refuses) return
        // A button or link inside the area does its own thing.
        const control = (event.target as Element).closest(INTERACTIVE)
        if (control !== null && event.currentTarget.contains(control)) return
        open()
      }}
      onDragEnter={(event) => {
        onDragEnter?.(event)
        if (!carriesFiles(event)) return
        event.preventDefault()
        depth.current += 1
        if (!refuses) setDragging(true)
      }}
      onDragOver={(event) => {
        onDragOver?.(event)
        if (!carriesFiles(event)) return
        // Without it the browser opens the dropped file in the tab.
        event.preventDefault()
        event.dataTransfer.dropEffect = refuses ? "none" : "copy"
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event)
        if (!carriesFiles(event)) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      }}
      onDrop={(event) => {
        onDrop?.(event)
        if (!carriesFiles(event)) return
        event.preventDefault()
        depth.current = 0
        setDragging(false)
        if (!refuses) add(Array.from(event.dataTransfer.files))
      }}
      {...props}
    />
  )
}

/**
 * Opens the file picker: the keyboard's way in. A `Button`, outlined by
 * default; disabled with the dropzone, and once `maxFiles` is reached.
 */
function DropzoneTrigger({
  variant = "outline",
  disabled,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const context = useDropzoneContext("DropzoneTrigger")
  return (
    <Button
      data-slot="dropzone-trigger"
      variant={variant}
      disabled={disabled || context.disabled || context.full}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.open()
      }}
      {...props}
    />
  )
}

/**
 * The picked files, one `Attachment` each, stacked. Renders nothing while
 * there are none. For a scrolling row use `AttachmentGroup` instead.
 */
function DropzoneList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  if (React.Children.count(children) === 0) return null
  return (
    <div
      data-slot="dropzone-list"
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

type DropzoneRemoveProps = React.ComponentProps<typeof AttachmentAction> & {
  file: File
}

/**
 * Removes `file` from the dropzone: an `AttachmentAction` with a cross,
 * labelled "Remove <name>". Focus moves to the next file's remove button,
 * or to the browse button when the list is empty.
 */
function DropzoneRemove({
  file,
  onClick,
  children,
  ...props
}: DropzoneRemoveProps) {
  const { remove, messages, focusAfterRemove, disabled } =
    useDropzoneContext("DropzoneRemove")
  return (
    <AttachmentAction
      data-slot="dropzone-remove"
      aria-label={messages.remove(file.name)}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        const root = event.currentTarget.closest("[data-slot=dropzone]")
        const buttons = Array.from(
          root?.querySelectorAll("[data-slot=dropzone-remove]") ?? []
        )
        focusAfterRemove(buttons.indexOf(event.currentTarget))
        remove(file)
      }}
      {...props}
    >
      {children ?? <XIcon />}
    </AttachmentAction>
  )
}

export {
  Dropzone,
  DropzoneArea,
  DropzoneTrigger,
  DropzoneList,
  DropzoneRemove,
  useDropzone,
  formatFileSize,
}
export type {
  DropzoneProps,
  DropzoneFileRejection,
  DropzoneRejectionReason,
  DropzoneMessages,
}
