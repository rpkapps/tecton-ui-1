"use client"

import {
  FolderIcon,
  HexagonIcon,
  MoreHorizontalIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@tecton/react/components/sidebar"
import { Link } from "@tecton/react/tecton/link"

import type { RecentProject } from "../data"

/** Recent projects, each with a hover action menu. */
function NavRecent({ projects }: { projects: RecentProject[] }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton
              render={
                <Link href={project.url} className="hover:no-underline" />
              }
            >
              <HexagonIcon />
              <span>{project.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    aria-label={`Actions for ${project.name}`}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <FolderIcon className="text-muted-foreground" />
                  <span>Open project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2Icon className="text-muted-foreground" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <StarIcon className="text-muted-foreground" />
                  <span>Add to favourites</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontalIcon className="text-sidebar-foreground/70" />
            <span>All projects</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

export { NavRecent }
