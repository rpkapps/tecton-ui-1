import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
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
import { ColormapBar, ScalePreview } from "./parts"

/**
 * 10 — A dialog for a deliberate choice: browse by family, preview the draft,
 * and nothing changes until Apply.
 */
export default function PickerDialog() {
  const [applied, setApplied] = React.useState({
    map: "earth",
    reversed: false,
  })
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(applied)
  const [tab, setTab] = React.useState<string>(getColormap(applied.map).group)

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Field>
        <FieldLabel htmlFor="p10-open">Colour scale</FieldLabel>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) {
              setDraft(applied)
              setTab(getColormap(applied.map).group)
            }
            setOpen(next)
          }}
        >
          <DialogTrigger
            render={
              <Button
                id="p10-open"
                variant="outline"
                className="w-full justify-start"
              />
            }
          >
            <ColormapBar
              id={applied.map}
              reversed={applied.reversed}
              className="h-3 w-12"
            />
            {getColormap(applied.map).name}
            {applied.reversed ? " (reversed)" : ""}
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a colour scale</DialogTitle>
              <DialogDescription>
                Applies to every section in Line 3. The preview uses the current
                model.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList aria-label="Colour scale family" variant="line">
                  {colormapGroups.map((g) => (
                    <TabsTrigger key={g.id} value={g.id}>
                      {g.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {colormapGroups.map((g) => (
                  <TabsContent key={g.id} value={g.id} className="pt-3">
                    <ToggleGroup
                      aria-label={`${g.name} colour scales`}
                      orientation="vertical"
                      className="w-full"
                      value={
                        getColormap(draft.map).group === g.id ? [draft.map] : []
                      }
                      onValueChange={([next]) =>
                        next && setDraft((d) => ({ ...d, map: next }))
                      }
                    >
                      {colormaps
                        .filter((m) => m.group === g.id)
                        .map((m) => (
                          <ToggleGroupItem
                            key={m.id}
                            value={m.id}
                            className="justify-start"
                          >
                            <ColormapBar
                              id={m.id}
                              reversed={draft.reversed}
                              className="h-3 w-16"
                            />
                            {m.name}
                          </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="flex flex-col gap-4">
                <ScalePreview map={draft.map} reversed={draft.reversed} />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="p10-reverse">Reverse</FieldLabel>
                  <Switch
                    id="p10-reverse"
                    checked={draft.reversed}
                    onCheckedChange={(reversed) =>
                      setDraft((d) => ({ ...d, reversed }))
                    }
                  />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={() => {
                  setApplied(draft)
                  setOpen(false)
                }}
              >
                Apply colour scale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <FieldDescription>{getColormap(applied.map).note}</FieldDescription>
      </Field>
      <ScalePreview map={applied.map} reversed={applied.reversed} />
    </div>
  )
}
