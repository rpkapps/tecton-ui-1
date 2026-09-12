import * as React from "react"

import { Chip } from "@tecton/react/tecton/chip"

const facies = ["Sandstone", "Shale", "Limestone", "Coal"]

export default function ChipClickable() {
  const [selected, setSelected] = React.useState<string>("Sandstone")

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {facies.map((name) => (
          <Chip
            key={name}
            variant={selected === name ? "filled" : "outlined"}
            color="primary"
            onPress={() => setSelected(name)}
          >
            {name}
          </Chip>
        ))}
        <Chip color="primary" onPress={() => {}} isDisabled>
          Disabled
        </Chip>
      </div>
      <p className="text-xs text-muted-foreground">Selected: {selected}</p>
    </div>
  )
}
