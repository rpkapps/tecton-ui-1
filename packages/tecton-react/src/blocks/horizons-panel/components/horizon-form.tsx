"use client"

import * as React from "react"
import { cn } from "cn"

import { Slider } from "@tecton/react/components/slider"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import { Divider } from "@tecton/react/tecton/divider"
import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"
import { TextField } from "@tecton/react/tecton/text-field"

import {
  getPair,
  getSurface,
  lineWidths,
  surfacePairs,
  volumes,
  type HorizonSettings,
} from "../data"

type HorizonFormProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value: HorizonSettings
  onChange: (next: HorizonSettings) => void
}

function HorizonForm({ className, value, onChange, ...props }: HorizonFormProps) {
  const pair = getPair(value.pairId)
  const top = getSurface(pair.top)
  const base = getSurface(pair.base)

  const set = <K extends keyof HorizonSettings>(key: K, next: HorizonSettings[K]) =>
    onChange({ ...value, [key]: next })

  return (
    <div
      data-slot="horizon-form"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <SelectField
        label="Surface pair"
        variant="filled"
        selectedKey={value.pairId}
        onSelectionChange={(key) => {
          const next = getPair(String(key))
          onChange({
            ...value,
            pairId: next.id,
            topDepth: getSurface(next.top).depth,
            bottomDepth: getSurface(next.base).depth,
          })
        }}
      >
        {surfacePairs.map((item) => (
          <SelectFieldItem key={item.id} id={item.id} textValue={item.label}>
            {item.label}
          </SelectFieldItem>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Volume"
          variant="filled"
          selectedKey={value.volumeId}
          onSelectionChange={(key) => set("volumeId", String(key))}
        >
          {volumes.map((item) => (
            <SelectFieldItem key={item.id} id={item.id} textValue={item.label}>
              {item.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          label="Line"
          variant="filled"
          selectedKey={String(value.lineWidth)}
          onSelectionChange={(key) => set("lineWidth", Number(key))}
        >
          {lineWidths.map((width) => (
            <SelectFieldItem key={width} id={String(width)} textValue={`${width} px`}>
              <span className="font-mono tabular-nums">{width}</span>
              <span className="text-muted-foreground">px</span>
            </SelectFieldItem>
          ))}
        </SelectField>
      </div>

      <HorizonRow label="Horizon 1" surface={top} />
      <HorizonRow label="Horizon 2" surface={base} />

      <Divider emphasis="subtle" />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Top depth (TVDSS)"
          variant="filled"
          size="sm"
          type="number"
          value={String(value.topDepth)}
          onChange={(text) => set("topDepth", Number(text) || 0)}
          className="[&_input]:font-mono [&_input]:tabular-nums"
        />
        <TextField
          label="Bottom depth (TVDSS)"
          variant="filled"
          size="sm"
          type="number"
          value={String(value.bottomDepth)}
          onChange={(text) => set("bottomDepth", Number(text) || 0)}
          className="[&_input]:font-mono [&_input]:tabular-nums"
        />
      </div>

      <LabelledSlider
        label="Opacity"
        value={value.opacity}
        unit="%"
        minValue={0}
        maxValue={100}
        step={5}
        onChange={(next) => set("opacity", next)}
      />
      <LabelledSlider
        label="Smoothing"
        value={value.smoothing}
        unit="m"
        minValue={0}
        maxValue={100}
        step={5}
        onChange={(next) => set("smoothing", next)}
      />
    </div>
  )
}

function HorizonRow({
  label,
  surface,
}: {
  label: string
  surface: { code: string; name: string; color: string }
}) {
  return (
    <div data-slot="horizon-row" className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-2 text-sm">
        <ColorSwatch
          color={surface.color}
          size="sm"
          shape="square"
          aria-label={`${surface.name} colour`}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {surface.code}
        </span>
        <span className="min-w-0 flex-1 truncate">{surface.name}</span>
        <span className="font-mono text-xs text-muted-foreground uppercase">
          {surface.color.replace("#", "")}
        </span>
      </div>
    </div>
  )
}

function LabelledSlider({
  label,
  value,
  unit,
  minValue,
  maxValue,
  step,
  onChange,
}: {
  label: string
  value: number
  unit?: string
  minValue: number
  maxValue: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div data-slot="labelled-slider" className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {value}
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <Slider
        aria-label={label}
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

export { HorizonForm, HorizonRow, LabelledSlider }
export type { HorizonFormProps }
