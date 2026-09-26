// Synced from shadcn/ui (apps/v4/examples/base/tabs-vertical.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsVertical() {
  return (
    <Tabs defaultValue="account" orientation="vertical">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
