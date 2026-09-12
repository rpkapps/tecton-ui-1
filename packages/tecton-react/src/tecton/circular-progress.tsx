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
      xs: "size-4 [--stroke:2.5px] text-[0.5rem]",
      sm: "size-6 [--stroke:3px] text-[0.625rem]",
      md: "size-10 [--stroke:3.5px] text-xs",
      lg: "size-16 [--stroke:4px] text-sm",
      xl: "size-24 [--stroke:5px] text-base",
    },
    color: {
      primary: "text-primary",
      foreground: "text-foreground",
      success: "text-success",
      warning: "text-warning",
      error: "text-destructive",
      info: "text-info",
    },
  },
  defaultVariants: {
    size: "md",
    color: "primary",
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
  color = "primary",
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
                isIndeterminate && "animate-spin"
              )}
              aria-hidden
            >
              <circle
                cx="24"
                cy="24"
                r={RADIUS}
                fill="none"
                strokeWidth="var(--stroke)"
                className="stroke-current opacity-20"
              />
              <circle
                cx="24"
                cy="24"
                r={RADIUS}
                fill="none"
                strokeWidth="var(--stroke)"
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
