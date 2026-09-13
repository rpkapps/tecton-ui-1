"use client"

import * as React from "react"
import { cn } from "cn"
import { Maximize2Icon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

/**
 * A preview tile for a background effect in the docs: the effect behind
 * `children`, with a button that opens the same effect and content full
 * screen (Escape or the Close button leaves it).
 */
export function BackgroundPreview({
  background,
  className,
  children,
}: {
  /** The background element, e.g. `<ContourBackground tone="azure" />`. */
  background: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  const [fullscreen, setFullscreen] = React.useState(false)

  React.useEffect(() => {
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  return (
    <>
      <div
        className={cn(
          "relative isolate flex flex-col justify-end overflow-hidden rounded-lg border bg-background p-3",
          className
        )}
      >
        {background}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View fullscreen"
          className="absolute top-2 right-2"
          onPress={() => setFullscreen(true)}
        >
          <Maximize2Icon />
        </Button>
        {children}
      </div>
      {fullscreen && (
        <div
          role="dialog"
          aria-label="Background preview"
          className="fixed inset-0 isolate z-50 flex flex-col justify-end bg-background p-10"
        >
          {background}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
            onPress={() => setFullscreen(false)}
          >
            <XIcon /> Close
          </Button>
          <div className="max-w-3xl">{children}</div>
        </div>
      )}
    </>
  )
}
