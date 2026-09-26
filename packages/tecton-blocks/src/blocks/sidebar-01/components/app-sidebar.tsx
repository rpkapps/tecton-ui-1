"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@tecton/react/components/sidebar"
import { useDirection } from "@tecton/react/tecton/provider"

import { currentUser, navGroups, projects } from "../data"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { ProjectSwitcher } from "./project-switcher"

/**
 * Project navigation sidebar that collapses to an icon rail: project
 * switcher, grouped navigation with collapsible sections and the user menu.
 */
function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  // `side` is physical: the start edge is the right one in right-to-left.
  const side = useDirection() === "rtl" ? "right" : "left"
  return (
    <Sidebar collapsible="icon" side={side} {...props}>
      <SidebarHeader>
        <ProjectSwitcher projects={projects} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }
