// Synced from shadcn/ui (apps/v4/examples/aria/button-group-input-group.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { AddIcon, GraphicEqIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export default function ButtonGroupInputGroup() {
  const [voiceEnabled, setVoiceEnabled] = React.useState(false)

  return (
    <ButtonGroup className="[--radius:9999rem]">
      <ButtonGroup>
        <Button variant="outline" size="icon">
          <AddIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <InputGroup>
          <InputGroupInput
            placeholder={
              voiceEnabled ? "Record and send audio..." : "Send a message..."
            }
            disabled={voiceEnabled}
          />
          <InputGroupAddon align="inline-end">
            <TooltipTrigger>
              <InputGroupButton
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                size="icon-xs"
                data-active={voiceEnabled}
                className="data-[active=true]:bg-saffron-120 data-[active=true]:text-saffron-830"
                aria-pressed={voiceEnabled}
              >
                <GraphicEqIcon />
              </InputGroupButton>
              <Tooltip>Voice Mode</Tooltip>
            </TooltipTrigger>
          </InputGroupAddon>
        </InputGroup>
      </ButtonGroup>
    </ButtonGroup>
  )
}
