import * as React from "react"

import { Label } from "@tecton/react/components/label"
import { Slider } from "@tecton/react/components/slider"
import { Meter } from "@tecton/react/tecton/meter"

export default function MeterAutoColor() {
  const [risk, setRisk] = React.useState(25)
  const labelId = React.useId()

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Meter
        label="Geological risk"
        color="auto"
        value={risk}
        valueLabel={risk >= 67 ? "High" : risk >= 34 ? "Medium" : "Low"}
      />
      <div className="flex flex-col gap-2">
        <Label id={labelId}>Adjust risk</Label>
        <Slider
          aria-labelledby={labelId}
          value={[risk]}
          onValueChange={(next) => {
            const [first] = Array.isArray(next) ? next : [next]
            if (first !== undefined) setRisk(first)
          }}
        />
      </div>
    </div>
  )
}
