import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, getColormap } from "./colormaps"
import { allProfiles } from "./perception"
import { ColormapBar, ScalePreview } from "./parts"

const W = 600
const H = 260
const PAD = { left: 40, right: 12, top: 12, bottom: 32 }
const x = (t: number) => PAD.left + t * (W - PAD.left - PAD.right)
const y = (l: number) => PAD.top + (1 - l) * (H - PAD.top - PAD.bottom)

/**
 * 15 — Pick by perception: each scale's lightness from end to end, drawn in
 * its own colours. Straight, steady lines read evenly and survive greyscale.
 */
export default function PickerLightness() {
  const profiles = React.useMemo(() => allProfiles(), [])
  const [chosen, setChosen] = React.useState("viridis")
  const [hover, setHover] = React.useState<string | null>(null)
  const focus = hover ?? chosen

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Lightness along each colour scale; ${getColormap(focus).name} highlighted`}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {colormaps.map((m) => (
              <linearGradient
                key={m.id}
                id={`p15-${m.id}`}
                gradientUnits="userSpaceOnUse"
                x1={x(0)}
                x2={x(1)}
                y1={0}
                y2={0}
              >
                {m.stops.map((c, i) => (
                  <stop
                    key={i}
                    offset={i / (m.stops.length - 1)}
                    stopColor={c}
                  />
                ))}
              </linearGradient>
            ))}
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((l) => (
            <g key={l}>
              <line
                x1={x(0)}
                x2={x(1)}
                y1={y(l)}
                y2={y(l)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(l) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {l === 0 ? "dark" : l === 1 ? "light" : ""}
              </text>
            </g>
          ))}
          <text
            x={x(0)}
            y={H - 10}
            className="fill-muted-foreground text-[9px]"
          >
            Low resistivity
          </text>
          <text
            x={x(1)}
            y={H - 10}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            High resistivity
          </text>
          {profiles.map(({ map, profile }) => {
            const d = profile.lightness
              .map(
                (l, i) =>
                  `${i ? "L" : "M"}${x(i / (profile.lightness.length - 1)).toFixed(1)},${y(l).toFixed(1)}`
              )
              .join(" ")
            const active = map.id === focus
            return (
              <g
                key={map.id}
                className={cn(
                  "cursor-pointer transition-opacity duration-200 motion-reduce:transition-none",
                  active ? "opacity-100" : "opacity-25"
                )}
                onPointerEnter={() => setHover(map.id)}
                onClick={() => setChosen(map.id)}
              >
                {/* Wide invisible stroke: an easier target than a thin line. */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#p15-${map.id})`}
                  strokeWidth={active ? 5 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )
          })}
        </svg>
        <ScalePreview map={chosen} />
      </div>
      <ToggleGroup
        aria-label="Colour scale"
        orientation="vertical"
        className="w-full"
        value={[chosen]}
        onValueChange={([next]) => next && setChosen(next)}
        onPointerLeave={() => setHover(null)}
      >
        {profiles.map(({ map, profile }) => (
          <ToggleGroupItem
            key={map.id}
            value={map.id}
            size="lg"
            className="justify-start"
            onPointerEnter={() => setHover(map.id)}
            onFocus={() => setHover(map.id)}
            onBlur={() => setHover(null)}
          >
            <ColormapBar id={map.id} className="h-3 w-10" />
            <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span>{map.name}</span>
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                {profile.monotonic ? (
                  <CheckIcon className="size-3" aria-hidden />
                ) : (
                  <XIcon className="size-3" aria-hidden />
                )}
                {profile.monotonic ? "Ramps one way" : "Turns back"} · evenness{" "}
                {Math.round(profile.uniformity * 100)} %
              </span>
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
