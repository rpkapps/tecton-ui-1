"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  composeRenderProps,
  ProgressBar as ProgressBarPrimitive,
  type ProgressBarProps,
} from "react-aria-components"

/**
 * Tecton circular Progress — determinate ring with optional centred value
 * label, or indeterminate spinner. Built on React Aria `ProgressBar`.
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

type CircularProgressProps = Omit<ProgressBarProps, "className" | "children"> &
  VariantProps<typeof circularProgressVariants> & {
    className?: string
    /** Show the formatted value in the centre (determinate only). */
    showValue?: boolean
    /** Custom centre content (overrides `showValue`). */
    children?: React.ReactNode
  }

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircularProgress({
  className,
  size = "md",
  color = "default",
  showValue,
  children,
  ...props
}: CircularProgressProps) {
  return (
    <ProgressBarPrimitive
      data-slot="circular-progress"
      data-size={size}
      className={composeRenderProps(className, (className) =>
        cn(circularProgressVariants({ size, color }), className)
      )}
      {...props}
    >
      {({ percentage, valueText, isIndeterminate }) => {
        const pct = isIndeterminate ? 25 : (percentage ?? 0)
        const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
        return (
          <>
            <svg
              viewBox="0 0 48 48"
              className={cn(
                "size-full -rotate-90",
                // Reduced motion keeps a slow turn: a still arc would read
                // as a stuck value, not as work in progress.
                isIndeterminate &&
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
            {(children || (showValue && !isIndeterminate)) && (
              <span
                data-slot="circular-progress-value"
                className="absolute inset-0 flex items-center justify-center font-medium text-foreground tabular-nums"
              >
                {children ?? valueText}
              </span>
            )}
          </>
        )
      }}
    </ProgressBarPrimitive>
  )
}

export { CircularProgress, circularProgressVariants }
export type { CircularProgressProps }
