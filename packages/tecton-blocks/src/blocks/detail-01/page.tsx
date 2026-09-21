"use client"

import * as React from "react"
import { ListIcon, NodeIcon } from "@tecton/react/icons"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@tecton/react/components/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderNav,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"
import { OverflowItem, OverflowSpacer } from "@tecton/react/tecton/overflow"

import { ConceptSection } from "./components/concept-section"
import { ProjectSidebar } from "./components/project-sidebar"
import { project, sectionTabs } from "./data"

/**
 * Detail page with section tabs: a project details sidebar on the left,
 * a page header carrying the section tabs and a list / graph view toggle,
 * and a scrolling body of concept sections.
 */
export default function Page() {
  const [section, setSection] = React.useState("overview")
  const [view, setView] = React.useState<"list" | "graph">("list")
  const [selected, setSelected] = React.useState<string | null>("1.01")

  return (
    <SidebarProvider>
      <ProjectSidebar
        selectedAlternative={selected}
        onSelectAlternative={setSelected}
      />
      <SidebarInset className="min-w-0">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6">
          <PageHeader className="items-center">
            <PageHeaderContent className="flex-none flex-row items-center gap-2">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <PageHeaderTitle className="text-xl">
                {project.name}
              </PageHeaderTitle>
            </PageHeaderContent>
            <PageHeaderActions>
              {/* The tabs are one item: they collapse together into a section list in the More menu. */}
              <OverflowItem
                id="sections"
                priority={2}
                overflow={
                  <DropdownMenuGroup
                    selectionMode="single"
                    selectedKeys={[section]}
                    onSelectionChange={(keys) => {
                      const next = [...keys][0]
                      if (next) setSection(String(next))
                    }}
                  >
                    <DropdownMenuLabel>Section</DropdownMenuLabel>
                    {sectionTabs.map((tab) => (
                      <DropdownMenuItem key={tab.id} id={tab.id}>
                        {tab.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                }
              >
                <PageHeaderNav aria-label="Project sections">
                  <Tabs
                    selectedKey={section}
                    onSelectionChange={(key) => setSection(String(key))}
                  >
                    <TabsList className="h-9 p-1">
                      {sectionTabs.map((tab) => (
                        <TabsTrigger key={tab.id} id={tab.id}>
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </PageHeaderNav>
              </OverflowItem>
              <OverflowSpacer />
              <OverflowItem
                id="view"
                priority={1}
                overflow={
                  <DropdownMenuGroup
                    selectionMode="single"
                    selectedKeys={[view]}
                    onSelectionChange={(keys) => {
                      const next = [...keys][0]
                      if (next) setView(next as "list" | "graph")
                    }}
                  >
                    <DropdownMenuLabel>View</DropdownMenuLabel>
                    <DropdownMenuItem id="list">
                      <ListIcon />
                      List
                    </DropdownMenuItem>
                    <DropdownMenuItem id="graph">
                      <NodeIcon />
                      Graph
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                }
              >
                <ToggleGroup
                  aria-label="View"
                  selectionMode="single"
                  selectedKeys={[view]}
                  onSelectionChange={(keys) => {
                    const next = [...keys][0]
                    if (next) setView(next as "list" | "graph")
                  }}
                  disallowEmptySelection
                  variant="outline"
                  size="sm"
                  spacing={0}
                >
                  <ToggleGroupItem id="list" aria-label="List view">
                    <ListIcon /> List
                  </ToggleGroupItem>
                  <ToggleGroupItem id="graph" aria-label="Graph view">
                    <NodeIcon /> Graph
                  </ToggleGroupItem>
                </ToggleGroup>
              </OverflowItem>
            </PageHeaderActions>
          </PageHeader>

          {view === "list" ? (
            <div className="flex flex-col gap-10">
              {project.concepts.map((concept) => (
                <ConceptSection
                  key={concept.id}
                  concept={concept}
                  selectedAlternative={selected}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-96 flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Graph view renders the concept tree here.
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { ProjectSidebar, GateTrack } from "./components/project-sidebar"
export {
  ConceptSection,
  AlternativeRow,
  DecisionCard,
} from "./components/concept-section"
export { project, sectionTabs, decisionCounts } from "./data"
export type {
  Project,
  Concept,
  Alternative,
  Decision,
  DecisionStatus,
} from "./data"
