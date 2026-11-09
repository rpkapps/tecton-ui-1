import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColormapBar } from "./parts"
import { ColormapButton } from "./trigger-button"

/** 07 — Family tabs inside the dropdown keep each list short. */
export default function DropdownTabbed() {
  const [open, setOpen] = React.useState(false)
  const [map, setMap] = React.useState("earth")
  const [tab, setTab] = React.useState<string>(getColormap(map).group)
  return (
    <Field>
      <FieldLabel htmlFor="d7-map">Colour scale</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setTab(getColormap(map).group)
          setOpen(next)
        }}
      >
        <PopoverTrigger render={<ColormapButton id="d7-map" map={map} />} />
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-80 gap-2"
        >
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList
              variant="line"
              aria-label="Colour scale family"
              className="w-full"
            >
              {colormapGroups.map((g) => (
                <TabsTrigger key={g.id} value={g.id}>
                  {g.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {colormapGroups.map((g) => (
              <TabsContent key={g.id} value={g.id} className="pt-2">
                <ToggleGroup
                  aria-label={`${g.name} colour scales`}
                  orientation="vertical"
                  className="w-full"
                  value={[map]}
                  onValueChange={([next]) => {
                    if (!next) return
                    setMap(next)
                    setOpen(false)
                  }}
                >
                  {colormaps
                    .filter((m) => m.group === g.id)
                    .map((m) => (
                      <ToggleGroupItem
                        key={m.id}
                        value={m.id}
                        className="justify-start"
                      >
                        <ColormapBar id={m.id} className="h-3 w-14" />
                        {m.name}
                      </ToggleGroupItem>
                    ))}
                </ToggleGroup>
              </TabsContent>
            ))}
          </Tabs>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
