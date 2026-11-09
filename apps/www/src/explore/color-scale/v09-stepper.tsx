import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormapGroups, colormaps } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

/** 09 — Flip through: the preview is the picker; step with the buttons or the strip. */
export default function PickerStepper() {
  const [index, setIndex] = React.useState(0)
  const map = colormaps[index]
  const step = (delta: number) =>
    setIndex((i) => (i + delta + colormaps.length) % colormaps.length)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous colour scale"
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <div
          className="flex flex-1 flex-col items-center gap-0.5 text-center"
          aria-live="polite"
        >
          <span className="flex items-center gap-2 font-medium">
            {map.name}
            {map.cvdSafe ? <Badge variant="secondary">CVD safe</Badge> : null}
          </span>
          <span className="text-xs text-muted-foreground">
            {colormapGroups.find((g) => g.id === map.group)?.name} · {map.note}{" "}
            · {index + 1} of {colormaps.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next colour scale"
          onClick={() => step(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <ScalePreview map={map.id} />
      <ToggleGroup
        aria-label="All colour scales"
        className="grid w-full grid-cols-7 lg:grid-cols-14"
        value={[map.id]}
        onValueChange={([next]) =>
          next && setIndex(colormaps.findIndex((m) => m.id === next))
        }
      >
        {colormaps.map((m) => (
          <ToggleGroupItem key={m.id} value={m.id} aria-label={m.name}>
            <ColormapBar id={m.id} className="h-3 w-full" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
