import * as React from "react"
import { ArrowLeftRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, getColormap } from "./colormaps"
import { ColormapBar, useColorFn, useSectionPaint } from "./parts"
import { getErtSection } from "./model"

/**
 * 13 — Split compare: the scale in use on the left, a candidate on the right,
 * and a divider to drag across the features that matter.
 */
export default function PickerSplitCompare() {
  const section = getErtSection()
  const [current, setCurrent] = React.useState("jet")
  const [candidate, setCandidate] = React.useState("viridis")
  const [split, setSplit] = React.useState(50)
  const [dragging, setDragging] = React.useState(false)
  const frame = React.useRef<HTMLDivElement>(null)
  const left = useSectionPaint(useColorFn(current))
  const right = useSectionPaint(useColorFn(candidate))

  const moveTo = (clientX: number) => {
    const rect = frame.current!.getBoundingClientRect()
    setSplit(
      Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={frame}
        dir="ltr"
        className="relative touch-none overflow-hidden rounded-sm border border-border-subtle select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          moveTo(event.clientX)
        }}
        onPointerMove={(event) => dragging && moveTo(event.clientX)}
        onPointerUp={() => setDragging(false)}
      >
        <canvas
          ref={right}
          width={section.width}
          height={section.height}
          role="img"
          aria-label={`Right of the divider: section in ${getColormap(candidate).name}`}
          className="block h-auto w-full"
        />
        <canvas
          ref={left}
          width={section.width}
          height={section.height}
          role="img"
          aria-label={`Left of the divider: section in ${getColormap(current).name}`}
          className="absolute inset-0 block h-full w-full"
          style={{ clipPath: `inset(0 ${(100 - split).toFixed(2)}% 0 0)` }}
        />
        <Badge variant="secondary" className="absolute start-2 top-2">
          In use · {getColormap(current).name}
        </Badge>
        <Badge variant="secondary" className="absolute end-2 top-2">
          Candidate · {getColormap(candidate).name}
        </Badge>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Divider position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(split)}
          aria-valuetext={`${Math.round(split)} % ${getColormap(current).name}`}
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 cursor-ew-resize bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left: `${split.toFixed(2)}%` }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2
            if (event.key === "ArrowLeft")
              setSplit((s) => Math.max(0, s - step))
            if (event.key === "ArrowRight")
              setSplit((s) => Math.min(100, s + step))
          }}
        >
          <span className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md">
            <ArrowLeftRightIcon className="size-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span id="p13-candidates" className="text-sm text-muted-foreground">
          Compare with
        </span>
        <ToggleGroup
          aria-labelledby="p13-candidates"
          className="flex-wrap"
          value={[candidate]}
          onValueChange={([next]) => next && setCandidate(next)}
        >
          {colormaps
            .filter((m) => m.id !== current)
            .map((m) => (
              <ToggleGroupItem key={m.id} value={m.id} aria-label={m.name}>
                <ColormapBar id={m.id} className="h-3 w-10" />
              </ToggleGroupItem>
            ))}
        </ToggleGroup>
        <Button
          className="ms-auto"
          onClick={() => {
            setCurrent(candidate)
            setCandidate(current)
          }}
        >
          Use {getColormap(candidate).name}
        </Button>
      </div>
    </div>
  )
}
