"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon, CopyIcon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

/**
 * Tecton CopyButton — copies `value` to the clipboard and shows a check
 * for `timeout` ms, or a cross and "Copy failed" when the copy is refused.
 * Where the Clipboard API is missing or rejects (a page served over plain
 * HTTP from a non-localhost address, an iframe without `clipboard-write`),
 * it falls back to the legacy copy command before giving up. Either outcome
 * is announced politely. Icon-only by default; pass children for a labelled
 * button.
 */
type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "children"
> & {
  children?: React.ReactNode
  value: string
  timeout?: number
  onCopied?: (value: string) => void
  /** Called with the clipboard's error when the copy fails. */
  onError?: (error: unknown) => void
}

type CopyStatus = "idle" | "copied" | "error"

const STATUS_TEXT = {
  copied: "Copied",
  error: "Copy failed",
} as const

/**
 * One polite live region at the end of the body, shared by every copy
 * button: a region beside each button would be an extra sibling in button
 * groups and toolbars, and one inside the button is flattened away with the
 * button's other descendants. Inline styles, so it stays hidden where the
 * page's utilities do not reach (a scoped `ThemeRoot` remote).
 */
let liveRegion: HTMLElement | null = null

function announce(message: string) {
  if (typeof document === "undefined") return
  if (!liveRegion?.isConnected) {
    liveRegion = document.createElement("div")
    liveRegion.setAttribute("data-slot", "copy-button-announcer")
    liveRegion.setAttribute("aria-live", "polite")
    liveRegion.setAttribute("aria-atomic", "true")
    Object.assign(liveRegion.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      margin: "-1px",
      padding: "0",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
    })
    document.body.append(liveRegion)
  }
  const region = liveRegion
  // Emptied first and filled a moment later: a region that was just created
  // is not tracked yet, and a second "Copied" in a row must still be a change.
  region.textContent = ""
  setTimeout(() => {
    region.textContent = message
  }, 100)
}

/**
 * Copies through a selected off-screen textarea and `execCommand("copy")`,
 * which still works in the contexts that have no Clipboard API. Focus
 * returns to the element that had it (the button).
 */
function legacyCopy(value: string) {
  const active = document.activeElement
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    opacity: "0",
    pointerEvents: "none",
  })
  document.body.append(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  }
  textarea.remove()
  if (active instanceof HTMLElement) active.focus({ preventScroll: true })
  return copied
}

async function copyText(value: string) {
  try {
    // Throws, rather than rejects, where the Clipboard API is missing.
    await navigator.clipboard.writeText(value)
  } catch (error) {
    if (!legacyCopy(value)) throw error
  }
}

function CopyButton({
  value,
  timeout = 2000,
  onCopied,
  onError,
  className,
  variant = "ghost",
  size,
  children,
  ...props
}: CopyButtonProps) {
  const [status, setStatus] = React.useState<CopyStatus>("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const show = (next: Exclude<CopyStatus, "idle">) => {
    setStatus(next)
    announce(STATUS_TEXT[next])
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus("idle"), timeout)
  }

  const resolvedSize = size ?? (children ? "sm" : "icon-sm")
  const Icon =
    status === "copied" ? CheckIcon : status === "error" ? XIcon : CopyIcon

  return (
    <Button
      data-slot="copy-button"
      data-copied={status === "copied" ? "" : undefined}
      data-error={status === "error" ? "" : undefined}
      variant={variant}
      size={resolvedSize}
      aria-label={
        children ? undefined : status === "idle" ? "Copy" : STATUS_TEXT[status]
      }
      className={cn(
        "data-copied:text-success data-error:text-destructive",
        className
      )}
      onClick={async () => {
        try {
          await copyText(value)
        } catch (error) {
          show("error")
          onError?.(error)
          return
        }
        show("copied")
        onCopied?.(value)
      }}
      {...props}
    >
      <Icon />
      {children}
    </Button>
  )
}

export { CopyButton }
export type { CopyButtonProps }
