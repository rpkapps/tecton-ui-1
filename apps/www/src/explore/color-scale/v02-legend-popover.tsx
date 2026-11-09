import * as React from "react"
import { SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Switch } from "@tecton/react/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import {
  colormapCss,
  colormaps,
  getColormap,
  type ScaleType,
} from "./colormaps"
import { getErtSection } from "./model"
import {
  ColorbarTicks,
  GradientBar,
  presetColorFn,
  SectionPreview,
  UnitInput,
} from "./parts"

/** 02 — The legend is the control: a vertical colour bar that opens its editor in place. */
export default function ColorScaleLegendPopover() {
  const section = getErtSection()
  const [map, setMap] = React.useState("turbo")
  const [reversed, setReversed] = React.useState(false)
  const [log, setLog] = React.useState(true)
  const [min, setMin] = React.useState(3)
  const [max, setMax] = React.useState(3000)
  const scale: ScaleType = log ? "log" : "linear"
  const invalid = min >= max || min <= 0

  const color = React.useMemo(
    () => presetColorFn(map, { reversed, min, max, scale }),
    [map, reversed, min, max, scale]
  )

  return (
    <div className="flex gap-4">
      <SectionPreview section={section} color={color} className="flex-1" />
      <div className="flex shrink-0 flex-col items-center gap-2 pb-5">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit colour scale"
              />
            }
          >
            <SlidersHorizontalIcon />
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Colour scale</PopoverTitle>
              <PopoverDescription>
                {getColormap(map).name} · {getColormap(map).note}
              </PopoverDescription>
            </PopoverHeader>
            <ToggleGroup
              aria-label="Colormap"
              className="grid w-full grid-cols-2"
              value={[map]}
              onValueChange={([next]) => next && setMap(next)}
            >
              {colormaps
                .filter((m) => m.group !== "diverging")
                .map((m) => (
                  <ToggleGroupItem key={m.id} value={m.id} aria-label={m.name}>
                    <GradientBar
                      background={colormapCss(m.id, { reversed })}
                      className="h-3 w-full"
                    />
                  </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <FieldGroup className="gap-4">
              <Field data-invalid={invalid || undefined}>
                <FieldTitle id="v2-range">Range</FieldTitle>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-labelledby="v2-range"
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
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="v2-log">Logarithmic</FieldLabel>
                <Switch id="v2-log" checked={log} onCheckedChange={setLog} />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="v2-reverse">Reverse</FieldLabel>
                <Switch
                  id="v2-reverse"
                  checked={reversed}
                  onCheckedChange={setReversed}
                />
              </Field>
            </FieldGroup>
          </PopoverContent>
        </Popover>
        <div dir="ltr" className="flex flex-1 gap-1">
          <GradientBar
            label={`Colour scale, ${getColormap(map).name}, ${min} to ${max} ohm metres`}
            background={colormapCss(map, { reversed, direction: "to top" })}
            className="h-full w-4"
          />
          {!invalid ? (
            <ColorbarTicks
              orientation="vertical"
              min={min}
              max={max}
              scale={scale}
            />
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">Ω·m</span>
      </div>
    </div>
  )
}
