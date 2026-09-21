"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon, CopyIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"

/**
 * Tecton CopyButton — copies `value` to the clipboard and shows a check
 * for `timeout` ms. Icon-only by default; pass children for a labelled
 * button.
 */
type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onPress" | "children"
> & {
  children?: React.ReactNode
  value: string
  timeout?: number
  onCopied?: (value: string) => void
}

function CopyButton({
  value,
  timeout = 2000,
  onCopied,
  className,
  variant = "ghost",
  size,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const resolvedSize = size ?? (children ? "sm" : "icon-sm")

  return (
    <Button
      data-slot="copy-button"
      data-copied={copied ? "true" : undefined}
      variant={variant}
      size={resolvedSize}
      aria-label={children ? undefined : copied ? "Copied" : "Copy"}
      className={cn("data-[copied=true]:text-success", className)}
      onPress={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          onCopied?.(value)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => setCopied(false), timeout)
        } catch {
          // Clipboard unavailable (insecure context / denied permission).
        }
      }}
      {...props}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {children}
    </Button>
  )
}

export { CopyButton }
export type { CopyButtonProps }
