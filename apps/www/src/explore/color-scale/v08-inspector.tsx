import * as React from "react"
import { RotateCcwIcon } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"
import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Slider } from "@tecton/react/components/slider"
import { Switch } from "@tecton/react/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

import { ColormapSelect } from "./colormap-select"
import { colormapCss, type ScaleType } from "./colormaps"
import { getErtSection } from "./model"
import {
  HorizontalColorbar,
  presetColorFn,
  SectionPreview,
  UnitInput,
} from "./parts"

type OutOfRange = "clamp" | "color" | "transparent"
const outOfRangeItems: Record<OutOfRange, string> = {
  clamp: "End colour",
  color: "Custom colour",
  transparent: "Transparent",
}
const levelItems: Record<string, string> = {
  "0": "Continuous",
  "6": "6 levels",
  "10": "10 levels",
  "16": "16 levels",
  "24": "24 levels",
}

const defaults = {
  map: "res2d",
  reversed: false,
  min: 5,
  max: 1000,
  scale: "log" as ScaleType,
  below: "clamp" as OutOfRange,
  belowColor: "#ffffff",
  above: "color" as OutOfRange,
  aboveColor: "#3d3d3d",
  opacity: 100,
  levels: 0,
}

function OutOfRangeField({
  id,
  label,
  mode,
  color,
  onModeChange,
  onColorChange,
}: {
  id: string
  label: string
  mode: OutOfRange
  color: string
  onModeChange: (mode: OutOfRange) => void
  onColorChange: (color: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Select
          items={outOfRangeItems}
          value={mode}
          onValueChange={(next) => next && onModeChange(next)}
        >
          <SelectTrigger id={id} className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(outOfRangeItems).map(([value, text]) => (
              <SelectItem key={value} value={value}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mode === "color" ? (
          <ColorSwatch
            color={color}
            onColorChange={onColorChange}
            presets={["#ffffff", "#d9d9d9", "#3d3d3d", "#000000", "#ff00ff"]}
            aria-label={`${label} colour`}
          />
        ) : null}
      </div>
    </Field>
  )
}

/** 08 — A property inspector: every setting in collapsible sections beside the view. */
export default function ColorScaleInspector() {
  const section = getErtSection()
  const [s, setS] = React.useState(defaults)
  const set = <TKey extends keyof typeof defaults>(
    key: TKey,
    value: (typeof defaults)[TKey]
  ) => setS((prev) => ({ ...prev, [key]: value }))
  const invalid = s.min >= s.max || s.min <= 0

  const color = React.useMemo(
    () =>
      presetColorFn(s.map, {
        reversed: s.reversed,
        min: s.min,
        max: s.max,
        scale: s.scale,
        classes: s.levels || null,
        opacity: s.opacity / 100,
        below:
          s.below === "clamp"
            ? undefined
            : s.below === "color"
              ? s.belowColor
              : null,
        above:
          s.above === "clamp"
            ? undefined
            : s.above === "color"
              ? s.aboveColor
              : null,
      }),
    [s]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <SectionPreview section={section} color={color} checker />
        <HorizontalColorbar
          background={colormapCss(s.map, {
            reversed: s.reversed,
            classes: s.levels || null,
          })}
          min={s.min}
          max={s.max}
          scale={s.scale}
        />
      </div>
      <Panel variant="outline" size="sm" className="h-[34rem]">
        <PanelHeader>
          <PanelTitle>Colour scale</PanelTitle>
          <PanelActions>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reset colour scale"
              onClick={() => setS(defaults)}
            >
              <RotateCcwIcon />
            </Button>
          </PanelActions>
        </PanelHeader>
        <PanelContent>
          <Accordion multiple defaultValue={["map", "range"]}>
            <AccordionItem value="map">
              <AccordionTrigger>Colormap</AccordionTrigger>
              <AccordionContent>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="v8-map">Preset</FieldLabel>
                    <ColormapSelect
                      id="v8-map"
                      value={s.map}
                      reversed={s.reversed}
                      onValueChange={(v) => set("map", v)}
                      className="w-full"
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="v8-reverse">Reverse</FieldLabel>
                    <Switch
                      id="v8-reverse"
                      checked={s.reversed}
                      onCheckedChange={(v) => set("reversed", v)}
                    />
                  </Field>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="range">
              <AccordionTrigger>Range</AccordionTrigger>
              <AccordionContent>
                <FieldGroup className="gap-4">
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor="v8-min">Minimum</FieldLabel>
                    <UnitInput
                      id="v8-min"
                      value={s.min}
                      onCommit={(v) => set("min", v)}
                      invalid={invalid}
                    />
                  </Field>
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor="v8-max">Maximum</FieldLabel>
                    <UnitInput
                      id="v8-max"
                      value={s.max}
                      onCommit={(v) => set("max", v)}
                      invalid={invalid}
                    />
                  </Field>
                  <Field>
                    <FieldTitle id="v8-scale">Mapping</FieldTitle>
                    <ToggleGroup
                      aria-labelledby="v8-scale"
                      variant="outline"
                      spacing={0}
                      value={[s.scale]}
                      onValueChange={([next]) =>
                        next && set("scale", next as ScaleType)
                      }
                    >
                      <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
                      <ToggleGroupItem value="log">Log</ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setS((p) => ({
                        ...p,
                        min: section.min,
                        max: section.max,
                      }))
                    }
                  >
                    Fit to model
                  </Button>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="out">
              <AccordionTrigger>Out of range</AccordionTrigger>
              <AccordionContent>
                <FieldGroup className="gap-4">
                  <OutOfRangeField
                    id="v8-below"
                    label="Below minimum"
                    mode={s.below}
                    color={s.belowColor}
                    onModeChange={(m) => set("below", m)}
                    onColorChange={(c) => set("belowColor", c)}
                  />
                  <OutOfRangeField
                    id="v8-above"
                    label="Above maximum"
                    mode={s.above}
                    color={s.aboveColor}
                    onModeChange={(m) => set("above", m)}
                    onColorChange={(c) => set("aboveColor", c)}
                  />
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="render">
              <AccordionTrigger>Rendering</AccordionTrigger>
              <AccordionContent>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="v8-levels">Levels</FieldLabel>
                    <Select
                      items={levelItems}
                      value={String(s.levels)}
                      onValueChange={(next) =>
                        next && set("levels", Number(next))
                      }
                    >
                      <SelectTrigger id="v8-levels">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(levelItems).map(([value, text]) => (
                          <SelectItem key={value} value={value}>
                            {text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldTitle id="v8-opacity">Opacity</FieldTitle>
                    <Slider
                      aria-labelledby="v8-opacity"
                      min={0}
                      max={100}
                      step={5}
                      value={[s.opacity]}
                      onValueChange={(next) =>
                        set("opacity", Array.isArray(next) ? next[0]! : next)
                      }
                    />
                    <FieldDescription>{s.opacity} %</FieldDescription>
                  </Field>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </PanelContent>
        <PanelFooter>
          <Button className="w-full">Save as preset</Button>
        </PanelFooter>
      </Panel>
    </div>
  )
}
