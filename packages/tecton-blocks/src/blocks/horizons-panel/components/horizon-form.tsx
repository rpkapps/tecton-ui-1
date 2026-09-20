"use client"

import * as React from "react"
import { cn } from "cn"

import { Field, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Separator } from "@tecton/react/components/separator"
import { Slider } from "@tecton/react/components/slider"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import { getPair, getSurface, lineWidths, surfacePairs, volumes } from "../data"
import type { HorizonSettings } from "../data"

type HorizonFormProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value: HorizonSettings
  onChange: (next: HorizonSettings) => void
}

function HorizonForm({
  className,
  value,
  onChange,
  ...props
}: HorizonFormProps) {
  const pair = getPair(value.pairId)
  const top = getSurface(pair.top)
  const base = getSurface(pair.base)
  const id = React.useId()

  const set = <TKey extends keyof HorizonSettings>(
    key: TKey,
    next: HorizonSettings[TKey]
  ) => onChange({ ...value, [key]: next })

  return (
    <div
      data-slot="horizon-form"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <Field>
        <FieldLabel htmlFor={`${id}-pair`}>Surface pair</FieldLabel>
        <Select
          className="w-full"
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
          <SelectTrigger id={`${id}-pair`} variant="filled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {surfacePairs.map((item) => (
              <SelectItem key={item.id} id={item.id} textValue={item.label}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor={`${id}-volume`}>Volume</FieldLabel>
          <Select
            className="w-full"
            selectedKey={value.volumeId}
            onSelectionChange={(key) => set("volumeId", String(key))}
          >
            <SelectTrigger id={`${id}-volume`} variant="filled">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {volumes.map((item) => (
                <SelectItem key={item.id} id={item.id} textValue={item.label}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-line`}>Line</FieldLabel>
          <Select
            className="w-full"
            selectedKey={String(value.lineWidth)}
            onSelectionChange={(key) => set("lineWidth", Number(key))}
          >
            <SelectTrigger id={`${id}-line`} variant="filled">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lineWidths.map((width) => (
                <SelectItem
                  key={width}
                  id={String(width)}
                  textValue={`${width} px`}
                >
                  <span className="font-mono tabular-nums">{width}</span>
                  <span className="text-muted-foreground">px</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <HorizonRow label="Horizon 1" surface={top} />
      <HorizonRow label="Horizon 2" surface={base} />

      <Separator emphasis="subtle" />

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor={`${id}-top`}>Top depth (TVDSS)</FieldLabel>
          <Input
            id={`${id}-top`}
            variant="filled"
            type="number"
            className="h-8 font-mono text-sm tabular-nums md:text-xs"
            value={String(value.topDepth)}
            onChange={(event) =>
              set("topDepth", Number(event.target.value) || 0)
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-bottom`}>Bottom depth (TVDSS)</FieldLabel>
          <Input
            id={`${id}-bottom`}
            variant="filled"
            type="number"
            className="h-8 font-mono text-sm tabular-nums md:text-xs"
            value={String(value.bottomDepth)}
            onChange={(event) =>
              set("bottomDepth", Number(event.target.value) || 0)
            }
          />
        </Field>
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
