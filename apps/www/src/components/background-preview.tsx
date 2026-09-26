"use client"

import * as React from "react"
import { cn } from "cn"
import { Maximize2Icon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@tecton/react/components/dialog"

/**
 * A preview tile for a background effect in the docs: the effect behind
 * `children`, with a button that opens the same effect and content full
 * screen in a modal dialog (focus is trapped and restored; Escape or the
 * Close button leaves it).
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
          onClick={() => setFullscreen(true)}
        >
          <Maximize2Icon />
        </Button>
        {children}
      </div>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent
          showCloseButton={false}
          aria-label="Background preview"
          className="start-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none bg-background p-0 text-base text-foreground ring-0 sm:max-w-none rtl:translate-x-0"
        >
          <div className="relative isolate flex h-full flex-col justify-end p-10">
            {background}
            <DialogClose
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4"
                />
              }
            >
              <XIcon /> Close
            </DialogClose>
            <div className="max-w-3xl">{children}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
