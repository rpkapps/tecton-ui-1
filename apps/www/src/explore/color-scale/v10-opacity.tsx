import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"

import { ColormapSelect } from "./colormap-select"
import { colormapCss, denormalize, formatOhm } from "./colormaps"
import { getErtSection } from "./model"
import { ColorbarTicks, presetColorFn, SectionPreview } from "./parts"

type Point = { id: number; x: number; y: number }

const MIN = 1
const MAX = 3000
let nextId = 100

const presets: Record<string, [number, number][]> = {
  "Resistive only": [
    [0, 0],
    [0.62, 0],
    [0.75, 0.9],
    [1, 1],
  ],
  "Conductive only": [
    [0, 1],
    [0.25, 0.9],
    [0.38, 0],
    [1, 0],
  ],
  Ramp: [
    [0, 0.05],
    [1, 1],
  ],
  Opaque: [
    [0, 1],
    [1, 1],
  ],
}

const toPoints = (list: [number, number][]) =>
  list.map(([x, y]) => ({ id: nextId++, x, y }))

function alphaAt(points: Point[], t: number) {
  for (let i = 1; i < points.length; i++) {
    const b = points[i]
    if (t <= b.x) {
      const a = points[i - 1]
      return a.y + ((b.y - a.y) * (t - a.x)) / (b.x - a.x || 1)
    }
  }
  return points[points.length - 1].y
}

/**
 * 10 — An opacity transfer function over the colour bar, for 3-D inversion
 * volumes: drag points to hide the background resistivity and keep the target.
 */
export default function ColorScaleOpacity() {
  const section = getErtSection()
  const [map, setMap] = React.useState("inferno")
  const [points, setPoints] = React.useState(() =>
    toPoints(presets["Resistive only"])
  )
  const [active, setActive] = React.useState<number | null>(null)
  const area = React.useRef<HTMLDivElement>(null)

  const color = React.useMemo(
    () =>
      presetColorFn(map, {
        min: MIN,
        max: MAX,
        scale: "log",
        alphaAt: (t) => alphaAt(points, t),
      }),
    [map, points]
  )

  const move = (id: number, x: number, y: number) =>
    setPoints((list) => {
      const i = list.findIndex((p) => p.id === id)
      const lo = i === 0 ? 0 : list[i - 1].x + 0.01
      const hi = i === list.length - 1 ? 1 : list[i + 1].x - 0.01
      // The end points stay on the ends; only their opacity moves.
      const nx =
        i === 0 ? 0 : i === list.length - 1 ? 1 : Math.min(hi, Math.max(lo, x))
      const ny = Math.min(1, Math.max(0, y))
      return list.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p))
    })

  const fromPointer = (event: React.PointerEvent) => {
    const rect = area.current!.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: 1 - (event.clientY - rect.top) / rect.height,
    }
  }

  const curve = points.map((p) => `${p.x * 100},${(1 - p.y) * 100}`).join(" ")

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ColormapSelect
            aria-label="Colormap"
            value={map}
            onValueChange={setMap}
          />
          <ButtonGroup aria-label="Opacity presets">
            {Object.keys(presets).map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => setPoints(toPoints(presets[name]))}
              >
                {name}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <div dir="ltr" className="flex flex-col gap-1">
          <div
            ref={area}
            className="relative h-40 touch-none rounded-sm border border-border-subtle"
            style={{ backgroundImage: colormapCss(map) }}
            onDoubleClick={(event) => {
              const { x, y } = fromPointer(
                event as unknown as React.PointerEvent
              )
              setPoints((list) =>
                [...list, { id: nextId++, x, y }].sort((a, b) => a.x - b.x)
              )
            }}
          >
            <svg
              aria-hidden
              className="absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Veil above the curve: the colour shows through only where it will be drawn. */}
              <polygon
                points={`0,0 ${curve} 100,0`}
                className="fill-background opacity-85"
              />
              <polyline
                points={curve}
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-foreground stroke-[1.5]"
              />
            </svg>
            {points.map((p, i) => (
              <div
                key={p.id}
                role="slider"
                tabIndex={0}
                aria-label={`Opacity at ${formatOhm(denormalize(p.x, MIN, MAX, "log"))} ohm metres`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(p.y * 100)}
                aria-valuetext={`${Math.round(p.y * 100)} %`}
                className={cn(
                  "absolute size-3.5 -translate-x-1/2 translate-y-1/2 cursor-grab rounded-full border-2 border-foreground bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === p.id && "cursor-grabbing bg-foreground"
                )}
                style={{
                  left: `${(p.x * 100).toFixed(3)}%`,
                  bottom: `${(p.y * 100).toFixed(3)}%`,
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  setActive(p.id)
                }}
                onPointerMove={(event) => {
                  if (active !== p.id) return
                  const { x, y } = fromPointer(event)
                  move(p.id, x, y)
                }}
                onPointerUp={() => setActive(null)}
                onDoubleClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 0.1 : 0.02
                  const keys: Partial<Record<string, [number, number]>> = {
                    ArrowUp: [0, step],
                    ArrowDown: [0, -step],
                    ArrowLeft: [-step, 0],
                    ArrowRight: [step, 0],
                  }
                  const delta = keys[event.key]
                  if (delta) {
                    event.preventDefault()
                    move(p.id, p.x + delta[0], p.y + delta[1])
                  }
                  if (
                    (event.key === "Delete" || event.key === "Backspace") &&
                    i > 0 &&
                    i < points.length - 1
                  )
                    setPoints((list) => list.filter((q) => q.id !== p.id))
                }}
              />
            ))}
          </div>
          <ColorbarTicks min={MIN} max={MAX} scale="log" />
        </div>
        <p className="text-xs text-muted-foreground">
          Drag a point, or focus it and use the arrow keys. Double-click to add
          a point; Delete removes it.
        </p>
      </div>
      <SectionPreview
        section={section}
        color={color}
        checker
        label="Section with the opacity transfer function applied"
      />
    </div>
  )
}
