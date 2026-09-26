"use client"

import * as React from "react"
import { cn } from "cn"
import { DownloadIcon, PlusIcon, ShareIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Sheet, SheetContent, SheetTitle } from "@tecton/react/components/sheet"
import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellMain,
  AppShellSidebar,
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
  useMinWidth,
} from "@tecton/react/tecton/app-shell"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"
import { useDirection } from "@tecton/react/tecton/provider"

import { AiAgentPanel, useAgentConversation } from "../ai-agent-panel/page"
import { CostVsRiskPanel } from "../cost-vs-risk-panel/page"
import { FdaCard, fdaSummaries } from "../fda-card/page"
import { WellDesignCard, wellDesigns } from "../well-design-card/page"
import { ProjectTree } from "./components/project-tree"
import { TopNav } from "./components/top-nav"
import { project } from "./data"

type DashboardProps = React.ComponentProps<typeof AppShell> & {
  /** Start with the agent panel closed (it opens from "Open agent"). */
  hideAgent?: boolean
}

/**
 * Full application dashboard: top navigation, project tree sidebar,
 * work area with FDA and well design cards plus the cost vs risk panel,
 * and the AI agent docked in the right aside. Below 1280px the agent opens
 * in a sheet instead; the conversation lives here, so it survives the move.
 */
function Dashboard({ className, hideAgent = false, ...props }: DashboardProps) {
  const [section, setSection] = React.useState("overview")
  // The docked aside (wide screens) and the sheet (narrow screens) open
  // separately, so a narrow page does not load with a modal over it.
  const [agentOpen, setAgentOpen] = React.useState(!hideAgent)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  // The panel sits on the end edge; `side` is physical.
  const sheetSide = useDirection() === "rtl" ? "left" : "right"
  const [selectedFda, setSelectedFda] = React.useState<string[]>([])
  const [selectedWell, setSelectedWell] = React.useState<string[]>([])
  const conversation = useAgentConversation()
  // The agent aside is a resizable panel on wide screens only.
  const isWide = useMinWidth(1280)
  const docked = agentOpen && isWide

  const cards = fdaSummaries.slice(0, 2)
  const primaryWell = wellDesigns[0]

  return (
    <AppShell data-slot="dashboard" className={cn(className)} {...props}>
      <TopNav activeId={section} onNavigate={setSection} />
      <AppShellBody>
        <AppShellSidebar className="hidden lg:flex">
          <ProjectTree />
        </AppShellSidebar>

        <AppShellSplit>
          <AppShellSplitPanel minSize="40%">
            <AppShellMain className="flex flex-col gap-6 p-4 md:p-6">
              <PageHeader>
                <PageHeaderContent>
                  <PageHeaderEyebrow>{project.asset}</PageHeaderEyebrow>
                  <PageHeaderTitle className="flex items-center gap-2">
                    {project.name}
                    <Badge variant="info" appearance="outline">
                      Concept select
                    </Badge>
                  </PageHeaderTitle>
                  <PageHeaderDescription>
                    {project.description}
                  </PageHeaderDescription>
                </PageHeaderContent>
                <PageHeaderActions>
                  <Button variant="ghost" size="sm">
                    <ShareIcon /> Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon /> Export
                  </Button>
                  <Button size="sm">
                    <PlusIcon /> New alternative
                  </Button>
                  {!docked && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        isWide ? setAgentOpen(true) : setSheetOpen(true)
                      }
                    >
                      Open agent
                    </Button>
                  )}
                </PageHeaderActions>
              </PageHeader>

              <div
                data-slot="dashboard-grid"
                className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"
              >
                {cards.map((fda) => (
                  <FdaCard
                    key={fda.id}
                    fda={fda}
                    selected={selectedFda.includes(fda.id)}
                    onSelectedChange={(next) =>
                      setSelectedFda((current) =>
                        next
                          ? [...current, fda.id]
                          : current.filter((id) => id !== fda.id)
                      )
                    }
                  />
                ))}
                {primaryWell && (
                  <WellDesignCard
                    design={primaryWell}
                    selected={selectedWell.includes(primaryWell.id)}
                    onSelectedChange={(next) =>
                      setSelectedWell(next ? [primaryWell.id] : [])
                    }
                  />
                )}
                <CostVsRiskPanel className="h-auto md:col-span-2 2xl:col-span-1" />
              </div>
            </AppShellMain>
          </AppShellSplitPanel>

          {docked && (
            <>
              <AppShellSplitHandle />
              <AppShellSplitPanel
                defaultSize="384px"
                minSize="280px"
                maxSize="50%"
              >
                <AppShellAside className="h-full w-full border-s-0">
                  <AiAgentPanel
                    conversation={conversation}
                    onClose={() => setAgentOpen(false)}
                  />
                </AppShellAside>
              </AppShellSplitPanel>
            </>
          )}
        </AppShellSplit>
      </AppShellBody>

      <Sheet open={sheetOpen && !isWide} onOpenChange={setSheetOpen}>
        <SheetContent
          side={sheetSide}
          showCloseButton={false}
          className="gap-0"
        >
          <SheetTitle className="sr-only">AI Agent</SheetTitle>
          <AiAgentPanel
            conversation={conversation}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

/** Route-ready page. */
export default function DashboardPage() {
  return <Dashboard />
}

export { Dashboard, TopNav, ProjectTree }
export { projectTree, navLinks, currentUser, project } from "./data"
export type { DashboardProps }
export type { ProjectNode } from "./data"
