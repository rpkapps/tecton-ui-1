"use client"

import * as React from "react"
import {
  HandIcon,
  LassoIcon,
  LayersIcon,
  MoreVerticalIcon,
  MousePointer2Icon,
  PencilIcon,
  RedoIcon,
  RulerIcon,
  ScanIcon,
  SquareDashedIcon,
  UndoIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Separator } from "@tecton/react/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
import {
  Canvas,
  CanvasLegend,
  CanvasLegendItem,
  CanvasOverlay,
  CanvasSurface,
  CanvasToolbar,
} from "@tecton/react/tecton/canvas"

import { FairwayMap } from "./components/fairway-map"
import { PresetList } from "./components/preset-list"
import { depthViews, geologyLayers, legend, mapViews, presets } from "./data"

/** Icon button used in the floating rails, with a tooltip as its name. */
function Tool({
  label,
  isActive,
  children,
  onPress,
}: {
  label: string
  isActive?: boolean
  children: React.ReactNode
  onPress?: () => void
}) {
  return (
    <TooltipTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        aria-pressed={isActive}
        className="aria-pressed:bg-ghost-active aria-pressed:text-ghost-active-foreground"
        onPress={onPress}
      >
        {children}
      </Button>
      <Tooltip placement="right">{label}</Tooltip>
    </TooltipTrigger>
  )
}

/** Compact select used in the floating view controls. */
function ViewSelect({
  label,
  options,
  defaultKey,
}: {
  label: string
  options: { id: string; label: string }[]
  defaultKey: string
}) {
  return (
    <Select
      aria-label={label}
      defaultSelectedKey={defaultKey}
      className="w-auto"
    >
      <SelectTrigger
        size="sm"
        className="min-w-28 border-border-subtle bg-card/90 shadow-md backdrop-blur-sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} id={option.id} textValue={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Canvas page: saved view presets in the sidebar and a full-bleed map
 * with its chrome floating over the surface — view selectors, a tool
 * rail on each side, the legend and the scale bar.
 */
export default function Page() {
  const [preset, setPreset] = React.useState(presets[0].id)
  const [tool, setTool] = React.useState("pan")
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <SidebarProvider>
      <PresetList selected={preset} onSelect={setPreset} />
      <SidebarInset className="min-w-0">
        <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 h-4 aria-[orientation=vertical]:self-center"
          />
          <span className="text-sm">
            {presets.find((item) => item.id === preset)?.name}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <UploadIcon data-icon="inline-start" /> Review and publish
            </Button>
            <Button variant="secondary" size="sm">
              Share
            </Button>
          </div>
        </header>
        <Canvas>
          <CanvasSurface>
            <FairwayMap selected={selected} onSelect={setSelected} />
          </CanvasSurface>

          <CanvasOverlay position="top-left">
            <ViewSelect
              label="Map type"
              options={mapViews}
              defaultKey="fairway"
            />
            <ViewSelect
              label="Domain"
              options={depthViews}
              defaultKey="depth"
            />
            <CanvasToolbar aria-label="Navigation tools">
              <Tool label="Zoom in">
                <ZoomInIcon />
              </Tool>
              <Tool label="Zoom out">
                <ZoomOutIcon />
              </Tool>
              <Tool
                label="Pan"
                isActive={tool === "pan"}
                onPress={() => setTool("pan")}
              >
                <HandIcon />
              </Tool>
              <Tool
                label="Lasso"
                isActive={tool === "lasso"}
                onPress={() => setTool("lasso")}
              >
                <LassoIcon />
              </Tool>
            </CanvasToolbar>
            <CanvasToolbar aria-label="Editing tools">
              <Tool label="Layers">
                <LayersIcon />
              </Tool>
              <Tool
                label="Measure"
                isActive={tool === "measure"}
                onPress={() => setTool("measure")}
              >
                <RulerIcon />
              </Tool>
              <Tool label="Section">
                <ScanIcon />
              </Tool>
              <Separator className="mx-1 w-auto" />
              <Tool label="Undo">
                <UndoIcon />
              </Tool>
              <Tool label="Redo">
                <RedoIcon />
              </Tool>
            </CanvasToolbar>
          </CanvasOverlay>

          <CanvasOverlay position="top-right">
            <ViewSelect
              label="Background"
              options={geologyLayers}
              defaultKey="regional"
            />
            <CanvasToolbar aria-label="Selection tools">
              <Tool
                label="Select"
                isActive={tool === "select"}
                onPress={() => setTool("select")}
              >
                <MousePointer2Icon />
              </Tool>
              <Tool label="Marquee">
                <SquareDashedIcon />
              </Tool>
              <Separator className="mx-1 w-auto" />
              <Tool label="Edit polygon">
                <PencilIcon />
              </Tool>
              <Tool label="Export">
                <UploadIcon />
              </Tool>
            </CanvasToolbar>
            <CanvasToolbar aria-label="More">
              <Tool label="More">
                <MoreVerticalIcon />
              </Tool>
            </CanvasToolbar>
          </CanvasOverlay>

          <CanvasOverlay position="bottom-left">
            <CanvasLegend aria-label="Legend">
              {legend.map((entry) => (
                <CanvasLegendItem
                  key={entry.id}
                  swatch={
                    entry.hatched ? (
                      <span
                        aria-hidden
                        className="size-full bg-[repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_3px)] opacity-70"
                      />
                    ) : (
                      entry.color
                    )
                  }
                >
                  {entry.label}
                </CanvasLegendItem>
              ))}
            </CanvasLegend>
          </CanvasOverlay>

          <CanvasOverlay position="bottom-right">
            <div
              data-slot="scale-bar"
              className="grid gap-0.5 rounded-md border border-border-subtle bg-card/90 px-2 py-1 font-mono text-[10px] text-card-foreground shadow-md backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-20 border-x border-b border-foreground" />
                750 m
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-24 border-x border-t border-foreground" />
                2,500 ft
              </span>
            </div>
          </CanvasOverlay>
        </Canvas>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { PresetList, PresetSketch } from "./components/preset-list"
export { FairwayMap } from "./components/fairway-map"
export {
  presets,
  mapViews,
  depthViews,
  geologyLayers,
  legend,
  features,
  surveys,
} from "./data"
export type { ViewPreset, PresetStatus, MapFeature, LegendEntry } from "./data"
