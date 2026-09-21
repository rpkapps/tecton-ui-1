"use client"

import * as React from "react"
import {
  LayersIcon,
  MapIcon,
  RulerIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { AppSidebar } from "./components/app-sidebar"
import { flattenTree, projectTree } from "./data"

/** Zoom levels the magnifier buttons step through. */
const zoomLevels = [0.5, 0.75, 1, 1.5, 2, 3]
const minZoom = zoomLevels[0] ?? 1
const maxZoom = zoomLevels[zoomLevels.length - 1] ?? 1

/** Spacing of the work-area grid at 1x, in pixels. */
const gridSpacing = 24

/**
 * Page layout for a map or model view: the project inventory tree in an
 * off-canvas sidebar, a view toolbar and the full-bleed work area.
 */
export default function Page() {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [view, setView] = React.useState<"map" | "section">("map")
  const [measuring, setMeasuring] = React.useState(false)
  const [zoom, setZoom] = React.useState(1)
  const selectedLabel = React.useMemo(
    () =>
      flattenTree(projectTree).find((node) => node.id === selected)?.label ??
      null,
    [selected]
  )

  const zoomIn = () =>
    setZoom((level) => zoomLevels.find((next) => next > level) ?? level)
  const zoomOut = () =>
    setZoom(
      (level) => [...zoomLevels].reverse().find((next) => next < level) ?? level
    )

  return (
    <SidebarProvider>
      <AppSidebar onSelect={setSelected} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 h-4 aria-[orientation=vertical]:self-center"
          />
          <ToggleGroup
            aria-label="View"
            selectionMode="single"
            selectedKeys={[view]}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (next) setView(next as "map" | "section")
            }}
            disallowEmptySelection
            size="sm"
          >
            <ToggleGroupItem id="map" aria-label="Map view">
              <MapIcon /> Map
            </ToggleGroupItem>
            <ToggleGroupItem id="section" aria-label="Section view">
              <LayersIcon /> Section
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Measure"
              aria-pressed={measuring}
              className="aria-pressed:bg-ghost-active aria-pressed:text-ghost-active-foreground"
              onPress={() => setMeasuring((value) => !value)}
            >
              <RulerIcon />
            </Button>
            <span className="w-11 text-center font-mono text-xs text-muted-foreground tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom in"
              isDisabled={zoom >= maxZoom}
              onPress={zoomIn}
            >
              <ZoomInIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom out"
              isDisabled={zoom <= minZoom}
              onPress={zoomOut}
            >
              <ZoomOutIcon />
            </Button>
          </div>
        </header>
        <div
          data-measuring={measuring || undefined}
          className="relative flex flex-1 flex-col bg-muted/40 data-measuring:cursor-crosshair"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] opacity-60"
            style={{
              backgroundSize: `${gridSpacing * zoom}px ${gridSpacing * zoom}px`,
            }}
          />
          <div className="relative m-auto flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
            {selectedLabel ? (
              <span>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {selectedLabel}
                </span>
                {" in "}
                {view === "map" ? "map" : "section"} view
              </span>
            ) : (
              <span>Select an item in the project tree</span>
            )}
            {measuring && <span className="text-xs">Measure tool active</span>}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { AppSidebar }
export { project, projectTree, filterTree, flattenTree } from "./data"
export type { ProjectNode } from "./data"
