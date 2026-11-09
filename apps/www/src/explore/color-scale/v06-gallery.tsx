import * as React from "react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"
import { Switch } from "@tecton/react/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { getErtSection } from "./model"
import { presetColorFn, SectionPreview, type ColorFn } from "./parts"

type Vision = "normal" | "deutan" | "grey"

// Diverging maps belong to difference sections (variation 09), not resistivity.
const galleryGroups = colormapGroups.filter((g) => g.id !== "diverging")

/** Approximate deuteranopia (Machado et al. 2009, severity 1) on sRGB values. */
function simulate(fn: ColorFn, vision: Vision): ColorFn {
  if (vision === "normal") return fn
  return (v) => {
    const [r, g, b, a] = fn(v)
    if (vision === "grey") {
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
      return [y, y, y, a]
    }
    return [
      0.367 * r + 0.861 * g - 0.228 * b,
      0.28 * r + 0.673 * g + 0.047 * b,
      -0.012 * r + 0.043 * g + 0.969 * b,
      a,
    ]
  }
}

/** 06 — Choose by looking at your own data: every preset rendered on the model, with a colour-vision check. */
export default function ColorScaleGallery() {
  const section = getErtSection()
  const [map, setMap] = React.useState("viridis")
  const [reversed, setReversed] = React.useState(false)
  const [vision, setVision] = React.useState<Vision>("normal")
  const [tab, setTab] = React.useState(getColormap(map).group as string)

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="Colormap family">
            {galleryGroups.map((g) => (
              <TabsTrigger key={g.id} value={g.id}>
                {g.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap items-center gap-4">
            <ToggleGroup
              aria-label="Preview as"
              variant="outline"
              size="sm"
              spacing={0}
              value={[vision]}
              onValueChange={([next]) => next && setVision(next as Vision)}
            >
              <ToggleGroupItem value="normal">Full colour</ToggleGroupItem>
              <ToggleGroupItem value="deutan">Deuteranopia</ToggleGroupItem>
              <ToggleGroupItem value="grey">Greyscale</ToggleGroupItem>
            </ToggleGroup>
            <Field orientation="horizontal" className="w-auto">
              <Switch
                id="v6-reverse"
                checked={reversed}
                onCheckedChange={setReversed}
              />
              <FieldLabel htmlFor="v6-reverse">Reverse</FieldLabel>
            </Field>
          </div>
        </div>
        {galleryGroups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="pt-2">
            <RadioGroup
              aria-label={`${group.name} colormaps`}
              value={getColormap(map).group === group.id ? map : ""}
              onValueChange={(next) => setMap(next as string)}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {colormaps
                .filter((m) => m.group === group.id)
                .map((m) => (
                  <GalleryCard
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    note={m.note}
                    color={simulate(
                      presetColorFn(m.id, {
                        reversed,
                        min: 2,
                        max: 2000,
                        scale: "log",
                      }),
                      vision
                    )}
                  />
                ))}
            </RadioGroup>
          </TabsContent>
        ))}
      </Tabs>
      <p className="text-sm text-muted-foreground">
        Selected:{" "}
        <span className="font-medium text-foreground">
          {getColormap(map).name}
        </span>
        {reversed ? " (reversed)" : ""} · 2 – 2k Ω·m, log
      </p>
    </div>
  )
}

const GalleryCard = React.memo(function GalleryCard({
  id,
  name,
  note,
  color,
}: {
  id: string
  name: string
  note: string
  color: ColorFn
}) {
  const section = getErtSection()
  return (
    <FieldLabel htmlFor={`v6-${id}`}>
      <Field orientation="horizontal" className="items-start">
        <FieldContent className="gap-2">
          <SectionPreview
            section={section}
            color={color}
            axes={false}
            label={`Section in ${name}`}
          />
          <FieldTitle>{name}</FieldTitle>
          <FieldDescription>{note}</FieldDescription>
        </FieldContent>
        <RadioGroupItem value={id} id={`v6-${id}`} />
      </Field>
    </FieldLabel>
  )
})
