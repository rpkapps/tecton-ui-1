import { LocationOnIcon } from "@tecton/react/icons"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

export default function ChipSizes() {
  return (
    <ChipGroup aria-label="Locations" selectionMode="single">
      <ChipList className="items-center">
        <Chip id="lg" size="lg" variant="default">
          <LocationOnIcon data-icon="inline-start" />
          Large
        </Chip>
        <Chip id="md" size="md" variant="default">
          <LocationOnIcon data-icon="inline-start" />
          Medium
        </Chip>
        <Chip id="default" variant="default">
          <LocationOnIcon data-icon="inline-start" />
          Default
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}
