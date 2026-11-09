import { getColormap } from "./colormaps"
import { ColormapBar } from "./parts"
import { ColormapSelectShell } from "./select-shell"

/** 04 — The name leads; a thin gradient rule underneath carries the colour. */
export default function DropdownUnderline() {
  return (
    <ColormapSelectShell
      id="d4-map"
      defaultValue="viridis"
      renderValue={(id) => (
        <span className="flex w-full flex-col gap-0.5">
          <span className="leading-4">{getColormap(id).name}</span>
          <ColormapBar id={id} className="h-[3px] w-full border-0" />
        </span>
      )}
      renderItem={(m) => (
        <span className="flex w-full flex-col gap-1">
          <span>{m.name}</span>
          <ColormapBar id={m.id} className="h-[3px] w-full border-0" />
        </span>
      )}
    />
  )
}
