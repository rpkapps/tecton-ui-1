import { LocationOnIcon } from "@tecton/react/icons"

import { Badge } from "@tecton/react/components/badge"

export default function BadgeSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="lg">
        <LocationOnIcon data-icon="inline-start" />
        Large
      </Badge>
      <Badge size="md">
        <LocationOnIcon data-icon="inline-start" />
        Medium
      </Badge>
      <Badge>
        <LocationOnIcon data-icon="inline-start" />
        Default
      </Badge>
    </div>
  )
}
