import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"

import { ColormapSelect } from "./colormap-select"
import { getColormap } from "./colormaps"
import { ScalePreview } from "./parts"

/** 01 — A dropdown: the gradient beside each name, grouped by family. */
export default function PickerSelect() {
  const [map, setMap] = React.useState("res2d")
  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Field>
        <FieldLabel htmlFor="p1-map">Colour scale</FieldLabel>
        <ColormapSelect
          id="p1-map"
          value={map}
          onValueChange={setMap}
          className="w-full"
        />
        <FieldDescription>{getColormap(map).note}</FieldDescription>
      </Field>
      <ScalePreview map={map} />
    </div>
  )
}
