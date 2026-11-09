import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, getColormap } from "./colormaps"
import {
  ColorbarTicks,
  ColormapBar,
  SectionPreview,
  useMorphingScale,
} from "./parts"

/**
 * 12 — Try before you pick: pointing at (or arrowing to) a scale morphs the
 * section into it; moving away returns to the chosen one; a click commits.
 */
export default function PickerLivePreview() {
  const [chosen, setChosen] = React.useState("res2d")
  const [preview, setPreview] = React.useState<string | null>(null)
  const shown = preview ?? chosen
  const { color, css } = useMorphingScale(shown)

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
      <ToggleGroup
        aria-label="Colour scale"
        orientation="vertical"
        className="w-full"
        value={[chosen]}
        onValueChange={([next]) => next && setChosen(next)}
        onPointerLeave={() => setPreview(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setPreview(null)
        }}
      >
        {colormaps.map((m) => (
          <ToggleGroupItem
            key={m.id}
            value={m.id}
            className="justify-start"
            onPointerEnter={() => setPreview(m.id)}
            onFocus={() => setPreview(m.id)}
          >
            <ColormapBar id={m.id} className="h-3 w-14" />
            {m.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex h-6 items-center gap-2 text-sm">
          {preview && preview !== chosen ? (
            <>
              <Badge variant="outline">Preview</Badge>
              <span>
                {getColormap(preview).name}
                <span className="text-muted-foreground">
                  {" "}
                  · click to use, move away to return to{" "}
                  {getColormap(chosen).name}
                </span>
              </span>
            </>
          ) : (
            <>
              <Badge variant="secondary">In use</Badge>
              <span>{getColormap(chosen).name}</span>
            </>
          )}
        </div>
        <SectionPreview
          color={color}
          label={`Section in ${getColormap(shown).name}`}
        />
        <div dir="ltr" className="flex flex-col gap-1">
          <span
            aria-hidden
            className="block h-3 w-full rounded-sm border border-border-subtle"
            style={{ backgroundImage: css }}
          />
          <ColorbarTicks />
          <span className="text-center text-xs text-muted-foreground">
            Resistivity (Ω·m)
          </span>
        </div>
      </div>
    </div>
  )
}
