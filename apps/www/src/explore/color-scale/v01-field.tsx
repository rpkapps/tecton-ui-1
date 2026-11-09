import * as React from "react"
import { ArrowLeftRightIcon } from "lucide-react"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import { Toggle } from "@tecton/react/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { ColormapSelect } from "./colormap-select"
import { colormapCss, type ScaleType } from "./colormaps"
import { getErtSection } from "./model"
import {
  HorizontalColorbar,
  presetColorFn,
  SectionPreview,
  UnitInput,
} from "./parts"

/** 01 — A plain form field: colormap Select, range, scale and reverse. */
export default function ColorScaleField() {
  const section = getErtSection()
  const [map, setMap] = React.useState("res2d")
  const [reversed, setReversed] = React.useState(false)
  const [scale, setScale] = React.useState<ScaleType>("log")
  const [min, setMin] = React.useState(2)
  const [max, setMax] = React.useState(2000)
  const invalid = min >= max || (scale === "log" && min <= 0)

  const color = React.useMemo(
    () => presetColorFn(map, { reversed, min, max, scale }),
    [map, reversed, min, max, scale]
  )

  return (
    <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="v1-map">Colormap</FieldLabel>
          <div className="flex gap-2">
            <ColormapSelect
              id="v1-map"
              value={map}
              onValueChange={setMap}
              reversed={reversed}
              className="flex-1"
            />
            <Toggle
              variant="outline"
              pressed={reversed}
              onPressedChange={setReversed}
              aria-label="Reverse colormap"
            >
              <ArrowLeftRightIcon />
            </Toggle>
          </div>
        </Field>
        <Field data-invalid={invalid || undefined}>
          <FieldTitle id="v1-range">Range</FieldTitle>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-labelledby="v1-range"
          >
            <UnitInput
              aria-label="Minimum resistivity"
              value={min}
              onCommit={setMin}
              invalid={invalid}
            />
            <UnitInput
              aria-label="Maximum resistivity"
              value={max}
              onCommit={setMax}
              invalid={invalid}
            />
          </div>
          <FieldDescription>
            Model spans {Math.round(section.min * 10) / 10}–
            {Math.round(section.max)} Ω·m.
          </FieldDescription>
        </Field>
        <Field>
          <FieldTitle id="v1-scale">Scale</FieldTitle>
          <ToggleGroup
            aria-labelledby="v1-scale"
            variant="outline"
            spacing={0}
            value={[scale]}
            onValueChange={([next]) => next && setScale(next as ScaleType)}
          >
            <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
            <ToggleGroupItem value="log">Logarithmic</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </FieldGroup>
      <div className="flex min-w-0 flex-col gap-3">
        <SectionPreview
          section={section}
          color={invalid ? () => [0, 0, 0, 0] : color}
        />
        {!invalid ? (
          <HorizontalColorbar
            background={colormapCss(map, { reversed })}
            min={min}
            max={max}
            scale={scale}
          />
        ) : null}
      </div>
    </div>
  )
}
