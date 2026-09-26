"use client"

import * as React from "react"
import { cn } from "cn"

import { Slider } from "@tecton/react/components/slider"
import { useLocale } from "@tecton/react/tecton/provider"

type ParameterSliderProps = {
  className?: string
  label: React.ReactNode
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  /** Custom formatted readout (defaults to the numeric value + unit). */
  valueLabel?: React.ReactNode
  /** Leading adornment before the label (e.g. a `ColorSwatch`). */
  adornment?: React.ReactNode
  disabled?: boolean
  onValueChange: (value: number) => void
}

/** Labelled slider with a right-aligned mono readout. */
function ParameterSlider({
  className,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  valueLabel,
  adornment,
  disabled = false,
  onValueChange,
}: ParameterSliderProps) {
  const { locale } = useLocale()
  const labelId = React.useId()
  return (
    <div
      data-slot="parameter-slider"
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
          {adornment}
          <span id={labelId} className="truncate">
            {label}
          </span>
        </span>
        <span className="shrink-0 font-mono font-medium tabular-nums">
          {valueLabel ?? (
            <>
              {value.toLocaleString(locale)}
              {unit && (
                <span className="ms-0.5 font-normal text-muted-foreground">
                  {unit}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-labelledby={labelId}
        onValueChange={(next) => {
          const [first] = Array.isArray(next) ? next : [next]
          if (first !== undefined) onValueChange(first)
        }}
      />
    </div>
  )
}

export { ParameterSlider }
export type { ParameterSliderProps }
