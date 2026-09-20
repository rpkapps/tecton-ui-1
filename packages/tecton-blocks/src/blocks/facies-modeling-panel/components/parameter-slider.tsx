"use client"

import * as React from "react"
import { cn } from "cn"

import { Slider } from "@tecton/react/components/slider"

type ParameterSliderProps = {
  className?: string
  label: React.ReactNode
  value: number
  minValue: number
  maxValue: number
  step?: number
  unit?: string
  /** Custom formatted readout (defaults to the numeric value + unit). */
  valueLabel?: React.ReactNode
  /** Leading adornment before the label (e.g. a `ColorSwatch`). */
  adornment?: React.ReactNode
  isDisabled?: boolean
  onChange: (value: number) => void
}

/** Labelled slider with a right-aligned mono readout. */
function ParameterSlider({
  className,
  label,
  value,
  minValue,
  maxValue,
  step,
  unit,
  valueLabel,
  adornment,
  isDisabled,
  onChange,
}: ParameterSliderProps) {
  const ariaLabel = typeof label === "string" ? label : undefined
  return (
    <div
      data-slot="parameter-slider"
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
          {adornment}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 font-mono font-medium tabular-nums">
          {valueLabel ?? (
            <>
              {value.toLocaleString()}
              {unit && (
                <span className="ml-0.5 font-normal text-muted-foreground">
                  {unit}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <Slider
        aria-label={ariaLabel}
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        isDisabled={isDisabled}
        onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

export { ParameterSlider }
export type { ParameterSliderProps }
