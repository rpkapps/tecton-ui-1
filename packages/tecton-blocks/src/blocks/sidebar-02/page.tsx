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
import { Link } from "@tecton/react/tecton/link"

import { AppSidebar } from "./components/app-sidebar"
import { breadcrumbs } from "./data"

/**
 * Page layout with an inset sidebar: the work area floats as a card next to
 * the navigation, with a toolbar carrying the trigger and breadcrumbs.
 */
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger className="-ms-1" />
          <Separator
            orientation="vertical"
            className="me-1 h-4 aria-[orientation=vertical]:self-center"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb) =>
                crumb.url ? (
                  <BreadcrumbItem
                    key={crumb.title}
                    className="hidden md:inline-flex"
                  >
                    <BreadcrumbLink render={<Link href={crumb.url} />}>
                      {crumb.title}
                    </BreadcrumbLink>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
export { NavRecent } from "./components/nav-recent"
export { NavSecondary } from "./components/nav-secondary"
export { NavUser } from "./components/nav-user"
export { navMain, navSecondary, recentProjects, currentUser } from "./data"
export type { NavLink, RecentProject } from "./data"
