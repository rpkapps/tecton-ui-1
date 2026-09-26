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
import { Sheet, SheetContent, SheetTitle } from "@tecton/react/components/sheet"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"
import {
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
  useMinWidth,
} from "@tecton/react/tecton/app-shell"
import { Link } from "@tecton/react/tecton/link"
import { useDirection } from "@tecton/react/tecton/provider"

import { NavRail } from "./components/nav-rail"
import { ToolPanel } from "./components/tool-panel"
import { defaultWell } from "./data"
import type { WellProperties } from "./data"

/**
 * Page layout with a navigation rail on the left (collapsed to icons by
 * default) and a resizable tool panel on the right, around the work area.
 * Below 1024px the tool panel opens in a sheet instead.
 */
export default function Page() {
  const [panelOpen, setPanelOpen] = React.useState(true)
  // Narrow screens open the panel in a sheet, on request only.
  const [sheetOpen, setSheetOpen] = React.useState(false)
  // The panel sits on the end edge; `side` is physical.
  const sheetSide = useDirection() === "rtl" ? "left" : "right"
  const [well, setWell] = React.useState<WellProperties>(defaultWell)
  // The tool panel is a resizable split on `lg` and up only.
  const isWide = useMinWidth(1024)
  const showPanel = panelOpen && isWide

  const inset = (
    <SidebarInset className="min-h-0">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="me-1 h-4 aria-[orientation=vertical]:self-center"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink render={<Link href="#" />}>Wells</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>{well.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {!showPanel && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ms-auto"
            aria-label="Open well properties"
            onClick={() => (isWide ? setPanelOpen(true) : setSheetOpen(true))}
          >
            <PanelRightOpenIcon className="rtl:rotate-180" />
          </Button>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <div className="aspect-video rounded-lg bg-muted/50" />
          <div className="aspect-video rounded-lg bg-muted/50" />
        </div>
        <div className="min-h-96 flex-1 rounded-lg bg-muted/50" />
      </div>
    </SidebarInset>
  )

  return (
    <SidebarProvider
      defaultOpen={false}
      className="h-svh min-h-0 overflow-hidden"
    >
      <NavRail />
      {showPanel ? (
        <AppShellSplit>
          <AppShellSplitPanel minSize="40%">{inset}</AppShellSplitPanel>
          <AppShellSplitHandle />
          <AppShellSplitPanel defaultSize="320px" minSize="260px" maxSize="50%">
            <ToolPanel
              value={well}
              onChange={setWell}
              onClose={() => setPanelOpen(false)}
            />
          </AppShellSplitPanel>
        </AppShellSplit>
      ) : (
        inset
      )}
      <Sheet open={sheetOpen && !isWide} onOpenChange={setSheetOpen}>
        <SheetContent
          side={sheetSide}
          showCloseButton={false}
          className="gap-0"
        >
          <SheetTitle className="sr-only">Well properties</SheetTitle>
          <ToolPanel
            value={well}
            onChange={setWell}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  )
}

export { NavRail } from "./components/nav-rail"
export { ToolPanel } from "./components/tool-panel"
export { NavUser } from "./components/nav-user"
export {
  railMain,
  railSecondary,
  wellTypes,
  defaultWell,
  currentUser,
} from "./data"
export type { RailItem, WellProperties, WellType } from "./data"
