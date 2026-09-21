"use client"

import * as React from "react"
import { ListIcon, NodeIcon } from "@tecton/react/icons"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
                {sections.map((item) => (
                  <DropdownMenuItem key={item.id} id={item.id}>
                    {item.label}
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
                  {sections.map((item) => (
                    <TabsTrigger key={item.id} id={item.id}>
                      {item.label}
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
                  if (next) setView(String(next))
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
                if (next) setView(String(next))
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
      <p className="mt-3 text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
