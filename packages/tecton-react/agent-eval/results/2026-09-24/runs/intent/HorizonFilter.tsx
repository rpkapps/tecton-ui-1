import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

export function HorizonFilter({
  horizons,
  selected,
  onChange,
}: {
  horizons: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const selectedKeys = new Set(selected)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Horizons
        </span>
        <ChipGroup
          aria-label="Horizons"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            if (keys === "all") return
            onChange(Array.from(keys, (key) => String(key)))
          }}
        >
          <ChipList>
            {horizons.map((horizon) => (
              <Chip key={horizon} id={horizon}>
                {horizon}
              </Chip>
            ))}
          </ChipList>
        </ChipGroup>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Active filters
          </span>
          <ChipGroup
            aria-label="Active filters"
            onRemove={(keys) => {
              const removed = new Set(Array.from(keys, (key) => String(key)))
              onChange(selected.filter((horizon) => !removed.has(horizon)))
            }}
          >
            <ChipList>
              {selected.map((horizon) => (
                <Chip key={horizon} id={horizon} variant="secondary">
                  {horizon}
                </Chip>
              ))}
            </ChipList>
          </ChipGroup>
        </div>
      )}
    </div>
  )
}
