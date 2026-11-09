import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/components/button"

import {
  buildLut,
  colormaps,
  evenStops,
  getColormap,
  normalize,
} from "./colormaps"
import { getErtSection } from "./model"
import { RANGE, useColorFn, useSectionPaint } from "./parts"

const luts = colormaps.map((m) => buildLut(evenStops(m.stops)))

/** Each strip of columns painted in its own scale. */
function spectrum(
  value: number,
  column: number
): [number, number, number, number] {
  const section = getErtSection()
  const k = Math.min(
    colormaps.length - 1,
    Math.floor((column / section.width) * colormaps.length)
  )
  const lut = luts[k]
  const t = Math.min(
    1,
    Math.max(0, normalize(value, RANGE.min, RANGE.max, RANGE.scale))
  )
  const i = Math.round(t * 255) * 3
  return [lut[i], lut[i + 1], lut[i + 2], 255]
}

/**
 * 14 — The spectrum: every scale at once, one strip each across the section.
 * Point at a strip to see the whole section in it; click to choose.
 */
export default function PickerSpectrum() {
  const section = getErtSection()
  const [chosen, setChosen] = React.useState<string | null>(null)
  const [hover, setHover] = React.useState<string | null>(null)
  const focus = hover ?? chosen
  const mosaic = useSectionPaint(spectrum)
  const full = useSectionPaint(useColorFn(focus ?? "viridis"))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-center justify-between gap-2 text-sm">
        <span>
          {focus ? (
            <>
              <span className="font-medium">{getColormap(focus).name}</span>
              <span className="text-muted-foreground">
                {" "}
                ·{" "}
                {hover && hover !== chosen
                  ? "point away to see every scale, click to choose"
                  : "chosen"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Every scale on the same section. Point at a strip.
            </span>
          )}
        </span>
        {chosen ? (
          <Button variant="ghost" size="sm" onClick={() => setChosen(null)}>
            Show every scale
          </Button>
        ) : null}
      </div>
      <div
        dir="ltr"
        className="relative overflow-hidden rounded-sm border border-border-subtle"
      >
        <canvas
          ref={mosaic}
          width={section.width}
          height={section.height}
          role="img"
          aria-label="The section in fourteen vertical strips, one colour scale each"
          className="block h-auto w-full"
        />
        <canvas
          ref={full}
          width={section.width}
          height={section.height}
          aria-hidden
          className={cn(
            "absolute inset-0 block h-full w-full transition-opacity duration-300 motion-reduce:transition-none",
            focus ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className="absolute inset-0 flex"
          role="radiogroup"
          aria-label="Colour scale"
          onPointerLeave={() => setHover(null)}
        >
          {colormaps.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={chosen === m.id}
              aria-label={m.name}
              className={cn(
                "flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                focus &&
                  "hover:ring-2 hover:ring-background/80 hover:ring-inset",
                chosen === m.id && "ring-2 ring-background ring-inset"
              )}
              onPointerEnter={() => setHover(m.id)}
              onFocus={() => setHover(m.id)}
              onBlur={() => setHover(null)}
              onClick={() => setChosen(m.id)}
            />
          ))}
        </div>
      </div>
      <div
        dir="ltr"
        aria-hidden
        className="grid text-center text-[0.625rem] leading-tight text-muted-foreground"
        style={{
          gridTemplateColumns: `repeat(${colormaps.length}, minmax(0, 1fr))`,
        }}
      >
        {colormaps.map((m) => (
          <span
            key={m.id}
            className={cn(
              "truncate px-0.5",
              focus === m.id && "font-medium text-foreground"
            )}
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  )
}
