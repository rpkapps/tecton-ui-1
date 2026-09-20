"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@tecton/react/components/breadcrumb"
import { Separator } from "@tecton/react/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"

import { AppSidebar } from "./components/app-sidebar"
import { breadcrumbs } from "./data"

/**
 * Page layout: a project navigation sidebar that collapses to an icon rail,
 * a toolbar with the sidebar trigger and breadcrumbs, and the work area.
 */
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4 aria-[orientation=vertical]:self-center" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb) =>
                crumb.url ? (
                  <BreadcrumbItem key={crumb.title} className="hidden md:inline-flex">
                    <BreadcrumbLink href={crumb.url}>{crumb.title}</BreadcrumbLink>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem key={crumb.title}>
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                )
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-lg bg-muted/50" />
            <div className="aspect-video rounded-lg bg-muted/50" />
            <div className="aspect-video rounded-lg bg-muted/50" />
          </div>
          <div className="min-h-96 flex-1 rounded-lg bg-muted/50" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { AppSidebar }
export { NavMain } from "./components/nav-main"
export { NavUser } from "./components/nav-user"
export { ProjectSwitcher } from "./components/project-switcher"
export { projects, navGroups, currentUser } from "./data"
export type { Project, NavItem, NavGroup } from "./data"
