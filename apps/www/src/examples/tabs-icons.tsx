// Synced from shadcn/ui (apps/v4/examples/aria/tabs-icons.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CodeIcon, WebAssetIcon } from "@tecton/react/icons"

import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsIcons() {
  return (
    <Tabs defaultSelectedKey="preview">
      <TabsList>
        <TabsTrigger id="preview">
          <WebAssetIcon />
          Preview
        </TabsTrigger>
        <TabsTrigger id="code">
          <CodeIcon />
          Code
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
