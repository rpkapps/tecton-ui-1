import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  Field,
  FieldDescription,
  FieldTitle,
} from "@tecton/react/components/field"
import { Slider } from "@tecton/react/components/slider"
import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"

import { ColormapSelect } from "./colormap-select"
import { colormapCss, formatOhm, percentile, rgbToHex } from "./colormaps"
import { getErtSection, logHistogram } from "./model"
import {
  ColorbarTicks,
  HorizontalColorbar,
  presetColorFn,
  SectionPreview,
} from "./parts"

const LO = 0 // log10(1 Ω·m)
const HI = 3.5 // log10(~3.2k Ω·m)
const BINS = 56

function share(sorted: Float32Array, value: number, below: boolean) {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < value) lo = mid + 1
    else hi = mid
  }
  const n = below ? lo : sorted.length - lo
  return (n / sorted.length) * 100
}

/** 04 — The range is set on the data: a histogram of the model, coloured by the scale, with clip handles. */
export default function ColorScaleHistogram() {
  const section = getErtSection()
  const [map, setMap] = React.useState("viridis")
  const [range, setRange] = React.useState<[number, number]>([0.5, 3.1])
  const min = 10 ** range[0]
  const max = 10 ** range[1]

  const counts = React.useMemo(
    () => logHistogram(section, 10 ** LO, 10 ** HI, BINS),
    [section]
  )
  const peak = Math.max(...counts)
  const color = React.useMemo(
    () => presetColorFn(map, { min, max, scale: "log" }),
    [map, min, max]
  )

  const clip = (p: number) =>
    setRange([
      Math.log10(percentile(section.sorted, p)),
      Math.log10(percentile(section.sorted, 100 - p)),
    ])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <div className="flex flex-col gap-4">
        <ColormapSelect
          aria-label="Colormap"
          value={map}
          onValueChange={setMap}
          className="w-full"
        />
        <Field>
          <FieldTitle id="v4-range">Colour limits</FieldTitle>
          <div dir="ltr" className="flex flex-col gap-2">
            <div aria-hidden className="flex h-28 items-end gap-px px-2.5">
              {counts.map((count, k) => {
                const center = 10 ** (LO + ((k + 0.5) / BINS) * (HI - LO))
                const [r, g, b] = color(center)
                const inside = center >= min && center <= max
                return (
                  <div
                    key={k}
                    className="flex-1 rounded-t-[1px] transition-opacity"
                    style={{
                      height: `${Math.max(1, (count / peak) * 100).toFixed(2)}%`,
                      backgroundColor: rgbToHex([r, g, b]),
                      opacity: inside ? 1 : 0.25,
                    }}
                  />
                )
              })}
            </div>
            <Slider
              aria-labelledby="v4-range"
              min={LO}
              max={HI}
              step={0.01}
              minStepsBetweenValues={10}
              value={range}
              onValueChange={(next) =>
                Array.isArray(next) && setRange([next[0]!, next[1]!])
              }
            />
            <ColorbarTicks
              className="mx-2.5"
              min={10 ** LO}
              max={10 ** HI}
              scale="log"
              values={[1, 10, 100, 1000]}
            />
          </div>
          <FieldDescription>
            {formatOhm(min)} – {formatOhm(max)} Ω·m. Cells outside the limits
            take the end colours.
          </FieldDescription>
        </Field>
        <ButtonGroup aria-label="Set limits from the data">
          <Button variant="outline" size="sm" onClick={() => clip(0)}>
            Fit to data
          </Button>
          <Button variant="outline" size="sm" onClick={() => clip(2)}>
            Clip 2 %
          </Button>
          <Button variant="outline" size="sm" onClick={() => clip(5)}>
            Clip 5 %
          </Button>
        </ButtonGroup>
        <div className="grid grid-cols-2 gap-4">
          <Stat size="sm">
            <StatLabel>Below minimum</StatLabel>
            <StatValue unit="%">
              {share(section.sorted, min, true).toFixed(1)}
            </StatValue>
          </Stat>
          <Stat size="sm">
            <StatLabel>Above maximum</StatLabel>
            <StatValue unit="%">
              {share(section.sorted, max, false).toFixed(1)}
            </StatValue>
          </Stat>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <SectionPreview section={section} color={color} />
        <HorizontalColorbar
          background={colormapCss(map)}
          min={min}
          max={max}
          scale="log"
        />
      </div>
    </div>
  )
}
