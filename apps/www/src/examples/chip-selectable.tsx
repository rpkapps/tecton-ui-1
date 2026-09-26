"use client"

import * as React from "react"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const facies = ["Sandstone", "Shale", "Limestone", "Coal"]

export default function ChipSelectable() {
  const [selected, setSelected] = React.useState(["Sandstone"])

  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup
        aria-label="Facies"
        selectionMode="multiple"
        value={selected}
        onValueChange={setSelected}
      >
        <ChipList>
          {facies.map((name) => (
            <Chip
              key={name}
              value={name}
              variant="default"
              appearance="outline"
            >
              {name}
            </Chip>
          ))}
          <Chip value="disabled" disabled>
            Disabled
          </Chip>
        </ChipList>
      </ChipGroup>
      <p className="text-xs text-muted-foreground">
        Selected: {selected.join(", ") || "none"}
      </p>
    </div>
  )
}
