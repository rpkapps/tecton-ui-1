"use client"

import {
  DownloadIcon,
  EllipsisIcon,
  MaximizeIcon,
  PinIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShareIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  OverflowItem,
  OverflowMenu,
  Toolbar,
} from "@tecton/react/tecton/overflow"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

const actions = [
  { id: "refresh", label: "Refresh", icon: RefreshCwIcon, priority: 2 },
  { id: "pin", label: "Pin", icon: PinIcon, priority: 1 },
  { id: "share", label: "Share", icon: ShareIcon },
  { id: "export", label: "Export", icon: DownloadIcon },
  { id: "maximize", label: "Maximize", icon: MaximizeIcon },
]

export default function PanelActionsExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {/* Drag the corner: the icons move into the More menu, lowest priority first. */}
      <div className="min-w-48 resize-x overflow-hidden">
        <Panel>
          <PanelHeader>
            <PanelTitle>Production forecast</PanelTitle>
            <PanelActions>
              {/* Icon-only actions: labels="never" gives every button its tooltip.
                  A custom More trigger keeps the panel's small button size. */}
              <Toolbar
                aria-label="Panel actions"
                labels="never"
                menu={false}
                className="gap-1"
              >
                {actions.map(({ id, label, icon: Icon, priority }) => (
                  <OverflowItem
                    key={id}
                    id={id}
                    label={label}
                    icon={<Icon />}
                    priority={priority}
                  >
                    <Button variant="ghost" size="icon-sm" aria-label={label}>
                      <Icon />
                    </Button>
                  </OverflowItem>
                ))}
                {/* Unwrapped: settings never leaves the header. */}
                <Button variant="ghost" size="icon-sm" aria-label="Settings">
                  <SettingsIcon />
                </Button>
                <OverflowMenu
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More actions"
                    >
                      <EllipsisIcon />
                    </Button>
                  }
                />
              </Toolbar>
            </PanelActions>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">
            34/10-A-12 · 1 240 bbl/d · updated 5 min ago
          </PanelContent>
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
