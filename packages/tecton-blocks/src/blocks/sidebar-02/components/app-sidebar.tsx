"use client"

import * as React from "react"
import { HexagonIcon, SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@tecton/react/components/sidebar"
import { Link } from "@tecton/react/tecton/link"

import { currentUser, navMain, navSecondary, recentProjects } from "../data"
import { NavMain } from "./nav-main"
import { NavRecent } from "./nav-recent"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

/**
 * Inset sidebar: workspace brand and search in the header, flat navigation,
 * recent projects with actions, secondary links pinned to the bottom and
 * the user menu in the footer.
 */
function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="#" className="hover:no-underline" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HexagonIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">Tecton</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Subsurface workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <InputGroup className="h-8 bg-background">
          <InputGroupInput
            aria-label="Search workspace"
            placeholder="Search…"
            className="h-8 text-sm"
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavRecent projects={recentProjects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebar }
