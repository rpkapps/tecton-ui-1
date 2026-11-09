import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

import { getColormap } from "./colormaps"
import { ColormapBar } from "./parts"

/** The closed state shared by the popover and menu dropdowns: chip, name, chevron. */
export function ColormapButton({
  map,
  reversed,
  ...props
}: React.ComponentProps<typeof Button> & { map: string; reversed?: boolean }) {
  return (
    <Button variant="outline" className="w-full justify-start" {...props}>
      <ColormapBar id={map} reversed={reversed} className="h-3 w-10" />
      <span className="flex-1 text-start">
        {getColormap(map).name}
        {reversed ? " (reversed)" : ""}
      </span>
      <ChevronDownIcon data-icon="inline-end" />
    </Button>
  )
}
