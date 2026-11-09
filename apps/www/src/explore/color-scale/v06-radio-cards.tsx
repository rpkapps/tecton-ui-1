import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"

import { colormaps } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

// A short, curated list: the cards earn their space with a description each.
const shortlist = ["res2d", "turbo", "viridis", "cividis", "magma", "earth"]

/** 06 — Choice cards in a form: a short curated list, each with what it is good for. */
export default function PickerRadioCards() {
  const [map, setMap] = React.useState("cividis")
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <FieldSet>
        <FieldLegend variant="label">Colour scale</FieldLegend>
        <FieldDescription>
          Used for every section in this report.
        </FieldDescription>
        <RadioGroup
          value={map}
          onValueChange={(next) => setMap(next as string)}
          className="grid gap-2 sm:grid-cols-2"
        >
          {colormaps
            .filter((m) => shortlist.includes(m.id))
            .map((m) => (
              <FieldLabel key={m.id} htmlFor={`p6-${m.id}`}>
                <Field orientation="horizontal" className="items-start">
                  <FieldContent className="gap-1.5">
                    <ColormapBar id={m.id} className="h-4 w-full" />
                    <FieldTitle>
                      {m.name}
                      {m.cvdSafe ? (
                        <Badge variant="secondary">CVD safe</Badge>
                      ) : null}
                    </FieldTitle>
                    <FieldDescription>{m.note}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={m.id} id={`p6-${m.id}`} />
                </Field>
              </FieldLabel>
            ))}
        </RadioGroup>
      </FieldSet>
      <ScalePreview map={map} />
    </div>
  )
}
