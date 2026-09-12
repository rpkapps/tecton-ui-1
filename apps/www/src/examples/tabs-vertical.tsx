// Synced from shadcn/ui (apps/v4/examples/aria/tabs-vertical.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsVertical() {
  return (
    <Tabs defaultSelectedKey="account" orientation="vertical">
      <TabsList>
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
        <TabsTrigger id="notifications">Notifications</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
