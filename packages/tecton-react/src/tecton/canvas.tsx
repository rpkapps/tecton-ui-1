"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { cn } from "cn"

import { Button } from "@tecton/react/components/button"

/**
 * Tecton Canvas — a full-bleed work surface (map, schematic, 3D view) with
 * floating chrome. `CanvasSurface` fills the area; `CanvasOverlay` pins
 * controls to an edge or corner (logical positions: `start`/`end` follow the
 * reading direction and mirror in RTL); `CanvasToolbar` is the floating tool rail
 * used inside an overlay, `CanvasToolbarButton` a tool in it; `CanvasLegend`
 * lists the symbology.
 */
function Canvas({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="canvas"
      className={cn(
        "group/canvas relative isolate flex min-h-0 flex-1 overflow-hidden bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

function CanvasSurface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="canvas-surface"
      className={cn("absolute inset-0 size-full", className)}
      {...props}
    />
  )
}

const canvasOverlayVariants = cva(
  "pointer-events-none absolute z-10 flex gap-2 *:pointer-events-auto",
  {
    variants: {
      position: {
        "top-start": "start-3 top-3 flex-col items-start",
        top: "top-3 left-1/2 -translate-x-1/2 flex-row items-center",
        "top-end": "end-3 top-3 flex-col items-end",
        start: "start-3 top-1/2 -translate-y-1/2 flex-col items-start",
        end: "end-3 top-1/2 -translate-y-1/2 flex-col items-end",
        "bottom-start": "start-3 bottom-3 flex-col items-start",
        bottom: "bottom-3 left-1/2 -translate-x-1/2 flex-row items-center",
        "bottom-end": "end-3 bottom-3 flex-col items-end",
      },
    },
    defaultVariants: {
      position: "top-start",
    },
  }
)

function CanvasOverlay({
  className,
  position = "top-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof canvasOverlayVariants>) {
  return (
    <div
      data-slot="canvas-overlay"
      data-position={position}
      className={cn(canvasOverlayVariants({ position }), className)}
      {...props}
    />
  )
}

const canvasToolbarVariants = cva(
  "flex rounded-md border border-border-subtle bg-card/90 p-0.5 text-card-foreground shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 [&_[data-slot=separator]]:my-0.5",
  {
    variants: {
      orientation: {
        vertical: "flex-col",
        horizontal: "flex-row",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

type CanvasToolbarProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof canvasToolbarVariants> & {
    /** `CanvasToolbarButton`s, separators and groups. */
    children?: React.ReactNode
    /** Disables every tool in the rail. */
    disabled?: boolean
  }

/**
 * The tool rail: one tab stop, arrow keys move between its
 * `CanvasToolbarButton`s (Up/Down when vertical, Left/Right when horizontal,
 * mirrored in RTL) and stop at the ends; Tab leaves it. Give it an
 * `aria-label`.
 */
function CanvasToolbar({
  className,
  orientation = "vertical",
  ...props
}: CanvasToolbarProps) {
  const resolved = orientation ?? "vertical"
  return (
    <ToolbarPrimitive.Root
      data-slot="canvas-toolbar"
      orientation={resolved}
      loopFocus={false}
      className={cn(
        canvasToolbarVariants({ orientation: resolved }),
        className
      )}
      {...props}
    />
  )
}

type CanvasToolbarButtonProps = React.ComponentProps<typeof Button> & {
  /**
   * Stays focusable while disabled, so arrow keys do not skip it. Default
   * `true`.
   */
  focusableWhenDisabled?: boolean
}

/**
 * A tool in the rail: a ghost icon `Button` by default. Compose it with a
 * trigger through `render`, e.g.
 * `<CanvasToolbarButton render={<DropdownMenuTrigger />} />`.
 */
function CanvasToolbarButton({
  variant = "ghost",
  size = "icon-sm",
  className,
  render,
  nativeButton,
  ...props
}: CanvasToolbarButtonProps) {
  return (
    <ToolbarPrimitive.Button
      data-slot="canvas-toolbar-button"
      render={
        <Button
          variant={variant}
          size={size}
          // Stays focusable when disabled (roving toolbar), so the Button's
          // `disabled:` styles never apply: dim on aria-disabled instead.
          className={cn(
            "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
            className
          )}
          render={render}
          nativeButton={nativeButton}
        />
      }
      {...props}
    />
  )
}

/**
 * The symbology as a list: each item is a swatch (decorative) followed by
 * its name, so assistive tech reads the names in order.
 */
function CanvasLegend({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="canvas-legend"
      className={cn(
        "m-0 grid list-none gap-1.5 rounded-md border border-border-subtle bg-card/90 px-2.5 py-2 text-xs text-card-foreground shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-card/80",
        className
      )}
      {...props}
    />
  )
}

function CanvasLegendItem({
  className,
  swatch,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  /** Colour or pattern of the symbol; a CSS colour string or a node. */
  swatch: React.ReactNode
}) {
  return (
    <li
      data-slot="canvas-legend-item"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <span
        data-slot="canvas-legend-swatch"
        aria-hidden
        className="flex size-3 shrink-0 items-center justify-center overflow-hidden rounded-[2px]"
      >
        {typeof swatch === "string" ? (
          <span className="size-full" style={{ background: swatch }} />
        ) : (
          swatch
        )}
      </span>
      <span data-slot="canvas-legend-label" className="min-w-0 truncate">
        {children}
      </span>
    </li>
  )
}

export {
  Canvas,
  CanvasSurface,
  CanvasOverlay,
  CanvasToolbar,
  CanvasToolbarButton,
  CanvasLegend,
  CanvasLegendItem,
  canvasOverlayVariants,
  canvasToolbarVariants,
}
export type { CanvasToolbarProps, CanvasToolbarButtonProps }
