import * as React from "react"
import { ArrowLeftRightIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
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

import { colormaps, getColormap } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

const favourites = ["res2d", "turbo", "viridis", "magma", "greys"]

/** 05 — A toolbar quick switch: five favourites one click away, the rest under More. */
export default function PickerQuickSwitch() {
  const [map, setMap] = React.useState("res2d")
  const [reversed, setReversed] = React.useState(false)
  const others = colormaps.filter((m) => !favourites.includes(m.id))
  const isOther = !favourites.includes(map)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          aria-label="Colour scale"
          variant="outline"
          spacing={0}
          value={favourites.includes(map) ? [map] : []}
          onValueChange={([next]) => next && setMap(next)}
        >
          {favourites.map((id) => (
            <Tooltip key={id}>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    value={id}
                    aria-label={getColormap(id).name}
                  />
                }
              >
                <ColormapBar id={id} reversed={reversed} className="h-4 w-12" />
              </TooltipTrigger>
              <TooltipContent>{getColormap(id).name}</TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant={isOther ? "secondary" : "ghost"} />}
          >
            {isOther ? (
              <>
                <ColormapBar
                  id={map}
                  reversed={reversed}
                  className="h-4 w-12"
                />
                {getColormap(map).name}
              </>
            ) : (
              "More"
            )}
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup value={map} onValueChange={setMap}>
              {others.map((m) => (
                <DropdownMenuRadioItem key={m.id} value={m.id}>
                  <ColormapBar
                    id={m.id}
                    reversed={reversed}
                    className="h-3 w-14"
                  />
                  {m.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          variant="outline"
          pressed={reversed}
          onPressedChange={setReversed}
        >
          <ArrowLeftRightIcon data-icon="inline-start" />
          Reverse
        </Toggle>
      </div>
      <ScalePreview map={map} reversed={reversed} />
    </div>
  )
}
