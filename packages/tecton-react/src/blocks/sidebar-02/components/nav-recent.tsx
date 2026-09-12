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
            <SidebarMenuButton href={project.url}>
              <HexagonIcon />
              <span>{project.name}</span>
            </SidebarMenuButton>
            <DropdownMenuTrigger>
              <SidebarMenuAction showOnHover aria-label={`Actions for ${project.name}`}>
                <MoreHorizontalIcon />
              </SidebarMenuAction>
              <DropdownMenu
                className="w-48 rounded-lg"
                placement={isMobile ? "bottom end" : "right top"}
              >
                <DropdownMenuItem textValue="Open project">
                  <FolderIcon className="text-muted-foreground" />
                  <span>Open project</span>
                </DropdownMenuItem>
                <DropdownMenuItem textValue="Share">
                  <Share2Icon className="text-muted-foreground" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem textValue="Add to favourites">
                  <StarIcon className="text-muted-foreground" />
                  <span>Add to favourites</span>
                </DropdownMenuItem>
              </DropdownMenu>
            </DropdownMenuTrigger>
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
