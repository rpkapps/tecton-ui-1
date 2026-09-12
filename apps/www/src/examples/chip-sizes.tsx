import { MapPinIcon } from "lucide-react"

import { Chip } from "@tecton/react/tecton/chip"

export default function ChipSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="md" color="primary">
        <MapPinIcon />
        Medium
      </Chip>
      <Chip size="sm" color="primary">
        <MapPinIcon />
        Small
      </Chip>
      <Chip size="xs" color="primary">
        <MapPinIcon />
        Extra small
      </Chip>
    </div>
  )
}
