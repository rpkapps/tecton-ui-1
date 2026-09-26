"use client"

import * as React from "react"
import { cn } from "cn"
import { LayersIcon, MoreVerticalIcon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"
import {
  PanelActions,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

type AgentPanelHeaderProps = React.ComponentProps<typeof PanelHeader> & {
  title?: string
  onClose?: (() => void) | undefined
  onClear?: () => void
}

function AgentPanelHeader({
  className,
  title = "AI Agent",
  onClose,
  onClear,
  ...props
}: AgentPanelHeaderProps) {
  return (
    <PanelHeader
      data-slot="agent-panel-header"
      className={cn("gap-2", className)}
      {...props}
    >
      <LayersIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <PanelTitle>{title}</PanelTitle>
      <PanelActions>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="More options"
              />
            }
          >
            <MoreVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClear}>
              New conversation
            </DropdownMenuItem>
            <DropdownMenuItem>Export transcript</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onClear}>
              Clear history
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close panel"
                onClick={onClose}
              />
            }
          >
            <XIcon />
          </TooltipTrigger>
          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </PanelActions>
    </PanelHeader>
  )
}

export { AgentPanelHeader }
export type { AgentPanelHeaderProps }
