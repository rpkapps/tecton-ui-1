"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  composeRenderProps,
  type ButtonProps as ButtonPrimitiveProps,
} from "react-aria-components"

/**
 * Tecton FAB — floating action button. `shape="extended"` renders a pill
 * with icon + label, `shape="round"` an icon-only circle. `isActive`
 * reproduces the "activated" state from the design system.
 */
const fabVariants = cva(
  "group/fab inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap shadow-md transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50 data-pressed:translate-y-px data-disabled:pointer-events-none data-disabled:opacity-50 data-disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground data-hovered:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)] data-[active=true]:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_20%)]",
        secondary:
          "bg-secondary text-secondary-foreground data-hovered:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)] data-[active=true]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_14%)]",
        tertiary:
          "bg-transparent text-secondary-foreground shadow-none data-hovered:bg-accent data-hovered:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        outlined:
          "border-border bg-transparent text-foreground shadow-none data-hovered:bg-accent data-hovered:border-muted-foreground data-[active=true]:bg-accent data-[active=true]:border-foreground",
      },
      size: {
        md: "h-10 text-sm [&_svg:not([class*='size-'])]:size-5",
        sm: "h-8 text-xs [&_svg:not([class*='size-'])]:size-4",
      },
      shape: {
        extended: "",
        round: "p-0",
      },
    },
    compoundVariants: [
      { shape: "extended", size: "md", className: "px-4 has-[>svg]:pl-3" },
      { shape: "extended", size: "sm", className: "px-3 has-[>svg]:pl-2.5" },
      { shape: "round", size: "md", className: "w-10" },
      { shape: "round", size: "sm", className: "w-8" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "extended",
    },
  }
)

type FabProps = Omit<ButtonPrimitiveProps, "className" | "children"> &
  VariantProps<typeof fabVariants> & {
    className?: string
    children?: React.ReactNode
    /** Activated visual state. */
    isActive?: boolean
  }

function Fab({
  className,
  variant = "primary",
  size = "md",
  shape = "extended",
  isActive,
  ...props
}: FabProps) {
  return (
    <ButtonPrimitive
      data-slot="fab"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-active={isActive ? "true" : undefined}
      className={composeRenderProps(className, (className) =>
        cn(fabVariants({ variant, size, shape }), className)
      )}
      {...props}
    />
  )
}

export { Fab, fabVariants }
export type { FabProps }
