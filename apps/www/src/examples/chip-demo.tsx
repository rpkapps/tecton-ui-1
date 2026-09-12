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
        onRemove={(keys) =>
          setHorizons((prev) => prev.filter((horizon) => !keys.has(horizon.id)))
        }
      >
        <ChipList
          items={horizons}
          renderEmptyState={() => (
            <span className="text-xs text-muted-foreground">No horizons.</span>
          )}
        >
          {(horizon) => (
            <Chip id={horizon.id} textValue={horizon.name} variant="info">
              {horizon.name}
            </Chip>
          )}
        </ChipList>
      </ChipGroup>
      {horizons.length < initial.length && (
        <Button variant="ghost" size="xs" onPress={() => setHorizons(initial)}>
          Reset
        </Button>
      )}
    </div>
  )
}
