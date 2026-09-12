import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

const variants = ["default", "secondary", "ghost", "outline"] as const

export default function ButtonFab() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {variants.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            className="h-10 rounded-full shadow-md"
          >
            <PlusIcon data-icon="inline-start" /> New well
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {variants.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            size="icon"
            className="rounded-full shadow-md"
            aria-label="New well"
          >
            <PlusIcon />
          </Button>
        ))}
      </div>
    </div>
  )
}
