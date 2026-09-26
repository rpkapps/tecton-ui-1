"use client"

import * as React from "react"
import { Meter as MeterPrimitive } from "@base-ui/react/meter"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Tecton Meter — a segmented gauge for risk, complexity or confidence
 * readouts (as used on the FDA and Well Design cards). `segments` controls
 * the number of blocks, `color` the fill (or `"auto"` to pick success /
 * warning / error from the value).
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

function toPercentage(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100
  return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
}

type MeterProps = Omit<React.ComponentProps<"div">, "children" | "color"> &
  VariantProps<typeof meterVariants> & {
    /** The current value. */
    value: number
    /** @default 0 */
    min?: number
    /** @default 100 */
    max?: number
    /** Number format of the shown value (a percentage of the range by default). */
    format?: Intl.NumberFormatOptions
    /** Locale of the formatted value (the runtime locale by default). */
    locale?: Intl.LocalesArgument
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
  value,
  min = 0,
  max = 100,
  label,
  segments = 5,
  color = "default",
  showValue,
  valueLabel,
  ...props
}: MeterProps) {
  // A text `valueLabel` becomes `aria-valuetext`, so the announced value
  // matches the one on screen. A node cannot be text: the formatted value is
  // announced instead.
  const ariaValueText =
    typeof valueLabel === "string" || typeof valueLabel === "number"
      ? String(valueLabel)
      : undefined
  const percentage = toPercentage(value, min, max)
  const resolved = color === "auto" ? autoColor(percentage) : color
  const count = Math.max(1, Math.floor(segments))
  const filled = (percentage / 100) * count

  return (
    <MeterPrimitive.Root
      data-slot="meter"
      data-size={size}
      className={cn(meterVariants({ size }), className)}
      value={value}
      min={min}
      max={max}
      getAriaValueText={
        ariaValueText === undefined ? undefined : () => ariaValueText
      }
      {...props}
    >
      {(label || showValue || valueLabel) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <MeterPrimitive.Label
              data-slot="meter-label"
              className="text-muted-foreground"
            >
              {label}
            </MeterPrimitive.Label>
          )}
          {valueLabel ? (
            <span
              data-slot="meter-value"
              className="ms-auto font-medium tabular-nums"
            >
              {valueLabel}
            </span>
          ) : showValue ? (
            <MeterPrimitive.Value
              data-slot="meter-value"
              className="ms-auto font-medium tabular-nums"
            />
          ) : null}
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
    </MeterPrimitive.Root>
  )
}

export { Meter, meterVariants }
export type { MeterProps, MeterColor }
