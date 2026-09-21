"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CloseIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { Toolbar, type ToolbarProps } from "@tecton/react/tecton/overflow"

/**
 * Tecton ActionBar — a transient bar that appears while there is something
 * to act on: rows selected in a table, unsaved changes in a form. It owns
 * placement (swapped into a toolbar row, or floating over the content),
 * the enter transition and Escape to dismiss. What is in it is a `Toolbar`
 * (`ActionBarActions`), so the actions collapse by the rules in
 * `docs/OVERFLOW-RULES.md`; the summary (`ActionBarSelection`,
 * `ActionBarMessage`) compacts with container queries after the actions
 * have overflowed.
 */
const actionBarVariants = cva(
  "@container/action-bar flex min-w-0 animate-in flex-wrap items-center gap-x-3 gap-y-1.5 text-sm duration-150 fade-in-0",
  {
    variants: {
      placement: {
        toolbar: "w-full rounded-md bg-muted px-2 py-1.5",
        // Not `w-fit`: `@container` contains the inline size, so a fit-content
        // bar would resolve to its padding alone and the toolbar would measure
        // no room. The card takes the width of its scroll container instead;
        // pass `mx-auto max-w-*` to centre a narrower one.
        floating:
          "sticky bottom-4 z-20 mx-4 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-lg slide-in-from-bottom-2",
      },
    },
    defaultVariants: {
      placement: "toolbar",
    },
  }
)

type ActionBarProps = React.ComponentProps<"div"> &
  VariantProps<typeof actionBarVariants> & {
    /** Render the bar. Default `true`. */
    isOpen?: boolean
    /** Called on Escape while focus is inside the bar. */
    onDismiss?: () => void
  }

function ActionBar({
  className,
  placement = "toolbar",
  isOpen = true,
  onDismiss,
  children,
  ...props
}: ActionBarProps) {
  if (!isOpen) return null

  return (
    <div
      role="region"
      data-slot="action-bar"
      data-placement={placement}
      className={cn(actionBarVariants({ placement }), className)}
      {...props}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        // Escape while focus is in the bar dismisses it; an open overlay
        // (menu, popover) consumes its own Escape first.
        if (event.key === "Escape" && onDismiss && !event.defaultPrevented) {
          event.preventDefault()
          onDismiss()
        }
      }}
    >
      {children}
    </div>
  )
}

/**
 * Selection summary: "12 of 340 selected · Clear". Compacts to "12 selected"
 * and then to the bare count as the bar narrows (rule 8); the live region
 * always announces the full text.
 */
type ActionBarSelectionProps = Omit<React.ComponentProps<"div">, "children"> & {
  count: number
  total?: number
  /** Noun for the live announcement, e.g. "wells". Default "selected". */
  label?: string
  onClear?: () => void
  clearLabel?: string
}

function ActionBarSelection({
  className,
  count,
  total,
  label,
  onClear,
  clearLabel = "Clear selection",
  ...props
}: ActionBarSelectionProps) {
  const noun = label ? ` ${label}` : ""
  const full =
    total !== undefined
      ? `${count} of ${total}${noun} selected`
      : `${count}${noun} selected`
  return (
    <div
      data-slot="action-bar-selection"
      className={cn("flex shrink-0 items-center gap-1 tabular-nums", className)}
      {...props}
    >
      <span aria-live="polite" className="sr-only">
        {full}
      </span>
      <span aria-hidden className="font-medium whitespace-nowrap">
        <span className="@max-lg/action-bar:hidden">{full}</span>
        <span className="hidden @max-lg/action-bar:inline @max-sm/action-bar:hidden">
          {count} selected
        </span>
        <span className="hidden @max-sm/action-bar:inline">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {count}
          </span>
        </span>
      </span>
      {onClear ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onPress={onClear}
            className="@max-sm/action-bar:hidden"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={clearLabel}
            onPress={onClear}
            className="hidden @max-sm/action-bar:inline-flex"
          >
            <CloseIcon />
          </Button>
        </>
      ) : null}
    </div>
  )
}

/** A text summary instead of a selection, e.g. "You have unsaved changes". */
function ActionBarMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="action-bar-message"
      className={cn("min-w-0 shrink truncate font-medium", className)}
      {...props}
    />
  )
}

/**
 * The actions: an overflow `Toolbar`. Wrap collapsible actions in
 * `OverflowItem`; leave the primary action unwrapped so it never leaves.
 */
function ActionBarActions({
  className,
  "aria-label": ariaLabel = "Actions",
  ...props
}: ToolbarProps) {
  return (
    <Toolbar
      data-slot="action-bar-actions"
      aria-label={ariaLabel}
      className={cn("ms-auto min-w-0 flex-1 justify-end", className)}
      {...props}
    />
  )
}

export {
  ActionBar,
  ActionBarSelection,
  ActionBarMessage,
  ActionBarActions,
  actionBarVariants,
}
export type { ActionBarProps, ActionBarSelectionProps }
