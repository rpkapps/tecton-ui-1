"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Tecton circular Progress — determinate ring with optional centred value
 * label, or an indeterminate spinner when `value` is `null`.
 */
const circularProgressVariants = cva("relative inline-flex shrink-0", {
  variants: {
    size: {
      // `--stroke` is read inside the SVG, where a px is a unit of the
      // ring's 48-unit viewBox and scales with the diameter. The values give
      // 2.5 / 3 / 3.5 / 4 / 5 screen px at the size's own diameter
      // (xs: 7.5 × 16/48 = 2.5px).
      xs: "size-4 text-[0.5rem] [--stroke:7.5px]",
      sm: "size-6 text-[0.625rem] [--stroke:6px]",
      md: "size-10 text-xs [--stroke:4.2px]",
      lg: "size-16 text-sm [--stroke:3px]",
      xl: "size-24 text-base [--stroke:2.5px]",
    },
    color: {
      // `default` is painted with the shared `progress` token, like the
      // shadcn Progress indicator; the track follows at its /38 opacity.
      default: "text-progress",
      foreground: "text-foreground",
      success: "text-success",
      warning: "text-warning",
      error: "text-destructive",
      info: "text-info",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
  },
})

type CircularProgressProps = Omit<
  React.ComponentProps<"div">,
  "children" | "color"
> &
  VariantProps<typeof circularProgressVariants> & {
    /** The current value; `null` shows an indeterminate spinner. */
    value: number | null
    /** @default 0 */
    min?: number
    /** @default 100 */
    max?: number
    /** Number format of the value (a percentage of the range by default). */
    format?: Intl.NumberFormatOptions
    /** Locale of the formatted value (the runtime locale by default). */
    locale?: Intl.LocalesArgument
    /** Show the formatted value in the centre (determinate only). */
    showValue?: boolean
    /**
     * Custom value text (e.g. "3 of 8 wells"), shown in the centre in place
     * of the formatted value. A string or number is also what assistive tech
     * announces (`aria-valuetext`) instead of the percentage.
     */
    valueLabel?: React.ReactNode
    /** Custom centre content (overrides `showValue`). */
    children?: React.ReactNode
  }

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function toPercentage(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100
  return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
}

function CircularProgress({
  className,
  size = "md",
  color = "default",
  value,
  min = 0,
  max = 100,
  showValue,
  valueLabel,
  children,
  ...props
}: CircularProgressProps) {
  // A text `valueLabel` becomes `aria-valuetext`, so the announced value
  // matches the one on screen. A node cannot be text: the formatted value is
  // announced instead.
  const ariaValueText =
    typeof valueLabel === "string" || typeof valueLabel === "number"
      ? String(valueLabel)
      : undefined
  const hasValueLabel =
    valueLabel !== undefined && valueLabel !== null && valueLabel !== false
  const indeterminate = value == null || !Number.isFinite(value)
  const pct = indeterminate ? 25 : toPercentage(value, min, max)
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
  return (
    <ProgressPrimitive.Root
      data-slot="circular-progress"
      data-size={size}
      className={cn(circularProgressVariants({ size, color }), className)}
      value={value}
      min={min}
      max={max}
      getAriaValueText={
        ariaValueText === undefined ? undefined : () => ariaValueText
      }
      {...props}
    >
      <svg
        viewBox="0 0 48 48"
        className={cn(
          "size-full -rotate-90",
          // Reduced motion keeps a slow turn: a still arc would read as a
          // stuck value, not as work in progress.
          indeterminate &&
            "animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
        )}
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          style={{ strokeWidth: "var(--stroke)" }}
          className="stroke-current opacity-38"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          style={{ strokeWidth: "var(--stroke)" }}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-current transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      {children || hasValueLabel ? (
        <span
          data-slot="circular-progress-value"
          // The root already announces the value (`aria-valuetext`).
          aria-hidden={children ? undefined : true}
          className="absolute inset-0 flex items-center justify-center font-medium text-foreground tabular-nums"
        >
          {children ?? valueLabel}
        </span>
      ) : showValue && !indeterminate ? (
        <ProgressPrimitive.Value
          data-slot="circular-progress-value"
          className="absolute inset-0 flex items-center justify-center font-medium text-foreground tabular-nums"
        />
      ) : null}
    </ProgressPrimitive.Root>
  )
}

export { CircularProgress, circularProgressVariants }
export type { CircularProgressProps }
