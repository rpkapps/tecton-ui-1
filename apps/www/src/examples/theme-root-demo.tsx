"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import { ThemeRoot } from "@tecton/react/tecton/theme-root"

/**
 * The root sets `--primary` for its own subtree. The dialog portals out of
 * that subtree, so it only keeps the green because `ThemeRoot` gave it a
 * body-level container with the same classes — the status line reports which
 * container it landed in.
 */
export default function ThemeRootDemo() {
  const [open, setOpen] = React.useState(false)
  const [slot, setSlot] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setSlot(null)
      return
    }
    const dialog = document.querySelector('[role="dialog"]')
    const root = dialog?.closest("[data-tecton-root]")
    setSlot(root?.getAttribute("data-slot") ?? null)
  }, [open])

  return (
    <ThemeRoot className="rounded-lg border p-6 [--primary:var(--tecton-palette-green-560)]">
      <div className="flex flex-col items-start gap-4 text-sm">
        <p className="text-muted-foreground">
          Everything inside this root uses its own <code>--primary</code>.
        </p>
        <DialogTrigger isOpen={open} onOpenChange={setOpen}>
          <Button>Open dialog</Button>
          <Dialog className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Inside the overlay container</DialogTitle>
              <DialogDescription>
                This dialog is not in the subtree above; it is in the container
                that <code>ThemeRoot</code> appended to the body.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose variant="outline">Close</DialogClose>
              <Button>Primary action</Button>
            </DialogFooter>
          </Dialog>
        </DialogTrigger>
        <p aria-live="polite" className="text-muted-foreground">
          {open ? (
            slot === "theme-root-overlay" ? (
              <>
                Portalled into{" "}
                <code>data-slot=&quot;theme-root-overlay&quot;</code>
              </>
            ) : (
              <>
                Portalled outside the root container ({slot ?? "no container"})
              </>
            )
          ) : (
            "Open the dialog to see where it lands."
          )}
        </p>
      </div>
    </ThemeRoot>
  )
}
