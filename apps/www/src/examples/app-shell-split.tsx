import { HexagonIcon } from "lucide-react"

import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
} from "@tecton/react/tecton/app-shell"
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

export default function AppShellSplitExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellSplit>
          <AppShellSplitPanel minSize="40%">
            <AppShellMain className="p-4 text-sm text-muted-foreground">
              Drag the divider to resize the aside.
            </AppShellMain>
          </AppShellSplitPanel>
          <AppShellSplitHandle />
          <AppShellSplitPanel defaultSize="240px" minSize="160px" maxSize="60%">
            <AppShellAside className="h-full w-full border-s-0">
              <Panel className="h-full rounded-none border-0">
                <PanelHeader>
                  <PanelTitle>Properties</PanelTitle>
                </PanelHeader>
                <PanelContent className="text-sm text-muted-foreground">
                  Tool panel content
                </PanelContent>
              </Panel>
            </AppShellAside>
          </AppShellSplitPanel>
        </AppShellSplit>
      </AppShellBody>
    </AppShell>
  )
}
