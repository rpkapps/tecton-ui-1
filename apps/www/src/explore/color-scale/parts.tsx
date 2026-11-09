import * as React from "react"
import { cn } from "cn"

import {
  buildLut,
  colormapCss,
  evenStops,
  formatOhm,
  getColormap,
  normalize,
  rgbToHex,
  ticks as scaleTicks,
  type ScaleType,
} from "./colormaps"
import { getErtSection, type Section } from "./model"

/** The display range every variation uses: what the picker is previewed on. */
export const RANGE = { min: 2, max: 2000, scale: "log" as ScaleType }

/** Maps a data value to RGBA (0–255 each). */
export type ColorFn = (value: number) => [number, number, number, number]

export function presetColorFn(id: string, reversed = false): ColorFn {
  const lut = buildLut(evenStops(getColormap(id).stops, reversed))
  return (value) => {
    const t = Math.min(
      1,
      Math.max(0, normalize(value, RANGE.min, RANGE.max, RANGE.scale))
    )
    const k = Math.round(t * 255) * 3
    return [lut[k], lut[k + 1], lut[k + 2], 255]
  }
}

function lutColorFn(lut: ArrayLike<number>): ColorFn {
  return (value) => {
    const t = Math.min(
      1,
      Math.max(0, normalize(value, RANGE.min, RANGE.max, RANGE.scale))
    )
    const k = Math.round(t * 255) * 3
    return [lut[k], lut[k + 1], lut[k + 2], 255]
  }
}

/** A CSS gradient from a lookup table (16 samples is smooth enough for a bar). */
export function lutCss(lut: ArrayLike<number>, direction = "to right") {
  const parts = Array.from({ length: 16 }, (_, i) => {
    const k = Math.round((i / 15) * 255) * 3
    return `${rgbToHex([lut[k], lut[k + 1], lut[k + 2]])} ${((i / 15) * 100).toFixed(1)}%`
  })
  return `linear-gradient(${direction}, ${parts.join(", ")})`
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * The colour function of a preset that eases from the previous scale to the
 * next one (320 ms) instead of jumping, and the matching bar gradient.
 */
export function useMorphingScale(id: string, reversed = false) {
  const target = React.useMemo(
    () => buildLut(evenStops(getColormap(id).stops, reversed)),
    [id, reversed]
  )
  const shown = React.useRef<Float32Array>(Float32Array.from(target))
  const [frame, setFrame] = React.useState(0)
  React.useEffect(() => {
    const from = Float32Array.from(shown.current)
    if (prefersReducedMotion()) {
      shown.current = Float32Array.from(target)
      setFrame((f) => f + 1)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 320)
      const e = 1 - (1 - t) ** 3
      for (let i = 0; i < target.length; i++)
        shown.current[i] = from[i] + (target[i] - from[i]) * e
      setFrame((f) => f + 1)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return React.useMemo(
    () => ({
      color: lutColorFn(Float32Array.from(shown.current)),
      css: lutCss(shown.current),
    }),
    // Each animation frame is a new picture.
    [frame]
  )
}

/** Memoised colour function for a preset. */
export function useColorFn(id: string, reversed = false) {
  return React.useMemo(() => presetColorFn(id, reversed), [id, reversed])
}

/**
 * Paints the section into a canvas, one pixel per model cell. `color` may
 * also take the cell's column, for pictures that vary across the section.
 */
export function useSectionPaint(
  color: (value: number, column: number) => [number, number, number, number],
  section: Section = getErtSection()
) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const ctx = canvas.current?.getContext("2d")
    if (!ctx) return
    const image = ctx.createImageData(section.width, section.height)
    const { values, width } = section
    for (let i = 0; i < values.length; i++) {
      const [r, g, b, a] = color(values[i], i % width)
      image.data[i * 4] = r
      image.data[i * 4 + 1] = g
      image.data[i * 4 + 2] = b
      image.data[i * 4 + 3] = a
    }
    ctx.putImageData(image, 0, 0)
  }, [section, color])
  return canvas
}

/**
 * The inversion section painted with a colour function: one canvas pixel per
 * model cell, scaled up smoothly by the browser.
 */
export function SectionPreview({
  section = getErtSection(),
  color,
  className,
  label = "Inversion section preview",
  axes = true,
}: {
  section?: Section
  color: ColorFn
  className?: string
  label?: string
  axes?: boolean
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
        className="block h-auto w-full rounded-sm border border-border-subtle"
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

/** A preset's gradient strip. Its size comes from `className`. */
export function ColormapBar({
  id,
  reversed,
  direction,
  className,
  label,
}: {
  id: string
  reversed?: boolean
  direction?: string
  className?: string
  /** Accessible name; omit when the surrounding control already names it. */
  label?: string
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "block shrink-0 rounded-sm border border-border-subtle",
        className
      )}
      style={{ backgroundImage: colormapCss(id, { reversed, direction }) }}
    />
  )
}

/** Tick labels along (or up) a colour bar, placed on the scale. */
export function ColorbarTicks({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical"
  className?: string
}) {
  const { min, max, scale } = RANGE
  const list = scaleTicks(min, max, scale)
  if (orientation === "vertical")
    return (
      <div
        aria-hidden
        className={cn(
          "relative w-10 text-xs text-muted-foreground tabular-nums",
          className
        )}
      >
        {list.map((v) => (
          <span
            key={v}
            className="absolute start-0 flex translate-y-1/2 items-center gap-1"
            style={{
              bottom: `${(normalize(v, min, max, scale) * 100).toFixed(3)}%`,
            }}
          >
            <span className="h-px w-1.5 bg-border" />
            {formatOhm(v)}
          </span>
        ))}
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
            {formatOhm(v)}
          </span>
        )
      })}
    </div>
  )
}

/** The section in the chosen scale, with its horizontal colour bar underneath. */
export function ScalePreview({
  map,
  reversed = false,
  className,
}: {
  map: string
  reversed?: boolean
  className?: string
}) {
  const color = useColorFn(map, reversed)
  const name = getColormap(map).name
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <SectionPreview color={color} label={`Section in ${name}`} />
      <div dir="ltr" className="flex flex-col gap-1">
        <ColormapBar id={map} reversed={reversed} className="h-3 w-full" />
        <ColorbarTicks />
        <span className="text-center text-xs text-muted-foreground">
          Resistivity (Ω·m) · {name}
          {reversed ? ", reversed" : ""}
        </span>
      </div>
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
