import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

import { colormapGroups, colormaps, type Colormap } from "./colormaps"

const items = Object.fromEntries(colormaps.map((map) => [map.id, map.name]))

/**
 * A labelled colour scale Select whose trigger value and options are drawn by
 * the caller: the variations differ only in those two renderings.
 */
export function ColormapSelectShell({
  id,
  defaultValue,
  renderValue,
  renderItem,
  dropBelow = false,
}: {
  id: string
  defaultValue: string
  renderValue: (map: string) => React.ReactNode
  renderItem: (map: Colormap) => React.ReactNode
  /** Open the list under the trigger instead of over it. */
  dropBelow?: boolean
}) {
  const [map, setMap] = React.useState(defaultValue)
  return (
    <Field>
      <FieldLabel htmlFor={id}>Colour scale</FieldLabel>
      <Select
        items={items}
        value={map}
        onValueChange={(next) => next && setMap(next)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue>{(current: string) => renderValue(current)}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={!dropBelow}>
          {colormapGroups.map((group, index) => (
            <SelectGroup key={group.id}>
              {index > 0 ? <SelectSeparator /> : null}
              <SelectLabel>{group.name}</SelectLabel>
              {colormaps
                .filter((m) => m.group === group.id)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {renderItem(m)}
                  </SelectItem>
                ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
