"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  composeRenderProps,
  Label as LabelPrimitive,
  Meter as MeterPrimitive,
  type MeterProps as MeterPrimitiveProps,
} from "react-aria-components"

/**
 * Tecton Meter — a segmented gauge for risk, complexity or confidence
 * readouts (as used on the FDA and Well Design cards). Built on React Aria
 * `Meter`; `segments` controls the number of blocks, `color` the fill
 * (or `"auto"` to pick success / warning / error from the value).
 */
const meterVariants = cva("flex w-full flex-col gap-1", {
  variants: {
    size: {
      sm: "text-xs [--meter-h:0.25rem]",
      md: "text-sm [--meter-h:0.375rem]",
      lg: "text-sm [--meter-h:0.625rem]",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

type MeterColor =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "auto"
  /** Fill from the `--meter-fill` CSS variable (e.g. `style={{ "--meter-fill": "var(--chart-2)" }}`). */
  | "custom"

const fillClass: Record<Exclude<MeterColor, "auto">, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  custom: "bg-(--meter-fill,var(--primary))",
}

function autoColor(percentage: number): Exclude<MeterColor, "auto" | "custom"> {
  if (percentage >= 67) return "error"
  if (percentage >= 34) return "warning"
  return "success"
}

type MeterProps = Omit<MeterPrimitiveProps, "className" | "children"> &
  VariantProps<typeof meterVariants> & {
    className?: string
    label?: React.ReactNode
    /** Number of segments; `1` renders a continuous bar. */
    segments?: number
    color?: MeterColor
    /** Show the formatted value at the end of the label row. */
    showValue?: boolean
    /**
     * Custom value text (e.g. "High"). A string or number is also what
     * assistive tech announces (`aria-valuetext`) instead of the percentage.
     */
    valueLabel?: React.ReactNode
  }

function Meter({
  className,
  size = "md",
  label,
  segments = 5,
  color = "default",
  showValue,
  valueLabel,
  ...props
}: MeterProps) {
  // React Aria turns a text `valueLabel` into `aria-valuetext`, so the
  // announced value matches the one on screen. A node cannot be text.
  const ariaValueText =
    typeof valueLabel === "string" || typeof valueLabel === "number"
      ? String(valueLabel)
      : undefined
  return (
    <MeterPrimitive
      data-slot="meter"
      data-size={size}
      className={composeRenderProps(className, (className) =>
        cn(meterVariants({ size }), className)
      )}
      {...props}
      valueLabel={ariaValueText}
    >
      {({ percentage, valueText }) => {
        const resolved = color === "auto" ? autoColor(percentage) : color
        const count = Math.max(1, Math.floor(segments))
        const filled = (percentage / 100) * count
        return (
          <>
            {(label || showValue || valueLabel) && (
              <div className="flex items-center justify-between gap-2">
                {label && (
                  <LabelPrimitive
                    data-slot="meter-label"
                    className="text-muted-foreground"
                  >
                    {label}
                  </LabelPrimitive>
                )}
                {(valueLabel || showValue) && (
                  <span
                    data-slot="meter-value"
                    className="ms-auto font-medium tabular-nums"
                  >
                    {valueLabel ?? valueText}
                  </span>
                )}
              </div>
            )}
            <div
              data-slot="meter-track"
              data-color={resolved}
              className="flex h-(--meter-h) w-full gap-0.5"
            >
              {Array.from({ length: count }, (_, i) => {
                const fill = Math.min(1, Math.max(0, filled - i))
                return (
                  <span
                    key={i}
                    data-slot="meter-segment"
                    className="relative flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 start-0 rounded-full transition-[width]",
                        fillClass[resolved]
                      )}
                      style={{ width: `${fill * 100}%` }}
                    />
                  </span>
                )
              })}
            </div>
          </>
        )
      }}
    </MeterPrimitive>
  )
}

export { Meter, meterVariants }
export type { MeterProps, MeterColor }
