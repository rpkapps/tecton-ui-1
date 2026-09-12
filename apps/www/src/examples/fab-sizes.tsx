import { PlusIcon } from "lucide-react"

import { Fab } from "@tecton/react/tecton/fab"

export default function FabSizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Fab size="md">
        <PlusIcon />
        Medium
      </Fab>
      <Fab size="sm">
        <PlusIcon />
        Small
      </Fab>
      <Fab size="md" shape="round" aria-label="Add">
        <PlusIcon />
      </Fab>
      <Fab size="sm" shape="round" aria-label="Add">
        <PlusIcon />
      </Fab>
    </div>
  )
}
