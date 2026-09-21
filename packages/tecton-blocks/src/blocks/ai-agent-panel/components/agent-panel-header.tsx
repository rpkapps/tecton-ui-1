"use client"

import * as React from "react"
import { cn } from "cn"
import { CloseIcon, LayersIcon, MoreVertIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
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
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon-sm" aria-label="More options">
            <MoreVertIcon />
          </Button>
          <DropdownMenu placement="bottom end">
            <DropdownMenuItem
              {...(onClear === undefined ? {} : { onAction: onClear })}
            >
              New conversation
            </DropdownMenuItem>
            <DropdownMenuItem>Export transcript</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              {...(onClear === undefined ? {} : { onAction: onClear })}
            >
              Clear history
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close panel"
            {...(onClose === undefined ? {} : { onPress: onClose })}
          >
            <CloseIcon />
          </Button>
          <Tooltip>Close</Tooltip>
        </TooltipTrigger>
      </PanelActions>
    </PanelHeader>
  )
}

export { AgentPanelHeader }
export type { AgentPanelHeaderProps }
