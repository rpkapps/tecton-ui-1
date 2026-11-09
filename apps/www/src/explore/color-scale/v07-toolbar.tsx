import * as React from "react"
import { ArrowLeftRightIcon, LockIcon, LockOpenIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Separator } from "@tecton/react/components/separator"
import { Toggle } from "@tecton/react/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

import { ColormapSelect } from "./colormap-select"
import { colormapCss, percentile, type ScaleType } from "./colormaps"
import { getIterationSection } from "./model"
import {
  ColorbarTicks,
  GradientBar,
  presetColorFn,
  SectionPreview,
  UnitInput,
} from "./parts"

const iterationItems = Object.fromEntries(
  [1, 2, 3, 4, 5, 6].map((n) => [String(n), `Iteration ${n}`])
)

/** 07 — A dense strip along the bottom of a viewer: everything on one line, the bar between min and max. */
export default function ColorScaleToolbar() {
  const [iteration, setIteration] = React.useState(6)
  const section = getIterationSection(iteration)
  const [map, setMap] = React.useState("turbo")
  const [reversed, setReversed] = React.useState(false)
  const [scale, setScale] = React.useState<ScaleType>("log")
  const [locked, setLocked] = React.useState(false)
  const [fixed, setFixed] = React.useState<[number, number]>([3, 2000])

  // Unlocked, the limits follow each iteration (2–98 %); locked, they stay put
  // so iterations can be compared colour for colour.
  const auto: [number, number] = [
    percentile(section.sorted, 2),
    percentile(section.sorted, 98),
  ]
  const [min, max] = locked ? fixed : auto
  const setLimit = (index: 0 | 1, value: number) => {
    const next: [number, number] = [min, max]
    next[index] = value
    setFixed(next)
    setLocked(true)
  }

  const color = React.useMemo(
    () => presetColorFn(map, { reversed, min, max, scale }),
    [map, reversed, min, max, scale]
  )

  return (
    <Panel variant="outline">
      <PanelHeader>
        <PanelTitle>Line 3 · ERT inversion</PanelTitle>
        <PanelDescription>
          RMS misfit {(9.4 / iteration + 1.1).toFixed(1)} %
        </PanelDescription>
        <PanelActions>
          <Select
            items={iterationItems}
            value={String(iteration)}
            onValueChange={(next) => next && setIteration(Number(next))}
          >
            <SelectTrigger size="sm" variant="filled" aria-label="Iteration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(iterationItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PanelActions>
      </PanelHeader>
      <PanelContent>
        <SectionPreview section={section} color={color} />
      </PanelContent>
      <PanelFooter className="flex-wrap gap-2">
        <ColormapSelect
          aria-label="Colormap"
          size="sm"
          variant="filled"
          value={map}
          onValueChange={setMap}
          reversed={reversed}
        />
        <Separator orientation="vertical" />
        <UnitInput
          aria-label="Minimum"
          value={min}
          onCommit={(v) => setLimit(0, v)}
          className="w-24"
        />
        <div dir="ltr" className="flex min-w-40 flex-1 flex-col gap-0.5 pt-4">
          <GradientBar
            background={colormapCss(map, { reversed })}
            className="h-3 w-full"
          />
          <ColorbarTicks min={min} max={max} scale={scale} />
        </div>
        <UnitInput
          aria-label="Maximum"
          value={max}
          onCommit={(v) => setLimit(1, v)}
          className="w-24"
        />
        <Separator orientation="vertical" />
        <ToggleGroup
          aria-label="Scale"
          variant="outline"
          size="sm"
          spacing={0}
          value={[scale]}
          onValueChange={([next]) => next && setScale(next as ScaleType)}
        >
          <ToggleGroupItem value="linear">Lin</ToggleGroupItem>
          <ToggleGroupItem value="log">Log</ToggleGroupItem>
        </ToggleGroup>
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={reversed}
                onPressedChange={setReversed}
                aria-label="Reverse colormap"
              />
            }
          >
            <ArrowLeftRightIcon />
          </TooltipTrigger>
          <TooltipContent>Reverse colormap</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={locked}
                onPressedChange={(next) => {
                  if (next) setFixed([min, max])
                  setLocked(next)
                }}
                aria-label="Lock range across iterations"
              />
            }
          >
            {locked ? <LockIcon /> : <LockOpenIcon />}
          </TooltipTrigger>
          <TooltipContent>
            {locked
              ? "Range locked across iterations"
              : "Range follows each iteration (2–98 %)"}
          </TooltipContent>
        </Tooltip>
      </PanelFooter>
    </Panel>
  )
}
