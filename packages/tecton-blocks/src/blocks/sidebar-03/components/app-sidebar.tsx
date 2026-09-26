"use client"

import * as React from "react"
import { HexagonIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@tecton/react/components/sidebar"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import {
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
} from "@tecton/react/tecton/tree-view"
import { Link } from "@tecton/react/tecton/link"
import { useDirection } from "@tecton/react/tecton/provider"

import { filterTree, flattenTree, project, projectTree } from "../data"
import type { ProjectNode } from "../data"

type AppSidebarProps = Omit<
  React.ComponentProps<typeof Sidebar>,
  "onSelect"
> & {
  nodes?: ProjectNode[]
  /** Called with the id of the selected tree node. */
  onSelect?: (id: string) => void
}

/**
 * Project inventory sidebar: the project in the header with a search field
 * that filters the tree, the inventory tree with colour tags and visibility
 * toggles, and an "Add data" footer.
 */
function AppSidebar({
  nodes = projectTree,
  onSelect,
  ...props
}: AppSidebarProps) {
  // `side` is physical: the start edge is the right one in right-to-left.
  const side = useDirection() === "rtl" ? "right" : "left"
  const [query, setQuery] = React.useState("")
  const [hidden, setHidden] = React.useState<Set<string>>(() => new Set())
  const [expanded, setExpanded] = React.useState<string[]>(() =>
    nodes.map((node) => node.id)
  )

  const visibleNodes = React.useMemo(
    () => filterTree(nodes, query),
    [nodes, query]
  )
  const folderIds = React.useMemo(
    () =>
      flattenTree(visibleNodes)
        .filter((node) => node.kind === "folder")
        .map((node) => node.id),
    [visibleNodes]
  )

  const setVisible = (id: string, visible: boolean) =>
    setHidden((current) => {
      const next = new Set(current)
      if (visible) next.delete(id)
      else next.add(id)
      return next
    })

  const renderNode = (node: ProjectNode): React.ReactElement => (
    <TreeViewItem value={node.id} hidden={hidden.has(node.id)}>
      <TreeViewItemContent
        kind={node.kind}
        colorTag={
          node.color ? (
            <ColorSwatch
              color={node.color}
              size="xs"
              shape="square"
              aria-label={`${node.label} colour`}
            />
          ) : undefined
        }
        suffix={
          node.meta ? (
            <Badge
              variant="secondary"
              appearance="outline"
              className="font-mono"
            >
              {node.meta}
            </Badge>
          ) : undefined
        }
        endAdornment={
          node.kind === "item" ? (
            <TreeViewVisibilityToggle
              className="opacity-0 group-focus-within/tree-item:opacity-100 group-hover/tree-item:opacity-100 group-data-selected/tree-item:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100"
              visible={!hidden.has(node.id)}
              onVisibleChange={(visible) => setVisible(node.id, visible)}
            />
          ) : undefined
        }
      >
        {node.label}
      </TreeViewItemContent>
      <TreeViewCollection items={node.children ?? []}>
        {renderNode}
      </TreeViewCollection>
    </TreeViewItem>
  )

  return (
    <Sidebar collapsible="offcanvas" side={side} {...props}>
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
                <span className="truncate font-medium">{project.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {project.asset}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <InputGroup className="h-8 bg-background">
          <InputGroupInput
            aria-label="Search project data"
            placeholder="Search wells, horizons…"
            className="h-8 text-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>Project data</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1">
            {visibleNodes.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyTitle>No matches</EmptyTitle>
                  <EmptyDescription>
                    Nothing in the project matches “{query}”.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <TreeView
                aria-label="Project inventory"
                items={visibleNodes}
                selectionMode="single"
                expanded={query ? folderIds : expanded}
                onExpandedChange={(values) => {
                  if (!query) setExpanded(values)
                }}
                onValueChange={([first]) => {
                  if (first !== undefined) onSelect?.(first)
                }}
              >
                {renderNode}
              </TreeView>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" size="sm" className="w-full">
          <PlusIcon /> Add data
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebar }
export type { AppSidebarProps }
