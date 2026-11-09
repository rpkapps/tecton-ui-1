import * as React from "react"
import { cn } from "cn"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"

import {
  buildLut,
  colormapCss,
  evenStops,
  getColormap,
  normalize,
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

/** One dropdown variation: a compact card with its name, a line on why, and the control. */
export function DropdownCard({
  index,
  title,
  description,
  children,
}: {
  index: number
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card size="sm" id={`d${index}`} className="scroll-mt-20">
      <CardHeader>
        <CardTitle>
          <span className="text-muted-foreground tabular-nums">
            {String(index).padStart(2, "0")}
          </span>{" "}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent data-not-typeset className="mt-auto">
        {children}
      </CardContent>
    </Card>
  )
}
