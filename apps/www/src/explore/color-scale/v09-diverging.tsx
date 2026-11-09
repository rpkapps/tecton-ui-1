import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import { Slider } from "@tecton/react/components/slider"
import { Switch } from "@tecton/react/components/switch"

import { ColormapSelect } from "./colormap-select"
import {
  buildLut,
  colormapCss,
  evenStops,
  getColormap,
  ticks,
} from "./colormaps"
import { getChangeSection } from "./model"
import { GradientBar, SectionPreview, type ColorFn } from "./parts"

const signed = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v))}`

/** Position on the bar: each side of the centre gets half the bar, however long it is. */
function piecewise(v: number, lo: number, centre: number, hi: number) {
  if (v <= centre) return 0.5 * Math.max(0, (v - lo) / (centre - lo || 1))
  return 0.5 + 0.5 * Math.min(1, (v - centre) / (hi - centre || 1))
}

/** 09 — A centred scale for time-lapse differences: a pivot, a symmetric range and a neutral band. */
export default function ColorScaleDiverging() {
  const section = getChangeSection()
  const [map, setMap] = React.useState("rdbu")
  const [reversed, setReversed] = React.useState(true)
  const [centre, setCentre] = React.useState(0)
  const [symmetric, setSymmetric] = React.useState(true)
  const [half, setHalf] = React.useState(40)
  const [range, setRange] = React.useState<[number, number]>([-45, 25])
  const [neutral, setNeutral] = React.useState(3)

  const lo = symmetric ? centre - half : Math.min(range[0], centre - 1)
  const hi = symmetric ? centre + half : Math.max(range[1], centre + 1)

  const color = React.useMemo<ColorFn>(() => {
    const lut = buildLut(evenStops(getColormap(map).stops, reversed))
    return (v) => {
      const t =
        Math.abs(v - centre) < neutral ? 0.5 : piecewise(v, lo, centre, hi)
      const k = Math.round(t * 255) * 3
      return [lut[k], lut[k + 1], lut[k + 2], 255]
    }
  }, [map, reversed, centre, neutral, lo, hi])

  const tickValues = ticks(lo, hi, "linear", 6)
  const neutralLeft = piecewise(centre - neutral, lo, centre, hi) * 100
  const neutralRight = piecewise(centre + neutral, lo, centre, hi) * 100

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="v9-map">Diverging colormap</FieldLabel>
          <ColormapSelect
            id="v9-map"
            groups={["diverging"]}
            value={map}
            reversed={reversed}
            onValueChange={setMap}
            className="w-full"
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="v9-reverse">Decrease in blue</FieldLabel>
          <Switch
            id="v9-reverse"
            checked={reversed}
            onCheckedChange={setReversed}
          />
        </Field>
        <Field>
          <FieldTitle id="v9-centre">Centre</FieldTitle>
          <Slider
            aria-labelledby="v9-centre"
            min={-20}
            max={20}
            step={1}
            value={[centre]}
            onValueChange={(next) =>
              setCentre(Array.isArray(next) ? next[0]! : next)
            }
          />
          <FieldDescription>
            {signed(centre)} % maps to the neutral colour
          </FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="v9-symmetric">
            Symmetric about the centre
          </FieldLabel>
          <Switch
            id="v9-symmetric"
            checked={symmetric}
            onCheckedChange={setSymmetric}
          />
        </Field>
        {symmetric ? (
          <Field>
            <FieldTitle id="v9-half">Range</FieldTitle>
            <Slider
              aria-labelledby="v9-half"
              min={5}
              max={80}
              step={1}
              value={[half]}
              onValueChange={(next) =>
                setHalf(Array.isArray(next) ? next[0]! : next)
              }
            />
            <FieldDescription>± {half} % around the centre</FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldTitle id="v9-range">Range</FieldTitle>
            <Slider
              aria-labelledby="v9-range"
              min={-80}
              max={80}
              step={1}
              value={range}
              onValueChange={(next) =>
                Array.isArray(next) && setRange([next[0]!, next[1]!])
              }
            />
            <FieldDescription>
              {signed(lo)} % to {signed(hi)} %, each side stretched to half the
              bar
            </FieldDescription>
          </Field>
        )}
        <Field>
          <FieldTitle id="v9-neutral">Neutral band</FieldTitle>
          <Slider
            aria-labelledby="v9-neutral"
            min={0}
            max={10}
            step={0.5}
            value={[neutral]}
            onValueChange={(next) =>
              setNeutral(Array.isArray(next) ? next[0]! : next)
            }
          />
          <FieldDescription>
            Changes within ± {neutral} % (inversion noise) are drawn neutral
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex min-w-0 flex-col gap-3">
        <SectionPreview
          section={section}
          color={color}
          label="Time-lapse resistivity change"
        />
        <div dir="ltr" className="flex flex-col gap-1">
          <GradientBar
            background={colormapCss(map, { reversed })}
            className="h-3 w-full"
          >
            <span
              className="absolute inset-y-0 border-x border-dashed border-foreground/60"
              style={{
                left: `${neutralLeft}%`,
                width: `${neutralRight - neutralLeft}%`,
              }}
            />
          </GradientBar>
          <div
            aria-hidden
            className="relative h-4 text-xs text-muted-foreground tabular-nums"
          >
            {tickValues.map((v) => {
              const t = piecewise(v, lo, centre, hi)
              const edge =
                t < 0.04
                  ? ""
                  : t > 0.96
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              return (
                <span
                  key={v}
                  className={`absolute top-0 ${edge}`}
                  style={{ left: `${(t * 100).toFixed(3)}%` }}
                >
                  {signed(v)}
                </span>
              )
            })}
          </div>
          <span className="text-center text-xs text-muted-foreground">
            Resistivity change between surveys (%)
          </span>
        </div>
      </div>
    </div>
  )
}
