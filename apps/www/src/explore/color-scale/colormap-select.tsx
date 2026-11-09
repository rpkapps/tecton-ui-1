import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

import {
  colormapCss,
  colormapGroups,
  colormaps,
  getColormap,
  type ColormapGroup,
} from "./colormaps"
import { GradientBar } from "./parts"

const items = Object.fromEntries(colormaps.map((map) => [map.id, map.name]))

/** A Select whose items and trigger show the gradient beside the name. */
export function ColormapSelect({
  id,
  value,
  onValueChange,
  reversed,
  size,
  variant,
  groups,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  reversed?: boolean
  size?: "sm" | "default"
  variant?: "outline" | "filled" | "text"
  groups?: ColormapGroup[]
  className?: string
  "aria-label"?: string
}) {
  const shown = colormapGroups.filter((g) => !groups || groups.includes(g.id))
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => next && onValueChange(next)}
    >
      <SelectTrigger
        id={id}
        size={size}
        variant={variant}
        aria-label={ariaLabel}
        className={className}
      >
        <SelectValue>
          {(current: string) => (
            <>
              <GradientBar
                background={colormapCss(current, { reversed })}
                className="h-3 w-10"
              />
              {getColormap(current).name}
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {shown.map((group, index) => (
          <SelectGroup key={group.id}>
            {index > 0 ? <SelectSeparator /> : null}
            <SelectLabel>{group.name}</SelectLabel>
            {colormaps
              .filter((map) => map.group === group.id)
              .map((map) => (
                <SelectItem key={map.id} value={map.id}>
                  <GradientBar
                    background={colormapCss(map.id, { reversed })}
                    className="h-3 w-16"
                  />
                  {map.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
