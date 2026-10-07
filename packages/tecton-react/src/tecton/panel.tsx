import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Tecton Panel — a titled application surface (side panels, tool panels,
 * card-like sections in a dashboard). `PanelHeader` holds the title,
 * optional description and a trailing `PanelActions` slot; `PanelContent`
 * scrolls; `PanelFooter` pins actions to the bottom.
 */
const panelVariants = cva(
  "group/panel flex min-h-0 flex-col overflow-hidden text-card-foreground",
  {
    variants: {
      // Radius and hairline colour are Card's, but Panel draws the edge as a
      // border inside its own box: a Panel fills containers that clip overflow
      // (resizable wrappers, split panels), where an outset ring is cut off.
      variant: {
        default: "rounded-xl border border-foreground/10 bg-card",
        elevated: "rounded-xl border border-foreground/10 bg-card shadow-md",
        flat: "rounded-xl bg-card",
        outline: "rounded-xl border border-border bg-transparent",
      },
      size: {
        sm: "text-sm [--panel-px:0.75rem] [--panel-py:0.5rem]",
        md: "text-sm [--panel-px:1rem] [--panel-py:0.75rem]",
        lg: "[--panel-px:1.5rem] [--panel-py:1rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function Panel({
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof panelVariants>) {
  return (
    <section
      data-slot="panel"
      data-variant={variant}
      data-size={size}
      className={cn(panelVariants({ variant, size }), className)}
      {...props}
    />
  )
}

/**
 * The header row wraps: a `PanelDescription` takes a line of its own below
 * the title and the actions (it is ordered last), so the title keeps the
 * width the actions leave instead of being squeezed to nothing.
 */
function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn(
        "flex shrink-0 flex-wrap items-start gap-x-2 gap-y-1 border-b px-(--panel-px) py-(--panel-py) has-data-[slot=panel-actions]:items-center",
        className
      )}
      {...props}
    />
  )
}

/**
 * Beside an overflow row in `PanelActions` the title keeps its natural
 * width up to 60% of the header, so the row has a stable width to collapse
 * against; otherwise it fills the header as before.
 */
function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        "min-w-0 flex-1 truncate text-sm leading-none font-medium [[data-slot=panel-header]:has([data-overflow-root])>&]:max-w-3/5 [[data-slot=panel-header]:has([data-overflow-root])>&]:flex-initial",
        className
      )}
      {...props}
    />
  )
}

function PanelDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="panel-description"
      className={cn(
        "order-last basis-full text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * Trailing actions. A plain slot: put an `Overflow` or `Toolbar` inside it
 * when a panel has more actions than fit, and the slot takes the width the
 * title leaves so the row can collapse.
 */
function PanelActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-actions"
      className={cn(
        "-my-1 ms-auto -me-2 flex shrink-0 items-center gap-1 has-[[data-overflow-root]]:min-w-0 has-[[data-overflow-root]]:flex-1 has-[[data-overflow-root]]:shrink has-[[data-overflow-root]]:basis-0 has-[[data-overflow-root]]:justify-end [&>[data-overflow-root]]:min-w-0 [&>[data-overflow-root]]:flex-1 [&>[data-overflow-root]]:justify-end",
        className
      )}
      {...props}
    />
  )
}

function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-content"
      className={cn(
        "min-h-0 flex-1 overflow-auto px-(--panel-px) py-(--panel-py)",
        className
      )}
      {...props}
    />
  )
}

function PanelFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="panel-footer"
      className={cn(
        "flex shrink-0 items-center gap-2 border-t px-(--panel-px) py-(--panel-py)",
        className
      )}
      {...props}
    />
  )
}

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelActions,
  PanelContent,
  PanelFooter,
  panelVariants,
}
