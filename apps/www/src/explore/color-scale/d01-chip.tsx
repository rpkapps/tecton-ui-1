import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"

import { ColormapSelect } from "./colormap-select"

/** 01 — A small gradient chip beside the name, in the trigger and every option. */
export default function DropdownChip() {
  const [map, setMap] = React.useState("res2d")
  return (
    <Field>
      <FieldLabel htmlFor="d1-map">Colour scale</FieldLabel>
      <ColormapSelect
        id="d1-map"
        value={map}
        onValueChange={setMap}
        className="w-full"
      />
    </Field>
  )
}
