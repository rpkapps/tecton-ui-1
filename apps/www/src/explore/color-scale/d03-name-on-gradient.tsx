import { colormapCss, getColormap } from "./colormaps"
import { ColormapSelectShell } from "./select-shell"

function Filled({ id }: { id: string }) {
  return (
    <span
      className="flex h-6 w-full items-center rounded-sm border border-border-subtle px-1"
      style={{ backgroundImage: colormapCss(id) }}
    >
      <span className="rounded-sm bg-background/85 px-1.5 text-xs leading-5 font-medium text-foreground">
        {getColormap(id).name}
      </span>
    </span>
  )
}

/** 03 — The gradient fills the trigger and each option, with the name on a small label. */
export default function DropdownNameOnGradient() {
  return (
    <ColormapSelectShell
      id="d3-map"
      defaultValue="magma"
      dropBelow
      renderValue={(id) => <Filled id={id} />}
      renderItem={(m) => <Filled id={m.id} />}
    />
  )
}
