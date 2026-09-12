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
      variant: {
        default: "rounded-lg border bg-card",
        elevated: "rounded-lg border bg-card shadow-md",
        flat: "bg-card",
        outline: "rounded-lg border bg-transparent",
      },
      size: {
        sm: "[--panel-px:0.75rem] [--panel-py:0.5rem] text-sm",
        md: "[--panel-px:1rem] [--panel-py:0.75rem] text-sm",
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

function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn(
        "flex shrink-0 items-start gap-2 border-b px-(--panel-px) py-(--panel-py) has-data-[slot=panel-actions]:items-center",
        className
      )}
      {...props}
    />
  )
}

function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        "min-w-0 flex-1 truncate text-sm leading-none font-medium",
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
      className={cn("basis-full text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function PanelActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-actions"
      className={cn("-my-1 -mr-2 ml-auto flex shrink-0 items-center gap-1", className)}
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
