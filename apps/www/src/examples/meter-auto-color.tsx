import * as React from "react"

import { Meter } from "@tecton/react/tecton/meter"
import { Slider } from "@tecton/react/components/slider"

export default function MeterAutoColor() {
  const [risk, setRisk] = React.useState(25)

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Meter
        label="Geological risk"
        color="auto"
        value={risk}
        valueLabel={risk >= 67 ? "High" : risk >= 34 ? "Medium" : "Low"}
      />
      <Slider
        aria-label="Risk"
        value={risk}
        onChange={(v) => setRisk(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}
