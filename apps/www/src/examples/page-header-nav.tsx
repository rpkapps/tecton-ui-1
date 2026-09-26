"use client"

import * as React from "react"
import { ListIcon, WaypointsIcon } from "lucide-react"

import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@tecton/react/components/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { OverflowItem, OverflowSpacer } from "@tecton/react/tecton/overflow"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderNav,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "framing", label: "Framing" },
  { id: "team", label: "Team" },
  { id: "builder", label: "Builder" },
]

export default function PageHeaderNavDemo() {
  const [section, setSection] = React.useState("overview")
  const [view, setView] = React.useState("list")

  return (
    <div className="w-full max-w-3xl min-w-72 resize-x overflow-hidden rounded-md border p-4">
      <PageHeader className="items-center">
        <PageHeaderContent className="flex-none">
          <PageHeaderTitle className="text-xl">Orion</PageHeaderTitle>
        </PageHeaderContent>
        {/* One overflow row: tabs at the start, toggle at the end. The toggle
            (priority 1) moves into the More menu first, the tabs (priority 2)
            second, all at once as a section list. */}
        <PageHeaderActions>
          <OverflowItem
            value="sections"
            priority={2}
            overflow={
              <DropdownMenuGroup>
                <DropdownMenuLabel>Section</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={section}
                  onValueChange={setSection}
                >
                  {sections.map((item) => (
                    <DropdownMenuRadioItem key={item.id} value={item.id}>
                      {item.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            }
          >
            <PageHeaderNav aria-label="Project sections">
              <Tabs value={section} onValueChange={setSection}>
                <TabsList className="h-9 p-1">
                  {sections.map((item) => (
                    <TabsTrigger key={item.id} value={item.id}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </PageHeaderNav>
          </OverflowItem>
          <OverflowSpacer />
          <OverflowItem
            value="view"
            priority={1}
            overflow={
              <DropdownMenuGroup>
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                  <DropdownMenuRadioItem value="list">
                    <ListIcon />
                    List
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="graph">
                    <WaypointsIcon />
                    Graph
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            }
          >
            <ToggleGroup
              aria-label="View"
              value={[view]}
              onValueChange={(next) => {
                // A single-selection group that always keeps one view.
                if (next[0]) setView(next[0])
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
      <p className="mt-3 text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
