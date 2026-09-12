import { PlusIcon } from "lucide-react"

import { Fab } from "@tecton/react/tecton/fab"

export default function FabVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Fab variant="primary">
        <PlusIcon />
        Primary
      </Fab>
      <Fab variant="secondary">
        <PlusIcon />
        Secondary
      </Fab>
      <Fab variant="tertiary">
        <PlusIcon />
        Tertiary
      </Fab>
      <Fab variant="outlined">
        <PlusIcon />
        Outlined
      </Fab>
    </div>
  )
}
