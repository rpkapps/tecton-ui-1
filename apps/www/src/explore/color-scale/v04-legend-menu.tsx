import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColorbarTicks, ColormapBar, SectionPreview, useColorFn } from "./parts"

/** 04 — The legend is the picker: the colour bar beside the plot opens a menu of scales. */
export default function PickerLegendMenu() {
  const [map, setMap] = React.useState("inferno")
  const [reversed, setReversed] = React.useState(false)
  const color = useColorFn(map, reversed)
  return (
    <div className="flex gap-4">
      <SectionPreview color={color} className="flex-1" />
      <div className="flex shrink-0 flex-col items-start gap-2 pb-5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" />}
            aria-label={`Colour scale: ${getColormap(map).name}`}
          >
            Ω·m
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="start" className="w-60">
            {colormapGroups.map((group, i) => (
              <DropdownMenuGroup key={group.id}>
                {i > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={map} onValueChange={setMap}>
                  {colormaps
                    .filter((m) => m.group === group.id)
                    .map((m) => (
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
              </DropdownMenuGroup>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={reversed}
              onCheckedChange={setReversed}
            >
              Reverse
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div dir="ltr" className="flex flex-1 gap-1 ps-2.5">
          <ColormapBar
            id={map}
            reversed={reversed}
            direction="to top"
            className="h-full w-4"
            label={`Colour scale ${getColormap(map).name}, 2 to 2000 ohm metres`}
          />
          <ColorbarTicks orientation="vertical" />
        </div>
      </div>
    </div>
  )
}
