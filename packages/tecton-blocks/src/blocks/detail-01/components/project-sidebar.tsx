"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronRightIcon, PlusIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"

import { project as defaultProject } from "../data"
import type { Project } from "../data"

type ProjectSidebarProps = React.ComponentProps<typeof Sidebar> & {
  project?: Project
  selectedAlternative?: string | null
  onSelectAlternative?: (id: string) => void
}

/** Decision-gate track: passed gates filled, the current one outlined, upcoming ones muted. */
function GateTrack({
  gates,
  className,
}: {
  gates: Project["gates"]
  className?: string
}) {
  return (
    <div
      data-slot="gate-track"
      className={cn("flex flex-col gap-1.5", className)}
    >
      <div className="flex items-center px-1" aria-hidden>
        {gates.map((gate, index) => (
          <React.Fragment key={gate.id}>
            <span
              className={cn(
                "size-2.5 shrink-0 rotate-45 border",
                gate.state === "passed" && "border-primary bg-primary",
                gate.state === "current" && "border-primary bg-background",
                gate.state === "upcoming" &&
                  "border-border-strong bg-background"
              )}
            />
            {index < gates.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  gate.state === "passed" ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <ol
        className="flex justify-between text-[10px] text-muted-foreground"
        aria-label="Decision gates"
      >
        {gates.map((gate) => (
          <li
            key={gate.id}
            aria-current={gate.state === "current" ? "step" : undefined}
            className={cn(
              "w-6 text-center first:text-start last:text-end",
              gate.state === "current" && "text-foreground"
            )}
          >
            {gate.id}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Left panel of the project detail page: status, asset, decision-gate
 * track and the list of concepts with their field development
 * alternatives.
 */
function ProjectSidebar({
  className,
  project = defaultProject,
  selectedAlternative,
  onSelectAlternative,
  ...props
}: ProjectSidebarProps) {
  return (
    <Sidebar
      data-slot="project-sidebar"
      collapsible="offcanvas"
      className={cn("border-e border-border-subtle", className)}
      {...props}
    >
      <SidebarHeader className="flex-row items-center justify-between px-3 py-2">
        <span className="text-sm font-medium">Project details</span>
        <SidebarTrigger className="-me-1" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-2 text-xs">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-end">
              <Badge variant="outline" size="default">
                {project.status}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">Asset</dt>
            <dd className="text-end font-mono">{project.asset}</dd>
            <dt className="text-muted-foreground">Concepts</dt>
            <dd className="text-end font-mono">{project.concepts.length}</dd>
          </dl>
          <GateTrack gates={project.gates} className="mt-4 px-2" />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Field development alternatives</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add concept">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarMenu>
            {project.concepts.map((concept) => (
              <Collapsible
                key={concept.id}
                defaultOpen={concept.index === 1}
                className="group/collapsible"
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={concept.name} />}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-muted font-mono text-[10px] text-muted-foreground">
                    {concept.index}
                  </span>
                  <span className="truncate">{concept.name}</span>
                  <span className="ms-auto font-mono text-[10px] text-muted-foreground">
                    {concept.alternatives.length} FDAs
                  </span>
                  <ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {concept.alternatives.map((alternative) => (
                      <SidebarMenuSubItem key={alternative.id}>
                        <SidebarMenuSubButton
                          render={<button type="button" />}
                          isActive={selectedAlternative === alternative.id}
                          onClick={() => onSelectAlternative?.(alternative.id)}
                        >
                          <span className="truncate">{alternative.name}</span>
                          <span className="ms-auto font-mono text-[10px] text-muted-foreground">
                            {alternative.id}
                          </span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export { ProjectSidebar, GateTrack }
export type { ProjectSidebarProps }
