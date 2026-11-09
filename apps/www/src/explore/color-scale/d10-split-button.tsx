import * as React from "react"
import { ChevronDownIcon, RepeatIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { FieldTitle, Field } from "@tecton/react/components/field"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColormapBar } from "./parts"

/**
 * 10 — A split button for A/B checking: the main part flips back to the
 * previous scale in one click; the chevron opens the full list.
 */
export default function DropdownSplitButton() {
  const [map, setMap] = React.useState("turbo")
  const [previous, setPrevious] = React.useState("viridis")
  const choose = (id: string) => {
    if (id === map) return
    setPrevious(map)
    setMap(id)
  }
  return (
    <Field>
      <FieldTitle id="d10-label">Colour scale</FieldTitle>
      <ButtonGroup aria-labelledby="d10-label" className="w-full">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={() => choose(previous)}
              />
            }
          >
            <ColormapBar id={map} className="h-3 w-10" />
            <span className="flex-1 text-start">{getColormap(map).name}</span>
            <RepeatIcon data-icon="inline-end" />
          </TooltipTrigger>
          <TooltipContent>
            Switch back to {getColormap(previous).name}
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="All colour scales"
              />
            }
          >
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {colormapGroups.map((g, i) => (
              <DropdownMenuGroup key={g.id}>
                {i > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel>{g.name}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={map} onValueChange={choose}>
                  {colormaps
                    .filter((m) => m.group === g.id)
                    .map((m) => (
                      <DropdownMenuRadioItem key={m.id} value={m.id}>
                        <ColormapBar id={m.id} className="h-3 w-12" />
                        {m.name}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </Field>
  )
}
