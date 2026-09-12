import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

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

function CanvasToolbar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof canvasToolbarVariants>) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation ?? undefined}
      data-slot="canvas-toolbar"
      data-orientation={orientation}
      className={cn(canvasToolbarVariants({ orientation }), className)}
      {...props}
    />
  )
}

function CanvasLegend({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="canvas-legend"
      className={cn(
        "m-0 grid gap-1.5 rounded-md border border-border-subtle bg-card/90 px-2.5 py-2 text-xs text-card-foreground shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-card/80",
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
}: React.ComponentProps<"div"> & {
  /** Colour or pattern of the symbol; a CSS colour string or a node. */
  swatch: React.ReactNode
}) {
  return (
    <div
      data-slot="canvas-legend-item"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <dt className="flex size-3 shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
        {typeof swatch === "string" ? (
          <span
            aria-hidden
            className="size-full"
            style={{ background: swatch }}
          />
        ) : (
          swatch
        )}
      </dt>
      <dd className="m-0 truncate">{children}</dd>
    </div>
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
