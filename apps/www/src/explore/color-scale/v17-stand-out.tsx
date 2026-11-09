import * as React from "react"
import { CrosshairIcon } from "lucide-react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { Meter } from "@tecton/react/tecton/meter"

import { colormaps, formatOhm, getColormap } from "./colormaps"
import { getErtSection } from "./model"
import { deltaE } from "./perception"
import {
  ColormapBar,
  presetColorFn,
  useColorFn,
  useSectionPaint,
} from "./parts"

type Probe = { x: number; z: number } // metres along, metres deep

const FEATURES: Record<string, { name: string; probe: Probe }> = {
  plume: { name: "Conductive plume", probe: { x: 268, z: 15 } },
  gravel: { name: "Gravel channel", probe: { x: 120, z: 11 } },
  clay: { name: "Clay layer", probe: { x: 60, z: 27 } },
  bedrock: { name: "Bedrock high", probe: { x: 330, z: 40 } },
}
const featureItems = {
  ...Object.fromEntries(Object.entries(FEATURES).map(([k, f]) => [k, f.name])),
  custom: "Point on the section",
}

const median = (list: number[]) => {
  const s = [...list].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)] ?? 0
}

/** Values inside the probe (r ≤ 6 m) and in a ring around it (8–18 m). */
function sample(probe: Probe) {
  const s = getErtSection()
  const inside: number[] = []
  const around: number[] = []
  for (let j = 0; j < s.height; j++)
    for (let i = 0; i < s.width; i++) {
      const dx = (i / (s.width - 1)) * s.lengthM - probe.x
      const dz = ((j / (s.height - 1)) * s.depthM - probe.z) * 1.6 // depth is squashed on screen
      const d = Math.hypot(dx, dz)
      const v = s.values[j * s.width + i]
      if (d <= 6) inside.push(v)
      else if (d >= 8 && d <= 18) around.push(v)
    }
  return { feature: median(inside), surround: median(around) }
}

/**
 * 17 — Make this stand out: point at a feature, and the scales are ranked by
 * how strongly that feature's colour differs from its surroundings.
 */
export default function PickerStandOut() {
  const section = getErtSection()
  const [feature, setFeature] = React.useState("plume")
  const [probe, setProbe] = React.useState<Probe>(FEATURES.plume.probe)
  const values = React.useMemo(() => sample(probe), [probe])
  const ranked = React.useMemo(
    () =>
      colormaps
        .map((m) => {
          const color = presetColorFn(m.id)
          const a = color(values.feature)
          const b = color(values.surround)
          return {
            map: m,
            contrast: deltaE([a[0], a[1], a[2]], [b[0], b[1], b[2]]),
          }
        })
        .sort((a, b) => b.contrast - a.contrast),
    [values]
  )
  const [chosen, setChosen] = React.useState<string | null>(null)
  const pick = chosen ?? ranked[0].map.id
  const canvas = useSectionPaint(useColorFn(pick))
  const best = ranked[0].contrast

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <Field className="max-w-xs">
          <FieldLabel htmlFor="p17-feature">Feature to bring out</FieldLabel>
          <Select
            items={featureItems}
            value={feature}
            onValueChange={(next) => {
              if (!next || next === "custom") return
              setFeature(next)
              setProbe(FEATURES[next].probe)
              setChosen(null)
            }}
          >
            <SelectTrigger id="p17-feature">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEATURES).map(([key, f]) => (
                <SelectItem key={key} value={key}>
                  {f.name}
                </SelectItem>
              ))}
              {feature === "custom" ? (
                <SelectItem value="custom">Point on the section</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </Field>
        <div
          dir="ltr"
          className="relative cursor-crosshair overflow-hidden rounded-sm border border-border-subtle"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            setProbe({
              x: ((event.clientX - rect.left) / rect.width) * section.lengthM,
              z: ((event.clientY - rect.top) / rect.height) * section.depthM,
            })
            setFeature("custom")
            setChosen(null)
          }}
        >
          <canvas
            ref={canvas}
            width={section.width}
            height={section.height}
            role="img"
            aria-label={`Section in ${getColormap(pick).name}, probe at ${Math.round(probe.x)} m along, ${Math.round(probe.z)} m deep`}
            className="block h-auto w-full"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-white shadow-[0_0_0_1px_rgb(0_0_0/0.5)]"
            style={{
              left: `${((probe.x / section.lengthM) * 100).toFixed(2)}%`,
              top: `${((probe.z / section.depthM) * 100).toFixed(2)}%`,
            }}
          >
            <CrosshairIcon className="size-4 drop-shadow" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Click anywhere on the section to probe it. Feature ≈{" "}
          {formatOhm(values.feature)} Ω·m, surroundings ≈{" "}
          {formatOhm(values.surround)} Ω·m.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span id="p17-ranked" className="text-sm font-medium">
          Strongest contrast first
        </span>
        <ToggleGroup
          aria-labelledby="p17-ranked"
          orientation="vertical"
          className="w-full"
          value={[pick]}
          onValueChange={([next]) => next && setChosen(next)}
        >
          {ranked.slice(0, 6).map((r) => (
            <ToggleGroupItem
              key={r.map.id}
              value={r.map.id}
              size="lg"
              className="justify-start"
            >
              <ColormapBar id={r.map.id} className="h-3 w-10" />
              <span className="flex min-w-0 flex-1 flex-col items-stretch gap-1">
                <span className="flex justify-between text-sm">
                  {r.map.name}
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    ΔE {Math.round(r.contrast)}
                  </span>
                </span>
                <Meter
                  aria-label={`${r.map.name} contrast`}
                  value={Math.round((r.contrast / best) * 100)}
                  segments={1}
                  size="sm"
                />
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
