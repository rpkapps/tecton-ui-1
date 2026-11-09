import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import { Slider } from "@tecton/react/components/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import { ColormapSelect } from "./colormap-select"
import {
  denormalize,
  formatOhm,
  getColormap,
  gradientCss,
  rgbToHex,
  sampleStops,
  type Stop,
} from "./colormaps"
import { getErtSection } from "./model"
import {
  GradientBar,
  HorizontalColorbar,
  makeColorFn,
  SectionPreview,
  UnitInput,
} from "./parts"

type EditableStop = Stop & { id: number }

const MIN = 1
const MAX = 2000
let nextId = 1

function fromPreset(id: string): EditableStop[] {
  const colors = getColormap(id).stops
  // A handful of stops is what a person edits; resample long maps to six.
  const n = Math.min(colors.length, 6)
  const even = colors.map((color, i) => ({
    pos: i / (colors.length - 1),
    color,
  }))
  return Array.from({ length: n }, (_, i) => {
    const pos = i / (n - 1)
    return { id: nextId++, pos, color: rgbToHex(sampleStops(even, pos)) }
  })
}

/** 03 — A gradient editor: drag stops along the bar, recolour each one, add and remove. */
export default function ColorScaleStopEditor() {
  const section = getErtSection()
  const [preset, setPreset] = React.useState("res2d")
  const [stops, setStops] = React.useState(() => fromPreset("res2d"))

  const background = gradientCss(stops)
  const color = React.useMemo(
    () => makeColorFn({ stops, min: MIN, max: MAX, scale: "log" }),
    [stops]
  )

  const update = (id: number, patch: Partial<Stop>) =>
    setStops((list) =>
      list
        .map((s) => (s.id === id ? { ...s, ...patch } : s))
        .sort((a, b) => a.pos - b.pos)
    )

  const addStop = () =>
    setStops((list) => {
      // Split the widest gap, in the colour already there.
      let at = 0
      for (let i = 1; i < list.length; i++)
        if (list[i].pos - list[i - 1].pos > list[at + 1].pos - list[at].pos)
          at = i - 1
      const pos = (list[at].pos + list[at + 1].pos) / 2
      const stop = {
        id: nextId++,
        pos,
        color: rgbToHex(sampleStops(list, pos)),
      }
      return [...list, stop].sort((a, b) => a.pos - b.pos)
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <ColormapSelect
          aria-label="Start from colormap"
          value={preset}
          onValueChange={(id) => {
            setPreset(id)
            setStops(fromPreset(id))
          }}
        />
        <ButtonGroup aria-label="Stops">
          <Button variant="outline" onClick={addStop}>
            <PlusIcon data-icon="inline-start" />
            Add stop
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setStops((list) =>
                list.map((s, i) => ({ ...s, pos: i / (list.length - 1) }))
              )
            }
          >
            Space evenly
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setStops((list) =>
                list.map((s) => ({ ...s, pos: 1 - s.pos })).reverse()
              )
            }
          >
            Reverse
          </Button>
        </ButtonGroup>
      </div>

      <div dir="ltr" className="flex flex-col gap-2">
        {/* The slider's thumbs sit edge-aligned (half a thumb in from each
            end), so the bar is inset by half a thumb to line up with them. */}
        <div className="px-2.5">
          <GradientBar
            background={background}
            className="h-10 w-full"
            label="Custom gradient"
          />
        </div>
        <Slider
          aria-label="Stop position"
          min={0}
          max={100}
          step={0.5}
          value={stops.map((s) => s.pos * 100)}
          onValueChange={(next) => {
            const values = Array.isArray(next) ? next : [next]
            setStops((list) =>
              list.map((s, i) => ({
                ...s,
                pos: (values[i] ?? s.pos * 100) / 100,
              }))
            )
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Colour</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-end">Value</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.map((stop, index) => (
              <TableRow key={stop.id}>
                <TableCell>
                  <ColorSwatch
                    color={stop.color}
                    onColorChange={(c) => update(stop.id, { color: c })}
                    presets={getColormap(preset).stops.slice(0, 8)}
                    aria-label={`Stop ${index + 1} colour`}
                  />
                </TableCell>
                <TableCell>
                  <UnitInput
                    aria-label={`Stop ${index + 1} position`}
                    unit="%"
                    format={(v) => String(Math.round(v * 10) / 10)}
                    value={stop.pos * 100}
                    onCommit={(v) =>
                      update(stop.id, {
                        pos: Math.min(1, Math.max(0, v / 100)),
                      })
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {formatOhm(denormalize(stop.pos, MIN, MAX, "log"))} Ω·m
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={stops.length <= 2}
                    aria-label={`Remove stop ${index + 1}`}
                    onClick={() =>
                      setStops((list) => list.filter((s) => s.id !== stop.id))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex min-w-0 flex-col gap-3">
          <SectionPreview section={section} color={color} />
          <HorizontalColorbar
            background={background}
            min={MIN}
            max={MAX}
            scale="log"
          />
        </div>
      </div>
    </div>
  )
}
