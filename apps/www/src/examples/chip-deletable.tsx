import * as React from "react"

import { Chip, ChipRemove } from "@tecton/react/tecton/chip"
import { Button } from "@tecton/react/components/button"

const initial = ["Top Balder", "Top Sele", "Base Cretaceous", "Top Brent"]

export default function ChipDeletable() {
  const [horizons, setHorizons] = React.useState(initial)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {horizons.map((name) => (
          <Chip key={name} color="info">
            {name}
            <ChipRemove
              aria-label={`Remove ${name}`}
              onPress={() =>
                setHorizons((prev) => prev.filter((h) => h !== name))
              }
            />
          </Chip>
        ))}
      </div>
      {horizons.length < initial.length && (
        <Button variant="ghost" size="xs" onPress={() => setHorizons(initial)}>
          Reset
        </Button>
      )}
    </div>
  )
}
