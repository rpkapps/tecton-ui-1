import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
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

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

const items = Object.fromEntries(colormaps.map((map) => [map.id, map.name]))

/**
 * 11 — A dropdown where the gradient is the value: it fills the whole trigger,
 * and every option is a full-width strip under its name.
 */
export default function PickerFullWidthSelect() {
  const [map, setMap] = React.useState("turbo")
  return (
    <div className="grid gap-6 md:grid-cols-[20rem_1fr]">
      <Field>
        <FieldLabel htmlFor="p11-map">Colour scale</FieldLabel>
        <Select
          items={items}
          value={map}
          onValueChange={(next) => next && setMap(next)}
        >
          <SelectTrigger id="p11-map" className="w-full">
            <SelectValue>
              {(current: string) => (
                <>
                  <ColormapBar id={current} className="h-4 w-full" />
                  {/* The strip is decoration; the name keeps the value readable. */}
                  <span className="sr-only">{getColormap(current).name}</span>
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {colormapGroups.map((group, index) => (
              <SelectGroup key={group.id}>
                {index > 0 ? <SelectSeparator /> : null}
                <SelectLabel>{group.name}</SelectLabel>
                {colormaps
                  .filter((m) => m.group === group.id)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex w-full flex-col gap-1">
                        <span>{m.name}</span>
                        <ColormapBar id={m.id} className="h-3 w-full" />
                      </span>
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          {getColormap(map).name} · {getColormap(map).note}
        </FieldDescription>
      </Field>
      <ScalePreview map={map} />
    </div>
  )
}
