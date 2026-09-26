// Synced from shadcn/ui (apps/v4/examples/base/tabs-line.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsLine() {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
