import { MapPinIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"

export default function BadgeSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="lg">
        <MapPinIcon data-icon="inline-start" />
        Large
      </Badge>
      <Badge size="md">
        <MapPinIcon data-icon="inline-start" />
        Medium
      </Badge>
      <Badge>
        <MapPinIcon data-icon="inline-start" />
        Default
      </Badge>
    </div>
  )
}
