"use client"

import * as React from "react"
import { LayersIcon, MapIcon, RulerIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

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

/**
 * Page layout for a map or model view: the project inventory tree in an
 * off-canvas sidebar, a view toolbar and the full-bleed work area.
 */
export default function Page() {
  const [selected, setSelected] = React.useState<string | null>(null)
  const selectedLabel = React.useMemo(
    () => flattenTree(projectTree).find((node) => node.id === selected)?.label ?? null,
    [selected]
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
            defaultSelectedKeys={["map"]}
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
            <Button variant="ghost" size="icon-sm" aria-label="Measure">
              <RulerIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
              <ZoomInIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
              <ZoomOutIcon />
            </Button>
          </div>
        </header>
        <div className="relative flex flex-1 flex-col bg-muted/40">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-60"
          />
          <div className="relative m-auto text-center text-sm text-muted-foreground">
            {selectedLabel ? (
              <>
                Showing <span className="font-medium text-foreground">{selectedLabel}</span>
              </>
            ) : (
              "Select an item in the project tree"
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { AppSidebar }
export { project, projectTree, filterTree, flattenTree } from "./data"
export type { ProjectNode } from "./data"
