import { HexagonIcon, SettingsIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  AppShell,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellHeaderActions,
  AppShellMain,
  AppShellNav,
  AppShellSidebar,
} from "@tecton/react/tecton/app-shell"
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function AppShellSidebarExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
        <AppShellNav>
          <Button variant="ghost" size="sm">
            Wells
          </Button>
          <Button variant="ghost" size="sm">
            FDA
          </Button>
        </AppShellNav>
        <AppShellHeaderActions>
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <SettingsIcon />
          </Button>
        </AppShellHeaderActions>
      </AppShellHeader>
      <AppShellBody>
        <AppShellSidebar className="w-48 p-2">
          <TreeView aria-label="Project" defaultExpandedKeys={["wells"]}>
            <TreeViewItem id="wells" textValue="Wells">
              <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
              <TreeViewItem id="a12" textValue="34/10-A-12">
                <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
              </TreeViewItem>
            </TreeViewItem>
            <TreeViewItem id="horizons" textValue="Horizons">
              <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
            </TreeViewItem>
          </TreeView>
        </AppShellSidebar>
        <AppShellMain className="p-4 text-sm text-muted-foreground">
          Map view
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  )
}
