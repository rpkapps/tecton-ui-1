import { getColormap } from "./colormaps"
import { ColormapBar } from "./parts"
import { ColormapSelectShell } from "./select-shell"

/** 02 — The gradient is the value: it fills the trigger; options are a name over a strip. */
export default function DropdownGradientOnly() {
  return (
    <ColormapSelectShell
      id="d2-map"
      defaultValue="turbo"
      dropBelow
      renderValue={(id) => (
        <>
          <ColormapBar id={id} className="h-4 w-full" />
          <span className="sr-only">{getColormap(id).name}</span>
        </>
      )}
      renderItem={(m) => (
        <span className="flex w-full flex-col gap-1">
          <span>{m.name}</span>
          <ColormapBar id={m.id} className="h-3 w-full" />
        </span>
      )}
    />
  )
}
