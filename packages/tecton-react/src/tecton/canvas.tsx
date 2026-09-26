"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  composeRenderProps,
  Toolbar as ToolbarPrimitive,
  type ToolbarProps as ToolbarPrimitiveProps,
} from "react-aria-components"

/**
 * Tecton Canvas — a full-bleed work surface (map, schematic, 3D view) with
 * floating chrome. `CanvasSurface` fills the area; `CanvasOverlay` pins
 * controls to an edge or corner; `CanvasToolbar` is the floating tool rail
 * used inside an overlay; `CanvasLegend` lists the symbology.
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
        "top-left": "top-3 left-3 flex-col items-start",
        top: "top-3 left-1/2 -translate-x-1/2 flex-row items-center",
        "top-right": "top-3 right-3 flex-col items-end",
        left: "top-1/2 left-3 -translate-y-1/2 flex-col items-start",
        right: "top-1/2 right-3 -translate-y-1/2 flex-col items-end",
        "bottom-left": "bottom-3 left-3 flex-col items-start",
        bottom: "bottom-3 left-1/2 -translate-x-1/2 flex-row items-center",
        "bottom-right": "right-3 bottom-3 flex-col items-end",
      },
    },
    defaultVariants: {
      position: "top-left",
    },
  }
)

function CanvasOverlay({
  className,
  position = "top-left",
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

type CanvasToolbarProps = Omit<ToolbarPrimitiveProps, "orientation"> &
  VariantProps<typeof canvasToolbarVariants>

/**
 * A React Aria `Toolbar`: arrow keys move along the rail (Up/Down when
 * vertical, Left/Right when horizontal, mirrored in RTL) and Tab leaves it.
 * Give it an `aria-label`.
 */
function CanvasToolbar({
  className,
  orientation = "vertical",
  ...props
}: CanvasToolbarProps) {
  const resolved = orientation ?? "vertical"
  return (
    <ToolbarPrimitive
      data-slot="canvas-toolbar"
      orientation={resolved}
      className={composeRenderProps(className, (className) =>
        cn(canvasToolbarVariants({ orientation: resolved }), className)
      )}
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
  CanvasLegend,
  CanvasLegendItem,
  canvasOverlayVariants,
  canvasToolbarVariants,
}
export type { CanvasToolbarProps }
