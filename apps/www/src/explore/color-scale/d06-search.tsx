import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/components/combobox"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { InputGroupAddon } from "@tecton/react/components/input-group"

import {
  colormapGroups,
  colormaps,
  getColormap,
  type Colormap,
} from "./colormaps"
import { ColormapBar } from "./parts"

const familyName = (map: Colormap) =>
  colormapGroups.find((g) => g.id === map.group)?.name ?? ""

const searchText = (map: Colormap) =>
  `${map.name} ${familyName(map)} ${map.note} ${map.cvdSafe ? "colour-blind color-blind cvd safe" : ""}`.toLowerCase()

/** 06 — Type to narrow by name, family or "safe"; the current gradient sits in the field. */
export default function DropdownSearch() {
  const [map, setMap] = React.useState<Colormap>(getColormap("cividis"))
  return (
    <Field>
      <FieldLabel htmlFor="d6-map">Colour scale</FieldLabel>
      <Combobox
        items={colormaps}
        value={map}
        onValueChange={(next) => next && setMap(next)}
        itemToStringLabel={(item: Colormap) => item.name}
        itemToStringValue={(item: Colormap) => item.id}
        filter={(item: Colormap, query) => {
          const text = searchText(item)
          return query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .every((word) => text.includes(word))
        }}
      >
        <ComboboxInput id="d6-map" placeholder="Search colour scales">
          <InputGroupAddon align="inline-start">
            <ColormapBar id={map.id} className="h-3 w-8" />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>No colour scale matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: Colormap) => (
              <ComboboxItem key={item.id} value={item}>
                <ColormapBar id={item.id} className="h-3 w-12" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {familyName(item)}
                  </span>
                </span>
                {item.cvdSafe ? (
                  <Badge variant="secondary">CVD safe</Badge>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}
