// Synced from shadcn/ui (apps/v4/examples/aria/tabs-line.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsLine() {
  return (
    <Tabs defaultSelectedKey="overview">
      <TabsList variant="line">
        <TabsTrigger id="overview">Overview</TabsTrigger>
        <TabsTrigger id="analytics">Analytics</TabsTrigger>
        <TabsTrigger id="reports">Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
