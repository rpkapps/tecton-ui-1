import { MapPinIcon } from "lucide-react"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

export default function ChipSizes() {
  return (
    <ChipGroup aria-label="Locations" selectionMode="single">
      <ChipList className="items-center">
        <Chip id="lg" size="lg" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Large
        </Chip>
        <Chip id="md" size="md" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Medium
        </Chip>
        <Chip id="default" variant="default">
          <MapPinIcon data-icon="inline-start" />
          Default
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}
