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
  return (
    <div className="flex flex-col gap-4">
      <ChipGroup
        aria-label="Horizons"
        selectionMode="multiple"
        selectedKeys={new Set(selected)}
        onSelectionChange={(keys) => {
          onChange(keys === "all" ? horizons : [...keys].map(String))
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

      {selected.length > 0 && (
        <ChipGroup
          aria-label="Active horizon filters"
          onRemove={(keys) => {
            const removed = new Set([...keys].map(String))
            onChange(selected.filter((horizon) => !removed.has(horizon)))
          }}
        >
          <ChipList>
            {selected.map((horizon) => (
              <Chip key={horizon} id={horizon} variant="info">
                {horizon}
              </Chip>
            ))}
          </ChipList>
        </ChipGroup>
      )}
    </div>
  )
}
