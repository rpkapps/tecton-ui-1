import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

import { colormapGroups, colormaps, getColormap } from "./colormaps"
import { ColormapBar } from "./parts"
import { ColormapButton } from "./trigger-button"

/** 08 — A cascading menu: recent scales on top, each family a submenu, Reverse at the foot. */
export default function DropdownCascading() {
  const [map, setMap] = React.useState("res2d")
  const [recent, setRecent] = React.useState(["res2d", "viridis", "jet"])
  const [reversed, setReversed] = React.useState(false)
  const choose = (id: string) => {
    setMap(id)
    setRecent((list) => [id, ...list.filter((r) => r !== id)].slice(0, 3))
  }
  return (
    <Field>
      <FieldLabel htmlFor="d8-map">Colour scale</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<ColormapButton id="d8-map" map={map} reversed={reversed} />}
        />
        <DropdownMenuContent
          align="start"
          className="w-(--anchor-width) min-w-56"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Recent</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={map} onValueChange={choose}>
              {recent.map((id) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  <ColormapBar
                    id={id}
                    reversed={reversed}
                    className="h-3 w-12"
                  />
                  {getColormap(id).name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {colormapGroups.map((g) => (
            <DropdownMenuSub key={g.id}>
              <DropdownMenuSubTrigger>{g.name}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuRadioGroup value={map} onValueChange={choose}>
                  {colormaps
                    .filter((m) => m.group === g.id)
                    .map((m) => (
                      <DropdownMenuRadioItem key={m.id} value={m.id}>
                        <ColormapBar
                          id={m.id}
                          reversed={reversed}
                          className="h-3 w-12"
                        />
                        {m.name}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={reversed}
            onCheckedChange={setReversed}
          >
            Reverse
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Field>
  )
}
