import { HexagonIcon } from "@tecton/react/icons"

import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function AppShellAsideExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellMain className="p-4 text-sm text-muted-foreground">
          Seismic section
        </AppShellMain>
        <AppShellAside className="w-64 gap-2 p-2">
          <Panel variant="flat" size="sm">
            <PanelHeader>
              <PanelTitle>Selected well</PanelTitle>
            </PanelHeader>
            <PanelContent className="flex gap-6">
              <Stat size="sm">
                <StatLabel>TD</StatLabel>
                <StatValue unit="m">3 250</StatValue>
              </Stat>
              <Stat size="sm">
                <StatLabel>Picks</StatLabel>
                <StatValue>12</StatValue>
              </Stat>
            </PanelContent>
          </Panel>
        </AppShellAside>
      </AppShellBody>
    </AppShell>
  )
}
