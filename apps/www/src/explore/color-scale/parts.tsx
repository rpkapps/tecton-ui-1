import * as React from "react"
import { cn } from "cn"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@tecton/react/components/input-group"

import {
  buildLut,
  evenStops,
  getColormap,
  hexToRgb,
  normalize,
  ticks as scaleTicks,
  formatOhm,
  type ScaleType,
  type Stop,
} from "./colormaps"
import type { Section } from "./model"

/* -------------------------------------------------------------------------- */
/* Colour functions                                                            */
/* -------------------------------------------------------------------------- */

/** Maps a data value to RGBA (0–255 each). */
export type ColorFn = (value: number) => [number, number, number, number]

export type ScaleOptions = {
  stops: Stop[]
  min: number
  max: number
  scale: ScaleType
  /** Flat bands instead of a continuous ramp. */
  classes?: number | null
  /** Out-of-range colours; `null` paints those cells transparent, absent clamps. */
  below?: string | null
  above?: string | null
  /** 0–1, applied to every cell. */
  opacity?: number
  /** Per-position opacity (0–1 along the scale), for volume rendering. */
  alphaAt?: (t: number) => number
}

export function makeColorFn({
  stops,
  min,
  max,
  scale,
  classes,
  below,
  above,
  opacity = 1,
  alphaAt,
}: ScaleOptions): ColorFn {
  const lut = buildLut(stops)
  const belowRgb = below ? hexToRgb(below) : null
  const aboveRgb = above ? hexToRgb(above) : null
  const a = Math.round(opacity * 255)
  return (value) => {
    let t = normalize(value, min, max, scale)
    if (t < 0 && below !== undefined)
      return belowRgb ? [...belowRgb, a] : [0, 0, 0, 0]
    if (t > 1 && above !== undefined)
      return aboveRgb ? [...aboveRgb, a] : [0, 0, 0, 0]
    t = Math.min(1, Math.max(0, t))
    if (classes && classes > 1)
      t = (Math.min(classes - 1, Math.floor(t * classes)) + 0.5) / classes
    const k = Math.round(t * 255) * 3
    const alpha = alphaAt ? Math.round(a * alphaAt(t)) : a
    return [lut[k], lut[k + 1], lut[k + 2], alpha]
  }
}

/** Shorthand for a preset colormap. */
export function presetColorFn(
  id: string,
  options: Omit<ScaleOptions, "stops"> & { reversed?: boolean }
) {
  return makeColorFn({
    ...options,
    stops: evenStops(getColormap(id).stops, options.reversed),
  })
}

/* -------------------------------------------------------------------------- */
/* Section preview                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The inversion section painted with a colour function: one canvas pixel per
 * model cell, scaled up by the browser (bilinear, like most inversion viewers'
 * "smooth" mode).
 */
export function SectionPreview({
  section,
  color,
  className,
  label = "Inversion section preview",
  axes = true,
  checker = false,
}: {
  section: Section
  color: ColorFn
  className?: string
  label?: string
  axes?: boolean
  /** Draw a checkerboard behind transparent cells. */
  checker?: boolean
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const ctx = canvas.current?.getContext("2d")
    if (!ctx) return
    const image = ctx.createImageData(section.width, section.height)
    const { values } = section
    for (let i = 0; i < values.length; i++) {
      const [r, g, b, a] = color(values[i])
      image.data[i * 4] = r
      image.data[i * 4 + 1] = g
      image.data[i * 4 + 2] = b
      image.data[i * 4 + 3] = a
    }
    ctx.putImageData(image, 0, 0)
  }, [section, color])

  return (
    <figure className={cn("flex min-w-0 flex-col gap-1", className)}>
      <canvas
        ref={canvas}
        width={section.width}
        height={section.height}
        role="img"
        aria-label={label}
        className={cn(
          "block h-auto w-full rounded-sm border border-border-subtle",
          checker &&
            "bg-[repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-size-[12px_12px]"
        )}
      />
      {axes ? (
        <figcaption className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>0 m</span>
          <span>Distance · depth to {section.depthM} m</span>
          <span>{section.lengthM} m</span>
        </figcaption>
      ) : null}
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Gradient bar and ticks                                                      */
/* -------------------------------------------------------------------------- */

/** A gradient strip. Height (or width, vertical) comes from `className`. */
export function GradientBar({
  background,
  className,
  label,
  children,
}: {
  background: string
  className?: string
  /** Accessible name; omit when a neighbouring control already names it. */
  label?: string
  children?: React.ReactNode
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "relative shrink-0 rounded-sm border border-border-subtle",
        className
      )}
      style={{ backgroundImage: background }}
    >
      {children}
    </div>
  )
}

/** Tick labels under (or beside) a colour bar, placed on the scale. */
export function ColorbarTicks({
  min,
  max,
  scale,
  values,
  format = formatOhm,
  orientation = "horizontal",
  className,
}: {
  min: number
  max: number
  scale: ScaleType
  values?: number[]
  format?: (value: number) => string
  orientation?: "horizontal" | "vertical"
  className?: string
}) {
  const list = values ?? scaleTicks(min, max, scale)
  if (orientation === "vertical")
    return (
      <div
        aria-hidden
        className={cn(
          "relative w-10 text-xs text-muted-foreground tabular-nums",
          className
        )}
      >
        {list.map((v) => {
          const t = normalize(v, min, max, scale)
          return (
            <span
              key={v}
              className="absolute start-0 flex items-center gap-1"
              style={{
                bottom: `${(t * 100).toFixed(3)}%`,
                transform: `translateY(50%)`,
              }}
            >
              <span className="h-px w-1.5 bg-border" />
              {format(v)}
            </span>
          )
        })}
      </div>
    )
  return (
    <div
      aria-hidden
      className={cn(
        "relative h-4 text-xs text-muted-foreground tabular-nums",
        className
      )}
    >
      {list.map((v) => {
        const t = normalize(v, min, max, scale)
        const edge =
          t < 0.04
            ? "translate-x-0"
            : t > 0.96
              ? "-translate-x-full"
              : "-translate-x-1/2"
        return (
          <span
            key={v}
            className={cn("absolute top-0", edge)}
            style={{ left: `${(t * 100).toFixed(3)}%` }}
          >
            {format(v)}
          </span>
        )
      })}
    </div>
  )
}

/** A horizontal colour bar with ticks and a unit: the legend under a section. */
export function HorizontalColorbar({
  background,
  min,
  max,
  scale,
  unit = "Ω·m",
  title = "Resistivity",
  format,
  className,
}: {
  background: string
  min: number
  max: number
  scale: ScaleType
  unit?: string
  title?: string
  format?: (value: number) => string
  className?: string
}) {
  return (
    <div dir="ltr" className={cn("flex flex-col gap-1", className)}>
      <GradientBar background={background} className="h-3 w-full" />
      <ColorbarTicks min={min} max={max} scale={scale} format={format} />
      <span className="text-center text-xs text-muted-foreground">
        {title} ({unit}) · {scale === "log" ? "log scale" : "linear scale"}
      </span>
    </div>
  )
}

/** Variation frame on the exploration page. */
export function Variation({
  index,
  title,
  description,
  bestFor,
  children,
}: {
  index: number
  title: string
  description: React.ReactNode
  bestFor: string
  children: React.ReactNode
}) {
  const id = `variation-${index}`
  return (
    <section
      aria-labelledby={id}
      className="flex scroll-mt-20 flex-col gap-3"
      id={`v${index}`}
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-lg font-semibold">
          <span className="text-muted-foreground tabular-nums">
            {String(index).padStart(2, "0")}
          </span>{" "}
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Best for:</span>{" "}
          {bestFor}
        </p>
      </div>
      <div
        data-not-typeset
        className="rounded-lg border border-border bg-background p-4 sm:p-6"
      >
        {children}
      </div>
    </section>
  )
}

/**
 * A number with its unit inside the field. Typing edits a draft; the value is
 * committed on blur or Enter, so a half-typed "1" never repaints the section.
 */
export function UnitInput({
  id,
  value,
  onCommit,
  unit = "Ω·m",
  invalid,
  className,
  "aria-label": ariaLabel,
  format = formatOhm,
}: {
  id?: string
  value: number
  onCommit: (value: number) => void
  unit?: string
  invalid?: boolean
  className?: string
  "aria-label"?: string
  format?: (value: number) => string
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft.replace(/k$/i, "e3"))
    if (Number.isFinite(n)) onCommit(n)
    setDraft(null)
  }
  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        inputMode="decimal"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        value={draft ?? format(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
          if (event.key === "Escape") setDraft(null)
        }}
        className="tabular-nums"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
