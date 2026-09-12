import * as React from "react"

import { ChipGroup, ChipList, ChipTag } from "@tecton/react/tecton/chip"

const initial = [
  { id: "34/10-A-12", name: "34/10-A-12" },
  { id: "34/10-B-3", name: "34/10-B-3" },
  { id: "34/10-C-7", name: "34/10-C-7" },
  { id: "34/10-D-1", name: "34/10-D-1" },
]

export default function ChipGroupExample() {
  const [wells, setWells] = React.useState(initial)

  return (
    <ChipGroup
      aria-label="Wells"
      selectionMode="multiple"
      defaultSelectedKeys={["34/10-A-12"]}
      onRemove={(keys) =>
        setWells((prev) => prev.filter((well) => !keys.has(well.id)))
      }
    >
      <ChipList items={wells} renderEmptyState={() => "No wells selected."}>
        {(well) => (
          <ChipTag id={well.id} textValue={well.name} variant="outlined">
            {well.name}
          </ChipTag>
        )}
      </ChipList>
    </ChipGroup>
  )
}
