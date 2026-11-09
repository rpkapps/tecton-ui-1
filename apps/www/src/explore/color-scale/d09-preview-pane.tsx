import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, getColormap } from "./colormaps"
import { profile } from "./perception"
import { ColormapBar, SectionPreview, useColorFn } from "./parts"
import { ColormapButton } from "./trigger-button"

/** 09 — The list with a preview pane: the highlighted scale is drawn on the section beside it. */
export default function DropdownPreviewPane() {
  const [open, setOpen] = React.useState(false)
  const [map, setMap] = React.useState("plasma")
  const [hover, setHover] = React.useState<string | null>(null)
  const shown = hover ?? map
  const color = useColorFn(shown)
  const info = getColormap(shown)
  const p = profile(shown)
  return (
    <Field>
      <FieldLabel htmlFor="d9-map">Colour scale</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setHover(null)
          setOpen(next)
        }}
      >
        <PopoverTrigger render={<ColormapButton id="d9-map" map={map} />} />
        <PopoverContent
          align="start"
          className="w-[min(34rem,calc(100vw-2rem))]"
        >
          <div className="grid grid-cols-[11rem_1fr] gap-4">
            <ToggleGroup
              aria-label="Colour scale"
              orientation="vertical"
              className="max-h-72 w-full overflow-y-auto"
              value={[map]}
              onValueChange={([next]) => {
                if (!next) return
                setMap(next)
                setOpen(false)
              }}
            >
              {colormaps.map((m) => (
                <ToggleGroupItem
                  key={m.id}
                  value={m.id}
                  size="sm"
                  className="justify-start"
                  onPointerEnter={() => setHover(m.id)}
                  onFocus={() => setHover(m.id)}
                >
                  <ColormapBar id={m.id} className="h-2.5 w-8" />
                  {m.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex min-w-0 flex-col gap-2">
              <SectionPreview
                color={color}
                axes={false}
                label={`Section in ${info.name}`}
              />
              <ColormapBar id={shown} className="h-2.5 w-full" />
              <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                {info.name}
                {info.cvdSafe ? (
                  <Badge variant="secondary">CVD safe</Badge>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">{info.note}</span>
              <span className="text-xs text-muted-foreground">
                {p.monotonic
                  ? "Lightness ramps one way"
                  : "Lightness turns back"}{" "}
                · evenness {Math.round(p.uniformity * 100)} %
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
