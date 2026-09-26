"use client"

import * as React from "react"
import { ChevronsUpDownIcon, HexagonIcon, PlusIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@tecton/react/components/sidebar"

import type { Project } from "../data"

type ProjectSwitcherProps = {
  projects: Project[]
  defaultProjectId?: string
  onProjectChange?: (project: Project) => void
}

/** Sidebar header: the active project with a menu to switch or create one. */
function ProjectSwitcher({
  projects,
  defaultProjectId,
  onProjectChange,
}: ProjectSwitcherProps) {
  const { isMobile } = useSidebar()
  const [active, setActive] = React.useState<Project | undefined>(
    () => projects.find((p) => p.id === defaultProjectId) ?? projects[0]
  )

  if (!active) return null

  const select = (project: Project) => {
    setActive(project)
    onProjectChange?.(project)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenuTrigger>
          <SidebarMenuButton
            size="lg"
            aria-label={`Project: ${active.name}`}
            className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <HexagonIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{active.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {active.phase}
              </span>
            </div>
            <ChevronsUpDownIcon className="ms-auto" />
          </SidebarMenuButton>
          <DropdownMenu
            className="w-(--trigger-width) min-w-56 rounded-lg"
            placement={isMobile ? "bottom start" : "right top"}
            offset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Projects
              </DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  textValue={project.name}
                  onAction={() => select(project)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md border">
                    <HexagonIcon className="size-3.5" />
                  </div>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate">{project.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {project.asset}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem textValue="New project" className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusIcon className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  New project
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { ProjectSwitcher }
export type { ProjectSwitcherProps }
