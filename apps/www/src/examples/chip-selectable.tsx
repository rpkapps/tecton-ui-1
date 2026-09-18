"use client"

import * as React from "react"
import type { Key } from "@tecton/react/primitives"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const facies = ["Sandstone", "Shale", "Limestone", "Coal"]

export default function ChipSelectable() {
  const [selected, setSelected] = React.useState<Set<Key>>(
    new Set(["Sandstone"])
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup
        aria-label="Facies"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === "all" ? new Set(facies) : new Set(keys))
        }
      >
        <ChipList>
          {facies.map((name) => (
            <Chip key={name} id={name} variant="default" appearance="outline">
              {name}
            </Chip>
          ))}
          <Chip id="disabled" isDisabled>
            Disabled
          </Chip>
        </ChipList>
      </ChipGroup>
      <p className="text-xs text-muted-foreground">
        Selected: {[...selected].join(", ") || "none"}
      </p>
    </div>
  )
}
