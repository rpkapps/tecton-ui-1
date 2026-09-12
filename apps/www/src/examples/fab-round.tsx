import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Fab } from "@tecton/react/tecton/fab"

export default function FabRound() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Fab shape="round" aria-label="Add">
        <PlusIcon />
      </Fab>
      <Fab shape="round" variant="secondary" aria-label="Edit">
        <PencilIcon />
      </Fab>
      <Fab shape="round" variant="outlined" aria-label="Delete">
        <Trash2Icon />
      </Fab>
    </div>
  )
}
