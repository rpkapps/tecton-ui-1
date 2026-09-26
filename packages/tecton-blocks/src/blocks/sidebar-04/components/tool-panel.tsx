"use client"

import * as React from "react"
import { cn } from "cn"
import { PanelRightCloseIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Separator } from "@tecton/react/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@tecton/react/components/sidebar"
import { Slider } from "@tecton/react/components/slider"
import { Switch } from "@tecton/react/components/switch"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import { defaultWell, wellTypes } from "../data"
import type { WellProperties, WellType } from "../data"

type ToolPanelProps = Omit<
  React.ComponentProps<typeof Sidebar>,
  "side" | "collapsible" | "onChange"
> & {
  value?: WellProperties
  onChange?: (next: WellProperties) => void
  onApply?: (value: WellProperties) => void
  onClose?: () => void
}

/**
 * Right-hand tool panel with the properties of the selected well (name,
 * type, colour, kick-off depth, toggles) and an Apply / Reset footer. It
 * fills its container; the page places it in a resizable split panel.
 */
function ToolPanel({
  className,
  value: controlled,
  onChange,
  onApply,
  onClose,
  ...props
}: ToolPanelProps) {
  const id = React.useId()
  const [internal, setInternal] = React.useState<WellProperties>(defaultWell)
  const value = controlled ?? internal
  const update = (patch: Partial<WellProperties>) => {
    const next = { ...value, ...patch }
    setInternal(next)
    onChange?.(next)
  }

  return (
    <Sidebar
      side="right"
      collapsible="none"
      data-slot="tool-panel"
      className={cn("h-full w-full min-w-0", className)}
      {...props}
    >
      <SidebarHeader className="flex-row items-center gap-2 border-b border-border-subtle px-3 py-2">
        <div className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-sm font-medium">Well properties</span>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {value.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close panel"
          onClick={onClose}
        >
          <PanelRightCloseIcon className="rtl:rotate-180" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="gap-4 p-3">
        <Field>
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
            value={value.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-type`}>Type</FieldLabel>
          <Select
            items={wellTypes.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
            value={value.type}
            onValueChange={(type: WellType | null) => {
              if (type) update({ type })
            }}
          >
            <SelectTrigger id={`${id}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {wellTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Colour</FieldLabel>
          <ColorSwatch
            color={value.color}
            onChange={(color) => update({ color })}
            label="Trajectory colour"
            value={value.color}
            aria-label="Edit trajectory colour"
          />
        </Field>
        <Separator emphasis="subtle" />
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel id={`${id}-kick-off`}>Kick-off depth</FieldLabel>
            <span className="font-mono text-sm tabular-nums">
              {value.kickOffDepth}
              <span className="text-muted-foreground"> m</span>
            </span>
          </div>
          <Slider
            aria-labelledby={`${id}-kick-off`}
            value={[value.kickOffDepth]}
            min={500}
            max={4000}
            step={10}
            onValueChange={(next) => {
              const kickOffDepth = Array.isArray(next) ? next[0] : next
              if (kickOffDepth !== undefined) update({ kickOffDepth })
            }}
          />
          <FieldDescription>
            Measured depth where the well leaves vertical.
          </FieldDescription>
        </Field>
        <Separator emphasis="subtle" />
        <div className="flex items-center justify-between gap-3">
          <FieldLabel htmlFor={`${id}-fda`}>Include in FDA</FieldLabel>
          <Switch
            id={`${id}-fda`}
            checked={value.includeInFda}
            onCheckedChange={(includeInFda) => update({ includeInFda })}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <FieldLabel htmlFor={`${id}-trajectory`}>Show trajectory</FieldLabel>
          <Switch
            id={`${id}-trajectory`}
            checked={value.showTrajectory}
            onCheckedChange={(showTrajectory) => update({ showTrajectory })}
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="flex-row justify-end gap-2 border-t border-border-subtle p-3">
        <Button variant="ghost" size="sm" onClick={() => update(defaultWell)}>
          <RotateCcwIcon /> Reset
        </Button>
        <Button size="sm" onClick={() => onApply?.(value)}>
          Apply
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export { ToolPanel }
export type { ToolPanelProps }
