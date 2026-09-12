import { LayersIcon } from "lucide-react"

import { Chip } from "@tecton/react/tecton/chip"

export default function ChipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>Horizon</Chip>
      <Chip color="primary">
        <LayersIcon />
        Top Balder
      </Chip>
      <Chip color="success" variant="outlined">
        Validated
      </Chip>
    </div>
  )
}
