// Synced from shadcn/ui (apps/v4/examples/aria/tabs-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsDisabled() {
  return (
    <Tabs defaultSelectedKey="home">
      <TabsList>
        <TabsTrigger id="home">Home</TabsTrigger>
        <TabsTrigger id="settings" isDisabled>
          Disabled
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
