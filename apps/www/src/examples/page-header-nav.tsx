import { ListIcon, WaypointsIcon } from "lucide-react"

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

export default function PageHeaderNavDemo() {
  return (
    <PageHeader className="w-full max-w-3xl md:items-center">
      <PageHeaderContent className="md:flex-none">
        <PageHeaderTitle className="text-xl">Orion Discovery</PageHeaderTitle>
      </PageHeaderContent>
      <PageHeaderNav aria-label="Project sections" className="md:flex-1">
        <Tabs defaultSelectedKey="overview">
          <TabsList className="h-9 p-1">
            <TabsTrigger id="overview">Overview</TabsTrigger>
            <TabsTrigger id="framing">Framing</TabsTrigger>
            <TabsTrigger id="team">Team</TabsTrigger>
            <TabsTrigger id="builder">Builder</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeaderNav>
      <PageHeaderActions>
        <ToggleGroup
          aria-label="View"
          selectionMode="single"
          defaultSelectedKeys={["list"]}
          disallowEmptySelection
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem id="list" aria-label="List view">
            <ListIcon /> List
          </ToggleGroupItem>
          <ToggleGroupItem id="graph" aria-label="Graph view">
            <WaypointsIcon /> Graph
          </ToggleGroupItem>
        </ToggleGroup>
      </PageHeaderActions>
    </PageHeader>
  )
}
