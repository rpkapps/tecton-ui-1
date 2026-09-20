import { SettingsIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

export default function PanelDemo() {
  return (
    <Panel className="w-full max-w-sm">
      <PanelHeader>
        <PanelTitle>Well properties</PanelTitle>
        <PanelActions>
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <SettingsIcon />
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="text-sm text-muted-foreground">
        34/10-A-12 · Gullfaks · TD 3 250 m
      </PanelContent>
    </Panel>
  )
}
