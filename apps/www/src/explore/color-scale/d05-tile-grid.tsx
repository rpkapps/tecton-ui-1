import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, getColormap } from "./colormaps"
import { ColormapBar } from "./parts"

/** 05 — A swatch-sized trigger for tight spaces, opening a grid of gradient tiles. */
export default function DropdownTileGrid() {
  const [open, setOpen] = React.useState(false)
  const [map, setMap] = React.useState("inferno")
  const [hover, setHover] = React.useState<string | null>(null)
  return (
    <Field>
      <FieldLabel htmlFor="d5-map">Colour scale</FieldLabel>
      {/* Field stretches its children; the swatch button keeps its own size. */}
      <div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button id="d5-map" variant="outline" className="w-fit" />}
            aria-label={`Colour scale: ${getColormap(map).name}`}
          >
            <ColormapBar id={map} className="h-4 w-10" />
            <ChevronDownIcon data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 gap-2">
            <ToggleGroup
              aria-label="Colour scale"
              className="grid w-full grid-cols-4"
              value={[map]}
              onValueChange={([next]) => {
                if (!next) return
                setMap(next)
                setOpen(false)
              }}
              onPointerLeave={() => setHover(null)}
            >
              {colormaps.map((m) => (
                <ToggleGroupItem
                  key={m.id}
                  value={m.id}
                  aria-label={m.name}
                  size="lg"
                  onPointerEnter={() => setHover(m.id)}
                  onFocus={() => setHover(m.id)}
                >
                  <ColormapBar id={m.id} className="h-5 w-full" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {getColormap(hover ?? map).name}
            </span>
          </PopoverContent>
        </Popover>
      </div>
    </Field>
  )
}
