import { MapPinIcon } from "lucide-react"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

export default function ChipSizes() {
  return (
    <ChipGroup aria-label="Locations" selectionMode="single">
      <ChipList className="items-center">
        <Chip value="lg" size="lg" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Large
        </Chip>
        <Chip value="md" size="md" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Medium
        </Chip>
        <Chip value="default" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Default
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}
