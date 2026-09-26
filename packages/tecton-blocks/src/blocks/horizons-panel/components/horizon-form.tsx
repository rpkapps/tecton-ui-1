"use client"

import * as React from "react"
import { cn } from "cn"

import { Field, FieldError, FieldLabel } from "@tecton/react/components/field"
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
import { useLocale } from "@tecton/react/tecton/provider"

import {
  getPair,
  getSurface,
  lineWidths,
  surfacePairs,
  validateDepths,
  volumes,
} from "../data"
import type { HorizonSettings } from "../data"

const lineWidthItems = lineWidths.map((width) => ({
  value: String(width),
  label: (
    <>
      <span className="font-mono tabular-nums">{width}</span>
      <span className="text-muted-foreground">px</span>
    </>
  ),
}))

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
  const errorId = `${id}-depth-error`
  const depthError = validateDepths(value)

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
          id={`${id}-pair`}
          value={value.pairId}
          onValueChange={(pairId) => {
            if (pairId === null) return
            const next = getPair(pairId)
            onChange({
              ...value,
              pairId: next.id,
              topDepth: getSurface(next.top).depth,
              bottomDepth: getSurface(next.base).depth,
            })
          }}
          items={surfacePairs.map((item) => ({
            value: item.id,
            label: item.label,
          }))}
        >
          <SelectTrigger variant="filled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {surfacePairs.map((item) => (
              <SelectItem key={item.id} value={item.id}>
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
            id={`${id}-volume`}
            value={value.volumeId}
            onValueChange={(volumeId) => {
              if (volumeId !== null) set("volumeId", volumeId)
            }}
            items={volumes.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          >
            <SelectTrigger variant="filled">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {volumes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-line`}>Line</FieldLabel>
          <Select
            id={`${id}-line`}
            value={String(value.lineWidth)}
            onValueChange={(width) => {
              if (width !== null) set("lineWidth", Number(width))
            }}
            items={lineWidthItems}
          >
            <SelectTrigger variant="filled">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lineWidthItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
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
        <DepthField
          label="Top depth (TVDSS)"
          value={value.topDepth}
          onValueChange={(next) => set("topDepth", next)}
          errorId={depthError ? errorId : undefined}
        />
        <DepthField
          label="Bottom depth (TVDSS)"
          value={value.bottomDepth}
          onValueChange={(next) => set("bottomDepth", next)}
          errorId={depthError ? errorId : undefined}
        />
        <FieldError id={errorId} className="col-span-2 text-xs">
          {depthError}
        </FieldError>
      </div>

      <LabelledSlider
        label="Opacity"
        value={value.opacity}
        unit="%"
        min={0}
        max={100}
        step={5}
        onValueChange={(next) => set("opacity", next)}
      />
      <LabelledSlider
        label="Smoothing"
        value={value.smoothing}
        unit="m"
        min={0}
        max={100}
        step={5}
        onValueChange={(next) => set("smoothing", next)}
      />
    </div>
  )
}

/** The group and decimal separators of a locale. */
function separators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    group: parts.find((part) => part.type === "group")?.value ?? ",",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
  }
}

/** A number typed in a locale's format; `NaN` for an empty or partial entry. */
function parseNumber(text: string, locale: string) {
  const { group, decimal } = separators(locale)
  const normalized = text
    .trim()
    .split(group)
    .join("")
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(decimal, ".")
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)
    ? Number(normalized)
    : Number.NaN
}

/**
 * A depth in metres: a text field that accepts a partial entry such as "-"
 * while typing and shows the value in the locale's format. The entry is
 * committed on blur or Enter, the arrow keys step it by one metre, and an
 * empty or unparsable entry leaves the previous value in place.
 */
function DepthField({
  label,
  value,
  onValueChange,
  errorId,
}: {
  label: string
  value: number
  onValueChange: (next: number) => void
  /** Id of the error that describes the pair; set while it is invalid. */
  errorId?: string | undefined
}) {
  const id = React.useId()
  const { locale } = useLocale()
  // The text being typed; `null` shows the formatted value.
  const [draft, setDraft] = React.useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const next = parseNumber(draft, locale)
    if (!Number.isNaN(next)) onValueChange(next)
    setDraft(null)
  }

  const step = (delta: number) => {
    const current = draft === null ? value : parseNumber(draft, locale)
    onValueChange((Number.isNaN(current) ? value : current) + delta)
    setDraft(null)
  }

  return (
    <Field data-invalid={errorId !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        variant="filled"
        inputMode="decimal"
        autoComplete="off"
        className="h-8 font-mono text-sm tabular-nums md:text-xs"
        value={draft ?? value.toLocaleString(locale)}
        onChange={(event) => {
          // Only what can become a number: sign, digits and separators.
          if (/^[+-]?[\d\s.,'\u00a0\u202f]*$/.test(event.target.value))
            setDraft(event.target.value)
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
          else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault()
            step(event.key === "ArrowUp" ? 1 : -1)
          }
        }}
        aria-invalid={errorId !== undefined || undefined}
        aria-describedby={errorId}
      />
    </Field>
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
  min,
  max,
  step = 1,
  onValueChange,
}: {
  label: string
  value: number
  unit?: string
  min: number
  max: number
  step?: number
  onValueChange: (value: number) => void
}) {
  const labelId = React.useId()
  return (
    <div data-slot="labelled-slider" className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span id={labelId} className="text-muted-foreground">
          {label}
        </span>
        <span className="font-mono tabular-nums">
          {value}
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <Slider
        aria-labelledby={labelId}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          const [first] = Array.isArray(next) ? next : [next]
          if (first !== undefined) onValueChange(first)
        }}
      />
    </div>
  )
}

export { HorizonForm, HorizonRow, DepthField, LabelledSlider }
export type { HorizonFormProps }
