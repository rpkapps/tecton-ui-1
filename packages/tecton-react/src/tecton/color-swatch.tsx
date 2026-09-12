"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  ColorSwatch as ColorSwatchPrimitive,
  composeRenderProps,
  parseColor,
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

/**
 * React Aria's ColorSwatch only parses hex/rgb/hsl(a) strings. Tecton tokens
 * may be `oklch(...)` or `var(--...)`, so anything it cannot parse is rendered
 * as a plain swatch with the value as CSS background.
 */
function isParseable(color: ColorSwatchPrimitiveProps["color"]) {
  if (typeof color !== "string") return true
  try {
    parseColor(color)
    return true
  } catch {
    return false
  }
}

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
  const swatchClass = cn(colorSwatchVariants({ size, shape }), label || value ? "" : className)
  const swatch = isParseable(props.color) ? (
    <ColorSwatchPrimitive
      data-slot="color-swatch"
      className={composeRenderProps(className, () => swatchClass)}
      {...props}
    />
  ) : (
    <span
      data-slot="color-swatch"
      role="img"
      aria-label={props["aria-label"] ?? String(props.color)}
      className={swatchClass}
      style={{ background: String(props.color) }}
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
