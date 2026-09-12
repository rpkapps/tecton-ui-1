import * as React from "react"
import { MoveIcon, PencilIcon, RulerIcon } from "lucide-react"

import { Fab } from "@tecton/react/tecton/fab"

const tools = [
  { id: "pan", label: "Pan", icon: MoveIcon },
  { id: "draw", label: "Draw horizon", icon: PencilIcon },
  { id: "measure", label: "Measure", icon: RulerIcon },
]

export default function FabActive() {
  const [active, setActive] = React.useState("draw")

  return (
    <div className="flex flex-wrap items-center gap-3">
      {tools.map(({ id, label, icon: Icon }) => (
        <Fab
          key={id}
          variant="secondary"
          size="sm"
          isActive={active === id}
          onPress={() => setActive(id)}
        >
          <Icon />
          {label}
        </Fab>
      ))}
      <Fab variant="secondary" size="sm" isDisabled>
        Disabled
      </Fab>
    </div>
  )
}
