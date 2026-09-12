"use client"

import * as React from "react"
import { cn } from "cn"
import { PanelRightIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Chip } from "@tecton/react/tecton/chip"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

import { HorizonForm } from "./components/horizon-form"
import { HorizonReadout } from "./components/horizon-readout"
import {
  defaultHorizonSettings,
  getPair,
  volumes,
  type HorizonSettings,
} from "./data"

type HorizonsPanelProps = Omit<React.ComponentProps<typeof Panel>, "children"> & {
  initialSettings?: HorizonSettings
  onApply?: (value: HorizonSettings) => void
  onCollapse?: () => void
}

/**
 * "2 Horizons" tool panel — surface-pair picker, depth text fields,
 * opacity / smoothing sliders, colour tags and an Apply footer.
 */
function HorizonsPanel({
  className,
  initialSettings = defaultHorizonSettings,
  onApply,
  onCollapse,
  ...props
}: HorizonsPanelProps) {
  const [value, setValue] = React.useState<HorizonSettings>(initialSettings)
  const [applied, setApplied] = React.useState<HorizonSettings>(initialSettings)
  const dirty = JSON.stringify(value) !== JSON.stringify(applied)
  const pair = getPair(value.pairId)
  const volume = volumes.find((item) => item.id === value.volumeId)

  return (
    <Panel
      data-slot="horizons-panel"
      className={cn("h-full", className)}
      {...props}
    >
      <PanelHeader>
        <PanelTitle>2 Horizons</PanelTitle>
        <Chip size="xs" variant="outlined">
          {pair.label.split(" → ").length} surfaces
        </Chip>
        <PanelActions>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse panel"
            onPress={onCollapse}
          >
            <PanelRightIcon />
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        <HorizonForm value={value} onChange={setValue} />
        <HorizonReadout
          className="rounded-md bg-surface-alt/60 px-3 py-2"
          rows={[
            { label: "Volume", value: volume?.label ?? "—" },
            {
              label: "Top depth (TVDSS)",
              value: value.topDepth.toLocaleString(),
              unit: "m",
            },
            {
              label: "Bottom depth (TVDSS)",
              value: value.bottomDepth.toLocaleString(),
              unit: "m",
            },
            {
              label: "Thickness",
              value: Math.max(0, value.bottomDepth - value.topDepth).toLocaleString(),
              unit: "m",
            },
          ]}
        />
      </PanelContent>
      <PanelFooter className="justify-end">
        <Button
          variant="ghost"
          size="sm"
          isDisabled={!dirty}
          onPress={() => setValue(applied)}
        >
          Reset
        </Button>
        <Button
          size="sm"
          isDisabled={!dirty}
          onPress={() => {
            setApplied(value)
            onApply?.(value)
          }}
        >
          Apply
        </Button>
      </PanelFooter>
    </Panel>
  )
}

/** Route-ready page: the panel centred on the canvas. */
export default function HorizonsPanelPage() {
  return (
    <div
      data-slot="horizons-panel-page"
      className="flex min-h-svh w-full items-start justify-center bg-background px-4 py-8 text-foreground md:items-center"
    >
      <HorizonsPanel className="w-full max-w-sm" />
    </div>
  )
}

export { HorizonsPanel, HorizonForm, HorizonReadout }
export {
  surfaces,
  surfacePairs,
  volumes,
  defaultHorizonSettings,
} from "./data"
export type { HorizonsPanelProps }
export type { Surface, SurfacePair, HorizonSettings } from "./data"
