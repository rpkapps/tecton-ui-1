import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Switch } from "@tecton/react/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

/** 03 — A button that shows the scale, opening a grid of every preset. */
export default function PickerPopoverGrid() {
  const [open, setOpen] = React.useState(false)
  const [map, setMap] = React.useState("turbo")
  const [reversed, setReversed] = React.useState(false)
  return (
    <div className="flex flex-col gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" className="w-fit" />}
          aria-label={`Colour scale: ${getColormap(map).name}`}
        >
          <ColormapBar id={map} reversed={reversed} className="h-3 w-20" />
          {getColormap(map).name}
          <ChevronDownIcon data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96">
          {colormapGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1.5">
              <span
                id={`p3-${group.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {group.name}
              </span>
              <ToggleGroup
                aria-labelledby={`p3-${group.id}`}
                className="grid w-full grid-cols-3"
                value={getColormap(map).group === group.id ? [map] : []}
                onValueChange={([next]) => {
                  if (!next) return
                  setMap(next)
                  setOpen(false)
                }}
              >
                {colormaps
                  .filter((m) => m.group === group.id)
                  .map((m) => (
                    <ToggleGroupItem
                      key={m.id}
                      value={m.id}
                      className="flex-col gap-1"
                      size="lg"
                    >
                      <ColormapBar
                        id={m.id}
                        reversed={reversed}
                        className="h-3 w-full"
                      />
                      <span className="text-xs">{m.name}</span>
                    </ToggleGroupItem>
                  ))}
              </ToggleGroup>
            </div>
          ))}
          <Field orientation="horizontal">
            <FieldLabel htmlFor="p3-reverse">Reverse</FieldLabel>
            <Switch
              id="p3-reverse"
              checked={reversed}
              onCheckedChange={setReversed}
            />
          </Field>
        </PopoverContent>
      </Popover>
      <ScalePreview map={map} reversed={reversed} />
    </div>
  )
}
