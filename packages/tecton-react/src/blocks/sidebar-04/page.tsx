"use client"

import * as React from "react"
import { PanelRightOpenIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@tecton/react/components/breadcrumb"
import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"

import { NavRail } from "./components/nav-rail"
import { ToolPanel } from "./components/tool-panel"
import { defaultWell } from "./data"
import type { WellProperties } from "./data"

/**
 * Page layout with a navigation rail on the left (collapsed to icons by
 * default) and a tool panel on the right, around the work area.
 */
export default function Page() {
  const [panelOpen, setPanelOpen] = React.useState(true)
  const [well, setWell] = React.useState<WellProperties>(defaultWell)

  return (
    <SidebarProvider defaultOpen={false}>
      <NavRail />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 h-4 aria-[orientation=vertical]:self-center"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:inline-flex">
                <BreadcrumbLink href="#">Wells</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>{well.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {!panelOpen && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              aria-label="Open well properties"
              onPress={() => setPanelOpen(true)}
            >
              <PanelRightOpenIcon />
            </Button>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <div className="aspect-video rounded-lg bg-muted/50" />
            <div className="aspect-video rounded-lg bg-muted/50" />
          </div>
          <div className="min-h-96 flex-1 rounded-lg bg-muted/50" />
        </div>
      </SidebarInset>
      {panelOpen && (
        <ToolPanel value={well} onChange={setWell} onClose={() => setPanelOpen(false)} />
      )}
    </SidebarProvider>
  )
}

export { NavRail } from "./components/nav-rail"
export { ToolPanel } from "./components/tool-panel"
export { NavUser } from "./components/nav-user"
export { railMain, railSecondary, wellTypes, defaultWell, currentUser } from "./data"
export type { RailItem, WellProperties, WellType } from "./data"
