"use client"

import * as React from "react"
import { ListIcon, WaypointsIcon } from "lucide-react"

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@tecton/react/components/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tecton/react/components/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"
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

type View = "list" | "graph"

/**
 * Detail page with section tabs: a project details sidebar on the left,
 * a page header carrying the section tabs and a list / graph view toggle,
 * and a scrolling body with a panel per section: concept sections on the
 * overview, a placeholder on the others.
 */
export default function Page() {
  const [section, setSection] = React.useState("overview")
  const [view, setView] = React.useState<View>("list")
  const [selected, setSelected] = React.useState<string | null>("1.01")

  return (
    <SidebarProvider>
      <ProjectSidebar
        selectedAlternative={selected}
        onSelectAlternative={setSelected}
      />
      <SidebarInset className="min-w-0">
        {/* Tabs wraps the header, which holds the tab list, and the body, which holds a panel per section. */}
        <Tabs
          value={section}
          onValueChange={(value) => setSection(String(value))}
          className="mx-auto w-full max-w-7xl gap-6 px-4 py-4 md:px-6"
        >
          <PageHeader className="items-center">
            <PageHeaderContent className="flex-none flex-row items-center gap-2">
              <SidebarTrigger className="-ms-1 md:hidden" />
              <PageHeaderTitle className="text-xl">
                {project.name}
              </PageHeaderTitle>
            </PageHeaderContent>
            <PageHeaderActions>
              {/* The tabs are one item: they collapse together into a section list in the More menu. */}
              <OverflowItem
                value="sections"
                priority={2}
                overflow={
                  <DropdownMenuRadioGroup
                    value={section}
                    onValueChange={(value) => setSection(String(value))}
                  >
                    <DropdownMenuLabel>Section</DropdownMenuLabel>
                    {sectionTabs.map((tab) => (
                      <DropdownMenuRadioItem
                        key={tab.id}
                        value={tab.id}
                        closeOnClick
                      >
                        {tab.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                }
              >
                <PageHeaderNav aria-label="Project sections">
                  <TabsList aria-label="Sections" className="h-9 p-1">
                    {sectionTabs.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </PageHeaderNav>
              </OverflowItem>
              <OverflowSpacer />
              <OverflowItem
                value="view"
                priority={1}
                overflow={
                  <DropdownMenuRadioGroup
                    value={view}
                    onValueChange={(value) => setView(value as View)}
                  >
                    <DropdownMenuLabel>View</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="list" closeOnClick>
                      <ListIcon />
                      List
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="graph" closeOnClick>
                      <WaypointsIcon />
                      Graph
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                }
              >
                <ToggleGroup
                  aria-label="View"
                  value={[view]}
                  onValueChange={(value) => {
                    // Pressing the pressed item keeps it: one view is always on.
                    const [next] = value
                    if (next) setView(next as View)
                  }}
                  variant="outline"
                  size="sm"
                  spacing={0}
                >
                  <ToggleGroupItem value="list" aria-label="List view">
                    <ListIcon /> List
                  </ToggleGroupItem>
                  <ToggleGroupItem value="graph" aria-label="Graph view">
                    <WaypointsIcon /> Graph
                  </ToggleGroupItem>
                </ToggleGroup>
              </OverflowItem>
            </PageHeaderActions>
          </PageHeader>

          <TabsContent value="overview">
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
          </TabsContent>
          {sectionTabs
            .filter((tab) => tab.id !== "overview")
            .map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  {tab.label} for {project.name} goes here.
                </div>
              </TabsContent>
            ))}
        </Tabs>
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
