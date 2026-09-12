"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  ColorSwatch as ColorSwatchPrimitive,
  composeRenderProps,
  type ColorSwatchProps as ColorSwatchPrimitiveProps,
} from "react-aria-components"

/**
 * Tecton ColorSwatch — a colour preview chip (React Aria `ColorSwatch`)
 * with optional label / value text. Used for colour tags, legends and the
 * theme documentation.
 */
const colorSwatchVariants = cva(
  "shrink-0 border border-border-subtle shadow-xs",
  {
    variants: {
      size: {
        xs: "size-3",
        sm: "size-4",
        md: "size-6",
        lg: "size-8",
        xl: "size-12",
      },
      shape: {
        square: "rounded-sm",
        rounded: "rounded-md",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "rounded",
    },
  }
)

type ColorSwatchProps = Omit<ColorSwatchPrimitiveProps, "className"> &
  VariantProps<typeof colorSwatchVariants> & {
    className?: string
    /** Text rendered next to the swatch. */
    label?: React.ReactNode
    /** Secondary text (e.g. the hex value), rendered in mono. */
    value?: React.ReactNode
  }

function ColorSwatch({
  className,
  size = "md",
  shape = "rounded",
  label,
  value,
  ...props
}: ColorSwatchProps) {
  const swatch = (
    <ColorSwatchPrimitive
      data-slot="color-swatch"
      className={composeRenderProps(className, (className) =>
        cn(colorSwatchVariants({ size, shape }), label || value ? "" : className)
      )}
      {...props}
    />
  )

  if (!label && !value) {
    return swatch
  }

  return (
    <span
      data-slot="color-swatch-item"
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      {swatch}
      <span className="flex min-w-0 flex-col leading-tight">
        {label && <span className="truncate font-medium">{label}</span>}
        {value && (
          <span className="truncate font-mono text-xs text-muted-foreground">
            {value}
          </span>
        )}
      </span>
    </span>
  )
}

export { ColorSwatch, colorSwatchVariants }
export type { ColorSwatchProps }
