"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const initial = [
  { id: "balder", name: "Top Balder" },
  { id: "sele", name: "Top Sele" },
  { id: "bcu", name: "Base Cretaceous" },
  { id: "brent", name: "Top Brent" },
]

export default function ChipDemo() {
  const [horizons, setHorizons] = React.useState(initial)

  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup
        aria-label="Horizons"
        onRemove={(values) =>
          setHorizons((prev) =>
            prev.filter((horizon) => !values.includes(horizon.id))
          )
        }
      >
        <ChipList
          items={horizons}
          empty={
            <span className="text-xs text-muted-foreground">No horizons.</span>
          }
        >
          {(horizon) => (
            <Chip value={horizon.id} variant="info">
              {horizon.name}
            </Chip>
          )}
        </ChipList>
      </ChipGroup>
      {horizons.length < initial.length && (
        <Button variant="ghost" size="xs" onClick={() => setHorizons(initial)}>
          Reset
        </Button>
      )}
    </div>
  )
}
